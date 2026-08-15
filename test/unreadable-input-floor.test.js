'use strict';
// §4.3 — SÀN ĐẦU VÀO KHÔNG ĐỌC ĐƯỢC.
// Hàng rào cho unreadableInputFloor() trong src/analysis/pipeline.js.

const test = require('node:test');
const assert = require('node:assert');

const { analyze, unreadableInputFloor } = require('../src/analysis/pipeline');

test('§4.3 — ảnh không đọc được sinh mã chuaKiem, không im lặng', () => {
  const san = unreadableInputFloor({ anh: 'data:image/png;base64,xxx', ocrFailed: true });
  assert.ok(san.chuaKiem.includes('khong_doc_duoc_anh'));
  assert.ok(!san.daKiem.includes('anh_ocr'));
});

test('§4.3 — AI chết sinh mã chuaKiem riêng', () => {
  const san = unreadableInputFloor({ vanBan: 'abc', aiError: 'AI_TIMEOUT' });
  assert.ok(san.chuaKiem.includes('ai_khong_phan_hoi'));
});

test('§4.3 — tên miền không phân giải được sinh mã chuaKiem', () => {
  const san = unreadableInputFloor({ vanBan: 'abc', urlUnresolved: ['abc.xyz'] });
  assert.ok(san.chuaKiem.includes('khong_mo_duoc_link'));
});

test('§4.3 — OCR độ tin cậy thấp KHÔNG được âm thầm đoán', () => {
  const san = unreadableInputFloor({ anh: 'data:image/png;base64,xxx', ocrConfidence: 0.2 });
  assert.ok(san.chuaKiem.length > 0);
});

test('§4.3 — không có gì bất thường thì sàn trả danh sách rỗng', () => {
  const san = unreadableInputFloor({ vanBan: 'Bác ơi cháu về rồi.' });
  assert.deepStrictEqual(san.chuaKiem, []);
  assert.deepStrictEqual(san.daKiem, ['van_ban']);
});

test('§4.3 — KHÔNG nguồn nào đọc được ⇒ nhãn KHÔNG được là CHUA_THAY', () => {
  const kq = analyze({ anh: 'data:image/png;base64,xxx', ocrFailed: true });
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY',
    'ảnh không đọc được mà hiện "Chưa thấy dấu hiệu rủi ro" là đúng lỗi §4.3');
  assert.strictEqual(kq.daKiem.length, 0);
  assert.ok(kq.chuaKiem.length > 0);
});

test('§4.3 — sàn KHÔNG BAO GIỜ hạ mức đã có từ nguồn đọc được', () => {
  const vanBan = 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an ngay.';
  const chiText = analyze({ vanBan });
  const themAnhHong = analyze({ vanBan, anh: 'data:image/png;base64,xxx', ocrFailed: true });
  assert.strictEqual(themAnhHong.nhan, chiText.nhan);
  assert.ok(themAnhHong.score >= chiText.score, 'sàn chỉ được LÀM TĂNG cảnh giác');
  assert.ok(themAnhHong.chuaKiem.includes('khong_doc_duoc_anh'));
});

test('§HĐ luật 3 — chuaKiem không rỗng luôn đi kèm nhãn, không bị nuốt', () => {
  const kq = analyze({ vanBan: 'Bác ơi cháu về rồi.', anh: 'x', ocrFailed: true });
  assert.ok(Array.isArray(kq.chuaKiem) && kq.chuaKiem.length > 0);
  for (const ma of kq.chuaKiem) {
    assert.match(ma, /^[a-z][a-z0-9_]+$/, `chuaKiem phải là MÃ, gặp "${ma}"`);
  }
});

test('§4.3 — THÊM NGUỒN MỚI thì phải thêm ca: sàn nhận diện nguồn lạ', () => {
  // Ràng buộc thường trực: video/ghi âm/tệp khác thêm vào thì phải khai ở đây.
  const san = unreadableInputFloor({ ghiAm: 'x', ghiAmFailed: true });
  assert.ok(san.chuaKiem.length > 0,
    'nguồn đầu vào mới không được rơi vào khoảng lặng của sàn');
});
