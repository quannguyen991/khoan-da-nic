'use strict';
/**
 * ═════ GỬI THẬT QUA FCM HTTP v1 — báo động tới máy con dùng APK. 24/9/2026 ═════
 *
 * Bản APK chạy trong Android WebView: không có Web Push, chỉ có token FCM. Trước
 * ngày này máy chủ không có bộ gửi nào cho token đó, nên máy con dùng APK KHÔNG
 * BAO GIỜ nhận được báo động (chạy thử đầu-cuối Guardian đo được).
 *
 * Luồng: ký JWT bằng khoá tài khoản dịch vụ (RS256) → đổi lấy access token ở
 * Google (nhớ đệm tới gần hết hạn) → POST messages:send. Chỉ dùng `node:crypto`
 * và `fetch` — không thêm thư viện firebase-admin chỉ để làm hai lời gọi HTTP.
 *
 * ⚠️ §9.4 — trả đúng ba kết cục như đường Web Push (`docKetQua` trong push.js):
 * ok · token chết (404 / UNREGISTERED) · không xác nhận được. Không bao giờ giả
 * lập thành công.
 * ⚠️ §6.9 — payload là đúng thứ đường web gửi (tiêu đề, nội dung soạn sẵn, mã,
 * đường mở app) — không nội dung tin nhắn, không số tài khoản.
 */
const crypto = require('node:crypto');

const PHAM_VI = 'https://www.googleapis.com/auth/firebase.messaging';
const DIA_CHI_TOKEN = 'https://oauth2.googleapis.com/token';
/** Kênh thông báo Android — app tạo kênh cùng tên ở `src/lib/nhan-canh-bao.ts`. */
const KENH_CANH_BAO = 'canh_bao_gia_dinh';

let dem = null;   // { khoa, token, hetHan } — access token của Google, KHÔNG phải token máy con

const b64url = (x) => Buffer.from(x).toString('base64url');

async function layTokenTruyCap(fcm, { fetchFn = fetch, bayGio = Date.now() } = {}) {
  if (dem && dem.khoa === fcm.clientEmail && bayGio < dem.hetHan - 60_000) return dem.token;
  const iat = Math.floor(bayGio / 1000);
  const dau = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const than = b64url(JSON.stringify({ iss: fcm.clientEmail, scope: PHAM_VI, aud: DIA_CHI_TOKEN, iat, exp: iat + 3600 }));
  const chuKy = crypto.createSign('RSA-SHA256').update(`${dau}.${than}`).sign(fcm.privateKey);
  const r = await fetchFn(DIA_CHI_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${dau}.${than}.${b64url(chuKy)}`,
    }).toString(),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || typeof j.access_token !== 'string') throw new Error(`FCM_KHONG_LAY_DUOC_TOKEN_${r.status}`);
  dem = { khoa: fcm.clientEmail, token: j.access_token, hetHan: bayGio + (Number(j.expires_in) || 3600) * 1000 };
  return dem.token;
}

/**
 * Thông điệp FCM. `notification` để Android TỰ hiện thông báo khi app đang tắt;
 * `data` (FCM chỉ nhận chuỗi) để lúc bấm vào, app biết mở màn nào (`duong`).
 */
function taoThongDiep(tokenMay, payload = {}) {
  const data = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== null) data[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return {
    message: {
      token: tokenMay,
      data,
      notification: { title: String(payload.tieuDe || 'Khoan Đã'), body: String(payload.noiDung || '') },
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: KENH_CANH_BAO,
          ...(typeof payload.ma === 'string' && payload.ma ? { tag: payload.ma } : {}),
          default_sound: true,
        },
      },
    },
  };
}

/**
 * @returns {Promise<{ok:boolean, status:number, loi?:string}>} — đúng hình dạng
 *   `docKetQua` trong push.js đọc.
 */
async function guiThatFcmV1({ dangKy, payload, fcm }, { fetchFn = fetch } = {}) {
  const truyCap = await layTokenTruyCap(fcm, { fetchFn });
  const r = await fetchFn(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(fcm.projectId)}/messages:send`, {
    method: 'POST',
    headers: { authorization: `Bearer ${truyCap}`, 'content-type': 'application/json' },
    body: JSON.stringify(taoThongDiep(dangKy.token, payload)),
  });
  if (r.ok) return { ok: true, status: r.status };
  const j = await r.json().catch(() => null);
  const chiTiet = Array.isArray(j?.error?.details) ? j.error.details.find((d) => d && d.errorCode) : null;
  if (r.status === 401) dem = null;   // access token hỏng / bị thu hồi — lần sau lấy lại
  return { ok: false, status: r.status, loi: chiTiet?.errorCode || j?.error?.status || String(r.status) };
}

/** Chỉ cho test: quên access token đã nhớ. */
const _quenToken = () => { dem = null; };

module.exports = { guiThatFcmV1, taoThongDiep, layTokenTruyCap, KENH_CANH_BAO, _quenToken };
