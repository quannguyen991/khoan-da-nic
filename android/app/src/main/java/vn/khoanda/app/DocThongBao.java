package vn.khoanda.app;

import android.app.Notification;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * ĐỌC THÔNG BÁO TIN NHẮN ĐẾN — §15.4, nguồn đầu vào thứ tư.
 *
 * ══════════ ĐỌC HẾT KHỐI NÀY TRƯỚC KHI SỬA ══════════
 *
 * ⚠️ ĐÂY LÀ QUYỀN NHẠY CẢM NHẤT TRONG CẢ ỨNG DỤNG.
 * `BIND_NOTIFICATION_LISTENER_SERVICE` cho phép đọc MỌI thông báo trên máy —
 * tin nhắn ngân hàng, tin nhắn riêng tư, mọi thứ. Google Play bắt giải trình,
 * và người dùng phải tự bật trong Cài đặt hệ thống; không app nào tự bật được.
 *
 * ⚠️ §6.9 — KHÔNG GHI NỘI DUNG RA ĐÂU CẢ.
 * Lớp này giữ tin trong BỘ NHỚ, tối đa {@link #SUC_CHUA} tin, và KHÔNG ghi ra
 * tệp, KHÔNG ghi log, KHÔNG gửi đi đâu. Tầng web chủ động lấy khi bác bấm kiểm.
 * Một dòng `Log.d(TAG, sbn.toString())` ở đây là rò toàn bộ tin nhắn của bác
 * vào logcat — dòng đó KHÔNG được tồn tại.
 *
 * ⚠️ §4.3 — "KHÔNG ĐỌC ĐƯỢC" ≠ "ĐỌC RỒI, KHÔNG THẤY GÌ".
 * Ba ca hỏng dưới đây phải phân biệt được, và tầng web đã có sẵn mã cho từng ca
 * trong `unreadableInputFloor()`:
 *   thông báo bị cắt      → chi_doc_duoc_mot_phan_tin
 *   thông báo không nội dung → thong_bao_khong_co_noi_dung
 *   thông báo đã bị xoá   → thong_bao_da_bi_xoa
 * Trả về chuỗi rỗng rồi để tầng trên đoán là đúng con bug §4.3 mô tả.
 *
 * ⚠️ CHỈ LẤY TỪ ỨNG DỤNG NHẮN TIN. Không quét thông báo của mọi app — vừa thừa
 * vừa làm bề mặt riêng tư rộng ra vô cớ.
 *
 * ⚠️ CHƯA BIÊN DỊCH ĐƯỢC TRÊN MÁY DỰNG. Máy làm việc này không có JDK và Android
 * SDK, nên tệp này CHƯA TỪNG QUA javac. Phải mở bằng Android Studio và sửa lỗi
 * biên dịch nếu có trước khi tin là nó chạy.
 */
public class DocThongBao extends NotificationListenerService {

    /** Ứng dụng nhắn tin phổ biến ở Việt Nam. Chỉ đọc thông báo của những app này. */
    private static final List<String> GOI_NHAN_TIN = new ArrayList<String>() {{
        add("com.google.android.apps.messaging");   // Tin nhắn (Google)
        add("com.samsung.android.messaging");        // Tin nhắn (Samsung)
        add("com.android.mms");                      // Tin nhắn (AOSP)
        add("com.zing.zalo");                        // Zalo
        add("com.facebook.orca");                    // Messenger
        add("org.telegram.messenger");
        add("com.viber.voip");
    }};

    /**
     * Sức chứa CỐ Ý NHỎ. Đây là bộ đệm để bác bấm kiểm ngay sau khi nhận tin,
     * KHÔNG phải nhật ký tin nhắn. Giữ nhiều là dựng một kho dữ liệu nhạy cảm mà
     * không ai xin phép.
     */
    private static final int SUC_CHUA = 20;

    /** Mã trạng thái — TRÙNG với mã ở `unreadableInputFloor()` bên web. */
    public static final String CAT = "chi_doc_duoc_mot_phan_tin";
    public static final String RONG = "thong_bao_khong_co_noi_dung";
    public static final String DA_XOA = "thong_bao_da_bi_xoa";
    public static final String DOC_DUOC = "doc_duoc";

    /** Một tin đã bắt được. Chỉ sống trong bộ nhớ. */
    public static class Tin {
        public final String tuApp;
        public final String noiDung;
        public final String trangThai;
        public final long luc;

        Tin(String tuApp, String noiDung, String trangThai, long luc) {
            this.tuApp = tuApp;
            this.noiDung = noiDung;
            this.trangThai = trangThai;
            this.luc = luc;
        }
    }

    /**
     * ⚠️ `static` để tầng plugin lấy được mà không phải bind service.
     * Đánh đổi: nó sống theo tiến trình. Nên {@link #xoaHet()} phải được gọi khi
     * người dùng tắt tính năng, và sức chứa phải nhỏ.
     */
    private static final Deque<Tin> HANG = new ArrayDeque<>();

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !GOI_NHAN_TIN.contains(sbn.getPackageName())) return;

        Notification n = sbn.getNotification();
        if (n == null || n.extras == null) {
            them(sbn.getPackageName(), "", RONG, sbn.getPostTime());
            return;
        }

        Bundle x = n.extras;
        CharSequence than = x.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence day = x.getCharSequence(Notification.EXTRA_BIG_TEXT);

        // ⚠️ Android CẮT `EXTRA_TEXT` khi tin dài, và `EXTRA_BIG_TEXT` mới là bản
        // đầy đủ — nhưng nó không phải lúc nào cũng có. Đây chính là ca
        // `chi_doc_duoc_mot_phan_tin`: đọc được MỘT PHẦN, không phải đọc được hết.
        String noiDung;
        String trangThai;
        if (!TextUtils.isEmpty(day)) {
            noiDung = day.toString();
            trangThai = DOC_DUOC;
        } else if (!TextUtils.isEmpty(than)) {
            noiDung = than.toString();
            // Có dấu ba chấm cuối ⇒ nhiều khả năng bị cắt. Nghi ngờ thì khai là
            // CẮT, đừng khai là đọc đủ — §4.3 nghiêng về phía thừa nhận giới hạn.
            trangThai = noiDung.endsWith("…") || noiDung.endsWith("...") ? CAT : DOC_DUOC;
        } else {
            noiDung = "";
            trangThai = RONG;
        }

        them(sbn.getPackageName(), noiDung, trangThai, sbn.getPostTime());
        sangLocTaiCho(noiDung);
    }

    /**
     * ══════════ SÀNG LỌC NGAY TRÊN MÁY — KHÔNG PHẢI CHẤM ĐIỂM ══════════
     *
     * Người dùng hỏi 20/8/2026: "tin nhắn đọc OTP hay công an chuyển tiền vẫn
     * chưa tự cảnh báo". Đúng — trước đó app chỉ GIỮ tin lại, và chỉ kiểm khi
     * bác tự mở app bấm nút.
     *
     * ⚠️ VÌ SAO KHÔNG TỰ GỬI TIN ĐI KIỂM. §6.9 nói rõ: "Tin chỉ nằm trong máy
     * bác và chỉ được gửi đi kiểm khi bác bấm." Tự gửi MỌI tin nhắn đến cho máy
     * chủ là đổi hẳn mô hình riêng tư của sản phẩm — thứ §12 cấm tự ý thay.
     *
     * Nên bước này chạy HOÀN TOÀN TRÊN MÁY: không mạng, không AI, không một byte
     * nào rời khỏi thiết bị.
     *
     * ⚠️ VÀ NÓ KHÔNG RA KẾT LUẬN. §4.2 nói `decision-engine.js` là BỘ LUẬT DUY
     * NHẤT ra mức rủi ro. Đoạn Java này không được phép nói "Nguy hiểm cao" hay
     * chấm điểm gì — nó chỉ nói "cái này đáng kiểm" rồi mời bác mở app, nơi bộ
     * luật thật chạy. Một cái CHUÔNG, không phải một cái CÂN.
     *
     * ⚠️ ĐÒI HAI DẤU HIỆU, KHÔNG LẤY MỘT. Chỉ "OTP" thôi thì tin thật của ngân
     * hàng cũng có ("Mã OTP của quý khách là..."). Phải có thêm một vế NHỜ/ÉP
     * thì mới đáng gọi bác. Cùng bài học với pack tiếng Việt: cụm phải nói về
     * THỦ ĐOẠN, không phải về chủ đề.
     */
    private static final java.util.regex.Pattern DAU_HIEU_MA =
            java.util.regex.Pattern.compile(
                    "\\b(otp|m\u00e3 x\u00e1c th\u1ef1c|m\u00e3 giao d\u1ecbch|ma xac thuc|ma otp)\\b",
                    java.util.regex.Pattern.CASE_INSENSITIVE);

    private static final java.util.regex.Pattern DAU_HIEU_TIEN =
            java.util.regex.Pattern.compile(
                    "(chuy\u1ec3n kho\u1ea3n|chuy\u1ec3n ti\u1ec1n|chuyen tien|chuyen khoan"
                    + "|t\u00e0i kho\u1ea3n an to\u00e0n|tai khoan an toan|n\u1ed9p ti\u1ec1n|nop tien)",
                    java.util.regex.Pattern.CASE_INSENSITIVE);

    private static final java.util.regex.Pattern DAU_HIEU_EP =
            java.util.regex.Pattern.compile(
                    "(cung c\u1ea5p|\u0111\u1ecdc m\u00e3|doc ma|g\u1eedi m\u00e3|gui ma|nh\u1eadp m\u00e3|nhap ma"
                    + "|ngay|g\u1ea5p|gap|trong v\u00f2ng|trong vong|n\u1ebfu kh\u00f4ng|neu khong"
                    + "|\u0111\u1eebng n\u00f3i|dung noi|kh\u00f4ng \u0111\u01b0\u1ee3c k\u1ec3|khong duoc ke)",
                    java.util.regex.Pattern.CASE_INSENSITIVE);

    private static final java.util.regex.Pattern DAU_HIEU_CO_QUAN =
            java.util.regex.Pattern.compile(
                    "(c\u00f4ng an|cong an|c\u1ea3nh s\u00e1t|canh sat|vi\u1ec7n ki\u1ec3m s\u00e1t|vien kiem sat"
                    + "|to\u00e0 \u00e1n|toa an|c\u1ee5c thu\u1ebf|cuc thue|\u0111i\u1ec7n l\u1ef1c|dien luc)",
                    java.util.regex.Pattern.CASE_INSENSITIVE);

    private void sangLocTaiCho(String noiDung) {
        if (noiDung == null || noiDung.trim().length() < 12) return;

        boolean coMa = DAU_HIEU_MA.matcher(noiDung).find();
        boolean coTien = DAU_HIEU_TIEN.matcher(noiDung).find();
        boolean coEp = DAU_HIEU_EP.matcher(noiDung).find();
        boolean coCoQuan = DAU_HIEU_CO_QUAN.matcher(noiDung).find();

        // Hai vế trở lên mới gọi bác. Một vế là chưa đủ để làm phiền.
        boolean dangKiem = (coMa && coEp) || (coTien && coEp) || (coCoQuan && (coTien || coMa));
        if (!dangKiem) return;

        try {
            /*
             * ⚠️ CHỮ Ở ĐÂY KHÔNG ĐƯỢC MANG NHÃN RỦI RO NÀO. Không "nguy hiểm",
             * không "lừa đảo" — vì chưa có bộ luật nào chạy. Chỉ mời bác kiểm.
             * §11: không khai một kết luận chưa có.
             *
             * ⚠️ KHÔNG KÈM NỘI DUNG TIN NHẮN vào thông báo. Thông báo hiện trên
             * màn khoá, ai cầm máy cũng đọc được — chép nội dung vào đó là tự
             * tay mang tin của bác ra chỗ dễ thấy hơn cả chỗ nó vừa nằm.
             */
            ThongBaoCanhBao.hien(this,
                    getString(R.string.tb_sang_loc_tieu_de),
                    getString(R.string.tb_sang_loc_noi_dung),
                    // Chưa có kết luận nào ⇒ đưa bác tới chỗ KIỂM, không phải
                    // chỗ DỪNG. Xem chú thích ở `ThongBaoCanhBao.hien`.
                    ThongBaoCanhBao.DICH_KIEM_TIN);
        } catch (Throwable ignored) {
            // Không gửi được thông báo thì thôi — tin vẫn nằm trong hàng đợi để
            // bác kiểm khi mở app. Đừng để bước phụ này làm chết bước chính.
        }
    }

    /**
     * Thông báo bị gỡ. Kẻ lừa đảo hay gửi rồi thu hồi để bác không kịp đọc lại —
     * nên ghi nhận là ĐÃ BỊ XOÁ, không phải im lặng bỏ qua (§4.3).
     */
    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null || !GOI_NHAN_TIN.contains(sbn.getPackageName())) return;
        synchronized (HANG) {
            for (Tin t : HANG) {
                if (t.luc == sbn.getPostTime() && t.tuApp.equals(sbn.getPackageName())) return;
            }
        }
        them(sbn.getPackageName(), "", DA_XOA, sbn.getPostTime());
    }

    private static void them(String app, String noiDung, String trangThai, long luc) {
        synchronized (HANG) {
            HANG.addFirst(new Tin(app, noiDung, trangThai, luc));
            while (HANG.size() > SUC_CHUA) HANG.removeLast();
        }
        // ⚠️ KHÔNG log gì ở đây. Xem §6.9 ở đầu tệp.
    }

    /** Tin mới nhất, hoặc null nếu chưa bắt được gì. */
    public static Tin moiNhat() {
        synchronized (HANG) { return HANG.isEmpty() ? null : HANG.peekFirst(); }
    }

    public static List<Tin> tatCa() {
        synchronized (HANG) { return new ArrayList<>(HANG); }
    }

    /** Gọi khi người dùng tắt tính năng. Xoá sạch, không giữ lại gì. */
    public static void xoaHet() {
        synchronized (HANG) { HANG.clear(); }
    }

    /**
     * Người dùng đã bật quyền đọc thông báo chưa?
     *
     * ⚠️ KHÔNG có cách nào tự bật. Đây là quyền người dùng phải vào Cài đặt hệ
     * thống bật tay — và ĐÓ LÀ ĐÚNG. Một app tự bật được quyền đọc mọi thông báo
     * là một app không nên tồn tại.
     */
    public static boolean daBatQuyen(Context ctx) {
        ComponentName ten = new ComponentName(ctx, DocThongBao.class);
        String bat = Settings.Secure.getString(ctx.getContentResolver(),
                "enabled_notification_listeners");
        return bat != null && bat.contains(ten.flattenToString());
    }

    /** Mở đúng màn Cài đặt để người dùng tự bật. */
    public static Intent manCaiDat() {
        return new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }
}
