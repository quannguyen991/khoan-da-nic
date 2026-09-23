'use strict';
/**
 * PHẦN 2 "CON CHÁU CÀI GIÚP" — 23/9/2026.
 * Đo trước đó: màn giới thiệu 4 trang không bước nào xin số con, nên nút gọi khẩn
 * cấp mặc định TRỐNG; và ghép máy xong thì số của con KHÔNG vào nút đó.
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

test('ghép xong: người con tự vào danh sách người thân, không trùng số', () => {
  const f = path.join(GOC, 'src', 'lib', 'hop-nhat-nguoi-than.ts');
  assert.ok(fs.existsSync(f), 'chưa có src/lib/hop-nhat-nguoi-than.ts');
  const H = goi(f, 'hop-nhat.cjs');
  let id = 100;
  const ds = [{ id: 1, name: 'Hoa', relation: 'Con gái', phone: '0911 222 333' }];
  const kq = H.hopNhatNguoiThan(ds, [{ ten: 'Hoa', so: '0911222333' }, { ten: 'Minh', so: '0988000222' }], () => ++id);
  assert.strictEqual(kq.length, 2, 'số đã có (khác cách viết) không được thêm lần hai');
  assert.deepStrictEqual(kq[1], { id: 101, name: 'Minh', relation: 'Người thân tin cậy', phone: '0988000222' });
  assert.strictEqual(H.hopNhatNguoiThan(kq, [{ ten: 'Minh', so: '0988000222' }], () => 999).length, 2, 'gọi lại không nhân bản');
  assert.strictEqual(H.hopNhatNguoiThan(ds, [], () => 1), ds, 'không có gì mới thì trả lại đúng mảng cũ (không dựng lại vô ích)');
});

test('lời nhắn giọng KHÔNG BAO GIỜ rời máy', () => {
  const lib = doc('src', 'lib', 'loi-nhan-giong.ts');
  const ghi = doc('src', 'components', 'GhiLoiNhan.tsx');
  assert.ok(lib.length > 0 && ghi.length > 0, 'chưa có mã lời nhắn (lib + component)');
  const nguon = boChuThich(lib + ghi);
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|FormData|api\(/.test(nguon), 'bác chọn 23/9: lời nhắn CHỈ lưu trên máy bố mẹ');
  assert.match(nguon, /indexedDB\.open\(/);
});

test('phiên tự gia hạn khi còn dưới 7 ngày — cảnh báo cho con không được tắt lặng', () => {
  const tk = doc('src', 'tai-khoan.ts');
  assert.match(tk, /export async function giaHanNeuSapHet/);
  assert.match(tk, /7 \* 24 \* 60 \* 60 \* 1000/);
  const i = tk.indexOf('export async function layHoSo');
  assert.match(tk.slice(i, i + 600), /giaHanNeuSapHet\(/, 'layHoSo (chạy mỗi lần mở app) phải gọi gia hạn');
});

test('luồng "Con cháu cài giúp" có đủ 5 bước, quy tắc báo mặc định tắt', () => {
  const w = doc('src', 'components', 'ConCaiGiup.tsx');
  assert.ok(w.length > 0, 'chưa có ConCaiGiup.tsx');
  for (const buoc of ["'tai_khoan'", "'noi_may'", "'loi_nhan'", "'quy_tac'", "'dien_tap'"]) assert.ok(w.includes(buoc), `thiếu bước ${buoc}`);
  assert.match(w, /useState<QuyTacBao>\(\{ baoKhiCao: false, baoKhiOtpTrongCuocGoi: false, choConXemBaoVe: false \}\)/, '§12 — công tắc báo mặc định TẮT');
  assert.match(w, /<ManGhepConChau t=\{t\} setView=\{setView\} nhung /, 'bước nối máy phải nhúng đúng màn ghép đã có — không viết lại luồng mã');
});

test('ghép xong ở MỌI lối vào: người con vào danh sách gọi khẩn cấp', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /<ManGhepConChau t=\{t\} setView=\{setView\} onDanhSach=\{hopNhatDaGhep\} \/>/);
  assert.match(APP, /const hopNhatDaGhep = /);
  const G = doc('src', 'components', 'GhepConChau.tsx');
  assert.match(G, /onDanhSachRef\.current\?\.\(v\)/, 'màn ghép phải báo danh sách ra ngoài mỗi lần tải');
});

test('diễn tập đi đường "tự bấm dừng" (không nhãn rủi ro) và mang cờ dienTap', () => {
  const APP = doc('src', 'App.tsx');
  const i = APP.indexOf('const triggerDienTap = () => {');
  assert.ok(i > 0, 'chưa có triggerDienTap');
  const khoi = APP.slice(i, i + 400);
  assert.match(khoi, /tuBamDung: true/);
  assert.match(khoi, /dienTap: true/);
  assert.ok(!/nhan:/.test(khoi), 'diễn tập không được tự đặt nhãn rủi ro (§4.2)');
});

test('màn giới thiệu có lối "Con cháu cài giúp"', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /t\("Con cháu cài giúp"\)/);
  assert.match(APP, /setView\('con_cai_giup'\)/);
});

test('công tắc chỉ-APK không được hiện trên web: laApk() là Promise, không dùng thẳng trong điều kiện', () => {
  const w = boChuThich(doc('src', 'components', 'ConCaiGiup.tsx'));
  assert.ok(!/laApk\(\)\s*&&/.test(w), '`laApk() && …` luôn đúng vì Promise luôn truthy');
});

// ── Màn khẩn cấp: lời nhắn của con + diễn tập ───────────────────────────────────
test('màn khẩn cấp: có lời nhắn của con thì PHÁT LỜI NHẮN, không đọc giọng máy', () => {
  const APP = doc('src', 'App.tsx');
  assert.match(APP, /const loiNhan = useLoiNhanCon\(\);/);
  assert.match(APP, /usePhatMotLan\(loiNhan\.url, heroGap && loiNhan\.daTai && coLoiNhan\);/);
  assert.match(APP, /useDocToMotLan\(cauTuDoc, heroGap && loiNhan\.daTai && !coLoiNhan,/);
});

test('diễn tập: có băng "ĐÂY LÀ DIỄN TẬP" và KHÔNG ghi kết quả can thiệp (§4.6)', () => {
  const APP = doc('src', 'App.tsx');
  // Từ 23/9/2026 lượt MÔ PHỎNG (màn trình diễn) cũng tính là diễn tập — cùng mọi chặn.
  assert.match(APP, /const laDienTap = result\?\.dienTap === true( \|\| laMoPhong)?;/);
  assert.match(APP, /t\('ĐÂY LÀ DIỄN TẬP — không có gì nguy hiểm\.'\)/);
  const i = APP.indexOf('const ghiHanhDong = (hanhDong: HanhDong) => {');
  const khoi = APP.slice(i, i + 900);
  const iThoat = khoi.indexOf('if (laDienTap) return;');
  assert.ok(iThoat > 0, 'lượt tập mà ghi vào sẽ làm bẩn tỷ lệ báo động giả');
  // Trước chỗ thoát KHÔNG được có lệnh ghi hay gửi nào — chỉ báo sang máy con giả lập.
  const truocThoat = khoi.slice(0, iThoat);
  assert.ok(!/ghiKetQua\(|guiTrangThaiBaoDong\(|ghiLuot\(/.test(truocThoat), 'mô phỏng không được ghi số liệu hay gửi máy chủ');
  assert.ok(khoi.indexOf('ghiKetQua(') > iThoat && khoi.indexOf('guiTrangThaiBaoDong(') > iThoat);
});
