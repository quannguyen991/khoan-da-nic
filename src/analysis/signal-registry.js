'use strict';
/**
 * Phụ lục A — 58 TÍN HIỆU: ID · NHÓM · TRỌNG SỐ · DETECTOR · legacyKey
 * Phụ lục B.1 — CAP NHÓM và cách lấy điểm.
 *
 * ĐÂY LÀ DỮ LIỆU THUẦN. Không logic, không ngưỡng, không critical.
 * Bộ luật duy nhất tính điểm là `decision-engine.js`.
 *
 * §6.2: "Phụ lục là nguồn sự thật, vì signal-registry.js chưa tồn tại. Sau khi
 * dựng xong, CODE thành nguồn sự thật — đổi trọng số thì sửa code trước, phụ lục
 * sau, TRONG CÙNG MỘT COMMIT."  ← kể từ commit này, file này là nguồn sự thật.
 */

// [id, trọng số, detector, legacyKey]
const BANG = {
  // ── A.1 MONEY — cap 30 ────────────────────────────────────────────────
  money: [
    ['FIN_SAFE_ACCOUNT', 30, 'direct+llm', null],
    ['FIN_CASH_COURIER', 25, 'hybrid', null],
    ['FIN_GIFT_CARD_PAYMENT', 22, 'hybrid', null],
    ['FIN_PRECIOUS_METAL_PURCHASE', 22, 'hybrid', null],
    ['FIN_RECOVERY_FEE', 20, 'hybrid', null],
    ['FIN_ORG_CLAIM_PERSONAL_ACCOUNT', 20, 'context', null],
    ['FIN_RECIPIENT_NAME_MISMATCH', 18, 'context', null],
    ['FIN_TRANSFER_REQUEST', 14, 'hybrid', 'doi_chuyen_tien_tai_khoan_ca_nhan'],
    ['FIN_CRYPTO_TRANSFER', 14, 'hybrid', null],
    ['FIN_REPEATED_TRANSFER_PRESSURE', 10, 'context', null],
    ['FIN_TRANSFER_MEMO_MISMATCH', 8, 'context', null],
    ['FIN_NEW_RECIPIENT', 6, 'context', null],
  ],
  // ── A.2 CREDENTIAL — cap 25 ───────────────────────────────────────────
  credential: [
    ['CRED_OTP_SHARE', 25, 'direct+llm', 'doi_otp_hoac_cai_app_la'],
    ['CRED_PASSWORD_PIN', 25, 'hybrid', null],
    ['CRED_CARD_SECRET', 22, 'hybrid', null],
    ['CRED_BANK_LOGIN', 20, 'hybrid', null],
  ],
  // ── A.3 DEVICE — cap 30 ───────────────────────────────────────────────
  device: [
    ['DEV_SCREEN_SHARE_BANKING', 30, 'hybrid', null],
    ['DEV_REMOTE_CONTROL_APP', 28, 'hybrid', 'yeu_cau_chia_se_man_hinh_dieu_khien_tu_xa'],
    ['DEV_ACCESSIBILITY_PERMISSION', 28, 'hybrid', null],
    ['DEV_INSTALL_APK_UNKNOWN', 22, 'direct+llm', 'cai_app_dich_vu_cong_gia'],
    ['DEV_CALL_FORWARD', 18, 'hybrid', null],
  ],
  // ── A.4 MANIPULATION — cap 24 ─────────────────────────────────────────
  manipulation: [
    ['MAN_EXTORTION_MEDIA_THREAT', 24, 'hybrid', 'de_doa_bang_hinh_anh_video_rieng_tu'],
    ['MAN_FEAR_THREAT', 12, 'llm+lexicon', 'doa_bat_giu_hoac_cat_tro_cap'],
    ['MAN_COVER_STORY', 12, 'llm', null],
    ['MAN_SECRECY', 10, 'llm+lexicon', 'yeu_cau_giu_bi_mat'],
    ['MAN_ISOLATION', 10, 'llm', null],
    ['MAN_URGENCY', 7, 'llm+lexicon', 'ep_thoi_gian_khan_cap'],
    ['MAN_KEEP_CALL_ACTIVE', 6, 'llm+lexicon', null],
    ['MAN_LOVE_BOMBING', 6, 'llm', null],
    ['MAN_SCARCITY_PRESSURE', 5, 'llm+lexicon', 'ep_ky_hop_dong_ngay_tai_cho_giam_gia_soc'],
  ],
  // ── A.5 IDENTITY — cap 16 ─────────────────────────────────────────────
  identity: [
    ['ID_FAMILY_EMERGENCY_THIRD_PARTY', 12, 'llm', 'bao_tin_nguoi_than_gap_nan_qua_ben_thu_ba'],
    ['ID_RECOVERY_SUPPORT_IMPERSONATION', 12, 'llm', null],
    ['ID_KHOAN_DA_IMPERSONATION', 12, 'direct+llm', null],
    ['ID_AUTHORITY_IMPERSONATION', 10, 'llm', 'gia_danh_co_quan_nha_nuoc'],
    ['ID_CONTACT_ACCOUNT_TAKEOVER', 10, 'llm', 'tai_khoan_nguoi_than_bi_hack_muon_tien'],
    ['ID_TECH_SUPPORT_IMPERSONATION', 10, 'llm', null],
    ['ID_TAX_BENEFIT_IMPERSONATION', 10, 'llm', null],
    ['ID_BANK_IMPERSONATION', 8, 'llm', 'gia_danh_ngan_hang_xac_thuc_sinh_trac_hoc'],
    ['ID_FAMILY_IMPERSONATION', 8, 'llm', 'tu_xung_nguoi_than_nhung_dang_ngo'],
    ['ID_EMPLOYER_JOB_IMPERSONATION', 8, 'llm', null],
    ['ID_UTILITY_IMPERSONATION', 8, 'llm', 'mao_danh_dich_vu_thiet_yeu_hoac_thue'],
    ['ID_DELIVERY_IMPERSONATION', 6, 'llm', null],
  ],
  // ── A.6 OFFER — cap 12 ────────────────────────────────────────────────
  offer: [
    ['OFF_ADVANCE_FEE', 12, 'llm', null],
    ['OFF_CONTRACT_EXIT_UPSELL', 12, 'llm', 'ep_mua_them_hop_dong_de_thoat_hop_dong_cu'],
    ['OFF_INVESTMENT_GUARANTEE', 10, 'llm', 'dau_tu_loi_nhuan_cao_dam_bao'],
    ['OFF_TASK_PREPAY', 10, 'llm', 'lam_nhiem_vu_chot_don_hoa_hong'],
    ['OFF_ROMANCE_EMERGENCY', 8, 'llm', 'nguoi_quen_qua_mang_chua_gap_mat_xin_tien'],
    ['OFF_HIGH_VALUE_CONTRACT', 8, 'llm', 'hop_dong_gia_tri_lon_nhieu_nam'],
    ['OFF_PRIZE_GIFT', 6, 'llm', 'moi_hoi_thao_qua_tang_mien_phi'],
  ],
  // ── A.7 WEB — cap 20 · deterministic, KHÔNG gọi mạng từ client ─────────
  web: [
    ['WEB_BRAND_DOMAIN_MISMATCH', 16, 'deterministic', null],
    ['WEB_NONOFFICIAL_APP_SOURCE', 12, 'deterministic', null],
    ['WEB_PUNYCODE_IP_LITERAL', 10, 'deterministic', null],
    ['WEB_POPUP_SUPPORT_NUMBER', 10, 'deterministic+context', null],
    ['WEB_QR_TO_LOGIN_PAYMENT', 8, 'hybrid', null],
    ['WEB_SHORTENER_REDIRECT', 4, 'deterministic', null],
  ],
  // ── A.8 CASE — cap 12 · chỉ chạy SAU KHI người dùng xác nhận gộp vụ việc ──
  case: [
    ['CASE_MULTI_CHANNEL_ESCALATION', 8, 'deterministic-context', null],
    ['CASE_STAGE_ESCALATION', 8, 'deterministic-context', null],
    ['CASE_REPEATED_CONTACT', 4, 'deterministic-context', 'goi_dien_lien_tuc_gay_ap_luc'],
  ],
};

/** Phụ lục B.1 — cap nhóm và CÁCH LẤY điểm. */
const GROUPS = Object.freeze({
  money: Object.freeze({ cap: 30, mode: 'max-plus', plus: 6 }),
  credential: Object.freeze({ cap: 25, mode: 'max' }),
  device: Object.freeze({ cap: 30, mode: 'max' }),
  manipulation: Object.freeze({ cap: 24, mode: 'top2' }),
  identity: Object.freeze({ cap: 16, mode: 'max-plus', plus: 4 }),
  offer: Object.freeze({ cap: 12, mode: 'max' }),
  web: Object.freeze({ cap: 20, mode: 'top2' }),
  case: Object.freeze({ cap: 12, mode: 'top2' }),
});

const GROUP_IDS = Object.freeze(Object.keys(BANG));

const SIGNALS = {};
for (const [group, hang] of Object.entries(BANG)) {
  for (const [id, weight, detector, legacyKey] of hang) {
    SIGNALS[id] = Object.freeze({ id, group, weight, detector, legacyKey });
  }
}
Object.freeze(SIGNALS);

const SIGNAL_IDS = Object.freeze(Object.keys(SIGNALS));

const getSignal = (id) => SIGNALS[id];
const listByGroup = (group) => SIGNAL_IDS.filter((id) => SIGNALS[id].group === group);
const laTinHieu = (id) => Object.prototype.hasOwnProperty.call(SIGNALS, id);

/** Tiền tố nhóm dùng cho điều kiện OR của critical override (ID_* / FIN_* …). */
const khopTienTo = (id, tienTo) => id.startsWith(tienTo);

module.exports = {
  SIGNALS, SIGNAL_IDS, GROUPS, GROUP_IDS,
  getSignal, listByGroup, laTinHieu, khopTienTo,
};
