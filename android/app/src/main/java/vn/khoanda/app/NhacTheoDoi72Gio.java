package vn.khoanda.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;

/**
 * NHẮC TRONG 72 GIỜ SAU SỰ CỐ — lời nhắc hẹn giờ, chạy cả khi app đã đóng.
 *
 * ══════════ VÌ SAO CẦN ══════════
 * Ba ngày sau khi lỡ chuyển tiền là lúc kẻ gian quay lại lần hai: "nộp phí để lấy
 * lại tiền", "tài khoản vẫn đang bị điều tra". Màn Bảo vệ 72 giờ trong app chỉ
 * nói được khi bác đang mở app. Lớp này nhắc ở các mốc 2 · 24 · 48 · 72 giờ.
 *
 * ══════════ ⚠️ BA RÀNG BUỘC ══════════
 *
 * ① CHỮ DO TẦNG WEB NẠP XUỐNG (§11, §4.1). Lời nhắc đi qua catalog i18n; lớp này
 *   KHÔNG có câu nào tự viết. Thiếu chữ thì KHÔNG hiện gì — thà im còn hơn hiện
 *   một câu không qua kiểm duyệt, hay nửa app một thứ tiếng.
 *
 * ② HẸN KHÔNG CHÍNH XÁC TỪNG GIÂY, CỐ Ý. `setAndAllowWhileIdle` không cần quyền
 *   SCHEDULE_EXACT_ALARM. Một lời nhắc "đừng chuyển thêm tiền" tới trễ vài phút
 *   không hại gì; xin thêm một quyền nhạy cảm để đúng từng giây thì không đáng.
 *
 * ③ KHÔNG TỰ LÀM GÌ THAY BÁC. Không tự gọi, không mở app ngân hàng (người dùng
 *   chốt 17/9/2026). Bấm vào lời nhắc chỉ mở Khoan Đã ở trang chủ, nơi có thẻ
 *   theo dõi, số tổng đài và hồ sơ vụ việc.
 *
 * Máy khởi động lại thì Android xoá mọi báo thức — `KhoiDongLai` gọi `henLich()`
 * để dựng lại các mốc còn ở tương lai.
 */
public class NhacTheoDoi72Gio extends BroadcastReceiver {

    static final String KHO = "khoanda_theo_doi_72h";
    static final String KHOA_BAT_DAU = "bat_dau";
    static final String KHOA_TIEU_DE = "tieu_de";
    /** Mảng JSON, mỗi phần tử là chữ của một mốc, cùng thứ tự với MOC_GIO. */
    static final String KHOA_NOI_DUNG = "noi_dung";

    /** Mốc nhắc tính bằng giờ. PHẢI khớp `MOC_NHAC_GIO` ở src/lib/theo-doi-72-gio.ts — test chặn. */
    static final long[] MOC_GIO = {2, 24, 48, 72};

    private static final String HANH_DONG = "vn.khoanda.app.NHAC_THEO_DOI_72_GIO";
    private static final String THEM_MOC = "moc";
    private static final String KENH = "khoanda_theo_doi_72h_v1";
    private static final int MA_THONG_BAO = 2101;
    private static final int MA_YEU_CAU_GOC = 7200;
    private static final long MOT_GIO = 3_600_000L;

    private static PendingIntent yeuCau(Context ctx, int moc) {
        Intent i = new Intent(ctx, NhacTheoDoi72Gio.class).setAction(HANH_DONG).putExtra(THEM_MOC, moc);
        return PendingIntent.getBroadcast(ctx, MA_YEU_CAU_GOC + moc, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Hẹn lại MỌI mốc còn ở tương lai. Trả về số mốc đã hẹn. */
    static int henLich(Context ctx) {
        SharedPreferences sp = ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE);
        long batDau = sp.getLong(KHOA_BAT_DAU, 0L);
        if (batDau <= 0L) return 0;
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return 0;
        long bayGio = System.currentTimeMillis();
        int daHen = 0;
        for (int i = 0; i < MOC_GIO.length; i++) {
            long luc = batDau + MOC_GIO[i] * MOT_GIO;
            PendingIntent pi = yeuCau(ctx, i);
            if (luc <= bayGio) {
                am.cancel(pi);
                continue;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, luc, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, luc, pi);
            }
            daHen++;
        }
        return daHen;
    }

    /** Huỷ mọi mốc và xoá dữ liệu theo dõi. */
    static void huy(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            for (int i = 0; i < MOC_GIO.length; i++) am.cancel(yeuCau(ctx, i));
        }
        ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE).edit().clear().apply();
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (ctx == null || intent == null || !HANH_DONG.equals(intent.getAction())) return;
        int moc = intent.getIntExtra(THEM_MOC, -1);
        if (moc < 0 || moc >= MOC_GIO.length) return;

        SharedPreferences sp = ctx.getSharedPreferences(KHO, Context.MODE_PRIVATE);
        String tieuDe = sp.getString(KHOA_TIEU_DE, null);
        String noiDung = null;
        try {
            JSONArray ds = new JSONArray(sp.getString(KHOA_NOI_DUNG, "[]"));
            if (moc < ds.length()) noiDung = ds.optString(moc, null);
        } catch (Exception e) {
            noiDung = null;
        }
        // ① Thiếu chữ thì im lặng — không tự nghĩ ra câu.
        if (tieuDe == null || tieuDe.trim().isEmpty() || noiDung == null || noiDung.trim().isEmpty()) return;

        hien(ctx, tieuDe, noiDung);
        if (moc == MOC_GIO.length - 1) huy(ctx);   // mốc cuối: hết đợt theo dõi
    }

    private static void hien(Context ctx, String tieuDe, String noiDung) {
        try {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel k = new NotificationChannel(
                        KENH,
                        ctx.getString(R.string.kenh_theo_doi_72h_ten),
                        NotificationManager.IMPORTANCE_DEFAULT);
                k.setDescription(ctx.getString(R.string.kenh_theo_doi_72h_mo_ta));
                nm.createNotificationChannel(k);
            }
            Intent mo = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("khoanda://loi-tat/theo-doi-72-gio"), ctx, MainActivity.class);
            mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(ctx, 72, mo,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(ctx, KENH)
                    : new Notification.Builder(ctx);
            Notification tb = b
                    .setSmallIcon(R.drawable.ic_launcher_foreground)
                    .setContentTitle(tieuDe)
                    .setContentText(noiDung)
                    .setStyle(new Notification.BigTextStyle().bigText(noiDung))
                    .setAutoCancel(true)
                    .setShowWhen(true)
                    .setContentIntent(pi)
                    .build();
            nm.notify(MA_THONG_BAO, tb);
        } catch (Exception e) {
            // Quyền thông báo bị thu hồi hoặc ROM chặn — không có gì để làm thêm.
        }
    }
}
