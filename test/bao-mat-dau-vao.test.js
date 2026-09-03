'use strict';
/**
 * §6.8 — DANH SÁCH KIỂM BẢO MẬT: SSRF · lược đồ URL nguy hiểm · giả mạo MIME ·
 * chữ ký tệp · giới hạn kích thước.
 *
 * §6.8: "KHÔNG BAO GIỜ tự mở link trích từ nội dung đáng ngờ."
 * Nguyên tắc của cả hai module dưới đây: MẶC ĐỊNH LÀ TỪ CHỐI.
 */

const test = require('node:test');
const assert = require('node:assert');

const L = require('../backend/src/link-shield');
const M = require('../backend/src/media-validation');

// ═══════════════════ SSRF ═══════════════════

test('§6.8 — chỉ cho http và https', () => {
  for (const u of [
    'javascript:alert(1)', 'data:text/html,<script>', 'file:///etc/passwd',
    'ftp://a.com/x', 'intent://scan/#Intent;scheme=x;end',
  ]) {
    const kq = L.kiemUrl(u);
    assert.strictEqual(kq.choPhep, false, `lọt: ${u}`);
  }
  assert.strictEqual(L.kiemUrl('https://vietcombank.com.vn/').choPhep, true);
});

test('§6.8 — chặn localhost và tên miền nội bộ', () => {
  for (const u of [
    'http://localhost/x', 'http://LOCALHOST:80/x', 'http://api.local/x',
    'http://svc.internal/x', 'http://box.localdomain/',
  ]) {
    assert.strictEqual(L.kiemUrl(u).choPhep, false, `lọt: ${u}`);
  }
});

test('§6.8 — chặn toàn bộ dải IP nội bộ', () => {
  const chan = ['10.0.0.1', '127.0.0.1', '172.16.0.1', '172.31.255.255',
    '192.168.1.1', '169.254.1.1', '0.0.0.0', '100.64.0.1', '224.0.0.1'];
  for (const ip of chan) {
    assert.ok(L.laIpNoiBo(ip), `${ip} phải bị coi là nội bộ`);
    assert.strictEqual(L.kiemUrl(`http://${ip}/x`).choPhep, false, `lọt: ${ip}`);
  }
  // Dải công cộng KHÔNG được chặn nhầm.
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '192.169.0.1']) {
    assert.ok(!L.laIpNoiBo(ip), `${ip} bị chặn nhầm`);
  }
});

test('§6.8 — chặn metadata endpoint của đám mây', () => {
  for (const h of ['169.254.169.254', 'metadata.google.internal']) {
    const kq = L.kiemUrl(`http://${h}/latest/meta-data/`);
    assert.strictEqual(kq.choPhep, false, `lọt: ${h}`);
  }
});

test('§6.8 — chặn IPv6 loopback và dải riêng, kể cả IPv4-mapped', () => {
  for (const h of ['[::1]', '[fc00::1]', '[fe80::1]', '[::ffff:127.0.0.1]']) {
    assert.strictEqual(L.kiemUrl(`http://${h}/x`).choPhep, false, `lọt: ${h}`);
  }
});

test('§6.8 — chặn cổng không chuẩn: thường là dịch vụ nội bộ', () => {
  assert.strictEqual(L.kiemUrl('http://example.com:6379/').choPhep, false);
  assert.strictEqual(L.kiemUrl('http://example.com:8080/').choPhep, false);
  assert.strictEqual(L.kiemUrl('https://example.com:443/').choPhep, true);
});

test('§6.8 — URL dị dạng rơi về TỪ CHỐI, không rơi về cho phép', () => {
  for (const u of ['', 'không phải url', 'http://', '://x', null, undefined]) {
    assert.strictEqual(L.kiemUrl(u).choPhep, false, `lọt: ${String(u)}`);
  }
});

test('§6.8 — resolve lại ở MỖI HOP: hop cuối độc vẫn bị chặn', () => {
  // Kiểm hop đầu rồi tin cả chuỗi là đúng lỗ hổng SSRF kinh điển.
  const chuoi = ['https://bit.ly/x', 'https://redir.example.com/y', 'http://169.254.169.254/'];
  const kq = L.kiemChuoiChuyenHuong(chuoi);
  assert.strictEqual(kq.choPhep, false);
  assert.strictEqual(kq.hopHong, 2, 'phải chỉ ra hop nào hỏng');
});

test('§6.8 — giới hạn số hop', () => {
  const dai = Array.from({ length: L.SO_HOP_TOI_DA + 1 }, (_, i) => `https://h${i}.example.com/`);
  assert.strictEqual(L.kiemChuoiChuyenHuong(dai).choPhep, false);
  assert.strictEqual(L.kiemChuoiChuyenHuong(dai).lyDo, 'qua_nhieu_hop');
});

test('§6.8 — link-shield KHÔNG tự mở link: không gọi mạng ở đâu cả', () => {
  const nguon = require('node:fs').readFileSync(require.resolve('../backend/src/link-shield'), 'utf8');
  for (const cam of ['fetch(', 'http.get', 'https.get', 'dns.', 'net.connect', 'axios']) {
    assert.ok(!nguon.includes(cam), `link-shield không được dùng ${cam}`);
  }
});

// ═══════════════════ Kiểm tệp ═══════════════════

const uri = (loaiKhai, byte) => `data:${loaiKhai};base64,${Buffer.from(byte).toString('base64')}`;
const PNG = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0];
const JPEG = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0];

test('§6.8 — nhận ảnh hợp lệ theo CHỮ KÝ, không theo phần khai', () => {
  assert.strictEqual(M.kiemTep(uri('image/png', PNG)).loai, 'image/png');
  assert.strictEqual(M.kiemTep(uri('image/jpeg', JPEG)).loai, 'image/jpeg');
});

test('§6.8 — GIẢ MẠO MIME: khai là ảnh nhưng byte là thứ khác', () => {
  const apk = [0x50, 0x4B, 0x03, 0x04, 0, 0, 0, 0];
  const kq = M.kiemTep(uri('image/png', apk));
  assert.strictEqual(kq.hopLe, false, 'APK khai là PNG mà lọt qua');
  assert.strictEqual(kq.loai, 'application/zip-hoac-apk');
  assert.strictEqual(kq.maLoi, 'dinh_dang_khong_cho_phep');
});

test('§6.8 — phát hiện giả mạo MIME cả khi tệp vẫn là ảnh hợp lệ', () => {
  const kq = M.kiemTep(uri('image/jpeg', PNG));
  assert.strictEqual(kq.hopLe, true);
  assert.strictEqual(kq.giaMaoMime, true, 'khai jpeg nhưng byte là png — phải ghi nhận');
});

test('§6.8 — từ chối SVG: nó chạy script được', () => {
  const svg = [0x3C, 0x73, 0x76, 0x67, 0x20];
  assert.strictEqual(M.kiemTep(uri('image/svg+xml', svg)).hopLe, false);
});

test('§6.8 — từ chối HTML, PE, ELF, PDF', () => {
  const ca = {
    'text/html': [0x3C, 0x68, 0x74, 0x6D, 0x6C],
    'application/x-msdownload': [0x4D, 0x5A, 0x90, 0x00],
    'application/x-elf': [0x7F, 0x45, 0x4C, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };
  for (const [ten, byte] of Object.entries(ca)) {
    assert.strictEqual(M.kiemTep(uri('image/png', byte)).hopLe, false, `lọt: ${ten}`);
  }
});

test('§6.10 — quá 5MB bị từ chối với mã FILE_TOO_LARGE', () => {
  const to = [...PNG, ...new Array(M.GIOI_HAN_BYTE).fill(0)];
  const kq = M.kiemTep(uri('image/png', to));
  assert.strictEqual(kq.hopLe, false);
  assert.strictEqual(kq.maLoi, 'FILE_TOO_LARGE');
});

test('§4.3 — tệp không nhận ra chữ ký thì có MÃ LÝ DO, không im lặng bỏ qua', () => {
  const la = M.kiemTep(uri('image/png', [0x01, 0x02, 0x03, 0x04, 0x05]));
  assert.strictEqual(la.hopLe, false);
  assert.strictEqual(la.maLoi, 'chu_ky_tep_khong_nhan_ra');

  const rong = M.kiemTep('');
  assert.strictEqual(rong.maLoi, 'khong_doc_duoc_tep');
});

test('§6.8 — không tin phần khai `data:` chút nào, kể cả khi nó vắng mặt', () => {
  const khongKhai = `data:;base64,${Buffer.from(PNG).toString('base64')}`;
  assert.strictEqual(M.kiemTep(khongKhai).loai, 'image/png');
});
