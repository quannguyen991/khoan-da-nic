'use strict';
// §2B.2 bước 16 — thang can thiệp 5 mức, ngưỡng 20/45, SCORE_SCALE 12.5.

const test = require('node:test');
const assert = require('node:assert');

const {
  MUC_CAN_THIEP, chonMuc, SCORE_SCALE, moTaMuc,
} = require('../backend/src/intervention-ladder');

test('§9 — đúng năm mức can thiệp, đúng enum của §HĐ', () => {
  assert.deepStrictEqual(MUC_CAN_THIEP,
    ['TRUST_RECEIPT', 'VERIFY_PATH', 'PAUSE_60S', 'PROTECTED_CRITICAL', 'RECOVERY']);
});

test('§6.2 — SCORE_SCALE là 12.5', () => {
  assert.strictEqual(SCORE_SCALE, 12.5);
});

test('§6.2 — ngưỡng 20/45 chia đúng ba bậc điểm', () => {
  assert.strictEqual(chonMuc({ score: 0 }), 'TRUST_RECEIPT');
  assert.strictEqual(chonMuc({ score: 19 }), 'TRUST_RECEIPT');
  assert.strictEqual(chonMuc({ score: 20 }), 'VERIFY_PATH');
  assert.strictEqual(chonMuc({ score: 44 }), 'VERIFY_PATH');
  assert.strictEqual(chonMuc({ score: 45 }), 'PAUSE_60S');
  assert.strictEqual(chonMuc({ score: 69 }), 'PAUSE_60S');
});

test('§6.2 — PROTECTED_CRITICAL CHỈ đến từ override, không bao giờ từ điểm', () => {
  assert.strictEqual(chonMuc({ score: 69, overrides: [] }), 'PAUSE_60S');
  assert.strictEqual(chonMuc({ score: 0, overrides: ['CO-03'] }), 'PROTECTED_CRITICAL');
});

test('RECOVERY dành cho người ĐÃ mất tiền, đứng trên mọi bậc điểm', () => {
  assert.strictEqual(chonMuc({ score: 0, caseContext: { outcome: 'money_lost' } }), 'RECOVERY');
  assert.strictEqual(chonMuc({ score: 30, caseContext: { outcome: 'money_lost' } }), 'RECOVERY');
});

test('Override vẫn thắng RECOVERY — đang bị tấn công gấp hơn đã mất tiền', () => {
  assert.strictEqual(
    chonMuc({ score: 0, overrides: ['CO-06'], caseContext: { outcome: 'money_lost' } }),
    'PROTECTED_CRITICAL');
});

test('§4.6 — mọi mức đều có lối ra, kể cả PROTECTED_CRITICAL', () => {
  for (const muc of MUC_CAN_THIEP) {
    const mo = moTaMuc(muc);
    assert.strictEqual(mo.coLoiRa, true,
      'người bị kẹt trong màn khẩn cấp sẽ hoảng và gỡ ứng dụng');
    assert.match(mo.maLoiRa, /^[a-z][a-z0-9_]+$/);
  }
  assert.strictEqual(moTaMuc('PROTECTED_CRITICAL').boDieuHuong, true);
});

test('§5.2 — KHÔNG dựng cầu nối sang bộ luật cũ', () => {
  const nguon = require('node:fs').readFileSync(
    require.resolve('../backend/src/intervention-ladder'), 'utf8');
  assert.ok(!nguon.includes('escalation-bridge'));
  assert.ok(!nguon.includes('rule-engine'));
});
