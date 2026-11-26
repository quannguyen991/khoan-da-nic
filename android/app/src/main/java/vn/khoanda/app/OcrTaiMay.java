package vn.khoanda.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/**
 * NHẬN DIỆN CHỮ TRÊN THIẾT BỊ (ON-DEVICE OCR OFFLINE — ML Kit Text Recognition).
 *
 * ══════════ RÀNG BUỘC RIÊNG TƯ & §4.3 ══════════
 * - Chạy 100% trên thiết bị (offline), không gửi ảnh ra ngoài khi đang OCR.
 * - CHỈ nhận một ảnh duy nhất từ luồng chụp màn hình (`MediaProjection` 1 khung hình)
 *   hoặc ảnh người dùng chủ động chia sẻ (`ACTION_SEND`).
 * - TUYỆT ĐỐI KHÔNG quét ngầm thư viện ảnh cá nhân (`MediaStore` / `READ_MEDIA_IMAGES`).
 * - Chỉ bóc chữ và chạy sàng lọc Tầng 0 (`DocThongBao.laTinDangKiem`); không tự ra nhãn rủi ro (§4.2).
 * - Hỏng ⇒ trả về `docDuoc = false` kèm mã lỗi (§4.3), không im lặng coi như ảnh sạch.
 */
public final class OcrTaiMay {

    public interface KetQua {
        void xong(String vanBan, boolean dangKiem, boolean coTinHieuTien);
        void hong(String maLoi);
    }

    private OcrTaiMay() { }

    /** Giải mã data URI (`data:image/...;base64,...`) trong bộ nhớ rồi chạy ML Kit OCR offline. */
    public static void nhanDienTuDataUri(String dataUri, KetQua cb) {
        if (cb == null) return;
        if (dataUri == null || dataUri.isEmpty()) {
            cb.hong("THIEU_ANH");
            return;
        }
        Bitmap bmp = null;
        try {
            int phay = dataUri.indexOf(',');
            String b64 = phay >= 0 ? dataUri.substring(phay + 1) : dataUri;
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
            int maxDim = Math.max(opts.outWidth, opts.outHeight);
            int sample = 1;
            while (maxDim / sample > 1920) sample *= 2;
            opts.inJustDecodeBounds = false;
            opts.inSampleSize = sample;
            bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, opts);
            if (bmp == null) {
                cb.hong("KHONG_GIAI_MA_DUOC_ANH");
                return;
            }
            final Bitmap anhCuoi = bmp;
            InputImage img = InputImage.fromBitmap(anhCuoi, 0);
            TextRecognizer recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
            recognizer.process(img)
                    .addOnSuccessListener(res -> {
                        try {
                            String vanBan = res == null || res.getText() == null ? "" : res.getText().trim();
                            boolean dangKiem = DocThongBao.laTinDangKiem(vanBan);
                            boolean coTien = DocThongBao.coTinHieuTienHoacLink(vanBan);
                            cb.xong(vanBan, dangKiem, coTien);
                        } finally {
                            try { anhCuoi.recycle(); } catch (Throwable ignored) { }
                            try { recognizer.close(); } catch (Throwable ignored) { }
                        }
                    })
                    .addOnFailureListener(e -> {
                        try { anhCuoi.recycle(); } catch (Throwable ignored) { }
                        try { recognizer.close(); } catch (Throwable ignored) { }
                        cb.hong("OCR_THAT_BAI");
                    });
        } catch (Throwable t) {
            if (bmp != null) try { bmp.recycle(); } catch (Throwable ignored) { }
            cb.hong("OCR_THAT_BAI");
        }
    }
}
