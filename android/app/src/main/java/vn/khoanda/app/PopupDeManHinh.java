package vn.khoanda.app;

import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * POPUP ĐÈ LÊN MÀN HÌNH — hiện được khi bác đang ở app khác, kể cả đang nghe gọi.
 *
 * ══════════ VÌ SAO TÍNH NĂNG NÀY NGUY HIỂM NẾU LÀM ẨU ══════════
 *
 * ⚠️ `SYSTEM_ALERT_WINDOW` là quyền vẽ đè lên MỌI ứng dụng khác. Đúng thứ mà
 * phần mềm độc hại dùng để phủ lên app ngân hàng và ăn cắp thao tác. Google Play
 * soi rất kỹ, và người dùng phải tự bật trong Cài đặt hệ thống.
 *
 * ⚠️ NÊN Ở ĐÂY CÓ BA GIỚI HẠN TỰ ÁP, và đừng gỡ chúng:
 *
 *  ① KHÔNG NHẬN THAO TÁC NGOÀI HAI NÚT CỦA CHÍNH NÓ.
 *     Cửa sổ đặt `FLAG_NOT_TOUCH_MODAL` + `FLAG_WATCH_OUTSIDE_TOUCH` nên mọi
 *     chạm ra ngoài đi thẳng xuống app bên dưới. Nó KHÔNG che bàn phím, KHÔNG
 *     bắt phím, KHÔNG đọc gì của app khác.
 *
 *  ② KHÔNG BAO GIỜ PHỦ TOÀN MÀN HÌNH. Dải ngang ở MÉP TRÊN, cao vừa đủ đọc.
 *     Phủ toàn màn là chặn người dùng làm việc của họ — và với người đang hoảng
 *     thì đó là thêm một thứ nữa họ không thoát ra được.
 *
 *  ③ §4.6 — LUÔN CÓ LỐI RA. Nút "Tôi ổn" đóng popup ngay lập tức, và nó nằm
 *     cạnh nút chính chứ không giấu. Nếu bộ luật báo động giả mà bác không tắt
 *     được cái dải này, bác sẽ gỡ ứng dụng.
 *
 * ⚠️ §11 — CHỮ TRONG POPUP DO TẦNG WEB TRUYỀN XUỐNG, đã qua catalog i18n. Lớp
 * này KHÔNG tự soạn câu, KHÔNG mã cứng chữ tiếng Việt nào. Tham số `tieuDe` và
 * `nut` là bắt buộc; thiếu thì không hiện gì còn hơn hiện một câu bịa.
 *
 * ⚠️ CHƯA BIÊN DỊCH ĐƯỢC TRÊN MÁY DỰNG (không có JDK/Android SDK). Tệp này chưa
 * từng qua javac — mở bằng Android Studio và sửa lỗi biên dịch trước khi tin.
 */
public class PopupDeManHinh {

    private static View dangHien = null;

    /** Đã được cấp quyền vẽ đè chưa? */
    public static boolean daBatQuyen(Context ctx) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx);
    }

    /**
     * Mở màn Cài đặt để người dùng tự bật.
     * ⚠️ Không có cách nào tự cấp. Và không nên có.
     */
    public static Intent manCaiDat(Context ctx) {
        return new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + ctx.getPackageName()))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }

    /**
     * Hiện dải cảnh báo ở mép trên.
     *
     * @param tieuDe  chữ chính — tầng web truyền xuống, đã qua catalog i18n
     * @param nutMo   nhãn nút mở app
     * @param nutOn   nhãn nút "Tôi ổn" (§4.6 — BẮT BUỘC, không được null)
     */
    public static void hien(final Context ctx, String tieuDe, String nutMo, String nutOn) {
        if (!daBatQuyen(ctx)) return;
        // ⚠️ §11 — thiếu chữ thì KHÔNG hiện. Hiện một dải trống hoặc một câu mặc
        // định do lớp native bịa ra là phá luật "mọi chuỗi đến từ catalog".
        if (tieuDe == null || nutMo == null || nutOn == null) return;

        an(ctx);   // không chồng hai dải lên nhau

        LinearLayout khung = new LinearLayout(ctx);
        khung.setOrientation(LinearLayout.VERTICAL);
        khung.setBackgroundColor(0xFF7F1D1D);
        int p = (int) (16 * ctx.getResources().getDisplayMetrics().density);
        khung.setPadding(p, p, p, p);

        TextView chu = new TextView(ctx);
        chu.setText(tieuDe);
        chu.setTextColor(0xFFFFFFFF);
        // §4.4 — sàn cỡ chữ. 18sp là chữ chính, không phải chú thích.
        chu.setTextSize(18);
        // §4.5 — dấu tiếng Việt xếp cả trên lẫn dưới; line-height dưới 1.25 cắt dấu.
        chu.setLineSpacing(0f, 1.3f);
        khung.addView(chu);

        LinearLayout hang = new LinearLayout(ctx);
        hang.setOrientation(LinearLayout.HORIZONTAL);
        hang.setPadding(0, p / 2, 0, 0);

        Button moApp = new Button(ctx);
        moApp.setText(nutMo);
        moApp.setTextSize(17);
        // §4.4 — vùng chạm tối thiểu 52dp.
        moApp.setMinHeight((int) (52 * ctx.getResources().getDisplayMetrics().density));
        moApp.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Intent i = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
                if (i != null) {
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    ctx.startActivity(i);
                }
                an(ctx);
            }
        });
        hang.addView(moApp);

        // ⚠️ §4.6 — LỐI RA. Không giấu, không nhỏ hơn nút chính.
        Button toiOn = new Button(ctx);
        toiOn.setText(nutOn);
        toiOn.setTextSize(17);
        toiOn.setMinHeight((int) (52 * ctx.getResources().getDisplayMetrics().density));
        toiOn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { an(ctx); }
        });
        hang.addView(toiOn);

        khung.addView(hang);

        int loai = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,   // ⚠️ giới hạn ② — không phủ toàn màn
                loai,
                // ⚠️ giới hạn ① — chạm ra ngoài đi xuống app bên dưới. Dải này
                // KHÔNG chặn thao tác của người dùng với app họ đang dùng.
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP;

        WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
        try {
            wm.addView(khung, lp);
            dangHien = khung;
        } catch (Exception e) {
            // Quyền bị thu hồi giữa chừng, hoặc ROM chặn. KHÔNG làm sập app —
            // popup là đường phụ, mất nó thì app vẫn phải chạy (§6.7).
            dangHien = null;
        }
    }

    public static void an(Context ctx) {
        if (dangHien == null) return;
        WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
        try { wm.removeView(dangHien); } catch (Exception ignored) { }
        dangHien = null;
    }
}
