'use strict';
/**
 * PHẦN 5 — GIAO DIỆN "CHÌA KHOÁ THỨ HAI" (23/9/2026). Test đọc nguồn.
 *
 * Canh bốn lời hứa không được vỡ:
 *  1. Màn ngân hàng mô phỏng LUÔN nói nó là mô phỏng (§12 — không hứa chặn giao dịch).
 *  2. Tên người nhận và số tiền chính xác KHÔNG lên máy chủ (§6.9) — chỉ mã khoảng.
 *  3. Không câu nào nói "an toàn" / "đã chặn" (§4.1, §11).
 *  4. Mọi chuỗi đi qua t() và có trong CẢ HAI catalog (§4.1).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const doc = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const TEP = ['src/components/ChiaKhoaThuHai.tsx', 'src/components/NganHangMoPhong.tsx', 'src/components/KyChiaKhoa.tsx'];

test('ngân hàng mô phỏng: dải MÔ PHỎNG luôn hiện, không nằm sau điều kiện nào', () => {
  const s = boChuThich(doc('src/components/NganHangMoPhong.tsx'));
  const i = s.indexOf("t('MÔ PHỎNG — ngân hàng thật chưa tích hợp Khoan Đã')");
  assert.ok(i > 0, 'phải có dải MÔ PHỎNG');
  const truoc = s.slice(s.indexOf('return ('), i);
  assert.ok(!/&&\s*\(?\s*<div[^>]*data-mo-phong/.test(truoc), 'dải không được bọc trong điều kiện');
  assert.match(truoc, /data-mo-phong="luon-hien"[^>]*sticky/, 'dải dính trên cùng khi cuộn');
});

test('§6.9 — chỉ MÃ khoảng tiền lên máy chủ; tên người nhận và số tiền ở lại máy', () => {
  const s = boChuThich(doc('src/components/NganHangMoPhong.tsx'));
  // Hai lượt gọi mạng duy nhất, và chúng chỉ nhận `khoang`.
  assert.match(s, /kiemChiaKhoa\(khoang, nguoiMoi\)/);
  assert.match(s, /nhoConXacNhan\(\{ khoangTien: khoang, hanhDong: 'chuyen_khoan', nguoiYeuCau: aiBao \}\)/);
  assert.ok(!/fetch\(/.test(s), 'không gọi mạng trực tiếp');
  for (const bien of ['nguoiNhan', 'soTrieu']) {
    const trongLuotGoi = s.match(/(kiemChiaKhoa|nhoConXacNhan)\([^)]*\)/g).join(' ');
    assert.ok(!trongLuotGoi.includes(bien), `${bien} không được đi vào lượt gọi máy chủ`);
  }
});

test('§4.1/§11 — không "an toàn", "đã chặn", "Safe", "blocked" trong chuỗi hiển thị', () => {
  const vi = /an toàn|đã chặn|chặn giao dịch/i;
  for (const p of TEP) {
    const s = boChuThich(doc(p));
    for (const m of s.matchAll(/(?<![\w.])t\('([^']+)'\)/g)) assert.ok(!vi.test(m[1]), `${p}: "${m[1]}"`);
  }
  const i18n = doc('src/i18n.ts');
  for (const k of ['Người thân đã xác nhận.', 'MÔ PHỎNG — ngân hàng thật chưa tích hợp Khoan Đã', 'Khoản này dưới ngưỡng bác đã đặt, hoặc bác chưa bật chìa khoá thứ hai. Trong mô phỏng, ngân hàng sẽ làm tiếp như bình thường.']) {
    const dong = i18n.split(/\r?\n/).filter((l) => l.includes(JSON.stringify(k) + ':'));
    assert.strictEqual(dong.length, 2, `"${k}" phải có ở cả vi và en`);
    for (const l of dong) assert.ok(!/\bsafe\b|blocked|an toàn/i.test(l.split(':').slice(1).join(':')), l);
  }
});

test('§4.1 — mọi chuỗi t() của ba màn có trong CẢ HAI catalog', () => {
  const i18n = doc('src/i18n.ts');
  const thieu = [];
  for (const p of TEP) {
    for (const m of boChuThich(doc(p)).matchAll(/(?<![\w.])t\('([^']+)'\)/g)) {
      const k = JSON.stringify(m[1]) + ':';
      if (i18n.split(k).length - 1 < 2) thieu.push(`${p}: ${m[1]}`);
    }
  }
  const bang = doc('src/lib/chia-khoa.ts');
  for (const m of bang.matchAll(/:\s*'([^']+)'/g)) {
    if (doc('src/i18n.ts').split(JSON.stringify(m[1]) + ':').length - 1 < 2) thieu.push(`chia-khoa.ts: ${m[1]}`);
  }
  assert.deepStrictEqual(thieu, []);
});

test('máy con: nhắc gọi trước khi ký; ký bằng passkey, không có nút "xác nhận" nào bỏ qua chữ ký', () => {
  const s = boChuThich(doc('src/components/KyChiaKhoa.tsx'));
  assert.match(s, /Chỉ xác nhận khi anh\/chị đã gọi nói chuyện với bố mẹ\./);
  assert.match(s, /startAuthentication\(\{ optionsJSON: de\.tuyChon \}\)/);
  assert.match(s, /startRegistration\(\{ optionsJSON: tuyChonDk \}\)/, 'chưa có passkey thì tạo ngay');
  assert.ok(!/kyYeuCau\([^)]*null/.test(s), 'không gửi quyết định mà không có chữ ký');
  const g = doc('src/components/Guardian.tsx');
  assert.match(g, /<KyChiaKhoa /, 'thẻ phải được gắn vào màn Guardian');
});

test('bố mẹ: chìa khoá mặc định do máy chủ trả (TẮT), hết hạn nói "chưa liên lạc được", không nói "từ chối"', () => {
  const s = boChuThich(doc('src/components/ChiaKhoaThuHai.tsx'));
  assert.match(s, /docChiaKhoa\(\)/);
  const nhanhHetHan = s.slice(s.indexOf('TRANG_THAI_KY.HET_HAN'), s.indexOf('const phut'));
  assert.match(nhanhHetHan, /Chưa liên lạc được người thân/);
  assert.ok(!/từ chối/.test(nhanhHetHan), '§4.3 — hết hạn KHÔNG phải từ chối');
});
