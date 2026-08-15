'use strict';
/**
 * §4.4 — TƯƠNG PHẢN VIỀN 3:1 (WCAG 1.4.11 Non-text Contrast).
 *
 * Viền nhạt quá thì người cao tuổi không thấy ranh giới ô nhập và nút bấm —
 * họ không biết chỗ nào bấm được. Đây là lỗi tiếp cận thật, không phải chuyện
 * thẩm mỹ.
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

const css = C.coTep('public/tokens.css') ? C.doc('public/tokens.css') : null;
const g = (t) => C.layToken(css, t);

const SAN_VIEN = 3.0;
const NEN_TOI_NHAT = '--color-onboarding-canvas-bottom';

const VIEN = ['--color-rule', '--color-border-tinted', '--color-border-interactive'];

test('§4.4 — có tokens.css để đo', { skip: BO_QUA }, () => {
  assert.ok(css, 'thiếu public/tokens.css');
});

for (const t of VIEN) {
  test(`WCAG 1.4.11 — ${t} đạt 3:1 trên nền giấy`, { skip: BO_QUA }, () => {
    const r = C.doTuongPhan(g(t), g('--color-paper'));
    assert.ok(r !== null, `không đọc được ${t}`);
    assert.ok(r >= SAN_VIEN, `${t} = ${r.toFixed(2)}:1, sàn ${SAN_VIEN}:1`);
  });

  test(`WCAG 1.4.11 — ${t} đạt 3:1 cả trên NỀN TỐI NHẤT`, { skip: BO_QUA }, () => {
    const r = C.doTuongPhan(g(t), g(NEN_TOI_NHAT));
    assert.ok(r >= SAN_VIEN,
      `${t} = ${r.toFixed(2)}:1 trên nền tối nhất — đo ở nền sáng rồi tuyên bố đạt là tự lừa mình`);
  });
}

test('§4.4 — viền của phần tử TƯƠNG TÁC phải rõ hơn viền phân cách thường', { skip: BO_QUA }, () => {
  const tuongTac = C.doTuongPhan(g('--color-border-interactive'), g('--color-paper'));
  const phanCach = C.doTuongPhan(g('--color-rule'), g('--color-paper'));
  assert.ok(tuongTac >= phanCach,
    'viền nút/ô nhập không được nhạt hơn viền kẻ trang trí');
});

test('§4.4 — mọi token viền đều đo được, không token nào bị bỏ sót', { skip: BO_QUA }, () => {
  const tenVien = [...C.boChuThich(css).matchAll(/(--color-(?:rule|border)[a-z-]*)\s*:/g)]
    .map((m) => m[1]);
  for (const t of tenVien) {
    assert.ok(VIEN.includes(t), `token viền ${t} chưa có trong danh sách kiểm — thêm vào`);
  }
});
