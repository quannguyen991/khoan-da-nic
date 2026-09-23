import { api } from '../api-goc';
import { dangKyNhanCanhBao, LoiTaiKhoan } from '../tai-khoan';

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
export type MaBatNhan = 'KHONG_HO_TRO' | 'CHI_CO_BAN_DUNG' | 'BI_TU_CHOI' | 'MAY_CHU_CHUA_CAU_HINH' | 'CHUA_DANG_NHAP' | 'LOI_DANG_KY';
export type KetQuaBatNhan = { ok: true } | { ok: false; ma: MaBatNhan };

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

export async function batNhanCanhBao(lang: string): Promise<KetQuaBatNhan> {
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
  if (!hoTroNhanCanhBao() || Notification.permission !== 'granted') return false;
  try {
    const dk = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
    return Boolean(dk);
  } catch { return false; }
}
