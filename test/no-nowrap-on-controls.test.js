'use strict';
/**
 * §4.4 — CẤM `white-space: nowrap` TRÊN PHẦN TỬ BẤM ĐƯỢC.
 *
 * Đo ở khổ 320px bậc chữ lớn nhất: nhãn "Người thân dùng số mới" cần 277px trong
 * hộp 174px → 19 phần tử bị cắt cụt trên MỘT màn hình.
 *
 * §4.5 — tiếng Việt dài hơn tiếng Anh ~30%. Nút vừa khít chữ tiếng Anh sẽ vỡ khi
 * dịch sang tiếng Việt, và vỡ thêm lần nữa ở bậc chữ A++.
 *
 * ⚠️ §4.4: danh sách nợ CHỈ ĐƯỢC PHÉP NHỎ ĐI. `vung-cham-san.css` khai bản dựng
 * này không có selector nào được miễn — tức DANH SÁCH NỢ = 0. Test dưới chốt con
 * số đó lại.
 */

const test = require('node:test');
const assert = require('node:assert');

const C = require('../test-utils/css');

/**
 * Frontend dang dung song song. Tep chua co thi BO QUA CO THONG BAO — do vi
 * dong nghiep chua viet xong la nhieu, khong phai tin hieu.
 *
 * Nhung bo qua IM LANG thi lai thanh "san khai ma khong co hieu luc". Dung
 * skip co ly do de no van HIEN RA trong ket qua chay test.
 */
const BO_QUA = C.coTep('public/vung-cham-san.css') ? false : 'chua co public/vung-cham-san.css — frontend dang dung';

/**
 * DANH SÁCH NỢ. Bản dựng từ zero nên KHÔNG có selector nào được miễn.
 * ⚠️ Danh sách này CHỈ ĐƯỢC NHỎ ĐI. Thêm vào là phá ràng buộc §4.4.
 */
const DANH_SACH_NO = Object.freeze([]);

/** Dấu hiệu một selector trỏ vào phần tử BẤM ĐƯỢC. */
const LA_PHAN_TU_BAM = /\bbutton\b|\[role\s*=\s*["']?button|\ba\[href|\binput\b|\bselect\b|\btextarea\b|\blabel\b|\bsummary\b|--nut|\.nut|\bnut-/i;

const TEP_CSS = ['public/tokens.css', 'public/vung-cham-san.css', 'public/styles.css']
  .filter((p) => C.coTep(p));

test('§4.4 — có ít nhất một tệp CSS để kiểm', { skip: BO_QUA }, () => {
  assert.ok(TEP_CSS.length > 0, 'không tìm thấy tệp CSS nào');
});

test('§4.4 — danh sách nợ ĐANG LÀ 0 và chỉ được phép nhỏ đi', { skip: BO_QUA }, () => {
  assert.strictEqual(DANH_SACH_NO.length, 0,
    'bản dựng từ zero không có nợ cũ — đừng tạo nợ mới');
});

for (const tep of TEP_CSS) {
  test(`§4.4 — ${tep}: không selector bấm được nào khai nowrap`, { skip: BO_QUA }, () => {
    const viPham = C.selectorCoNowrap(C.doc(tep))
      .filter((s) => LA_PHAN_TU_BAM.test(s))
      .filter((s) => !DANH_SACH_NO.includes(s));
    assert.deepStrictEqual(viPham, [],
      `nowrap trên phần tử bấm được: ${viPham.join(' · ')}`);
  });
}

test('§4.4 — vung-cham-san.css GỠ nowrap khỏi phần tử bấm được', { skip: BO_QUA }, () => {
  // Không đủ nếu chỉ "không khai nowrap": một quy tắc ở tệp trên có thể đã đặt.
  // Sàn nạp SAU CÙNG nên nó phải chủ động ghi đè về normal.
  const css = C.boChuThich(C.doc('public/vung-cham-san.css'));
  assert.match(css, /white-space\s*:\s*(normal|balance|pretty)/i,
    'sàn phải chủ động gỡ nowrap, không chỉ tránh khai nó');
});

test('§4.5 — nút không được khoá chiều rộng cứng theo độ dài chữ', { skip: BO_QUA }, () => {
  // Tiếng Việt dài hơn ~30%; nút khoá width cứng sẽ cắt chữ.
  const css = C.boChuThich(C.doc('public/vung-cham-san.css'));
  const khoaCung = [...css.matchAll(/([^{}]*\{[^{}]*)\bwidth\s*:\s*(\d+)px/g)]
    .filter((m) => LA_PHAN_TU_BAM.test(m[1]));
  assert.deepStrictEqual(khoaCung.map((m) => m[2]), [],
    'có nút khoá width cứng bằng px — dùng min-inline-size thay vì width');
});

test('§4.4 — không dùng text-overflow: ellipsis trên phần tử bấm được', { skip: BO_QUA }, () => {
  // Cắt chữ bằng "…" cũng là cắt chữ. Người cao tuổi không đoán được phần bị giấu.
  for (const tep of TEP_CSS) {
    const sach = C.boChuThich(C.doc(tep));
    const re = /([^{}]+)\{([^{}]*)\}/g;
    let m = re.exec(sach);
    while (m) {
      if (/text-overflow\s*:\s*ellipsis/i.test(m[2]) && LA_PHAN_TU_BAM.test(m[1])) {
        assert.fail(`${tep}: ellipsis trên phần tử bấm được — ${m[1].trim()}`);
      }
      m = re.exec(sach);
    }
  }
});
