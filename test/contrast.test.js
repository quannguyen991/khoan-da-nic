'use strict';
/**
 * §4.4 — TƯƠNG PHẢN CHỮ 4.5:1.
 *
 * Đo trên NỀN TỐI NHẤT mà chữ có thể nằm lên, không phải nền sáng nhất. Nền
 * onboarding là dải chuyển sắc; đo ở đầu sáng rồi tuyên bố đạt là tự lừa mình.
 * `--color-onboarding-canvas-bottom` được chính tokens.css đánh dấu "MỐC SÀN".
 *
 * Phép tính OKLCH → sRGB tuyến tính → độ chói WCAG ở `test-utils/css.js` đã được
 * đối chiếu với tỉ lệ ghi trong chú thích tokens.css: 14,70 vs 14,66 · 4,66 vs
 * 4,67 · 4,92 vs 4,92. Khớp, nên cả phép tính lẫn chú thích đều tin được.
 */

const test = require('node:test');
const assert = require('node:assert');

const C = require('../test-utils/css');

const css = C.coTep('public/tokens.css') ? C.doc('public/tokens.css') : null;
const g = (t) => C.layToken(css, t);

const SAN_CHU = 4.5;

/** Nền TỐI NHẤT mà chữ thường có thể nằm lên. */
const NEN_TOI_NHAT = '--color-onboarding-canvas-bottom';

/** Chữ thường — phải đạt 4.5:1. */
const CHU_TREN_NEN = ['--color-ink', '--color-muted', '--color-accent'];

/** Chữ trên nền đặc — đo với chính nền đặc đó. */
const CHU_TREN_NEN_DAC = [
  ['--color-on-accent', '--color-accent'],
  ['--color-on-danger', '--color-danger'],
  ['--color-on-success', '--color-success'],
];

test('§4.4 — có tokens.css để đo', () => {
  assert.ok(css, 'thiếu public/tokens.css');
});

for (const t of CHU_TREN_NEN) {
  test(`§4.4 — ${t} đạt 4.5:1 trên NỀN TỐI NHẤT`, () => {
    const r = C.doTuongPhan(g(t), g(NEN_TOI_NHAT));
    assert.ok(r !== null, `không đọc được màu ${t}`);
    assert.ok(r >= SAN_CHU, `${t} = ${r.toFixed(2)}:1 trên nền tối nhất, sàn ${SAN_CHU}:1`);
  });
}

for (const [chu, nen] of CHU_TREN_NEN_DAC) {
  test(`§4.4 — ${chu} đạt 4.5:1 trên ${nen}`, () => {
    const r = C.doTuongPhan(g(chu), g(nen));
    assert.ok(r >= SAN_CHU, `${chu} trên ${nen} = ${r.toFixed(2)}:1, sàn ${SAN_CHU}:1`);
  });
}

test('§4.1 — ba màu nhãn rủi ro đều đạt sàn chữ trên nền giấy', () => {
  for (const t of ['--color-danger', '--color-warning', '--color-success']) {
    const r = C.doTuongPhan(g(t), g('--color-paper'));
    assert.ok(r >= SAN_CHU, `${t} = ${r.toFixed(2)}:1, sàn ${SAN_CHU}:1`);
  }
});

test('§4.4 — nền "soft" là NỀN, cấm đặt chữ lên: chúng KHÔNG đạt sàn chữ', () => {
  // Ca này khẳng định một sự thật để không ai vô tình dùng chúng làm màu chữ.
  const r = C.doTuongPhan(g('--color-accent-soft'), g('--color-paper'));
  assert.ok(r < SAN_CHU,
    'nếu --color-accent-soft đạt 4.5:1 thì phân loại NỀN/CHỮ trong tokens.css đã sai');
});

test('§4.4 — --color-muted SÁT SÀN, có ca chặn việc làm nhạt thêm', () => {
  const r = C.doTuongPhan(g('--color-muted'), g(NEN_TOI_NHAT));
  assert.ok(r >= SAN_CHU, `đã tụt xuống ${r.toFixed(2)}:1`);
  assert.ok(r < 5.0, 'nếu đã nới rộng thì cập nhật chú thích "SÁT SÀN" trong tokens.css');
});

test('Phép tính khớp tỉ lệ ghi trong chú thích tokens.css', () => {
  // Chú thích và phép tính kiểm chéo lẫn nhau. Lệch quá 0,1 là một trong hai sai.
  const kiem = [['--color-ink', 14.66], ['--color-muted', 4.67], ['--color-accent', 4.92]];
  for (const [t, ghiTrongChuThich] of kiem) {
    const r = C.doTuongPhan(g(t), g(NEN_TOI_NHAT));
    assert.ok(Math.abs(r - ghiTrongChuThich) < 0.1,
      `${t}: tính ${r.toFixed(2)} nhưng chú thích ghi ${ghiTrongChuThich}`);
  }
});
