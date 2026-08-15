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
 * ⚠️ §4.4 gọi tên `vung-cham-san.css` đích danh và đòi nó nằm trong APP_SHELL
 * của service worker — "sàn tiếp cận không được phụ thuộc vào việc có mạng".
 * Đệm một trang HTML dưới tên tệp CSS là đệm luôn cả cái hỏng.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../server');

const GOC_DA = path.join(__dirname, '..');
const DUONG_APP = path.join(GOC_DA, 'public', 'app');
const coBanDung = fs.existsSync(path.join(DUONG_APP, 'index.html'));

let server;
let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server?.close());

/** Đường → kiểu nội dung BẮT BUỘC. Chuỗi con, để không phụ thuộc charset. */
const VO = [
  ['/tokens.css', 'text/css'],
  ['/vung-cham-san.css', 'text/css'],
  ['/manifest.webmanifest', 'json'],
  ['/sw.js', 'javascript'],
  ['/logo.png', 'image/png'],
];

for (const [duong, kieu] of VO) {
  test(`${duong} phục vụ được, và ĐÚNG KIỂU ${kieu}`, {
    skip: !coBanDung && 'chưa dựng giao diện (npm run dung-giao-dien)',
  }, async () => {
    const r = await fetch(goc + duong);
    assert.strictEqual(r.status, 200, `${duong} trả ${r.status}`);

    const ct = r.headers.get('content-type') || '';
    assert.ok(ct.includes(kieu),
      `${duong} trả content-type "${ct}", chờ "${kieu}".\n`
      + '⚠️ Nhiều khả năng SPA catch-all đang nuốt đường này và trả index.html — '
      + 'HTTP 200 nhưng nội dung sai, và trình duyệt im lặng bỏ qua.');

    // Và nội dung phải KHÔNG phải một trang HTML.
    const than = await r.text();
    assert.ok(!/^\s*<!doctype html/i.test(than),
      `${duong} trả về một trang HTML thay vì tệp thật`);
  });
}

/**
 * §4.4 — SÀN TIẾP CẬN KHÔNG ĐƯỢC PHỤ THUỘC VÀO MẠNG.
 * Mọi tệp trong APP_SHELL của service worker phải phục vụ được; thiếu một tệp
 * là mất sàn khi mất mạng, đúng ca người dùng cần nó nhất.
 */
test('mọi tệp trong APP_SHELL của service worker đều phục vụ được', {
  skip: !coBanDung && 'chưa dựng giao diện',
}, async () => {
  const sw = fs.readFileSync(path.join(DUONG_APP, 'sw.js'), 'utf8');
  const khoi = /const APP_SHELL = \[([\s\S]*?)\];/.exec(sw);
  assert.ok(khoi, 'không đọc được APP_SHELL trong sw.js');

  const duong = [...khoi[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.ok(duong.includes('/vung-cham-san.css'),
    '§4.4 gọi tên vung-cham-san.css đích danh — nó PHẢI nằm trong APP_SHELL');

  const hong = [];
  for (const d of duong) {
    const r = await fetch(goc + d);          // eslint-disable-line no-await-in-loop
    if (r.status !== 200) hong.push(`${d} → ${r.status}`);
  }
  assert.deepStrictEqual(hong, [], `tệp trong APP_SHELL không phục vụ được:\n  ${hong.join('\n  ')}`);
});

/**
 * ⚠️ §4.3 — SERVICE WORKER KHÔNG ĐƯỢC ĐỆM KẾT QUẢ PHÂN TÍCH.
 * Một kết quả cũ hiện lại cho một tin nhắn mới là lời trấn an bịa.
 */
test('§4.3 — service worker bỏ qua mọi đường /api, không đệm kết quả', {
  skip: !coBanDung && 'chưa dựng giao diện',
}, () => {
  const sw = fs.readFileSync(path.join(DUONG_APP, 'sw.js'), 'utf8');
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)\s*\)\s*return;/,
    'không thấy nhánh bỏ qua /api — kết quả phân tích có thể bị đệm');
  assert.ok(!/caches\.(open|match)[^\n]*api/i.test(sw), 'có vẻ đang đệm đường api');
});

/** §11 — service worker KHÔNG tự soạn câu; chữ do máy chủ gửi xuống. */
test('§11 — service worker không mã cứng câu hứa hẹn nào', {
  skip: !coBanDung && 'chưa dựng giao diện',
}, () => {
  const sw = fs.readFileSync(path.join(DUONG_APP, 'sw.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  for (const cam of ['an toàn', 'đã chặn', 'đã đọc và hiểu', 'safe', 'blocked']) {
    assert.ok(!sw.toLowerCase().includes(cam.toLowerCase()), `sw.js chứa "${cam}"`);
  }
});

/** Manifest: tên thương hiệu giữ nguyên tiếng Việt ở mọi locale (§4.1). */
test('§4.1 — manifest giữ tên "Khoan Đã", và có lối tắt', {
  skip: !coBanDung && 'chưa dựng giao diện',
}, async () => {
  const m = await (await fetch(`${goc}/manifest.webmanifest`)).json();
  assert.strictEqual(m.name, 'Khoan Đã');
  assert.strictEqual(m.short_name, 'Khoan Đã');
  assert.ok(Array.isArray(m.shortcuts) && m.shortcuts.length > 0, 'không có lối tắt nào');
  assert.strictEqual(m.display, 'standalone', 'không cài được như app');
});
