'use strict';
/**
 * PHẦN 5 "CẦU DAO GIA ĐÌNH" — CHÌA KHOÁ THỨ HAI (23/9/2026).
 *
 * Khoản chuyển lớn tới người nhận mới cần CON xác nhận bằng passkey (Khoan Proof).
 * Test chạy qua HTTP thật, máy passkey GIẢ ở `test/helper/may-xac-thuc-gia`, bộ
 * gửi push GIẢ (không bắn ra mạng).
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
process.env.VAPID_PUBLIC_KEY = 'BTEST_cong_khai';
process.env.VAPID_PRIVATE_KEY = 'test_rieng_tu';
process.env.VAPID_SUBJECT = 'https://khoan-da.test';

const { app } = require('../backend/server');
const KP = require('../backend/src/khoan-proof');
const KY = require('../backend/src/khoan-proof-ky');
const CK = require('../backend/src/chia-khoa-thu-hai');
const { taoMayXacThuc } = require('./helper/may-xac-thuc-gia');

const luotGui = [];
app.set('guiPushThay', async ({ dangKy, payload }) => { luotGui.push({ endpoint: dangKy.endpoint, payload }); return { ok: true, status: 201 }; });
app.set('henGioThay', () => 0);

async function moMayChu() {
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (method, duong, body, token) => {
    const r = await fetch(goc + duong, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  return { sv, goi };
}
let dem = 0;
const soMoi = (dau) => `${dau}${String(Date.now() + (dem += 1)).slice(-7)}`;

test('hàm thuần: chỉ cần xác nhận khi ĐÃ BẬT + người nhận MỚI + khoảng tiền ≥ ngưỡng', () => {
  const bat = { bat: true, nguong: 10 };
  assert.strictEqual(CK.canXacNhan(bat, { khoangTien: '10_20', nguoiNhanMoi: true }), true);
  assert.strictEqual(CK.canXacNhan(bat, { khoangTien: '5_10', nguoiNhanMoi: true }), false);
  assert.strictEqual(CK.canXacNhan(bat, { khoangTien: 'tren_50', nguoiNhanMoi: false }), false, 'người nhận quen thì không');
  assert.strictEqual(CK.canXacNhan({ bat: false, nguong: 5 }, { khoangTien: 'tren_50', nguoiNhanMoi: true }), false, 'chưa bật thì không');
  assert.throws(() => CK.canXacNhan(bat, { khoangTien: '12345000', nguoiNhanMoi: true }), /KHOANG_TIEN_KHONG_HOP_LE/, 'không nhận số tiền chính xác (§6.9)');
  assert.strictEqual(CK.khoangTuSo(12), '10_20');
  assert.strictEqual(CK.khoangTuSo(50), 'tren_50');
  assert.strictEqual(CK.khoangTuSo(4.9), 'duoi_5');
});

test('ĐỀ BÀI GỬI CHO TRÌNH DUYỆT = ĐỀ BÀI ĐEM ĐỐI CHIẾU (lỗi đo 23/9: thư viện mã hoá lại chuỗi)', async () => {
  const y = await KY.taoYeuCau({ chuTaiKhoanId: 'bo-me-de-bai', caseId: 'chia_khoa_x', khoangTien: '10_20', hanhDong: 'chuyen_khoan', nguoiYeuCau: 'nguoi_la' });
  assert.strictEqual(y.challenge, y.tuyChon.challenge,
    'passkey THẬT ký trên tuyChon.challenge; lưu chuỗi khác là mọi chữ ký thật bị từ chối');
});

test('trọn luồng: bố mẹ bật khoá → nhờ con → máy con thấy, ký bằng passkey → bố mẹ thấy "đã ký" + cụm từ', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-me', ten: 'Bác Lan thử' });
    const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-con', ten: 'Minh thử' });
    const la = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-la', ten: 'Người lạ' });

    // Cài đặt: mặc định TẮT, ngưỡng 10 triệu.
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/chia-khoa', null, me.j.token)).j, { bat: false, nguong: 10 });
    assert.strictEqual((await goi('PUT', '/api/gia-dinh/chia-khoa', { nguong: 7 }, me.j.token)).s, 400, 'chỉ 5/10/20/50');
    await goi('PUT', '/api/gia-dinh/chia-khoa', { bat: true, nguong: 10 }, me.j.token);
    const kiem = await goi('POST', '/api/chia-khoa/kiem', { khoangTien: '10_20', nguoiNhanMoi: true }, me.j.token);
    assert.strictEqual(kiem.j.canXacNhan, true);

    // Chưa nối với ai thì không nhờ được.
    const chuaNoi = await goi('POST', '/api/chia-khoa/yeu-cau', { khoangTien: '10_20', hanhDong: 'chuyen_khoan', nguoiYeuCau: 'nguoi_la' }, me.j.token);
    assert.strictEqual(chuaNoi.j.maLoi, 'CHUA_NOI_VOI_AI');

    const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
    await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
    await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: { endpoint: 'https://push.test/con', keys: { p256dh: 'a', auth: 'b' } }, lang: 'vi' }, con.j.token);

    // Con tạo passkey trên máy mình (một lần).
    const mayCon = await taoMayXacThuc(KP.CAU_HINH);
    const dk = await goi('POST', '/api/proof/dang-ky/bat-dau', {}, con.j.token);
    assert.strictEqual((await goi('POST', '/api/proof/dang-ky/xac-nhan', { phanHoi: mayCon.dangKy(dk.j.challenge) }, con.j.token)).s, 200);

    luotGui.length = 0;
    const yc = await goi('POST', '/api/chia-khoa/yeu-cau', { khoangTien: '10_20', hanhDong: 'chuyen_khoan', nguoiYeuCau: 'nguoi_la', soTaiKhoan: '0123456789' }, me.j.token);
    assert.strictEqual(yc.s, 200, JSON.stringify(yc.j));
    assert.strictEqual(luotGui.length, 1, 'máy con phải được báo');
    assert.match(luotGui[0].payload.duong, /view=guardian&xacNhan=/);
    assert.match(luotGui[0].payload.noiDung, /10–20 triệu/);
    assert.ok(!JSON.stringify(luotGui[0].payload).includes('0123456789'), '§6.9 — không số tài khoản');

    const cho = await goi('GET', '/api/chia-khoa/dang-cho', null, con.j.token);
    assert.deepStrictEqual(cho.j.yeuCau.map((x) => [x.yeuCauId, x.tenBoMe, x.khoangTien]), [[yc.j.yeuCauId, 'Bác Lan thử', '10_20']]);
    assert.deepStrictEqual((await goi('GET', '/api/chia-khoa/dang-cho', null, la.j.token)).j.yeuCau, [], 'người ngoài vòng không thấy');
    assert.strictEqual((await goi('GET', `/api/chia-khoa/yeu-cau/${yc.j.yeuCauId}/tuy-chon`, null, la.j.token)).s, 403);

    const tc = await goi('GET', `/api/chia-khoa/yeu-cau/${yc.j.yeuCauId}/tuy-chon`, null, con.j.token);
    assert.strictEqual(tc.j.canDangKy, false);
    const ky = await goi('POST', `/api/proof/yeu-cau/${yc.j.yeuCauId}/ky`,
      { quyetDinh: 'XAC_NHAN', phanHoi: await mayCon.ky(tc.j.tuyChon.challenge) }, con.j.token);
    assert.strictEqual(ky.s, 200, JSON.stringify(ky.j));
    assert.match(ky.j.cumTu, /^[A-Z_]+ \d+$/);

    const tt = await goi('GET', `/api/proof/yeu-cau/${yc.j.yeuCauId}`, null, me.j.token);
    assert.strictEqual(tt.j.trangThai, KY.MA_KET_QUA.DA_KY_XAC_NHAN);
    assert.strictEqual(tt.j.cumTu, ky.j.cumTu, 'hai máy thấy CÙNG một cụm từ để đối chiếu');
    assert.deepStrictEqual((await goi('GET', '/api/chia-khoa/dang-cho', null, con.j.token)).j.yeuCau, [], 'đã ký thì không còn chờ');
  } finally { sv.close(); }
});

test('máy con chưa có passkey ⇒ được mời tạo, không lỗi', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('094'), matKhau: 'mat-khau-me', ten: 'Bác Hai thử' });
    const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('096'), matKhau: 'mat-khau-con', ten: 'Hoa thử' });
    const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
    await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
    const yc = await goi('POST', '/api/chia-khoa/yeu-cau', { khoangTien: 'tren_50', hanhDong: 'rut_tien', nguoiYeuCau: 'khong_ro' }, me.j.token);
    const tc = await goi('GET', `/api/chia-khoa/yeu-cau/${yc.j.yeuCauId}/tuy-chon`, null, con.j.token);
    assert.deepStrictEqual(tc.j, { canDangKy: true });
  } finally { sv.close(); }
});
