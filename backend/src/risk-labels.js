'use strict';
/**
 * §4.1 — NGUỒN SỰ THẬT của ba nhãn mức rủi ro.
 *
 * i18n KHÔNG ghi đè được. CSS không đụng tới được. Và đừng tạo đường nào để đụng.
 *
 * TUYỆT ĐỐI KHÔNG có nhãn thứ tư, không có "An toàn" / "Safe" / biến thể nào.
 * Hệ thống chỉ nói "chưa thấy dấu hiệu trong thông tin bác cung cấp" —
 * nó KHÔNG hứa an toàn.
 *
 * "Nghiêm trọng" là tên của TRẠNG THÁI CAN THIỆP `PROTECTED_CRITICAL`,
 * không phải nhãn rủi ro. Đừng nhầm hai thứ đó.
 */

/** Enum trung tính. Đừng dùng chuỗi tiếng Việt làm khoá logic. */
const RISK_LEVELS = Object.freeze(['HIGH', 'SUSPICIOUS', 'NO_SIGNS_FOUND']);

/** Chữ hiển thị — NGUYÊN VĂN §4.1, không được sửa. */
const RISK_LABELS = Object.freeze({
  HIGH: Object.freeze({ vi: 'Nguy hiểm cao', en: 'High risk', mau: 'do' }),
  SUSPICIOUS: Object.freeze({ vi: 'Nghi ngờ', en: 'Suspicious', mau: 'vang' }),
  NO_SIGNS_FOUND: Object.freeze({
    vi: 'Chưa thấy dấu hiệu rủi ro',
    en: 'No clear risk signals found',
    mau: 'xanh',
  }),
});

/** §HĐ — backend trả ENUM này, không bao giờ trả chuỗi hiển thị. */
const NHAN_HOP_DONG = Object.freeze({
  HIGH: 'CAO',
  SUSPICIOUS: 'NGHI_NGO',
  NO_SIGNS_FOUND: 'CHUA_THAY',
});

function nhanHopDong(riskLevel) {
  const nhan = NHAN_HOP_DONG[riskLevel];
  if (!nhan) throw new Error(`Mức rủi ro không hợp lệ: ${riskLevel}`);
  return nhan;
}

module.exports = { RISK_LEVELS, RISK_LABELS, NHAN_HOP_DONG, nhanHopDong };
