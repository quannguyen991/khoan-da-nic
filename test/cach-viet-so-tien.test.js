'use strict';
/**
 * HÀNG RÀO — CÁCH VIẾT SỐ TIỀN KHÔNG ĐƯỢC LÀM ĐỔI KẾT LUẬN.
 *
 * Lỗi đã đo được 15/8/2026:
 *   "Bác chuyển 1.200.000đ vào tài khoản này ngay"  → FIN_TRANSFER_REQUEST TRƯỢT
 *   "Bác chuyển 1200000đ vào tài khoản này ngay"    → bắt được
 *
 * Nguyên nhân: gần như MỌI mẫu trong locale pack dùng `[^.]{0,N}` làm cách nói
 * "trong cùng một câu", mà tiền Việt viết `1.200.000đ` — dấu chấm nằm GIỮA cụm.
 * Và cách viết CÓ dấu chấm mới là cách tin nhắn thật viết.
 *
 * Đây cùng một họ lỗi với `\b` không nhận chữ có dấu: một giả định về ký tự
 * đúng với tiếng Anh, sai với tiếng Việt, và im lặng khi sai.
 *
 * Hàng rào này quét TOÀN BỘ cue bank chứ không kiểm vài câu mẫu — thêm mẫu mới
 * dùng `[^.]` vẫn được bảo vệ mà không phải nhớ thêm test.
 */

const test = require('node:test');
const assert = require('node:assert');

const { buildContext, chuanHoa } = require('../backend/src/analysis/context-builder');
const { directPrecheck } = require('../backend/src/analysis/direct-precheck');
const { PACKS } = require('../backend/src/analysis/locale-pack-registry');

/** Ba cách viết cùng một số tiền. Người Việt dùng cả ba. */
const CACH_VIET = [
  ['dấu chấm', '1.200.000đ'],
  ['dấu phẩy', '1,200,000đ'],
  ['liền', '1200000đ'],
];

test('§4.5 — dấu ngăn hàng nghìn bị gỡ khi chuẩn hoá', () => {
  assert.match(chuanHoa('Chuyển 1.200.000đ'), /1200000/);
  assert.match(chuanHoa('Chuyển 1,200,000đ'), /1200000/);
  assert.match(chuanHoa('Nộp 25.000.000 đồng'), /25000000/);
});

test('số thập phân KHÔNG bị đụng tới — 20.8 vẫn là 20.8', () => {
  assert.match(chuanHoa('Nhiệt độ 20.8 độ'), /20\.8/);
  assert.match(chuanHoa('Tỉ giá 25.4 nghìn'), /25\.4/);
  // Và dấu chấm kết câu vẫn còn: nếu mất thì cắt câu hỏng theo.
  assert.match(chuanHoa('Chuyển tiền đi. Ngay.'), /\. /);
});

test('BA CÁCH VIẾT SỐ TIỀN cho RA CÙNG BỘ TÍN HIỆU', () => {
  const khung = [
    'Bác chuyển %s vào tài khoản này ngay',
    'Quý khách nộp %s phí giải ngân trước',
    'Bác gửi %s sang tài khoản an toàn của Bộ Công an ngay',
    'Cô nạp %s vốn ban đầu rồi hệ thống trả lãi mỗi ngày',
    'Bác đặt cọc %s tiền nguyên liệu rồi bên em giao hàng',
  ];

  for (const k of khung) {
    const ra = CACH_VIET.map(([ten, so]) => {
      const t = k.replace('%s', so);
      return { ten, t, ma: directPrecheck(buildContext(t)).map((x) => x.id).sort() };
    });

    const chuan = ra[0];
    assert.ok(chuan.ma.length > 0, `không mẫu nào bắt được: ${chuan.t}`);
    for (const r of ra.slice(1)) {
      assert.deepStrictEqual(
        r.ma, chuan.ma,
        `cách viết "${r.ten}" ra khác "${chuan.ten}"\n  ${chuan.t}\n    → ${chuan.ma.join(', ')}\n  ${r.t}\n    → ${r.ma.join(', ')}`,
      );
    }
  }
});

/**
 * KHÔNG MẪU NÀO ĐƯỢC TỰ VIẾT DẤU NGĂN HÀNG NGHÌN.
 *
 * Chuẩn hoá đã gỡ dấu ngăn khỏi VĂN BẢN, nên một mẫu viết `1\.200` sẽ không bao
 * giờ khớp nữa — im lặng, đúng kiểu lỗi nguy hiểm nhất ở đây. Chặn từ đầu.
 */
test('không mẫu nào trong cue bank chứa dấu ngăn hàng nghìn', () => {
  const hong = [];

  for (const [ten, pack] of Object.entries(PACKS)) {
    for (const [signalId, mauList] of Object.entries(pack.directPatterns || {})) {
      for (const mau of mauList) {
        // Gỡ lượng từ `{0,40}` trước — dấu phẩy trong đó KHÔNG phải dấu ngăn số.
        const than = mau.pattern.replace(/\{\d*,?\d*\}/g, '');
        // Còn lại mà thấy `1.200` hay `\d\.\d\d\d` thì mẫu đó chết sau chuẩn hoá.
        if (/(?:\d|\\d)\\?[.,](?:(?:\d|\\d)\s*){3}/.test(than)) {
          hong.push(`${ten}/${signalId}: ${mau.pattern}`);
        }
      }
    }
  }

  assert.deepStrictEqual(hong, [], `mẫu viết dấu ngăn hàng nghìn:\n${hong.join('\n')}`);
});

test('chuẩn hoá gỡ được dấu ngăn ở MỌI vị trí trong một câu', () => {
  const n = chuanHoa('Chuyển 1.200.000đ rồi nộp thêm 25,000,000 đồng nữa');
  assert.ok(!/\d[.,]\d{3}/.test(n), `còn sót dấu ngăn: ${n}`);
});

test('§4.2 — gỡ dấu ngăn chỉ được THÊM khớp, không được bớt', () => {
  // Bản viết liền là cận dưới: mọi tín hiệu bắt được ở bản liền phải còn nguyên
  // ở bản có dấu chấm. Chiều ngược lại được phép nhiều hơn.
  const cau = [
    'Bác chuyển 1.200.000đ vào tài khoản này ngay',
    'Quý khách nộp 25.000.000 đồng phí giải ngân trước',
    'Bác gửi 5.000.000 đồng sang tài khoản an toàn của Bộ Công an ngay',
  ];

  for (const t of cau) {
    const coCham = new Set(directPrecheck(buildContext(t)).map((x) => x.id));
    const lien = new Set(
      directPrecheck(buildContext(t.replace(/(?<=\d)[.,](?=\d{3})/g, ''))).map((x) => x.id),
    );
    for (const id of lien) {
      assert.ok(coCham.has(id), `${id} mất khi viết số có dấu chấm: ${t}`);
    }
  }
});
