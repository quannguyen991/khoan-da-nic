package vn.khoanda.app;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * BỘ LỌC TÊN MIỀN CỤC BỘ (TẦNG 0 DNS) — chạy 100% trên máy, không gửi truy vấn DNS ra máy chủ ngoài.
 *
 * - Chỉ chặn các tên miền giả mạo / lừa đảo đã biết hoặc tên miền đuôi rủi ro kết hợp từ khóa
 *   mạo danh cơ quan nhà nước / ngân hàng Việt Nam.
 * - Tuyệt đối không chặn các tên miền chính thức (`gov.vn`, `chinhphu.vn`, ngân hàng thật).
 * - Không lưu nhật ký lịch sử duyệt web của người dùng.
 */
public final class BoLocTenMien {

    private static final List<String> ALLOWLIST_CHINH_THUC = Arrays.asList(
            "gov.vn", "chinhphu.vn", "dichvucong.gov.vn", "bocongan.gov.vn", "csgt.vn",
            "gdt.gov.vn", "baohiemxahoi.gov.vn", "evn.com.vn", "vneid.gov.vn",
            "vietcombank.com.vn", "bidv.com.vn", "vietinbank.vn", "agribank.com.vn",
            "techcombank.com.vn", "mbbank.com.vn", "vpbank.com.vn", "acb.com.vn",
            "tpbank.vn", "sacombank.com.vn", "hdbank.com.vn", "vib.com.vn",
            "msb.com.vn", "ocb.com.vn", "seabank.com.vn", "shb.com.vn",
            "momo.vn", "zalopay.vn", "vnpay.vn", "viettelmoney.vn"
    );

    private static final Set<String> DUOI_MIEN_RUI_RO = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "top", "xyz", "vip", "icu", "buzz", "click", "link", "tk", "ml", "ga", "cf", "gq", "loan"
    )));

    private static final List<String> TU_KHOA_MAO_DANH = Arrays.asList(
            "bocongan", "congan", "canhsat", "vienkiemsat", "toaan",
            "dichvucong", "vneid", "vssid", "etax", "cucthue", "tongcucthue", "phatnguoi",
            "vietcombank", "bidv", "vietinbank", "agribank", "techcombank",
            "mbbank", "vpbank", "sacombank", "tpbank", "zalopay", "momopay"
    );

    private static final Set<String> DANH_SACH_DEN_MAC_DINH = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "bocongan-vn.xyz",
            "bocongan-online.top",
            "dichvucong-vn.xyz",
            "dichvucong-online.top",
            "vneid-capnhat.xyz",
            "vneid-online.top",
            "phatnguoi-csgt.xyz",
            "cucthue-vn.top",
            "vietcombank-xacthuc.xyz",
            "bidv-xacthuc.top"
    )));

    private static final Set<String> DANH_SACH_DEN_BO_SUNG = ConcurrentHashMap.newKeySet();

    private BoLocTenMien() { }

    public static void themTenMienChan(String domain) {
        String clean = chuanHoa(domain);
        if (!clean.isEmpty() && !laAllowlist(clean)) {
            DANH_SACH_DEN_BO_SUNG.add(clean);
        }
    }

    public static void xoaBoSung() {
        DANH_SACH_DEN_BO_SUNG.clear();
    }

    static String chuanHoa(String domain) {
        if (domain == null) return "";
        String d = domain.trim().toLowerCase(Locale.ROOT);
        while (d.endsWith(".")) d = d.substring(0, d.length() - 1);
        return d;
    }

    public static boolean laAllowlist(String domain) {
        String d = chuanHoa(domain);
        if (d.isEmpty()) return false;
        for (String a : ALLOWLIST_CHINH_THUC) {
            if (d.equals(a) || d.endsWith("." + a)) return true;
        }
        return false;
    }

    /** Trả về `true` nếu tên miền nên bị chặn cục bộ bởi Local DNS VPN. */
    public static boolean nenChan(String domain) {
        String d = chuanHoa(domain);
        if (d.isEmpty() || laAllowlist(d)) return false;

        if (DANH_SACH_DEN_MAC_DINH.contains(d) || DANH_SACH_DEN_BO_SUNG.contains(d)) {
            return true;
        }
        for (String x : DANH_SACH_DEN_MAC_DINH) {
            if (d.endsWith("." + x)) return true;
        }
        for (String x : DANH_SACH_DEN_BO_SUNG) {
            if (d.endsWith("." + x)) return true;
        }

        int dot = d.lastIndexOf('.');
        if (dot <= 0 || dot >= d.length() - 1) return false;
        String tld = d.substring(dot + 1);
        if (!DUOI_MIEN_RUI_RO.contains(tld)) return false;

        String khongDauGach = d.replace("-", "").replace("_", "");
        for (String kw : TU_KHOA_MAO_DANH) {
            if (khongDauGach.contains(kw)) return true;
        }
        return false;
    }
}
