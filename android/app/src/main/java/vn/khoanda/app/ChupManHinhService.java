package vn.khoanda.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.WindowManager;
import android.widget.Toast;

import java.nio.ByteBuffer;

/**
 * Chụp ĐÚNG MỘT KHUNG HÌNH rồi tắt hẳn. Xem `ChupManHinh` — bốn ràng buộc nằm ở đó.
 *
 * ⚠️ ANDROID 10+ ĐÒI `startForeground()` VỚI LOẠI `mediaProjection` TRƯỚC KHI LẤY `MediaProjection`;
 * Android 14 còn đòi đăng ký `Callback` trước khi tạo màn hình ảo. Thiếu một trong hai là
 * `SecurityException` / `IllegalStateException` — hỏng ngay lượt đầu, trên đúng những máy mới nhất.
 *
 * ⚠️ ĐỢI ~0,6 GIÂY RỒI MỚI LẤY ẢNH. Lúc này hộp xác nhận của hệ thống vừa biến mất; lấy sớm thì ảnh
 * là chính cái hộp đó chứ không phải tin nhắn bác đang xem.
 */
public class ChupManHinhService extends Service {

    static final String KHOA_MA = "ma";
    static final String KHOA_DU = "du";

    private static final String KENH = "khoanda_chup_man_hinh_v1";
    private static final int MA_THONG_BAO = 3102;
    private static final long DOI_DAU_MS = 600;
    private static final long CACH_LAN_MS = 300;
    private static final int SO_LAN_TOI_DA = 12;        // ≈ 4 giây rồi bỏ cuộc

    private final Handler luong = new Handler(Looper.getMainLooper());
    private MediaProjection chieu;
    private VirtualDisplay manAo;
    private ImageReader docAnh;
    private int rong, cao;
    private int solan = 0;
    private boolean xong = false;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }
        try {
            taoKenh();
            Notification tb = thongBao();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(MA_THONG_BAO, tb, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
            } else {
                startForeground(MA_THONG_BAO, tb);
            }

            int ma = intent.getIntExtra(KHOA_MA, 0);
            Intent du = intent.getParcelableExtra(KHOA_DU);
            if (du == null) { thatBai(); return START_NOT_STICKY; }

            MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            chieu = mpm.getMediaProjection(ma, du);
            if (chieu == null) { thatBai(); return START_NOT_STICKY; }
            // Android 14: bắt buộc đăng ký trước khi tạo màn hình ảo.
            chieu.registerCallback(new MediaProjection.Callback() {
                @Override public void onStop() { /* bác hoặc hệ thống dừng chia sẻ — không còn gì để chụp */ }
            }, luong);

            DisplayMetrics dm = new DisplayMetrics();
            ((WindowManager) getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getRealMetrics(dm);
            // Thu nhỏ ngay từ màn hình ảo: đỡ bộ nhớ, và đúng cỡ OCR cần (cạnh dài ≤ 1600).
            float he = Math.min(1f, (float) ChupManHinh.CANH_TOI_DA / Math.max(dm.widthPixels, dm.heightPixels));
            rong = Math.max(1, Math.round(dm.widthPixels * he));
            cao = Math.max(1, Math.round(dm.heightPixels * he));

            docAnh = ImageReader.newInstance(rong, cao, PixelFormat.RGBA_8888, 2);
            manAo = chieu.createVirtualDisplay("khoanda-chup", rong, cao, dm.densityDpi,
                    DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, docAnh.getSurface(), null, luong);

            luong.postDelayed(layAnh, DOI_DAU_MS);
        } catch (Throwable t) {
            android.util.Log.e("KhoanDa", "chup man hinh hong", t);
            thatBai();
        }
        return START_NOT_STICKY;
    }

    private final Runnable layAnh = new Runnable() {
        @Override public void run() {
            if (xong) return;
            Image anh = null;
            try {
                anh = docAnh == null ? null : docAnh.acquireLatestImage();
                if (anh != null) {
                    String uri = chuyen(anh);
                    anh.close();
                    anh = null;
                    if (uri == null) { thatBai(); return; }
                    ChupManHinh.giu(uri);
                    dung();
                    ChupManHinh.moAppVoiAnh(ChupManHinhService.this);
                    return;
                }
            } catch (Throwable t) {
                android.util.Log.e("KhoanDa", "khong doc duoc anh chup", t);
                if (anh != null) try { anh.close(); } catch (Throwable ignored) { }
                thatBai();
                return;
            }
            solan++;
            if (solan >= SO_LAN_TOI_DA) { thatBai(); return; }
            luong.postDelayed(this, CACH_LAN_MS);
        }
    };

    /** Image (RGBA, có đệm cuối dòng) → data URI JPEG. */
    private String chuyen(Image anh) {
        Image.Plane mp = anh.getPlanes()[0];
        ByteBuffer b = mp.getBuffer();
        int buocDiem = mp.getPixelStride();
        int dem = mp.getRowStride() - buocDiem * rong;
        Bitmap lon = Bitmap.createBitmap(rong + dem / buocDiem, cao, Bitmap.Config.ARGB_8888);
        lon.copyPixelsFromBuffer(b);
        Bitmap gon = Bitmap.createBitmap(lon, 0, 0, rong, cao);
        if (gon != lon) lon.recycle();
        String kq = ChupManHinh.thanhDataUri(gon);
        gon.recycle();
        return kq;
    }

    /** Tắt hẳn: nhả màn hình ảo, dừng chia sẻ, dừng service. Gọi cả lúc thành công lẫn thất bại. */
    private void dung() {
        xong = true;
        luong.removeCallbacksAndMessages(null);
        try { if (manAo != null) manAo.release(); } catch (Throwable ignored) { }
        try { if (docAnh != null) docAnh.close(); } catch (Throwable ignored) { }
        try { if (chieu != null) chieu.stop(); } catch (Throwable ignored) { }
        manAo = null; docAnh = null; chieu = null;
        try { stopForeground(true); } catch (Throwable ignored) { }
        stopSelf();
    }

    private void thatBai() {
        dung();
        noiLoi(this);
    }

    /** §4.3 — không chụp được thì NÓI, đừng mở app với ảnh rỗng. */
    static void noiLoi(final Context ctx) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override public void run() {
                try { Toast.makeText(ctx.getApplicationContext(), R.string.chup_loi, Toast.LENGTH_LONG).show(); }
                catch (Throwable ignored) { }
            }
        });
    }

    @Override
    public void onDestroy() {
        if (!xong) dung();
        super.onDestroy();
    }

    private void taoKenh() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel k = new NotificationChannel(
                KENH, getString(R.string.chup_kenh), NotificationManager.IMPORTANCE_LOW);
        k.setShowBadge(false);
        nm.createNotificationChannel(k);
    }

    private Notification thongBao() {
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, KENH) : new Notification.Builder(this);
        return b.setSmallIcon(R.drawable.loi_tat_goi)
                .setContentTitle(getString(R.string.chup_tieu_de))
                .setContentText(getString(R.string.chup_noi_dung))
                .setOngoing(true)
                .build();
    }
}
