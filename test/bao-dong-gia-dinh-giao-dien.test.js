'use strict';
/**
 * PHẦN 3 — GIAO DIỆN BÁO ĐỘNG GIA ĐÌNH (23/9/2026).
 * Máy bố mẹ: gửi báo động đúng lúc, đúng một lần, và NÓI ĐÚNG trạng thái gửi.
 * Máy con: bật nhận, màn "đang cần", nút gọi ghi nhận TRƯỚC khi mở trình gọi.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => { const f = path.join(GOC, ...p); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : ''; };
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
function goi(nguon, ten) {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', ten);
  fs.mkdirSync(path.dirname(ra), { recursive: true });
  esbuild.buildSync({ entryPoints: [nguon], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
  return require(ra);
}

test('câu trạng thái gửi: đúng bốn loại, không bao giờ "đã thấy"/"đã đọc"', () => {
  const f = path.join(GOC, 'src', 'lib', 'cau-trang-thai-bao.ts');
  assert.ok(fs.existsSync(f), 'chưa có src/lib/cau-trang-thai-bao.ts');
  const C = goi(f, 'cau-trang-thai-bao.cjs');
  const t = (s) => s;
  assert.strictEqual(C.cauTrangThaiBao([{ ten: 'Minh', trangThai: 'DA_DAY_DI' }], t), 'Đã gửi tới máy Minh');
  assert.strictEqual(C.cauTrangThaiBao([{ ten: 'Minh', trangThai: 'PUSH_DELIVERY_UNKNOWN' }], t), 'Chưa chắc đã tới máy Minh');
  assert.strictEqual(C.cauTrangThaiBao([{ ten: 'Hoa', trangThai: 'CHUA_BAT_NHAN' }], t), 'Hoa chưa bật nhận cảnh báo');
  assert.strictEqual(C.cauTrangThaiBao([{ ten: 'Hoa', trangThai: 'DANG_KY_HET_HAN' }], t), 'Hoa chưa bật nhận cảnh báo');
  assert.strictEqual(C.cauTrangThaiBao([{ ten: 'Minh', trangThai: 'CHUA_CAU_HINH_PUSH' }], t), 'Máy chủ chưa bật gửi cảnh báo');
  const hon = C.cauTrangThaiBao([{ ten: 'Minh', trangThai: 'DA_DAY_DI' }, { ten: 'Hoa', trangThai: 'CHUA_BAT_NHAN' }], t);
  assert.strictEqual(hon, 'Đã gửi tới máy Minh · Hoa chưa bật nhận cảnh báo');
  assert.strictEqual(C.cauTrangThaiBao([], t), '');
  for (const cau of Object.values(C.CAU_TRANG_THAI)) assert.ok(!/đã thấy|đã đọc|an toàn/i.test(cau), `§11: "${cau}"`);
});

test('máy bố mẹ: gửi báo động đúng MỘT lần, chỉ mức CAO, không khi diễn tập hay mất mạng', () => {
  const APP = doc('src', 'App.tsx');
  const i = APP.indexOf('guiBaoDong({');
  assert.ok(i > 0, 'WarningView chưa gửi báo động');
  const khoi = APP.slice(APP.lastIndexOf('useEffect(() => {', i), i);
  // Phần 4: loại sự kiện là "ket_qua_kiem" (chỉ khi nhãn CAO) hoặc sự kiện máy tự bật.
  assert.match(khoi, /const loaiBaoDong = laCao \? 'ket_qua_kiem' : lyDoTuBat;/);
  assert.match(khoi, /if \(daGuiBaoDongRef\.current \|\| !loaiBaoDong \|\| laDienTap \|\| khongGoiDuoc \|\| !docPhienTaiKhoan\(\)\) return;/);
  assert.match(khoi, /daGuiBaoDongRef\.current = true;/, 'StrictMode chạy effect hai lần — cờ ref chặn gửi đôi');
});

test('máy bố mẹ: hành động sau cảnh báo được báo cho con (mã), diễn tập thì không', () => {
  const APP = doc('src', 'App.tsx');
  const i = APP.indexOf('const ghiHanhDong = (hanhDong: HanhDong) => {');
  const khoi = APP.slice(i, i + 700);
  const iDienTap = khoi.indexOf('if (laDienTap) return;');
  const iGui = khoi.indexOf('guiTrangThaiBaoDong(');
  assert.ok(iDienTap > 0 && iGui > iDienTap, 'diễn tập phải thoát TRƯỚC khi báo trạng thái cho con');
});

test('máy con: "Gọi ngay" ghi nhận TRƯỚC khi mở trình gọi', () => {
  const G = boChuThich(doc('src', 'components', 'Guardian.tsx'));
  const i = G.indexOf('const goiNgayTuCanhBao');
  assert.ok(i > 0, 'Guardian chưa có nút gọi từ cảnh báo');
  const khoi = G.slice(i, i + 500);
  const iGhi = khoi.indexOf('baoConDaGoi(');
  const iMo = khoi.indexOf('tel:');
  assert.ok(iGhi > 0 && iMo > iGhi, 'ghi "con đã gọi" trước, để leo thang không báo thừa');
});

test('máy con: bật nhận cảnh báo nói đúng lý do khi không bật được', () => {
  const N = doc('src', 'lib', 'nhan-canh-bao.ts');
  assert.ok(N.length > 0, 'chưa có src/lib/nhan-canh-bao.ts');
  for (const ma of ['KHONG_HO_TRO', 'CHI_CO_BAN_DUNG', 'BI_TU_CHOI', 'MAY_CHU_CHUA_CAU_HINH', 'LOI_DANG_KY']) {
    assert.ok(N.includes(`'${ma}'`), `thiếu mã ${ma}`);
  }
  assert.match(N, /userVisibleOnly: true/);
});

test('không câu giao diện nào của Phần 3 nói "đã thấy" / "đã đọc"', () => {
  const nguon = boChuThich(doc('src', 'components', 'Guardian.tsx') + doc('src', 'components', 'GhepConChau.tsx') + doc('src', 'lib', 'cau-trang-thai-bao.ts'));
  const chu = [...nguon.matchAll(/t[r]?\('([^']+)'\)/g)].map((m) => m[1]);
  for (const c of chu) assert.ok(!/đã thấy|đã đọc/i.test(c), `§11: "${c}"`);
});
