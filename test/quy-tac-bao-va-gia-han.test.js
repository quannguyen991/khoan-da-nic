'use strict';
/**
 * PHẦN 2 "CON CHÁU CÀI GIÚP" — 23/9/2026.
 * ① Quy tắc "báo cho con": lưu ở máy chủ, MẶC ĐỊNH TẮT, CHỈ chủ tài khoản đặt (§12).
 * ② Gia hạn phiên: phiên sống 30 ngày; hết là cảnh báo cho con LẶNG LẼ tắt (§4.3).
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

test('quy tắc báo: mặc định TẮT, chủ tài khoản bật được, người khác không đụng được', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const a = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-a1', ten: 'A thử' });
    const b = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-b1', ten: 'B thử' });
    assert.strictEqual(a.s, 200); assert.strictEqual(b.s, 200);

    const macDinh = await goi('GET', '/api/gia-dinh/quy-tac-bao', null, a.j.token);
    assert.strictEqual(macDinh.s, 200, `route chưa có: ${macDinh.s}`);
    assert.deepStrictEqual(macDinh.j, { baoKhiCao: false, baoKhiOtpTrongCuocGoi: false, choConXemBaoVe: false }, '§12 — không tự bật báo thay chủ tài khoản');

    const dat = await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true, baoKhiOtpTrongCuocGoi: false }, a.j.token);
    assert.strictEqual(dat.s, 200);
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao', null, a.j.token)).j.baoKhiCao, true);
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao', null, b.j.token)).j.baoKhiCao, false,
      'quy tắc của A không được lan sang B');

    assert.strictEqual((await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: 'co' }, a.j.token)).s, 400, 'chỉ nhận true/false');
    assert.strictEqual((await goi('GET', '/api/gia-dinh/quy-tac-bao')).s, 401);
  } finally { sv.close(); }
});

test('gia hạn phiên: cấp token mới, token cũ bị huỷ', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const a = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-c1', ten: 'C thử' });
    assert.strictEqual(a.s, 200);
    const moi = await goi('POST', '/api/tai-khoan/gia-han', {}, a.j.token);
    assert.strictEqual(moi.s, 200, `route chưa có: ${moi.s}`);
    assert.ok(moi.j.token && moi.j.token !== a.j.token);
    assert.ok(moi.j.hetHanLuc > Date.now() + 29 * 24 * 3600 * 1000);
    assert.strictEqual((await goi('GET', '/api/tai-khoan/toi', null, moi.j.token)).s, 200);
    assert.strictEqual((await goi('GET', '/api/tai-khoan/toi', null, a.j.token)).s, 401,
      'token cũ phải chết — hai token sống song song là nhân đôi chỗ rò');
    assert.strictEqual((await goi('POST', '/api/tai-khoan/gia-han', {})).s, 401);
  } finally { sv.close(); }
});
