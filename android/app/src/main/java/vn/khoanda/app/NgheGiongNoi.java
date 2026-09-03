package vn.khoanda.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import java.util.ArrayList;

/**
 * NGHE GIỌNG NÓI — CHỈ TRÊN MÁY, KHÔNG BAO GIỜ QUA MẠNG.
 *
 * ⚠️ §6.9 / §12 — GIỌNG NGƯỜI DÙNG KHÔNG ĐƯỢC RỜI KHỎI MÁY.
 * Vì thế lớp này CHỈ dùng `createOnDeviceSpeechRecognizer`. Không có
 * `createSpeechRecognizer` ở đâu trong file này, và đừng thêm vào: bản thường
 * gửi âm thanh lên máy chủ Google, và đó là đổi privacy model — §12 nói phải
 * hỏi người dùng chứ không được tự làm.
 *
 * Máy không có bộ nghe trên máy ⇒ TỪ CHỐI, trả `CHUA_TAI_MODEL`. Tầng web hiện
 * "chưa có bộ nghe trên máy". Đó là lựa chọn đã chốt: thà nút ghi âm báo không
 * dùng được, còn hơn im lặng gửi giọng bác đi nơi khác.
 *
 * ⚠️ §4.2 — LỚP NÀY KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO. Nó trả chữ và độ tin cậy.
 * Không so keyword, không chấm điểm. Thêm một dòng `if (chu.contains("OTP"))`
 * là tạo đường quyết định thứ hai — §12 cấm.
 *
 * ⚠️ §4.3 — HỎNG THÌ TRẢ MÃ, ĐỪNG TRẢ CHUỖI RỖNG.
 * "Không nghe được" khác "nghe rồi, không có gì". Trả chuỗi rỗng rồi để tầng
 * trên đoán là đúng con bug §4.3 mô tả.
 */
final class NgheGiongNoi {

    /** Mã lỗi khớp `MA_LOI_GHI_AM` trong src/analysis/pipeline.js. Đổi thì đổi cả hai. */
    static final String CHUA_TAI_MODEL = "CHUA_TAI_MODEL";
    static final String KHONG_CO_TIENG_NOI = "KHONG_CO_TIENG_NOI";

    interface KetQua {
        /** @param doTinCay điểm THẤP NHẤT trong các phương án, hoặc -1 nếu máy không chấm. */
        void xong(String vanBan, float doTinCay);
        void hong(String maLoi);
    }

    private NgheGiongNoi() {}

    /**
     * Phần chữ nghe được TÍNH TỚI LÚC NÀY của lượt đang chạy.
     *
     * ⚠️ TĨNH VÌ CHỈ CÓ MỘT LƯỢT NGHE TẠI MỘT THỜI ĐIỂM — `chayNghe` gọi
     * `dungBoNghe()` trước khi mở lượt mới. Thêm lượt song song thì phải đổi
     * chỗ này trước.
     */
    private static String[] phanDaNghe = null;

    /** @return chữ nghe được tới lúc này, hoặc null nếu chưa có gì. */
    static String phanDaNghe() {
        return phanDaNghe == null ? null : phanDaNghe[0];
    }

    /**
     * Máy này có bộ nghe CHẠY TRÊN MÁY cho tiếng Việt không?
     *
     * ⚠️ `isOnDeviceRecognitionAvailable` chỉ có từ API 33. Android 12 (API 31)
     * đã có `createOnDeviceSpeechRecognizer` nhưng KHÔNG có cách hỏi trước, nên
     * ở đó ta sẽ phải tạo rồi chờ lỗi — mà "tạo rồi chờ lỗi" nghĩa là micro đã
     * bật trước khi biết có dùng được không. Nên chặn từ API 33 trở lên.
     *
     * Thà nói "máy bác chưa có bộ nghe" còn hơn bật micro rồi mới báo hỏng.
     */
    static boolean coBoNgheTrenMay(Context ctx) {
        return "CO".equals(lyDoKhongNghe(ctx));
    }

    /**
     * VÌ SAO MÁY NÀY KHÔNG NGHE ĐƯỢC — TRẢ VỀ LÝ DO, KHÔNG CHỈ true/false.
     *
     * ⚠️ ĐO ĐƯỢC 16/8/2026: người dùng báo "ghi âm không hoạt động" ba lượt
     * liên tiếp, và không lượt nào ta biết được VÌ SAO — màn chỉ hiện một câu
     * chung chung "máy bác chưa có bộ nghe". Ba nguyên nhân hoàn toàn khác nhau
     * cùng dồn vào một câu, nên không sửa được cái nào.
     *
     * Đây đúng là §4.3 ở tầng chẩn đoán: gộp nhiều ca "không làm được" thành
     * một thông báo thì mất luôn thông tin cần để sửa.
     *
     *   ANDROID_QUA_CU  — dưới Android 13, không có API hỏi trước
     *   MAY_CHUA_CAI    — có API, nhưng máy chưa cài gói nghe ngoại tuyến
     *   CO              — dùng được
     */
    static String lyDoKhongNghe(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return "ANDROID_QUA_CU";
        if (!SpeechRecognizer.isOnDeviceRecognitionAvailable(ctx)) return "MAY_CHUA_CAI";
        return "CO";
    }

    /**
     * Bắt đầu nghe. PHẢI gọi trên luồng chính — `SpeechRecognizer` bắt buộc thế.
     *
     * @param ngonNgu thẻ BCP-47, tầng web truyền xuống theo ngôn ngữ đang chọn.
     *                KHÔNG mã cứng "vi-VN" ở đây: §4.1 nói chuỗi người dùng thấy
     *                đến từ catalog, và ngôn ngữ nhận dạng phải đi theo nó.
     */
    static SpeechRecognizer batDau(Context ctx, String ngonNgu, KetQua goiLai) {
        if (!coBoNgheTrenMay(ctx)) {
            /*
             * ⚠️ XOÁ PHẦN CHỮ CỦA LƯỢT TRƯỚC. Không xoá thì `dungNghe` của lượt
             * này đọc phải chữ của lượt trước và trả nó ra như thể vừa nghe được
             * — bịa ra một lượt ghi âm chưa từng xảy ra (§4.3).
             */
            phanDaNghe = null;
            goiLai.hong(CHUA_TAI_MODEL);
            return null;
        }

        SpeechRecognizer bo = SpeechRecognizer.createOnDeviceSpeechRecognizer(ctx);

        /*
         * ⚠️ MẢNG MỘT PHẦN TỬ, không phải biến thường: lớp ẩn danh bên dưới chỉ
         * bắt được biến `final`. Đây là cách chuẩn để nó ghi ngược ra ngoài.
         */
        final String[] tungPhan = { null };
        phanDaNghe = tungPhan;

        Intent y = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        y.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        y.putExtra(RecognizerIntent.EXTRA_LANGUAGE, ngonNgu);
        // Thắt lưng thêm quần: bộ nghe trên máy vốn không ra mạng, cờ này chặn
        // luôn mọi đường rơi về bản đám mây nếu Android đổi hành vi sau này.
        y.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        y.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);

        /*
         * ⚠️ THIẾU CỜ NÀY THÌ `onPartialResults` KHÔNG BAO GIỜ NỔ — 16/8/2026.
         *
         * `onPartialResults` bên dưới là thứ DUY NHẤT giữ lại chữ khi bác bấm
         * Dừng giữa chừng. Nhưng Android chỉ gửi kết quả từng phần khi được YÊU
         * CẦU; mặc định là không. Nên `phanDaNghe()` luôn trả `null`, và nút Dừng
         * — sau khi đã sửa cho nó kết thúc được lượt — vẫn trả về một lượt rỗng
         * kèm `KHONG_CO_TIENG_NOI`.
         *
         * Với bác thì đó vẫn là "nói xong, bấm dừng, không có chữ nào". Một nửa
         * bản vá không phải là bản vá.
         */
        y.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);

        /*
         * ⚠️ §4.5 — NGƯỜI CAO TUỔI NÓI CHẬM VÀ NGẮT QUÃNG.
         *
         * Mặc định của Android cắt lượt sau khoảng 0,7–1 giây im lặng. Bác kể một
         * tình huống thì dừng lại nghĩ là chuyện thường — và mỗi lần dừng nghĩ là
         * một lần bộ nghe tưởng đã nói xong. Kết quả: chỉ bắt được vế đầu, đúng
         * lúc vế sau ("…rồi họ bảo tôi chuyển tiền") mới là vế quan trọng.
         *
         * 2,5 giây là khoảng dài hơn một nhịp nghĩ nhưng ngắn hơn một lần bỏ cuộc.
         * ⚠️ Đây là GỢI Ý, không phải lệnh: nhiều ROM bỏ qua ba cờ này. Nên nút
         * Dừng vẫn phải tự chạy được — xem `KhoanDaPlugin.dungNghe`.
         */
        y.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        y.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        y.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 2000L);

        bo.setRecognitionListener(new RecognitionListener() {
            @Override public void onResults(Bundle ket) {
                ArrayList<String> ds = ket.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (ds == null || ds.isEmpty() || ds.get(0).trim().isEmpty()) {
                    goiLai.hong(KHONG_CO_TIENG_NOI);
                    return;
                }

                /**
                 * ⚠️ §4.3 — LẤY ĐIỂM THẤP NHẤT, KHÔNG LẤY TRUNG BÌNH.
                 * Nghe được 90% mà nuốt đúng câu "chuyển sang tài khoản an toàn"
                 * thì bản chép còn lại trông sạch sẽ. Trung bình che mất đúng ca
                 * nguy hiểm nhất.
                 *
                 * ⚠️ Máy KHÔNG chấm điểm ⇒ trả -1, KHÔNG trả 1.0.
                 * Thiếu số đo khác đo rồi thấy tốt. Tầng web có mã riêng cho ca
                 * này và sẽ nói thẳng là chưa đo được.
                 */
                float[] diem = ket.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
                float thapNhat = -1f;
                if (diem != null && diem.length > 0) {
                    thapNhat = 1f;
                    for (float d : diem) if (d < thapNhat) thapNhat = d;
                }
                goiLai.xong(ds.get(0), thapNhat);
            }

            @Override public void onError(int ma) {
                if (ma == SpeechRecognizer.ERROR_NO_MATCH
                        || ma == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                    goiLai.hong(KHONG_CO_TIENG_NOI);
                    return;
                }
                if (ma == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE
                        || ma == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED) {
                    goiLai.hong(CHUA_TAI_MODEL);
                    return;
                }
                // ⚠️ Mã lạ KHÔNG được nuốt. Không mã nào ⇒ tầng web rơi về
                // `khong_nghe_duoc_ghi_am`, tức vẫn nói ra, không im lặng.
                goiLai.hong(null);
            }

            @Override public void onReadyForSpeech(Bundle p) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float r) {}
            @Override public void onBufferReceived(byte[] b) {}
            @Override public void onEndOfSpeech() {}

            /**
             * ⚠️ GIỮ KẾT QUẢ TỪNG PHẦN — CẦN CHO NÚT "DỪNG".
             *
             * Bác bấm Dừng giữa chừng thì `onResults` có thể KHÔNG BAO GIỜ nổ:
             * `stopListening()` chỉ ngắt micro. Không giữ lại gì thì lượt đó mất
             * trắng — bác nói xong, bấm dừng, và không có chữ nào.
             *
             * ⚠️ Đây là bản CHƯA HOÀN CHỈNH, nên khi dùng tới nó thì báo mã
             * `BI_CAT` — §4.3: "nghe được một phần" KHÁC "nghe xong".
             */
            @Override public void onPartialResults(Bundle p) {
                ArrayList<String> ds = p.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (ds != null && !ds.isEmpty() && !ds.get(0).trim().isEmpty()) {
                    tungPhan[0] = ds.get(0);
                }
            }

            @Override public void onEvent(int t, Bundle p) {}
        });

        bo.startListening(y);
        return bo;
    }
}
