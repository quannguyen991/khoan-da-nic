'use strict';
/**
 * §2B.4 / §4.4 — ĐO TƯƠNG PHẢN TRÊN STOP TỐI NHẤT CỦA DẢI LOANG.
 *
 * ⚠️ Vì sao cần file này: `test/contrast.test.js` tính trên `--color-paper`
 * PHẲNG. Nó KHÔNG biết nền đã thành gradient. Chữ có thể rơi trúng bất kỳ điểm
 * nào của dải, nên mốc đúng là `--color-onboarding-canvas-bottom` (#ebe2ff) —
 * stop tối nhất — chứ không phải #f9f7ff.
 *
 * Script này KHÔNG thay việc đo tay trên trình duyệt (§10). Nó chỉ bắt lỗi
 * token trước khi mở trình duyệt.
 *
 *   node scripts/do-tuong-phan.cjs
 */

const fs = require('fs');
const path = require('path');

const TOKENS = path.join(__dirname, '..', 'public', 'tokens.css');

/* ── OKLCH → sRGB ──────────────────────────────────────────────────────────
   Bảng hệ số OKLab chuẩn của Björn Ottosson. */
function oklchSangRgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;

  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return lin.map((v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, c));
  });
}

/** Chỉ nhận `oklch(L% C H)` — bỏ qua biến thể có alpha, gradient, var(). */
function doc(giaTri) {
  const m = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)$/.exec(giaTri.trim());
  if (!m) return null;
  return oklchSangRgb(Number(m[1]) / 100, Number(m[2]), Number(m[3]));
}

const doSang = (rgb) => {
  const [r, g, b] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const tuongPhan = (a, b) => {
  const [x, y] = [doSang(a), doSang(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const hex = (rgb) => '#' + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');

/* ── Đọc token ─────────────────────────────────────────────────────────────── */
const css = fs.readFileSync(TOKENS, 'utf8');
const bien = {};
for (const m of css.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim)) bien[m[1]] = m[2].trim();

const mau = {};
for (const [k, v] of Object.entries(bien)) {
  const rgb = doc(v);
  if (rgb) mau[k] = rgb;
}

/* ── Đếm token theo nhóm ───────────────────────────────────────────────────── */
const nhom = {};
for (const k of Object.keys(bien)) {
  const g = /^--(color|space|text|leading|radius|ease|duration|dur|shadow|root|touch|font|reading|content|bottom|gradient)/.exec(k);
  const ten = g ? g[1] : 'khac';
  nhom[ten] = (nhom[ten] || 0) + 1;
}
const tong = Object.keys(bien).length;

console.log('── ĐẾM TOKEN ────────────────────────────────────────────');
for (const [k, v] of Object.entries(nhom).sort((a, b) => b[1] - a[1])) {
  console.log(`  --${k}-*`.padEnd(22) + String(v).padStart(3));
}
console.log('  ' + '─'.repeat(23));
console.log('  TỔNG'.padEnd(22) + String(tong).padStart(3) + '   (§2B.4 nêu 119)');

/* ── Các cặp phải đạt sàn ──────────────────────────────────────────────────── */
const NEN_TOI_NHAT = '--color-onboarding-canvas-bottom';   // #ebe2ff — MỐC SÀN

const CAP = [
  // [chữ, nền, sàn, ghi chú]
  ['--color-ink',   NEN_TOI_NHAT, 4.5, 'chữ chính trên dải'],
  ['--color-ink-2', NEN_TOI_NHAT, 4.5, 'chữ phụ trên dải'],
  ['--color-muted', NEN_TOI_NHAT, 4.5, 'chữ mờ trên dải — SÁT SÀN'],
  ['--color-accent', NEN_TOI_NHAT, 4.5, 'liên kết tím trên dải'],
  ['--color-danger', NEN_TOI_NHAT, 4.5, '"Nguy hiểm cao" trên dải'],
  ['--color-warning', NEN_TOI_NHAT, 4.5, '"Nghi ngờ" trên dải'],
  ['--color-success', NEN_TOI_NHAT, 4.5, '"Chưa thấy dấu hiệu" trên dải'],

  ['--color-rule', NEN_TOI_NHAT, 3.0, 'viền trên dải (WCAG 1.4.11)'],
  ['--color-border-tinted', NEN_TOI_NHAT, 3.0, 'viền nhuộm trên dải'],
  ['--color-border-interactive', NEN_TOI_NHAT, 3.0, 'viền điều khiển trên dải'],
  ['--color-input-border', NEN_TOI_NHAT, 3.0, 'viền ô nhập trên dải'],
  ['--color-card-border-strong', '--color-surface', 3.0, 'viền thẻ trên mặt thẻ'],

  ['--color-ink', '--color-surface', 4.5, 'chữ chính trên thẻ'],
  ['--color-muted', '--color-surface', 4.5, 'chữ mờ trên thẻ'],
  ['--color-muted', '--color-surface-2', 4.5, 'chữ mờ trên thẻ chìm'],
  ['--color-ink', '--color-accent-soft', 4.5, 'chữ trên nền tím nhạt'],
  ['--color-accent', '--color-surface', 4.5, 'liên kết tím trên thẻ'],
  ['--color-placeholder', '--color-input-bg', 4.5, 'chữ gợi ý trong ô nhập'],

  ['--color-on-accent', '--color-accent', 4.5, 'chữ trắng trên nút tím'],
  ['--color-on-accent', '--color-accent-hover', 4.5, 'chữ trắng trên nút tím bấm'],
  ['--color-nav-ink', '--color-nav-bg', 4.5, 'chữ nav trên nền nav'],
  ['--color-nav-ink', '--color-nav-bg-2', 4.5, 'chữ nav trên nền nav sáng'],
  ['--color-nav-pill-ink', '--color-nav-pill', 4.5, 'chữ tab đang chọn'],
  ['--color-on-danger', '--color-danger-vivid', 4.5, 'chữ trắng trên nút đỏ'],
  ['--color-on-danger', '--color-danger-vivid-2', 4.5, 'chữ trắng trên nút đỏ bấm'],
  ['--color-on-danger', '--color-danger', 4.5, 'chữ trắng trên nền đỏ đậm'],
  ['--color-on-success', '--color-success', 4.5, 'chữ trắng trên nền xanh đậm'],

  ['--color-danger-strong', '--color-danger-soft', 4.5, 'chữ đỏ trên nền đỏ nhạt'],
  ['--color-danger-strong', '--color-danger-soft-2', 4.5, 'chữ đỏ trên nền đỏ rất nhạt'],
  ['--color-warning-strong', '--color-warning-soft', 4.5, 'chữ cam trên nền cam nhạt'],
  ['--color-success-strong', '--color-success-soft', 4.5, 'chữ xanh trên nền xanh nhạt'],
  ['--color-unchecked-ink', '--color-unchecked-bg', 4.5, '§4.3 "chưa kiểm được"'],
  ['--color-unchecked-border', '--color-unchecked-bg', 3.0, 'viền khối "chưa kiểm được"'],
  ['--color-disabled-ink', '--color-disabled-bg', 4.5, 'chữ nút tắt'],
  ['--color-ink', '--color-chip-bg', 4.5, 'chữ trên chip'],
  ['--color-focus', NEN_TOI_NHAT, 3.0, 'vòng tiêu điểm trên dải'],
];

console.log('\n── TƯƠNG PHẢN ───────────────────────────────────────────');
let hong = 0, satSan = 0;
for (const [ten, nenTen, san, ghiChu] of CAP) {
  const a = mau[ten], b = mau[nenTen];
  if (!a || !b) { console.log(`  ?  ${ten} / ${nenTen} — không đọc được`); hong++; continue; }
  const ti = tuongPhan(a, b);
  const dat = ti >= san;
  if (!dat) hong++;
  else if (ti < san + 0.35) satSan++;
  const dau = dat ? (ti < san + 0.35 ? '~' : '✓') : '✗';
  console.log(
    `  ${dau} ${ti.toFixed(2).padStart(6)}:1  (sàn ${san})  ${hex(a)} trên ${hex(b)}  — ${ghiChu}`,
  );
}

console.log('\n── KẾT ──────────────────────────────────────────────────');
console.log(`  ${CAP.length - hong}/${CAP.length} cặp đạt sàn · ${satSan} cặp sát sàn (~)`);
if (hong) {
  console.log(`  ✗ ${hong} CẶP TRƯỢT SÀN — sửa token trước khi dựng tiếp.`);
  process.exitCode = 1;
} else {
  console.log('  ✓ Mọi cặp đạt sàn TRÊN STOP TỐI NHẤT.');
  console.log('  ⚠️  Đây KHÔNG thay được việc đo tay trên trình duyệt (§10).');
}
