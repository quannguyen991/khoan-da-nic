'use strict';
/**
 * §4.4 — SÀN TIẾP CẬN: vùng chạm 52px · nút chính 56px · cỡ chữ 14px.
 *
 * ⚠️ Đây là kiểm TĨNH trên token. Nó bắt được sàn khai SAI, KHÔNG bắt được sàn
 * khai đúng mà không có hiệu lực — ví dụ `min-height` trên hộp `inline`, đúng
 * lỗi §FE0.3 mà chính `vung-cham-san.css` ghi lại. §10 đòi đo trên trình duyệt
 * thật ở 3 bậc chữ × 5 khổ màn hình; tệp này KHÔNG thay thế được việc đó.
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
const BO_QUA = C.coTep('public/tokens.css') ? false : 'chua co public/tokens.css — frontend dang dung';

const TOKENS = 'public/tokens.css';
const SAN = 'public/vung-cham-san.css';

/** Bậc gốc NHỎ NHẤT của thang chữ — sàn phải đúng ở đây, không chỉ ở 17px. */
const GOC_NHO_NHAT = 15;

test('§4.4 — hai tệp sàn tồn tại', { skip: BO_QUA }, () => {
  assert.ok(C.coTep(TOKENS), 'thiếu public/tokens.css');
  assert.ok(C.coTep(SAN), 'thiếu public/vung-cham-san.css');
});

test('§4.4 — vùng chạm ≥ 52px', { skip: BO_QUA }, () => {
  const v = C.pxToiThieu(C.layToken(C.doc(TOKENS), '--touch-target'), GOC_NHO_NHAT);
  assert.ok(v !== null, 'không tìm thấy --touch-target');
  assert.ok(v >= 52, `--touch-target = ${v}px, sàn 52px`);
});

test('§4.4 — nút chính ≥ 56px Ở MỌI BẬC GỐC, không chỉ ở bậc lớn', { skip: BO_QUA }, () => {
  const tho = C.layToken(C.doc(TOKENS), '--touch-target-primary');
  // "--touch-target-primary là max(56px, 3.5rem), KHÔNG phải 3.5rem trần — ở bậc
  //  chữ nhỏ nhất (15px) rem trần chỉ ra 52,5px, tức VI PHẠM."
  assert.match(tho, /max\(/, 'phải là max(56px, …), rem trần sẽ tụt dưới sàn ở gốc 15px');
  for (const goc of [15, 16, 17, 18, 20]) {
    const v = C.pxToiThieu(tho, goc);
    assert.ok(v >= 56, `ở gốc ${goc}px ra ${v}px, sàn 56px`);
  }
});

test('§4.4 — chỉ dùng rem trần thì SẼ vi phạm — chứng minh vì sao cần max()', { skip: BO_QUA }, () => {
  // Ca này giữ lại để lần sau ai đó định "dọn cho gọn" thì thấy hậu quả.
  assert.strictEqual(C.pxToiThieu('3.5rem', 15), 52.5);
  assert.ok(C.pxToiThieu('3.5rem', 15) < 56);
});

test('§4.4 — cỡ chữ nhỏ nhất ≥ 14px ở MỌI bậc gốc', { skip: BO_QUA }, () => {
  const tho = C.layToken(C.doc(TOKENS), '--text-xs');
  for (const goc of [15, 16, 17]) {
    const v = C.pxToiThieu(tho, goc);
    assert.ok(v >= 14, `--text-xs ở gốc ${goc}px ra ${v}px, sàn 14px`);
  }
});

test('§4.5 — line-height không được dưới 1.25: dấu tiếng Việt xếp CẢ TRÊN LẪN DƯỚI', { skip: BO_QUA }, () => {
  // ế ộ ữ ị ặ — line-height dưới 1.25 là cắt dấu.
  const css = C.doc(TOKENS);
  const cacToken = [...C.boChuThich(css).matchAll(/--leading-[a-z]+\s*:\s*([\d.]+)/g)]
    .map((m) => parseFloat(m[1]));
  assert.ok(cacToken.length >= 3, 'không tìm thấy token --leading-*');
  for (const v of cacToken) {
    assert.ok(v >= 1.25, `có --leading-* = ${v}, dưới 1.25 là cắt dấu`);
  }
});

test('§4.4 — sàn khai theo VAI TRÒ, không theo tên lớp riêng lẻ', { skip: BO_QUA }, () => {
  const css = C.boChuThich(C.doc(SAN));
  // Khai theo vai trò (button, [role=button], a[href]…) thì màn mới không lọt.
  assert.match(css, /\[role\s*=\s*["']?button/i, 'thiếu khai theo role=button');
  assert.match(css, /\bbutton\b/, 'thiếu khai cho thẻ button');
});

test('§FE0.3 — sàn dùng min-block-size + display grid, KHÔNG dùng min-height trần', { skip: BO_QUA }, () => {
  // "min-height KHÔNG CÓ TÁC DỤNG trên hộp inline. Dự án đã khai đúng 70px mà
  //  phần tử vẫn cao 49px, vì thẻ <a> rơi về display: inline."
  const css = C.boChuThich(C.doc(SAN));
  assert.match(css, /min-block-size/, 'phải dùng min-block-size');
  assert.match(css, /display\s*:\s*(grid|inline-grid|flex)/,
    'sàn phải đi kèm display grid/flex, nếu không nó vô hiệu trên hộp inline');
});

test('§4.4 — vung-cham-san.css nạp SAU CÙNG và nằm trong APP_SHELL', { skip: BO_QUA }, () => {
  // Sàn tiếp cận không được phụ thuộc vào việc có mạng.
  if (C.coTep('public/sw.js')) {
    assert.match(C.doc('public/sw.js'), /vung-cham-san\.css/,
      'vung-cham-san.css phải nằm trong APP_SHELL của service worker');
  }
  if (C.coTep('public/index.html')) {
    const html = C.doc('public/index.html');
    const viTriSan = html.lastIndexOf('vung-cham-san.css');
    const cssKhac = [...html.matchAll(/href="([^"]*\.css)"/g)]
      .filter((m) => !m[1].includes('vung-cham-san'));
    assert.ok(viTriSan >= 0, 'index.html chưa nạp vung-cham-san.css');
    for (const m of cssKhac) {
      assert.ok(html.indexOf(m[0]) < viTriSan, `${m[1]} phải nạp TRƯỚC vung-cham-san.css`);
    }
  }
});
