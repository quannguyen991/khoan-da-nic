package vn.khoanda.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;

/**
 * ══════════ BONG BÓNG NỔI — NÚT TẮT LUÔN NẰM TRÊN MÀN HÌNH ══════════
 *
 * Giống AssistiveTouch của iPhone, hoặc chat head của Messenger: một nút tròn mờ
 * nằm ở mép màn hình, kéo được, chạm vào là mở Khoan Đã.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI `PopupDeManHinh`. Hai thứ khác hẳn nhau và đã bị nhầm lẫn:
 *   · `PopupDeManHinh`  — dải ĐỎ, chỉ hiện khi bộ luật ra mức CAO, tự tắt.
 *   · `BongBongNoi`     — nút mờ, LUÔN có, không mang cảnh báo gì cả.
 * Gộp hai thứ vào một chữ "popup" là cách chúng bị nhầm.
 *
 * ⚠️ VÌ SAO PHẢI LÀ SERVICE, KHÔNG PHẢI MỘT CÁI DIV. Tầng web đã có
 * `FloatingQuickAccess` vẽ một quả bóng trong trang, và màn hình còn ghi "Khoan
 * Đã sẽ luôn hiện nổi sẵn sàng ở mép màn hình chính". Nhưng nó chết ngay khi bác
 * rời app — tức là nó KHÔNG BAO GIỜ có mặt vào đúng lúc nó hứa sẽ có mặt.
 * §11: khai một việc chưa xảy ra. Bong bóng thật phải sống bằng tiến trình, nên
 * nó là foreground service.
 *
 * ⚠️ PHẢI CÓ THÔNG BÁO THƯỜNG TRỰC — VÀ ĐÓ LÀ ĐIỀU TỐT. Android bắt foreground
 * service phải hiện một thông báo. Nghe như phiền, nhưng nó đúng: một thứ vẽ đè
 * lên mọi ứng dụng khác thì người dùng phải luôn thấy được nó đang chạy, và tắt
 * được ngay từ đó. Đây là quyền mà phần mềm độc hại dùng để vẽ đè lên màn hình
 * ngân hàng — app dùng nó thì phải để bác nhìn thấy mình.
 *
 * ⚠️ BONG BÓNG KHÔNG BAO GIỜ CHE KÍN, KHÔNG BAO GIỜ NUỐT CHẠM. Nó nhỏ, ở mép,
 * và mọi cú chạm ngoài nó đi thẳng xuống app bên dưới (`FLAG_NOT_FOCUSABLE` +
 * `FLAG_NOT_TOUCH_MODAL`). Bác đang dùng app khác thì không bị nó cản.
 */
public class BongBongNoi extends Service {

    private static final String KENH = "khoanda_bong_bong_v1";
    private static final int MA_THUONG_TRUC = 3101;

    /** Bật/tắt từ tầng web đọc lại được trạng thái thật, không đoán. */
    static boolean dangChay = false;

    private WindowManager wm;
    private View bong;
    private WindowManager.LayoutParams lp;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            taoKenh();
            startForeground(MA_THUONG_TRUC, thongBao());
            veBongBong();
            dangChay = true;
        } catch (Throwable t) {
            /*
             * §4.3 — không dựng được thì DỪNG HẲN, đừng để service sống mà không
             * có bong bóng nào. Một service chạy không làm gì là thứ tệ nhất:
             * công tắc trong app hiện "đang bật", màn hình trống trơn.
             */
            android.util.Log.e("KhoanDa", "khong dung duoc bong bong", t);
            dangChay = false;
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        try { if (wm != null && bong != null) wm.removeView(bong); } catch (Throwable ignored) { }
        bong = null;
        dangChay = false;
        super.onDestroy();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Bị hệ thống giết vì thiếu bộ nhớ thì dựng lại — bác đã bật thì nó phải có.
        return START_STICKY;
    }

    // ─────────────────────── Bong bóng ───────────────────────

    private void veBongBong() {
        wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);

        ImageView nut = new ImageView(this);
        nut.setImageResource(R.mipmap.ic_launcher_round);
        int co = (int) (56 * getResources().getDisplayMetrics().density);   // §4.4 — 56px
        int dem = (int) (10 * getResources().getDisplayMetrics().density);
        nut.setPadding(dem, dem, dem, dem);

        GradientDrawable nen = new GradientDrawable();
        nen.setShape(GradientDrawable.OVAL);
        nen.setColor(0xCC2E1065);          // tím đậm, hơi trong
        nen.setStroke((int) (2 * getResources().getDisplayMetrics().density), 0x66FFFFFF);
        nut.setBackground(nen);
        /*
         * ⚠️ MỜ VỪA PHẢI, KHÔNG MỜ HẲN. Người cao tuổi mắt kém; một quả bóng
         * alpha 0.3 là một vệt không ai nhìn ra. 0.85 đủ để không che khuất nội
         * dung bên dưới mà vẫn thấy rõ.
         */
        nut.setAlpha(0.85f);

        int loai = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        lp = new WindowManager.LayoutParams(co, co, loai,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = 0;
        lp.y = getResources().getDisplayMetrics().heightPixels / 3;

        nut.setOnTouchListener(new View.OnTouchListener() {
            private int x0, y0;
            private float mx, my;
            private boolean daKeo;

            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        x0 = lp.x; y0 = lp.y;
                        mx = e.getRawX(); my = e.getRawY();
                        daKeo = false;
                        return true;
                    case MotionEvent.ACTION_MOVE: {
                        int dx = (int) (e.getRawX() - mx);
                        int dy = (int) (e.getRawY() - my);
                        // Nhích vài pixel là run tay, không phải kéo. Ngưỡng để cú
                        // chạm của người tay run vẫn được tính là chạm.
                        if (Math.abs(dx) > 16 || Math.abs(dy) > 16) daKeo = true;
                        lp.x = x0 + dx;
                        lp.y = y0 + dy;
                        try { wm.updateViewLayout(bong, lp); } catch (Throwable ignored) { }
                        return true;
                    }
                    case MotionEvent.ACTION_UP:
                        if (!daKeo) moApp();
                        else hutVeMep();
                        return true;
                    default:
                        return false;
                }
            }
        });

        bong = nut;
        wm.addView(bong, lp);
    }

    /** Thả tay là nó tự nép về mép gần nhất — không nằm chắn giữa màn hình. */
    private void hutVeMep() {
        try {
            int rong = getResources().getDisplayMetrics().widthPixels;
            lp.x = (lp.x + bong.getWidth() / 2 < rong / 2) ? 0 : rong - bong.getWidth();
            wm.updateViewLayout(bong, lp);
        } catch (Throwable ignored) { }
    }

    private void moApp() {
        try {
            Intent i = getPackageManager().getLaunchIntentForPackage(getPackageName());
            if (i == null) return;
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(i);
        } catch (Throwable ignored) { }
    }

    // ─────────────────────── Thông báo bắt buộc ───────────────────────

    private void taoKenh() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel k = new NotificationChannel(
                KENH, getString(R.string.bong_bong_kenh), NotificationManager.IMPORTANCE_MIN);
        k.setShowBadge(false);
        nm.createNotificationChannel(k);
    }

    private Notification thongBao() {
        Intent mo = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = mo == null ? null : PendingIntent.getActivity(
                this, 0, mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, KENH) : new Notification.Builder(this);
        return b.setSmallIcon(R.drawable.loi_tat_goi)
                .setContentTitle(getString(R.string.bong_bong_tieu_de))
                .setContentText(getString(R.string.bong_bong_noi_dung))
                .setContentIntent(pi)
                .setOngoing(true)
                .build();
    }

    // ─────────────────────── Bật / tắt ───────────────────────

    /**
     * @return mã cho tầng web. Xem `PopupDeManHinh.hien` — cùng lý do: gộp mọi
     *         thất bại về `false` là vứt đúng thông tin cần để sửa.
     */
    static String bat(Context ctx) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
            return "chua_co_quyen";
        }
        try {
            Intent i = new Intent(ctx, BongBongNoi.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
            else ctx.startService(i);
            return "bat";
        } catch (Throwable t) {
            android.util.Log.e("KhoanDa", "khong bat duoc bong bong", t);
            return "rom_chan";
        }
    }

    static void tat(Context ctx) {
        try { ctx.stopService(new Intent(ctx, BongBongNoi.class)); } catch (Throwable ignored) { }
        dangChay = false;
    }
}
