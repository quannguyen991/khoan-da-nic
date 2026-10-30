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
        dongMenu();
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
                        if (!daKeo) moMenu();
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

    /*
     * ═════ CHẠM VÀO BONG BÓNG ⇒ MỞ MỘT MENU BA VIỆC ═════
     *
     * Bản đầu chỉ mở app. Nhưng mở app xong bác vẫn phải đi tìm việc cần làm —
     * tức bong bóng tiết kiệm được đúng một thao tác, còn ba thao tác sau vẫn
     * nguyên. Với người đang bị thúc chuyển tiền thì không đủ.
     *
     * Ba việc, không hơn. Đây là menu khẩn cấp, không phải màn hình chính:
     *   ① Kiểm tin nhắn vừa đến
     *   ② Gửi ảnh màn hình đi kiểm
     *   ③ Dừng 60 giây
     *
     * ⚠️ CHỤP MÀN HÌNH — ĐÃ ĐẢO CHIỀU 30/10/2026 THEO YÊU CẦU CỦA NGƯỜI DÙNG SẢN PHẨM. Trước đó
     * nút ② chỉ mở chỗ chọn ảnh, vì `MediaProjection` là quyền đọc được MỌI THỨ trên màn hình,
     * kể cả màn hình ngân hàng. Nay nút ② chụp một lần — nhưng chỉ khi bác chạm, có hộp xác
     * nhận của Android mỗi lần, một khung hình rồi tắt, không ghi ra đĩa. Xem `ChupManHinh`.
     * Máy không mở được thì nút rơi về chỗ chọn ảnh như cũ.
     *
     * ⚠️ LUÔN CÓ NÚT ĐÓNG (§4.6). Menu vẽ đè lên app khác; không đóng được là
     * biến một lối tắt thành một vật cản.
     */
    private View menu;

    private void moMenu() {
        if (menu != null) { dongMenu(); return; }
        try {
            android.widget.LinearLayout khung = new android.widget.LinearLayout(this);
            khung.setOrientation(android.widget.LinearLayout.VERTICAL);
            GradientDrawable nen = new GradientDrawable();
            nen.setCornerRadius(24 * getResources().getDisplayMetrics().density);
            nen.setColor(0xF22E1065);
            khung.setBackground(nen);
            int d = (int) (10 * getResources().getDisplayMetrics().density);
            khung.setPadding(d, d, d, d);

            khung.addView(nutMenu(getString(R.string.bb_kiem_tin), "khoanda://loi-tat/kiem-tin-nhan"));
            khung.addView(nutChup(getString(R.string.bb_chup_man_hinh)));
            khung.addView(nutMenu(getString(R.string.bb_dung_60s), "khoanda://loi-tat/dung-lai-60s"));

            android.widget.Button dong = new android.widget.Button(this);
            dong.setText(getString(R.string.bb_dong));
            dong.setTextSize(16);
            dong.setAllCaps(false);
            dong.setMinHeight((int) (52 * getResources().getDisplayMetrics().density));
            dong.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) { dongMenu(); }
            });
            khung.addView(dong);

            WindowManager.LayoutParams m = new WindowManager.LayoutParams(
                    (int) (260 * getResources().getDisplayMetrics().density),
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                            : WindowManager.LayoutParams.TYPE_PHONE,
                    // Menu CẦN nhận chạm, nhưng vẫn không được nuốt chạm ngoài nó.
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    PixelFormat.TRANSLUCENT);
            m.gravity = Gravity.CENTER;

            menu = khung;
            wm.addView(menu, m);
        } catch (Throwable t) {
            android.util.Log.e("KhoanDa", "khong mo duoc menu bong bong", t);
            menu = null;
            moApp();   // hỏng menu thì ít nhất vẫn vào được app
        }
    }

    private android.widget.Button nutMenu(String chu, final String dich) {
        android.widget.Button b = new android.widget.Button(this);
        b.setText(chu);
        b.setTextSize(17);              // §4.5 — chữ tiếng Việt cần chỗ
        b.setAllCaps(false);
        b.setMinHeight((int) (56 * getResources().getDisplayMetrics().density));   // §4.4
        b.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dongMenu(); moSau(dich); }
        });
        return b;
    }

    /**
     * ② CHỤP MÀN HÌNH ĐANG XEM — 30/10/2026. Đóng menu và ẩn chính bong bóng TRƯỚC khi chụp, để
     * ảnh là tin nhắn bác đang xem chứ không phải cái nút. Hộp xác nhận của Android hiện ra ngay
     * sau đó (`ChupManHinhActivity`). Máy không mở được thì rơi về chỗ chọn ảnh như trước.
     */
    private android.widget.Button nutChup(String chu) {
        android.widget.Button b = new android.widget.Button(this);
        b.setText(chu);
        b.setTextSize(17);
        b.setAllCaps(false);
        b.setMinHeight((int) (56 * getResources().getDisplayMetrics().density));
        b.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                dongMenu();
                final View goc = bong;
                if (goc == null || !ChupManHinh.duocHoTro()) { moSau("khoanda://loi-tat/quet-anh"); return; }
                goc.setVisibility(View.INVISIBLE);
                goc.postDelayed(new Runnable() {
                    @Override public void run() {
                        try {
                            Intent i = new Intent(BongBongNoi.this, ChupManHinhActivity.class);
                            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(i);
                        } catch (Throwable t) {
                            android.util.Log.e("KhoanDa", "khong mo duoc chup man hinh", t);
                            moSau("khoanda://loi-tat/quet-anh");
                        }
                    }
                }, 250);
                // Hiện lại sau khi chụp xong — bong bóng không được biến mất vĩnh viễn.
                goc.postDelayed(new Runnable() {
                    @Override public void run() { goc.setVisibility(View.VISIBLE); }
                }, 5000);
            }
        });
        return b;
    }

    private void dongMenu() {
        try { if (menu != null) wm.removeView(menu); } catch (Throwable ignored) { }
        menu = null;
    }

    private void moSau(String dich) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(dich),
                    this, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(i);
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
