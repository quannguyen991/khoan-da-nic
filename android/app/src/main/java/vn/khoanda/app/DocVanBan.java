package vn.khoanda.app;

import android.content.Context;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.Locale;

/**
 * ══════════ ĐỌC TO KẾT QUẢ — BỘ ĐỌC CỦA MÁY, KHÔNG PHẢI CỦA TRÌNH DUYỆT ══════════
 *
 * Người dùng báo 20/8/2026: "ấn cái read aloud thì nó chưa hoạt động ở app".
 *
 * Tầng web gọi `window.speechSynthesis`. Trên Chrome thì chạy; trong WebView của
 * Android thì API đó KHÔNG CÓ, hoặc có mà `speak()` không phát ra tiếng nào.
 * Và nó hỏng IM LẶNG: `'speechSynthesis' in window` vẫn true ở vài bản WebView,
 * `speak()` trả về bình thường, chỉ là không ai nghe thấy gì.
 *
 * ⚠️ ĐÂY LÀ TÍNH NĂNG TIẾP CẬN, KHÔNG PHẢI TIỆN NGHI. Người đọc chữ khó — mắt
 * kém, hoặc đang hoảng và không đọc nổi — thì đây là đường DUY NHẤT để biết kết
 * quả. Hỏng im lặng ở đúng nhóm người cần nó nhất.
 *
 * ⚠️ KHAI THẬT KHI MÁY KHÔNG ĐỌC ĐƯỢC TIẾNG VIỆT. `LANG_MISSING_DATA` và
 * `LANG_NOT_SUPPORTED` là hai ca có thật và rất phổ biến trên máy giá rẻ. §4.3 —
 * không được nuốt im rồi để bác ngồi chờ một giọng nói không bao giờ tới.
 * Trả về mã lỗi có tên để tầng web nói ra và đưa ra lối đi tiếp.
 *
 * ⚠️ KHÔNG GIỮ LẠI GÌ. Chữ đi vào, tiếng đi ra, không ghi tệp, không gửi đâu.
 * Bộ đọc của Android chạy trên máy (§6.9).
 */
final class DocVanBan {

    interface KetQua {
        void xong();
        void hong(String ma);
    }

    private static TextToSpeech boDoc;
    private static boolean sanSang = false;
    /** Bộ đọc đang dùng: null = mặc định của máy. */
    private static String boDocDangDung = null;

    /**
     * ⚠️ BỘ ĐỌC MẶC ĐỊNH CỦA NHIỀU MÁY KHÔNG CÓ TIẾNG VIỆT — thêm 23/9/2026.
     * Samsung đặt "Samsung TTS" làm mặc định, và bộ đó không có giọng Việt; trong
     * khi cùng máy thường có sẵn bộ đọc Google CÓ giọng Việt. Mặc định thiếu tiếng
     * Việt thì thử bộ Google một lần trước khi báo thiếu giọng.
     */
    private static final String BO_DOC_GOOGLE = "com.google.android.tts";

    private DocVanBan() { }

    /**
     * Đọc to một đoạn chữ.
     *
     * ⚠️ KHỞI TẠO LÀ BẤT ĐỒNG BỘ. `new TextToSpeech(...)` trả về ngay nhưng chưa
     * dùng được — phải đợi `onInit`. Gọi `speak()` trước lúc đó thì không có
     * tiếng nào và cũng không có lỗi nào. Nên mọi thứ nằm trong callback.
     */
    static void doc(Context ctx, String chu, String ngonNgu, KetQua goiLai) {
        if (chu == null || chu.trim().isEmpty()) { goiLai.hong("KHONG_CO_CHU"); return; }

        final Locale noi = ngonNgu != null && ngonNgu.toLowerCase().startsWith("en")
                ? Locale.US : new Locale("vi", "VN");

        if (boDoc != null && sanSang) { phat(ctx, chu, noi, goiLai); return; }
        khoiTao(ctx, null, chu, noi, goiLai);
    }

    private static void khoiTao(Context ctx, String boDocMuon, String chu, Locale noi, KetQua goiLai) {
        dung();
        boDocDangDung = boDocMuon;
        TextToSpeech.OnInitListener khiSan = trangThai -> {
            if (trangThai != TextToSpeech.SUCCESS) {
                sanSang = false;
                if (boDocMuon == null && coBoDocGoogle()) { khoiTao(ctx, BO_DOC_GOOGLE, chu, noi, goiLai); return; }
                goiLai.hong("MAY_KHONG_CO_BO_DOC");
                return;
            }
            sanSang = true;
            phat(ctx, chu, noi, goiLai);
        };
        boDoc = boDocMuon == null
                ? new TextToSpeech(ctx.getApplicationContext(), khiSan)
                : new TextToSpeech(ctx.getApplicationContext(), khiSan, boDocMuon);
    }

    /** Máy có bộ đọc Google không, và bộ đang dùng chưa phải nó. */
    private static boolean coBoDocGoogle() {
        if (BO_DOC_GOOGLE.equals(boDocDangDung) || boDoc == null) return false;
        try {
            for (TextToSpeech.EngineInfo e : boDoc.getEngines()) {
                if (BO_DOC_GOOGLE.equals(e.name)) return true;
            }
        } catch (Throwable ignored) { }
        return false;
    }

    private static void phat(Context ctx, String chu, Locale noi, KetQua goiLai) {
        try {
            int ket = boDoc.setLanguage(noi);
            if (ket == TextToSpeech.LANG_MISSING_DATA || ket == TextToSpeech.LANG_NOT_SUPPORTED) {
                if (coBoDocGoogle()) { khoiTao(ctx, BO_DOC_GOOGLE, chu, noi, goiLai); return; }
                /*
                 * ⚠️ TIẾNG VIỆT THIẾU THÌ KHÔNG ĐƯỢC ÂM THẦM ĐỌC BẰNG GIỌNG ANH.
                 * Giọng Anh đọc chữ Việt ra một tràng vô nghĩa, và bác sẽ tưởng
                 * app hỏng chứ không biết là thiếu gói giọng. Nói thẳng ra —
                 * tầng web nhận mã này thì nhờ máy chủ đọc giọng Việt.
                 */
                goiLai.hong("MAY_CHUA_CO_GIONG");
                return;
            }
            boDoc.setSpeechRate(0.92f);   // chậm hơn mặc định một chút — người cao tuổi
            boDoc.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { goiLai.xong(); }
                @Override public void onError(String id) { goiLai.hong("DOC_HONG"); }
            });
            boDoc.speak(chu, TextToSpeech.QUEUE_FLUSH, null, "khoan-da");
        } catch (Throwable t) {
            goiLai.hong("DOC_HONG");
        }
    }

    static void dungDoc() {
        try { if (boDoc != null) boDoc.stop(); } catch (Throwable ignored) { }
    }

    static void dung() {
        try { if (boDoc != null) { boDoc.stop(); boDoc.shutdown(); } } catch (Throwable ignored) { }
        boDoc = null;
        sanSang = false;
    }
}
