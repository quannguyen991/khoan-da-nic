'use strict';
/**
 * VA CHẠM DẤU TIẾNG VIỆT — "bỏ dấu" là để ĐỌC chữ không dấu, không phải để
 * XOÁ nghĩa.
 *
 * ⚠️ VÌ SAO ĐÂY LÀ LỖI CỦA RIÊNG SẢN PHẨM NÀY. Tiếng Việt có sáu thanh điệu và
 * bốn dấu tạo chữ. Bỏ hết đi thì nhiều từ khác hẳn nhau rụng vào cùng một
 * chuỗi — và bộ luật, vốn khớp theo chuỗi, không còn cách nào phân biệt:
 *
 *     gặp / gấp     khăn / khẩn     ngày / ngay
 *     tại / tải     chuyện / chuyển bác / bạc
 *
 * Đo 19/9/2026 trên bản đang chạy: ba câu LÀNH, viết đủ dấu, đều nổ MAN_URGENCY
 * ("Thúc phải làm ngay"). Bác đọc được dòng lý do đó trên màn kết quả. Một lời
 * buộc tội sai về nội dung tin nhắn của chính con cháu mình.
 *
 * Nhưng KHÔNG được bỏ phần bỏ dấu: SMS lừa đảo ở Việt Nam viết không dấu là
 * chuyện thường, và đo được câu "Bac chuyen het tien sang tai khoan an toan cua
 * Bo Cong an ngay" chỉ 7 điểm nếu không bỏ dấu, bản có dấu 61 điểm.
 *
 * Nên luật là: bản bỏ dấu CHỈ dùng để đọc chữ KHÔNG CÓ DẤU. Bộ ca dưới đây canh
 * cả hai chiều — bỏ báo động giả, và KHÔNG được bỏ sót chữ không dấu.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const { buildContext, boDau, boThanh, chuanDauThanh } = require('../backend/src/analysis/context-builder');
const { directPrecheck } = require('../backend/src/analysis/direct-precheck');

/** Trả về tập SIGNAL_ID mà tầng luật bật cho một câu. */
function tinHieu(vanBan) {
  const ctx = buildContext(vanBan, { sourceId: 'van_ban' });
  return new Set(directPrecheck(ctx, {}).map((t) => t.signalId || t.id));
}

// ── ① Câu lành, viết đủ dấu: không được nổ tín hiệu nào ────────────────────

const CAU_LANH = [
  ['Hẹn gặp bác ngày mai ở nhà con nhé.', 'gặp≠gấp · ngày≠ngay'],
  ['Mai con qua gặp bác, bác cứ nghỉ ngơi.', 'gặp≠gấp'],
  ['Bác nhớ mang theo khăn và mũ khi đi chơi nhé.', 'khăn≠khẩn'],
  ['Cuộc họp tại nhà văn hoá ngày 20 tháng 9.', 'tại≠tải · ngày≠ngay'],
  ['Bác gặp bác sĩ ngày nào thì báo con biết.', 'gặp≠gấp · ngày≠ngay'],
  ['Bà con tới dự ngày giỗ, nhớ mang theo khăn tang.', 'ngày≠ngay · khăn≠khẩn'],
  ['Con kể bác nghe chuyện hôm qua ở chợ.', 'chuyện≠chuyển'],
  ['Em mua hộ bác mớ rau ngoài chợ nhé.', 'bác≠bạc'],
];

for (const [cau, vi] of CAU_LANH) {
  test(`câu lành không nổ tín hiệu vì va chạm dấu — ${vi}`, () => {
    const th = [...tinHieu(cau)];
    assert.deepStrictEqual(th, [],
      `"${cau}" bật ${th.join(', ')}. Bỏ dấu làm hai từ khác nghĩa trùng chuỗi; `
      + 'dòng lý do hiện ra trên màn kết quả là một lời khai SAI về nội dung tin nhắn.');
  });
}

// ── ② Chữ không dấu THẬT: vẫn phải bắt ─────────────────────────────────────

test('SMS lừa đảo viết KHÔNG DẤU vẫn bị bắt đủ tín hiệu', () => {
  const th = tinHieu('Bac chuyen het tien sang tai khoan an toan cua Bo Cong an ngay');
  assert.ok(th.has('FIN_TRANSFER_REQUEST'), 'trượt yêu cầu chuyển tiền viết không dấu');
  assert.ok(th.has('MAN_URGENCY'), 'trượt chữ "ngay" viết không dấu — đây là "ngay" thật, không phải "ngày"');
});

test('tin TRỘN nửa có dấu nửa không: đoạn không dấu vẫn tính', () => {
  const th = tinHieu('Bác chuyển tiền gap giup con, con dang can.');
  assert.ok(th.has('MAN_URGENCY'),
    '"gap" ở đây viết KHÔNG DẤU nên nó là "gấp" thật. Xét cả câu thay vì xét từng đoạn khớp '
    + 'là cách bỏ sót đúng những tin trộn — mà tin trộn là ca thật.');
});

// ── ③ Hai lối đặt dấu thanh: cùng một từ ───────────────────────────────────

test('hai lối đặt dấu thanh cùng ra một kết quả', () => {
  for (const [a, b] of [['toà án', 'tòa án'], ['phong toả', 'phong tỏa'], ['hoá đơn', 'hóa đơn']]) {
    assert.strictEqual(chuanDauThanh(a), chuanDauThanh(b), `"${a}" và "${b}" phải về cùng một dạng`);
    assert.strictEqual(chuanDauThanh(a).length, a.length, 'chuẩn hoá phải giữ nguyên số ký tự');
  }
  // "qu" đứng ngoài: "quỳ" không được thành "qùy".
  assert.strictEqual(chuanDauThanh('quỳ gối'), 'quỳ gối');
});

test('giả danh toà án bị bắt dù mẫu và tin viết khác lối đặt dấu', () => {
  const th = tinHieu('Tổng đài Tòa án nhân dân tối cao xin thông báo, bạn có lệnh triệu tập hầu tòa.');
  assert.ok(th.has('ID_AUTHORITY_IMPERSONATION'),
    'mẫu viết "toà án", tin viết "tòa án" — trước 19/9/2026 việc nối hai lối này do nhánh bỏ dấu '
    + 'gánh hộ, và nó gánh kèm cả gặp/gấp.');
});

// ── ④ Thiếu dấu thì tha, ĐỔI dấu thì không ─────────────────────────────────

test('người viết THIẾU dấu thì vẫn bắt, viết dấu KHÁC thì không', () => {
  const thieu = tinHieu('Kho bao don bi giu roi chu a, phi xu ly 120k chu ck vao 9999 8888 7777.');
  assert.ok(thieu.has('FIN_RECOVERY_FEE'),
    '"phi xu ly" là "phí xử lý" viết thiếu dấu — phải bắt');

  const khac = tinHieu('Bác chuyển tiền vào ví em gửi địa chỉ, em mua hộ bác luôn.');
  assert.ok(!khac.has('FIN_PRECIOUS_METAL_PURCHASE'),
    '"mua hộ bác" KHÔNG phải "mua bạc" — dấu khác nhau là từ khác nhau');
});

test('boThanh bỏ thanh điệu nhưng GIỮ dấu tạo chữ', () => {
  assert.strictEqual(boThanh('gặp'), 'găp');
  assert.strictEqual(boThanh('gấp'), 'gâp');
  assert.notStrictEqual(boThanh('gặp'), boThanh('gấp'),
    'gặp và gấp phân biệt nhau ở dấu TẠO CHỮ (ă/â); bỏ luôn dấu đó là bỏ mất chỗ phân biệt');
  assert.strictEqual(boDau('gặp'), boDau('gấp'), 'còn boDau thì bỏ hết — đó là lý do nó cần luật hẹp');
  assert.strictEqual(boThanh('đọc').length, 'đọc'.length, 'giữ nguyên số ký tự');
});

// ── ⑤ Mức cuối cùng: câu lành không bị đẩy lên ─────────────────────────────

test('câu lành vẫn ra "chưa thấy dấu hiệu" và KHÔNG kèm lý do nào', () => {
  const kq = analyze({ vanBan: 'Hẹn gặp bác ngày mai, con mang khăn tới cho bác.' });
  assert.strictEqual(kq.nhan, 'CHUA_THAY');
  assert.deepStrictEqual(kq.maLyDo, [],
    'không nhãn nào bị đổi, nhưng dòng lý do vẫn hiện ra trên màn — và nó nói sai về tin nhắn của con cháu');
});
