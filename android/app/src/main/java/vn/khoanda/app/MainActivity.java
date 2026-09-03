package vn.khoanda.app;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

/**
 * ⚠️ ĐĂNG KÝ PLUGIN PHẢI GỌI TRƯỚC `super.onCreate()`.
 * Gọi sau thì cầu nối đã dựng xong và plugin không có mặt — tầng web sẽ nhận
 * "plugin not implemented" mà không có gợi ý nào về nguyên nhân.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KhoanDaPlugin.class);
        super.onCreate(savedInstanceState);
        // Intent mở app lần đầu (từ lối tắt, hoặc từ nút Chia sẻ của app khác).
        KhoanDaPlugin.nhanIntent(getIntent());
    }

    /**
     * ⚠️ `onNewIntent` LÀ BẮT BUỘC, KHÔNG PHẢI PHÒNG XA.
     *
     * `android:launchMode="singleTask"` nghĩa là app đang chạy thì Android KHÔNG
     * tạo activity mới — nó gọi `onNewIntent` trên activity cũ. Chỉ xử lý trong
     * `onCreate` thì: bác chia sẻ một ảnh vào Khoan Đã lần đầu → chạy đúng; lần
     * thứ hai, khi app còn trong bộ nhớ → app hiện lên NHƯNG KHÔNG CÓ GÌ XẢY RA.
     * Không lỗi, không thông báo. Người dùng nghĩ tính năng hỏng lúc được lúc
     * không, mà thật ra là hỏng đúng từ lần thứ hai trở đi.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        KhoanDaPlugin.nhanIntent(intent);
    }
}
