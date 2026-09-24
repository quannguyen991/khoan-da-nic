import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { api } from '../api-goc';
import { dangKyNhanCanhBao, tatNhanCanhBao, LoiTaiKhoan } from '../tai-khoan';

/**
 * ═════ BẬT NHẬN CẢNH BÁO CỦA BỐ MẸ TRÊN MÁY CON (Web Push) — Phần 3, 23/9/2026 ═════
 *
 * Máy con nhận qua TRÌNH DUYỆT (không cần tài khoản Firebase). Service worker
 * `public/sw.js` đã có sẵn handler `push` và `notificationclick`.
 *
 * ⚠️ NÓI ĐÚNG LÝ DO KHI KHÔNG BẬT ĐƯỢC (§4.3) — mỗi lý do một cách sửa khác nhau:
 *   KHONG_HO_TRO          — WebView của bản APK, hoặc trình duyệt không có Push API.
 *                           Cách sửa: mở bằng Chrome.
 *   CHI_CO_BAN_DUNG       — bản dev CỐ Ý không đăng ký service worker (main.tsx,
 *                           20/9/2026: nó từng đệm cả mã nguồn). Dùng bản đã dựng.
 *   BI_TU_CHOI            — người dùng chặn thông báo. Mở cài đặt trình duyệt.
 *   MAY_CHU_CHUA_CAU_HINH — máy chủ chưa có khoá VAPID.
 *   CHUA_DANG_NHAP / LOI_DANG_KY
 *
 * ⚠️ ĐỔI KHOÁ MÁY CHỦ THÌ ĐĂNG KÝ CŨ VÔ DỤNG. Đăng ký hiện có mà mang khoá khác thì
 * gỡ rồi đăng ký lại — nếu không, máy "đã bật" mà không bao giờ nhận được gì.
 */
export type MaBatNhan = 'KHONG_HO_TRO' | 'CHI_CO_BAN_DUNG' | 'BI_TU_CHOI' | 'MAY_CHU_CHUA_CAU_HINH' | 'CHUA_DANG_NHAP' | 'LOI_DANG_KY' | 'CHUA_CAI_FIREBASE';
export type KetQuaBatNhan = { ok: true } | { ok: false; ma: MaBatNhan };

/*
 * ═════ BẢN APK — FCM (thêm 24/9/2026) ═════
 *
 * WebView của APK không có Web Push, nên trước đây máy con dùng APK chỉ nhận được
 * câu "Mở Khoan Đã bằng Chrome để bật". Nay APK lấy token FCM qua plugin
 * `@capacitor/push-notifications` và đăng ký `{loai:'native', token}` — máy chủ gửi
 * bằng FCM HTTP v1 (`backend/src/gui-fcm.js`).
 *
 * ⚠️ NÓI ĐÚNG LÝ DO (§4.3), thêm một mã:
 *   CHUA_CAI_FIREBASE — bản APK dựng khi CHƯA có `android/app/google-services.json`:
 *                       plugin không lấy được token. Cách sửa: cài bản dựng mới.
 *   MAY_CHU_CHUA_CAU_HINH — máy chủ chưa có `FCM_SERVICE_ACCOUNT` (đọc `/api/suc-khoe`).
 *                       Bật mà máy chủ không gửi được thì là nói dối rằng "đã bật".
 */
/** Kênh thông báo — PHẢI trùng `KENH_CANH_BAO` ở backend/src/gui-fcm.js. */
const KENH_CANH_BAO = 'canh_bao_gia_dinh';
const KHOA_TOKEN_FCM = 'khoan_da_token_fcm';

export const laBanApk = (): boolean => {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
};

/** Chờ plugin trả token FCM (hoặc lỗi), tối đa 15 giây. Gỡ listener sau khi xong. */
async function layTokenFcm(): Promise<string> {
  const tay: { remove: () => Promise<void> }[] = [];
  try {
    return await new Promise<string>((resolve, reject) => {
      const hen = setTimeout(() => reject(new Error('HET_GIO')), 15_000);
      void PushNotifications.addListener('registration', (t) => { clearTimeout(hen); resolve(t.value); }).then((h) => tay.push(h));
      void PushNotifications.addListener('registrationError', (e) => { clearTimeout(hen); reject(new Error(String(e?.error || 'LOI'))); }).then((h) => tay.push(h));
      void PushNotifications.register().catch((e) => { clearTimeout(hen); reject(e); });
    });
  } finally {
    for (const h of tay) void h.remove().catch(() => undefined);
  }
}

async function mayChuGuiDuocFcm(): Promise<boolean> {
  const s = await fetch(api('/api/suc-khoe')).then((r) => r.json()).catch(() => null);
  return s?.fcmCauHinh === true;
}

async function batNhanCanhBaoApk(lang: string, tenKenh: string): Promise<KetQuaBatNhan> {
  let quyen = await PushNotifications.checkPermissions();
  if (quyen.receive === 'prompt' || quyen.receive === 'prompt-with-rationale') quyen = await PushNotifications.requestPermissions();
  if (quyen.receive !== 'granted') return { ok: false, ma: 'BI_TU_CHOI' };
  if (!(await mayChuGuiDuocFcm())) return { ok: false, ma: 'MAY_CHU_CHUA_CAU_HINH' };

  // Kênh ưu tiên CAO: báo động của bố mẹ phải kêu và hiện lên đầu màn, không chìm.
  try {
    await PushNotifications.createChannel({ id: KENH_CANH_BAO, name: tenKenh, importance: 5, visibility: 1, vibration: true });
  } catch { /* máy Android cũ không có kênh — thông báo vẫn tới kênh mặc định */ }

  let token: string;
  try { token = await layTokenFcm(); } catch { return { ok: false, ma: 'CHUA_CAI_FIREBASE' }; }

  try {
    await dangKyNhanCanhBao({ loai: 'native', token }, lang);
    try { localStorage.setItem(KHOA_TOKEN_FCM, token); } catch { /* kho bị chặn — lần sau hỏi lại */ }
    return { ok: true };
  } catch (e) {
    if (e instanceof LoiTaiKhoan && e.ma === 'CHUA_DANG_NHAP') return { ok: false, ma: 'CHUA_DANG_NHAP' };
    return { ok: false, ma: 'LOI_DANG_KY' };
  }
}

/** APK: gỡ đúng máy này (theo token), không gỡ các máy khác của con. */
export async function tatNhanTrenMayNay(): Promise<void> {
  if (!laBanApk()) return;
  let token: string | null = null;
  try { token = localStorage.getItem(KHOA_TOKEN_FCM); } catch { /* bỏ qua */ }
  if (token) await tatNhanCanhBao(token);
  try { localStorage.removeItem(KHOA_TOKEN_FCM); } catch { /* bỏ qua */ }
}

/**
 * APK: bấm vào thông báo ⇒ mở đúng màn (`duong`, cùng đường Web Push dùng).
 * Gọi MỘT lần lúc khởi động.
 *
 * Thông báo tới lúc app ĐANG MỞ thì Android KHÔNG tự hiện. Không tự nhảy sang thẻ
 * báo động (giật con khỏi việc đang làm) — hiện đúng một thông báo hệ thống bằng
 * `local-notifications`, cùng kênh ưu tiên cao; con bấm vào mới mở.
 * ⚠️ Chỉ mở đường bắt đầu bằng `/?view=guardian` — dữ liệu thông báo là thứ đến từ
 * mạng, không để nó điều hướng app tới chỗ khác.
 */
export function langNgheThongBaoApk(): void {
  if (!laBanApk()) return;
  const moDuong = (duong: unknown) => {
    if (typeof duong === 'string' && duong.startsWith('/?view=guardian')) window.location.href = duong;
  };
  void PushNotifications.addListener('pushNotificationActionPerformed', (a) => moDuong(a?.notification?.data?.duong));
  void PushNotifications.addListener('pushNotificationReceived', (n) => {
    void LocalNotifications.schedule({
      notifications: [{
        id: Date.now() % 2_000_000_000,
        title: n?.title || 'Khoan Đã',
        body: n?.body || '',
        channelId: KENH_CANH_BAO,
        extra: { duong: n?.data?.duong },
      }],
    }).catch(() => undefined);
  });
  void LocalNotifications.addListener('localNotificationActionPerformed', (a) => moDuong(a?.notification?.extra?.duong));
}

function base64UrlSangByte(s: string): Uint8Array {
  const dem = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + dem).replace(/-/g, '+').replace(/_/g, '/');
  const tho = atob(b64);
  const ra = new Uint8Array(tho.length);
  for (let i = 0; i < tho.length; i += 1) ra[i] = tho.charCodeAt(i);
  return ra;
}

function cungKhoa(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
}

export function hoTroNhanCanhBao(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function batNhanCanhBao(lang: string, tenKenh = 'Khoan Đã'): Promise<KetQuaBatNhan> {
  if (laBanApk()) return batNhanCanhBaoApk(lang, tenKenh);
  if (!hoTroNhanCanhBao()) return { ok: false, ma: 'KHONG_HO_TRO' };
  const dangKySw = await navigator.serviceWorker.getRegistration();
  if (!dangKySw) return { ok: false, ma: 'CHI_CO_BAN_DUNG' };

  const quyen = await Notification.requestPermission();
  if (quyen !== 'granted') return { ok: false, ma: 'BI_TU_CHOI' };

  const khoa = await fetch(api('/api/push/khoa-cong-khai')).then((r) => r.json()).catch(() => null);
  if (!khoa?.khoaCongKhai) return { ok: false, ma: 'MAY_CHU_CHUA_CAU_HINH' };
  const khoaByte = base64UrlSangByte(khoa.khoaCongKhai);

  try {
    let dk = await dangKySw.pushManager.getSubscription();
    if (dk && !cungKhoa(dk.options.applicationServerKey, khoaByte)) {
      await dk.unsubscribe();
      dk = null;
    }
    if (!dk) dk = await dangKySw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: khoaByte });
    await dangKyNhanCanhBao(dk.toJSON(), lang);
    return { ok: true };
  } catch (e) {
    if (e instanceof LoiTaiKhoan && e.ma === 'CHUA_DANG_NHAP') return { ok: false, ma: 'CHUA_DANG_NHAP' };
    return { ok: false, ma: 'LOI_DANG_KY' };
  }
}

/** Máy này đang nhận chưa — chỉ đọc, không xin quyền. */
export async function dangNhanTrenMayNay(): Promise<boolean> {
  if (laBanApk()) {
    try {
      const q = await PushNotifications.checkPermissions();
      return q.receive === 'granted' && Boolean(localStorage.getItem(KHOA_TOKEN_FCM));
    } catch { return false; }
  }
  if (!hoTroNhanCanhBao() || Notification.permission !== 'granted') return false;
  try {
    const dk = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
    return Boolean(dk);
  } catch { return false; }
}
