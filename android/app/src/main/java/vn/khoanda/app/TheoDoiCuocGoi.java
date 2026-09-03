package vn.khoanda.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;

import java.util.concurrent.Executor;

/**
 * NHẮC KHI MỘT CUỘC GỌI KÉO DÀI BẤT THƯỜNG.
 *
 * ══════════ VÌ SAO TỒN TẠI ══════════
 *
 * Mọi thứ khác trong Khoan Đã đều chờ bác chủ động đưa nội dung vào. Nhưng vụ
 * lừa đảo thật không diễn ra bằng tin nhắn — nó diễn ra trong một cuộc gọi kéo
 * dài hai đến bốn tiếng, và câu đầu tiên kẻ lừa đảo dặn là "không được tắt máy,
 * không được nói với ai".
 *
 * Đúng lúc đó bác đang áp điện thoại vào tai. Bác sẽ không mở app, không dán
 * tin nhắn, không bấm kiểm. Toàn bộ hệ thống phân tích đứng chờ một hành động
 * mà hoàn cảnh đã ngăn không cho xảy ra.
 *
 * Lớp này là đường duy nhất trong app chen được vào khoảnh khắc đó.
 *
 * ══════════ ⚠️ KHÔNG NGHE, KHÔNG GHI, KHÔNG BIẾT SỐ NÀO ══════════
 *
 * Nó chỉ đọc MỘT thứ: máy có đang trong cuộc gọi hay không. Không nội dung,
 * không số điện thoại, không nhật ký, không danh bạ.
 *
 * ⚠️ CỐ Ý KHÔNG XIN `READ_CALL_LOG`. Từ Android 10, muốn biết SỐ của cuộc gọi
 * đến thì phải có quyền đó — và nó mở ra toàn bộ lịch sử ai gọi cho bác, gọi
 * lúc nào, bao lâu. Đổi lấy khả năng phân biệt "số lạ" với "con gái", cái giá
 * là một kho dữ liệu về đời sống của bác nằm trong tay app này.
 *
 * Không đáng. Hệ quả phải chấp nhận: app KHÔNG phân biệt được người gọi, nên
 * nó chỉ được nói về THỜI LƯỢNG, và tuyệt đối không được nói câu nào hàm ý
 * người bên kia là kẻ xấu (§11). Xem chuỗi mà tầng web nạp xuống.
 *
 * ══════════ ⚠️ §4.2 — KHÔNG QUYẾT ĐỊNH GÌ VỀ RỦI RO ══════════
 *
 * Một cuộc gọi dài KHÔNG phải một mức rủi ro. Lớp này không chấm điểm, không
 * gọi `/api/analyze`, không sinh nhãn. Nó chỉ đặt một câu hỏi cho bác đúng lúc
 * bác còn nghe được câu hỏi đó.
 *
 * ══════════ ⚠️ §11 — LỚP NÀY KHÔNG TỰ SOẠN CÂU NÀO ══════════
 *
 * Service chạy khi app đã đóng, nên không có tầng web nào để hỏi chữ lúc đó.
 * Chữ được tầng web NẠP SẴN vào SharedPreferences mỗi lần mở app, đã qua catalog
 * i18n. Chưa có chữ ⇒ KHÔNG HIỆN GÌ. Thà im còn hơn hiện một câu Java tự nghĩ.
 */
public class TheoDoiCuocGoi extends Service {

    private static final String KENH = "khoanda_cuoc_goi_dai_v1";
    private static final int MA_THUONG_TRUC = 3001;
    private static final int MA_NHAC = 3002;

    static final String KHO = "khoanda_cuoc_goi";
    static final String KHOA_BAT = "theo_doi_dang_bat";
    static final String KHOA_PHUT = "moc_phut";
    static final String KHOA_TIEU_DE = "chu_tieu_de";
    static final String KHOA_NOI_DUNG = "chu_noi_dung";
    static final String KHOA_NUT_ON = "chu_nut_on";
    static final String KHOA_NUT_MO = "chu_nut_mo";

    /**
     * ⚠️ 25 PHÚT LÀ MỘT LỰA CHỌN, KHÔNG PHẢI MỘT PHÁT HIỆN.
     *
     * Không có nghiên cứu nào trong tay nói 25 là ngưỡng đúng. Nó được chọn vì
     * hai lẽ: các vụ giả danh công an được báo chí thuật lại đều kéo dài hàng
     * giờ, còn cuộc gọi thường ngày của người cao tuổi phần lớn ngắn hơn nhiều.
     *
     * Nếu sau này đo được số thật thì sửa ở đây — và sửa cả câu này. Đừng để
     * một con số phỏng đoán nằm lâu tới mức trông như đã được chứng minh.
     */
    static final int PHUT_MAC_DINH = 25;

    private TelephonyManager tm;
    private Object boNghe;                 // TelephonyCallback (API 31+)
    private android.telephony.PhoneStateListener boNgheCu;   // dưới API 31
    private final Handler tay = new Handler(Looper.getMainLooper());
    private Runnable hen;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        dungKenh();
        /*
         * ⚠️ `startForeground` PHẢI GỌI TRONG VÀI GIÂY ĐẦU. Android giết service
         * kèm `ForegroundServiceDidNotStartInTimeException` nếu chậm — và cái
         * chết đó xảy ra ở nền, không có màn hình nào báo.
         */
        try {
            startForeground(MA_THUONG_TRUC, thongBaoThuongTruc());
        } catch (Throwable t) {
            dungHan();
            return;
        }
        batDauNghe();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // START_STICKY: ROM dọn nền xong thì Android dựng lại — đây là thứ phải
        // sống lâu, không phải một việc chạy một lần.
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        huyHen();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && boNghe != null) {
                tm.unregisterTelephonyCallback((TelephonyCallback) boNghe);
            } else if (boNgheCu != null) {
                tm.listen(boNgheCu, android.telephony.PhoneStateListener.LISTEN_NONE);
            }
        } catch (Throwable t) {
            // Bộ nghe đã chết trước ta. Không có gì để dọn thêm.
        }
        super.onDestroy();
    }

    // ─────────── Nghe trạng thái cuộc gọi ───────────

    private void batDauNghe() {
        try {
            tm = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (tm == null) { dungHan(); return; }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Executor exec = getMainExecutor();
                BoNghe31 b = new BoNghe31();
                boNghe = b;
                tm.registerTelephonyCallback(exec, b);
            } else {
                boNgheCu = new android.telephony.PhoneStateListener() {
                    @Override
                    public void onCallStateChanged(int state, String soDienThoai) {
                        // ⚠️ `soDienThoai` KHÔNG ĐƯỢC DÙNG, và không được ghi lại.
                        // Không có `READ_CALL_LOG` thì nó rỗng; kể cả có cũng
                        // không phải việc của lớp này.
                        doiTrangThai(state);
                    }
                };
                tm.listen(boNgheCu, android.telephony.PhoneStateListener.LISTEN_CALL_STATE);
            }

            /*
             * ⚠️ ĐỌC TRẠNG THÁI HIỆN TẠI NGAY, ĐỪNG CHỜ NÓ ĐỔI — LỖI ĐO ĐƯỢC 19/8/2026.
             *
             * `CallStateListener` chỉ bắn khi trạng thái THAY ĐỔI. Nếu service
             * khởi động lại GIỮA một cuộc gọi đang diễn ra, nó không nhận được
             * sự kiện nào cả — và ngồi im cho tới cuộc gọi sau.
             *
             * Chuyện đó không hiếm chút nào, đây là ba đường dẫn tới nó:
             *   · ROM dọn nền (Xiaomi, Oppo, Vivo làm việc này rất mạnh tay);
             *   · Android dựng lại service theo START_STICKY sau khi thiếu bộ nhớ;
             *   · máy vừa khởi động lại và `KhoiDongLai` bật service lên.
             *
             * Và nó hỏng đúng vào lúc tệ nhất: cuộc gọi lừa đảo kéo dài hàng
             * giờ chính là cuộc gọi dễ bị service khởi động lại ngang nhất.
             *
             * `getCallState()` cho biết NGAY máy có đang trong cuộc gọi không.
             *
             * ⚠️ ĐỒNG HỒ SẼ ĐẾM LẠI TỪ ĐẦU. Ta không biết cuộc gọi đã kéo dài
             * bao lâu trước khi service sống lại — và không có cách nào biết mà
             * không đụng tới nhật ký cuộc gọi. Đếm lại từ đầu là muộn hơn thực
             * tế, nhưng muộn vẫn hơn im lặng hoàn toàn (§4.3).
             */
            try {
                if (tm.getCallState() == TelephonyManager.CALL_STATE_OFFHOOK) {
                    datHen();
                }
            } catch (Throwable t) {
                // Không đọc được trạng thái ban đầu — bộ nghe ở trên vẫn bắt
                // được lần đổi kế tiếp. Không dừng service vì chuyện này.
            }
        } catch (SecurityException e) {
            // Chưa có READ_PHONE_STATE. Tầng web đã kiểm trước khi bật, nhưng
            // quyền có thể bị thu hồi sau đó — dừng hẳn, đừng chạy mù.
            dungHan();
        } catch (Throwable t) {
            dungHan();
        }
    }

    private class BoNghe31 extends TelephonyCallback implements TelephonyCallback.CallStateListener {
        @Override
        public void onCallStateChanged(int state) {
            doiTrangThai(state);
        }
    }

    /**
     * ⚠️ CHỈ QUAN TÂM HAI TRẠNG THÁI: đang nói chuyện, và đã gác máy.
     *
     * `RINGING` cố ý bỏ qua — chuông reo chưa phải cuộc gọi, và đếm giờ từ lúc
     * chuông là đếm sai. Cũng không hiện gì lúc chuông reo: chen vào giữa lúc
     * bác đang với tay bắt máy là làm phiền không có lý do.
     */
    private void doiTrangThai(int state) {
        if (state == TelephonyManager.CALL_STATE_OFFHOOK) {
            datHen();
        } else if (state == TelephonyManager.CALL_STATE_IDLE) {
            huyHen();
            /*
             * ⚠️ GỠ LUÔN LỜI NHẮC KHI ĐÃ GÁC MÁY. Để nó nằm lại trên thanh sau
             * khi cuộc gọi kết thúc là nói về một chuyện đã qua, và lần sau bác
             * sẽ không phân biệt được nó đang nói về cuộc gọi nào.
             */
            try {
                NotificationManager nm = getSystemService(NotificationManager.class);
                if (nm != null) nm.cancel(MA_NHAC);
            } catch (Throwable t) {
                // không sao
            }
            try {
                PopupDeManHinh.an(this);
            } catch (Throwable t) {
                // không sao
            }
        }
    }

    private void datHen() {
        huyHen();
        SharedPreferences sp = getSharedPreferences(KHO, MODE_PRIVATE);
        int phut = sp.getInt(KHOA_PHUT, PHUT_MAC_DINH);
        if (phut < 5) phut = PHUT_MAC_DINH;          // chặn giá trị vô lý
        hen = this::nhac;
        tay.postDelayed(hen, phut * 60L * 1000L);
    }

    private void huyHen() {
        if (hen != null) { tay.removeCallbacks(hen); hen = null; }
    }

    // ─────────── Lời nhắc ───────────

    /**
     * ⚠️ MỘT LẦN MỘT CUỘC GỌI. KHÔNG NHẮC LẠI MỖI 25 PHÚT.
     *
     * Bác gọi con gái ở nước ngoài hai tiếng là chuyện thường. Nhắc một lần thì
     * bác bỏ qua và quên; nhắc bốn lần thì bác tắt hẳn tính năng — và lần bị
     * lừa thật, nó đã không còn ở đó (§4.6).
     */
    private void nhac() {
        hen = null;
        SharedPreferences sp = getSharedPreferences(KHO, MODE_PRIVATE);

        String tieuDe = sp.getString(KHOA_TIEU_DE, null);
        String noiDung = sp.getString(KHOA_NOI_DUNG, null);
        String nutOn = sp.getString(KHOA_NUT_ON, null);
        String nutMo = sp.getString(KHOA_NUT_MO, null);

        // §11 — chưa có chữ từ tầng web thì KHÔNG hiện gì.
        if (tieuDe == null || noiDung == null) return;

        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;

            Intent mo = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("khoanda://loi-tat/dang-bi-goi"), this, MainActivity.class);
            mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(this, 3, mo,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            Notification tb = new Notification.Builder(this, KENH)
                    .setSmallIcon(R.drawable.loi_tat_goi)
                    .setContentTitle(tieuDe)
                    .setContentText(noiDung)
                    .setStyle(new Notification.BigTextStyle().bigText(noiDung))
                    .setPriority(Notification.PRIORITY_HIGH)
                    .setCategory(Notification.CATEGORY_REMINDER)
                    .setAutoCancel(true)
                    .setContentIntent(pi)
                    .build();
            nm.notify(MA_NHAC, tb);
        } catch (Throwable t) {
            // Không hiện được thông báo — vẫn thử dải đè bên dưới.
        }

        /*
         * Dải đè lên màn hình là đường DUY NHẤT thấy được khi bác đang áp máy
         * vào tai: màn hình cuộc gọi che mất thanh thông báo.
         */
        try {
            if (nutOn != null && nutMo != null && PopupDeManHinh.daBatQuyen(this)) {
                PopupDeManHinh.hien(this, tieuDe, nutMo, nutOn);
            }
        } catch (Throwable t) {
            // Không có quyền vẽ đè, hoặc ROM chặn. Thông báo ở trên vẫn còn.
        }
    }

    // ─────────── Thông báo thường trực của service ───────────

    private void dungKenh() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;
            NotificationChannel k = new NotificationChannel(
                    KENH, getString(R.string.kenh_cuoc_goi_ten), NotificationManager.IMPORTANCE_LOW);
            k.setDescription(getString(R.string.kenh_cuoc_goi_mo_ta));
            k.setShowBadge(false);
            nm.createNotificationChannel(k);
        } catch (Throwable t) {
            // Kênh hỏng thì startForeground bên dưới sẽ ném, và ta dừng hẳn.
        }
    }

    /**
     * ⚠️ THÔNG BÁO NÀY LÀ BẮT BUỘC CỦA ANDROID, VÀ ĐÓ LÀ ĐIỀU TỐT.
     *
     * Không app nào được phép theo dõi trạng thái cuộc gọi trong im lặng. Dòng
     * này nói cho bác biết app đang chạy nền — và bác chạm vào là tắt được.
     * Đừng tìm cách giấu nó.
     */
    private Notification thongBaoThuongTruc() {
        Intent mo = new Intent(Intent.ACTION_VIEW,
                Uri.parse("khoanda://loi-tat/cai-dat"), this, MainActivity.class);
        mo.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 4, mo,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new Notification.Builder(this, KENH)
                .setSmallIcon(R.drawable.loi_tat_goi)
                .setContentTitle(getString(R.string.cuoc_goi_thuong_truc_tieu_de))
                .setContentText(getString(R.string.cuoc_goi_thuong_truc_noi_dung))
                .setOngoing(true)
                .setShowWhen(false)
                .setContentIntent(pi)
                .build();
    }

    private void dungHan() {
        try {
            getSharedPreferences(KHO, MODE_PRIVATE).edit().putBoolean(KHOA_BAT, false).apply();
        } catch (Throwable t) {
            // không sao
        }
        stopSelf();
    }

    // ─────────── Bật / tắt từ ngoài ───────────

    static void bat(Context ctx) {
        Intent i = new Intent(ctx, TheoDoiCuocGoi.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
        else ctx.startService(i);
    }

    static void tat(Context ctx) {
        try {
            ctx.stopService(new Intent(ctx, TheoDoiCuocGoi.class));
        } catch (Throwable t) {
            // không sao
        }
    }
}
