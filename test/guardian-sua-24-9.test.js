'use strict';
/**
 * GUARDIAN — BA LỖ TÌM RA KHI CHẠY THỬ ĐẦU-CUỐI 24/9/2026.
 *
 *   ① `nhan` của báo động nhận MỌI chuỗi → nội dung tin (OTP, số tài khoản) tới
 *     được máy con. §6.9: không nội dung tin nhắn nào rời máy bố mẹ.
 *   ② `GET /api/proof/yeu-cau/:id` không kiểm vòng ghép → người lạ và người con
 *     ĐÃ BỊ THU HỒI vẫn đọc được yêu cầu (chủ tài khoản, vụ việc, cụm từ).
 *   ③ Không `trust proxy` → sau proxy của Render mọi người dùng chung một hạn mức.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
process.env.VAPID_PUBLIC_KEY = 'BTEST_cong_khai';
process.env.VAPID_PRIVATE_KEY = 'test_rieng_tu';
process.env.VAPID_SUBJECT = 'https://khoan-da.test';

const { app } = require('../backend/server');

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

async function dungNha(goi) {
  const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-me', ten: 'Bác Lan thử' });
  const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-con', ten: 'Minh thử' });
  const la = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-la', ten: 'Người lạ' });
  const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
  await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
  return { me: me.j.token, con: con.j.token, la: la.j.token, conId: con.j.hoSo?.id };
}

test('① báo động chỉ mang MÃ nhãn — chữ tự do (OTP, số tài khoản) không tới được máy con', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: { endpoint: 'https://push.test/may-con-sua', keys: { p256dh: 'p', auth: 'a' } }, lang: 'vi' }, n.con);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiOtpTrongCuocGoi: true }, n.me);
    const bi = 'Mã OTP 482913 chuyển vào STK 0123456789';
    const bd = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'otp_trong_cuoc_goi', nhan: bi }, n.me);
    assert.strictEqual(bd.s, 200);
    assert.ok(bd.j.suKienId, `không tạo sự kiện: ${JSON.stringify(bd.j)}`);
    const ev = await goi('GET', `/api/gia-dinh/su-kien/${bd.j.suKienId}`, null, n.con);
    assert.strictEqual(ev.s, 200);
    const tho = JSON.stringify(ev.j);
    assert.ok(!tho.includes('482913') && !tho.includes('0123456789'), `nội dung tin lọt sang máy con: ${tho}`);
    assert.strictEqual(ev.j.nhan ?? null, null);
    for (const l of luotGui) assert.ok(!JSON.stringify(l.payload).includes('482913'), 'nội dung tin lọt vào push');
  } finally { sv.close(); }
});

test('① nhãn hợp lệ vẫn đi qua: CAO', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true }, n.me);
    const bd = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' }, n.me);
    assert.strictEqual(bd.s, 200);
    const ev = await goi('GET', `/api/gia-dinh/su-kien/${bd.j.suKienId}`, null, n.con);
    assert.strictEqual(ev.j.nhan, 'CAO');
  } finally { sv.close(); }
});

test('② yêu cầu xác nhận: chủ và người con đọc được; người lạ và người đã bị thu hồi nhận 404', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    const yc = await goi('POST', '/api/proof/yeu-cau/tao', {
      caseId: 'vu-thu', khoangTien: 'duoi_5_trieu', hanhDong: 'chuyen_tien', nguoiYeuCau: 'nguoi_la',
    }, n.me);
    assert.strictEqual(yc.s, 200, `không tạo được yêu cầu: ${JSON.stringify(yc.j)}`);
    const id = yc.j.yeuCauId;
    assert.strictEqual((await goi('GET', `/api/proof/yeu-cau/${id}`, null, n.me)).s, 200, 'chủ tài khoản phải đọc được');
    assert.strictEqual((await goi('GET', `/api/proof/yeu-cau/${id}`, null, n.con)).s, 200, 'người con trong vòng ghép phải đọc được');
    const la = await goi('GET', `/api/proof/yeu-cau/${id}`, null, n.la);
    assert.strictEqual(la.s, 404, `người lạ đọc được yêu cầu: ${JSON.stringify(la.j)}`);
    await goi('POST', '/api/proof/thu-hoi', { thanhVienId: n.conId }, n.me);
    assert.strictEqual((await goi('GET', `/api/proof/yeu-cau/${id}`, null, n.con)).s, 404, 'người con đã bị thu hồi vẫn đọc được');
  } finally { sv.close(); }
});

test('③ sau proxy của Render mới tin đúng MỘT lớp proxy; chạy thẳng thì không tin', () => {
  const nguon = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  assert.match(nguon, /if \(process\.env\.RENDER \|\| process\.env\.KHOAN_DA_SAU_PROXY === '1'\) app\.set\('trust proxy', 1\);/);
  assert.ok(!/app\.set\('trust proxy', true\)/.test(nguon), "'trust proxy' true là tin MỌI proxy — ai cũng tự khai IP được");
  if (!process.env.RENDER && process.env.KHOAN_DA_SAU_PROXY !== '1') assert.strictEqual(app.get('trust proxy'), false);
});
