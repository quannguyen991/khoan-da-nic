package vn.khoanda.app;

import android.app.Notification;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

/**
 * ĐỌC THÔNG BÁO TIN NHẮN ĐẾN — §15.4, nguồn đầu vào thứ tư.
 *
 * ══════════ ĐỌC HẾT KHỐI NÀY TRƯỚC KHI SỬA ══════════
 *
 * ⚠️ ĐÂY LÀ QUYỀN NHẠY CẢM NHẤT TRONG CẢ ỨNG DỤNG.
 * `BIND_NOTIFICATION_LISTENER_SERVICE` cho phép đọc MỌI thông báo trên máy —
 * tin nhắn ngân hàng, tin nhắn riêng tư, mọi thứ. Google Play bắt giải trình,
 * và người dùng phải tự bật trong Cài đặt hệ thống; không app nào tự bật được.
 *
 * ⚠️ §6.9 — KHÔNG GHI NỘI DUNG RA ĐÂU CẢ.
 * Lớp này giữ tin trong BỘ NHỚ, tối đa {@link #SUC_CHUA} tin, và KHÔNG ghi ra
 * tệp, KHÔNG ghi log, KHÔNG gửi đi đâu. Tầng web chủ động lấy khi bác bấm kiểm.
 * Một dòng `Log.d(TAG, sbn.toString())` ở đây là rò toàn bộ tin nhắn của bác
 * vào logcat — dòng đó KHÔNG được tồn tại.
 *
 * ⚠️ §4.3 — "KHÔNG ĐỌC ĐƯỢC" ≠ "ĐỌC RỒI, KHÔNG THẤY GÌ".
 * Ba ca hỏng dưới đây phải phân biệt được, và tầng web đã có sẵn mã cho từng ca
 * trong `unreadableInputFloor()`:
 *   thông báo bị cắt      → chi_doc_duoc_mot_phan_tin
 *   thông báo không nội dung → thong_bao_khong_co_noi_dung
 *   thông báo đã bị xoá   → thong_bao_da_bi_xoa
 * Trả về chuỗi rỗng rồi để tầng trên đoán là đúng con bug §4.3 mô tả.
 *
 * ⚠️ CHỈ LẤY TỪ ỨNG DỤNG NHẮN TIN. Không quét thông báo của mọi app — vừa thừa
 * vừa làm bề mặt riêng tư rộng ra vô cớ.
 *
 * ⚠️ CHƯA BIÊN DỊCH ĐƯỢC TRÊN MÁY DỰNG. Máy làm việc này không có JDK và Android
 * SDK, nên tệp này CHƯA TỪNG QUA javac. Phải mở bằng Android Studio và sửa lỗi
 * biên dịch nếu có trước khi tin là nó chạy.
 */
public class DocThongBao extends NotificationListenerService {

    /** Ứng dụng nhắn tin phổ biến ở Việt Nam. Chỉ đọc thông báo của những app này. */
    private static final List<String> GOI_NHAN_TIN = new ArrayList<String>() {{
        add("com.google.android.apps.messaging");   // Tin nhắn (Google)
        add("com.samsung.android.messaging");        // Tin nhắn (Samsung)
        add("com.android.mms");                      // Tin nhắn (AOSP)
        add("com.zing.zalo");                        // Zalo
        add("com.facebook.orca");                    // Messenger
        add("org.telegram.messenger");
        add("com.viber.voip");
    }};

    /**
     * Sức chứa CỐ Ý NHỎ. Đây là bộ đệm để bác bấm kiểm ngay sau khi nhận tin,
     * KHÔNG phải nhật ký tin nhắn. Giữ nhiều là dựng một kho dữ liệu nhạy cảm mà
     * không ai xin phép.
     */
    private static final int SUC_CHUA = 20;

    /** Mã trạng thái — TRÙNG với mã ở `unreadableInputFloor()` bên web. */
    public static final String CAT = "chi_doc_duoc_mot_phan_tin";
    public static final String RONG = "thong_bao_khong_co_noi_dung";
    public static final String DA_XOA = "thong_bao_da_bi_xoa";
    public static final String DOC_DUOC = "doc_duoc";

    /** Một tin đã bắt được. Chỉ sống trong bộ nhớ. */
    public static class Tin {
        public final String tuApp;
        public final String noiDung;
        public final String trangThai;
        public final long luc;

        Tin(String tuApp, String noiDung, String trangThai, long luc) {
            this.tuApp = tuApp;
            this.noiDung = noiDung;
            this.trangThai = trangThai;
            this.luc = luc;
        }
    }

    /**
     * ⚠️ `static` để tầng plugin lấy được mà không phải bind service.
     * Đánh đổi: nó sống theo tiến trình. Nên {@link #xoaHet()} phải được gọi khi
     * người dùng tắt tính năng, và sức chứa phải nhỏ.
     */
    private static final Deque<Tin> HANG = new ArrayDeque<>();

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !GOI_NHAN_TIN.contains(sbn.getPackageName())) return;

        Notification n = sbn.getNotification();
        if (n == null || n.extras == null) {
            them(sbn.getPackageName(), "", RONG, sbn.getPostTime());
            return;
        }

        Bundle x = n.extras;
        CharSequence than = x.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence day = x.getCharSequence(Notification.EXTRA_BIG_TEXT);

        // ⚠️ Android CẮT `EXTRA_TEXT` khi tin dài, và `EXTRA_BIG_TEXT` mới là bản
        // đầy đủ — nhưng nó không phải lúc nào cũng có. Đây chính là ca
        // `chi_doc_duoc_mot_phan_tin`: đọc được MỘT PHẦN, không phải đọc được hết.
        String noiDung;
        String trangThai;
        if (!TextUtils.isEmpty(day)) {
            noiDung = day.toString();
            trangThai = DOC_DUOC;
        } else if (!TextUtils.isEmpty(than)) {
            noiDung = than.toString();
            // Có dấu ba chấm cuối ⇒ nhiều khả năng bị cắt. Nghi ngờ thì khai là
            // CẮT, đừng khai là đọc đủ — §4.3 nghiêng về phía thừa nhận giới hạn.
            trangThai = noiDung.endsWith("…") || noiDung.endsWith("...") ? CAT : DOC_DUOC;
        } else {
            noiDung = "";
            trangThai = RONG;
        }

        them(sbn.getPackageName(), noiDung, trangThai, sbn.getPostTime());
    }

    /**
     * Thông báo bị gỡ. Kẻ lừa đảo hay gửi rồi thu hồi để bác không kịp đọc lại —
     * nên ghi nhận là ĐÃ BỊ XOÁ, không phải im lặng bỏ qua (§4.3).
     */
    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        if (sbn == null || !GOI_NHAN_TIN.contains(sbn.getPackageName())) return;
        synchronized (HANG) {
            for (Tin t : HANG) {
                if (t.luc == sbn.getPostTime() && t.tuApp.equals(sbn.getPackageName())) return;
            }
        }
        them(sbn.getPackageName(), "", DA_XOA, sbn.getPostTime());
    }

    private static void them(String app, String noiDung, String trangThai, long luc) {
        synchronized (HANG) {
            HANG.addFirst(new Tin(app, noiDung, trangThai, luc));
            while (HANG.size() > SUC_CHUA) HANG.removeLast();
        }
        // ⚠️ KHÔNG log gì ở đây. Xem §6.9 ở đầu tệp.
    }

    /** Tin mới nhất, hoặc null nếu chưa bắt được gì. */
    public static Tin moiNhat() {
        synchronized (HANG) { return HANG.isEmpty() ? null : HANG.peekFirst(); }
    }

    public static List<Tin> tatCa() {
        synchronized (HANG) { return new ArrayList<>(HANG); }
    }

    /** Gọi khi người dùng tắt tính năng. Xoá sạch, không giữ lại gì. */
    public static void xoaHet() {
        synchronized (HANG) { HANG.clear(); }
    }

    /**
     * Người dùng đã bật quyền đọc thông báo chưa?
     *
     * ⚠️ KHÔNG có cách nào tự bật. Đây là quyền người dùng phải vào Cài đặt hệ
     * thống bật tay — và ĐÓ LÀ ĐÚNG. Một app tự bật được quyền đọc mọi thông báo
     * là một app không nên tồn tại.
     */
    public static boolean daBatQuyen(Context ctx) {
        ComponentName ten = new ComponentName(ctx, DocThongBao.class);
        String bat = Settings.Secure.getString(ctx.getContentResolver(),
                "enabled_notification_listeners");
        return bat != null && bat.contains(ten.flattenToString());
    }

    /** Mở đúng màn Cài đặt để người dùng tự bật. */
    public static Intent manCaiDat() {
        return new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    }
}
