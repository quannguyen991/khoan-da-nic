'use strict';
/**
 * §6.3 — CRITICAL OVERRIDE CO-01…CO-10.
 *
 * Ràng buộc thực thi (§6.3):
 *  - Hàm override KHÔNG gọi mạng, KHÔNG đọc DB, KHÔNG gọi LLM.
 *    Đầu vào duy nhất: accepted signals + sanitized context.
 *  - "ít nhất MỘT tín hiệu mạnh" ≠ "MỌI tín hiệu đều mạnh".
 *  - KHÔNG thêm override thứ 11 chỉ vì "nghe nguy hiểm". Đổi số lượng phải sửa
 *    registry + test + eval + docs + số in ra khi chạy eval, TRONG CÙNG MỘT COMMIT.
 *
 * Override là đường DUY NHẤT dẫn tới `PROTECTED_CRITICAL`. Điểm số không bao giờ
 * tự sinh ra mức đó (§6.2).
 */

/**
 * Họ "giả danh cơ quan" cho các điều kiện ghi `ID_AUTHORITY_*` ở §6.3.
 *
 * ⚠️ DIỄN GIẢI ĐÃ GHI NHẬN: §6.3 nêu đích danh "vụ giả danh cơ quan thuế" là ca
 * CO-07 phải bắt được. Cơ quan thuế là cơ quan nhà nước, nên `ID_TAX_BENEFIT_IMPERSONATION`
 * nằm trong họ này. Diễn giải chỉ LÀM TĂNG cảnh giác (§4.2), không bao giờ giảm.
 */
const HO_CO_QUAN = ['ID_AUTHORITY_IMPERSONATION', 'ID_TAX_BENEFIT_IMPERSONATION'];
const HO_HO_TRO_KY_THUAT = ['ID_TECH_SUPPORT_IMPERSONATION'];

const coMot = (s, ids) => ids.some((id) => s.has(id));

/** Ngữ cảnh phục hồi: người dùng ĐÃ mất tiền, hoặc đang ở luồng phục hồi. */
const laNguCanhPhucHoi = (ctx = {}) => ctx.recoveryContext === true
  || ctx.caseContext?.outcome === 'money_lost'
  || ctx.caseContext?.outcome === 'recovery';

const CRITICAL_OVERRIDES = Object.freeze([
  {
    id: 'CO-01',
    mo: 'CRED_OTP_SHARE + FIN_TRANSFER_REQUEST',
    test: (s) => s.has('CRED_OTP_SHARE') && s.has('FIN_TRANSFER_REQUEST'),
  },
  {
    id: 'CO-02',
    mo: 'DEV_INSTALL_APK_UNKNOWN OR DEV_REMOTE_CONTROL_APP',
    test: (s) => s.has('DEV_INSTALL_APK_UNKNOWN') || s.has('DEV_REMOTE_CONTROL_APP'),
  },
  {
    id: 'CO-03',
    mo: 'FIN_SAFE_ACCOUNT',
    test: (s) => s.has('FIN_SAFE_ACCOUNT'),
  },
  {
    id: 'CO-04',
    mo: 'DEV_SCREEN_SHARE_BANKING',
    test: (s) => s.has('DEV_SCREEN_SHARE_BANKING'),
  },
  {
    id: 'CO-05',
    mo: 'MAN_SECRECY + MAN_FEAR_THREAT + FIN_TRANSFER_REQUEST',
    test: (s) => s.has('MAN_SECRECY') && s.has('MAN_FEAR_THREAT') && s.has('FIN_TRANSFER_REQUEST'),
  },
  {
    id: 'CO-06',
    mo: 'FIN_RECOVERY_FEE + ngữ cảnh mất tiền / phục hồi',
    test: (s, ctx) => s.has('FIN_RECOVERY_FEE') && laNguCanhPhucHoi(ctx),
  },
  {
    id: 'CO-07',
    mo: 'FIN_GIFT_CARD_PAYMENT + (cơ quan OR hỗ trợ kỹ thuật OR đe doạ)',
    test: (s) => s.has('FIN_GIFT_CARD_PAYMENT')
      && (coMot(s, HO_CO_QUAN) || coMot(s, HO_HO_TRO_KY_THUAT) || s.has('MAN_FEAR_THREAT')),
  },
  {
    id: 'CO-08',
    mo: 'FIN_CASH_COURIER + (cơ quan OR hỗ trợ kỹ thuật OR đầu tư OR kim loại quý)',
    test: (s) => s.has('FIN_CASH_COURIER')
      && (coMot(s, HO_CO_QUAN) || coMot(s, HO_HO_TRO_KY_THUAT)
        || s.has('OFF_INVESTMENT_GUARANTEE') || s.has('FIN_PRECIOUS_METAL_PURCHASE')),
  },
  {
    id: 'CO-09',
    mo: 'FIN_CRYPTO_TRANSFER + FIN_SAFE_ACCOUNT',
    test: (s) => s.has('FIN_CRYPTO_TRANSFER') && s.has('FIN_SAFE_ACCOUNT'),
  },
  {
    id: 'CO-10',
    mo: 'DEV_REMOTE_CONTROL_APP + (CRED_BANK_LOGIN OR FIN_TRANSFER_REQUEST OR DEV_SCREEN_SHARE_BANKING)',
    test: (s) => s.has('DEV_REMOTE_CONTROL_APP')
      && (s.has('CRED_BANK_LOGIN') || s.has('FIN_TRANSFER_REQUEST') || s.has('DEV_SCREEN_SHARE_BANKING')),
  },
]);

/**
 * @param {string[]|Set<string>} signalIds  ID của tín hiệu ĐÃ được chấp nhận
 * @param {object} context                  sanitized context, không có PII thô
 * @returns {string[]} danh sách ID override đã nổ, theo thứ tự CO-01…CO-10
 */
function evaluateOverrides(signalIds = [], context = {}) {
  const s = signalIds instanceof Set ? signalIds : new Set(signalIds);
  return CRITICAL_OVERRIDES.filter((o) => o.test(s, context)).map((o) => o.id);
}

module.exports = { CRITICAL_OVERRIDES, evaluateOverrides, laNguCanhPhucHoi };
