'use strict';
// §4.1 — ba nhãn mức rủi ro là RÀNG BUỘC BẤT BIẾN.
// i18n không ghi đè được, CSS không đụng tới được.

const test = require('node:test');
const assert = require('node:assert');

const {
  RISK_LEVELS,
  RISK_LABELS,
  NHAN_HOP_DONG,
  nhanHopDong,
} = require('../src/risk-labels');

test('§4.1 — đúng ba mức, không hơn không kém', () => {
  assert.deepStrictEqual(RISK_LEVELS, ['HIGH', 'SUSPICIOUS', 'NO_SIGNS_FOUND']);
  assert.strictEqual(Object.keys(RISK_LABELS).length, 3);
});

test('§4.1 — chuỗi hiển thị tiếng Việt nguyên văn', () => {
  assert.strictEqual(RISK_LABELS.HIGH.vi, 'Nguy hiểm cao');
  assert.strictEqual(RISK_LABELS.SUSPICIOUS.vi, 'Nghi ngờ');
  assert.strictEqual(RISK_LABELS.NO_SIGNS_FOUND.vi, 'Chưa thấy dấu hiệu rủi ro');
});

test('§4.1 — chuỗi hiển thị tiếng Anh nguyên văn', () => {
  assert.strictEqual(RISK_LABELS.HIGH.en, 'High risk');
  assert.strictEqual(RISK_LABELS.SUSPICIOUS.en, 'Suspicious');
  assert.strictEqual(RISK_LABELS.NO_SIGNS_FOUND.en, 'No clear risk signals found');
});

test('§4.1 — TUYỆT ĐỐI không có nhãn "An toàn" / "Safe"', () => {
  const moiChuoi = JSON.stringify(RISK_LABELS).toLowerCase();
  assert.ok(!/an toàn|an toan/.test(moiChuoi), 'không được chứa "an toàn"');
  assert.ok(!/\bsafe\b/.test(moiChuoi), 'không được chứa "safe"');
  assert.ok(!('SAFE' in RISK_LABELS));
  assert.ok(!RISK_LEVELS.includes('SAFE'));
});

test('§4.1 — không có nhãn thứ tư "Nghiêm trọng"', () => {
  const moiChuoi = JSON.stringify(RISK_LABELS).toLowerCase();
  assert.ok(!/nghiêm trọng|critical/.test(moiChuoi));
});

test('§HĐ — riskLabel enum ánh xạ sang nhan của hợp đồng', () => {
  assert.strictEqual(NHAN_HOP_DONG.HIGH, 'CAO');
  assert.strictEqual(NHAN_HOP_DONG.SUSPICIOUS, 'NGHI_NGO');
  assert.strictEqual(NHAN_HOP_DONG.NO_SIGNS_FOUND, 'CHUA_THAY');
  assert.strictEqual(nhanHopDong('HIGH'), 'CAO');
});

test('§4.1 — bảng nhãn bị đóng băng, i18n không ghi đè được', () => {
  assert.ok(Object.isFrozen(RISK_LABELS));
  assert.ok(Object.isFrozen(RISK_LABELS.HIGH));
  assert.throws(() => {
    'use strict';
    RISK_LABELS.HIGH.vi = 'An toàn';
  });
});
