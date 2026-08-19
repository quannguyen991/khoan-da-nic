package vn.khoanda.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * DỰNG LẠI LỐI TẮT SAU KHI MÁY KHỞI ĐỘNG — và sau khi app được cập nhật.
 *
 * ══════════ VÌ SAO CẦN ══════════
 *
 * Thông báo trên thanh KHÔNG sống qua một lần tắt máy. Android xoá sạch mọi
 * thông báo khi khởi động lại, kể cả thông báo `ongoing`. App nào muốn giữ một
 * dòng thường trực đều phải tự gửi lại — không có cơ chế nào làm hộ.
 *
 * Không có lớp này thì chuyện xảy ra như sau, và nó im lặng từ đầu đến cuối:
 *
 *   · Bác bật "Nhắc cảnh giác trên thanh thông báo".
 *   · Tối bác tắt máy đi ngủ.
 *   · Sáng bật máy — thanh thông báo TRỐNG.
 *   · Vào app, công tắc vẫn xanh, vẫn ghi đang bật.
 *
 * Bác tin rằng có một lối tắt chờ sẵn cho lúc bị gọi thúc. Nó không còn ở đó,
 * và không có gì báo. Đây đúng dạng lỗi §4.3 mô tả — chỉ khác chỗ xảy ra.
 *
 * ⚠️ NGHE CẢ `MY_PACKAGE_REPLACED`, KHÔNG CHỈ `BOOT_COMPLETED`.
 * Cập nhật app cũng xoá thông báo đang hiện. Người dùng không tắt máy hàng ngày
 * nhưng app thì cập nhật đều — bỏ sót ca này là bỏ sót ca xảy ra thường hơn.
 *
 * ⚠️ CHỈ BẬT LẠI KHI BÁC ĐÃ TỪNG CHỌN BẬT. `daChonBat()` đọc SharedPreferences
 * — kho duy nhất mà một receiver chạy lúc chưa có WebView đọc được. Tự dựng
 * thông báo cho người chưa bao giờ bật là tự ý chiếm thanh thông báo của họ.
 *
 * ⚠️ KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO Ở ĐÂY (§4.2). Lớp này chỉ dựng lại đúng thứ
 * bác đã bật. Không đọc nội dung, không chấm điểm, không gửi gì đi đâu.
 */
public class KhoiDongLai extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (ctx == null || intent == null) return;

        String viec = intent.getAction();
        if (viec == null) return;

        /*
         * Lọc tường minh thay vì bật lại với mọi intent tới. Receiver được khai
         * trong manifest nên app khác gửi broadcast giả tới được; không có gì
         * nguy hiểm ở đây, nhưng dựng lại thông báo vì một intent lạ là một hành
         * vi không ai yêu cầu.
         */
        boolean dungViec =
                Intent.ACTION_BOOT_COMPLETED.equals(viec)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(viec)
                || "android.intent.action.QUICKBOOT_POWERON".equals(viec)
                // ROM HTC/một số máy Trung Quốc dùng tên riêng cho "vừa bật máy".
                || "com.htc.intent.action.QUICKBOOT_POWERON".equals(viec)
                || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(viec);

        if (!dungViec) return;
        if (!ThongBaoThuongTruc.daChonBat(ctx)) return;

        /*
         * ⚠️ NUỐT MỌI NGOẠI LỆ — RECEIVER NÉM LÀ HỆ THỐNG BÁO "Khoan Đã đã dừng".
         *
         * Một hộp thoại crash ngay khi vừa mở máy là thứ tệ nhất có thể xảy ra
         * với một app dành cho người cao tuổi: nó nói với bác rằng app này hỏng,
         * ngay trước khi bác kịp dùng nó lần nào trong ngày.
         *
         * `bat()` đã tự xử lý mọi ca hỏng và trả về false khi không gửi được;
         * nó cũng tự xoá ý định đã ghi nếu đo được là thông báo không lên thanh.
         * Nên ở đây không cần biết kết quả — chỉ cần chắc chắn không ném ra.
         */
        try {
            ThongBaoThuongTruc.bat(ctx);
        } catch (Throwable t) {
            // Không có gì làm thêm được. Bác mở app là công tắc đồng bộ lại.
        }
    }
}
