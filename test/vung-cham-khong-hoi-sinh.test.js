'use strict';
/**
 * ⚠️ SÀN Ô NHẬP KHÔNG ĐƯỢC HỒI SINH PHẦN TỬ ĐÃ GIẤU — ĐO TRÊN MÁY THẬT 16/8/2026.
 *
 * `vung-cham-san.css` nạp sau cùng, nên `display: block` của nó thắng cả class
 * `hidden` của Tailwind. Ô chọn tệp giấu sau nút đính ảnh bị hồi sinh: trên máy
 * hiện nguyên dòng "Chọn tệp / Không có tệp nào được chọn" chiếm hết ô nhập
 * trang chủ và đẩy các nút trong hàng lệch đi.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

test('sàn ô nhập chừa phần tử [hidden]', () => {
  const css = fs.readFileSync('public/vung-cham-san.css', 'utf8');
  const m = css.match(/input:not\(\[type="hidden"\]\)[^,{]*/);
  assert.ok(m, 'không tìm thấy luật sàn ô nhập');
  assert.match(m[0], /:not\(\[hidden\]\)/,
    'luật sàn ô nhập thiếu :not([hidden]) — sẽ hồi sinh input đã giấu');
  assert.match(css, /select:not\(\[hidden\]\)/, 'select chưa chừa [hidden]');
  assert.match(css, /textarea:not\(\[hidden\]\)/, 'textarea chưa chừa [hidden]');
});
