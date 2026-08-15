'use strict';
// §4.3 — "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ".
// §11 — những câu không được viết.
// Đây là dạng lỗi đặc trưng của sản phẩm: đã xuất hiện ở BA chỗ độc lập trong một ngày.

const test = require('node:test');
const assert = require('node:assert');

const { analyze, toHopDong } = require('../src/analysis/pipeline');
const { RISK_LABELS } = require('../src/risk-labels');
const { buildTrustReceipt } = require('../src/analysis/trust-receipt-v2');

test('§4.3 — CHUA_THAY chỉ được trả khi CÓ nguồn đã kiểm được', () => {
  const sach = analyze({ vanBan: 'Chiều nay cháu ghé chơi bác nhé.' });
  assert.strictEqual(sach.nhan, 'CHUA_THAY');
  assert.ok(sach.daKiem.length > 0, 'CHUA_THAY mà daKiem rỗng là lời nói dối');

  const khongDoc = analyze({ anh: 'x', ocrFailed: true });
  assert.notStrictEqual(khongDoc.nhan, 'CHUA_THAY');
});

test('§11 — không chuỗi nào trong đầu ra chứa "an toàn" / "safe"', () => {
  const kq = analyze({ vanBan: 'Chiều nay cháu ghé chơi bác nhé.' });
  const s = JSON.stringify(toHopDong(kq)).toLowerCase();
  assert.ok(!/"[^"]*an toàn[^"]*"/.test(s));
  assert.ok(!/\bsafe\b/.test(s.replace(/fin_safe_account/g, '')));
});

test('§11 — KHÔNG khẳng định một dấu hiệu cụ thể là VẮNG MẶT', () => {
  // "Chưa thấy lời đe doạ hay xin mã OTP" đã từng phủ nhận đúng dấu hiệu
  // đang nằm trong tin nhắn.
  const bien = buildTrustReceipt(analyze({ vanBan: 'Bác đọc mã OTP cho tôi ngay.' }));
  const chu = JSON.stringify(bien);
  assert.ok(!/khong_thay_|absent|vang_mat/.test(chu),
    'phiếu tin cậy không được liệt kê dấu hiệu VẮNG MẶT');
  for (const s of bien.daKiem) {
    assert.match(s, /^[a-z][a-z0-9_]+$/);
  }
});

test('§4.2 — lược đồ tín hiệu KHÔNG có trạng thái "absent"', () => {
  const kq = analyze({ vanBan: 'Bác đọc mã OTP cho tôi ngay.' });
  for (const s of kq.signals) {
    assert.ok(['present', 'unknown'].includes(s.state), `state lạ: ${s.state}`);
  }
});

test('§4.3 — nhãn thấp luôn kèm câu "trong thông tin bác cung cấp", không hứa an toàn', () => {
  assert.strictEqual(RISK_LABELS.NO_SIGNS_FOUND.vi, 'Chưa thấy dấu hiệu rủi ro');
  assert.ok(!/an toàn/i.test(RISK_LABELS.NO_SIGNS_FOUND.vi));
  assert.ok(!/\bsafe\b/i.test(RISK_LABELS.NO_SIGNS_FOUND.en));
});

test('§HĐ luật 3 — chuaKiem không rỗng là RÀNG BUỘC AN TOÀN, luôn có mặt', () => {
  // Mọi lượt phân tích chỉ có văn bản đều chưa nghe được cuộc gọi.
  const kq = analyze({ vanBan: 'Bác ơi cháu về rồi.' });
  assert.ok(kq.chuaKiem.includes('chua_nghe_duoc_cuoc_goi'));
});

test('§11 — trust receipt nói rõ AI có chạy hay không, không mập mờ', () => {
  const bien = buildTrustReceipt(analyze({ vanBan: 'Bác ơi cháu về rồi.' }));
  assert.strictEqual(bien.aiDaChay, false);
  assert.ok(bien.chuaKiem.includes('ai_khong_chay'));
});
