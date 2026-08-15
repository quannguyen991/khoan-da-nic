'use strict';
// Phụ lục A — 58 tín hiệu · 8 nhóm · trọng số · legacyKey
// Phụ lục B.1 — cap nhóm

const test = require('node:test');
const assert = require('node:assert');

const {
  SIGNALS,
  SIGNAL_IDS,
  GROUPS,
  GROUP_IDS,
  getSignal,
  listByGroup,
} = require('../src/analysis/signal-registry');

test('§6.2 — đúng 58 tín hiệu', () => {
  assert.strictEqual(SIGNAL_IDS.length, 58);
  assert.strictEqual(Object.keys(SIGNALS).length, 58);
});

test('§6.2 — đúng 8 nhóm với số lượng đã chốt', () => {
  const mong = {
    money: 12, identity: 12, manipulation: 9, offer: 7,
    web: 6, device: 5, credential: 4, case: 3,
  };
  assert.strictEqual(GROUP_IDS.length, 8);
  for (const [nhom, soLuong] of Object.entries(mong)) {
    assert.strictEqual(listByGroup(nhom).length, soLuong, `nhóm ${nhom}`);
  }
  const tong = Object.values(mong).reduce((a, b) => a + b, 0);
  assert.strictEqual(tong, 58);
});

test('§6.2 — đúng 29 tín hiệu có legacyKey, không trùng nhau', () => {
  const keys = SIGNAL_IDS.map((id) => SIGNALS[id].legacyKey).filter(Boolean);
  assert.strictEqual(keys.length, 29);
  assert.strictEqual(new Set(keys).size, 29, 'legacyKey không được trùng');
});

test('Phụ lục A — trọng số đúng nguyên văn (chọn mẫu mọi nhóm)', () => {
  const mong = {
    FIN_SAFE_ACCOUNT: 30,
    FIN_CASH_COURIER: 25,
    FIN_TRANSFER_REQUEST: 14,
    FIN_NEW_RECIPIENT: 6,
    CRED_OTP_SHARE: 25,
    CRED_PASSWORD_PIN: 25,
    CRED_BANK_LOGIN: 20,
    DEV_SCREEN_SHARE_BANKING: 30,
    DEV_REMOTE_CONTROL_APP: 28,
    DEV_ACCESSIBILITY_PERMISSION: 28,
    DEV_INSTALL_APK_UNKNOWN: 22,
    MAN_EXTORTION_MEDIA_THREAT: 24,
    MAN_FEAR_THREAT: 12,
    MAN_SECRECY: 10,
    MAN_URGENCY: 7,
    MAN_SCARCITY_PRESSURE: 5,
    ID_AUTHORITY_IMPERSONATION: 10,
    ID_FAMILY_IMPERSONATION: 8,
    ID_DELIVERY_IMPERSONATION: 6,
    OFF_ADVANCE_FEE: 12,
    OFF_PRIZE_GIFT: 6,
    WEB_BRAND_DOMAIN_MISMATCH: 16,
    WEB_SHORTENER_REDIRECT: 4,
    CASE_MULTI_CHANNEL_ESCALATION: 8,
    CASE_REPEATED_CONTACT: 4,
  };
  for (const [id, diem] of Object.entries(mong)) {
    assert.strictEqual(getSignal(id).weight, diem, `trọng số ${id}`);
  }
});

test('Phụ lục A — legacyKey đúng nguyên văn (chọn mẫu)', () => {
  const mong = {
    FIN_TRANSFER_REQUEST: 'doi_chuyen_tien_tai_khoan_ca_nhan',
    CRED_OTP_SHARE: 'doi_otp_hoac_cai_app_la',
    DEV_REMOTE_CONTROL_APP: 'yeu_cau_chia_se_man_hinh_dieu_khien_tu_xa',
    DEV_INSTALL_APK_UNKNOWN: 'cai_app_dich_vu_cong_gia',
    MAN_SECRECY: 'yeu_cau_giu_bi_mat',
    MAN_URGENCY: 'ep_thoi_gian_khan_cap',
    MAN_FEAR_THREAT: 'doa_bat_giu_hoac_cat_tro_cap',
    ID_AUTHORITY_IMPERSONATION: 'gia_danh_co_quan_nha_nuoc',
    ID_FAMILY_IMPERSONATION: 'tu_xung_nguoi_than_nhung_dang_ngo',
    OFF_INVESTMENT_GUARANTEE: 'dau_tu_loi_nhuan_cao_dam_bao',
    CASE_REPEATED_CONTACT: 'goi_dien_lien_tuc_gay_ap_luc',
  };
  for (const [id, key] of Object.entries(mong)) {
    assert.strictEqual(getSignal(id).legacyKey, key, `legacyKey ${id}`);
  }
});

test('Phụ lục B.1 — cap và cách lấy của 8 nhóm', () => {
  const mong = {
    money: { cap: 30, mode: 'max-plus', plus: 6 },
    credential: { cap: 25, mode: 'max' },
    device: { cap: 30, mode: 'max' },
    manipulation: { cap: 24, mode: 'top2' },
    identity: { cap: 16, mode: 'max-plus', plus: 4 },
    offer: { cap: 12, mode: 'max' },
    web: { cap: 20, mode: 'top2' },
    case: { cap: 12, mode: 'top2' },
  };
  for (const [nhom, cauHinh] of Object.entries(mong)) {
    assert.strictEqual(GROUPS[nhom].cap, cauHinh.cap, `cap ${nhom}`);
    assert.strictEqual(GROUPS[nhom].mode, cauHinh.mode, `mode ${nhom}`);
    if (cauHinh.plus !== undefined) {
      assert.strictEqual(GROUPS[nhom].plus, cauHinh.plus, `plus ${nhom}`);
    }
  }
});

test('Registry là dữ liệu thuần — mọi tín hiệu đủ trường và hợp lệ', () => {
  for (const id of SIGNAL_IDS) {
    const s = SIGNALS[id];
    assert.strictEqual(s.id, id, `${id}: trường id phải khớp khoá`);
    assert.ok(GROUP_IDS.includes(s.group), `${id}: nhóm lạ ${s.group}`);
    assert.ok(Number.isInteger(s.weight) && s.weight > 0, `${id}: trọng số`);
    assert.ok(typeof s.detector === 'string' && s.detector.length > 0, `${id}: detector`);
    assert.ok(s.legacyKey === null || typeof s.legacyKey === 'string', `${id}: legacyKey`);
  }
});

test('§4.2 — registry KHÔNG chứa trường bị cấm của lược đồ LLM', () => {
  const camKy = ['riskScore', 'riskLabel', 'critical', 'interventionLevel', 'safe'];
  for (const id of SIGNAL_IDS) {
    for (const truong of camKy) {
      assert.ok(!(truong in SIGNALS[id]), `${id} không được có trường ${truong}`);
    }
  }
});

test('Không có tín hiệu nào vượt cap nhóm của chính nó', () => {
  for (const id of SIGNAL_IDS) {
    const s = SIGNALS[id];
    assert.ok(s.weight <= GROUPS[s.group].cap, `${id} (${s.weight}) > cap ${s.group}`);
  }
});
