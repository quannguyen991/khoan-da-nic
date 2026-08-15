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

/**
 * §HĐ luật 3 — `chuaKiem` là RÀNG BUỘC AN TOÀN, không phải trang trí.
 *
 * ⚠️ ĐỔI 16/8/2026 — ĐỌC KỸ TRƯỚC KHI SỬA LẠI.
 *
 * Bản cũ chỉ đòi `chua_nghe_duoc_cuoc_goi` có mặt, và nó CÓ MẶT Ở MỌI LƯỢT vì
 * pipeline ép cứng. Điều đó làm test này xanh mà không kiểm gì thật: `chuaKiem`
 * không bao giờ rỗng, nên nó không thể phát hiện việc một thứ chưa-kiểm-được
 * KHÁC bị bỏ sót. Và đúng là có một thứ bị bỏ sót suốt: `ai_khong_chay` chỉ
 * được thêm ở trust receipt, chưa bao giờ có trong phong bì §HĐ.
 *
 * Nay câu cuộc gọi chỉ nói khi có cuộc gọi dính vào (xem `co-dinh-cuoc-goi.js`),
 * nên test phải canh thứ THẬT SỰ quan trọng: **mỗi thứ chưa kiểm được đều phải
 * được khai, và khai đúng cái của nó.**
 */
test('§HĐ luật 3 — mỗi thứ chưa kiểm được đều phải được khai đúng tên', () => {
  // AI chưa đọc là một thứ CHƯA KIỂM ĐƯỢC. Không được im.
  const chiBoLuat = analyze({ vanBan: 'Bác ơi cháu về rồi.' });
  assert.strictEqual(chiBoLuat.aiDaChay, false);
  assert.ok(chiBoLuat.chuaKiem.includes('ai_khong_chay'),
    `AI không chạy mà không khai: ${JSON.stringify(chiBoLuat.chuaKiem)}`);

  // Có cuộc gọi dính vào ⇒ phải nói là chưa nghe được nó.
  const coGoi = analyze({ vanBan: 'Có người gọi điện bảo bác chuyển tiền' });
  assert.ok(coGoi.chuaKiem.includes('chua_nghe_duoc_cuoc_goi'),
    `có cuộc gọi mà không khai: ${JSON.stringify(coGoi.chuaKiem)}`);

  // Link không phân giải được ⇒ phải nói, không được lặng lẽ ra CHUA_THAY.
  const linkHong = analyze({ vanBan: 'Bấm vào đây', urlUnresolved: ['http://a.bc'] });
  assert.ok(linkHong.chuaKiem.includes('khong_mo_duoc_link'),
    `link hỏng mà không khai: ${JSON.stringify(linkHong.chuaKiem)}`);

  /*
   * `chuaKiem` ĐƯỢC PHÉP RỖNG — nhưng chỉ khi thật sự không còn gì chưa kiểm:
   * AI đã đọc, không có cuộc gọi, không có link hỏng. §HĐ luật 3 nói "không
   * rỗng ⇒ phải hiện cùng cỡ chữ", chứ không nói "không bao giờ được rỗng".
   */
  const daKiemHet = analyze({ vanBan: 'Bác ơi cháu về rồi.', llmSignals: [] });
  assert.strictEqual(daKiemHet.aiDaChay, true);
  assert.deepStrictEqual(daKiemHet.chuaKiem, [],
    `còn sót thứ chưa kiểm: ${JSON.stringify(daKiemHet.chuaKiem)}`);
});

test('§11 — trust receipt nói rõ AI có chạy hay không, không mập mờ', () => {
  const bien = buildTrustReceipt(analyze({ vanBan: 'Bác ơi cháu về rồi.' }));
  assert.strictEqual(bien.aiDaChay, false);
  assert.ok(bien.chuaKiem.includes('ai_khong_chay'));
});
