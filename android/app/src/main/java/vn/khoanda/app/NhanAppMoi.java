package vn.khoanda.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.InstallSourceInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * NGHE SỰ KIỆN CÀI ỨNG DỤNG MỚI — §PROMPT 4.
 *
 * ══════════ ĐỌC HẾT KHỐI NÀY TRƯỚC KHI SỬA ══════════
 *
 * ⚠️ VÌ SAO ĐÂY LÀ TÍN HIỆU MẠNH NHẤT TRONG TẤT CẢ:
 * một người cao tuổi gần như không bao giờ tự cài app từ ngoài cửa hàng. Việc
 * đó đòi vào Cài đặt bật "cài từ nguồn không xác định" — chuỗi thao tác mà gần
 * như chỉ có người khác đọc từng bước qua điện thoại mới làm nổi. Khi nó xảy
 * ra, xác suất đang bị dẫn dắt là rất cao.
 *
 * ⚠️ LỚP NÀY KHÔNG QUYẾT ĐỊNH MỨC RỦI RO. Nó chỉ ĐỌC SỰ KIỆN rồi đưa sang tầng
 * web. Bộ luật là `backend/src/detect/ung-dung-la.js`, và chỉ có MỘT bản
 * (§4.2). Chép logic phân loại nguồn cài xuống đây là nhân bản bộ luật — đúng
 * thứ `test/bo-luat-khong-duoc-lech.test.js` sinh ra để chặn.
 *
 * ⚠️ KHÔNG GỠ APP, KHÔNG KHOÁ MÁY (§12). Lớp này không gọi `PackageInstaller`,
 * không xin `DELETE_PACKAGES`, và đó là ràng buộc kiến trúc chứ không phải hạng
 * mục chưa làm.
 *
 * ⚠️ KHÔNG LIỆT KÊ TOÀN BỘ APP TRÊN MÁY. Không dùng `getInstalledPackages()`,
 * không khai `QUERY_ALL_PACKAGES`. Chúng ta chỉ nghe broadcast về ĐÚNG gói vừa
 * được cài — đó là dữ liệu tối thiểu cần cho việc này, và nó tránh luôn một
 * nhóm quyền bị cửa hàng hạn chế (xem `docs/kien-truc-hai-phia.md` mục 4).
 *
 * ⚠️ §6.9 — KHÔNG GHI GÌ RA LOG. Một dòng `Log.d` ở đây là rò danh sách ứng
 * dụng của bác vào logcat.
 *
 * ⚠️ CHƯA BIÊN DỊCH ĐƯỢC TRÊN MÁY DỰNG. Máy làm việc này không có JDK và
 * Android SDK, nên tệp này CHƯA TỪNG QUA javac. Phải mở bằng Android Studio và
 * sửa lỗi biên dịch nếu có trước khi tin là nó chạy. Sau khi sửa Java, nhớ xoá
 * `android/app/build/intermediates/dex` — bước dex hay kẹt "UP-TO-DATE" và cho
 * ra APK mang mã cũ mà build vẫn báo thành công.
 */
public class NhanAppMoi extends BroadcastReceiver {

    /**
     * Sức chứa CỐ Ý NHỎ. Đây là bộ đệm để tầng web lấy ngay sau khi sự kiện xảy
     * ra, KHÔNG phải nhật ký cài đặt. Giữ nhiều là dựng một kho dữ liệu về thói
     * quen dùng máy của bác mà không ai xin phép.
     */
    private static final int SUC_CHUA = 10;

    /** Một sự kiện cài đặt đã bắt được. Chỉ sống trong bộ nhớ. */
    public static class AppMoi {
        public final String goi;
        public final String tenHienThi;
        public final String installer;
        public final boolean laCapNhat;
        public final long luc;

        AppMoi(String goi, String tenHienThi, String installer, boolean laCapNhat, long luc) {
            this.goi = goi;
            this.tenHienThi = tenHienThi;
            this.installer = installer;
            this.laCapNhat = laCapNhat;
            this.luc = luc;
        }
    }

    private static final Deque<AppMoi> DEM = new ArrayDeque<>();

    /** Tầng web gọi qua {@link KhoanDaPlugin}. Trả bản sao, xoá đệm. */
    public static synchronized List<AppMoi> layVaXoa() {
        List<AppMoi> ra = new ArrayList<>(DEM);
        DEM.clear();
        return ra;
    }

    public static synchronized int coBaoNhieu() {
        return DEM.size();
    }

    private static synchronized void them(AppMoi m) {
        DEM.addLast(m);
        while (DEM.size() > SUC_CHUA) DEM.removeFirst();
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || ctx == null) return;
        final String action = intent.getAction();
        if (!Intent.ACTION_PACKAGE_ADDED.equals(action)) return;

        final Uri data = intent.getData();
        if (data == null) return;
        final String goi = data.getSchemeSpecificPart();
        if (goi == null || goi.isEmpty()) return;

        // Đừng báo về chính mình khi Khoan Đã được cập nhật.
        if (goi.equals(ctx.getPackageName())) return;

        /*
         * ⚠️ `EXTRA_REPLACING` PHÂN BIỆT CÀI MỚI VỚI CẬP NHẬT, VÀ NÓ QUAN TRỌNG.
         * Android bắn ACTION_PACKAGE_ADDED cho cả hai. Báo động mỗi lần một app
         * tự cập nhật là báo động mỗi ngày — rồi bác tắt hết thông báo, và cái
         * cảnh báo THẬT cũng chìm theo.
         *
         * Tầng web vẫn nhận cờ này và tự quyết (`ung-dung-la.js`), nhưng lọc
         * sớm ở đây tiết kiệm được một lượt đánh thức WebView.
         */
        final boolean laCapNhat = intent.getBooleanExtra(Intent.EXTRA_REPLACING, false);
        if (laCapNhat) return;

        them(new AppMoi(goi, docTenHienThi(ctx, goi), docNguonCai(ctx, goi),
                false, System.currentTimeMillis()));

        /*
         * ⚠️ RECEIVER KHÔNG DỰNG MÀN CẢNH BÁO, VÀ KHÔNG QUYẾT ĐỊNH MỨC.
         *
         * Việc hiện gì là của tầng web — nơi biết vòng tròn gia đình, ngôn ngữ,
         * bậc chữ bác đã chọn, và nơi có bộ luật DUY NHẤT. Ở đây chỉ dựng một
         * thông báo TRUNG TÍNH để mở app; câu chữ và nhãn do tầng web quyết.
         *
         * Chuỗi ở đây CỐ Ý không mang nhãn rủi ro nào (§4.1) và không hứa hẹn
         * gì — nó chỉ nói có việc cần xem, và mọi kết luận nằm sau khi mở app.
         *
         * ⚠️ CHUỖI TIẾNG VIỆT MÃ CỨNG Ở ĐÂY LÀ MỘT KHOẢN NỢ ĐÃ BIẾT.
         * §4.1 đòi mọi chuỗi người dùng đọc phải đến từ catalog i18n. Lớp
         * native chạy trước khi WebView kịp khởi động nên chưa với tới catalog
         * được. Cách trả nợ: đưa hai chuỗi này vào `strings.xml` theo locale,
         * cùng cách `ThongBaoCanhBao` sẽ phải làm. Ghi ở đây để không ai tưởng
         * đây là mẫu đúng để chép.
         */
        ThongBaoCanhBao.hien(ctx,
                "Khoan Đã",
                "Có một việc cần bác xem. Chạm để mở.");
    }

    /**
     * Tên người dùng nhìn thấy. Rơi về chính tên gói khi không đọc được —
     * §4.3: "không đọc được" phải nói khác "không có", và tầng web phân biệt
     * được bằng việc tenHienThi trùng goi.
     */
    private static String docTenHienThi(Context ctx, String goi) {
        try {
            PackageManager pm = ctx.getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(goi, 0);
            CharSequence ten = pm.getApplicationLabel(ai);
            return ten == null ? goi : ten.toString();
        } catch (Exception e) {
            return goi;
        }
    }

    /**
     * NGUỒN CÀI — tên gói của trình đã cài app này.
     *
     * ⚠️ TRẢ VỀ null KHI KHÔNG BIẾT, VÀ ĐỪNG ĐỔI THÀNH CHUỖI RỖNG HAY "unknown".
     * `null` ở đây có nghĩa RẤT CỤ THỂ với `ung-dung-la.js`: không có trình cài
     * nào đứng tên, tức là app được cài bằng tệp .apk tải tay. Đó là tín hiệu
     * MẠNH NHẤT, không phải một giá trị thiếu.
     *
     * ⚠️ `getInstallerPackageName` bị đánh dấu lỗi thời từ API 30 nhưng vẫn là
     * đường duy nhất cho máy cũ — mà máy cũ đúng là máy nhóm người dùng này
     * dùng. Giữ cả hai nhánh.
     */
    private static String docNguonCai(Context ctx, String goi) {
        try {
            PackageManager pm = ctx.getPackageManager();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                InstallSourceInfo isi = pm.getInstallSourceInfo(goi);
                return isi == null ? null : isi.getInstallingPackageName();
            }
            @SuppressWarnings("deprecation")
            String cu = pm.getInstallerPackageName(goi);
            return cu;
        } catch (Exception e) {
            return null;
        }
    }
}
