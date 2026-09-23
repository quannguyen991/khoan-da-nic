'use strict';
/**
 * BỘ GỬI WEB PUSH THẬT — cắm vào điểm cắm `guiThat` của `push.js`.
 * Phần 3 "Cầu dao gia đình", 23/9/2026.
 *
 * `push.js` đã dựng đủ đường đi và trả trạng thái trung thực (§9.4), nhưng hàm
 * gửi thật chưa từng được cắm: mọi lượt đều ra `CHUA_CAU_HINH_PUSH`. Đây là
 * mảnh còn thiếu — và CHỈ là mảnh đó: mã hoá (aes128gcm) + ký VAPID do thư viện
 * `web-push` làm, không tự viết mật mã.
 *
 * ⚠️ KHÔNG NÉM RA NGOÀI. Mọi kết cục thành `{ok, status, loi}` để `docKetQua()`
 * trong `push.js` phân loại: 404/410 ⇒ đăng ký hết hạn (gỡ), còn lại ⇒ không xác
 * nhận được. Push service chỉ nói "đã nhận", không nói "người thân đã thấy".
 *
 * ⚠️ `tuyChonGui` TÁCH RIÊNG để test dựng bản tin bằng ĐÚNG bộ tuỳ chọn mà hàm
 * gửi dùng (`webpush.generateRequestDetails`). `web-push` luôn đi HTTPS, nên test
 * không dựng được dịch vụ push giả bằng HTTP thường — kiểm bản tin là cách kiểm
 * được phần mật mã mà không cần chứng chỉ.
 */
const webpush = require('web-push');

function tuyChonGui(payload, vapid) {
  return {
    TTL: 600,
    urgency: payload?.khan ? 'high' : 'normal',
    vapidDetails: { subject: vapid.lienHe, publicKey: vapid.congKhai, privateKey: vapid.riengTu },
  };
}

async function guiThatWebPush({ dangKy, payload, vapid }) {
  try {
    const r = await webpush.sendNotification(dangKy, JSON.stringify(payload), tuyChonGui(payload, vapid));
    return { ok: true, status: r?.statusCode ?? 201 };
  } catch (e) {
    return { ok: false, status: e?.statusCode, loi: String(e?.body || e?.message || 'LOI_GUI') };
  }
}

module.exports = { guiThatWebPush, tuyChonGui };
