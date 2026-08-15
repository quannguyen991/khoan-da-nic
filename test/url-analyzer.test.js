'use strict';
/**
 * Phụ lục A.7 — nhóm WEB, deterministic, KHÔNG GỌI MẠNG.
 *
 * "So sánh domain bằng registrable domain / eTLD+1, không dùng `contains` hay
 * `endsWith` ngây thơ — `vietcombank.com.vn.attacker.tld` KHÔNG PHẢI domain
 * Vietcombank. Punycode decode để hiển thị nhưng giữ hostname ASCII để so sánh."
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  phanTichUrl, trichUrl, layRegistrableDomain,
} = require('../src/analysis/url-analyzer');

const ids = (t) => phanTichUrl(t).map((s) => s.id);

test('A.7 — trích được URL từ văn bản', () => {
  assert.deepStrictEqual(trichUrl('Bác bấm vào https://vcb-online.tk/login nhé'),
    ['https://vcb-online.tk/login']);
  assert.strictEqual(trichUrl('không có link nào').length, 0);
});

test('A.7 — eTLD+1 nhận đúng hậu tố nhiều thành phần', () => {
  assert.strictEqual(layRegistrableDomain('www.vietcombank.com.vn'), 'vietcombank.com.vn');
  assert.strictEqual(layRegistrableDomain('login.hsbc.co.uk'), 'hsbc.co.uk');
  assert.strictEqual(layRegistrableDomain('a.b.example.com'), 'example.com');
});

test('A.7 — `vietcombank.com.vn.attacker.tld` KHÔNG PHẢI domain Vietcombank', () => {
  const kq = ids('Đăng nhập tại https://vietcombank.com.vn.attacker.tld/login');
  assert.ok(kq.includes('WEB_BRAND_DOMAIN_MISMATCH'),
    'endsWith/contains ngây thơ sẽ cho qua tên miền này');
  assert.strictEqual(layRegistrableDomain('vietcombank.com.vn.attacker.tld'), 'attacker.tld');
});

test('A.7 — tên miền chính thức KHÔNG bị gắn cờ lệch thương hiệu', () => {
  assert.ok(!ids('Xem tại https://www.vietcombank.com.vn/khuyen-mai')
    .includes('WEB_BRAND_DOMAIN_MISMATCH'));
});

test('A.7 — punycode và IP literal', () => {
  assert.ok(ids('https://xn--vietcombnk-m7a.com/login').includes('WEB_PUNYCODE_IP_LITERAL'));
  assert.ok(ids('http://192.168.1.50/login').includes('WEB_PUNYCODE_IP_LITERAL'));
});

test('A.7 — rút gọn liên kết', () => {
  assert.ok(ids('bấm https://bit.ly/3xAbCd').includes('WEB_SHORTENER_REDIRECT'));
});

test('A.7 — nguồn cài app không chính thức', () => {
  assert.ok(ids('tải https://tai-app.xyz/dichvucong.apk').includes('WEB_NONOFFICIAL_APP_SOURCE'));
  assert.ok(!ids('https://play.google.com/store/apps/details?id=x')
    .includes('WEB_NONOFFICIAL_APP_SOURCE'));
});

test('§6.8 / A.7 — TUYỆT ĐỐI không gọi mạng, không tự mở link', () => {
  const nguon = require('node:fs').readFileSync(
    require.resolve('../src/analysis/url-analyzer'), 'utf8');
  for (const cam of ['fetch(', 'http.get', 'https.get', 'dns.', 'axios', 'net.connect']) {
    assert.ok(!nguon.includes(cam), `url-analyzer không được dùng ${cam}`);
  }
});

test('A.7 — hàm thuần: gọi hai lần ra y hệt', () => {
  const t = 'https://vcb-secure.tk/login và https://bit.ly/x';
  assert.deepStrictEqual(phanTichUrl(t), phanTichUrl(t));
});

test('A.7 — URL hỏng không làm sập, chỉ bỏ qua', () => {
  assert.doesNotThrow(() => phanTichUrl('http://['));
  assert.doesNotThrow(() => phanTichUrl(''));
});
