'use strict';
/**
 * CÂU LỆNH NGẮN — dòng chữ to nhất trên màn khẩn cấp (Phần 1 "Cầu dao gia đình",
 * 23/9/2026). Người dùng báo: "trong trường hợp hoảng loạn mà cho 1 đống chữ thì
 * ai thèm đọc". Câu lệnh này là thứ DUY NHẤT người đang hoảng cần đọc — và là câu
 * máy tự đọc to.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const RA = path.join(GOC, 'node_modules', '.goi-test-vong-tron');

function goi(nguon, ten) {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(RA, { recursive: true });
  const ra = path.join(RA, ten);
  esbuild.buildSync({ entryPoints: [nguon], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
  return require(ra);
}
const V = goi(path.join(GOC, 'src', 'lib', 'viec-an-toan-tiep-theo.ts'), 'cau-lenh-ngan.cjs');
const { translations } = goi(path.join(GOC, 'src', 'i18n.ts'), 'i18n-cau-lenh.cjs');

// Phần 4: câu khi máy tự bật cũng phải qua đúng các luật đếm chữ, catalog, §11.
const tatCa = () => [
  ...Object.values(V.CAU_LENH_NGAN || {}),
  ...Object.values(V.CAU_LENH_KHI_CHUA_CO_SO || {}),
  ...Object.values(V.CAU_LENH_TU_BAT || {}),
];

test('mỗi việc an toàn có đúng một câu lệnh ngắn', () => {
  assert.ok(V.CAU_LENH_NGAN, 'chưa có CAU_LENH_NGAN');
  for (const viec of ['goi_ngan_hang_phuc_hoi', 'khong_cai_gui_nguoi_than', 'goi_so_cu_nguoi_than', 'goi_so_sau_the', 'khong_doc_ma', 'cup_may_goi_nguoi_than']) {
    assert.ok(V.CAU_LENH_NGAN[viec], `thiếu câu lệnh cho ${viec}`);
  }
});

test('câu lệnh ngắn tối đa 8 chữ — người đang hoảng không đọc hết câu dài', () => {
  assert.ok(tatCa().length >= 6, 'không có câu lệnh nào để đếm — test này không được xanh rỗng');
  for (const cau of tatCa()) {
    const soChu = cau.trim().split(/\s+/).length;
    assert.ok(soChu <= 8, `"${cau}" có ${soChu} chữ`);
  }
});

test('mọi câu lệnh ngắn có trong CẢ HAI catalog (§4.1)', () => {
  assert.ok(tatCa().length >= 6, 'không có câu lệnh nào để soát');
  for (const cau of tatCa()) {
    assert.ok(translations.vi[cau], `thiếu bản tiếng Việt: "${cau}"`);
    assert.ok(translations.en[cau] && translations.en[cau] !== cau, `thiếu bản tiếng Anh: "${cau}"`);
  }
});

test('§11 — câu lệnh không hứa an toàn, không bịa số', () => {
  assert.ok(tatCa().length >= 6, 'không có câu lệnh nào để soát');
  for (const cau of tatCa()) {
    assert.ok(!/an toàn|chắc chắn|đã chặn|lấy lại được/i.test(cau), `câu vượt quá điều app biết: "${cau}"`);
    assert.ok(!/\d/.test(cau), `câu tự đưa ra một con số: "${cau}"`);
  }
});

test('chưa có số người thân thì câu lệnh KHÔNG bảo "gọi con cháu" — nút chính lúc đó là 113', () => {
  assert.strictEqual(typeof V.cauLenhNgan, 'function', 'chưa có cauLenhNgan()');
  for (const viec of Object.keys(V.CAU_LENH_NGAN)) {
    assert.ok(!/con cháu/i.test(V.cauLenhNgan(viec, false)), `${viec} khi chưa có số: "${V.cauLenhNgan(viec, false)}"`);
  }
  assert.strictEqual(V.cauLenhNgan(null, true), V.CAU_LENH_NGAN.cup_may_goi_nguoi_than,
    'lượt tự bấm dừng (không có mã nào) dùng câu mặc định');
});
