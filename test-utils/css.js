'use strict';
/**
 * Tiện ích đọc CSS cho các hàng rào §4.4.
 * §5.3 — để ở `test-utils/`, KHÔNG đặt trong `test/`.
 *
 * ⚠️ Đây là phân tích TĨNH. Nó bắt được sàn khai SAI, nhưng KHÔNG bắt được sàn
 * khai đúng mà không có hiệu lực (ví dụ `min-height` trên hộp `inline`). §10 đòi
 * đo trên trình duyệt thật ở 3 bậc chữ × 5 khổ màn hình — tệp này KHÔNG thay thế
 * được việc đó, và đừng để ai tưởng là thay thế được.
 */

const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (p) => fs.readFileSync(path.join(GOC, p), 'utf8');
const coTep = (p) => fs.existsSync(path.join(GOC, p));

/** Bỏ chú thích để không khớp nhầm vào ví dụ trong comment. */
const boChuThich = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Lấy giá trị custom property, ví dụ layToken(css, '--touch-target'). */
function layToken(css, ten) {
  const m = boChuThich(css).match(new RegExp(`${ten}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

/** Số px nhỏ nhất mà một biểu thức có thể nhận. `max(56px, 3.5rem)` → 56. */
function pxToiThieu(bieuThuc, goc = 15) {
  if (!bieuThuc) return null;
  const px = [...bieuThuc.matchAll(/(-?[\d.]+)px/g)].map((m) => parseFloat(m[1]));
  const rem = [...bieuThuc.matchAll(/(-?[\d.]+)rem/g)].map((m) => parseFloat(m[1]) * goc);
  const tatCa = [...px, ...rem];
  if (tatCa.length === 0) return null;
  // `max(a, b)` lấy giá trị lớn nhất; mọi dạng khác lấy nhỏ nhất cho an toàn.
  return /^\s*max\(/.test(bieuThuc) ? Math.max(...tatCa) : Math.min(...tatCa);
}

// ─────────────── OKLCH → sRGB → độ tương phản WCAG ───────────────

function docOklch(s) {
  const m = String(s).match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/i);
  if (!m) return null;
  return { L: parseFloat(m[1]) / 100, C: parseFloat(m[2]), H: parseFloat(m[3]) };
}

/** @returns {[number,number,number]} sRGB TUYẾN TÍNH, đã kẹp về [0,1]. */
function oklchSangLinearRgb({ L, C, H }) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3; const m = m_ ** 3; const s = s_ ** 3;

  const kep = (x) => Math.max(0, Math.min(1, x));
  return [
    kep(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    kep(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    kep(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

/** Độ chói tương đối WCAG — tính trên sRGB TUYẾN TÍNH. */
const doChoi = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function doTuongPhan(mauA, mauB) {
  const a = docOklch(mauA); const b = docOklch(mauB);
  if (!a || !b) return null;
  const la = doChoi(oklchSangLinearRgb(a));
  const lb = doChoi(oklchSangLinearRgb(b));
  const [cao, thap] = la >= lb ? [la, lb] : [lb, la];
  return (cao + 0.05) / (thap + 0.05);
}

/** Mọi selector khai `white-space: nowrap`, kèm số dòng. */
function selectorCoNowrap(css) {
  const sach = boChuThich(css);
  const ra = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m = re.exec(sach);
  while (m) {
    if (/white-space\s*:\s*nowrap/i.test(m[2])) ra.push(m[1].trim().replace(/\s+/g, ' '));
    m = re.exec(sach);
  }
  return ra;
}

module.exports = {
  doc, coTep, boChuThich, layToken, pxToiThieu,
  docOklch, oklchSangLinearRgb, doTuongPhan, selectorCoNowrap,
};
