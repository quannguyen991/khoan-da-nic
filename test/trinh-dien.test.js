'use strict';
/**
 * MÀN TRÌNH DIỄN CHO GIÁM KHẢO — `/?trinhDien=1` (23/9/2026). Test đọc nguồn.
 *
 * Canh bốn lời hứa:
 *  1. Luôn nói nó là MÔ PHỎNG (§11), và dùng ĐÚNG component của bản thật.
 *  2. Không quay số thật, không gọi máy chủ, không đọc/ghi dữ liệu của máy.
 *  3. Không lộ dữ liệu thật của máy người trình bày (số người thân, mật khẩu gia
 *     đình, lời nhắn giọng) — lỗi đo được lúc dựng: nút gọi hiện số thật đã lưu.
 *  4. Mọi chữ qua catalog, có cả tiếng Việt và tiếng Anh (thuyết trình bằng tiếng Anh).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const doc = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');
const TD = boChuThich(doc('src/components/TrinhDien.tsx'));
const APP = doc('src/App.tsx');
const MAIN = doc('src/main.tsx');

test('main.tsx: màn trình diễn được quyết TRƯỚC khung điện thoại, bản thường chạy y như cũ', () => {
  const iTrinhDien = MAIN.indexOf("vaiTrinhDien === '1'");
  const iKhung = MAIN.indexOf('!dungKhungDienThoai()');
  assert.ok(iTrinhDien > 0 && iKhung > iTrinhDien, 'phải rẽ nhánh trình diễn trước khi bọc khung');
  assert.match(MAIN, /vaiTrinhDien === 'bac' \|\| vaiTrinhDien === 'con'/);
  assert.match(MAIN, /<App \/>/);
});

test('§11 — dải MÔ PHỎNG luôn hiện ở bảng điều khiển, và cả trên màn cảnh báo mô phỏng', () => {
  const i = TD.indexOf('data-mo-phong="luon-hien"');
  assert.ok(i > 0, 'thiếu dải MÔ PHỎNG');
  const truoc = TD.slice(TD.indexOf('export function ManTrinhDien'), i);
  assert.ok(!/&&\s*\(?\s*<div[^>]*$/.test(truoc.slice(-200)), 'dải không được nằm sau điều kiện');
  assert.match(TD, /t\('MÔ PHỎNG — hai màn hình là màn thật của app; cuộc gọi, tin nhắn và đường truyền giữa hai máy là giả lập\.'\)/);
  assert.match(APP, /laMoPhong \? t\('MÔ PHỎNG — màn thật của app, cuộc gọi là giả lập\.'\)/);
  // Cuộc gọi giả lập cũng tự nói nó là giả lập.
  assert.match(TD.slice(TD.indexOf('function ManGoi')), /t\('MÔ PHỎNG'\)/);
});

test('dùng ĐÚNG component của bản thật — không vẽ lại bản "trông giống"', () => {
  for (const c of ['<WarningView', '<HoiNhanhView', '<TheCanhBaoCon', '<TraLoiHoiCon']) assert.ok(TD.includes(c), c);
  assert.match(doc('src/components/Guardian.tsx'), /<TheCanhBaoCon/, 'Guardian và màn trình diễn phải dùng CÙNG thẻ');
});

test('không quay số thật, không gọi máy chủ, không đụng kho của máy', () => {
  assert.ok(!/fetch\(|tel:|sms:|window\.open|goiDienThoai|localStorage|indexedDB|navigator\.serviceWorker/.test(TD),
    'màn trình diễn không được gọi mạng, quay số hay đọc/ghi kho');
  // Chỉ nhập KIỂU từ tai-khoan — không một hàm gọi máy chủ nào.
  assert.match(TD, /import type \{ KetQuaHoiCon, TraLoiHoi \} from '\.\.\/tai-khoan';/);
  assert.ok(!/from '\.\.\/tai-khoan'/.test(TD.replace("import type { KetQuaHoiCon, TraLoiHoi } from '../tai-khoan';", '')));
  // Số hiện ra là số HƯ CẤU.
  assert.match(TD, /const SO_MINH = '09xx xxx \d{3}';/);
  assert.match(TD, /const SO_BAC = '09xx xxx \d{3}';/);
  // Màn cảnh báo ở chế độ mô phỏng: thoát TRƯỚC khi quay số.
  const i = APP.indexOf('const handleCallRelative = () => {');
  const khoi = APP.slice(i, i + 700);
  const iThoat = khoi.indexOf('if (laMoPhong) return;');
  const iGoi = khoi.indexOf('goiDienThoai(firstContact.phone)');
  assert.ok(iThoat > 0 && iGoi > iThoat, 'mô phỏng phải thoát trước goiDienThoai');
  // Mô phỏng TÍNH LÀ diễn tập ⇒ mọi chặn cũ (không số liệu, không báo máy chủ) tự áp dụng.
  assert.match(APP, /const laDienTap = result\?\.dienTap === true \|\| laMoPhong;/);
});

test('không lộ dữ liệu của máy người trình bày: số người thân, mật khẩu gia đình, lời nhắn giọng', () => {
  assert.match(APP, /const \[vongTronNha\] = useState\(\(\) => \(laMoPhong \? vongTronRong\(\) : docVongTron\(\)\)\);/);
  assert.match(APP, /const \[matKhauNha\] = useState\(\(\) => \(laMoPhong \? null : docMatKhauGiaDinh\(\)\)\);/);
  assert.match(APP, /const coLoiNhan = !laMoPhong && Boolean\(loiNhan\.url\);/);
});

test('kênh nối hai máy: chỉ BroadcastChannel, tên kênh qua địa chỉ được lọc, tin chỉ mang mã', () => {
  const K = boChuThich(doc('src/lib/kenh-trinh-dien.ts'));
  assert.match(K, /new BroadcastChannel\(/);
  assert.ok(!/fetch\(|WebSocket|XMLHttpRequest/.test(K));
  assert.match(K, /\/\^\[a-z0-9\]\{6,24\}\$\//, 'tên kênh chỉ chữ thường và số');
  assert.match(TD, /tenKenhHopLe\(thamSo\.get\('kenh'\)\)/);
});

test('§4.1 — mọi chữ của màn trình diễn có ở CẢ HAI catalog', () => {
  const i18n = doc('src/i18n.ts');
  const co = (k) => i18n.split(JSON.stringify(k) + ':').length - 1 >= 2;
  const thieu = [];
  const chu = [
    ...[...TD.matchAll(/(?<![\w.])t\('([^']+)'\)/g)].map((m) => m[1]),
    ...[...TD.matchAll(/t\([a-zA-Z =!'_]+\? '([^']+)' : '([^']+)'\)/g)].flatMap((m) => [m[1], m[2]]),
    ...[...TD.matchAll(/cau="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const bang of ['NHAN_KICH_BAN', 'MO_TA_KICH_BAN', 'XUNG_LA']) {
    const khoi = TD.slice(TD.indexOf(`const ${bang}`), TD.indexOf('};', TD.indexOf(`const ${bang}`)));
    chu.push(...[...khoi.matchAll(/: '([^']+)',/g)].map((m) => m[1]));
  }
  for (const c of new Set(chu)) if (!co(c)) thieu.push(c);
  assert.deepStrictEqual(thieu, []);
  assert.ok(chu.length > 30, 'bộ lọc chữ phải bắt được đủ — nếu tụt thì regex đã hỏng');
});
