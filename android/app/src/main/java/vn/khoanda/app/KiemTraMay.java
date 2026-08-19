package vn.khoanda.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * MÁY CÓ ĐANG BỊ ĐIỀU KHIỂN KHÔNG — nguồn đầu vào thứ tư (§4.3).
 *
 * ══════════ VÌ SAO CÓ LỚP NÀY ══════════
 *
 * Kịch bản lừa đảo phổ biến nhất ở Việt Nam có bốn bước:
 *   ① gọi điện xưng công an / cán bộ thuế
 *   ② giục cài một ứng dụng "dịch vụ công"
 *   ③ bác cài xong, bấm cho phép hết ⇒ MÁY BỊ CHIẾM
 *   ④ tiền tự chuyển đi
 *
 * Khoan Đã bắt được ① và ②. Bước ③ là một lỗ hổng nằm ngay giữa kịch bản mà
 * chính app này đã nhận diện được — và ở bước đó, mọi thứ app làm đều vô nghĩa:
 * kẻ tấn công NHÌN THẤY màn cảnh báo theo thời gian thực và sẽ bảo bác gỡ app.
 *
 * Dấu vết của bước ③ đọc được mà không cần quyền gì: một dịch vụ trợ năng đang
 * bật, không phải app hệ thống, cài từ một tệp chứ không qua CH Play.
 *
 * ══════════ ⚠️ ĐO ĐƯỢC GÌ, KHÔNG ĐOÁN (19/8/2026, Android 14) ══════════
 *
 * ✅ `ENABLED_ACCESSIBILITY_SERVICES` — đọc được, KHÔNG cần quyền nào
 * ✅ tên hiển thị của app đó — đọc được
 * ✅ cài từ đâu — `com.android.vending` = CH Play, khác = từ tệp
 * ❌ QUYỀN VẼ ĐÈ CỦA APP KHÁC — `checkOpNoThrow` trả MODE_DEFAULT, không phải
 *    trạng thái thật. Cần quyền hệ thống. ĐỪNG THÊM LẠI: nó sẽ luôn báo "không
 *    có app nào", tức là một màn hình khai sạch trong khi chưa hề đo được gì —
 *    đúng con bug §4.3 mà cả dự án này sinh ra để chống.
 *
 * ══════════ ⚠️ §4.2 — LỚP NÀY KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO ══════════
 *
 * Nó đọc và trả về sự thật đọc được. Không chấm điểm, không xếp mức, không có
 * danh sách "app xấu". Thêm một dòng `if (ten.contains("dich vu cong"))` vào
 * đây là tạo đường quyết định thứ hai — §12 cấm thẳng.
 *
 * ══════════ ⚠️ §6.9 — TÊN ỨNG DỤNG KHÔNG RỜI KHỎI MÁY ══════════
 *
 * Danh sách app đã cài là dữ liệu nhận dạng rất mạnh. Lớp này trả tên cho tầng
 * web ĐỂ HIỂN THỊ TRONG MÁY; thứ đi lên máy chủ chỉ là mấy con số (xem
 * `native.ts`). Đừng nối thẳng đầu ra của lớp này vào body của `/api/analyze`.
 */
public final class KiemTraMay {

    private KiemTraMay() { }

    /**
     * CHỢ ỨNG DỤNG CHÍNH THỨC — cài từ đây thì KHÔNG bị nêu tên.
     *
     * ⚠️ CHỈ CÓ `com.android.vending` LÀ MỘT LỖI BÁO ĐỘNG GIẢ DIỆN RỘNG.
     *
     * Phần lớn điện thoại bán ở Việt Nam là Xiaomi, Oppo, Realme, Vivo, Samsung
     * — và mỗi hãng có chợ riêng cài sẵn. App tải từ GetApps hay Galaxy Store
     * có `installingPackageName` KHÁC `com.android.vending`, nên nếu chỉ nhận
     * mỗi CH Play thì mọi app tải từ chợ của hãng đều bị xếp là "cài từ tệp".
     *
     * Hậu quả không phải là phiền: nó là mất tác dụng. Bác thấy app báo nhầm
     * vài lần rồi bỏ qua luôn cái cảnh báo đó — và lần có app lừa đảo thật, nó
     * nằm lẫn trong danh sách bác đã học cách phớt lờ (§4.6).
     */
    private static final String[] CHO_CHINH_THUC = {
        "com.android.vending",                 // CH Play
        "com.xiaomi.mipicks",                  // Xiaomi GetApps
        "com.xiaomi.market",
        "com.heytap.market",                   // Oppo / Realme
        "com.oppo.market",
        "com.bbk.appstore",                    // Vivo
        "com.vivo.appstore",
        "com.huawei.appmarket",                // Huawei AppGallery
        "com.sec.android.app.samsungapps",     // Samsung Galaxy Store
        "com.samsung.android.app.galaxystore",
    };

    private static boolean laChoChinhThuc(String nguon) {
        if (nguon == null) return false;
        for (String c : CHO_CHINH_THUC) if (c.equals(nguon)) return true;
        return false;
    }

    public static JSONObject doc(Context ctx) {
        JSONObject r = new JSONObject();
        JSONArray ds = new JSONArray();
        try {
            PackageManager pm = ctx.getPackageManager();

            /*
             * ⚠️ CHUỖI NÀY CÓ THỂ null, VÀ null KHÔNG PHẢI LÀ "MÁY SẠCH".
             * null nghĩa là chưa từng có dịch vụ nào được bật — đó là một sự
             * thật đọc được, nên vẫn là `docDuoc: true` với danh sách rỗng.
             * Còn ném ngoại lệ mới là KHÔNG ĐỌC ĐƯỢC, và hai ca đó phải khác
             * nhau ở đầu ra (§4.3).
             */
            String bat = Settings.Secure.getString(
                    ctx.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);

            Set<String> goi = new LinkedHashSet<>();
            if (bat != null && !bat.trim().isEmpty()) {
                // Dạng "pkg/cls:pkg/cls". Một gói có thể có nhiều dịch vụ —
                // LinkedHashSet gộp lại để không kể tên bác nghe hai lần.
                for (String phan : bat.split(":")) {
                    int cheo = phan.indexOf('/');
                    if (cheo > 0) goi.add(phan.substring(0, cheo));
                    else if (!phan.trim().isEmpty()) goi.add(phan.trim());
                }
            }

            for (String p : goi) {
                JSONObject m = new JSONObject();
                m.put("goi", p);
                try {
                    ApplicationInfo ai = pm.getApplicationInfo(p, 0);
                    m.put("ten", String.valueOf(pm.getApplicationLabel(ai)));

                    /*
                     * ⚠️ NHẬN DIỆN APP HỆ THỐNG BẰNG CỜ, KHÔNG BẰNG TÊN.
                     * Kẻ tấn công đặt tên "Google Play Service" là chuyện thường
                     * ngày. `FLAG_SYSTEM` thì không giả được — nó do hệ điều hành
                     * đặt theo vị trí cài đặt.
                     */
                    boolean heThong = (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0
                            || (ai.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0;

                    String nguon = null;
                    try {
                        nguon = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                                ? pm.getInstallSourceInfo(p).getInstallingPackageName()
                                : pm.getInstallerPackageName(p);
                    } catch (Throwable t) {
                        // Không đọc được nguồn cài — để null, phân loại bên dưới
                        // sẽ rơi vào "khong_ro" chứ không tự nhận là an toàn.
                    }

                    String nguonCai;
                    if (heThong)                        nguonCai = "cai_san";
                    else if (laChoChinhThuc(nguon))     nguonCai = "ch_play";
                    else if (nguon != null)             nguonCai = "tu_tep";
                    else                                nguonCai = "khong_ro";
                    m.put("nguonCai", nguonCai);

                    try {
                        PackageInfo pi = pm.getPackageInfo(p, 0);
                        m.put("ngayCai", pi.firstInstallTime);
                    } catch (Throwable t) {
                        m.put("ngayCai", 0);
                    }
                } catch (Throwable t) {
                    /*
                     * ⚠️ ĐỌC HỤT MỘT MỤC THÌ NÓI RA MỤC ĐÓ, ĐỪNG BỎ QUA NÓ.
                     * Bỏ qua là biến "có một app tôi không đọc được" thành "không
                     * có app nào" — chính xác là dạng lỗi §4.3.
                     */
                    m.put("ten", p);
                    m.put("nguonCai", "khong_ro");
                    m.put("ngayCai", 0);
                }
                ds.put(m);
            }

            r.put("docDuoc", true);
            r.put("dichVuTroNang", ds);
        } catch (Throwable t) {
            /*
             * §4.3 — KHÔNG ĐỌC ĐƯỢC ≠ KHÔNG CÓ GÌ.
             * Tầng web đẩy `chua_xem_duoc_trang_thai_may` vào `chuaKiem`, và màn
             * kết quả hiện nó cùng cỡ chữ với nhãn rủi ro.
             */
            try {
                r.put("docDuoc", false);
                r.put("dichVuTroNang", new JSONArray());
            } catch (Throwable bo) {
                // JSONObject.put ném thì không còn gì cứu được. Trả về rỗng.
            }
        }
        return r;
    }

    /** Mở thẳng màn Cài đặt trợ năng của hệ điều hành. */
    public static Intent manCaiDat() {
        return new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }
}
