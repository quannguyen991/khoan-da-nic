package vn.khoanda.app;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.net.Uri;
import android.telephony.TelephonyManager;

/**
 * ══════════ TỰ BẬT ĐÚNG KHOẢNH KHẮC — Phần 4 "Cầu dao gia đình", 23/9/2026 ══════════
 *
 * Mọi cảnh báo khác chờ bác MỞ APP. Nhưng lúc bị lừa, bác đang áp máy vào tai và
 * sẽ không mở gì cả. Hai tổ hợp dưới đây gần như chỉ xảy ra khi có người đang
 * dắt bác qua điện thoại — nên máy tự mở màn cảnh báo, không đợi bác:
 *
 *   ① đang gọi (hoặc vừa gác máy ≤ 2 phút) + tin nhắn có MÃ (OTP) vừa tới
 *      Ngân hàng không bao giờ gọi điện xin OTP. Ai đang gọi mà xin mã là lừa.
 *   ② đang gọi (hoặc vừa gác máy ≤ 2 phút) + vừa CÀI ỨNG DỤNG MỚI
 *      Kịch bản "cài app của Bộ Công an / ngân hàng để xác minh".
 *
 * ⚠️ KHÔNG BIẾT AI GỌI. Chỉ đọc "máy có đang trong cuộc gọi" (READ_PHONE_STATE,
 * đã có). Không số, không nhật ký cuộc gọi, không danh bạ — xem TheoDoiCuocGoi.
 *
 * ⚠️ CUỘC GỌI ZALO / MESSENGER / VIBER — thêm 23/9/2026. `TelephonyManager` chỉ
 * thấy cuộc gọi DI ĐỘNG. Ở Việt Nam rất nhiều vụ giả danh công an gọi qua Zalo —
 * và khi đó tổ hợp "đang gọi + mã" không bao giờ nổ. Chế độ âm thanh của máy
 * (`AudioManager.getMode()`) chuyển sang IN_COMMUNICATION khi BẤT KỲ app nào đang
 * gọi thoại qua mạng. Không cần quyền gì thêm, và vẫn không biết app nào, ai gọi.
 * Họp video (Meet, Zoom) cũng bật chế độ này — chấp nhận được, vì tự bật còn cần
 * thêm tin có MÃ hoặc app mới cài; một mình cuộc gọi không làm gì cả.
 * ⚠️ §4.2 — KHÔNG RA NHÃN. Màn mở ra là lượt "dừng lại" (không nhãn rủi ro), với
 * một câu lệnh và nút gọi con. Bộ luật chỉ chạy khi bác bấm kiểm.
 * ⚠️ §6.9 — KHÔNG GỬI NỘI DUNG ĐI ĐÂU. Mã và tin nhắn nằm yên trên máy.
 * ⚠️ §4.6 — một lần mỗi 2 phút, và màn mở ra luôn có "Tôi ổn".
 */
final class CuocGoi {

    /** "Vừa gác máy": kẻ gian hay dặn "cúp máy đi, lát tôi nhắn mã" — mã tới ngay sau. */
    static final long VUA_GAC_MAY_MS = 2 * 60 * 1000L;
    /** Không tự bật lại trong 2 phút — mở màn liên tục làm người ta hoảng thêm. */
    static final long GIAN_CACH_BAT_MS = 2 * 60 * 1000L;

    /** TheoDoiCuocGoi ghi lúc máy chuyển về IDLE. Chỉ một con số thời gian, không gì khác. */
    static volatile long lucGacMay = 0L;
    /**
     * Nhịp 2 phút RIÊNG cho từng loại — sửa 23/9/2026. Dùng chung một nhịp thì cảnh
     * báo OTP vừa bật một phút trước sẽ nuốt mất cảnh báo "tiền vừa ra", đúng lúc nó gấp nhất.
     */
    private static final java.util.Map<String, Long> LAN_BAT = new java.util.concurrent.ConcurrentHashMap<>();

    private CuocGoi() {}

    static boolean dangGoi(Context ctx) {
        return dangGoiDiDong(ctx) || dangGoiQuaMang(ctx);
    }

    static boolean dangGoiDiDong(Context ctx) {
        try {
            TelephonyManager tm = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
            return tm != null && tm.getCallState() == TelephonyManager.CALL_STATE_OFFHOOK;
        } catch (SecurityException e) {
            // Chưa cấp READ_PHONE_STATE: không biết thì coi như KHÔNG — không tự bật mù.
            return false;
        } catch (Throwable t) {
            return false;
        }
    }

    /** Chế độ âm thanh của một cuộc gọi: di động (IN_CALL) hoặc qua mạng (IN_COMMUNICATION). */
    static boolean laCheDoGoi(int cheDo) {
        return cheDo == AudioManager.MODE_IN_CALL || cheDo == AudioManager.MODE_IN_COMMUNICATION;
    }

    static boolean dangGoiQuaMang(Context ctx) {
        try {
            AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            return am != null && laCheDoGoi(am.getMode());
        } catch (Throwable t) {
            return false;
        }
    }

    static boolean dangHoacVuaGoi(Context ctx, long bayGio) {
        return dangGoi(ctx) || (lucGacMay > 0 && bayGio - lucGacMay < VUA_GAC_MAY_MS);
    }

    /**
     * Mở màn cảnh báo ngay, kèm thông báo heads-up làm lưới đỡ.
     *
     * ⚠️ MỞ MÀN TỪ NỀN CẦN QUYỀN "HIỆN TRÊN ỨNG DỤNG KHÁC". Android 10+ chặn mở
     * activity từ nền, trừ app đã được cấp SYSTEM_ALERT_WINDOW. Chưa cấp thì chỉ
     * còn thông báo heads-up — vẫn hiện, nhưng bác phải chạm.
     * ⚠️ Câu chữ lấy từ strings.xml theo ngôn ngữ máy (§4.1) — Java không tự soạn.
     */
    static void batManCanhBao(Context ctx, String loiTat, int tieuDeRes, int noiDungRes) {
        long bayGio = System.currentTimeMillis();
        Long truoc = LAN_BAT.get(loiTat);
        if (truoc != null && bayGio - truoc < GIAN_CACH_BAT_MS) return;
        LAN_BAT.put(loiTat, bayGio);

        String dich = "khoanda://loi-tat/" + loiTat;
        if (PopupDeManHinh.daBatQuyen(ctx)) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(dich), ctx, MainActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                ctx.startActivity(i);
            } catch (Throwable t) {
                // ROM chặn — còn thông báo bên dưới.
            }
        }
        try {
            ThongBaoCanhBao.hien(ctx, ctx.getString(tieuDeRes), ctx.getString(noiDungRes), dich);
        } catch (Throwable t) {
            // Không hiện được thì thôi — không để bước phụ làm chết bước chính.
        }
    }
}
