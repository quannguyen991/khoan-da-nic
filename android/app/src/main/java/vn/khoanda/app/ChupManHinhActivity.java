package vn.khoanda.app;

import android.app.Activity;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Bundle;

/**
 * Activity TRONG SUỐT, chỉ có một việc: hỏi hệ điều hành "cho Khoan Đã chụp màn hình MỘT LẦN không?"
 * rồi giao kết quả cho `ChupManHinhService`. Xem `ChupManHinh` để biết bốn ràng buộc.
 *
 * ⚠️ HỘP XÁC NHẬN LÀ CỦA ANDROID, KHÔNG PHẢI CỦA MÌNH — và đó là điều tốt. App không vẽ, không bỏ
 * qua, không "nhớ lần trước" được. Bác từ chối thì không có gì xảy ra: màn hình chỉ đóng lại.
 */
public class ChupManHinhActivity extends Activity {

    private static final int MA_YEU_CAU = 7101;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        try {
            MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(MEDIA_PROJECTION_SERVICE);
            if (mpm == null) { baoLoi(); return; }
            startActivityForResult(mpm.createScreenCaptureIntent(), MA_YEU_CAU);
        } catch (Throwable t) {
            android.util.Log.e("KhoanDa", "khong mo duoc hop xac nhan chup man hinh", t);
            baoLoi();
        }
    }

    @Override
    protected void onActivityResult(int ma, int ketQua, Intent du) {
        super.onActivityResult(ma, ketQua, du);
        if (ma != MA_YEU_CAU) { finish(); return; }
        if (ketQua != RESULT_OK || du == null) {
            finish();   // bác bấm Huỷ — không phải lỗi, không nói gì thêm
            return;
        }
        try {
            Intent dv = new Intent(this, ChupManHinhService.class);
            dv.putExtra(ChupManHinhService.KHOA_MA, ketQua);
            dv.putExtra(ChupManHinhService.KHOA_DU, du);
            // Android 10+: phải chạy dưới dạng foreground service TRƯỚC khi lấy MediaProjection.
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(dv);
            else startService(dv);
        } catch (Throwable t) {
            android.util.Log.e("KhoanDa", "khong bat duoc dich vu chup man hinh", t);
            baoLoi();
            return;
        }
        finish();
    }

    private void baoLoi() {
        ChupManHinhService.noiLoi(this);
        finish();
    }
}
