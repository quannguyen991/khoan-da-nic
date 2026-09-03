'use strict';
// §6.3 — CO-01…CO-10. Mỗi override có ĐÚNG 5 ca:
//   positive · paraphrase positive · negation negative · quoted-warning negative · near-miss negative
// Bốn ca đầu chạy qua PIPELINE bằng văn bản thật — vì phủ định và ngữ cảnh cảnh báo
// chỉ lộ ra ở đó. Ca near-miss kiểm ở tầng ID, nơi nó thuộc về.

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const {
  evaluateOverrides,
  CRITICAL_OVERRIDES,
} = require('../backend/src/analysis/critical-overrides');

const noTru = (vanBan, opts = {}) => analyze({ vanBan, ...opts }).overrides;
const co = (vanBan, id, opts) => noTru(vanBan, opts).includes(id);

/** Bảng ca: mỗi phần tử là một override với đúng năm cột. */
const BANG = [
  {
    id: 'CO-01',
    dieuKien: 'CRED_OTP_SHARE + FIN_TRANSFER_REQUEST',
    positive: 'Bác đọc mã OTP vừa nhận cho tôi rồi chuyển 20 triệu vào tài khoản này ngay.',
    paraphrase: 'Send me the OTP code you just received and transfer $2,000 to this account now.',
    negation: 'Ngân hàng không bao giờ yêu cầu bác đọc mã OTP hay chuyển tiền qua điện thoại.',
    quotedWarning: 'Kẻ lừa đảo bảo tôi đọc mã OTP rồi chuyển tiền cho chúng.',
    nearMiss: ['CRED_OTP_SHARE'],
  },
  {
    id: 'CO-02',
    dieuKien: 'DEV_INSTALL_APK_UNKNOWN OR DEV_REMOTE_CONTROL_APP',
    positive: 'Bác cài ứng dụng dịch vụ công này qua đường link tôi gửi nhé.',
    // C.6.3 — ca mixed từng làm CO-02 im lặng vì nhận diện ngôn ngữ quá chặt
    paraphrase: 'Bác ơi, please install AnyDesk so I can help.',
    negation: 'Bác cài ứng dụng ngân hàng từ CH Play chính thức.',
    quotedWarning: 'A scammer told me yesterday to install AnyDesk.',
    nearMiss: ['DEV_CALL_FORWARD'],
  },
  {
    id: 'CO-03',
    dieuKien: 'FIN_SAFE_ACCOUNT',
    positive: 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an để bảo toàn.',
    paraphrase: 'You must move the money to a safe account we have set up for you.',
    negation: 'Công an không bao giờ yêu cầu chuyển tiền sang tài khoản an toàn.',
    quotedWarning: 'Scammers may ask you to move money to a so-called safe account.',
    nearMiss: ['FIN_NEW_RECIPIENT'],
  },
  {
    id: 'CO-04',
    dieuKien: 'DEV_SCREEN_SHARE_BANKING',
    positive: 'Bác bật chia sẻ màn hình để tôi xem app ngân hàng của bác nhé.',
    paraphrase: 'Please share your screen so I can see your banking app.',
    negation: 'Nhân viên ngân hàng không bao giờ yêu cầu chia sẻ màn hình app ngân hàng.',
    quotedWarning: 'Hôm qua có người bảo tôi chia sẻ màn hình app ngân hàng.',
    nearMiss: ['DEV_ACCESSIBILITY_PERMISSION'],
  },
  {
    id: 'CO-05',
    dieuKien: 'MAN_SECRECY + MAN_FEAR_THREAT + FIN_TRANSFER_REQUEST',
    positive: 'Bác chuyển tiền ngay không sẽ bị bắt giữ, và đừng nói với ai cả.',
    paraphrase: 'Transfer the money now or you will be arrested, and do not tell anyone.',
    negation: 'Đừng giữ bí mật, hãy báo người thân ngay.',
    quotedWarning: 'Kẻ lừa đảo doạ bắt tôi, bắt giữ bí mật rồi đòi chuyển tiền.',
    nearMiss: ['MAN_SECRECY', 'FIN_TRANSFER_REQUEST'],
  },
  {
    id: 'CO-06',
    dieuKien: 'FIN_RECOVERY_FEE + case outcome money_lost / recovery context',
    positive: 'There is a small unlock fee before your refund can be processed.',
    paraphrase: 'Bác đóng phí giải ngân 5 triệu thì mới lấy lại được số tiền đã mất.',
    negation: 'Cảnh báo: kẻ lừa đảo đòi phí để hứa lấy lại tiền đã mất.',
    quotedWarning: 'Hôm qua họ đòi tôi đóng phí để lấy lại tiền.',
    nearMiss: ['FIN_RECOVERY_FEE'],
    opts: { caseContext: { outcome: 'money_lost' } },
  },
  {
    id: 'CO-07',
    dieuKien: 'FIN_GIFT_CARD_PAYMENT + (ID_AUTHORITY_* OR ID_TECH_SUPPORT_* OR MAN_FEAR_THREAT)',
    positive: 'This is the IRS. You must pay your tax debt with gift cards today.',
    paraphrase: 'Chi cục thuế yêu cầu bác nộp phạt bằng thẻ quà tặng ngay hôm nay.',
    negation: 'Mừng tuổi cháu bằng thẻ quà tặng.',
    quotedWarning: 'The FTC warns that scammers may ask you to buy gift cards.',
    nearMiss: ['FIN_GIFT_CARD_PAYMENT'],
  },
  {
    id: 'CO-08',
    dieuKien: 'FIN_CASH_COURIER + (ID_AUTHORITY_* OR ID_TECH_SUPPORT_* OR OFF_INVESTMENT_GUARANTEE OR FIN_PRECIOUS_METAL_PURCHASE)',
    positive: 'Tôi là điều tra viên, chiều nay sẽ có người tới nhà nhận tiền mặt của bác.',
    paraphrase: 'An officer will come to your home this afternoon to collect the cash.',
    negation: 'Công an không bao giờ cử người tới nhà nhận tiền mặt.',
    quotedWarning: 'Kẻ lừa đảo nói sẽ cho người tới nhà tôi lấy tiền mặt.',
    nearMiss: ['FIN_CASH_COURIER'],
  },
  {
    id: 'CO-09',
    dieuKien: 'FIN_CRYPTO_TRANSFER + FIN_SAFE_ACCOUNT',
    positive: 'Bác chuyển hết bitcoin sang ví an toàn của chúng tôi để bảo toàn tài sản.',
    paraphrase: 'Move your crypto into the safe wallet we set up to protect it.',
    negation: 'I want to buy $200 of Bitcoin for my own portfolio.',
    quotedWarning: 'Kẻ lừa đảo bảo tôi chuyển bitcoin sang ví an toàn của chúng.',
    nearMiss: ['FIN_CRYPTO_TRANSFER'],
  },
  {
    id: 'CO-10',
    dieuKien: 'DEV_REMOTE_CONTROL_APP + (CRED_BANK_LOGIN OR FIN_TRANSFER_REQUEST OR DEV_SCREEN_SHARE_BANKING)',
    positive: 'Bác cài AnyDesk rồi đăng nhập ngân hàng để tôi hỗ trợ nhé.',
    paraphrase: 'Install TeamViewer and log into your bank so I can fix it.',
    negation: 'Không cài phần mềm điều khiển từ xa khi có người lạ yêu cầu đăng nhập ngân hàng.',
    quotedWarning: 'For remote IT support, I opened TeamViewer after calling our help desk.',
    nearMiss: ['DEV_REMOTE_CONTROL_APP'],
  },
];

test('§6.3 — đúng MƯỜI critical override, không có cái thứ 11', () => {
  assert.strictEqual(CRITICAL_OVERRIDES.length, 10);
  assert.deepStrictEqual(
    CRITICAL_OVERRIDES.map((o) => o.id),
    ['CO-01', 'CO-02', 'CO-03', 'CO-04', 'CO-05', 'CO-06', 'CO-07', 'CO-08', 'CO-09', 'CO-10'],
  );
  assert.strictEqual(BANG.length, 10, 'bảng ca phải phủ đủ 10 override');
});

for (const ca of BANG) {
  test(`${ca.id} ca 1/5 — positive: ${ca.dieuKien}`, () => {
    assert.ok(co(ca.positive, ca.id, ca.opts), `không nổ: "${ca.positive}"`);
  });

  test(`${ca.id} ca 2/5 — paraphrase positive`, () => {
    assert.ok(co(ca.paraphrase, ca.id, ca.opts), `không nổ: "${ca.paraphrase}"`);
  });

  test(`${ca.id} ca 3/5 — negation negative`, () => {
    assert.ok(!co(ca.negation, ca.id, ca.opts), `báo động giả: "${ca.negation}"`);
  });

  test(`${ca.id} ca 4/5 — quoted-warning negative`, () => {
    assert.ok(!co(ca.quotedWarning, ca.id, ca.opts), `báo động giả: "${ca.quotedWarning}"`);
  });

  test(`${ca.id} ca 5/5 — near-miss negative (thiếu vế bắt buộc)`, () => {
    assert.ok(!evaluateOverrides(ca.nearMiss, {}).includes(ca.id),
      `nổ khi mới có ${ca.nearMiss.join(' + ')}`);
  });
}

// ─────────────── Ràng buộc thực thi §6.3 ───────────────

test('§6.3 — "ít nhất MỘT tín hiệu mạnh" ≠ "MỌI tín hiệu đều mạnh"', () => {
  // Hiện thực vế sau làm CO-07 không nổ cho vụ giả danh cơ quan thuế.
  assert.ok(evaluateOverrides(['FIN_GIFT_CARD_PAYMENT', 'ID_TAX_BENEFIT_IMPERSONATION'], {}).includes('CO-07'));
  assert.ok(evaluateOverrides(['FIN_GIFT_CARD_PAYMENT', 'ID_AUTHORITY_IMPERSONATION'], {}).includes('CO-07'));
  assert.ok(evaluateOverrides(['FIN_GIFT_CARD_PAYMENT', 'ID_TECH_SUPPORT_IMPERSONATION'], {}).includes('CO-07'));
  assert.ok(evaluateOverrides(['FIN_GIFT_CARD_PAYMENT', 'MAN_FEAR_THREAT'], {}).includes('CO-07'));
});

test('§6.3 — CO-02 nổ với TỪNG vế OR một cách độc lập', () => {
  assert.ok(evaluateOverrides(['DEV_INSTALL_APK_UNKNOWN'], {}).includes('CO-02'));
  assert.ok(evaluateOverrides(['DEV_REMOTE_CONTROL_APP'], {}).includes('CO-02'));
});

test('§6.3 — CO-06 cần ngữ cảnh phục hồi, không nổ khi thiếu', () => {
  const ids = ['FIN_RECOVERY_FEE'];
  assert.ok(!evaluateOverrides(ids, {}).includes('CO-06'));
  assert.ok(evaluateOverrides(ids, { caseContext: { outcome: 'money_lost' } }).includes('CO-06'));
  assert.ok(evaluateOverrides(ids, { recoveryContext: true }).includes('CO-06'));
});

test('§6.3 — hàm override là hàm THUẦN: không mạng, không DB, không LLM', () => {
  const ids = ['CRED_OTP_SHARE', 'FIN_TRANSFER_REQUEST'];
  assert.deepStrictEqual(evaluateOverrides(ids, {}), evaluateOverrides(ids, {}));
  const nguon = CRITICAL_OVERRIDES.map((o) => o.test.toString()).join('\n');
  for (const cam of ['fetch', 'require(', 'await', 'process.env']) {
    assert.ok(!nguon.includes(cam), `override không được dùng ${cam}`);
  }
});

test('§HĐ — override đẩy thẳng lên PROTECTED_CRITICAL và nhãn CAO', () => {
  const kq = analyze({ vanBan: BANG[0].positive });
  assert.ok(kq.overrides.length > 0);
  assert.strictEqual(kq.nhan, 'CAO');
  assert.strictEqual(kq.canThiep, 'PROTECTED_CRITICAL');
});
