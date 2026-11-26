package vn.khoanda.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * LOCAL DNS-ONLY VPN (chạy 100% cục bộ trên máy).
 *
 * ══════════ RÀNG BUỘC RIÊNG TƯ & CHÍNH SÁCH ══════════
 * - Chỉ định tuyến duy nhất IP DNS ảo (`10.111.222.2/32`), KHÔNG định tuyến toàn bộ lưu lượng
 *   (`0.0.0.0/0`). Mọi kết nối HTTPS/app khác đi thẳng qua mạng bình thường của người dùng.
 * - Chỉ đối chiếu tên miền DNS với `BoLocTenMien` (Tầng 0 offline) ngay trên máy.
 * - Nếu tên miền nằm trong danh sách chặn cục bộ: trả về DNS `NXDOMAIN` ngay tại máy và hiện
 *   thông báo cảnh báo cục bộ (không ghi log tên miền ra đĩa, không gửi lên máy chủ).
 * - Nếu tên miền hợp lệ: chuyển tiếp duy nhất gói UDP truy vấn DNS qua socket được `protect()`
 *   tới DNS chuẩn (`1.1.1.1` / `8.8.8.8`) rồi trả kết quả về TUN.
 */
public class VpnLocDns extends VpnService {

    static final String HANH_DONG_BAT = "vn.khoanda.app.VPN_DNS_BAT";
    static final String HANH_DONG_TAT = "vn.khoanda.app.VPN_DNS_TAT";

    private static final String KENH = "khoanda_vpn_dns_v1";
    private static final int MA_THONG_BAO = 3201;
    private static final String DIA_CHI_TUN = "10.111.222.1";
    private static final String DIA_CHI_DNS_AO = "10.111.222.2";
    private static final String DNS_NGOAI_1 = "1.1.1.1";
    private static final String DNS_NGOAI_2 = "8.8.8.8";

    public static final AtomicBoolean dangChay = new AtomicBoolean(false);
    public static final AtomicInteger soTenMienDaChan = new AtomicInteger(0);

    private ParcelFileDescriptor tunFd;
    private Thread luongVpn;
    private ExecutorService xuLyGoiPool;
    private final AtomicLong lanBaoChanCuoi = new AtomicLong(0L);
    private volatile boolean chay = false;

    public static boolean daCapQuyen(Context ctx) {
        try {
            return VpnService.prepare(ctx) == null;
        } catch (Throwable t) {
            return false;
        }
    }

    public static void bat(Context ctx) {
        Intent i = new Intent(ctx, VpnLocDns.class).setAction(HANH_DONG_BAT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    public static void tat(Context ctx) {
        try {
            ctx.startService(new Intent(ctx, VpnLocDns.class).setAction(HANH_DONG_TAT));
        } catch (Throwable t) {
            try { ctx.stopService(new Intent(ctx, VpnLocDns.class)); } catch (Throwable ignored) { }
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? HANH_DONG_BAT : intent.getAction();
        if (HANH_DONG_TAT.equals(action)) {
            dungHan();
            return START_NOT_STICKY;
        }
        khoiDongVpn();
        return START_STICKY;
    }

    private void khoiDongVpn() {
        if (chay && tunFd != null) return;
        try {
            taoKenh();
            startForeground(MA_THONG_BAO, thongBaoThuongTruc());

            Builder b = new Builder();
            b.setSession("Khoan Đã DNS");
            b.addAddress(DIA_CHI_TUN, 32);
            b.addDnsServer(DIA_CHI_DNS_AO);
            b.addRoute(DIA_CHI_DNS_AO, 32);
            b.setMtu(1500);
            try { b.addDisallowedApplication(getPackageName()); } catch (Throwable ignored) { }

            tunFd = b.establish();
            if (tunFd == null) {
                dungHan();
                return;
            }
            chay = true;
            dangChay.set(true);
            xuLyGoiPool = Executors.newFixedThreadPool(4);
            luongVpn = new Thread(this::vongLapTun, "khoanda-dns-vpn");
            luongVpn.start();
        } catch (Throwable t) {
            dungHan();
        }
    }

    private void vongLapTun() {
        byte[] buf = new byte[4096];
        try (FileInputStream in = new FileInputStream(tunFd.getFileDescriptor());
             FileOutputStream out = new FileOutputStream(tunFd.getFileDescriptor())) {
            while (chay && !Thread.currentThread().isInterrupted()) {
                int len = in.read(buf);
                if (len <= 0) {
                    if (len < 0) break;
                    continue;
                }
                final byte[] goi = Arrays.copyOf(buf, len);
                ExecutorService pool = xuLyGoiPool;
                if (pool != null && !pool.isShutdown()) {
                    pool.execute(() -> xuLyGoiIp(goi, goi.length, out));
                } else {
                    xuLyGoiIp(goi, goi.length, out);
                }
            }
        } catch (Throwable ignored) {
            // TUN đóng hoặc service dừng
        } finally {
            dangChay.set(false);
        }
    }

    private void xuLyGoiIp(byte[] pkt, int len, FileOutputStream out) {
        if (len < 28) return;
        int version = (pkt[0] >> 4) & 0x0F;
        if (version != 4) return;
        int ihl = (pkt[0] & 0x0F) * 4;
        if (ihl < 20 || len < ihl + 8) return;
        int proto = pkt[9] & 0xFF;
        if (proto != 17) return; // chỉ UDP

        int srcPort = ((pkt[ihl] & 0xFF) << 8) | (pkt[ihl + 1] & 0xFF);
        int dstPort = ((pkt[ihl + 2] & 0xFF) << 8) | (pkt[ihl + 3] & 0xFF);
        if (dstPort != 53) return; // chỉ DNS

        int dnsOffset = ihl + 8;
        int dnsLen = len - dnsOffset;
        if (dnsLen < 12) return;

        String qname = docTenMienDns(pkt, dnsOffset, dnsLen);
        byte[] dnsResp;
        if (qname != null && BoLocTenMien.nenChan(qname)) {
            soTenMienDaChan.incrementAndGet();
            dnsResp = taoPhanHoiNxDomain(pkt, dnsOffset, dnsLen);
            baoChanTenMien();
        } else {
            dnsResp = chuyenTiepDns(pkt, dnsOffset, dnsLen);
        }
        if (dnsResp == null || dnsResp.length == 0) return;

        byte[] ipResp = dongGoiIpUdp(pkt, ihl, srcPort, dstPort, dnsResp);
        if (ipResp != null) {
            try {
                synchronized (out) {
                    out.write(ipResp);
                }
            } catch (Throwable ignored) { }
        }
    }

    private void baoChanTenMien() {
        long bayGio = System.currentTimeMillis();
        long truoc = lanBaoChanCuoi.get();
        if (bayGio - truoc < 10_000L || !lanBaoChanCuoi.compareAndSet(truoc, bayGio)) return;
        try {
            ThongBaoCanhBao.hien(this,
                    getString(R.string.vpn_chan_tieu_de),
                    getString(R.string.vpn_chan_noi_dung),
                    ThongBaoCanhBao.DICH_KIEM_TIN);
        } catch (Throwable ignored) { }
    }

    /** Đọc QNAME trong gói DNS (hỗ trợ nhãn chuẩn không nén ở question đầu tiên). */
    static String docTenMienDns(byte[] buf, int offset, int dnsLen) {
        int qdCount = ((buf[offset + 4] & 0xFF) << 8) | (buf[offset + 5] & 0xFF);
        if (qdCount <= 0) return null;
        int pos = offset + 12;
        int end = offset + dnsLen;
        StringBuilder sb = new StringBuilder();
        while (pos < end) {
            int l = buf[pos++] & 0xFF;
            if (l == 0) break;
            if ((l & 0xC0) != 0 || pos + l > end) return null;
            if (sb.length() > 0) sb.append('.');
            for (int i = 0; i < l; i++) {
                sb.append((char) (buf[pos + i] & 0xFF));
            }
            pos += l;
        }
        return sb.length() == 0 ? null : sb.toString();
    }

    /** Tạo gói DNS NXDOMAIN (RCODE = 3) cục bộ. */
    static byte[] taoPhanHoiNxDomain(byte[] req, int offset, int dnsLen) {
        byte[] resp = new byte[dnsLen];
        System.arraycopy(req, offset, resp, 0, dnsLen);
        resp[2] = (byte) ((req[offset + 2] & 0x01) | 0x81); // QR=1, RD giữ nguyên
        resp[3] = (byte) 0x83; // RA=1, RCODE=3 (NXDOMAIN)
        resp[6] = 0; resp[7] = 0; // ANCOUNT = 0
        resp[8] = 0; resp[9] = 0; // NSCOUNT = 0
        resp[10] = 0; resp[11] = 0; // ARCOUNT = 0
        return resp;
    }

    private byte[] chuyenTiepDns(byte[] req, int offset, int dnsLen) {
        byte[] query = new byte[dnsLen];
        System.arraycopy(req, offset, query, 0, dnsLen);
        for (String dnsServer : new String[] { DNS_NGOAI_1, DNS_NGOAI_2 }) {
            try (DatagramSocket sock = new DatagramSocket()) {
                if (!protect(sock)) continue;
                sock.setSoTimeout(3000);
                InetAddress addr = InetAddress.getByName(dnsServer);
                sock.send(new DatagramPacket(query, query.length, addr, 53));
                byte[] buf = new byte[2048];
                DatagramPacket respPkt = new DatagramPacket(buf, buf.length);
                sock.receive(respPkt);
                byte[] out = new byte[respPkt.getLength()];
                System.arraycopy(buf, 0, out, 0, out.length);
                return out;
            } catch (Throwable ignored) {
                // thử DNS dự phòng
            }
        }
        return null;
    }

    private static byte[] dongGoiIpUdp(byte[] reqIp, int reqIhl, int clientPort, int dnsPort, byte[] dnsPayload) {
        int ipHeaderLen = 20;
        int udpLen = 8 + dnsPayload.length;
        int totalLen = ipHeaderLen + udpLen;
        byte[] out = new byte[totalLen];

        // IPv4 header
        out[0] = 0x45; // v4, IHL=5 (20 bytes)
        out[1] = 0x00;
        out[2] = (byte) ((totalLen >> 8) & 0xFF);
        out[3] = (byte) (totalLen & 0xFF);
        out[4] = 0; out[5] = 0;
        out[6] = 0x40; out[7] = 0x00; // DF
        out[8] = 64; // TTL
        out[9] = 17; // UDP
        // Đảo IP nguồn <-> đích
        System.arraycopy(reqIp, 16, out, 12, 4);
        System.arraycopy(reqIp, 12, out, 16, 4);

        // IPv4 checksum
        int sum = 0;
        for (int i = 0; i < ipHeaderLen; i += 2) {
            sum += ((out[i] & 0xFF) << 8) | (out[i + 1] & 0xFF);
        }
        while ((sum >> 16) != 0) sum = (sum & 0xFFFF) + (sum >> 16);
        int csum = (~sum) & 0xFFFF;
        out[10] = (byte) ((csum >> 8) & 0xFF);
        out[11] = (byte) (csum & 0xFF);

        // UDP header
        out[20] = (byte) ((dnsPort >> 8) & 0xFF);
        out[21] = (byte) (dnsPort & 0xFF);
        out[22] = (byte) ((clientPort >> 8) & 0xFF);
        out[23] = (byte) (clientPort & 0xFF);
        out[24] = (byte) ((udpLen >> 8) & 0xFF);
        out[25] = (byte) (udpLen & 0xFF);
        out[26] = 0; out[27] = 0; // UDP checksum 0 hợp lệ với IPv4

        System.arraycopy(dnsPayload, 0, out, 28, dnsPayload.length);
        return out;
    }

    private void dungHan() {
        chay = false;
        dangChay.set(false);
        if (xuLyGoiPool != null) {
            xuLyGoiPool.shutdownNow();
            xuLyGoiPool = null;
        }
        if (luongVpn != null) {
            luongVpn.interrupt();
            luongVpn = null;
        }
        if (tunFd != null) {
            try { tunFd.close(); } catch (Throwable ignored) { }
            tunFd = null;
        }
        try { stopForeground(true); } catch (Throwable ignored) { }
        stopSelf();
    }

    @Override
    public void onRevoke() {
        dungHan();
        super.onRevoke();
    }

    @Override
    public void onDestroy() {
        dungHan();
        super.onDestroy();
    }

    private void taoKenh() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel k = new NotificationChannel(
                KENH, getString(R.string.vpn_kenh), NotificationManager.IMPORTANCE_LOW);
        k.setShowBadge(false);
        nm.createNotificationChannel(k);
    }

    private Notification thongBaoThuongTruc() {
        Intent mo = new Intent(Intent.ACTION_VIEW,
                Uri.parse("khoanda://loi-tat/cai-dat"), this, MainActivity.class);
        mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 5, mo,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, KENH) : new Notification.Builder(this);
        return b.setSmallIcon(R.drawable.loi_tat_tin_nhan)
                .setContentTitle(getString(R.string.vpn_thuong_truc_tieu_de))
                .setContentText(getString(R.string.vpn_thuong_truc_noi_dung))
                .setOngoing(true)
                .setShowWhen(false)
                .setContentIntent(pi)
                .build();
    }
}
