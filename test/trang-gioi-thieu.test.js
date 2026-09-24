'use strict';
/**
 * /gioi-thieu — trang giới thiệu cho con cháu (24/9/2026).
 *
 * Trang này là nơi dự án tự mô tả mình trước người lạ, nên nó phải qua cùng các
 * hàng rào như app: §11 (không hứa, không "an toàn"), §4.1 (hai ngôn ngữ, cùng
 * khoá), §4.4 (sàn chữ, vùng chạm, cấm nowrap), và không tự quảng bá link .apk trần.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { dungTrangGioiThieu, CHU, VAN_TAY_CHUNG_CHI } = require('../backend/src/trang-gioi-thieu');
const { canDangNhap } = require('../backend/src/auth');

const APK_GIA = { kichThuocByte: 8356959, bamTep: 'ab'.repeat(32), phienBan: '1.3' };
const vi = dungTrangGioiThieu('vi', { apk: APK_GIA });
const en = dungTrangGioiThieu('en', { apk: APK_GIA });
const chuDoc = (html) => html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<style>[\s\S]*?<\/style>/, '')
  .replace(/<[^>]+>/g, ' ');

test('hai ngôn ngữ có đúng cùng một bộ khoá', () => {
  assert.deepStrictEqual(Object.keys(CHU.vi).sort(), Object.keys(CHU.en).sort());
  for (const k of Object.keys(CHU.vi)) {
    if (Array.isArray(CHU.vi[k])) assert.strictEqual(CHU.vi[k].length, CHU.en[k].length, `độ dài lệch ở ${k}`);
  }
});

test('lang đúng, và ?lang=en đổi ngôn ngữ thật', () => {
  assert.match(vi, /<html lang="vi">/);
  assert.match(en, /<html lang="en">/);
  assert.match(en, /Pause\. Verify\. Protect\./, 'khẩu hiệu tiếng Anh bắt buộc (§4.1)');
});

test('ba nhãn rủi ro đúng nguyên văn §4.1 ở cả hai ngôn ngữ', () => {
  for (const n of ['Nguy hiểm cao', 'Nghi ngờ', 'Chưa thấy dấu hiệu rủi ro']) assert.ok(vi.includes(n), n);
  for (const n of ['High risk', 'Suspicious', 'No clear risk signals found']) assert.ok(en.includes(n), n);
});

test('§11 — không "an toàn"/"safe", không hứa, không tuyên bố quá', () => {
  for (const [ten, html] of [['vi', vi], ['en', en]]) {
    const chu = chuDoc(html);
    assert.doesNotMatch(chu, /an toàn/i, `${ten}: có chữ "an toàn"`);
    assert.doesNotMatch(chu, /\bsafe\b/i, `${ten}: có chữ "safe"`);
    assert.doesNotMatch(chu, /100\s?%/, `${ten}: "100%"`);
    assert.doesNotMatch(chu, /WCAG compliant/i);
    assert.doesNotMatch(chu, /đã gửi cho người thân/i);
    assert.doesNotMatch(chu, /(sẽ|chắc chắn) lấy lại được tiền|will get (your|their) money back/i);
  }
});

test('không bịa tính năng chưa có: quét QR, kiểm ảnh, "Đi cùng bác", số "đã xác minh"', () => {
  for (const html of [vi, en]) {
    const chu = chuDoc(html);
    assert.doesNotMatch(chu, /quét mã QR|scan (a|the)? ?QR/i);
    assert.doesNotMatch(chu, /ảnh chụp màn hình|screenshot/i, 'máy chủ chưa có AI đọc ảnh');
    assert.doesNotMatch(chu, /Đi cùng bác|Stay With Me/i);
    assert.doesNotMatch(chu, /đã xác minh|verified (hotline|number)/i);
  }
});

test('lối vào: web, mục cài đặt, số đo công khai, chính sách quyền riêng tư', () => {
  assert.match(vi, /href="\/"/);
  assert.match(vi, /href="#android"/);
  assert.match(vi, /href="\/transparency"/);
  assert.match(en, /href="\/transparency\?lang=en"/);
  assert.match(vi, /href="\/chinh-sach-rieng-tu\.html"/);
});

test('nút ở phần mở đầu dẫn xuống mục cài (có cảnh báo), không trỏ thẳng vào tệp .apk', () => {
  const moDau = vi.slice(vi.indexOf('class="mo-dau"'), vi.indexOf('class="van-de"'));
  assert.doesNotMatch(moDau, /\.apk/);
  const cai = vi.slice(vi.indexOf('id="android"'));
  assert.ok(cai.indexOf('Khoan Đã không bao giờ gửi link') < cai.indexOf('href="/khoan-da.apk"'),
    'cảnh báo phải đứng trước nút tải');
  assert.match(cai, /tắt lại quyền đó/);
});

test('mục cài hiện mã kiểm tệp và vân tay chứng chỉ', () => {
  const vanTay = VAN_TAY_CHUNG_CHI.toUpperCase().match(/.{2}/g).join(':');
  assert.ok(vi.includes(vanTay), 'thiếu vân tay chứng chỉ dạng 6A:5E:…');
  assert.ok(vi.includes(APK_GIA.bamTep), 'thiếu mã băm tệp');
  assert.match(vi, /8,0 MB/);
  assert.match(en, /8\.0 MB/);
});

test('không có tệp APK ⇒ không có nút tải, chỉ đường sang bản web', () => {
  const khong = dungTrangGioiThieu('vi', { apk: null });
  assert.doesNotMatch(khong, /href="\/khoan-da\.apk"/);
  assert.match(khong, /Tệp cài đặt đang được cập nhật/);
});

test('§4.4 — sàn chữ 14px ở gốc 17px, vùng chạm, cấm nowrap', () => {
  const css = vi.match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const m of css.matchAll(/font-size:\s*([\d.]+)rem/g)) {
    assert.ok(parseFloat(m[1]) * 17 >= 14, `font-size ${m[1]}rem < 14px ở gốc 17px`);
  }
  for (const m of css.matchAll(/font-size:\s*([\d.]+)px/g)) {
    assert.ok(parseFloat(m[1]) >= 14, `font-size ${m[1]}px`);
  }
  assert.doesNotMatch(css, /white-space:\s*nowrap/);
  assert.match(css, /--cham:52px/);
  assert.match(css, /--cham-chinh:max\(56px,3\.5rem\)/);
  for (const m of css.matchAll(/line-height:\s*([\d.]+)(?![\w%])/g)) {
    assert.ok(parseFloat(m[1]) >= 1.1, `line-height ${m[1]}`);
  }
});

test('phông chữ nạp từ chính web, không gọi Google Fonts', () => {
  assert.doesNotMatch(vi, /fonts\.googleapis|fonts\.gstatic/);
  for (const m of vi.matchAll(/url\((\/phong-chu\/[^)]+)\)/g)) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', m[1])), `thiếu tệp ${m[1]}`);
  }
});

test('trang giới thiệu không đòi đăng nhập, và máy chủ có route', () => {
  assert.strictEqual(canDangNhap('/gioi-thieu'), false);
  const sv = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  assert.match(sv, /app\.get\(\['\/gioi-thieu', '\/gioi-thieu\/'\]/);
});
