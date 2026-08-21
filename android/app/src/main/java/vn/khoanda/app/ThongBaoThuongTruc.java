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
    /**
     * ══════════ NHỚ TRẠNG THÁI Ở TẦNG NATIVE, KHÔNG PHẢI localStorage ══════════
     *
     * ⚠️ VÌ SAO KHÔNG DÙNG localStorage CỦA WEBVIEW.
     *
     * Trạng thái "bác đã bật lối tắt" trước đây chỉ nằm trong localStorage. Mà
     * localStorage sống trong WebView, và WebView chỉ tồn tại khi app đang mở.
     * Lúc máy vừa khởi động lại, thứ cần bật lại thông báo là một
     * BroadcastReceiver chạy KHI CHƯA CÓ WEBVIEW NÀO — nó không có cách nào đọc
     * được localStorage.
     *
     * Hệ quả đo được: bác bật lối tắt, tắt máy đi ngủ, sáng bật máy lên —
     * thanh thông báo TRỐNG. Nhưng localStorage vẫn ghi `'true'`, nên vào app
     * thì công tắc vẫn xanh và vẫn ghi "Đang BẬT túc trực 24/7".
     *
     * Đó đúng là §4.3: app khai một thứ đang chạy trong khi nó không chạy. Và
     * nó tệ hơn một lỗi thường, vì thứ bị mất chính là lối tắt cho lúc khẩn cấp
     * — bác chỉ phát hiện ra vào đúng lúc cần tới nó.
     *
     * SharedPreferences nằm ở tầng native nên receiver đọc được, và nó sống qua
     * khởi động lại máy lẫn cài đè phiên bản mới.
     */
    private static final String KHO = "khoanda_thong_bao";
    private static final String KHOA_BAT = "thuong_truc_dang_bat";

    /** Bác có muốn giữ lối tắt này không. Khác với "nó có đang hiện không". */
    public static boolean daChonBat(Context ctx) {
        try {
            return ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE)
                      .getBoolean(KHOA_BAT, false);
        } catch (Exception e) {
            return false;
        }
    }

    private static void ghiNho(Context ctx, boolean bat) {
        try {
            ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE)
               .edit().putBoolean(KHOA_BAT, bat).apply();
        } catch (Exception e) {
            // Không ghi được thì thôi — lần sau bác bật lại. Không đáng để ném.
        }
    }

    /**
     * Thông báo có ĐANG NẰM TRÊN THANH thật không.
     *
     * ⚠️ KHÁC HẲN `daChonBat()`, VÀ KHOẢNG CÁCH GIỮA HAI CÁI LÀ THỨ ĐÁNG NÓI RA.
     * Bác đã chọn bật, nhưng người dùng có thể vào Cài đặt tắt thông báo của
     * app, ROM có thể chặn, kênh có thể bị hạ mức. Khi hai giá trị này lệch nhau
     * thì màn Cài đặt phải nói ra, chứ không được chọn bừa một cái để hiển thị.
     */
    public static boolean dangHien(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return daChonBat(ctx);
        try {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return false;
            for (android.service.notification.StatusBarNotification n : nm.getActiveNotifications()) {
                if (n.getId() == MA) return true;
            }
            return false;
        } catch (Exception e) {
            // Không đo được ⇒ KHÔNG kết luận. Trả về thứ ta biết chắc: bác đã chọn gì.
            return daChonBat(ctx);
        }
    }

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

            /*
             * ═════ NÚT "KIỂM TIN MỚI NHẤT" NGAY TRÊN THANH THÔNG BÁO ═════
             *
             * Nhận xét của ban giám khảo: người dùng có thể sẽ không mở app.
             * Trước đây thông báo này chỉ có MỘT đích — mở màn ghi âm. Muốn kiểm
             * tin nhắn vừa đến thì bác vẫn phải vào app rồi tự tìm.
             *
             * Nay có nút riêng: chạm phát là vào thẳng kết quả của tin mới nhất.
             *
             * ⚠️ CHẠM VÀO ĐÂY CHÍNH LÀ CÁI BẤM MÀ §6.9 ĐÒI. Không phải tự gửi
             * — bác chủ động chọn. Thứ bỏ đi là ba thao tác tìm đường sau khi
             * đã đồng ý, không phải bỏ đi sự đồng ý.
             *
             * ⚠️ `requestCode` KHÁC 0. Dùng chung mã với PendingIntent trên thì
             * `FLAG_UPDATE_CURRENT` ghi đè cái này lên cái kia, và cả hai nút cùng
             * mở một màn — hỏng im lặng, không báo lỗi gì.
             */
            Intent moKiemTin = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("khoanda://loi-tat/kiem-tin-nhan"),
                    ctx, MainActivity.class);
            moKiemTin.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent piKiemTin = PendingIntent.getActivity(
                    ctx, 2, moKiemTin,
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
                    /*
                     * ⚠️ `setOngoing(true)` KHÔNG ĐỦ ĐỂ CHỐNG NÚT "XOÁ TẤT CẢ".
                     *
                     * `setOngoing` đặt FLAG_ONGOING_EVENT — nó khiến thông báo
                     * không vuốt-lẻ được, và Android gốc cũng chừa nó ra khi bấm
                     * "Xoá tất cả". Nhưng nhiều ROM phổ thông ở Việt Nam (Xiaomi,
                     * Oppo, Vivo, Realme) tự viết lại nút đó và quét sạch mọi
                     * thông báo, kể cả ongoing.
                     *
                     * FLAG_NO_CLEAR nói thẳng với hệ thống: đừng xoá cái này khi
                     * dọn hàng loạt. Đặt cả hai thì "cố định" mới thật sự cố định
                     * trên đúng những máy mà người dùng của app này đang cầm.
                     *
                     * §4.6 vẫn nguyên: công tắc trong Cài đặt của app tắt được
                     * bất cứ lúc nào. Không vuốt mất KHÁC không thoát được.
                     */
                    .setContentIntent(pi)
                    // Xem chú thích ở `piKiemTin`. Nhãn lấy từ strings.xml nên nó
                    // đổi theo ngôn ngữ của MÁY (§4.1) — có bản values-en.
                    .addAction(new Notification.Action.Builder(
                            Icon.createWithResource(ctx, R.drawable.loi_tat_goi),
                            ctx.getString(R.string.tb_nut_kiem_tin),
                            piKiemTin).build())
                    .setStyle(new Notification.BigTextStyle()
                            .bigText(ctx.getString(R.string.tb_thuong_truc_noi_dung)))
                    .build();

            tb.flags |= Notification.FLAG_NO_CLEAR;

            nm.notify(MA, tb);

            /*
             * ⚠️ GHI Ý ĐỊNH NGAY TẠI ĐÂY, TRƯỚC KHI ĐO LẠI.
             *
             * Ta đã qua hai cửa kiểm quyền ở trên và `notify()` không ném —
             * nghĩa là hệ thống đã NHẬN yêu cầu. Đó là đủ để nói "bác muốn giữ
             * lối tắt này", và ý định thì không phụ thuộc vào việc phép đo bên
             * dưới có kịp thấy hay không.
             *
             * Đặt sau phần đo là mắc lại đúng cuộc đua vừa mô tả, chỉ đổi chiều:
             * lần bật đầu tiên rơi trúng lúc đo hụt thì ý định KHÔNG được ghi,
             * và lối tắt lặng lẽ không quay lại sau lần tắt máy đầu tiên.
             */
            ghiNho(ctx, true);

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
                    /*
                     * ⚠️ TRẢ VỀ `false`, NHƯNG TUYỆT ĐỐI KHÔNG XOÁ Ý ĐỊNH ĐÃ GHI.
                     *
                     * ĐO ĐƯỢC 19/8/2026 — và bản vá đầu của chính hàm này đã mắc:
                     * nó gọi `ghiNho(ctx, false)` ngay tại đây, "cho nhất quán".
                     * Kết quả trên máy ảo Android 14: khởi động lại máy, thông báo
                     * hiện lên bình thường, mà kho lại ghi `false` — tức lần khởi
                     * động sau sẽ KHÔNG dựng lại nữa. Lối tắt tự tắt sau đúng hai
                     * lần tắt máy, không có gì báo.
                     *
                     * Nguyên nhân là một cuộc đua: `notify()` KHÔNG đồng bộ. Nó
                     * đẩy yêu cầu qua binder sang NotificationManagerService rồi
                     * trả về ngay. `getActiveNotifications()` gọi ngay sau đó có
                     * thể chạy TRƯỚC khi dịch vụ kia kịp ghi nhận — hay xảy ra
                     * nhất lúc máy vừa khởi động, đúng lúc `KhoiDongLai` chạy.
                     *
                     * Nên "không thấy" ở đây có HAI nghĩa: bị chặn thật, hoặc hỏi
                     * quá sớm. Ta phân biệt được không, nên:
                     *   · trả `false` — tầng web nói "chưa lên thanh", đúng §4.3;
                     *   · giữ nguyên ý định — nó là lựa chọn của bác, không phải
                     *     một phép đo, và không một phép đo nào được quyền huỷ nó.
                     *
                     * Ý định chỉ bị xoá ở đúng một chỗ: `tat()`, khi bác tự tắt.
                     */
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

    /**
     * Tắt. §4.6 — luôn có lối ra, kể cả với `setOngoing(true)`.
     *
     * ⚠️ QUÊN Ý ĐỊNH TRƯỚC, GỠ THÔNG BÁO SAU. Ngược thứ tự thì một lần ném ở
     * `cancel()` để lại `true` trong kho — và lần khởi động máy kế tiếp, thông
     * báo bác vừa tắt lại tự hiện lên. Một công tắc tắt rồi mà tự bật lại thì
     * bác sẽ không tin cái công tắc nào của app này nữa.
     */
    public static void tat(Context ctx) {
        ghiNho(ctx, false);
        try {
            ctx.getSystemService(NotificationManager.class).cancel(MA);
        } catch (Exception e) {
            // Không có gì để tắt — không phải lỗi.
        }
    }
}
