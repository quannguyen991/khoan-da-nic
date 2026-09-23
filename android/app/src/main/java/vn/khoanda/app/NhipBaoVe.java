package vn.khoanda.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;

import androidx.core.content.ContextCompat;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * ══════════ NHỊP BẢO VỆ — "máy bố mẹ còn được bảo vệ không?" (23/9/2026) ══════════
 *
 * Dịch vụ nền {@link TheoDoiCuocGoi} gọi lớp này mỗi 6 giờ. Nhịp ngừng tới là tín
 * hiệu cho máy con: "N ngày chưa báo về — có thể máy đã tắt bảo vệ". Đúng lỗi âm thầm
 * cần chặn: Xiaomi/Oppo giết dịch vụ nền mà cả nhà tưởng vẫn đang chạy (§4.3).
 *
 * ⚠️ §12 — CHỈ CHẠY KHI BÁC ĐÃ BẬT "cho con xem". Tầng web đọc quy tắc rồi mới trao
 *    token qua `KhoanDaPlugin.datNhipBaoVe`; bác tắt hoặc đăng xuất ⇒ kho này bị xoá
 *    và lớp này không gửi gì. Máy chủ cũng tự kiểm lại quy tắc (hai lớp chặn).
 * ⚠️ CHỈ BA GIÁ TRỊ BOOL. Không nội dung tin, không số, không vị trí, không pin,
 *    không danh sách ứng dụng. Không ghi log (token nằm trong yêu cầu).
 * ⚠️ CHỈ `https://` — địa chỉ do tầng web trao, cùng máy chủ với mọi lượt gọi khác.
 * ⚠️ 401 ⇒ token hết hạn / bị thu hồi (gia hạn phiên cấp token mới): xoá, thôi gửi,
 *    đợi bác mở app để tầng web trao token mới. Không thử lại vô tận.
 */
final class NhipBaoVe {

    static final String KHO = "khoanda_nhip_bao_ve";
    static final String KHOA_TOKEN = "token";
    static final String KHOA_DUONG = "duong";
    /** 6 giờ: đủ dày để "2 ngày chưa báo về" có nghĩa, đủ thưa để không tốn pin. */
    static final long CHU_KY_MS = 6 * 60 * 60 * 1000L;

    private NhipBaoVe() {}

    static void luu(Context ctx, String token, String duong) {
        ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE).edit()
                .putString(KHOA_TOKEN, token)
                .putString(KHOA_DUONG, duong)
                .apply();
    }

    static void xoa(Context ctx) {
        ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE).edit().clear().apply();
    }

    /** Gửi một nhịp ở luồng nền. Không có token thì thôi — nghĩa là bác chưa bật. */
    static void gui(Context ctx) {
        final Context app = ctx.getApplicationContext();
        new Thread(() -> guiDongBo(app), "khoanda-nhip-bao-ve").start();
    }

    private static void guiDongBo(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE);
        String token = sp.getString(KHOA_TOKEN, null);
        String duong = sp.getString(KHOA_DUONG, null);
        if (token == null || token.isEmpty() || duong == null || !duong.startsWith("https://")) return;

        HttpURLConnection ketNoi = null;
        try {
            String than = "{\"nguon\":\"dich_vu_nen\",\"laApk\":true,\"quyen\":{"
                    + "\"docThongBao\":" + DocThongBao.daBatQuyen(ctx)
                    + ",\"theoDoiCuocGoi\":" + theoDoiCuocGoi(ctx)
                    + ",\"hienTrenApp\":" + PopupDeManHinh.daBatQuyen(ctx)
                    + "}}";
            ketNoi = (HttpURLConnection) new URL(duong).openConnection();
            ketNoi.setRequestMethod("POST");
            ketNoi.setConnectTimeout(10_000);
            ketNoi.setReadTimeout(10_000);
            ketNoi.setDoOutput(true);
            ketNoi.setRequestProperty("Content-Type", "application/json");
            ketNoi.setRequestProperty("Authorization", "Bearer " + token);
            try (OutputStream ra = ketNoi.getOutputStream()) {
                ra.write(than.getBytes(StandardCharsets.UTF_8));
            }
            if (ketNoi.getResponseCode() == 401) xoa(ctx);
        } catch (Throwable ignored) {
            // Mất mạng: nhịp sau thử lại. Không log — yêu cầu có token.
        } finally {
            if (ketNoi != null) ketNoi.disconnect();
        }
    }

    /** "Theo dõi cuộc gọi" = bác đã bật VÀ máy còn cho quyền đọc trạng thái cuộc gọi. */
    static boolean theoDoiCuocGoi(Context ctx) {
        boolean daBat = ctx.getSharedPreferences(TheoDoiCuocGoi.KHO, Context.MODE_PRIVATE)
                .getBoolean(TheoDoiCuocGoi.KHOA_BAT, false);
        boolean coQuyen = ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_PHONE_STATE)
                == PackageManager.PERMISSION_GRANTED;
        return daBat && coQuyen;
    }
}
