'use strict';
/**
 * ⚠️ HÀNG RÀO CHO LỖI ĐÃ ĐO 15/8/2026.
 *
 * Toàn bộ Phụ lục C chỉ bảo vệ direct-precheck, KHÔNG bảo vệ đường AI — mà AI
 * mới là máy dò chính. Câu "Never share your OTP or verification code with
 * anyone." được bộ luật phân loại đúng là `warning_education` và direct-precheck
 * im lặng, nhưng tín hiệu AI cho ĐÚNG CÂU ĐÓ đi thẳng qua và ghi 25 điểm.
 *
 * Đây đúng dạng lỗi §9.1 mô tả: ĐƯỜNG DỰ PHÒNG AN TOÀN HƠN ĐƯỜNG CHÍNH.
 * Đo được: high-risk FP 14,9% và FP trên lát chặt 31,3% ở lượt eval đầu tiên.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const { scopeCuaTinHieu } = require('../backend/src/analysis/signal-registry');

const ai = (id, quote, conf = 0.9) => [{
  id, state: 'present', confidence: conf,
  evidence: [{ quote, start: 0, end: quote.length, sourceId: 'van_ban' }],
}];

// ─────────── Đoạn KHÔNG hành động: tín hiệu action-scope phải bị chặn ───────────

const CHAN = [
  ['giáo dục EN — OTP', 'Never share your OTP or verification code with anyone.',
    'CRED_OTP_SHARE', 'share your OTP'],
  ['giáo dục VI — chuyển tiền', 'Công an không bao giờ yêu cầu chuyển tiền qua điện thoại.',
    'FIN_TRANSFER_REQUEST', 'chuyển tiền'],
  ['giáo dục EN — thẻ quà tặng', 'The FTC warns that scammers may ask you to buy gift cards.',
    'FIN_GIFT_CARD_PAYMENT', 'gift cards'],
  ['thông báo ngân hàng', 'Quý khách đã chuyển 5.000.000đ. Biến động số dư.',
    'FIN_TRANSFER_REQUEST', 'đã chuyển'],
  ['tự quyết định', 'I want to buy $200 of Bitcoin for my own portfolio.',
    'FIN_CRYPTO_TRANSFER', 'Bitcoin'],
  ['chuyện đã qua', 'A scammer told me yesterday to install AnyDesk.',
    'DEV_REMOTE_CONTROL_APP', 'install AnyDesk'],
];

for (const [ten, vanBan, id, quote] of CHAN) {
  test(`AI không đi vòng được hàng rào — ${ten}`, () => {
    const kq = analyze({ vanBan, llmSignals: ai(id, quote) });
    assert.ok(!kq.maLyDo.includes(id),
      `tín hiệu ${id} lọt qua dù đoạn không phải hành động`);
    assert.notStrictEqual(kq.nhan, 'CAO');
  });
}

// ─────────── Đoạn HÀNH ĐỘNG: tín hiệu vẫn phải qua ───────────

test('Hàng rào KHÔNG được nuốt tín hiệu ở đoạn hành động thật', () => {
  const kq = analyze({
    vanBan: 'Bác chuyển 20 triệu vào tài khoản này ngay.',
    llmSignals: ai('FIN_TRANSFER_REQUEST', 'chuyển 20 triệu'),
  });
  assert.ok(kq.maLyDo.includes('FIN_TRANSFER_REQUEST'));
});

test('C.3 bẫy 1 — danh tính ở câu TƯỜNG THUẬT vẫn phải qua (scope any)', () => {
  // "Sức ép và danh tính hầu như LUÔN nằm ở câu tường thuật." Nếu áp scope
  // hành động cho chúng thì tái phạm đúng bẫy đã cắn.
  for (const [vanBan, id, quote] of [
    ['This is Officer Daniels from the police.', 'ID_AUTHORITY_IMPERSONATION', 'Officer Daniels'],
    ['Your account is linked to money laundering.', 'MAN_FEAR_THREAT', 'money laundering'],
    ['Tôi là cán bộ công an.', 'ID_AUTHORITY_IMPERSONATION', 'cán bộ công an'],
  ]) {
    const kq = analyze({ vanBan, llmSignals: ai(id, quote) });
    assert.ok(kq.maLyDo.includes(id), `${id} bị nuốt oan ở "${vanBan}"`);
  }
});

// ─────────── Scope canonical ───────────

test('C.2 — scope là thuộc tính của TÍN HIỆU, giống nhau ở mọi ngôn ngữ', () => {
  // Để mỗi locale pack tự khai thì cùng một tín hiệu lọc khác nhau ở hai ngôn
  // ngữ, phá parity §6.14.
  assert.strictEqual(scopeCuaTinHieu('ID_AUTHORITY_IMPERSONATION'), 'any');
  assert.strictEqual(scopeCuaTinHieu('MAN_FEAR_THREAT'), 'any');
  assert.strictEqual(scopeCuaTinHieu('WEB_BRAND_DOMAIN_MISMATCH'), 'any');
  assert.strictEqual(scopeCuaTinHieu('CASE_REPEATED_CONTACT'), 'any');
  assert.strictEqual(scopeCuaTinHieu('CRED_OTP_SHARE'), 'action');
  assert.strictEqual(scopeCuaTinHieu('FIN_TRANSFER_REQUEST'), 'action');
  assert.strictEqual(scopeCuaTinHieu('DEV_REMOTE_CONTROL_APP'), 'action');
});

test('Tín hiệu direct và deterministic KHÔNG bị lọc lại lần hai', () => {
  // direct-precheck đã áp scope khi phát hiện; lọc lại là lọc hai lần.
  const kq = analyze({ vanBan: 'Bác chuyển hết tiền sang tài khoản an toàn ngay.' });
  assert.ok(kq.maLyDo.includes('FIN_SAFE_ACCOUNT'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('§4.2 — hàng rào chỉ LOẠI tín hiệu, không bao giờ THÊM', () => {
  const vanBan = 'Bác chuyển 20 triệu vào tài khoản này ngay.';
  const khongAi = analyze({ vanBan }).score;
  const coAi = analyze({ vanBan, llmSignals: ai('FIN_TRANSFER_REQUEST', 'chuyển 20 triệu') }).score;
  assert.ok(coAi >= khongAi);
});
