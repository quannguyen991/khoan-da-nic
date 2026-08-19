package vn.khoanda.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

/**
 * THÔNG BÁO THƯỜNG TRỰC — LỐI VÀO NHANH LÚC ĐANG BỊ GỌI.
 *
 * ══════════ VÌ SAO CÓ THỨ NÀY ══════════
 *
 * Kẻ lừa đảo giữ người ta trên điện thoại và thúc liên tục. Mở khoá máy, tìm
 * biểu tượng, mở app, tìm đúng ô — bốn bước, và mỗi bước là một cơ hội để bác
 * bỏ cuộc rồi làm theo lời chúng.
 *
 * Một dòng nằm sẵn trên thanh thông báo là MỘT cú chạm. Kéo xuống, chạm, xong.
 *
 * ══════════ NĂM RÀNG BUỘC ══════════
 *
 * ① MẶC ĐỊNH TẮT. Người dùng tự bật trong Cài đặt. Một thông báo không xoá được
 *    mà tự dựng lên là thứ gây khó chịu, và §12 cấm tự bật thứ gì thay chủ máy.
 *
 * ② KÊNH RIÊNG, MỨC THẤP. `IMPORTANCE_LOW` — không kêu, không rung, không đè
 *    lên màn hình. Nó là một lối tắt, KHÔNG phải một cảnh báo. Dùng chung kênh
 *    với cảnh báo mức cao là dạy người dùng bỏ qua cảnh báo thật (§4.6).
 *
 * ③ §11 — KHÔNG HỨA GÌ CẢ. Chữ trên đó nói đúng một việc: chạm vào để hỏi.
 *    Không "đang bảo vệ bác", không "đã chặn", không con số nào.
 *
 * ④ §4.1 — MỌI CHỮ TỪ `strings.xml`. Lớp này không soạn câu tiếng Việt nào.
 *
 * ⑤ KHÔNG THU THẬP GÌ. Nó chỉ mở app. Không đọc màn hình, không nghe, không
 *    chạy ngầm thứ gì — chỉ là một `Notification` tĩnh.
 */
public final class ThongBaoThuongTruc {

    /**
     * ⚠️ KÊNH RIÊNG, KHÔNG DÙNG CHUNG VỚI KÊNH CẢNH BÁO.
     * Kênh cảnh báo là `IMPORTANCE_HIGH` (hiện đè, có rung). Lối tắt mà cũng
     * rung mỗi lần thì bác tắt cả hai.
     */
    private static final String KENH = "khoanda_loi_tat_v1";
    private static final int MA = 1001;

    private ThongBaoThuongTruc() { }

    private static void dungKenh(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        NotificationChannel k = new NotificationChannel(
                KENH,
                ctx.getString(R.string.kenh_loi_tat_ten),
                NotificationManager.IMPORTANCE_LOW);
        k.setDescription(ctx.getString(R.string.kenh_loi_tat_mo_ta));
        k.setShowBadge(false);
        k.enableVibration(false);
        k.setSound(null, null);
        nm.createNotificationChannel(k);
    }

    /**
     * Bật dòng thông báo thường trực.
     *
     * @return true nếu đã gửi được. false khi chưa có quyền POST_NOTIFICATIONS —
     *         và tầng web PHẢI nói ra, không được để công tắc tự bật (§4.3).
     */
    public static boolean bat(Context ctx) {
        try {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return false;

            /*
             * ⚠️ HỎI TRƯỚC, ĐỪNG TIN `notify()` — LỖI ĐÃ MẮC 16/8/2026.
             *
             * `notify()` KHÔNG ném `SecurityException` khi thiếu quyền thông báo;
             * nó trả về bình thường và không hiện gì. Nên nhánh `catch` bên dưới
             * chưa bao giờ chạy, hàm này luôn trả `true`, công tắc lật sang "bật",
             * và trên thanh thông báo không có gì cả.
             *
             * §4.3 ở dạng nguy hiểm nhất: không phải "không làm được" mà là "báo
             * là làm được trong khi không". Bác tin có một lối tắt đang chờ sẵn
             * lúc bị gọi thúc — và lúc cần thì không có.
             *
             * `areNotificationsEnabled()` có từ API 24 và bắt được CẢ HAI ca:
             * chưa cấp `POST_NOTIFICATIONS` (Android 13+), và người dùng đã tắt
             * thông báo của app trong Cài đặt (mọi phiên bản).
             */
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                    && !nm.areNotificationsEnabled()) {
                return false;
            }

            dungKenh(ctx);

            /*
             * ⚠️ KÊNH CŨNG BỊ TẮT RIÊNG ĐƯỢC. Người dùng tắt đúng kênh "Lối tắt
             * Khoan Đã" trong Cài đặt thì thông báo của app vẫn "được bật" nhưng
             * kênh này thì không — và app KHÔNG bật lại kênh được. Nói ra.
             */
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel daCo = nm.getNotificationChannel(KENH);
                if (daCo != null && daCo.getImportance() == NotificationManager.IMPORTANCE_NONE) {
                    return false;
                }
            }

            /*
             * ⚠️ MỞ THẲNG MÀN GHI ÂM, không mở trang chủ.
             * Người kéo thanh thông báo lúc đang bị gọi cần nói ngay, không cần
             * nhìn trang chủ. Dùng cùng deep link với menu lối tắt.
             */
            Intent mo = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("khoanda://loi-tat/dang-bi-goi"),
                    ctx, MainActivity.class);
            mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent pi = PendingIntent.getActivity(
                    ctx, 0, mo,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            Notification tb = new Notification.Builder(ctx, KENH)
                    .setSmallIcon(R.drawable.loi_tat_goi)
                    .setContentTitle(ctx.getString(R.string.tb_thuong_truc_tieu_de))
                    .setContentText(ctx.getString(R.string.tb_thuong_truc_noi_dung))
                    /*
                     * ⚠️ `setOngoing(true)` để bác KHÔNG vuốt nhầm mất nó.
                     * Đây là lối tắt khẩn cấp; vuốt nhầm một lần là mất luôn cho
                     * tới khi ai đó vào Cài đặt bật lại. Vẫn tắt được ở Cài đặt
                     * của app — §4.6, luôn có lối ra.
                     */
                    .setOngoing(true)
                    .setShowWhen(false)
                    .setContentIntent(pi)
                    .setStyle(new Notification.BigTextStyle()
                            .bigText(ctx.getString(R.string.tb_thuong_truc_noi_dung)))
                    .build();

            nm.notify(MA, tb);

            /*
             * ⚠️ ĐỌC LẠI, ĐỪNG TIN. `getActiveNotifications()` cho biết thông báo
             * có THẬT SỰ nằm trên thanh không. Một số ROM (Xiaomi, Oppo, Vivo)
             * chặn thông báo ở tầng riêng của hãng mà `areNotificationsEnabled()`
             * vẫn báo bật. Đây là chỗ duy nhất đo được sự thật.
             */
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    for (android.service.notification.StatusBarNotification n : nm.getActiveNotifications()) {
                        if (n.getId() == MA) return true;
                    }
                    return false;
                } catch (Exception e) {
                    /*
                     * Không đo được thì KHÔNG kết luận là hỏng. Ta đã qua hai cửa
                     * kiểm quyền ở trên và `notify()` không ném — đủ để báo là đã
                     * gửi. §4.3 cấm biến "đo được là không có" thành "không đo
                     * được"; nó cũng cấm chiều ngược lại.
                     */
                    return true;
                }
            }
            return true;
        } catch (SecurityException e) {
            // Chưa có POST_NOTIFICATIONS (Android 13+). Nói ra, đừng nuốt.
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /** Tắt. §4.6 — luôn có lối ra, kể cả với `setOngoing(true)`. */
    public static void tat(Context ctx) {
        try {
            ctx.getSystemService(NotificationManager.class).cancel(MA);
        } catch (Exception e) {
            // Không có gì để tắt — không phải lỗi.
        }
    }
}
