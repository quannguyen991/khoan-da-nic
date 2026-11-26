package vn.khoanda.app;

import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.nfc.NfcAdapter;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;

import java.util.Arrays;
import java.util.List;

/**
 * TRỢ LÝ NGÂN HÀNG TRONG CUỘC GỌI (F3) & KIỂM TRA NFC (F1) — dùng `UsageStatsManager`, KHÔNG dùng `AccessibilityService`.
 *
 * ══════════ RÀNG BUỘC RIÊNG TƯ & CHÍNH SÁCH ══════════
 * - KHÔNG dùng `AccessibilityService` để đọc màn hình app khác.
 * - KHÔNG gửi tên gói hay danh sách app ra khỏi thiết bị (§6.9).
 * - Chỉ kiểm tra xem người dùng có vừa mở app ngân hàng / Cài đặt / Trình cài gói:
 *   1) trong lúc đang có cuộc gọi (hoặc vừa gác máy ≤ 2 phút), hoặc
 *   2) ngay sau khi nhận thông báo chat/SMS có tín hiệu chuyển tiền / STK / link ngoài (≤ 90 giây).
 * - Nếu người dùng chưa cấp quyền Usage Access (`PACKAGE_USAGE_STATS`), mọi hàm trả về `false`/`khong_ro`, không tự bật.
 */
public final class GiamSatUngDung {

    static final long CUA_SO_CHAT_SANG_NGAN_HANG_MS = 90_000L;

    private static final List<String> GOI_CAI_DAT = Arrays.asList(
            "com.android.settings",
            "com.samsung.android.settings",
            "com.miui.securitycenter",
            "com.coloros.safecenter"
    );

    private static final List<String> GOI_TRINH_CAI = Arrays.asList(
            "com.android.packageinstaller",
            "com.google.android.packageinstaller",
            "com.miui.packageinstaller",
            "com.samsung.android.packageinstaller",
            "com.oplus.packageinstaller"
    );

    private GiamSatUngDung() { }

    /** Kiểm tra quyền Usage Access (`PACKAGE_USAGE_STATS`). Người dùng phải tự bật trong Cài đặt. */
    public static boolean daBatQuyen(Context ctx) {
        try {
            AppOpsManager aom = (AppOpsManager) ctx.getSystemService(Context.APP_OPS_SERVICE);
            if (aom == null) return false;
            int mode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
                    ? aom.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.getPackageName())
                    : aom.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), ctx.getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Throwable t) {
            return false;
        }
    }

    /** Mở màn Cài đặt Usage Access của hệ thống. */
    public static Intent manCaiDat() {
        return new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    /** F1 — Kiểm tra trạng thái NFC của thiết bị (không cần quyền nhạy cảm). */
    public static boolean[] kiemTraNfc(Context ctx) {
        try {
            NfcAdapter nfc = NfcAdapter.getDefaultAdapter(ctx);
            if (nfc == null) return new boolean[] { false, false };
            return new boolean[] { true, nfc.isEnabled() };
        } catch (Throwable t) {
            return new boolean[] { false, false };
        }
    }

    /** Phân loại gói thuần cục bộ. */
    static String phanLoaiGoi(String pkg) {
        if (pkg == null || pkg.isEmpty()) return "khac";
        if (DocThongBao.GOI_NGAN_HANG.contains(pkg)) return "ngan_hang";
        if (GOI_CAI_DAT.contains(pkg)) return "cai_dat";
        if (GOI_TRINH_CAI.contains(pkg)) return "trinh_cai_goi";
        return "khac";
    }

    /** Đọc tên gói ứng dụng đang ở tiền cảnh trong 10 giây gần nhất (cần `PACKAGE_USAGE_STATS`). */
    public static String docGoiDangMo(Context ctx) {
        if (!daBatQuyen(ctx)) return null;
        try {
            UsageStatsManager usm = (UsageStatsManager) ctx.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;
            long now = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(now - 60_000L, now);
            if (events == null) return null;

            String lastPkg = null;
            long lastTs = 0L;
            UsageEvents.Event ev = new UsageEvents.Event();
            while (events.hasNextEvent()) {
                events.getNextEvent(ev);
                int type = ev.getEventType();
                boolean laMo = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && type == UsageEvents.Event.ACTIVITY_RESUMED)
                        || type == UsageEvents.Event.MOVE_TO_FOREGROUND;
                if (laMo && ev.getTimeStamp() >= lastTs) {
                    lastTs = ev.getTimeStamp();
                    lastPkg = ev.getPackageName();
                }
            }
            return lastPkg;
        } catch (Throwable t) {
            return null;
        }
    }

    /**
     * Nhịp kiểm tra cục bộ (được gọi từ `TheoDoiCuocGoi` khi service đang chạy).
     * Chỉ bật màn nhắc nhở điều kiện khi có tổ hợp rủi ro — không lưu, không gửi dữ liệu ra ngoài.
     */
    public static void kiemTraNhip(Context ctx) {
        if (!daBatQuyen(ctx)) return;
        String pkg = docGoiDangMo(ctx);
        if (pkg == null || ctx.getPackageName().equals(pkg)) return;

        String loai = phanLoaiGoi(pkg);
        long now = System.currentTimeMillis();
        boolean dangGoi = CuocGoi.dangHoacVuaGoi(ctx, now);

        if ("ngan_hang".equals(loai) && dangGoi) {
            CuocGoi.batManCanhBao(ctx, "mo-ngan-hang-trong-cuoc-goi",
                    R.string.tb_ngan_hang_cuoc_goi_tieu_de, R.string.tb_ngan_hang_cuoc_goi_noi_dung);
            return;
        }

        if (("cai_dat".equals(loai) || "trinh_cai_goi".equals(loai)) && dangGoi) {
            CuocGoi.batManCanhBao(ctx, "mo-cai-dat-trong-cuoc-goi",
                    R.string.tb_cai_dat_cuoc_goi_tieu_de, R.string.tb_cai_dat_cuoc_goi_noi_dung);
            return;
        }

        if ("ngan_hang".equals(loai)
                && DocThongBao.tinNhanTienStkGanDayLuc > 0L
                && (now - DocThongBao.tinNhanTienStkGanDayLuc) < CUA_SO_CHAT_SANG_NGAN_HANG_MS) {
            CuocGoi.batManCanhBao(ctx, "chuyen-tu-chat-sang-ngan-hang",
                    R.string.tb_chat_sang_ngan_hang_tieu_de, R.string.tb_chat_sang_ngan_hang_noi_dung);
        }
    }
}
