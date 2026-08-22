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
    /*
     * ══════ TRẢ VỀ CHUYỆN GÌ ĐÃ XẢY RA, ĐỪNG NUỐT IM ══════
     *
     * Bản cũ là `void` và `catch` rỗng. Nghĩa là khi ROM chặn `addView`, tầng
     * web nhận về một lời hứa đã hoàn thành và hiện "đang hiện thử…" — trong
     * khi không có gì trên màn hình cả.
     *
     * Người dùng báo ba lần "pop up vẫn chưa hiện", và cả ba lần không ai —
     * kể cả người viết mã — biết được nó hỏng ở đâu, vì chỗ duy nhất biết
     * sự thật là cái `catch` này và nó không nói với ai.
     *
     * Đó là §4.3 ở tầng chẩn đoán: "không làm được" trình bày y hệt "đã làm
     * xong". Và nó đắt hơn bình thường vì ba màn gỡ lỗi đã trôi qua mà không
     * thu được một dữ kiện nào.
     *
     * Bốn mã trả về, mỗi mã một cách sửa khác hẳn nhau:
     *   "hien"          — đã vẽ ra màn hình thật
     *   "chua_co_quyen" — `canDrawOverlays` false ⇒ đưa bác tới Cài đặt
     *   "thieu_chu"     — lỗi lập trình bên gọi, không phải lỗi của máy
     *   "rom_chan"      — quyền CÓ nhưng WindowManager vẫn từ chối. Đây là ca
     *                     Xiaomi/Oppo/Vivo/Realme: còn một công tắc thứ hai mà
     *                     Android không cho đọc trạng thái.
     */
    public static String hien(final Context ctx, String tieuDe, String nutMo, String nutOn) {
        /*
         * ═════ DÙNG APPLICATION CONTEXT, KHÔNG DÙNG ACTIVITY — 21/8/2026 ═════
         *
         * `getContext()` của Capacitor trả về Activity. Một view thên vào
         * WindowManager bằng token của Activity sống gắn với Activity đó: bác
         * rời app thì token hết hạn, và cái dải — thứ sinh ra ĐỂ hiện khi bác
         * ở app KHÁC — biến mất đúng lúc cần nó nhất. Có ROM còn ném
         * `BadTokenException` ngay tại `addView`.
         *
         * Application context sống bằng tiến trình, không chết theo màn hình.
         */
        final Context ung = ctx.getApplicationContext();

        if (!daBatQuyen(ung)) return "chua_co_quyen";
        // ⚠️ §11 — thiếu chữ thì KHÔNG hiện. Hiện một dải trống hoặc một câu mặc
        // định do lớp native bịa ra là phá luật "mọi chuỗi đến từ catalog".
        if (tieuDe == null || nutMo == null || nutOn == null) return "thieu_chu";

        an(ung);   // không chồng hai dải lên nhau

        LinearLayout khung = new LinearLayout(ung);
        khung.setOrientation(LinearLayout.VERTICAL);
        khung.setBackgroundColor(0xFF7F1D1D);
        int p = (int) (16 * ung.getResources().getDisplayMetrics().density);
        khung.setPadding(p, p, p, p);

        TextView chu = new TextView(ung);
        chu.setText(tieuDe);
        chu.setTextColor(0xFFFFFFFF);
        // §4.4 — sàn cỡ chữ. 18sp là chữ chính, không phải chú thích.
        chu.setTextSize(18);
        // §4.5 — dấu tiếng Việt xếp cả trên lẫn dưới; line-height dưới 1.25 cắt dấu.
        chu.setLineSpacing(0f, 1.3f);
        khung.addView(chu);

        LinearLayout hang = new LinearLayout(ung);
        hang.setOrientation(LinearLayout.HORIZONTAL);
        hang.setPadding(0, p / 2, 0, 0);

        Button moApp = new Button(ung);
        moApp.setText(nutMo);
        moApp.setTextSize(17);
        // §4.4 — vùng chạm tối thiểu 52dp.
        moApp.setMinHeight((int) (52 * ung.getResources().getDisplayMetrics().density));
        moApp.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                Intent i = ung.getPackageManager().getLaunchIntentForPackage(ung.getPackageName());
                if (i != null) {
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                    // Khởi từ application context thì BẮT BUỘC có NEW_TASK,
                    // không thì Android ném AndroidRuntimeException.
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ung.startActivity(i);
                }
                an(ung);
            }
        });
        hang.addView(moApp);

        // ⚠️ §4.6 — LỐI RA. Không giấu, không nhỏ hơn nút chính.
        Button toiOn = new Button(ung);
        toiOn.setText(nutOn);
        toiOn.setTextSize(17);
        toiOn.setMinHeight((int) (52 * ung.getResources().getDisplayMetrics().density));
        toiOn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { an(ung); }
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

        WindowManager wm = (WindowManager) ung.getSystemService(Context.WINDOW_SERVICE);
        try {
            wm.addView(khung, lp);
            dangHien = khung;
            return "hien";
        } catch (Throwable e) {
            // Quyền bị thu hồi giữa chừng, hoặc ROM chặn. KHÔNG làm sập app —
            // popup là đường phụ, mất nó thì app vẫn phải chạy (§6.7).
            // Nhưng giờ nó NÓI RA, thay vì để màn hình khai là đã hiện.
            android.util.Log.e("KhoanDa", "popup bi chan", e);
            dangHien = null;
            return "rom_chan";
        }
    }

    public static void an(Context ctx) {
        if (dangHien == null) return;
        /*
         * ⚠️ PHẢI CÙNG MỘT WindowManager VỚI LÚC THÊM VÀO.
         * `hien()` thêm view bằng `ung.getSystemService(...)`. Gỡ bằng WindowManager
         * lấy từ Activity là gỡ nhầm cửa sổ — `removeView` ném
         * IllegalArgumentException, và cái dải ở lại trên màn hình vĩnh viễn.
         */
        WindowManager wm = (WindowManager)
                ctx.getApplicationContext().getSystemService(Context.WINDOW_SERVICE);
        try { wm.removeView(dangHien); } catch (Exception ignored) { }
        dangHien = null;
    }
}
