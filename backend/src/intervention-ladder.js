'use strict';
/**
 * §2B.2 bước 16 — THANG CAN THIỆP 5 MỨC.
 *
 * §HĐ luật 4: canThiep quyết định MÀN HÌNH, nhan quyết định NHÃN.
 * §6.2: PROTECTED_CRITICAL CHỈ đến từ critical override, không bao giờ từ điểm số.
 *
 * ⚠️ §5.2: bản 24 giờ chỉ có MỘT bộ luật. KHÔNG dựng cầu nối sang thang 1–3 cũ.
 * `SCORE_SCALE` giữ lại vì §6.2 khai nó là hằng số khoá, nhưng trong bản này nó
 * KHÔNG có nơi tiêu thụ — và đó là chủ đích.
 */

const THRESHOLD_SUSPICIOUS = 20;
const THRESHOLD_HIGH = 45;
const SCORE_SCALE = 12.5;

const MUC_CAN_THIEP = Object.freeze([
  'TRUST_RECEIPT', 'VERIFY_PATH', 'PAUSE_60S', 'PROTECTED_CRITICAL', 'RECOVERY',
]);

/**
 * §4.6 — NGUYÊN TẮC LUÔN CÓ LỐI RA.
 * Mức PROTECTED_CRITICAL bỏ hết điều hướng, NHƯNG LUÔN PHẢI CÓ dòng
 * "Tôi ổn, không có gì nguy hiểm" ở cuối màn hình. Mỗi lần bấm là một mẫu dữ
 * liệu báo động giả — ghi lại để hiệu chỉnh ngưỡng.
 */
const MO_TA = Object.freeze({
  TRUST_RECEIPT: { boDieuHuong: false, coLoiRa: true, maLoiRa: 'quay_lai_trang_chu' },
  VERIFY_PATH: { boDieuHuong: false, coLoiRa: true, maLoiRa: 'quay_lai_trang_chu' },
  PAUSE_60S: { boDieuHuong: false, coLoiRa: true, maLoiRa: 'toi_on_khong_co_gi_nguy_hiem' },
  PROTECTED_CRITICAL: { boDieuHuong: true, coLoiRa: true, maLoiRa: 'toi_on_khong_co_gi_nguy_hiem' },
  RECOVERY: { boDieuHuong: false, coLoiRa: true, maLoiRa: 'quay_lai_trang_chu' },
});

function chonMuc({ score = 0, overrides = [], caseContext = null } = {}) {
  if (overrides.length > 0) return 'PROTECTED_CRITICAL';
  if (caseContext?.outcome === 'money_lost') return 'RECOVERY';
  if (score >= THRESHOLD_HIGH) return 'PAUSE_60S';
  if (score >= THRESHOLD_SUSPICIOUS) return 'VERIFY_PATH';
  return 'TRUST_RECEIPT';
}

const moTaMuc = (muc) => MO_TA[muc];

module.exports = { MUC_CAN_THIEP, chonMuc, moTaMuc, SCORE_SCALE, MO_TA };
