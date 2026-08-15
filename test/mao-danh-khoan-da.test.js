'use strict';
/**
 * §9.2 — CÂU BẤT BIẾN CHỐNG MẠO DANH CHÍNH KHOAN ĐÃ.
 *
 * "Hễ một thương hiệu chống lừa đảo được người cao tuổi biết tới, kẻ lừa đảo sẽ
 * dùng chính cái tên đó. Rủi ro này LỚN DẦN THEO MỨC ĐỘ THÀNH CÔNG của sản phẩm."
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../src/analysis/pipeline');
const { CRITICAL_OVERRIDES } = require('../src/analysis/critical-overrides');
const { getSignal } = require('../src/analysis/signal-registry');

const ma = (t) => analyze({ vanBan: t }).maLyDo;

test('§9.2 — ca kiểm thử nguyên văn của tài liệu', () => {
  assert.ok(ma('Cháu là nhân viên Khoan Đã, bác cài giúp app nhé.')
    .includes('ID_KHOAN_DA_IMPERSONATION'));
});

test('§9.2 — bắt được các biến thể tự xưng khác', () => {
  for (const t of [
    'Tôi là Khoan Đã, bác đọc mã OTP cho tôi.',
    'Bên Khoan Đã gọi cho bác đây.',
    'Khoan Đã yêu cầu bác xác minh lại tài khoản.',
    'Em là người của Khoan Đã ạ.',
  ]) {
    assert.ok(ma(t).includes('ID_KHOAN_DA_IMPERSONATION'), `bỏ sót: "${t}"`);
  }
});

test('§4.1 + §9.2 — tên thương hiệu giữ nguyên tiếng Việt nên cue tiếng Anh cũng phải bắt', () => {
  assert.ok(ma('I am from Khoan Da support, please install this app.')
    .includes('ID_KHOAN_DA_IMPERSONATION'));
});

test('§9.2 — nhắc tới Khoan Đã một cách BÌNH THƯỜNG không bị gắn cờ', () => {
  for (const t of [
    'Bác mở Khoan Đã ra kiểm tra tin nhắn này nhé.',
    'Cháu vừa cài Khoan Đã cho bà rồi ạ.',
  ]) {
    assert.ok(!ma(t).includes('ID_KHOAN_DA_IMPERSONATION'), `báo động giả: "${t}"`);
  }
});

test('§9.2 — TUYỆT ĐỐI không nâng tín hiệu này thành override thứ 11', () => {
  assert.strictEqual(CRITICAL_OVERRIDES.length, 10);
  const nguon = CRITICAL_OVERRIDES.map((o) => o.test.toString()).join('\n');
  assert.ok(!nguon.includes('ID_KHOAN_DA_IMPERSONATION'),
    '§9.2 cấm rõ ràng việc này');
});

test('§9.2 — mạo danh Khoan Đã + đòi cài app vẫn lên mức cao qua đường thông thường', () => {
  // Không cần override riêng: ID_* + DEV_* đã có tổ hợp cộng hưởng identity+device.
  const kq = analyze({ vanBan: 'Cháu là nhân viên Khoan Đã, bác cài ứng dụng qua link này giúp cháu.' });
  assert.ok(kq.maLyDo.includes('ID_KHOAN_DA_IMPERSONATION'));
  assert.ok(kq.appliedSynergies.some((s) => s.id === 'identity+device'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('Phụ lục A — tín hiệu này thuộc nhóm identity, trọng số 12', () => {
  const s = getSignal('ID_KHOAN_DA_IMPERSONATION');
  assert.strictEqual(s.group, 'identity');
  assert.strictEqual(s.weight, 12);
});
