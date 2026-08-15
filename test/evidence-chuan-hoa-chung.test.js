'use strict';
/**
 * HAI BÊN CỦA MỘT PHÉP SO PHẢI DÙNG CHUNG MỘT HÀM CHUẨN HOÁ.
 *
 * ══════════ LỖI ĐẮT NHẤT ĐÃ ĐO ĐƯỢC: −5,6 ĐIỂM RECALL ══════════
 *
 * `chuanHoa()` được sửa để gỡ dấu ngăn hàng nghìn — tiền Việt viết `1.200.000đ`
 * và `[^.]{0,N}` trong cue bank bị dấu chấm chặn ngang. Sửa đúng, đo được +3,3
 * recall ở tầng luật.
 *
 * Nhưng `evidence-validator.js` TỰ CHUẨN HOÁ LẤY: `toLowerCase()` + gộp khoảng
 * trắng. Hai hàm lệch nhau ngay lập tức. Model trích nguyên văn
 * `"chú chuẩn bị 450.000đ tiền mặt"`, `doan.normalized` giờ là
 * `"chú chuẩn bị 450000đ tiền mặt"` — không khớp, tín hiệu bị LOẠI.
 *
 * Và trích dẫn chứa số tiền đúng là tín hiệu nặng điểm nhất, nên điểm sụp thẳng:
 *   vi-trungthuong-09   65 → 6
 *   vi-giaohang-03      69 → 18
 *   mix-20              38 → 0
 * 20 mẫu tụt mức. Đo được 9/17 trích dẫn trên các mẫu đó có chứa dấu ngăn.
 *
 * ⚠️ KIỂU LỆCH NÀY IM LẶNG. Không lỗi, không cảnh báo — tín hiệu chỉ biến mất.
 * Và nó trông y hệt "AI trích bịa", tức là đúng thứ hàng rào evidence sinh ra để
 * chặn. Nhìn vào log thì thấy hàng rào đang làm việc chăm chỉ.
 */

const test = require('node:test');
const assert = require('node:assert');

const { buildContext, chuanHoa } = require('../src/analysis/context-builder');
const { locTheoEvidence, doanChuaTrich } = require('../src/analysis/evidence-validator');

const tinHieu = (id, quote) => ({
  id, state: 'present', source: 'llm', confidence: 0.9,
  evidence: [{ quote, start: 0, end: quote.length, sourceId: 'van_ban' }],
});

/** Cách người Việt thật sự viết số tiền trong tin nhắn. */
const CAU = [
  ['Chú chuẩn bị 450.000đ tiền mặt, lát có nhân viên qua thu.', 'chú chuẩn bị 450.000đ tiền mặt'],
  ['Chị complete the final order by sending 950,000đ to account 9999.', 'sending 950,000đ'],
  ['Cô cần nộp trước 12% thuế thu nhập là 40.800.000đ theo quy định.', 'nộp trước 12% thuế thu nhập là 40.800.000đ'],
  ['Bác chuyển 1.200.000đ vào tài khoản này ngay.', 'chuyển 1.200.000đ vào tài khoản này'],
];

test('TRÍCH DẪN CÓ DẤU NGĂN HÀNG NGHÌN vẫn tìm thấy trong văn bản', () => {
  for (const [vanBan, quote] of CAU) {
    const ctx = buildContext(vanBan);
    const giu = locTheoEvidence([tinHieu('FIN_TRANSFER_REQUEST', quote)], ctx);
    assert.strictEqual(giu.length, 1,
      `trích dẫn bị loại oan:\n  văn bản: ${vanBan}\n  trích  : ${quote}`);
  }
});

test('và tìm được ĐÚNG ĐOẠN chứa nó', () => {
  for (const [vanBan, quote] of CAU) {
    const ctx = buildContext(vanBan);
    assert.ok(doanChuaTrich(quote, ctx), `không tìm được đoạn cho: ${quote}`);
  }
});

/**
 * HÀNG RÀO CẤU TRÚC — thứ chặn lỗi này tái diễn, không chỉ chặn ca đã biết.
 *
 * Bất kỳ phép chuẩn hoá nào thêm vào `chuanHoa()` sau này cũng phải tự động áp
 * cho cả trích dẫn. Test dưới đây đỏ nếu ai đó chép logic chuẩn hoá sang
 * evidence-validator lần nữa.
 */
test('evidence-validator KHÔNG tự chuẩn hoá lấy — phải gọi chuanHoa dùng chung', () => {
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/analysis/evidence-validator'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  assert.match(nguon, /chuanHoa/, 'không dùng chuanHoa dùng chung');
  assert.ok(!/\.toLowerCase\(\)/.test(nguon),
    'tự hạ chữ thường — chép lại logic chuẩn hoá là hẹn ngày lệch tiếp');
});

/**
 * Phép kiểm TỔNG QUÁT: mọi chuỗi con của một câu, sau khi đi qua `chuanHoa`,
 * phải nằm trong bản chuẩn hoá của cả câu. Nếu một phép biến đổi mới làm hỏng
 * tính chất này thì nó sẽ làm hỏng cả tầng evidence.
 */
test('chuanHoa giữ tính CHỨA: chuẩn hoá(chuỗi con) ⊂ chuẩn hoá(cả câu)', () => {
  const cau = [
    'Bác chuyển 1.200.000đ vào tài khoản này ngay.',
    'Quý khách nộp 25.000.000 đồng phí giải ngân trước.',
    'Please send 8,000,000đ to fake account 9999 8888 7777 before noon.',
    'Nhiệt độ hôm nay 20.8 độ, bác nhớ mặc ấm.',
  ];
  for (const c of cau) {
    const day = chuanHoa(c);
    const tu = c.split(' ');
    for (let i = 0; i < tu.length; i += 1) {
      for (let j = i + 1; j <= tu.length; j += 1) {
        const con = chuanHoa(tu.slice(i, j).join(' '));
        if (!con) continue;
        assert.ok(day.includes(con),
          `chuẩn hoá không giữ tính chứa:\n  cả câu : ${day}\n  chuỗi con: ${con}`);
      }
    }
  }
});
