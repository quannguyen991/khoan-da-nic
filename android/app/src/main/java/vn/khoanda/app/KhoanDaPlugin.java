package vn.khoanda.app;

import android.Manifest;
import android.os.Build;
import android.content.Intent;
import android.app.NotificationManager;
import android.app.NotificationChannel;
import android.app.Notification;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

/**
 * CẦU NỐI GIỮA TẦNG WEB VÀ HAI TÍNH NĂNG NATIVE.
 *
 * ⚠️ §4.2 — LỚP NÀY KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO.
 * Nó chỉ đưa nội dung thô lên cho tầng web, và tầng web gửi sang bộ luật. Không
 * có chỗ nào ở đây chấm điểm, xếp mức, hay quyết định có hiện cảnh báo không.
 * Thêm một dòng `if (noiDung.contains("OTP"))` vào đây là tạo đường quyết định
 * thứ hai — §12 cấm thẳng.
 *
 * ⚠️ §11 — LỚP NÀY KHÔNG SOẠN CÂU. Chữ hiện trong popup do tầng web truyền
 * xuống, đã qua catalog i18n. Không mã cứng chuỗi tiếng Việt nào ở đây.
 *
 * ⚠️ CHƯA BIÊN DỊCH ĐƯỢC TRÊN MÁY DỰNG (không có JDK/Android SDK). Mở bằng
 * Android Studio và sửa lỗi biên dịch trước khi tin là nó chạy.
 */
/**
 * ⚠️ QUYỀN MICRO XIN LÚC CHẠY, không xin lúc cài. Người dùng từ chối là chuyện
 * bình thường — nút ghi âm báo không dùng được, và ĐƯỜNG GÕ VĂN BẢN VẪN CHẠY.
 * §6.7: không tính năng phụ nào được chặn đường kiểm tin nhắn.
 */
@CapacitorPlugin(
        name = "KhoanDa",
        permissions = {
                @Permission(alias = "micro", strings = { Manifest.permission.RECORD_AUDIO }),
                /*
                 * ⚠️ THIẾU ALIAS NÀY LÀ LÝ DO THÔNG BÁO "BẬT ĐƯỢC" MÀ KHÔNG HIỆN.
                 *
                 * Từ Android 13, `POST_NOTIFICATIONS` là quyền XIN LÚC CHẠY. Chưa
                 * xin thì `NotificationManager.notify()` KHÔNG NÉM GÌ CẢ — nó chỉ
                 * lặng lẽ không hiện. Nên `ThongBaoThuongTruc.bat()` trả `true`,
                 * công tắc lật sang "bật", và trên thanh thông báo không có gì.
                 *
                 * Đó chính là dạng §4.3 tệ nhất: không phải "không làm được" mà là
                 * "báo là làm được trong khi không làm được". Bác tin rằng có một
                 * lối tắt đang chờ sẵn lúc bị gọi thúc, và lúc cần thì không có.
                 *
                 * ⚠️ CHỈ XIN TỪ API 33 TRỞ LÊN — xem `datThongBaoThuongTruc`.
                 * Máy Android 12 trở xuống không có quyền này; hỏi ở đó thì
                 * Capacitor trả DENIED vĩnh viễn và công tắc không bao giờ bật
                 * được, trên chính những máy mà nó vốn chạy tốt.
                 */
                @Permission(alias = "thongBao", strings = { "android.permission.POST_NOTIFICATIONS" }),
                /*
                 * ⚠️ CHỈ `READ_PHONE_STATE`, KHÔNG KÈM `READ_CALL_LOG`.
                 * Nó cho biết máy có đang trong cuộc gọi hay không — không nội
                 * dung, không số điện thoại, không lịch sử. Xem chú thích trong
                 * `TheoDoiCuocGoi.java` về vì sao cố ý không xin quyền kia.
                 */
                @Permission(alias = "cuocGoi", strings = { Manifest.permission.READ_PHONE_STATE })
        }
)
public class KhoanDaPlugin extends Plugin {

    // ─────────── Đọc thông báo (§15.4) ───────────

    @PluginMethod
    public void trangThaiQuyenDocThongBao(PluginCall call) {
        JSObject r = new JSObject();
        r.put("daBat", DocThongBao.daBatQuyen(getContext()));
        call.resolve(r);
    }

    /**
     * ⚠️ 16/8/2026 — QUYỀN `POST_NOTIFICATIONS` (Android 13+).
     *
     * Khác với quyền đọc tin nhắn (`trangThaiQuyenDocThongBao` ở trên): đây là
     * quyền được app GỬI thông báo, không phải quyền đọc SMS. Thiếu nó thì mọi
     * lượt gửi đều "thành công" mà không có gì hiện ra — và người dùng tưởng
     * app đang bảo vệ trong khi thực ra câm hoàn toàn.
     *
     * `NotificationManagerCompat.areNotificationsEnabled()` kiểm tra CẢ việc
     * người dùng tắt riêng kênh lẫn việc họ từ chối quyền ở màn hệ thống.
     */
    @PluginMethod
    public void trangThaiQuyenThongBao(PluginCall call) {
        JSObject r = new JSObject();
        boolean daBat = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            daBat = getPermissionState("thongBao") == PermissionState.GRANTED;
        }
        r.put("daBat", daBat);
        call.resolve(r);
    }

    /**
     * Mở màn Cài đặt thông báo riêng của app. Android không có API tự cấp
     * quyền POST_NOTIFICATIONS — bắt buộc người dùng tự bật.
     */
    @PluginMethod
    public void moCaiDatThongBao(PluginCall call) {
        try {
            Intent i = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getContext().getPackageName())
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            // ROM không hỗ trợ ACTION_APP_NOTIFICATION_SETTINGS — rơi về Cài đặt app.
            try {
                Intent i = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                        .setData(android.net.Uri.parse("package:" + getContext().getPackageName()))
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
            } catch (Exception e2) {
                call.reject("KHONG_MO_DUOC_CAI_DAT");
            }
        }
    }

    /**
     * Mở màn Cài đặt hệ thống để người dùng TỰ bật.
     * ⚠️ Không có API nào tự cấp quyền này, và không nên có.
     */
    @PluginMethod
    public void moCaiDatDocThongBao(PluginCall call) {
        getContext().startActivity(DocThongBao.manCaiDat());
        call.resolve();
    }

    /**
     * Lấy tin mới nhất bắt được.
     *
     * ⚠️ §4.3 — TRẢ VỀ CẢ `trangThai`, KHÔNG CHỈ NỘI DUNG.
     * "Đọc được một phần", "không có nội dung", "đã bị xoá" là BA ca khác nhau,
     * và tầng web có mã riêng cho từng ca trong `unreadableInputFloor()`. Trả về
     * chuỗi rỗng rồi để tầng trên đoán là đúng con bug §4.3 mô tả.
     */
    @PluginMethod
    public void layTinMoiNhat(PluginCall call) {
        DocThongBao.Tin t = DocThongBao.moiNhat();
        JSObject r = new JSObject();
        if (t == null) {
            r.put("co", false);
            call.resolve(r);
            return;
        }
        r.put("co", true);
        r.put("tuApp", t.tuApp);
        r.put("noiDung", t.noiDung);
        r.put("trangThai", t.trangThai);   // doc_duoc | chi_doc_duoc_mot_phan_tin | ...
        r.put("luc", t.luc);
        call.resolve(r);
    }

    /** Người dùng tắt tính năng ⇒ xoá sạch bộ đệm, không giữ lại gì (§6.9). */
    @PluginMethod
    public void xoaTinDaBat(PluginCall call) {
        DocThongBao.xoaHet();
        call.resolve();
    }

    // ─────────── Popup đè màn hình ───────────

    @PluginMethod
    public void trangThaiQuyenPopup(PluginCall call) {
        JSObject r = new JSObject();
        r.put("daBat", PopupDeManHinh.daBatQuyen(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void moCaiDatPopup(PluginCall call) {
        getContext().startActivity(PopupDeManHinh.manCaiDat(getContext()));
        call.resolve();
    }

    /**
     * Hiện dải cảnh báo.
     *
     * ⚠️ BA CHUỖI ĐỀU BẮT BUỘC, và đều do tầng web truyền xuống sau khi tra
     * catalog i18n. Thiếu một chuỗi ⇒ TỪ CHỐI, không hiện. §11: thà không hiện
     * còn hơn hiện một câu do lớp native bịa ra.
     *
     * ⚠️ `nutOn` là lối ra của §4.6. Không có nó thì không được hiện popup.
     */
    @PluginMethod
    public void hienPopup(PluginCall call) {
        String tieuDe = call.getString("tieuDe");
        String nutMo = call.getString("nutMo");
        String nutOn = call.getString("nutOn");

        if (tieuDe == null || nutMo == null || nutOn == null) {
            call.reject("THIEU_CHU_HIEN_THI");
            return;
        }
        if (!PopupDeManHinh.daBatQuyen(getContext())) {
            call.reject("CHUA_BAT_QUYEN_POPUP");
            return;
        }
        call.setKeepAlive(true);
        chayTrenUi(call, "POPUP_KHONG_HIEN_DUOC", () -> {
            // Xem chú thích ở `PopupDeManHinh.hien` — bốn mã, bốn cách sửa khác nhau.
            String ma = PopupDeManHinh.hien(getContext(), tieuDe, nutMo, nutOn);
            JSObject r = new JSObject();
            r.put("ket", ma);
            call.resolve(r);
        });
    }

    /**
     * ĐẨY APP XUỐNG NỀN — ĐỂ CÁI DẢI THẬT SỰ Ở "NGOÀI APP".
     *
     * Người dùng báo 21/8/2026: "pop up vẫn chưa hiện bên ngoài". Đo lại thì
     * `addView` KHÔNG hề lỗi — dải có hiện, nhưng bác bấm nút TỪ TRONG APP,
     * nên nó vẽ đè lên chính Khoan Đã và trông hệt như một thành phần của app.
     *
     * Không thể phân biệt "đang vẽ đè toàn hệ thống" với "là một cái div"
     * nếu thứ duy nhất dưới nó là chính app đó.
     *
     * ⚠️ ĐÂY KHÔNG PHẢI HIỆU ỨNG CHO ĐẸP. Đó là sự khác nhau giữa một
     * bằng chứng và một lời tuyên bố. Bản trước của sản phẩm này từng vẽ hẳn
     * một màn hình điện thoại giả để "cho xem popup", và người dùng đã bắt
     * đúng — xem chú thích ở `FloatingQuickAccess`. Lần này dải là thật, nên
     * cách chứng minh cũng phải thật: rời app ra rồi nhìn lại.
     *
     * `moveTaskToBack(true)` đưa app xuống nền giống như bấm nút Home — không
     * đóng, không mất trạng thái, bác mở lại là về đúng chỗ cũ.
     */
    @PluginMethod
    public void dayAppXuong(PluginCall call) {
        chayTrenUi(null, "KHONG_DAY_XUONG_DUOC", () -> {
            android.app.Activity a = getActivity();
            if (a != null) a.moveTaskToBack(true);
        });
        call.resolve();
    }

    @PluginMethod
    public void anPopup(PluginCall call) {
        chayTrenUi(null, "POPUP_KHONG_AN_DUOC", () -> PopupDeManHinh.an(getContext()));
        call.resolve();
    }

    // ─────────── Nghe giọng nói — §4.3 nguồn đầu vào thứ sáu ───────────

    /*
     * ══════ LƯỚI CHO MỌI VIỆC CHẠY TRÊN LUỒNG UI ══════
     *
     * ⚠️ NGOẠI LỆ NÉM TRONG `runOnUiThread` KHÔNG ĐƯỢC CAPACITOR BẮT.
     * Nó đi thẳng lên `Thread.UncaughtExceptionHandler` của Android và GIẾT APP
     * — không hộp thoại, không thông báo, màn hình văng về desktop.
     *
     * Người dùng báo 20/8/2026: "ấn vào phần ghi âm xong cấp quyền thì bị out
     * ra ngoài, cứ ấn vào voice là bị out". Đúng triệu chứng của lỗi này.
     *
     * Hai chỗ hở đo được:
     *   ① `dungNghe`   — `dungBoNghe()` và `resolve()` nằm NGOÀI khối try. Bộ nghe
     *                    đã bị huỷ hoặc tiến trình của ROM chết thì `destroy()` ném.
     *   ② `hienPopup`  — `WindowManager.addView` ném `BadTokenException` khi quyền
     *                    vẽ đè bị thu hồi giữa chừng. Hoàn toàn không có lưới.
     *
     * ⚠️ BẮT `Throwable`, KHÔNG PHẢI `Exception`. `NoSuchMethodError` và
     * `BadTokenException` đều không phải `Exception` ở mọi nhánh — và đây là
     * biên giới ngoài cùng, dưới nó không còn ai để bắt nữa.
     *
     * ⚠️ §4.3 — HUỲ LƯỢT BẰNG MỘT LỖI CÓ TÊN, ĐỪNG NUỐT IM. Nuốt xong
     * thì giao diện đứng mãi ở "Cháu đang nghe…" — đổi một cú sập lấy một
     * cú treo thì không phải là sửa.
     */
    private void chayTrenUi(PluginCall call, String maLoi, Runnable viec) {
        final android.app.Activity hoatDong = getActivity();
        if (hoatDong == null) {
            if (call != null) call.reject(maLoi);
            return;
        }
        hoatDong.runOnUiThread(() -> {
            try {
                viec.run();
            } catch (Throwable t) {
                android.util.Log.e("KhoanDa", maLoi, t);
                PluginCall dangCho = luotNghe;
                luotNghe = null;
                if (dangCho != null) dangCho.reject(maLoi);
                if (call != null && call != dangCho) {
                    try { call.reject(maLoi); } catch (Throwable bo) { /* đã trả rồi */ }
                }
            }
        });
    }

    // ─────────── Đọc to kết quả — xem `DocVanBan` ───────────

    @PluginMethod
    public void docTo(PluginCall call) {
        final String chu = call.getString("chu", "");
        final String ngonNgu = call.getString("ngonNgu", "vi-VN");
        call.setKeepAlive(true);
        chayTrenUi(call, "DOC_HONG", () -> DocVanBan.doc(getContext(), chu, ngonNgu,
                new DocVanBan.KetQua() {
                    @Override public void xong() {
                        JSObject r = new JSObject();
                        r.put("xong", true);
                        call.resolve(r);
                    }
                    @Override public void hong(String ma) { call.reject(ma); }
                }));
    }

    @PluginMethod
    public void dungDocTo(PluginCall call) {
        chayTrenUi(null, "DUNG_DOC_HONG", DocVanBan::dungDoc);
        call.resolve();
    }

    private SpeechRecognizer boNghe;

    /**
     * ⚠️ TRẢ VỀ CẢ LÝ DO VÀ PHIÊN BẢN ANDROID.
     * "Không nghe được" có ba nguyên nhân khác nhau và cách xử lý khác nhau.
     * Gộp thành một chữ `false` là vứt mất thông tin cần để sửa (§4.3).
     */
    @PluginMethod
    public void trangThaiBoNghe(PluginCall call) {
        String lyDo = NgheGiongNoi.lyDoKhongNghe(getContext());
        JSObject r = new JSObject();
        r.put("daCo", "CO".equals(lyDo));
        r.put("lyDo", lyDo);
        r.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(r);
    }

    /**
     * Bắt đầu nghe micro. Trả về chữ + độ tin cậy, KHÔNG trả kết luận rủi ro.
     *
     * ⚠️ §4.3 — HÌNH DẠNG TRẢ VỀ PHẢI KHỚP `unreadableInputFloor()`:
     *   { vanBan, doTinCayThapNhat, ghiAmFailed, maLoi? }
     * `doTinCayThapNhat = -1` nghĩa là MÁY KHÔNG CHẤM ĐIỂM — tầng web có mã
     * riêng cho ca đó. Đừng đổi thành 1.0 cho "gọn": thiếu số đo khác đo rồi
     * thấy tốt, và đó đúng là con bug §4.3.
     *
     * ⚠️ Xin quyền micro TRƯỚC. Từ chối quyền ⇒ reject, và tầng web KHÔNG gửi
     * `ghiAm: true` — không có đầu vào thì không có gì để khai vào sàn.
     */
    @PluginMethod
    public void batDauNghe(PluginCall call) {
        if (getPermissionState("micro") != PermissionState.GRANTED) {
            requestPermissionForAlias("micro", call, "sauKhiXinMicro");
            return;
        }
        chayNghe(call);
    }

    @PermissionCallback
    private void sauKhiXinMicro(PluginCall call) {
        if (getPermissionState("micro") != PermissionState.GRANTED) {
            call.reject("CHUA_CHO_QUYEN_MICRO");
            return;
        }
        chayNghe(call);
    }

    /**
     * Lượt nghe đang treo. `dungNghe` cần nó để kết thúc sớm.
     *
     * ⚠️ ĐẶT VỀ null NGAY TRƯỚC KHI resolve, ở MỌI nhánh. Resolve hai lần thì
     * Capacitor ném lỗi, và lỗi đó nổ trong luồng UI.
     */
    private PluginCall luotNghe;

    private void chayNghe(PluginCall call) {
        String ngonNgu = call.getString("ngonNgu", "vi-VN");
        call.setKeepAlive(true);
        luotNghe = call;

        chayTrenUi(call, "NGHE_HONG", () -> {
            /*
             * ⚠️ TOÀN BỘ RUNNABLE NÀY PHẢI CÓ LƯỚI — 16/8/2026.
             *
             * `createOnDeviceSpeechRecognizer` và `startListening` đều ném được
             * (dịch vụ nghe của ROM chết, gói ngôn ngữ bị gỡ giữa chừng). Ném ở
             * đây thì `luotNghe` đã được gán nhưng KHÔNG CÓ AI GIẢI NÓ — không
             * `onResults`, không `onError`, không gì cả. Giao diện đứng ở "Cháu
             * đang nghe…" cho tới khi hạn giờ bên tầng web cắt.
             *
             * §4.3 — hỏng thì phải NÓI RA. Nuốt ngoại lệ rồi im lặng chính là
             * biến một giới hạn thành một sự im lặng.
             */
            try {
                dungBoNghe();
                boNghe = NgheGiongNoi.batDau(getContext(), ngonNgu, new NgheGiongNoi.KetQua() {
                    @Override public void xong(String vanBan, float doTinCay) {
                        if (luotNghe == null) return;   // `dungNghe` đã kết thúc rồi
                        luotNghe = null;
                        JSObject r = new JSObject();
                        r.put("vanBan", vanBan);
                        r.put("doTinCayThapNhat", doTinCay);
                        r.put("ghiAmFailed", false);
                        call.resolve(r);
                        dungBoNghe();
                    }

                    @Override public void hong(String maLoi) {
                        if (luotNghe == null) return;   // `dungNghe` đã kết thúc rồi
                        luotNghe = null;
                        JSObject r = new JSObject();
                        r.put("vanBan", "");
                        r.put("doTinCayThapNhat", -1f);
                        r.put("ghiAmFailed", true);
                        // maLoi null ⇒ tầng web rơi về `khong_nghe_duoc_ghi_am`.
                        // Vẫn nói ra, không im lặng.
                        if (maLoi != null) r.put("maLoi", maLoi);
                        call.resolve(r);
                        dungBoNghe();
                    }
                });
            } catch (Throwable t) {
                PluginCall dangCho = luotNghe;
                luotNghe = null;
                if (dangCho != null) {
                    JSObject r = new JSObject();
                    r.put("vanBan", "");
                    r.put("doTinCayThapNhat", -1f);
                    r.put("ghiAmFailed", true);
                    r.put("maLoi", NgheGiongNoi.CHUA_TAI_MODEL);
                    dangCho.resolve(r);
                }
                dungBoNghe();
            }
        });
    }

    /**
     * ⚠️ "DỪNG" PHẢI KẾT THÚC LƯỢT NGHE, KHÔNG CHỈ TẮT MICRO.
     *
     * ĐO ĐƯỢC 16/8/2026 — người dùng báo: "ấn vào xong nó không dừng cũng không
     * nghe thấy gì".
     *
     * Bản cũ chỉ gọi `stopListening()`. Lượt `batDauNghe` có
     * `setKeepAlive(true)`, nên nó nằm CHỜ cho tới khi `onResults` hoặc
     * `onError` tự nổ — mà `stopListening()` KHÔNG bảo đảm điều đó xảy ra.
     * Giao diện kẹt ở "Cháu đang nghe…" cho tới khi hạn giờ 2 phút bên tầng web
     * cắt, và bác thì đã bấm Dừng từ lâu.
     *
     * Nay: dừng micro RỒI tự tay kết thúc lượt đang treo, kèm phần chữ đã nghe
     * được. §4.3 — có chữ nhưng chưa hoàn chỉnh thì báo `BI_CAT`, không im
     * lặng coi như nghe xong.
     */
    @PluginMethod
    public void dungNghe(PluginCall call) {
        chayTrenUi(call, "DUNG_NGHE_HONG", () -> {
            /*
             * ⚠️ `stopListening()` PHẢI CÓ try/catch RIÊNG — LỖI ĐÃ MẮC 16/8/2026.
             *
             * Đây là bản vá thứ BA cho cùng một triệu chứng ("ấn dừng thì chả
             * dừng được"), và lần này là lỗi ở CHÍNH BẢN VÁ TRƯỚC. `stopListening()`
             * ném `IllegalStateException` khi bộ nghe chưa vào trạng thái nghe,
             * hoặc `RuntimeException` khi tiến trình bộ nghe đã chết — cả hai đều
             * xảy ra thật trên ROM phổ thông. Ném ở dòng đầu runnable nghĩa là
             * TOÀN BỘ phần resolve bên dưới không bao giờ chạy: micro không tắt,
             * lượt gọi vẫn treo, giao diện đứng ở "Cháu đang nghe…".
             *
             * Tức là bản vá trước đã dựng đúng cơ chế rồi đặt ngay trước nó một
             * dòng có thể vô hiệu hoá cả cơ chế đó.
             *
             * Bọc riêng thì dừng-micro-hỏng không còn kéo theo kết-thúc-lượt-hỏng.
             */
            try {
                if (boNghe != null) boNghe.stopListening();
            } catch (Throwable t) {
                // Bộ nghe chưa nghe, hoặc tiến trình của nó đã chết. Không sao —
                // `dungBoNghe()` bên dưới vẫn huỷ nó, và lượt vẫn được chốt.
            }

            PluginCall dangCho = luotNghe;
            luotNghe = null;
            if (dangCho != null) {
                String phan = NgheGiongNoi.phanDaNghe();
                JSObject r = new JSObject();
                r.put("vanBan", phan == null ? "" : phan);
                r.put("doTinCayThapNhat", -1f);
                // Có chữ ⇒ nghe được MỘT PHẦN. Không có ⇒ không nghe được gì.
                r.put("ghiAmFailed", true);
                r.put("maLoi", phan == null ? "KHONG_CO_TIENG_NOI" : "BI_CAT");
                dangCho.resolve(r);
            }
            dungBoNghe();
        });
        call.resolve();
    }

    /**
     * §6.9 — thả bộ nghe ngay khi xong, đừng giữ micro mở.
     *
     * ⚠️ `destroy()` CŨNG NÉM ĐƯỢC. Hàm này được gọi ngay TRƯỚC khi mở lượt mới
     * trong `chayNghe`; một lần ném ở đây là lượt nghe mới không bao giờ bắt đầu,
     * và bác chạm nút micro mà không có gì xảy ra.
     */
    private void dungBoNghe() {
        if (boNghe == null) return;
        try {
            boNghe.destroy();
        } catch (Throwable t) {
            // Tiến trình bộ nghe đã chết trước ta. Không có gì để dọn thêm.
        }
        boNghe = null;
    }

    @Override
    protected void handleOnDestroy() {
        chayTrenUi(null, "DUNG_BO_NGHE_HONG", this::dungBoNghe);
        chayTrenUi(null, "DUNG_BO_DOC_HONG", DocVanBan::dung);
        super.handleOnDestroy();
    }

    /**
     * Mở màn Cài đặt nhập liệu bằng giọng nói của hệ điều hành.
     *
     * ⚠️ VÌ SAO CẦN — NGƯỜI DÙNG BÁO 16/8/2026 "GHI ÂM KHÔNG HOẠT ĐỘNG".
     *
     * §6.9 và §12 buộc giọng nói KHÔNG rời khỏi máy, nên lớp này chỉ dùng bộ
     * nghe chạy trên máy. Hệ quả thật: máy chưa tải gói tiếng Việt ngoại tuyến
     * thì KHÔNG nghe được — và phần lớn máy Android bán ở Việt Nam chưa có gói
     * đó sẵn.
     *
     * App KHÔNG tự tải gói được: Android không có API nào cho phép. Thứ duy
     * nhất làm được là ĐƯA BÁC TỚI ĐÚNG CHỖ để tự tải. Nói "máy bác chưa có bộ
     * nghe" rồi dừng lại là bỏ bác giữa đường — §4.3 đòi nói ra giới hạn, còn
     * §6.7 đòi luôn có lối đi tiếp.
     *
     * ⚠️ MỖI ROM MỘT ĐƯỜNG KHÁC NHAU — thử lần lượt, hỏng hết thì mở Cài đặt
     * chung. Vẫn hơn là không mở gì.
     */
    @PluginMethod
    public void moCaiDatGiongNoi(PluginCall call) {
        String[] duong = {
            "com.android.settings.action.INPUT_METHOD_SETTINGS",
            android.provider.Settings.ACTION_VOICE_INPUT_SETTINGS,
            android.provider.Settings.ACTION_SETTINGS,
        };
        for (String d : duong) {
            try {
                Intent i = new Intent(d);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(i);
                call.resolve();
                return;
            } catch (Exception e) {
                // ROM này không có màn đó — thử đường kế tiếp.
            }
        }
        call.reject("KHONG_MO_DUOC_CAI_DAT");
    }

    // ─────────── Nhận chia sẻ và lối tắt ───────────

    /**
     * ⚠️ HÀNG ĐỢI TĨNH, VÀ ĐÂY LÀ LÝ DO.
     *
     * `MainActivity.onCreate` chạy TRƯỚC khi tầng web nạp xong. Bác bấm Chia sẻ
     * → Khoan Đã: intent tới nơi trong khi WebView còn đang khởi động, nên
     * `notifyListeners` lúc đó không có ai nghe. Nội dung rơi vào hư không và
     * app mở ra một màn trống — không lỗi, không dấu vết.
     *
     * Nên intent được GIỮ LẠI cho tới khi tầng web chủ động tới lấy.
     */
    private static NhanChiaSe.KetQua dangCho;

    static void nhanIntent(Intent intent) {
        // Không dùng ContentResolver ở đây được vì đây là hàm tĩnh — giữ Intent
        // lại, bóc nội dung lúc tầng web hỏi (khi đó đã có context).
        intentDangCho = intent;
    }

    private static Intent intentDangCho;

    /**
     * Tầng web hỏi: "có gì mới không?"
     *
     * ⚠️ LẤY MỘT LẦN RỒI XOÁ. Không xoá thì mỗi lần app quay lại tiền cảnh,
     * cùng một ảnh chụp màn hình lại được kiểm lại — bác thấy kết quả cũ hiện
     * ra và tưởng có tin nhắn mới.
     */
    @PluginMethod
    public void layNoiDungChiaSe(PluginCall call) {
        JSObject r = new JSObject();
        Intent i = intentDangCho;
        intentDangCho = null;

        NhanChiaSe.KetQua k = i == null ? dangCho
                : NhanChiaSe.boc(i, getContext().getContentResolver());
        dangCho = null;

        if (k == null) {
            r.put("co", false);
            call.resolve(r);
            return;
        }
        r.put("co", true);
        if (k.vanBan != null) r.put("vanBan", k.vanBan);
        if (k.anh != null) r.put("anh", k.anh);
        if (k.loiTat != null) r.put("loiTat", k.loiTat);
        // §4.3 — ca hỏng có mã riêng, KHÔNG im lặng.
        if (k.maLoi != null) r.put("maLoi", k.maLoi);
        call.resolve(r);
    }

    // ─────────── Nhắc cuộc gọi dài ───────────

    /**
     * ⚠️ NẠP CHỮ XUỐNG TRƯỚC, RỒI MỚI BẬT — §11.
     *
     * Service chạy khi app đã đóng, nên lúc cần hiện lời nhắc thì không còn
     * tầng web nào để hỏi chữ. Chữ phải nằm sẵn trong SharedPreferences, đã
     * qua catalog i18n. Thiếu chữ thì `TheoDoiCuocGoi.nhac()` KHÔNG hiện gì —
     * thà im còn hơn hiện một câu lớp Java tự nghĩ ra.
     *
     * ⚠️ NẠP LẠI MỖI LẦN BẬT, VÀ MỖI LẦN ĐỔI NGÔN NGỮ. Không nạp lại thì bác
     * chuyển sang tiếng Anh mà lời nhắc vẫn ra tiếng Việt — nửa app một thứ
     * tiếng là đúng thứ §4.1 cấm.
     */
    @PluginMethod
    public void napChuCuocGoi(PluginCall call) {
        String tieuDe = call.getString("tieuDe");
        String noiDung = call.getString("noiDung");
        String nutMo = call.getString("nutMo");
        String nutOn = call.getString("nutOn");
        if (tieuDe == null || noiDung == null || nutMo == null || nutOn == null) {
            call.reject("THIEU_CHU_HIEN_THI");
            return;
        }
        int phut = call.getInt("phut", TheoDoiCuocGoi.PHUT_MAC_DINH);
        getContext().getSharedPreferences(TheoDoiCuocGoi.KHO, android.content.Context.MODE_PRIVATE)
                .edit()
                .putString(TheoDoiCuocGoi.KHOA_TIEU_DE, tieuDe)
                .putString(TheoDoiCuocGoi.KHOA_NOI_DUNG, noiDung)
                .putString(TheoDoiCuocGoi.KHOA_NUT_MO, nutMo)
                .putString(TheoDoiCuocGoi.KHOA_NUT_ON, nutOn)
                .putInt(TheoDoiCuocGoi.KHOA_PHUT, phut < 5 ? TheoDoiCuocGoi.PHUT_MAC_DINH : phut)
                .apply();
        call.resolve();
    }

    @PluginMethod
    public void trangThaiTheoDoiCuocGoi(PluginCall call) {
        JSObject r = new JSObject();
        boolean coQuyen = getPermissionState("cuocGoi") == PermissionState.GRANTED;
        boolean dangBat = getContext()
                .getSharedPreferences(TheoDoiCuocGoi.KHO, android.content.Context.MODE_PRIVATE)
                .getBoolean(TheoDoiCuocGoi.KHOA_BAT, false);
        r.put("coQuyen", coQuyen);

        /*
         * ⚠️ BẢO ĐẢM SERVICE ĐANG CHẠY, ĐỪNG CHỈ ĐỌC CỜ — LỖ HỔNG ĐO ĐƯỢC 19/8/2026.
         *
         * Cờ trong SharedPreferences nói "bác đã chọn bật". Nó KHÔNG nói service
         * có đang sống hay không, và hai thứ đó lệch nhau rất dễ:
         *   · ROM dọn nền và Android chưa kịp dựng lại theo START_STICKY;
         *   · người dùng buộc dừng app trong Cài đặt;
         *   · máy vừa khởi động lại mà broadcast bị ROM chặn.
         *
         * Bản trước chỉ đọc cờ, nên công tắc hiện XANH trong khi không có gì
         * trông chừng cuộc gọi cả — đúng dạng §4.3 tệ nhất: khai một thứ đang
         * chạy trong khi nó đã chết, và bác chỉ phát hiện lúc cần tới nó.
         *
         * `startForegroundService` là idempotent: gọi khi service đã chạy chỉ
         * kích hoạt `onStartCommand`, không dựng lại gì. Nên mỗi lần giao diện
         * hỏi trạng thái cũng là một lần dựng lại nếu nó đã chết.
         */
        if (dangBat && coQuyen) {
            try {
                TheoDoiCuocGoi.bat(getContext());
            } catch (Throwable t) {
                // ROM chặn khởi động từ nền. Giao diện vẫn nói "đang bật" theo
                // lựa chọn của bác; lần bác mở app tới nó sẽ thử lại.
            }
        }

        /*
         * ⚠️ `dangBat` PHẢI KÈM `coQuyen`. Quyền bị thu hồi trong Cài đặt thì
         * service tự dừng, mà cờ trong kho có thể còn `true` một lúc. Trả cả
         * hai để giao diện nói được "bác đã bật, nhưng máy vừa rút quyền" thay
         * vì im lặng gạt công tắc về tắt (§4.3).
         */
        r.put("dangBat", dangBat && coQuyen);
        call.resolve(r);
    }

    @PluginMethod
    public void datTheoDoiCuocGoi(PluginCall call) {
        boolean muonBat = Boolean.TRUE.equals(call.getBoolean("bat", false));
        if (!muonBat) {
            getContext().getSharedPreferences(TheoDoiCuocGoi.KHO, android.content.Context.MODE_PRIVATE)
                    .edit().putBoolean(TheoDoiCuocGoi.KHOA_BAT, false).apply();
            TheoDoiCuocGoi.tat(getContext());
            JSObject r = new JSObject();
            r.put("dangBat", false);
            call.resolve(r);
            return;
        }
        if (getPermissionState("cuocGoi") != PermissionState.GRANTED) {
            requestPermissionForAlias("cuocGoi", call, "sauKhiXinCuocGoi");
            return;
        }
        batTheoDoi(call);
    }

    @PermissionCallback
    private void sauKhiXinCuocGoi(PluginCall call) {
        if (getPermissionState("cuocGoi") != PermissionState.GRANTED) {
            // Từ chối là kết quả hợp lệ, không phải lỗi (§4.3).
            JSObject r = new JSObject();
            r.put("dangBat", false);
            r.put("maLoi", "CHUA_CO_QUYEN_CUOC_GOI");
            call.resolve(r);
            return;
        }
        batTheoDoi(call);
    }

    private void batTheoDoi(PluginCall call) {
        JSObject r = new JSObject();
        try {
            getContext().getSharedPreferences(TheoDoiCuocGoi.KHO, android.content.Context.MODE_PRIVATE)
                    .edit().putBoolean(TheoDoiCuocGoi.KHOA_BAT, true).apply();
            TheoDoiCuocGoi.bat(getContext());
            r.put("dangBat", true);
        } catch (Throwable t) {
            /*
             * ⚠️ ROM CÓ THỂ TỪ CHỐI KHỞI ĐỘNG FOREGROUND SERVICE — nhất là khi
             * app đang ở nền, hoặc trên máy có trình quản lý pin của hãng. Nói
             * ra, đừng để công tắc sáng lên trong khi không có gì chạy.
             */
            getContext().getSharedPreferences(TheoDoiCuocGoi.KHO, android.content.Context.MODE_PRIVATE)
                    .edit().putBoolean(TheoDoiCuocGoi.KHOA_BAT, false).apply();
            r.put("dangBat", false);
            r.put("maLoi", "KHONG_KHOI_DONG_DUOC");
        }
        call.resolve(r);
    }

    // ─────────── Trạng thái máy — nguồn đầu vào thứ tư (§4.3) ───────────

    /**
     * Máy có ứng dụng nào đang xem và bấm được thay bác không.
     *
     * ⚠️ TRẢ CẢ `docDuoc`. Danh sách rỗng có hai nghĩa hoàn toàn khác nhau:
     * "đã xem, không có gì" và "không xem được". Tầng web có nhánh riêng cho ca
     * thứ hai và đẩy nó vào `chuaKiem`.
     */
    @PluginMethod
    public void trangThaiMay(PluginCall call) {
        try {
            call.resolve(JSObject.fromJSONObject(KiemTraMay.doc(getContext())));
        } catch (JSONException e) {
            /*
             * ⚠️ HỎNG THÌ TRẢ VỀ `docDuoc: false`, ĐỪNG `reject`.
             * `reject` làm tầng web rơi vào nhánh catch chung và mất mã lý do —
             * lúc đó nó không phân biệt được "máy không có gì" với "không đọc
             * được", tức là mất đúng thứ §4.3 sinh ra để giữ.
             */
            JSObject r = new JSObject();
            r.put("docDuoc", false);
            r.put("dichVuTroNang", new JSArray());
            call.resolve(r);
        }
    }

    /** Mở màn Cài đặt trợ năng để bác tự tắt ứng dụng lạ. */
    @PluginMethod
    public void moCaiDatTroNang(PluginCall call) {
        try {
            getContext().startActivity(KiemTraMay.manCaiDat());
            call.resolve();
        } catch (Exception e) {
            call.reject("KHONG_MO_DUOC_CAI_DAT");
        }
    }

    // ─────────── Cảnh báo heads-up khi mức CAO ───────────

    /**
     * ⚠️ HAI HÀM NÀY TỪNG KHÔNG TỒN TẠI, VÀ ĐÓ LÀ MỘT LỖI §4.3 — vá 19/8/2026.
     *
     * `ThongBaoCanhBao.java` đã được viết đầy đủ (163 dòng, có cả đọc lại
     * `getActiveNotifications()` để không tin `notify()`), `native.ts` đã khai
     * `hienCanhBaoHeadsUp` trong giao diện cầu nối, và tầng web đã gọi nó khi
     * mức là CAO. Chỉ thiếu đúng cái mắt xích ở giữa: plugin không có method
     * mang tên đó.
     *
     * Hệ quả KHÔNG PHẢI một lỗi hiện ra màn hình. Capacitor reject với
     * "not implemented", `native.ts` bắt bằng `catch { return false }`, và
     * `false` ở đó có nghĩa "ROM chặn mất rồi". Tức là toàn bộ tính năng cảnh
     * báo lúc app ở nền đã KHÔNG CHẠY từ đầu, và hệ thống thì báo cáo lại đúng
     * cái nghĩa "máy bác chặn" — đổ cho thiết bị một thứ do mình thiếu.
     *
     * Đây đúng dạng lỗi §4.3 mô tả: KHÔNG LÀM ĐƯỢC bị trình bày thành ĐÃ LÀM,
     * KHÔNG THẤY GÌ. Bác tin rằng lúc bị gọi thúc mà app đang ở nền thì vẫn có
     * một tiếng chuông cảnh báo — và lúc cần thì không có.
     *
     * ⚠️ CHỮ VẪN DO TẦNG WEB TRUYỀN XUỐNG (§11). Thiếu chữ ⇒ TỪ CHỐI, không tự
     * bịa. Thà không hiện còn hơn hiện một câu lớp native tự nghĩ ra.
     */
    @PluginMethod
    public void hienCanhBaoHeadsUp(PluginCall call) {
        String tieuDe = call.getString("tieuDe");
        String noiDung = call.getString("noiDung");

        if (tieuDe == null || noiDung == null) {
            call.reject("THIEU_CHU_HIEN_THI");
            return;
        }

        /*
         * ⚠️ TRẢ VỀ `daHien` THẬT, KHÔNG PHẢI "ĐÃ GỬI XONG".
         * `ThongBaoCanhBao.hien()` đọc lại `getActiveNotifications()` sau khi
         * gửi, vì trên ROM Xiaomi/Oppo/Vivo thì `areNotificationsEnabled()` vẫn
         * báo bật trong khi tầng chặn riêng của hãng đã nuốt mất thông báo.
         * Giữ nguyên giá trị đó lên tầng web — đừng "làm gọn" thành true.
         */
        boolean daHien = ThongBaoCanhBao.hien(getContext(), tieuDe, noiDung);
        JSObject r = new JSObject();
        r.put("daHien", daHien);
        call.resolve(r);
    }

    @PluginMethod
    public void anCanhBaoHeadsUp(PluginCall call) {
        ThongBaoCanhBao.an(getContext());
        call.resolve();
    }

    // ─────────── Kênh thông báo ───────────

    /**
     * ⚠️ CẢNH BÁO LÊN ĐẦU DANH SÁCH CẦN ĐÚNG BA THỨ, THIẾU MỘT LÀ HỎNG IM LẶNG.
     *
     * ① KÊNH `IMPORTANCE_HIGH`. Android 8+ bỏ qua `setPriority` của từng thông
     *    báo; mức nằm ở KÊNH. Kênh mức thấp thì thông báo nằm im dưới đáy.
     *
     * ② KÊNH KHÔNG SỬA ĐƯỢC SAU KHI TẠO. Tạo nhầm mức thấp một lần là nhầm
     *    vĩnh viễn — đổi mã cũng vô ích, phải đổi TÊN KÊNH hoặc gỡ cài app.
     *    Vì vậy tên kênh mang hậu tố phiên bản.
     *
     * ③ `POST_NOTIFICATIONS` phải được cấp (Android 13+). Chưa cấp thì mọi lượt
     *    gửi đều "thành công" mà không có gì hiện ra.
     *
     * ⚠️ CHỈ DÙNG KÊNH NÀY CHO MỨC `CAO`. Đưa mọi kết quả lên đầu danh sách là
     * dạy người dùng vuốt bỏ chúng, rồi lần CAO thật họ cũng vuốt bỏ nốt (§4.6).
     */
    private static final String KENH_CANH_BAO = "khoanda_canh_bao_v1";

    /**
     * Bật/tắt dòng thông báo thường trực.
     *
     * ⚠️ TRẢ VỀ TRẠNG THÁI THẬT, không phải thứ vừa được yêu cầu. Chưa có
     * quyền POST_NOTIFICATIONS (Android 13+) thì gửi thất bại — công tắc phải
     * ở lại vị trí cũ và giao diện phải nói ra, không tự bật rồi im lặng.
     */
    @PluginMethod
    public void datThongBaoThuongTruc(PluginCall call) {
        boolean muonBat = Boolean.TRUE.equals(call.getBoolean("bat", false));
        if (!muonBat) {
            ThongBaoThuongTruc.tat(getContext());
            JSObject r = new JSObject();
            r.put("dangBat", false);
            call.resolve(r);
            return;
        }

        /*
         * ⚠️ XIN QUYỀN TRƯỚC, ĐỪNG GỬI RỒI MỚI ĐOÁN — 16/8/2026.
         *
         * Bản trước gọi thẳng `ThongBaoThuongTruc.bat()` rồi bắt `SecurityException`
         * để biết là thiếu quyền. Nhưng `notify()` KHÔNG ném khi thiếu
         * `POST_NOTIFICATIONS` — nó trả về bình thường và không hiện gì. Nên
         * nhánh bắt lỗi đó chưa bao giờ chạy, và công tắc luôn báo "đã bật".
         *
         * Nay: máy Android 13+ mà chưa có quyền thì HIỆN HỘP XIN QUYỀN của hệ
         * điều hành. Bác bấm Cho phép là xong ngay tại chỗ — không phải đi vào
         * Cài đặt tìm đường (§6.7 — nói ra giới hạn thì phải kèm lối đi tiếp).
         */
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("thongBao") != PermissionState.GRANTED) {
            requestPermissionForAlias("thongBao", call, "sauKhiXinThongBao");
            return;
        }
        batThongBao(call);
    }

    @PermissionCallback
    private void sauKhiXinThongBao(PluginCall call) {
        /*
         * ⚠️ TỪ CHỐI QUYỀN LÀ MỘT KẾT QUẢ HỢP LỆ, KHÔNG PHẢI MỘT LỖI.
         * Trả về `dangBat: false` kèm mã, để công tắc ở lại vị trí TẮT và màn
         * Cài đặt nói ra vì sao (§4.3). Không `reject` — reject làm tầng web rơi
         * vào nhánh catch chung và mất mã lý do.
         */
        if (getPermissionState("thongBao") != PermissionState.GRANTED) {
            JSObject r = new JSObject();
            r.put("dangBat", false);
            r.put("maLoi", "CHUA_CO_QUYEN_THONG_BAO");
            call.resolve(r);
            return;
        }
        batThongBao(call);
    }

    private void batThongBao(PluginCall call) {
        boolean xong = ThongBaoThuongTruc.bat(getContext());
        JSObject r = new JSObject();
        r.put("dangBat", xong);
        if (!xong) r.put("maLoi", "CHUA_CO_QUYEN_THONG_BAO");
        call.resolve(r);
    }

    /**
     * LỐI TẮT CÓ ĐANG NẰM TRÊN THANH THẬT KHÔNG — hỏi Android, đừng hỏi localStorage.
     *
     * ⚠️ TRẢ VỀ HAI GIÁ TRỊ, VÀ KHOẢNG CÁCH GIỮA CHÚNG MỚI LÀ THỨ ĐÁNG NÓI.
     *
     *   `daChon`   — bác đã bật công tắc này (lưu ở SharedPreferences, sống qua
     *                khởi động máy và qua cập nhật app).
     *   `dangHien` — nó có THẬT SỰ nằm trên thanh thông báo lúc này không.
     *
     * Hai giá trị này lệch nhau được, và mỗi lần lệch đều có nghĩa: người dùng
     * đã tắt thông báo của app trong Cài đặt, ROM chặn ở tầng riêng của hãng,
     * hoặc kênh bị hạ mức. Gộp thành một `boolean` là vứt mất đúng thông tin
     * cần để nói thật với bác (§4.3) — và tầng web sẽ lại quay về đoán.
     *
     * ⚠️ ĐÂY LÀ THỨ CHỮA CON BUG "CÔNG TẮC XANH MÀ THANH TRỐNG". Trước đây tầng
     * web chỉ đọc localStorage, mà localStorage không biết gì về những chuyện
     * xảy ra bên ngoài WebView.
     */
    @PluginMethod
    public void trangThaiThongBaoThuongTruc(PluginCall call) {
        JSObject r = new JSObject();
        r.put("daChon", ThongBaoThuongTruc.daChonBat(getContext()));
        r.put("dangHien", ThongBaoThuongTruc.dangHien(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void dungKenhCanhBao(PluginCall call) {
        JSObject r = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getContext().getSystemService(NotificationManager.class);
            NotificationChannel kenh = new NotificationChannel(
                    KENH_CANH_BAO,
                    getContext().getString(R.string.kenh_canh_bao_ten),
                    NotificationManager.IMPORTANCE_HIGH);
            kenh.setDescription(getContext().getString(R.string.kenh_canh_bao_mo_ta));
            kenh.enableVibration(true);
            // Hiện đè lên màn hình đang dùng, không chỉ nằm trong ngăn kéo.
            kenh.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(kenh);

            NotificationChannel daCo = nm.getNotificationChannel(KENH_CANH_BAO);
            /*
             * ⚠️ ĐỌC LẠI MỨC THẬT, ĐỪNG TIN LÀ ĐÃ ĐẶT XONG.
             * Người dùng có thể đã hạ mức kênh trong Cài đặt, và app KHÔNG nâng
             * lại được. Tầng web cần biết để nói thật: "cảnh báo sẽ không hiện
             * lên đầu" — chứ không im lặng rồi để bác tưởng mình được bảo vệ.
             */
            r.put("mucThat", daCo == null ? -1 : daCo.getImportance());
            r.put("dungMuc", daCo != null && daCo.getImportance() >= NotificationManager.IMPORTANCE_HIGH);
        } else {
            r.put("mucThat", -1);
            r.put("dungMuc", true);   // trước Android 8 mức nằm ở từng thông báo
        }
        r.put("kenh", KENH_CANH_BAO);
        call.resolve(r);
    }
}
