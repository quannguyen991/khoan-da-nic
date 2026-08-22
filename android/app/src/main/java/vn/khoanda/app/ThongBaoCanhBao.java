package vn.khoanda.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.graphics.drawable.Icon;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

/**
 * THÔNG BÁO C�NH BÁO — HEADS-UP KHI MỨC CAO.
 *
 * ══════════ VÌ SAO CẦN THỨ NÀY ══════════
 *
 * Mức CAO là lúc bác đang bị gọi/gửi tin nhắn. Khoan Đã trong app thì đã có, nhưng
 * nếu app đang ở nền hoặc bị khoá — bác chỉ còn một cách là nhìn thanh thông báo
 * trên cùng Android (kiểu tin Zalo/Messenger đến). Heads-up chính là cầu nối đó.
 *
 * Heads-up khác thường trực ở ba điểm — ba điểm đều là §11, không phải thẩm mỹ:
 *
 *  ① Heads-up phải RUNG + KÊU — bác không nhìn thanh thông báo thì phải biết.
 *    Lối tắt thường trực thì ngược lại: rung mỗi lần thì bác tắt cả hai.
 *
 *  ② Heads-up phải BẤM ĐƯỢC để mở app — đúng bằng một cú chạm. Mở trang chủ thì
 *    thêm ba bước tìm nút, và §4.6 nói không. Bấm vào phải đến thẳng màn Dừng 60s.
 *
 *  ③ Heads-up phải ĐỂ VUỐT BỎ — không `setOngoing(true)`. Bác đã mở app, đã hiểu,
 *    còn để heads-up ghim ở trên thì bác tắt thông báo của app luôn, và lần sau
 *    nguy hiểm thật cũng không có gì hiện. §4.6 cấm nhốt bác.
 */
public final class ThongBaoCanhBao {

    /**
     * ⚠️ KÊNH RIÊNG, KHÔNG D�NG CHUNG VỚI `khoanda_loi_tat_v1`.
     * Hai thứ có mức importance khác hẳn nhau (HIGH vs LOW) — dùng chung kênh là
     * bắt lối tắt thường trực cũng rung mỗi lần. Người dùng tắt kênh, mất cả hai.
     *
     * Tên kênh mang `_v2` để tránh đụng `khoanda_canh_bao_v1` đã có sẵn ở `KhoanDaPlugin`
     * — đổi importance của kênh đã tạo là KHÔNG THỂ, Android giữ kênh cũ nguyên vẹn.
     */
    private static final String KENH = "khoanda_canh_bao_v2";
    private static final int MA = 2001;
    /** Cho `BoQuaTinNhan` huỷ đúng thông báo này. */
    static final int MA_CONG_KHAI = MA;

    private ThongBaoCanhBao() { }

    private static void dungKenh(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        NotificationChannel k = new NotificationChannel(
                KENH,
                ctx.getString(R.string.kenh_canh_bao_v2_ten),
                NotificationManager.IMPORTANCE_HIGH);
        k.setDescription(ctx.getString(R.string.kenh_canh_bao_v2_mo_ta));
        // Heads-up bắt buộc: rung + kêu. Không cho phép tắt từng phần để đỡ bất ngờ.
        k.enableVibration(true);
        // Âm thanh dùng mặc định của hệ thống; nếu đặt null thì heads-up im lặng,
        // và heads-up im lặng thì không khác gì thường trực.
        k.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(k);
    }

    /**
     * Hiện heads-up notification. Bấm vào sẽ m� app thẳng màn Dừng 60s.
     *
     * @return true nếu đã gửi được (đã qua `getActiveNotifications()` kiểm).
     *         false khi quyền bị thu hồi, kênh bị tắt, hoặc ROM chặn — tầng web
     *         PHẢI biết ba ca này đều tồn tại, không được đoán.
     */
    /*
     * ═════ HAI NGƯỜI GỌI, HAI ĐÍCH ĐẾN KHÁC NHAU ═════
     *
     * ① `KhoanDaPlugin.hienCanhBaoHeadsUp` — bộ luật ĐÃ chạy và ra mức CAO.
     *   Đích đúng là màn Dừng 60s: có kết luận rồi, việc cần làm là dừng.
     * ② `DocThongBao.sangLocTaiCho` — lớp sàng lọc tại chỗ vừa thấy hai dấu
     *   hiệu trong một tin đến. CHƯA có bộ luật nào chạy, chưa có kết luận nào.
     *
     * Đưa ca ② tới màn Dừng 60s là trưng ra một kết luận chưa tồn tại (§11).
     * Thực tế còn tệ hơn: tầng web đọc `khoan_da_canh_bao_cao` từ bộ nhớ, không
     * thấy gì (vì chưa chạy lượt nào) nên rơi về trang chủ — bác bấm vào một
     * cảnh báo rồi đứng giữa trang chủ, không biết làm gì tiếp.
     *
     * Nay ca ② đi thẳng `kiem-tin-nhan`: mở ra là tin đó được đem đi kiểm.
     */
    static final String DICH_DUNG_60S = "khoanda://canh-bao/dung-lai-60s";
    static final String DICH_KIEM_TIN = "khoanda://loi-tat/kiem-tin-nhan";

    public static boolean hien(Context ctx, String tieuDe, String noiDung) {
        return hien(ctx, tieuDe, noiDung, DICH_DUNG_60S);
    }

    public static boolean hien(Context ctx, String tieuDe, String noiDung, String dichDen) {
        try {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return false;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                    && !nm.areNotificationsEnabled()) {
                return false;
            }

            dungKenh(ctx);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel daCo = nm.getNotificationChannel(KENH);
                if (daCo != null && daCo.getImportance() == NotificationManager.IMPORTANCE_NONE) {
                    return false;
                }
            }

            /*
             * ⚠️ DEEP LINK → MÀN DỪNG 60S, KHÔNG PHẢI TRANG CHỦ.
             * Bấm heads-up lúc đang bị thúc là lúc bác cần dừng, không cần đọc
             * trang chủ rồi tự bấm. MainActivity.onNewIntent → KhoanDaPlugin.nhanIntent
             * → web đọc `loiTat === 'canh-bao-dung-lai-60s'` → set view 'warning'.
             */
            Intent mo = new Intent(Intent.ACTION_VIEW,
                    Uri.parse(dichDen),
                    ctx, MainActivity.class);
            mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            // Mã yêu cầu khác để PendingIntent không ghi đè lên các deep link khác.
            PendingIntent pi = PendingIntent.getActivity(
                    ctx, 1, mo,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            /*
             * ═════ HỎI MỘT CÂU, CÓ HAI NÚT TRẢ LỜI ─ 21/8/2026 ═════
             *
             * Bản cũ chỉ có một thông báo không nút: "Có tin nhắn đáng kiểm.
             * Chạm để cháu kiểm giúp bác." Bác phải đoán rằng chạm vào thì sẽ
             * xảy ra chuyện gì, và không có cách nào nói "không" ngoài vuốt đi.
             *
             * Nay nó HỎI, và cả hai câu trả lời đều bấm được ngay trên thanh thông
             * báo — không phải mở app rồi đi tìm.
             *
             * ⚠️ "Bỏ qua" KHÔNG PHẢI NÚT TRANG TRÍ. §4.6 — luôn có lối ra. Một
             * câu hỏi chỉ có một câu trả lời không phải là câu hỏi, và bác cần
             * nói được "không" mà không thấy mình đang làm sai.
             *
             * ⚠️ CÂU HỎI KHÔNG ĐƯỢC MANG NHÃN RỦI RO. Chưa bộ luật nào chạy
             * trên tin này — xem `DocThongBao.sangLocTaiCho`. Viết "tin này nguy
             * hiểm" ở đây là khai một kết luận chưa tồn tại (§11).
             *
             * ⚠️ VÀ KHÔNG CHÉP NỘI DUNG TIN VÀO ĐÂY. Thông báo hiện trên màn
             * khoá; ai cầm máy cũng đọc được.
             */
            Intent boQua = new Intent(ctx, BoQuaTinNhan.class);
            PendingIntent piBoQua = PendingIntent.getBroadcast(
                    ctx, 3, boQua,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            Notification tb = new Notification.Builder(ctx, KENH)
                    .setSmallIcon(R.drawable.ic_launcher_foreground)
                    .setContentTitle(tieuDe)
                    .setContentText(noiDung)
                    /*
                     * `setStyle` BigTextStyle cho phép nội dung dài hơn dòng tiêu đề
                     * khi bác kéo xuống — trường hợp heads-up bi cắt ngắn.
                     */
                    .setStyle(new Notification.BigTextStyle().bigText(noiDung))
                    /*
                     * ⚠️ CỜ ƯU TIÊN CAO Ở BUILDER (pre-O) + CATEGORY ALARM.
                     * Một số ROM Samsung cần `CATEGORY_ALARM` để heads-up thật sự
                     * đè lên màn hình khoá. Nội dung là cảnh báo an toàn, không
                     * phải âm thanh báo thức — nhưng cờ này về mặt hành vi là
                     * "đây là thông báo bác cần thấy NGAY".
                     */
                    .setCategory(Notification.CATEGORY_ALARM)
                    .setPriority(Notification.PRIORITY_HIGH)
                    .setDefaults(Notification.DEFAULT_VIBRATE | Notification.DEFAULT_SOUND)
                    // Tự tắt khi bác bấm — không ghim ở thanh trên mãi mãi (§4.6).
                    .setAutoCancel(true)
                    .setShowWhen(true)
                    .setContentIntent(pi)
                    .addAction(new Notification.Action.Builder(
                            Icon.createWithResource(ctx, R.drawable.ic_launcher_foreground),
                            ctx.getString(R.string.tb_nut_kiem_giup), pi).build())
                    .addAction(new Notification.Action.Builder(
                            Icon.createWithResource(ctx, R.drawable.ic_launcher_foreground),
                            ctx.getString(R.string.tb_nut_bo_qua), piBoQua).build())
                    .build();

            nm.notify(MA, tb);

            /*
             * ĐỌC LẠI, ĐỪNG TIN `notify()`. Một số ROM (Xiaomi, Oppo, Vivo) chặn
             * thông báo ở tầng riêng của hãng mà `areNotificationsEnabled()` vẫn
             * báo bật — `getActiveNotifications()` là chỗ duy nhất đo được sự thật.
             */
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    for (android.service.notification.StatusBarNotification n : nm.getActiveNotifications()) {
                        if (n.getId() == MA) return true;
                    }
                    return false;
                } catch (Exception e) {
                    return true;
                }
            }
            return true;
        } catch (SecurityException e) {
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public static void an(Context ctx) {
        try {
            ctx.getSystemService(NotificationManager.class).cancel(MA);
        } catch (Exception e) {
            // Không có gì để tắt — không phải lỗi.
        }
    }
}
