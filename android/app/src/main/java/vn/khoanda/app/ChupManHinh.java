package vn.khoanda.app;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.util.Base64;

import java.io.ByteArrayOutputStream;

/**
 * ══════════ CHỤP MÀN HÌNH THEO YÊU CẦU CỦA BÁC — MỘT LẦN, CÓ XÁC NHẬN ══════════
 *
 * ⚠️ ĐÂY LÀ MỘT QUYẾT ĐỊNH ĐÃ ĐẢO CHIỀU (30/10/2026, theo yêu cầu của người dùng sản phẩm).
 * Trước đó `NhanChiaSe` và `BongBongNoi` ghi rõ: KHÔNG tự chụp màn hình — bác tự chụp bằng phím
 * của máy rồi Chia sẻ. Lý do khi đó: `MediaProjection` là quyền nhìn được MỌI THỨ trên màn hình,
 * kể cả màn hình ngân hàng, và Play Store hay hỏi gắt. Người dùng sản phẩm muốn ngược lại: người
 * cao tuổi chạm nút nổi là có ảnh tin nhắn đang xem đi kiểm, không phải mò phím nguồn + giảm âm.
 *
 * Để đổi mà không phá lời hứa riêng tư, mọi thứ dưới đây BÁM CHẶT bốn điều:
 *
 * ① CHỈ KHI BÁC CHẠM. Không có đường nào tự chụp: chỉ `ChupManHinhActivity` (do nút trong menu
 *    bong bóng mở) khởi động được, và Android bắt hiện HỘP XÁC NHẬN của hệ thống mỗi lần.
 * ② MỘT KHUNG HÌNH RỒI DỪNG. Service lấy đúng một ảnh, tắt `MediaProjection` ngay, rồi tự dừng.
 *    Không quay video, không chụp tiếp, không chạy nền. Trong lúc chạy có thông báo bắt buộc.
 * ③ KHÔNG GHI RA Ổ ĐĨA. Ảnh chỉ nằm trong bộ nhớ ở đây tới khi tầng web lấy một lần
 *    (`layVaXoa`) rồi xoá — cùng khuôn với "lấy một lần rồi xoá" của `KhoanDaPlugin.layNoiDungChiaSe`.
 * ④ ẢNH ĐI ĐÚNG ĐƯỜNG ẢNH ĐÃ CÓ. Nó vào `handleAnalyze` như một ảnh bác chia sẻ sang: cùng trần
 *    5 MB, cùng cạnh dài 1600px, cùng nhãn §4.3 khi đọc không được. Lớp này không chấm rủi ro.
 *
 * ⚠️ HỎNG THÌ NÓI RA (§4.3). Không chụp được ⇒ hiện câu báo, KHÔNG mở app với ảnh rỗng, vì một ảnh
 * rỗng đem đi kiểm sẽ ra "chưa thấy dấu hiệu" về một thứ chưa ai nhìn.
 */
public final class ChupManHinh {

    /** Khớp `NhanChiaSe`: cạnh dài tối đa 1600px, trần 5 MB. */
    static final int CANH_TOI_DA = 1600;
    private static final int TRAN_BYTE = 5 * 1024 * 1024;

    /** Deep link tầng web đã quen: `khoanda://loi-tat/anh-vua-chup`. */
    static final String LOI_TAT = "anh-vua-chup";

    private static String anhDangCho;

    private ChupManHinh() { }

    static synchronized void giu(String dataUri) { anhDangCho = dataUri; }

    /** Lấy MỘT LẦN rồi xoá — bác quay lại app lần sau không được thấy ảnh cũ. */
    static synchronized String layVaXoa() {
        String a = anhDangCho;
        anhDangCho = null;
        return a;
    }

    /** Có chụp được không: cần Android 5.0 trở lên (minSdk của app là 22 nên luôn đúng, giữ để rõ ý). */
    static boolean duocHoTro() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP;
    }

    /** Bitmap → data URI JPEG, hoặc `null` nếu vượt trần (gọi hàm tự khai lỗi, không im lặng). */
    static String thanhDataUri(Bitmap anh) {
        ByteArrayOutputStream ra = new ByteArrayOutputStream();
        anh.compress(Bitmap.CompressFormat.JPEG, 82, ra);
        byte[] b = ra.toByteArray();
        if (b.length > TRAN_BYTE) return null;
        return "data:image/jpeg;base64," + Base64.encodeToString(b, Base64.NO_WRAP);
    }

    /** Mở app tới đúng chỗ nhận ảnh vừa chụp. */
    static void moAppVoiAnh(Context ctx) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW,
                    android.net.Uri.parse("khoanda://loi-tat/" + LOI_TAT), ctx, MainActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            ctx.startActivity(i);
        } catch (Throwable ignored) { }
    }
}
