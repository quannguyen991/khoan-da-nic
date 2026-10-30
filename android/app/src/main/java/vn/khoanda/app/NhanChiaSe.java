package vn.khoanda.app;

import android.content.ContentResolver;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * NHẬN NỘI DUNG CHIA SẺ TỪ APP KHÁC, VÀ NHẬN LỐI TẮT.
 *
 * ══════════ HAI ĐƯỜNG LẤY ẢNH MÀN HÌNH — CẢ HAI ĐỀU DO BÁC CHỦ ĐỘNG ══════════
 *
 * ① BÁC TỰ CHỤP bằng phím của máy rồi bấm Chia sẻ → Khoan Đã. Không đòi quyền nào.
 * ② (từ 30/10/2026) BÁC CHẠM NÚT NỔI → "Chụp màn hình đi kiểm". Dùng `MediaProjection`, một
 *    lần, có hộp xác nhận của Android mỗi lần — xem `ChupManHinh` (bốn ràng buộc, và vì sao
 *    đường này từng bị từ chối). KHÔNG BAO GIỜ tự chụp ngầm, không quay video.
 *
 * Cả hai là cách lấy được nội dung từ Zalo, Messenger hay app ngân hàng — những chỗ mà đọc
 * thông báo chỉ thấy một dòng tóm tắt.
 *
 * ══════════ BA RÀNG BUỘC ══════════
 *
 * ① §4.2 · §12 — LỚP NÀY KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO. Nó lấy nội dung thô rồi
 *    đưa lên tầng web. Không chấm điểm, không xếp mức, không lọc "cái này chắc
 *    không sao".
 *
 * ② §12 — NỘI DUNG NGƯỜI DÙNG KHÔNG BAO GIỜ LÀ CHỈ THỊ. Chuỗi lấy về đi thẳng
 *    vào ô nhập của giao diện. Không có đường nào từ đây tới một chỗ ra lệnh.
 *
 * ③ §6.10 — CHẶN TRẦN KÍCH THƯỚC Ở ĐÂY. App gửi sang có thể là ảnh 50 MB; đọc
 *    hết vào bộ nhớ rồi mã hoá base64 là gấp ba lần đó. Máy yếu sẽ chết đứng,
 *    và người dùng chỉ thấy app tự tắt.
 */
public final class NhanChiaSe {

    /** §6.10 — trần 5 MB, khớp `GIOI_HAN_TEP` bên máy chủ. */
    private static final int TRAN_BYTE = 5 * 1024 * 1024;

    /**
     * Ảnh chụp màn hình điện thoại thường là 1080×2400. Thu về cạnh dài 1600 là
     * đủ cho OCR đọc chữ, mà giảm hẳn khối lượng phải truyền và phải giải mã.
     */
    private static final int CANH_TOI_DA = 1600;

    private NhanChiaSe() { }

    /** Kết quả một lượt nhận. `vanBan` và `anh` có thể cùng null. */
    public static final class KetQua {
        public String vanBan;
        /** data URI (`data:image/jpeg;base64,…`) — hình dạng tầng web đang chờ. */
        public String anh;
        /** Lối tắt bác vừa bấm, ví dụ `dang-bi-goi`. */
        public String loiTat;
        /**
         * Ảnh này do NÚT CHỤP MÀN HÌNH của bong bóng nổi tạo ra (không phải ảnh bác chia sẻ sang).
         * Tầng web dùng cờ này để đặt ảnh vào ô xem trước và ĐỢI BÁC BẤM "Kiểm tra" — chụp màn hình
         * có thể chứa thứ bác không định gửi, nên nó không tự rời máy (PERMISSIONS-AND-POLICY.md).
         */
        public boolean tuChup;
        /**
         * ⚠️ §4.3 — MÃ HỎNG, KHÔNG PHẢI SỰ IM LẶNG.
         * Ảnh quá to, không đọc được, không giải mã được: ba ca khác nhau. Trả
         * về null trơn là để màn hình nói "chưa thấy dấu hiệu rủi ro" về một thứ
         * chưa hề đọc được.
         */
        public String maLoi;
    }

    /**
     * Bóc nội dung từ một Intent.
     *
     * ⚠️ TRẢ VỀ `null` CHỈ KHI INTENT KHÔNG LIÊN QUAN. Intent CÓ liên quan mà
     * hỏng thì trả về KetQua có `maLoi` — hai ca đó khác nhau.
     */
    public static KetQua boc(Intent intent, ContentResolver kho) {
        if (intent == null) return null;

        // ── Lối tắt / deep link ──
        Uri data = intent.getData();
        if (Intent.ACTION_VIEW.equals(intent.getAction())
                && data != null && "khoanda".equals(data.getScheme())) {
            KetQua r = new KetQua();
            // khoanda://loi-tat/dang-bi-goi  →  "dang-bi-goi"
            r.loiTat = data.getLastPathSegment();
            /*
             * 30/10/2026 — ẢNH VỪA CHỤP TỪ NÚT NỔI. Không phải lối tắt điều hướng: đây là NỘI DUNG,
             * nên đổi thành `anh` để tầng web đưa vào đúng đường "bác chia sẻ một ảnh sang" (cùng
             * `handleAnalyze`, cùng nhãn §4.3). Lấy MỘT LẦN rồi xoá — xem `ChupManHinh.layVaXoa`.
             * Ảnh đã mất (app chạy lại sau khi đã lấy) ⇒ báo mã lỗi, không giả vờ là có ảnh.
             */
            if (ChupManHinh.LOI_TAT.equals(r.loiTat)) {
                r.loiTat = null;
                r.anh = ChupManHinh.layVaXoa();
                r.tuChup = true;
                if (r.anh == null) r.maLoi = "KHONG_CHUP_DUOC";
            }
            return r;
        }

        if (!Intent.ACTION_SEND.equals(intent.getAction())) return null;

        KetQua r = new KetQua();

        String chu = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (chu != null && !chu.trim().isEmpty()) {
            // §6.10 — trần văn bản, khớp máy chủ.
            r.vanBan = chu.length() > 5000 ? chu.substring(0, 5000) : chu;
        }

        Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri != null) {
            try {
                r.anh = docAnh(uri, kho);
                if (r.anh == null) r.maLoi = "ANH_QUA_LON";
            } catch (SecurityException e) {
                // Quyền đọc URI đã hết hạn — xảy ra khi app gửi bị đóng trước.
                r.maLoi = "KHONG_DOC_DUOC_ANH";
            } catch (Exception e) {
                r.maLoi = "KHONG_DOC_DUOC_ANH";
            }
        }

        // Không có gì dùng được VÀ không có lỗi nào ⇒ intent này không liên quan.
        if (r.vanBan == null && r.anh == null && r.maLoi == null) return null;
        return r;
    }

    /**
     * Đọc ảnh, thu nhỏ, trả về data URI.
     *
     * ⚠️ ĐỌC KÍCH THƯỚC TRƯỚC KHI ĐỌC ĐIỂM ẢNH. `inJustDecodeBounds` cho biết
     * ảnh to bao nhiêu mà KHÔNG cấp phát bộ nhớ. Bỏ bước này thì một ảnh 8000px
     * ném `OutOfMemoryError` ngay ở lượt giải mã, và app tự tắt — người dùng chỉ
     * thấy màn hình về desktop, không có lời giải thích nào.
     */
    private static String docAnh(Uri uri, ContentResolver kho) throws Exception {
        BitmapFactory.Options doThu = new BitmapFactory.Options();
        doThu.inJustDecodeBounds = true;
        try (InputStream in = kho.openInputStream(uri)) {
            if (in == null) return null;
            BitmapFactory.decodeStream(in, null, doThu);
        }
        if (doThu.outWidth <= 0 || doThu.outHeight <= 0) return null;

        int canh = Math.max(doThu.outWidth, doThu.outHeight);
        int buoc = 1;
        while (canh / buoc > CANH_TOI_DA) buoc *= 2;

        BitmapFactory.Options doc = new BitmapFactory.Options();
        doc.inSampleSize = buoc;
        Bitmap anh;
        try (InputStream in = kho.openInputStream(uri)) {
            if (in == null) return null;
            anh = BitmapFactory.decodeStream(in, null, doc);
        }
        if (anh == null) return null;

        ByteArrayOutputStream ra = new ByteArrayOutputStream();
        anh.compress(Bitmap.CompressFormat.JPEG, 82, ra);
        anh.recycle();

        byte[] b = ra.toByteArray();
        if (b.length > TRAN_BYTE) return null;   // §6.10 — gọi hàm sẽ khai ANH_QUA_LON

        return "data:image/jpeg;base64," + Base64.encodeToString(b, Base64.NO_WRAP);
    }
}
