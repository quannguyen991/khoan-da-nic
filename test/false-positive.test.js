'use strict';
// Phụ lục C.6 — bộ ca kiểm thử bắt buộc.
// "Báo động giả tốn kém nhất là loại kêu đúng lúc người dùng đang làm ĐÚNG."

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const { buildContext } = require('../backend/src/analysis/context-builder');

/**
 * ⚠️ THAM SỐ THỨ HAI, KHÔNG PHẢI TRẢI VÀO `input`.
 *
 * `verifiedChannel` / `verifiedRelationship` từ 15/8/2026 chỉ nhận ở tham số
 * NGỮ CẢNH TIN CẬY do máy chủ dựng — trải chúng vào `input` (thứ có thể đến
 * thẳng từ `req.body`) là để người gọi tự khai một lá cờ hạ mức.
 * Xem test/co-xac-minh-khong-tu-khai.test.js.
 */
const batTinHieu = (vanBan, nguCanhTinCay = {}) => analyze({ vanBan }, nguCanhTinCay).maLyDo;
const actDau = (t) => buildContext(t).segments[0].speechAct;

// ─────────────── C.6.1 — Tiếng Anh ───────────────

const C61 = [
  ['Never share your OTP or verification code with anyone.', 'warning_education', 'CRED_OTP_SHARE'],
  ['Never share your PIN.', 'warning_education', 'CRED_PASSWORD_PIN'],
  ['Your transfer of $2,000 was completed successfully.', 'notification', 'FIN_TRANSFER_REQUEST'],
  ['The FTC warns that scammers may ask you to buy gift cards.', 'warning_education', 'FIN_GIFT_CARD_PAYMENT'],
  ['Scammers may ask you to move money to a so-called safe account.', 'warning_education', 'FIN_SAFE_ACCOUNT'],
  ['A scammer told me yesterday to install AnyDesk.', 'past_event', 'DEV_REMOTE_CONTROL_APP'],
  ['If someone says they are the police and asks for money, hang up.', 'warning_education', 'ID_AUTHORITY_IMPERSONATION'],
  ['I told the police yesterday that someone threatened me.', 'past_event', 'MAN_FEAR_THREAT'],
  ['I want to buy $200 of Bitcoin for my own portfolio.', 'self_directed', 'FIN_CRYPTO_TRANSFER'],
  ['My son asked me to buy a birthday gift card.', 'self_directed', 'FIN_GIFT_CARD_PAYMENT'],
  ['For remote IT support, I opened TeamViewer after calling our help desk.', 'self_directed', 'DEV_REMOTE_CONTROL_APP'],
];

for (const [vanBan, act, khongDuocBat] of C61) {
  test(`C.6.1 — "${vanBan.slice(0, 46)}…" ⇒ ${act}, không bật ${khongDuocBat}`, () => {
    assert.strictEqual(actDau(vanBan), act);
    assert.ok(!batTinHieu(vanBan).includes(khongDuocBat));
  });
}

test('C.4 — MAN_KEEP_CALL_ACTIVE chỉ tắt khi NGƯỜI DÙNG TỰ GỌI số đã xác minh', () => {
  const t = 'Please hold while I check your account.';
  assert.ok(!batTinHieu(t, { verifiedChannel: true }).includes('MAN_KEEP_CALL_ACTIVE'));
  // ⚠️ Chặn vô điều kiện là tặng kẻ lừa đảo một câu thần chú tắt cảnh báo.
  assert.ok(batTinHieu(t, { verifiedChannel: false }).includes('MAN_KEEP_CALL_ACTIVE'),
    'từ một cuộc gọi ĐẾN thì "please hold" KHÔNG vô hại');
});

test('C.4 — ID_FAMILY_IMPERSONATION chỉ tắt khi quan hệ đã xác minh qua Trusted Circle', () => {
  const t = 'My daughter asked me to send her $100 for groceries.';
  assert.ok(!batTinHieu(t, { verifiedRelationship: true }).includes('ID_FAMILY_IMPERSONATION'));
  assert.ok(batTinHieu(t, { verifiedRelationship: false }).includes('ID_FAMILY_IMPERSONATION'));
});

// ─────────────── C.6.2 — Tiếng Việt ───────────────

const C62 = [
  ['Không cung cấp mã này cho bất kỳ ai.', 'notification', 'CRED_OTP_SHARE'],
  ['Quý khách đã chuyển 5.000.000đ. Biến động số dư.', 'notification', 'FIN_TRANSFER_REQUEST'],
  ['Đừng giữ bí mật, hãy báo người thân.', 'warning_education', 'MAN_SECRECY'],
  ['Công an không bao giờ yêu cầu chuyển tiền qua điện thoại.', 'warning_education', 'ID_AUTHORITY_IMPERSONATION'],
  ['Bác cứ bình tĩnh, không cần gấp đâu.', null, 'MAN_URGENCY'],
  ['Bác cài ứng dụng ngân hàng từ CH Play chính thức.', 'self_directed', 'DEV_INSTALL_APK_UNKNOWN'],
  ['Hôm qua tôi đã chuyển vào tài khoản họ đưa rồi.', 'past_event', 'FIN_TRANSFER_REQUEST'],
  ['Lịch khám ngày 20/8 lúc 8h sáng.', 'notification', 'MAN_URGENCY'],
  ['Mua vàng nhẫn cưới cho cháu.', 'self_directed', 'FIN_PRECIOUS_METAL_PURCHASE'],
  ['Mừng tuổi cháu bằng thẻ quà tặng.', 'self_directed', 'FIN_GIFT_CARD_PAYMENT'],
];

for (const [vanBan, act, khongDuocBat] of C62) {
  test(`C.6.2 — "${vanBan.slice(0, 40)}…" không bật ${khongDuocBat}`, () => {
    if (act) assert.strictEqual(actDau(vanBan), act);
    assert.ok(!batTinHieu(vanBan).includes(khongDuocBat));
  });
}

test('C.6.2 — mười mẫu lành này KHÔNG mẫu nào lên nhãn CAO', () => {
  for (const [vanBan] of C62) {
    assert.notStrictEqual(analyze({ vanBan }).nhan, 'CAO', vanBan);
  }
  for (const [vanBan] of C61) {
    assert.notStrictEqual(analyze({ vanBan }).nhan, 'CAO', vanBan);
  }
});

// ─────────────── C.6.3 — Ca ngược: PHẢI bật ───────────────

const C63 = [
  ['Please transfer the money to this account and do not tell Mum.',
    ['FIN_TRANSFER_REQUEST', 'MAN_SECRECY']],
  ['There is a small unlock fee before your refund can be processed.',
    ['FIN_RECOVERY_FEE']],
  ['This is Officer Daniels. Your account is linked to money laundering. '
    + 'You will be arrested today unless you move your funds to a safe account.',
    ['ID_AUTHORITY_IMPERSONATION', 'MAN_FEAR_THREAT', 'FIN_SAFE_ACCOUNT']],
  ['Bác ơi, please install AnyDesk so I can help.',
    ['DEV_REMOTE_CONTROL_APP']],
  ['Bác keep this confidential, send OTP cho em now.',
    ['MAN_SECRECY', 'CRED_OTP_SHARE', 'MAN_URGENCY']],
];

for (const [vanBan, phaiBat] of C63) {
  test(`C.6.3 — "${vanBan.slice(0, 44)}…" phải bật ${phaiBat.join(' + ')}`, () => {
    const bat = batTinHieu(vanBan);
    for (const id of phaiBat) {
      assert.ok(bat.includes(id), `hàng rào nuốt mất ${id}`);
    }
  });
}

test('C.6.3 — "Bác ơi, please install AnyDesk" phải ra CO-02', () => {
  assert.ok(analyze({ vanBan: 'Bác ơi, please install AnyDesk so I can help.' })
    .overrides.includes('CO-02'));
});

test('C.6.3 — nhiễu OCR cho kết quả NHƯ bản không nhiễu', () => {
  const sach = batTinHieu('Install this app and send me the six-digit code.');
  const nhieu = batTinHieu('1nsta11 this app and send me the s1x-d1g1t code.');
  for (const id of sach) {
    assert.ok(nhieu.includes(id), `nhiễu OCR làm mất ${id}`);
  }
});

// ─────────────── C.1 / C.5 — danh sách tắt phải CỰC HẸP ───────────────

test('C.5 — danh sách tắt vô điều kiện đúng số mục đã chốt', () => {
  const en = require('../backend/src/analysis/locale-packs/en-US');
  const vi = require('../backend/src/analysis/locale-packs/vi-VN');
  assert.strictEqual(Object.keys(en.suppressors).length, 3, 'en-US: 3 tín hiệu có danh sách tắt');
  assert.strictEqual(Object.keys(vi.suppressors).length, 4, 'vi-VN: 4 tín hiệu có danh sách tắt');
});

test('C.5 — "ch play" TUYỆT ĐỐI không nằm trong danh sách tắt', () => {
  const vi = require('../backend/src/analysis/locale-packs/vi-VN');
  const moi = JSON.stringify(vi.suppressors).toLowerCase();
  assert.ok(!moi.includes('ch play'),
    'đã đo: "…đừng tải trên CH Play vì bản đó cũ" tụt hẳn kịch bản giả danh công an xuống mức thấp');
  assert.ok(!moi.includes('please hold'));
});

test('§6.12 — locale pack CHỈ chứa dữ liệu, không weight/threshold/critical', () => {
  for (const ten of ['en-US', 'vi-VN']) {
    const pack = require(`../backend/src/analysis/locale-packs/${ten}`);
    const chu = JSON.stringify(pack);
    for (const cam of ['weight', 'threshold', 'riskScore', 'critical', 'SCORE_CAP']) {
      assert.ok(!chu.includes(cam), `${ten} không được chứa "${cam}"`);
    }
  }
});
