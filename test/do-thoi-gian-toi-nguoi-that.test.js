'use strict';
/**
 * ĐO THỜI GIAN TỪ CẢNH BÁO TỚI LÚC BẤM GỌI.
 *
 * VÌ SAO CẦN ĐO: đây là chỉ số DUY NHẤT của sản phẩm nói về HÀNH VI chứ không
 * nói về mô hình. "Model bắt được 90%" là câu về phần mềm; "sau cảnh báo mức
 * cao, bác bấm gọi con sau 12 giây" là câu về thứ thật sự thay đổi kết cục.
 *
 * ⚠️ TÊN PHẢI NÓI ĐÚNG THỨ ĐO ĐƯỢC. Máy KHÔNG biết cuộc gọi có ai nhấc máy hay
 * không — nó chỉ biết ngón tay đã chạm vào nút. Gọi nó là "thời gian tới người
 * thân" là khai một việc app không làm được (§11). Mọi trường và mọi hàm ở đây
 * phải mang chữ "bấm", và có test chặn bên dưới.
 *
 * ⚠️ KHÔNG LƯU NỘI DUNG. Bản ghi chỉ có ba trường: mốc bắt đầu, số giây, và
 * mức. Không tin nhắn, không số điện thoại, không tên người.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'do-thoi-gian.cjs');
const NGUON = path.join(GOC, 'src', 'lib', 'do-thoi-gian-toi-nguoi-that.ts');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(path.dirname(TEP_GOI), { recursive: true });
  esbuild.buildSync({
    entryPoints: [NGUON],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: TEP_GOI,
    absWorkingDir: GOC,
    logLevel: 'silent',
  });
  return require(TEP_GOI);
}

function datKho(banDau = {}) {
  const kho = { ...banDau };
  const gia = {
    getItem: (k) => (k in kho ? kho[k] : null),
    setItem: (k, v) => { kho[k] = String(v); },
    removeItem: (k) => { delete kho[k]; },
    _kho: kho,
  };
  try { globalThis.localStorage = gia; } catch { /* rơi xuống defineProperty */ }
  if (globalThis.localStorage !== gia) {
    Object.defineProperty(globalThis, 'localStorage', { value: gia, configurable: true, writable: true });
  }
  return gia;
}

const D = goi();

test('đo đúng số giây từ lúc cảnh báo hiện tới lúc bấm', () => {
  const phien = D.batDauDo('CAO', 1_000_000);
  const luot = D.ketThucDo(phien, 1_000_000 + 12_400);
  assert.equal(luot.giayToiLucBam, 12.4);
  assert.equal(luot.nhan, 'CAO');
});

test('màn để mở quá lâu thì BỎ, không tính vào số đo', () => {
  // Bác mở màn cảnh báo rồi đi nấu cơm, hai tiếng sau quay lại bấm gọi. Con số
  // đó không nói gì về phản ứng, và nó kéo trung vị đi rất xa.
  const phien = D.batDauDo('CAO', 0);
  assert.equal(D.ketThucDo(phien, 3 * 60 * 60 * 1000), null);
});

test('mức CHƯA THẤY không mở phiên đo — không có cảnh báo thì không có gì để đo', () => {
  assert.equal(D.batDauDo('CHUA_THAY', 1000), null);
  assert.equal(D.ketThucDo(null, 2000), null);
});

test('ghi rồi đọc lại đúng, và chỉ giữ ba trường', () => {
  datKho();
  D.ghiLuot({ batDau: 5, giayToiLucBam: 9.1, nhan: 'CAO' });
  const ds = D.docLuot();
  assert.equal(ds.length, 1);
  assert.deepEqual(Object.keys(ds[0]).sort(), ['batDau', 'giayToiLucBam', 'nhan']);
});

test('dữ liệu hỏng thì trả danh sách rỗng, KHÔNG ném', () => {
  datKho({ khoan_da_do_thoi_gian: 'không phải JSON' });
  assert.deepEqual(D.docLuot(), []);
});

test('chỉ giữ số bản ghi gần nhất, không phình vô hạn', () => {
  datKho();
  for (let i = 0; i < D.TOI_DA_BAN_GHI + 20; i += 1) {
    D.ghiLuot({ batDau: i, giayToiLucBam: i, nhan: 'CAO' });
  }
  const ds = D.docLuot();
  assert.equal(ds.length, D.TOI_DA_BAN_GHI);
  // Giữ cái MỚI nhất, không phải cái cũ nhất.
  assert.equal(ds[ds.length - 1].batDau, D.TOI_DA_BAN_GHI + 19);
});

test('thống kê: chưa có lượt nào thì trả null, không trả 0', () => {
  // 0 giây là một con số; "chưa đo lần nào" là một trạng thái khác hẳn. Trộn
  // hai thứ đó lại là đúng lỗi §4.3 ở một chỗ mới.
  datKho();   // kho phai sach: test truoc da ghi 50 ban ghi
  assert.equal(D.thongKe([]), null);
  assert.equal(D.thongKe(), null);
});

test('thống kê: trung vị đúng với số lẻ và số chẵn', () => {
  const l = (g) => ({ batDau: 0, giayToiLucBam: g, nhan: 'CAO' });
  assert.equal(D.thongKe([l(5), l(9), l(20)]).trungVi, 9);
  assert.equal(D.thongKe([l(4), l(6), l(10), l(20)]).trungVi, 8);
});

test('thống kê trả cả số lượt, để không ai đọc trung vị của hai mẫu như sự thật', () => {
  const l = (g) => ({ batDau: 0, giayToiLucBam: g, nhan: 'CAO' });
  const tk = D.thongKe([l(5), l(9)]);
  assert.equal(tk.soLuot, 2);
  assert.ok(tk.nhanhNhat <= tk.trungVi && tk.trungVi <= tk.chamNhat);
});

test('§11 — mã KHÔNG được khai là đo tới lúc người thân nghe máy', () => {
  const s = fs.readFileSync(NGUON, 'utf8');
  const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const cam of ['toiNguoiThan', 'daNgheMay', 'answered', 'daKetNoi']) {
    assert.ok(!ma.includes(cam), `không được có \`${cam}\` — máy không biết ai nhấc máy`);
  }
  assert.ok(ma.includes('giayToiLucBam'), 'trường phải nói rõ là đo TỚI LÚC BẤM');
});

test('§6.9 — mã KHÔNG gửi số đo đi đâu cả', () => {
  const s = fs.readFileSync(NGUON, 'utf8');
  const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const cam of ['fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'api.']) {
    assert.ok(!ma.includes(cam), `số đo ở lại trong máy — không được gọi \`${cam}\``);
  }
});
