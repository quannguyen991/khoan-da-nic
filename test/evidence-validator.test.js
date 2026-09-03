'use strict';
/**
 * §6.4 / 18.9 — EVIDENCE PHẢI KHỚP BẢN GỐC, KHÔNG DỊCH TRƯỚC KHI VALIDATE.
 *
 * Model trả một "câu trích" đã diễn giải lại mà không tồn tại trong nguồn thì
 * evidence-validator LOẠI TÍN HIỆU ĐÓ. Bản dịch chỉ được hiện như phụ chú.
 */

const test = require('node:test');
const assert = require('node:assert');

const { buildContext } = require('../backend/src/analysis/context-builder');
const { validateEvidence, locTheoEvidence } = require('../backend/src/analysis/evidence-validator');

const ctxVi = buildContext('Bác chuyển hết tiền sang tài khoản an toàn ngay.');
const ctxEn = buildContext('Please move the money to a safe account today.');

const th = (quote, extra = {}) => ({
  id: 'FIN_SAFE_ACCOUNT', state: 'present', confidence: 0.9, source: 'llm',
  evidence: [{ quote, start: 0, end: quote.length, sourceId: 'van_ban' }],
  ...extra,
});

test('§6.4 — trích đúng chuỗi con của bản gốc thì được nhận', () => {
  assert.ok(validateEvidence(th('tài khoản an toàn'), ctxVi));
  assert.ok(validateEvidence(th('safe account'), ctxEn));
});

test('§6.4 — trích KHÔNG tồn tại trong nguồn thì bị loại', () => {
  assert.ok(!validateEvidence(th('tài khoản bí mật'), ctxVi));
  assert.ok(!validateEvidence(th('bitcoin wallet'), ctxEn));
});

test('18.9 — KHÔNG dịch evidence trước khi validate: tiếng Anh phải khớp bản tiếng Anh', () => {
  // Model dịch "tài khoản an toàn" thành "safe account" rồi trả về cho input tiếng Việt.
  assert.ok(!validateEvidence(th('safe account'), ctxVi),
    'bản dịch không được thay thế evidence gốc');
});

test('§6.4 — so khớp bỏ qua hoa/thường, vì bản gốc đã được case-fold', () => {
  assert.ok(validateEvidence(th('TÀI KHOẢN AN TOÀN'), ctxVi));
});

test('§6.13 — evidence khớp được cả trên bản KHÔNG DẤU', () => {
  assert.ok(validateEvidence(th('tai khoan an toan'), ctxVi));
});

test('§6.4 — evidence rỗng hoặc thiếu quote thì bị loại', () => {
  assert.ok(!validateEvidence({ id: 'FIN_SAFE_ACCOUNT', evidence: [] }, ctxVi));
  assert.ok(!validateEvidence({ id: 'FIN_SAFE_ACCOUNT', evidence: [{ quote: '' }] }, ctxVi));
  assert.ok(!validateEvidence({ id: 'FIN_SAFE_ACCOUNT' }, ctxVi));
});

test('§6.4 — tín hiệu direct KHÔNG đi qua tầng này', () => {
  const direct = th('không hề có trong câu', { source: 'direct', confidence: 1.0 });
  assert.ok(validateEvidence(direct, ctxVi), 'direct detector tự sinh evidence, luôn hợp lệ');
});

test('locTheoEvidence giữ tín hiệu hợp lệ và loại tín hiệu bịa', () => {
  const ra = locTheoEvidence([
    th('tài khoản an toàn'),
    th('hoàn toàn bịa đặt', { id: 'FIN_TRANSFER_REQUEST' }),
  ], ctxVi);
  assert.strictEqual(ra.length, 1);
  assert.strictEqual(ra[0].id, 'FIN_SAFE_ACCOUNT');
});

test('§6.4 — offset lệch KHÔNG làm loại tín hiệu nếu chuỗi có thật', () => {
  // Gateway hay trả offset sai; chuỗi con mới là thứ kiểm được.
  const s = th('tài khoản an toàn');
  s.evidence[0].start = 999;
  s.evidence[0].end = 1002;
  assert.ok(validateEvidence(s, ctxVi));
});
