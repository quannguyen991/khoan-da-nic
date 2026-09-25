'use strict';
/**
 * NHỮNG CHỖ ĐÃ SỬA 25/9/2026 SAU KHI ĐỐI CHIẾU VỚI NGHIÊN CỨU NGOÀI — canh để chúng
 * không quay lại. Mỗi test ghi rõ vì sao.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');
/** Bỏ chú thích: chú thích được phép kể lại chữ cũ để giải thích vì sao đã bỏ. */
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('màn phục hồi không in "giờ vàng": số 24 không nguồn, lại in như đang đếm lùi', () => {
  const R = require('../backend/src/analysis/recovery-adapters');
  assert.ok(!('gioVang' in R.layKeHoachPhucHoi('VN')), 'kế hoạch phục hồi còn trường gioVang');
  assert.doesNotMatch(boChuThich(doc('src', 'App.tsx')), /Giờ vàng|gioVang/);
  assert.doesNotMatch(boChuThich(doc('src', 'i18n.ts')), /Golden window|Giờ vàng/);
  assert.match(doc('src', 'i18n.ts'), /"Bắt đầu ngay, đừng chờ hết 72 giờ\./, 'thiếu câu giục bắt đầu ngay');
});

test('không câu tiếng Anh nào hứa chặn chuyển tiền, và tên PAUSE_60S đúng §4.1', () => {
  const i18n = boChuThich(doc('src', 'i18n.ts'));
  assert.doesNotMatch(i18n, /stops transfers/i, '§12 — app không chặn được giao dịch');
  assert.doesNotMatch(i18n, /Safe Pause/, '§4.1 — tên chuẩn là "Pause for 60 Seconds", và không có chữ "Safe"');
});

test('màn con cháu không còn công tắc tiền đặt từ phía con', () => {
  const g = boChuThich(doc('src', 'components', 'Guardian.tsx'));
  assert.doesNotMatch(g, /toggleRule\('monitorTransfer'\)|monitorTransfer:/, 'quy tắc tiền phải do chính bố mẹ bật');
  assert.doesNotMatch(g, /Nhắc dừng 60s trước khi xác nhận/, 'app không đứng trước nút xác nhận của ngân hàng');
  assert.match(g, /Chuyển khoản lớn: bố mẹ tự bật Chìa khoá thứ hai/);
  assert.match(g, /Hai công tắc trên chưa nối được/, 'câu thừa nhận phải đếm đúng số công tắc còn lại');
});

test('mẫu quy tắc nhà mình ở dạng "nếu… thì làm…", không phải "không được…"', () => {
  const cat = doc('src', 'catalog.ts');
  const i = cat.indexOf('export const QUY_TAC_MAU');
  const khoi = cat.slice(i, cat.indexOf('export const QUY_TAC_KHUNG'));
  const cau = [...khoi.matchAll(/^\s{2}([A-Z_]+): c\(\s*'([^']+)',\s*'([^']+)',?\s*\)/gm)]
    .filter((m) => m[1] !== 'TUY_CHINH');
  assert.ok(cau.length >= 4, `chỉ đọc được ${cau.length} mẫu — đổi dạng catalog thì sửa test này`);
  for (const [, ma, vi, en] of cau) {
    assert.doesNotMatch(vi, /^Nhà mình không/, `${ma}: câu phủ định trần`);
    assert.match(vi, /gọi|gửi/, `${ma}: thiếu việc để LÀM`);
    assert.doesNotMatch(en, /\bnever\b/i, `${ma}: bản Anh còn dạng phủ định`);
  }
});

test('màn con cháu: công tắc chưa nối thì mặc định TẮT, và không nút nào mang chữ "an toàn"', () => {
  const g = boChuThich(doc('src', 'components', 'Guardian.tsx'));
  assert.match(g, /blockUnknown: false,/, 'công tắc chưa nối mà mặc định bật là khai trạng thái giả (§4.3)');
  assert.match(g, /pinNotification: false,/, 'công tắc chưa nối mà mặc định bật là khai trạng thái giả (§4.3)');
  assert.doesNotMatch(g, /tr\("[^"]*an toàn[^"]*"\)/, 'chữ "an toàn" trên nút màn con cháu (§4.1, §11)');
});
