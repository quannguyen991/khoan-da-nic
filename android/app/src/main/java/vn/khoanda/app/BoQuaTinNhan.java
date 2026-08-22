package vn.khoanda.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * ══════════ NÚT "BỎ QUA" TRÊN THÔNG BÁO HỎI KIỂM TIN ══════════
 *
 * §4.6 — LUÔN CÓ LỐI RA. Thông báo sàng lọc hỏi "Bác có muốn kiểm tin nhắn này
 * không?", và một câu hỏi chỉ có một câu trả lời thì không phải là câu hỏi.
 *
 * ⚠️ BỎ QUA PHẢI THẬT SỰ BỎ, KHÔNG PHẢI CHỈ TẮT THÔNG BÁO. Tin vẫn nằm trong
 * hàng đợi trong bộ nhớ; không xoá thì lần sau bác mở app, thẻ "có tin chưa
 * kiểm" lại hiện ra đúng cái tin bác vừa nói không. Hỏi lại một câu đã được trả
 * lời là cách nhanh nhất để người ta ngừng đọc mọi thông báo của app.
 *
 * ⚠️ KHÔNG GHI LẠI GÌ, KHÔNG GỬI ĐI ĐÂU. Bác nói không thì mọi thứ về đúng chỗ
 * cũ. Đây không phải một mẫu dữ liệu để học — §6.9.
 */
public class BoQuaTinNhan extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        try {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm != null) nm.cancel(ThongBaoCanhBao.MA_CONG_KHAI);
        } catch (Throwable ignored) {
            // Không huỷ được thông báo thì thôi — việc chính là xoá hàng đợi bên dưới.
        }
        try {
            DocThongBao.xoaHet();
        } catch (Throwable ignored) {
            // Dịch vụ đọc thông báo có thể chưa chạy. Không sao: không có gì để xoá.
        }
    }
}
