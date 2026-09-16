'use strict';
/**
 * VÒNG TRÒN GIA ĐÌNH — LƯỢC ĐỒ, DI TRÚ, CHỌN QUY TẮC.
 *
 * VÌ SAO CẦN TEST NÀY:
 *
 * Dữ liệu gia đình trước nay nằm rải trong `App.tsx` dưới dạng `localStorage`
 * thô, không lược đồ, không phiên bản. Hai lỗi đã biết của dạng lưu đó:
 *
 *  1. Đọc JSON hỏng thì ném, và ném trong lúc dựng state nghĩa là MÀN TRẮNG.
 *     Người dùng mất luôn cả ứng dụng, không chỉ mất danh sách người thân.
 *  2. Đổi hình dạng dữ liệu mà không di trú thì danh sách người thân biến mất
 *     im lặng. Với sản phẩm này, mất danh sách người thân nghĩa là nút "gọi
 *     con" không còn ai để gọi — đúng lúc cần nó nhất.
 *
 * ⚠️ `chonQuyTac` PHẢI trả `null` êm khi chưa có quy tắc nào. Phần lớn người
 * dùng ở trạng thái đó trong lần dùng đầu; biến nó thành ngoại lệ là biến trạng
 * thái thường gặp nhất thành lỗi.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const THU_MUC_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron');
const TEP_GOI = path.join(THU_MUC_GOI, 'vong-tron.cjs');

/** Gói module TS thành CJS để `require` được — cùng lối với man-hinh-khong-trang. */
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

/** localStorage giả, đủ dùng: getItem / setItem / removeItem. */
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
    Object.defineProperty(globalThis, 'localStorage', {
      value: kho, configurable: true, writable: true,
    });
  }
}

const V = goi();

test('kho rỗng → vòng tròn rỗng hợp lệ, KHÔNG ném', () => {
  datKho(khoLuuGia());
  const vt = V.docVongTron();
  assert.equal(vt.phienBan, V.PHIEN_BAN);
  assert.deepEqual(vt.nguoiThan, []);
  assert.deepEqual(vt.quyTac, []);
});

test('dữ liệu hỏng → trả vòng tròn rỗng, KHÔNG ném (màn trắng là lỗi tệ nhất)', () => {
  datKho(khoLuuGia({ khoan_da_vong_tron: '{ đây không phải JSON' }));
  const vt = V.docVongTron();
  assert.deepEqual(vt.nguoiThan, []);
});

test('di trú từ khoá familyMembers cũ — KHÔNG mất người, KHÔNG mất số', () => {
  const cu = JSON.stringify([
    { name: 'Lan', relation: 'con gái', phone: '0900000001' },
    { name: 'Minh', relation: 'con trai', phone: '0900000002' },
  ]);
  const kho = khoLuuGia({ familyMembers: cu });
  datKho(kho);

  const vt = V.docVongTron();
  assert.equal(vt.nguoiThan.length, 2, 'phải giữ đủ hai người');
  assert.equal(vt.nguoiThan[0].ten, 'Lan');
  assert.equal(vt.nguoiThan[0].quanHe, 'con gái');
  assert.equal(vt.nguoiThan[0].dienThoai, '0900000001');
  assert.ok(vt.nguoiThan[0].id, 'mỗi người phải có id');

  // Khoá cũ GIỮ NGUYÊN: bản đang cài vẫn đọc được nếu người dùng quay về bản trước.
  assert.equal(kho.getItem('familyMembers'), cu, 'không được xoá khoá cũ');
});

test('ghi rồi đọc lại ra đúng thứ vừa ghi', () => {
  datKho(khoLuuGia());
  const vt = V.docVongTron();
  vt.nguoiThan.push({ id: 'a1', ten: 'Hoa', quanHe: 'cháu', dienThoai: '0900000003' });
  V.ghiVongTron(vt);

  const lai = V.docVongTron();
  assert.equal(lai.nguoiThan.length, 1);
  assert.equal(lai.nguoiThan[0].ten, 'Hoa');
});

test('tối đa BA quy tắc — danh sách mười điều là danh sách không ai nhớ', () => {
  datKho(khoLuuGia());
  let vt = V.docVongTron();
  for (const ma of ['KHONG_DOC_MA_OTP', 'KHONG_CHUYEN_KHI_DANG_NGHE_MAY', 'KHONG_CAI_UNG_DUNG_LA']) {
    const kq = V.themQuyTac(vt, { ma, cau: `câu ${ma}`, nguoiCungDat: null });
    assert.equal(kq.ok, true);
    vt = kq.vongTron;
  }
  const qua = V.themQuyTac(vt, { ma: 'TUY_CHINH', cau: 'câu thứ tư', nguoiCungDat: null });
  assert.equal(qua.ok, false, 'quy tắc thứ tư phải bị từ chối');
  assert.equal(qua.vongTron.quyTac.length, 3);
});

test('câu quá dài bị cắt về 120 ký tự, không ném', () => {
  datKho(khoLuuGia());
  const vt = V.docVongTron();
  const kq = V.themQuyTac(vt, { ma: 'TUY_CHINH', cau: 'a'.repeat(400), nguoiCungDat: null });
  assert.equal(kq.ok, true);
  assert.ok(kq.vongTron.quyTac[0].cau.length <= 120);
});

test('chọn quy tắc: khớp tiền tố tín hiệu thì ưu tiên', () => {
  const quyTac = [
    { id: '1', ma: 'KHONG_CAI_UNG_DUNG_LA', cau: 'không cài app lạ', nguoiCungDat: null, ngayDat: 1, hopVoi: ['DEV_'] },
    { id: '2', ma: 'KHONG_DOC_MA_OTP', cau: 'không đọc mã', nguoiCungDat: null, ngayDat: 2, hopVoi: ['CRED_'] },
  ];
  const chon = V.chonQuyTac(quyTac, ['ID_AUTHORITY_IMPERSONATION', 'CRED_OTP_SHARE']);
  assert.equal(chon.id, '2');
});

test('chọn quy tắc: nhiều cái cùng khớp thì lấy cái đặt gần đây nhất', () => {
  const quyTac = [
    { id: 'cu', ma: 'TUY_CHINH', cau: 'cũ', nguoiCungDat: null, ngayDat: 100, hopVoi: ['FIN_'] },
    { id: 'moi', ma: 'TUY_CHINH', cau: 'mới', nguoiCungDat: null, ngayDat: 900, hopVoi: ['FIN_'] },
  ];
  assert.equal(V.chonQuyTac(quyTac, ['FIN_TRANSFER_REQUEST']).id, 'moi');
});

test('chọn quy tắc: không cái nào khớp thì vẫn trả quy tắc đầu tiên', () => {
  const quyTac = [
    { id: '1', ma: 'TUY_CHINH', cau: 'câu nhà mình', nguoiCungDat: null, ngayDat: 1, hopVoi: ['DEV_'] },
  ];
  const chon = V.chonQuyTac(quyTac, ['OFF_PRIZE_GIFT']);
  assert.equal(chon.id, '1', 'một câu của gia đình vẫn hơn không có câu nào');
});

test('chọn quy tắc: chưa có quy tắc nào thì trả null ÊM, không ném', () => {
  assert.equal(V.chonQuyTac([], ['FIN_TRANSFER_REQUEST']), null);
  assert.equal(V.chonQuyTac(undefined, undefined), null);
});

test('mẫu quy tắc KHÔNG chứa chữ hiển thị — chữ nằm ở catalog i18n (§HĐ luật 2)', () => {
  const nguon = fs.readFileSync(path.join(GOC, 'src', 'lib', 'vong-tron-gia-dinh.ts'), 'utf8');
  // Dấu tiếng Việt trong module logic = chuỗi hiển thị bị mã cứng.
  // Chú thích thì được phép, nên chỉ soi phần ngoài chú thích.
  const khongChuThich = nguon
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const co = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
  assert.ok(!co.test(khongChuThich),
    'module logic không được chứa chữ tiếng Việt hiển thị — đưa sang catalog i18n');
});
