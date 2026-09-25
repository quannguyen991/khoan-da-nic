'use strict';
/**
 * SỐ ĐO TRÊN MÁY NÀY (25/9/2026) — đọc lại hai bộ ghi hành vi, và gói sao chép.
 *
 * Canh bốn thứ: chưa có bản ghi thì nói "chưa có" chứ không in số 0; gói sao chép
 * chỉ mang mã và giờ (không `maLyDo`, không nội dung); hàng rào từ chối cả gói khi
 * có thứ lạ; và không có đường ra mạng.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const NGUON = path.join(GOC, 'src', 'lib', 'so-do-tren-may.ts');
const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'so-do-tren-may.cjs');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(path.dirname(TEP_GOI), { recursive: true });
  esbuild.buildSync({
    entryPoints: [NGUON], bundle: true, format: 'cjs', platform: 'node',
    outfile: TEP_GOI, absWorkingDir: GOC, logLevel: 'silent',
  });
  return require(TEP_GOI);
}

// Module đọc localStorage khi gọi không tham số; mọi test dưới đây truyền dữ liệu thẳng.
if (!globalThis.localStorage) {
  const kho = {};
  globalThis.localStorage = { getItem: (k) => (k in kho ? kho[k] : null), setItem: (k, v) => { kho[k] = String(v); }, removeItem: (k) => { delete kho[k]; } };
}
const M = goi();
const LUC = Date.UTC(2026, 8, 28, 9, 30, 0);

test('chưa có bản ghi thì trả null, không trả một bảng toàn số 0 (§4.3)', () => {
  assert.strictEqual(M.demHanhVi([]), null);
  assert.strictEqual(M.demHanhVi([{ luc: LUC, hanhDong: 'viec_la' }]), null, 'mã lạ không được đếm thành một lượt');
});

test('đếm đúng từng việc, bỏ mã lạ', () => {
  const d = M.demHanhVi([
    { luc: LUC, canThiep: 'PROTECTED_CRITICAL', nhan: 'CAO', maLyDo: [], hanhDong: 'bam_goi_nguoi_than' },
    { luc: LUC + 1, canThiep: 'PROTECTED_CRITICAL', nhan: 'CAO', maLyDo: [], hanhDong: 'con_bao_lua_dao' },
    { luc: LUC + 2, canThiep: 'PAUSE_60S', nhan: 'CAO', maLyDo: [], hanhDong: 'toi_on' },
    { luc: LUC + 3, canThiep: null, nhan: null, maLyDo: [], hanhDong: 'khong_phai_ma' },
  ]);
  assert.strictEqual(d.soLanBam, 3);
  assert.strictEqual(d.theoHanhDong.bam_goi_nguoi_than, 1);
  assert.strictEqual(d.theoHanhDong.con_bao_lua_dao, 1);
  assert.strictEqual(d.theoHanhDong.toi_on, 1);
  assert.strictEqual(d.theoHanhDong.da_lo_chuyen, 0);
});

test('không có tỉ lệ nào: bản ghi không mang mã vụ, chia hai con đếm là khai phép đo chưa có (§11)', () => {
  const d = M.demHanhVi([{ luc: LUC, hanhDong: 'bam_goi_nguoi_than' }]);
  assert.deepStrictEqual(Object.keys(d).sort(), ['soLanBam', 'theoHanhDong']);
});

test('gói sao chép chỉ có mã và giờ: bỏ maLyDo, bỏ trường lạ, lọc mức lạ', () => {
  const g = M.dungGoiSoDo(
    [{ luc: LUC, canThiep: 'PROTECTED_CRITICAL', nhan: 'CAO', maLyDo: ['FIN_TRANSFER_REQUEST'], hanhDong: 'bam_goi_nguoi_than', noiDung: 'Công an quận…' },
      { luc: LUC + 5, canThiep: 'MUC_BIA', nhan: 'AN_TOAN', maLyDo: [], hanhDong: 'toi_on' }],
    [{ batDau: LUC, giayToiLucBam: 11.2, nhan: 'CAO' }],
    LUC + 60_000,
  );
  const chu = JSON.stringify(g);
  assert.doesNotMatch(chu, /maLyDo|FIN_TRANSFER_REQUEST|noiDung|Công an/, 'gói mang thứ ngoài mã và giờ');
  assert.strictEqual(g.ketQua[1].canThiep, null, 'mức can thiệp lạ phải thành null');
  assert.strictEqual(g.ketQua[1].nhan, null, 'nhãn lạ phải thành null — không có nhãn "an toàn"');
  assert.strictEqual(g.thoiGianToiLucBam[0].giay, 11.2);
  assert.strictEqual(g.lapLuc, '2026-09-28T09:31:00.000Z');
  assert.strictEqual(M.kiemTraGoiSoDo(g), true);
});

test('lượt đo quá 15 phút hoặc âm không vào gói', () => {
  const g = M.dungGoiSoDo([], [
    { batDau: LUC, giayToiLucBam: 901, nhan: 'CAO' },
    { batDau: LUC, giayToiLucBam: -1, nhan: 'CAO' },
    { batDau: LUC, giayToiLucBam: 7, nhan: 'NGHI_NGO' },
  ], LUC);
  assert.strictEqual(g.thoiGianToiLucBam.length, 1);
});

test('hàng rào từ chối CẢ gói khi có khoá thừa hoặc giá trị lạ — không chép một nửa', () => {
  const tot = M.dungGoiSoDo([{ luc: LUC, canThiep: 'PAUSE_60S', nhan: 'CAO', maLyDo: [], hanhDong: 'bam_goi_nguoi_than' }], [], LUC);
  assert.strictEqual(M.kiemTraGoiSoDo(tot), true);

  const thuaKhoa = JSON.parse(JSON.stringify(tot));
  thuaKhoa.ketQua[0].noiDung = 'chuyển tiền vào tài khoản an toàn';
  assert.strictEqual(M.kiemTraGoiSoDo(thuaKhoa), false);

  const maLa = JSON.parse(JSON.stringify(tot));
  maLa.ketQua[0].hanhDong = 'bác đã đọc mã 123456';
  assert.strictEqual(M.kiemTraGoiSoDo(maLa), false);

  const thuaGoc = { ...tot, soDienThoai: '0900000000' };
  assert.strictEqual(M.kiemTraGoiSoDo(thuaGoc), false);

  assert.strictEqual(M.kiemTraGoiSoDo(null), false);
});

test('không có đường ra mạng trong module', () => {
  const src = fs.readFileSync(NGUON, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const cam of ['fetch(', 'sendBeacon', 'XMLHttpRequest', 'WebSocket', 'api(']) {
    assert.ok(!src.includes(cam), `module số đo có "${cam}"`);
  }
});

test('màn Ra-đa: kiểm gói TRƯỚC khi chép, và câu "Đã chép" chỉ sau khi chép được', () => {
  const man = fs.readFileSync(path.join(GOC, 'src', 'components', 'HoSoVaRaDa.tsx'), 'utf8');
  const i = man.indexOf('const chepSoDo');
  assert.ok(i > 0, 'thiếu chepSoDo');
  const than = man.slice(i, man.indexOf('};', i));
  assert.ok(than.indexOf('kiemTraGoiSoDo') < than.indexOf('chep(van)'), 'phải kiểm trước khi chép');
  assert.ok(than.indexOf('if (await chep(van))') < than.indexOf("'DA_CHEP'"), '"Đã chép" chỉ khi chép được');
});

test('catalog có câu cho từng việc, ở cả hai ngôn ngữ, không chữ "an toàn"/"safe"', () => {
  const cat = fs.readFileSync(path.join(GOC, 'src', 'catalog.ts'), 'utf8');
  const i = cat.indexOf('export const MAN_SO_DO');
  assert.ok(i > 0, 'catalog thiếu MAN_SO_DO');
  const khoi = cat.slice(i, cat.indexOf('};', i));
  for (const h of M.CAC_HANH_DONG) assert.ok(khoi.includes(`${h}: c(`), `thiếu câu cho ${h}`);
  assert.doesNotMatch(khoi, /an toàn|\bsafe\b/i);
});
