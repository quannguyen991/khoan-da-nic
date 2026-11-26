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
            "gdt.gov.vn", "thuedientu.gdt.gov.vn", "baohiemxahoi.gov.vn",
            "evn.com.vn", "evnhanoi.vn", "evnspc.vn", "vneid.gov.vn",
            "vietcombank.com.vn", "bidv.com.vn", "vietinbank.vn", "agribank.com.vn",
            "techcombank.com.vn", "mbbank.com.vn", "vpbank.com.vn", "acb.com.vn",
            "tpbank.vn", "sacombank.com.vn", "hdbank.com.vn", "vib.com.vn",
            "msb.com.vn", "ocb.com.vn", "seabank.com.vn", "shb.com.vn",
            "eximbank.com.vn", "lpbank.com.vn",
            "momo.vn", "zalopay.vn", "vnpay.vn", "viettelmoney.vn",
            "vietnampost.vn", "vnpost.vn", "viettelpost.com.vn", "ghn.vn", "ghtk.vn", "shopee.vn"
    );

    private static final Set<String> DUOI_MIEN_RUI_RO = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            "top", "xyz", "vip", "icu", "buzz", "click", "link", "tk", "ml", "ga", "cf", "gq", "loan",
            "rest", "cyou", "shop", "online", "site", "website", "space", "fun", "live", "work",
            "monster", "quest", "sbs", "cfd", "bond", "pro", "store", "life", "help", "asia"
    )));

    private static final List<String> TU_KHOA_MAO_DANH = Arrays.asList(
            "bocongan", "congan", "canhsat", "vienkiemsat", "toaan",
            "dichvucong", "vneid", "vssid", "bhxh", "etax", "cucthue", "tongcucthue", "phatnguoi",
            "evn", "dienluc", "vietnampost", "vnpost", "viettelpost", "ghn", "ghtk", "shopee", "tiktok",
            "vietcombank", "bidv", "vietinbank", "agribank", "techcombank",
            "mbbank", "vpbank", "acb", "sacombank", "tpbank", "hdbank", "vib",
            "msb", "ocb", "shb", "seabank", "eximbank", "lpbank",
            "momo", "momopay", "zalopay", "vnpay", "viettelmoney", "napas"
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
            "etax-hoanthue.online",
            "dienluc-evn.top",
            "bhxh-vssid.xyz",
            "vietcombank-xacthuc.xyz",
            "bidv-xacthuc.top",
            "techcombank-baomat.online",
            "mbbank-xacthuc.site",
            "viettelpost-giaohang.shop",
            "vnpost-nhanhang.online",
            "momo-nhanthuong.top"
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

        // Bat bien the typosquatting gan giong ten mien chinh thuc (khoang cach <= 2 voi nhan >= 6 ky tu)
        String nhanChinh = layNhanChinh(d);
        if (nhanChinh.length() >= 6) {
            for (String goc : ALLOWLIST_CHINH_THUC) {
                String nhanGoc = layNhanChinh(goc);
                if (nhanGoc.length() >= 6 && !nhanChinh.equals(nhanGoc) && levenshtein(nhanChinh, nhanGoc) <= 2) {
                    return true;
                }
            }
        }
        return false;
    }

    private static String layNhanChinh(String domain) {
        String s = domain;
        if (s.startsWith("www.")) s = s.substring(4);
        int dot = s.indexOf('.');
        return dot > 0 ? s.substring(0, dot) : s;
    }

    private static int levenshtein(String a, String b) {
        int m = a.length();
        int n = b.length();
        if (Math.abs(m - n) > 2) return 3;
        int[] prev = new int[n + 1];
        int[] curr = new int[n + 1];
        for (int j = 0; j <= n; j++) prev[j] = j;
        for (int i = 1; i <= m; i++) {
            curr[0] = i;
            for (int j = 1; j <= n; j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[n];
    }
}
