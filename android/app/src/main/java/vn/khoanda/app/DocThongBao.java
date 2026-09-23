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
 * ⚠️ CHỈ LẤY TỪ ỨNG DỤNG NHẮN TIN — và, từ 23/9/2026 theo quyết định của người
 * dùng, từ một danh sách CỐ ĐỊNH app ngân hàng/ví (xem GOI_NGAN_HANG), chỉ để kiểm
 * "tiền vừa ra / mã vừa tới trong lúc gọi". Không quét thông báo của mọi app — vừa
 * thừa vừa làm bề mặt riêng tư rộng ra vô cớ.
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
     * ══════ APP NGÂN HÀNG / VÍ — thêm 23/9/2026, NGƯỜI DÙNG QUYẾT ══════
     *
     * Nhiều người giờ nhận biến động số dư qua thông báo TRONG app ngân hàng, không
     * qua SMS. Chỉ đọc SMS thì bỏ lỡ đúng khoảnh khắc tiền ra. Người dùng đã quyết mở
     * rộng phạm vi đọc sang các app dưới đây (§12 — đổi phạm vi riêng tư là việc của
     * người dùng, không phải của Claude).
     *
     * ⚠️ CHỈ DÙNG CHO HAI PHÉP KIỂM TRONG LÚC GỌI: tiền vừa ra, và mã OTP vừa tới.
     *    KHÔNG vào hàng đợi `HANG` (bác không "kiểm tin" thông báo ngân hàng), KHÔNG
     *    sàng lọc, KHÔNG ghi log, KHÔNG gửi đi đâu. Đọc xong là bỏ.
     * ⚠️ DANH SÁCH CỐ ĐỊNH, ĐÃ XÁC MINH trên Google Play ngày 23/9/2026 (tiêu đề trang
     *    khớp tên app). Mã gói đoán mà không có trên Play thì KHÔNG đưa vào. Thêm
     *    ngân hàng mới: xác minh trước, rồi thêm ở đây và ở PERMISSIONS-AND-POLICY.md.
     */
    static final List<String> GOI_NGAN_HANG = new ArrayList<String>() {{
        add("com.VCB");                       // VCB Digibank
        add("com.vietinbank.ipay");           // VietinBank iPay
        add("com.vnpay.bidv");                // BIDV SmartBanking
        add("com.vnpay.Agribank3g");          // Agribank Plus
        add("vn.com.techcombank.bb.app");     // Techcombank Mobile
        add("com.mbmobile");                  // MB Bank
        add("mobile.acb.com.vn");             // ACB ONE
        add("com.vnpay.vpbankonline");        // VPBank NEO
        add("com.tpb.mb.gprsandroid");        // TPBank Mobile
        add("com.vib.myvib2");                // MyVIB
        add("com.sacombank.ewallet");         // Sacombank Pay
        add("com.vnpay.hdbank");              // HDBank
        add("vn.com.seabank.mb1");            // SeAMobile
        add("vn.com.msb.smartBanking");       // MSB mBank
        add("vn.com.ocb.awe");                // OCB OMNI
        add("vn.com.lpb.lienviet24h");        // LPBank
        add("xyz.be.cake");                   // Cake
        add("vn.shb.saha.mbanking");          // SHB SAHA
        add("com.ncb.bank");                  // NCB iziMobile
        add("com.mservice.momotransfer");     // MoMo
        add("vn.com.vng.zalopay");            // ZaloPay
        add("com.bplus.vtpay");               // Viettel Money
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
        if (sbn == null) return;
        if (GOI_NGAN_HANG.contains(sbn.getPackageName())) {
            kiemThongBaoNganHang(sbn.getNotification());
            return;
        }
        if (!GOI_NHAN_TIN.contains(sbn.getPackageName())) return;

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
        // Phần 4 (23/9/2026): mã tới trong lúc đang gọi thì TỰ MỞ màn cảnh báo — xem CuocGoi.
        if (kiemTienRaTrongCuocGoi(noiDung)) return;
        if (kiemMaTrongCuocGoi(noiDung)) return;
        sangLocTaiCho(noiDung);
    }

    /**
     * ① ĐANG GỌI + TIN CÓ MÃ ⇒ tự mở màn cảnh báo (Phần 4, 23/9/2026).
     *
     * ⚠️ Ở ĐÂY MỘT DẤU HIỆU LÀ ĐỦ — khác `sangLocTaiCho` đòi hai. Tin OTP thật của
     * ngân hàng thì bình thường; cái bất thường là nó tới ĐÚNG LÚC có người đang
     * nói chuyện với bác. Câu hiện ra dạng ĐIỀU KIỆN ("ai gọi mà xin mã…"), không
     * buộc tội ai (§11): bác đang gọi cho con gái mà mua hàng online thì câu đó
     * vẫn đúng, và nút "Tôi ổn" luôn ở đó (§4.6).
     * ⚠️ Không đưa nội dung tin vào thông báo, không gửi đi đâu (§6.9).
     */
    private boolean kiemMaTrongCuocGoi(String noiDung) {
        if (noiDung == null || !DAU_HIEU_MA.matcher(noiDung).find()) return false;
        if (!CuocGoi.dangHoacVuaGoi(this, System.currentTimeMillis())) return false;
        CuocGoi.batManCanhBao(this, "otp-trong-cuoc-goi",
                R.string.tb_otp_cuoc_goi_tieu_de, R.string.tb_otp_cuoc_goi_noi_dung);
        return true;
    }

    /**
     * ③ ĐANG GỌI + TIN BÁO TIỀN VỪA RA KHỎI TÀI KHOẢN ⇒ tự mở màn (23/9/2026).
     *
     * Lúc bác đã lỡ chuyển là lúc báo ngân hàng sớm còn nhiều cơ hội nhất — trước
     * đây app chỉ biết khi bác TỰ khai. Tin biến động số dư của ngân hàng Việt Nam
     * luôn có một số tiền mang dấu TRỪ kèm chữ tài khoản / số dư / giao dịch:
     *   "SD TK 0123 -5,000,000VND luc…"  ·  "TK:123|GD:-5,000,000VND|SDC:…"
     *
     * ⚠️ HAI VẾ CÙNG LÚC: dấu trừ trước một số tiền VÀ một chữ về tài khoản. Chỉ một vế
     *    thì tin khuyến mãi "giảm -50%" cũng khớp.
     * ⚠️ NGƯỠNG 1 TRIỆU LÀ LỰA CHỌN, KHÔNG PHẢI SỐ ĐO — trả tiền xe 50 nghìn trong lúc
     *    đang gọi không đáng một màn đỏ. Có số thật thì sửa ở đây và sửa câu này.
     * ⚠️ ĐỌC Ở SMS BIẾN ĐỘNG SỐ DƯ và, từ 23/9/2026 (người dùng quyết), ở thông báo
     *    của các app trong GOI_NGAN_HANG — đọc xong bỏ, không lưu.
     * ⚠️ Câu hiện ra dạng điều kiện, không khẳng định bác bị lừa (§11); có "Tôi ổn" (§4.6).
     *    Số tiền và nội dung tin KHÔNG rời máy, không vào thông báo (§6.9).
     */
    static final long NGUONG_TIEN_RA = 1_000_000L;

    private static final java.util.regex.Pattern SO_TIEN_TRU =
            java.util.regex.Pattern.compile("(?:^|[\\s:|(])[-−]\\s?(\\d{1,3}(?:[.,]\\d{3})+|\\d{4,})",
                    java.util.regex.Pattern.CASE_INSENSITIVE);

    private static final java.util.regex.Pattern CHU_TAI_KHOAN =
            java.util.regex.Pattern.compile(
                    "(\\btk\\b|tài khoản|tai khoan|số dư|so du|\\bsd\\b|\\bsdc\\b|\\bgd\\b"
                    + "|giao dịch|giao dich|biến động|bien dong)",
                    java.util.regex.Pattern.CASE_INSENSITIVE);

    /** Số tiền bị trừ lớn nhất trong tin, hoặc -1 nếu không phải tin trừ tiền. Hàm thuần — test được. */
    static long soTienRa(String noiDung) {
        if (noiDung == null || !CHU_TAI_KHOAN.matcher(noiDung).find()) return -1;
        java.util.regex.Matcher m = SO_TIEN_TRU.matcher(noiDung);
        long lonNhat = -1;
        while (m.find()) {
            try {
                long so = Long.parseLong(m.group(1).replace(".", "").replace(",", ""));
                if (so > lonNhat) lonNhat = so;
            } catch (NumberFormatException ignored) {
                // số quá dài — bỏ qua dòng này
            }
        }
        return lonNhat;
    }

    /**
     * Thông báo của app ngân hàng / ví: ghép tiêu đề + nội dung (app ngân hàng hay để
     * "Biến động số dư" ở tiêu đề, con số ở thân), chạy hai phép kiểm trong lúc gọi,
     * rồi BỎ. Không `them()`, không `sangLocTaiCho()` — xem chú thích ở GOI_NGAN_HANG.
     */
    private void kiemThongBaoNganHang(Notification n) {
        if (n == null || n.extras == null) return;
        Bundle x = n.extras;
        StringBuilder sb = new StringBuilder();
        for (String k : new String[] {
                Notification.EXTRA_TITLE, Notification.EXTRA_TEXT, Notification.EXTRA_BIG_TEXT }) {
            CharSequence cs = x.getCharSequence(k);
            if (!TextUtils.isEmpty(cs)) sb.append(cs).append(' ');
        }
        String noiDung = sb.toString();
        if (kiemTienRaTrongCuocGoi(noiDung)) return;
        kiemMaTrongCuocGoi(noiDung);
    }

    private boolean kiemTienRaTrongCuocGoi(String noiDung) {
        if (soTienRa(noiDung) < NGUONG_TIEN_RA) return false;
        if (!CuocGoi.dangHoacVuaGoi(this, System.currentTimeMillis())) return false;
        CuocGoi.batManCanhBao(this, "tien-ra-trong-cuoc-goi",
                R.string.tb_tien_ra_cuoc_goi_tieu_de, R.string.tb_tien_ra_cuoc_goi_noi_dung);
        return true;
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
