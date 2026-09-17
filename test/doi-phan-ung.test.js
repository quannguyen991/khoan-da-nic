'use strict';
/**
 * ĐỘI PHẢN ỨNG NHANH — tối đa ba người, mỗi người một việc, và thứ tự gọi.
 *
 * VÌ SAO CẦN TEST NÀY:
 *
 * Nút gọi trên màn cảnh báo là thứ duy nhất bác bấm được trong lúc bị thúc ép.
 * Ba cách nó hỏng mà không ai thấy:
 *
 *  1. ID NGƯỜI THÂN ĐỔI SAU MỖI LẦN ĐỌC. `App.tsx` đặt id là số; bản đầu của
 *     thư viện chỉ nhận id chuỗi nên sinh id mới mỗi lần mở app. Đội trỏ vào id
 *     cũ ⇒ đội tự rỗng, nút gọi rơi về người đầu danh sách mà không báo gì.
 *  2. DANH SÁCH NGƯỜI THÂN LỆCH. Thêm người hay sửa số SAU khi đã lưu quy tắc thì
 *     vòng tròn không thấy — nút gọi trỏ vào số cũ.
 *  3. GỌI SAI NGƯỜI. Máy đang bị điều khiển mà nút gọi trỏ vào người không rành
 *     điện thoại; hoặc chen người ngoài đội vào dù bác đã chọn tin ai.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const THU_MUC_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron');
const TEP_GOI = path.join(THU_MUC_GOI, 'doi-phan-ung.cjs');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(THU_MUC_GOI, { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'lib', 'vong-tron-gia-dinh.ts')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: TEP_GOI,
    absWorkingDir: GOC,
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"test"' },
    logLevel: 'silent',
  });
  return require(TEP_GOI);
}

function khoLuuGia(banDau = {}) {
  const kho = { ...banDau };
  return {
    getItem: (k) => (k in kho ? kho[k] : null),
    setItem: (k, v) => { kho[k] = String(v); },
    removeItem: (k) => { delete kho[k]; },
    _kho: kho,
  };
}

function datKho(kho) {
  try { globalThis.localStorage = kho; } catch { /* rơi xuống defineProperty */ }
  if (globalThis.localStorage !== kho) {
    Object.defineProperty(globalThis, 'localStorage', { value: kho, configurable: true, writable: true });
  }
}

const V = goi();

/** Ba người thân đúng hình dạng `App.tsx` ghi: id SỐ, name/relation/phone. */
const APP = [
  { id: 1726000000001, name: 'Lan', relation: 'Con gái', phone: '0900000001' },
  { id: 1726000000002, name: 'Minh', relation: 'Con trai', phone: '0900000002' },
  { id: 1726000000003, name: 'Hoa', relation: 'Cháu', phone: '0900000003' },
];

const moiKho = (them = {}) => {
  const kho = khoLuuGia({ familyMembers: JSON.stringify(APP), ...them });
  datKho(kho);
  return kho;
};

// ═══════════ Nền dữ liệu: id ổn định, một nguồn người thân ═══════════

test('id SỐ của App giữ nguyên qua các lần đọc — không sinh id mới', () => {
  moiKho();
  const a = V.docVongTron();
  const b = V.docVongTron();
  assert.deepStrictEqual(a.nguoiThan.map((n) => n.id), ['1726000000001', '1726000000002', '1726000000003']);
  assert.deepStrictEqual(a.nguoiThan.map((n) => n.id), b.nguoiThan.map((n) => n.id));
});

test('⚠️ đã lưu quy tắc rồi mới thêm người / sửa số — vòng tròn vẫn thấy bản mới nhất', () => {
  const kho = moiKho();
  const kq = V.themQuyTac(V.docVongTron(), { ma: 'KHONG_DOC_MA_OTP', cau: 'không đọc mã', nguoiCungDat: 'Lan' });
  V.ghiVongTron(kq.vongTron);

  const moi = [{ ...APP[0], phone: '0911111111' }, APP[1], APP[2],
    { id: 1726000000004, name: 'Tùng', relation: 'Em trai', phone: '0900000004' }];
  kho.setItem('familyMembers', JSON.stringify(moi));

  const vt = V.docVongTron();
  assert.strictEqual(vt.nguoiThan.length, 4, 'người thêm sau không được mất');
  assert.strictEqual(vt.nguoiThan[0].dienThoai, '0911111111', 'số đã sửa phải là số mới');
  assert.strictEqual(vt.quyTac.length, 1, 'quy tắc vẫn còn nguyên');
});

// ═══════════ Lập đội ═══════════

test('người đầu tiên vào đội nhận vai NGƯỜI GỌI; người sau chưa có vai', () => {
  moiKho();
  let vt = V.docVongTron();
  vt = V.themVaoDoi(vt, '1726000000002').vongTron;
  vt = V.themVaoDoi(vt, '1726000000001').vongTron;
  assert.deepStrictEqual(vt.doi, [
    { nguoiThanId: '1726000000002', vaiTro: ['NGUOI_GOI'] },
    { nguoiThanId: '1726000000001', vaiTro: [] },
  ]);
});

test('tối đa BA người; người không có trong danh sách thì từ chối; thêm trùng thì không đổi', () => {
  moiKho({ familyMembers: JSON.stringify([...APP, { id: 9, name: 'Tư', relation: 'Bạn', phone: '0900000009' }]) });
  let vt = V.docVongTron();
  for (const id of ['1726000000001', '1726000000002', '1726000000003']) vt = V.themVaoDoi(vt, id).vongTron;
  const day = V.themVaoDoi(vt, '9');
  assert.strictEqual(day.ok, false);
  assert.strictEqual(day.lyDo, 'DAY');
  assert.strictEqual(V.themVaoDoi(vt, 'khong-co').lyDo, 'KHONG_CO_NGUOI');
  assert.strictEqual(V.themVaoDoi(vt, '1726000000001').vongTron.doi.length, 3);
});

test('ghi rồi đọc lại giữ đúng đội; người bị xoá khỏi danh sách thì rời đội', () => {
  const kho = moiKho();
  let vt = V.docVongTron();
  vt = V.themVaoDoi(vt, '1726000000001').vongTron;
  vt = V.themVaoDoi(vt, '1726000000003').vongTron;
  vt = V.doiVaiTro(vt, '1726000000003', 'HO_TRO_THIET_BI');
  V.ghiVongTron(vt);
  assert.deepStrictEqual(V.docVongTron().doi, vt.doi);

  kho.setItem('familyMembers', JSON.stringify([APP[0], APP[1]]));   // xoá Hoa
  assert.deepStrictEqual(V.docVongTron().doi.map((t) => t.nguoiThanId), ['1726000000001']);
});

test('đổi vai bật/tắt được; đổi thứ tự lên/xuống, không vượt biên', () => {
  moiKho();
  let vt = V.docVongTron();
  vt = V.themVaoDoi(vt, '1726000000001').vongTron;
  vt = V.themVaoDoi(vt, '1726000000002').vongTron;
  vt = V.doiVaiTro(vt, '1726000000002', 'HO_TRO_NGAN_HANG');
  vt = V.doiVaiTro(vt, '1726000000002', 'HO_TRO_NGAN_HANG');
  assert.deepStrictEqual(vt.doi[1].vaiTro, []);
  vt = V.doiThuTu(vt, '1726000000002', -1);
  assert.deepStrictEqual(vt.doi.map((t) => t.nguoiThanId), ['1726000000002', '1726000000001']);
  assert.strictEqual(V.doiThuTu(vt, '1726000000002', -1), vt, 'đầu hàng rồi thì không lên được nữa');
});

// ═══════════ Thứ tự gọi theo tình huống ═══════════

function doiMau() {
  moiKho();
  let vt = V.docVongTron();
  vt = V.themVaoDoi(vt, '1726000000001').vongTron;               // Lan: người gọi
  vt = V.themVaoDoi(vt, '1726000000002').vongTron;               // Minh
  vt = V.doiVaiTro(vt, '1726000000002', 'HO_TRO_THIET_BI');
  vt = V.themVaoDoi(vt, '1726000000003').vongTron;               // Hoa
  vt = V.doiVaiTro(vt, '1726000000003', 'HO_TRO_NGAN_HANG');
  return vt;
}

test('cảnh báo thường → người gọi trước; máy bị điều khiển → người rành điện thoại trước', () => {
  const vt = doiMau();
  assert.deepStrictEqual(V.thuTuGoi(vt, 'CANH_BAO').map((n) => n.ten), ['Lan', 'Minh', 'Hoa']);
  assert.deepStrictEqual(V.thuTuGoi(vt, 'THIET_BI').map((n) => n.ten), ['Minh', 'Lan', 'Hoa']);
  assert.deepStrictEqual(V.thuTuGoi(vt, 'NGAN_HANG').map((n) => n.ten), ['Hoa', 'Lan', 'Minh']);
});

test('⚠️ đã lập đội thì người NGOÀI đội không chen vào thứ tự gọi', () => {
  moiKho();
  let vt = V.docVongTron();
  vt = V.themVaoDoi(vt, '1726000000003').vongTron;
  assert.deepStrictEqual(V.thuTuGoi(vt, 'CANH_BAO').map((n) => n.ten), ['Hoa']);
});

test('chưa lập đội → giữ hành vi cũ: gọi theo thứ tự danh sách người thân', () => {
  moiKho();
  assert.deepStrictEqual(V.thuTuGoi(V.docVongTron(), 'NGAN_HANG').map((n) => n.ten), ['Lan', 'Minh', 'Hoa']);
});

test('người không có số điện thoại bị bỏ qua — nút gọi không số là nút hỏng', () => {
  moiKho({ familyMembers: JSON.stringify([{ ...APP[0], phone: '  ' }, APP[1]]) });
  let vt = V.docVongTron();
  vt = V.themVaoDoi(vt, '1726000000001').vongTron;
  vt = V.themVaoDoi(vt, '1726000000002').vongTron;
  assert.deepStrictEqual(V.thuTuGoi(vt, 'CANH_BAO').map((n) => n.ten), ['Minh']);
});

test('tình huống: lỡ mất tiền ưu tiên ngân hàng; ứng dụng lạ hoặc tín hiệu DEV_ → thiết bị', () => {
  assert.strictEqual(V.tinhHuongGoi({ dangPhucHoi: true, coUngDungDangNgo: true }), 'NGAN_HANG');
  assert.strictEqual(V.tinhHuongGoi({ coUngDungDangNgo: true }), 'THIET_BI');
  assert.strictEqual(V.tinhHuongGoi({ maLyDo: ['ID_AUTHORITY_IMPERSONATION', 'DEV_INSTALL_APK_UNKNOWN'] }), 'THIET_BI');
  assert.strictEqual(V.tinhHuongGoi({ maLyDo: ['CRED_OTP_SHARE'] }), 'CANH_BAO');
  assert.strictEqual(V.tinhHuongGoi({}), 'CANH_BAO');
});

test('đội KHÔNG chạm vào mức rủi ro — backend không import thư viện này', () => {
  const quet = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? quet(p) : (/\.js$/.test(e.name) ? [p] : []);
  });
  const vi = quet(path.join(GOC, 'backend', 'src'))
    .filter((p) => fs.readFileSync(p, 'utf8').includes('vong-tron-gia-dinh'));
  assert.deepStrictEqual(vi, []);
});
