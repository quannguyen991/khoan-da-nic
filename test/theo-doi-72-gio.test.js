'use strict';
/**
 * BẢO VỆ 72 GIỜ — mốc theo dõi và lịch nhắc.
 *
 * Ba cách tính năng này hỏng im lặng:
 *  1. Mở lại màn phục hồi mà ĐẶT LẠI đồng hồ ⇒ đợt theo dõi kéo dài vô hạn, lời
 *     nhắc không bao giờ tới đúng mốc.
 *  2. Quá 72 giờ mà thẻ vẫn nằm trên trang chủ ⇒ bác quen mắt, bỏ qua luôn lần sau.
 *  3. Dữ liệu hỏng mà ném ⇒ trang chủ trắng — mất cả app.
 * Và phía Android: lịch hẹn phải khớp đúng mốc, và chữ nhắc phải từ catalog.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'theo-doi-72-gio.cjs');
  fs.mkdirSync(path.dirname(ra), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'lib', 'theo-doi-72-gio.ts')],
    bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent',
  });
  return require(ra);
}

function datKho(banDau = {}) {
  const kho = { ...banDau };
  const k = {
    getItem: (x) => (x in kho ? kho[x] : null),
    setItem: (x, v) => { kho[x] = String(v); },
    removeItem: (x) => { delete kho[x]; },
  };
  try { globalThis.localStorage = k; } catch { /* rơi xuống defineProperty */ }
  if (globalThis.localStorage !== k) {
    Object.defineProperty(globalThis, 'localStorage', { value: k, configurable: true, writable: true });
  }
  return kho;
}

const T = goi();
const GIO = 3_600_000;
const T0 = 1_760_000_000_000;

test('bắt đầu rồi đọc: còn 72 giờ, đã qua 0 giờ', () => {
  datKho();
  assert.strictEqual(T.batDauTheoDoi(T0), T0);
  assert.deepStrictEqual(T.docTheoDoi(T0), { batDau: T0, daQuaGio: 0, conLaiGio: 72 });
});

test('⚠️ mở lại màn phục hồi khi đang theo dõi KHÔNG đặt lại đồng hồ', () => {
  datKho();
  T.batDauTheoDoi(T0);
  assert.strictEqual(T.batDauTheoDoi(T0 + 30 * GIO), T0);
  assert.strictEqual(T.docTheoDoi(T0 + 30 * GIO).conLaiGio, 42);
});

test('⚠️ quá 72 giờ thì hết theo dõi, thẻ biến mất; sự cố mới sau đó bắt đầu đợt mới', () => {
  const kho = datKho();
  T.batDauTheoDoi(T0);
  assert.strictEqual(T.docTheoDoi(T0 + 72 * GIO), null);
  assert.ok(!('khoan_da_theo_doi_72h' in kho), 'hết hạn thì dọn khoá');
  assert.strictEqual(T.batDauTheoDoi(T0 + 80 * GIO), T0 + 80 * GIO);
});

test('giờ còn lại không bao giờ hiện 0 khi vẫn đang theo dõi', () => {
  datKho();
  T.batDauTheoDoi(T0);
  assert.strictEqual(T.docTheoDoi(T0 + 72 * GIO - 1000).conLaiGio, 1);
});

test('kết thúc tay thì hết theo dõi', () => {
  datKho();
  T.batDauTheoDoi(T0);
  T.ketThucTheoDoi();
  assert.strictEqual(T.docTheoDoi(T0 + GIO), null);
});

test('dữ liệu hỏng hoặc đồng hồ máy lùi về trước mốc thì trả null, KHÔNG ném', () => {
  datKho({ khoan_da_theo_doi_72h: '{hỏng' });
  assert.strictEqual(T.docTheoDoi(T0), null);
  datKho({ khoan_da_theo_doi_72h: JSON.stringify({ batDau: T0 }) });
  assert.strictEqual(T.docTheoDoi(T0 - GIO), null);
});

test('mốc nhắc còn lại: bỏ mốc đã qua, giữ đúng 2 · 24 · 48 · 72 giờ', () => {
  assert.deepStrictEqual(T.cacMocConLai(T0, T0), [T0 + 2 * GIO, T0 + 24 * GIO, T0 + 48 * GIO, T0 + 72 * GIO]);
  assert.deepStrictEqual(T.cacMocConLai(T0, T0 + 25 * GIO), [T0 + 48 * GIO, T0 + 72 * GIO]);
});

test('Android hẹn ĐÚNG các mốc giờ như tầng web, và không tự nghĩ ra chữ nhắc', () => {
  const java = fs.readFileSync(path.join(GOC, 'android', 'app', 'src', 'main', 'java', 'vn', 'khoanda', 'app', 'NhacTheoDoi72Gio.java'), 'utf8');
  const m = /MOC_GIO\s*=\s*\{([^}]*)\}/.exec(java);
  assert.ok(m, 'không thấy MOC_GIO trong Java');
  assert.deepStrictEqual(m[1].split(',').map((x) => Number(x.trim())), [...T.MOC_NHAC_GIO]);
  // Chữ nhắc phải do tầng web nạp xuống qua catalog — Java không được chứa câu tiếng Việt.
  const boChuThich = java.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/"[^"]*[À-ỹ][^"]*"/.test(boChuThich), 'Java chứa chuỗi tiếng Việt tự viết');
});

test('catalog có đủ chữ nhắc cho MỌI mốc, ở CẢ HAI ngôn ngữ, và không hứa lấy lại tiền', () => {
  const cat = fs.readFileSync(path.join(GOC, 'src', 'catalog.ts'), 'utf8');
  const khoi = cat.slice(cat.indexOf('export const THEO_DOI_72_GIO'));
  for (const g of T.MOC_NHAC_GIO) assert.match(khoi, new RegExp(`TB_MOC_${g}:\\s*c\\(`), `thiếu chữ cho mốc ${g} giờ`);
  const doan = khoi.slice(0, khoi.indexOf('};'));
  assert.ok(!/lấy lại được|chắc chắn lấy lại|get your money back|guarantee/i.test(doan), 'câu nhắc hứa lấy lại tiền');
});
