'use strict';
/**
 * VỎ ỨNG DỤNG — mọi tệp trong APP_SHELL phải phục vụ được, ĐÚNG KIỂU.
 *
 * ══════════ VÌ SAO KIỂM CẢ CONTENT-TYPE, KHÔNG CHỈ MÃ 200 ══════════
 *
 * ĐO 16/8/2026: `/tokens.css` và `/vung-cham-san.css` trả HTTP **200** —
 * nhưng kèm `content-type: text/html`. SPA catch-all nuốt chúng và trả
 * `index.html`.
 *
 * Trình duyệt nhận HTML ở chỗ chờ CSS thì âm thầm không áp gì. Không lỗi,
 * không cảnh báo. Và thứ biến mất là SÀN TIẾP CẬN §4.4: vùng chạm 52px, nút
 * chính 56px, cỡ chữ 14px. Người cao tuổi bấm trượt, không ai biết vì sao.
 *
 * Một test chỉ kiểm `status === 200` sẽ XANH suốt qua lỗi này.
 *
 * ══════════ VIẾT LẠI 2/9/2026 — TEST CŨ NHẮM MỘT KIẾN TRÚC ĐÃ CHẾT ══════════
 *
 * Bản trước dựng `backend/server.js` rồi `fetch` các đường tĩnh từ nó. Ba thứ
 * đã đổi và không thứ nào được cập nhật vào test:
 *
 *  · `backend/server.js` KHÔNG còn phục vụ tệp tĩnh. Khối `express.static` và
 *    SPA catch-all bị bỏ lại khi `src/` được chép sang `backend/` — chỉ chú
 *    thích ở lại. Nay `server.ts` lo việc đó: vite khi chạy dev, `dist/` khi
 *    chạy thật.
 *  · Test đọc `public/app/sw.js` — bản dựng của kiến trúc CŨ, đóng băng 16/8.
 *    Service worker sống là `public/sw.js`, có APP_SHELL khác hẳn.
 *  · Nó kiểm `/manifest.webmanifest` và `/logo.png`; tệp thật tên là
 *    `/manifest.json` và `/logo-192.png`.
 *
 * Nên bảy test đỏ, mà sản phẩm không sai — đã kiểm trên app thật: cả bảy đường
 * của APP_SHELL đều trả 200 đúng kiểu.
 *
 * ⚠️ ĐỎ THƯỜNG TRỰC LÀ MỘT DẠNG HỎNG RIÊNG. Bảy dấu ✖ cố định làm người ta
 * quen mắt, và ca đỏ THẬT tiếp theo sẽ lẫn vào đó.
 *
 * Bản này kiểm NGUỒN thay vì dựng máy chủ: mọi bảo đảm cũ được giữ, thêm được
 * phép kiểm thứ tự `express.static` trước catch-all — chính là cái sinh ra lỗi
 * "200 kèm text/html" — mà không cần build trước.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (p) => fs.readFileSync(path.join(GOC, p), 'utf8');
const coTep = (p) => fs.existsSync(path.join(GOC, p));

/** Service worker ĐANG SỐNG. `public/app/sw.js` là bản dựng cũ, đừng đọc. */
const SW = 'public/sw.js';

/**
 * Đường trong APP_SHELL → nơi tệp thật nằm.
 *
 * `/config/ma-hop-dong.json` KHÔNG nằm ở `public/`: plugin `phatHopDong()` của
 * `vite.config.ts` phát nó ra từ `src/config/`. Để hai bản là để chúng phân kỳ,
 * và khi lệch thì `locTraLoiBoHoiNhanh()` bỏ im lặng câu trả lời của người dùng.
 */
const NOI_TEP = {
  '/': 'index.html',
  '/config/ma-hop-dong.json': 'src/config/ma-hop-dong.json',
};
const nguonCua = (duong) => NOI_TEP[duong] || `public${duong}`;

function appShell() {
  const khoi = /const APP_SHELL = \[([\s\S]*?)\];/.exec(doc(SW));
  assert.ok(khoi, `không đọc được APP_SHELL trong ${SW}`);
  return [...khoi[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

// ─────────────── §4.4 — sàn tiếp cận không phụ thuộc mạng ───────────────

test('§4.4 — vung-cham-san.css nằm trong APP_SHELL của service worker', () => {
  assert.ok(appShell().includes('/vung-cham-san.css'),
    '§4.4 gọi tên vung-cham-san.css đích danh — nó PHẢI nằm trong APP_SHELL');
});

test('§4.4 — mọi tệp trong APP_SHELL đều CÓ THẬT trong nguồn', () => {
  // Một tệp thiếu là `cache.addAll()` ném lỗi và HỎNG CẢ LƯỢT CÀI service
  // worker — mất sạch khả năng chạy offline, chứ không phải mất một tệp.
  const thieu = appShell()
    .filter((d) => !coTep(nguonCua(d)))
    .map((d) => `${d} → không thấy ${nguonCua(d)}`);
  assert.deepStrictEqual(thieu, [],
    `APP_SHELL trỏ vào tệp không tồn tại:\n  ${thieu.join('\n  ')}\n`
    + '⚠️ cache.addAll() hỏng MỘT tệp là hỏng CẢ lượt cài — app mất offline hoàn toàn.');
});

test('§4.4 — tệp sàn tiếp cận là CSS thật, không phải trang HTML', () => {
  for (const ten of ['tokens.css', 'vung-cham-san.css']) {
    const than = doc(`public/${ten}`);
    assert.ok(!/^\s*<!doctype html/i.test(than), `public/${ten} là một trang HTML`);
    assert.ok(/\{[\s\S]*\}/.test(than), `public/${ten} không có luật CSS nào`);
  }
});

// ─────────── Thứ tự phục vụ — chính chỗ sinh ra "200 kèm text/html" ───────────

test('§4.4 — express.static đứng TRƯỚC SPA catch-all trong server.ts', () => {
  const s = doc('server.ts').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const viTriStatic = s.search(/express\.static\s*\(/);
  const viTriCatchAll = s.search(/app\.get\(\s*['"`]\*/);

  assert.ok(viTriStatic >= 0, 'server.ts không còn phục vụ tệp tĩnh');
  assert.ok(viTriCatchAll >= 0, 'server.ts không còn SPA catch-all');
  assert.ok(viTriStatic < viTriCatchAll,
    'SPA catch-all đứng TRƯỚC express.static.\n'
    + '⚠️ Đây đúng là lỗi đo được 16/8/2026: mọi đường tĩnh trả HTTP 200 kèm\n'
    + '  content-type text/html, trình duyệt im lặng bỏ qua, và sàn 52/56/14px\n'
    + '  biến mất mà không có lỗi ở bất kỳ đâu.');
});

// ─────────────── §4.3 — service worker không đệm kết quả ───────────────

test('§4.3 — service worker bỏ qua mọi đường /api, không đệm kết quả', () => {
  // Một kết quả cũ hiện lại cho một tin nhắn mới là lời trấn an bịa.
  const sw = doc(SW);
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)\s*\)\s*return;/,
    'không thấy nhánh bỏ qua /api — kết quả phân tích có thể bị đệm');
  assert.ok(!/caches\.(open|match)[^\n]*api/i.test(sw), 'có vẻ đang đệm đường api');
});

test('§11 — service worker không mã cứng câu hứa hẹn nào', () => {
  // Chữ do máy chủ gửi xuống; service worker không tự soạn câu nào.
  const sw = doc(SW).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const cam of ['an toàn', 'đã chặn', 'đã đọc và hiểu', 'safe', 'blocked']) {
    assert.ok(!sw.toLowerCase().includes(cam.toLowerCase()), `sw.js chứa "${cam}"`);
  }
});

// ─────────────── §4.1 — manifest ───────────────

test('§4.1 — manifest giữ tên "Khoan Đã", và có lối tắt', () => {
  // Tên thương hiệu giữ nguyên tiếng Việt ở MỌI locale (§4.1).
  const m = JSON.parse(doc('public/manifest.json'));
  assert.strictEqual(m.name.startsWith('Khoan Đã'), true, `name = ${m.name}`);
  assert.strictEqual(m.short_name, 'Khoan Đã');
  assert.ok(Array.isArray(m.shortcuts) && m.shortcuts.length > 0, 'không có lối tắt nào');
  assert.strictEqual(m.display, 'standalone', 'không cài được như app');
});

test('§4.1 — index.html trỏ đúng vào manifest đang dùng', () => {
  // Trỏ nhầm `/manifest.webmanifest` thì SPA catch-all trả index.html, trình
  // duyệt không cài được app, và không lỗi nào hiện ra.
  const html = doc('index.html');
  const m = /<link[^>]+rel="manifest"[^>]+href="([^"]+)"/.exec(html);
  assert.ok(m, 'index.html không khai manifest');
  assert.ok(coTep(nguonCua(m[1])), `manifest trỏ tới ${m[1]} nhưng không có tệp`);
});

test('§4.1 — mọi icon manifest khai báo đều có thật', () => {
  const m = JSON.parse(doc('public/manifest.json'));
  const thieu = (m.icons || []).map((i) => i.src).filter((src) => !coTep(nguonCua(src)));
  assert.deepStrictEqual(thieu, [], `manifest khai icon không tồn tại: ${thieu.join(', ')}`);
});
