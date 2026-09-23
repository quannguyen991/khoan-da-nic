'use strict';
/**
 * "MÁY BỐ MẸ CÒN ĐƯỢC BẢO VỆ KHÔNG?" — nhịp báo về (23/9/2026). Test qua HTTP thật.
 *
 * Canh: mặc định TẮT (§12), bác tắt là XOÁ, chỉ nhận đúng hình dạng mã + bool (không
 * nội dung, không vị trí), chỉ người đã ghép mới thấy, và máy chủ không tự suy "an toàn".
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

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

const NHIP = { nguon: 'dich_vu_nen', laApk: true, quyen: { docThongBao: true, theoDoiCuocGoi: true, hienTrenApp: false } };

test('trọn luồng: mặc định không nhận → bác bật → máy con thấy trạng thái → bác tắt là xoá', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const me = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-me', ten: 'Bác Lan thử' })).j.token;
    const con = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-con', ten: 'Minh thử' })).j.token;
    const la = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-la', ten: 'Người lạ' })).j.token;
    const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me);
    await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con);

    // §12 — mặc định TẮT: máy báo về cũng không lưu gì.
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao', null, me)).j.choConXemBaoVe, false);
    assert.deepStrictEqual((await goi('POST', '/api/gia-dinh/nhip-bao-ve', NHIP, me)).j, { ghi: false, lyDo: 'CHUA_BAT' });
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/nhip-bao-ve/bo-me', null, con)).j.boMe,
      [{ tenBoMe: 'Bác Lan thử', choXem: false, nhip: null }]);

    // Bác bật: chưa báo về lần nào thì là "chưa có", KHÔNG phải "đang bảo vệ".
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { choConXemBaoVe: true }, me);
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/nhip-bao-ve/bo-me', null, con)).j.boMe[0], { tenBoMe: 'Bác Lan thử', choXem: true, nhip: null });

    assert.deepStrictEqual((await goi('POST', '/api/gia-dinh/nhip-bao-ve', NHIP, me)).j, { ghi: true });
    const bm = (await goi('GET', '/api/gia-dinh/nhip-bao-ve/bo-me', null, con)).j.boMe[0];
    assert.strictEqual(bm.choXem, true);
    assert.deepStrictEqual(bm.nhip.quyen, NHIP.quyen);
    assert.strictEqual(bm.nhip.nguon, 'dich_vu_nen');
    assert.ok(Math.abs(bm.nhip.luc - Date.now()) < 60_000);
    assert.ok(!('an_toan' in bm) && !('dangBaoVe' in bm), '§4.3 — máy chủ không tự suy "đang được bảo vệ"');

    // Người ngoài vòng không thấy gì của nhà này.
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/nhip-bao-ve/bo-me', null, la)).j.boMe, []);

    // Bác tắt ⇒ xoá; bật lại thì phải báo về mới, không hiện lại bản cũ.
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { choConXemBaoVe: false }, me);
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/nhip-bao-ve/bo-me', null, con)).j.boMe[0].nhip, null);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { choConXemBaoVe: true }, me);
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/nhip-bao-ve/bo-me', null, con)).j.boMe[0].nhip, null, 'bản cũ phải đã bị xoá');
  } finally { sv.close(); }
});

test('chỉ nhận đúng hình dạng mã + bool: thêm trường nào là từ chối (không nội dung, không vị trí)', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const me = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('094'), matKhau: 'mat-khau-me', ten: 'Bác Hai thử' })).j.token;
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { choConXemBaoVe: true }, me);
    const sai = [
      { ...NHIP, viTri: '21.02,105.8' },
      { ...NHIP, noiDung: 'Ma OTP 123456' },
      { ...NHIP, quyen: { ...NHIP.quyen, pin: 80 } },
      { ...NHIP, quyen: { docThongBao: 'bat' } },
      { ...NHIP, nguon: 'tu_bia' },
      { nguon: 'mo_app', quyen: NHIP.quyen },
    ];
    for (const vao of sai) {
      const r = await goi('POST', '/api/gia-dinh/nhip-bao-ve', vao, me);
      assert.strictEqual(r.s, 400, JSON.stringify(vao));
      assert.strictEqual(r.j.maLoi, 'NHIP_KHONG_HOP_LE');
    }
    // Bản web: không có quyền native nào để báo — null, không phải false.
    assert.strictEqual((await goi('POST', '/api/gia-dinh/nhip-bao-ve', { nguon: 'mo_app', laApk: false, quyen: {} }, me)).s, 200);
    assert.strictEqual((await goi('POST', '/api/gia-dinh/nhip-bao-ve', NHIP)).s, 401, 'phải đăng nhập');
  } finally { sv.close(); }
});

test('hàm thuần: chuẩn hoá điền null cho quyền không báo, không đoán', () => {
  const NBV = require('../backend/src/nhip-bao-ve');
  assert.deepStrictEqual(NBV.chuanHoa({ nguon: 'mo_app', laApk: false, quyen: {} }).quyen,
    { docThongBao: null, theoDoiCuocGoi: null, hienTrenApp: null });
});
