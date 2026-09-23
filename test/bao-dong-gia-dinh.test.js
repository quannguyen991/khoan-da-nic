'use strict';
/**
 * PHẦN 3 "CẦU DAO GIA ĐÌNH" — CẢNH BÁO THẬT TỚI MÁY CON (23/9/2026).
 *
 * Đo trước hôm nay: con cháu KHÔNG nhận được gì từ hệ thống. `push.js` có đủ
 * đường nhưng không ai cắm nhà cung cấp; `/api/canh-bao-nguoi-than` chỉ dựng
 * payload rồi trả về.
 *
 * Test chạy qua HTTP thật; chỉ BỘ GỬI là giả (ghi lại từng lượt), để không bắn
 * push ra mạng từ bộ test. Thư viện mã hoá thật được kiểm ở test riêng.
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
// Khoá VAPID giả cho test — `push.js` chỉ cần "đã cấu hình"; bộ gửi giả không dùng tới.
process.env.VAPID_PUBLIC_KEY = 'BTEST_cong_khai';
process.env.VAPID_PRIVATE_KEY = 'test_rieng_tu';
process.env.VAPID_SUBJECT = 'https://khoan-da.test';

const { app } = require('../backend/server');

const luotGui = [];
let henDaBat = [];
app.set('guiPushThay', async ({ dangKy, payload }) => { luotGui.push({ endpoint: dangKy.endpoint, payload }); return { ok: true, status: 201 }; });
app.set('henGioThay', (fn) => { henDaBat.push(fn); return 0; });

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
const DK_GIA = { endpoint: 'https://push.test/may-con-1', keys: { p256dh: 'p256dh-gia', auth: 'auth-gia' } };

async function dungNha(goi) {
  const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-me', ten: 'Bác Lan thử' });
  const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-con', ten: 'Minh thử' });
  const la = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-la', ten: 'Người lạ' });
  const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
  await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
  return { me: me.j.token, con: con.j.token, la: la.j.token };
}

test('trọn luồng: quy tắc tắt thì im, bật thì gửi đúng MÃ; gộp 30 giây; chỉ mức CAO', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    const dk = await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: DK_GIA, lang: 'vi' }, n.con);
    assert.strictEqual(dk.s, 200, `route nhận cảnh báo chưa có: ${dk.s}`);

    luotGui.length = 0;
    const tat = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO', hoKichBan: 'gia_danh_cong_an' }, n.me);
    assert.deepStrictEqual(tat.j, { gui: false, lyDo: 'CHUA_BAT_QUY_TAC' }, '§12 — chưa bật quy tắc thì KHÔNG báo');
    assert.strictEqual(luotGui.length, 0);

    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true }, n.me);
    const bd = await goi('POST', '/api/gia-dinh/bao-dong',
      { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO', hoKichBan: 'gia_danh_cong_an', vanBan: 'MẬT_KHẨU_BÍ_MẬT_123' }, n.me);
    assert.strictEqual(bd.s, 200);
    assert.strictEqual(bd.j.gui, true);
    assert.deepStrictEqual(bd.j.ketQua, [{ ten: 'Minh thử', trangThai: 'DA_DAY_DI' }]);
    assert.strictEqual(luotGui.length, 1);
    const p = luotGui[0].payload;
    assert.ok(p.tieuDe && p.noiDung, 'máy chủ phải soạn sẵn chữ (sw.js không tự soạn — §4.1)');
    assert.strictEqual(p.khan, true);
    assert.match(p.duong, /view=guardian&canhBao=/);
    assert.ok(!JSON.stringify(p).includes('MẬT_KHẨU_BÍ_MẬT_123'), '§6.9 — nội dung tin nhắn KHÔNG được đi theo');
    assert.ok(!/đã thấy|đã đọc|an toàn/i.test(JSON.stringify(p)), '§11');

    const lai = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' }, n.me);
    assert.strictEqual(lai.j.lyDo, 'DA_GOP', 'bấm kiểm liên tục không được dội thông báo vào máy con');
    assert.strictEqual(luotGui.length, 1);

    const nghiNgo = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'NGHI_NGO' }, n.me);
    assert.strictEqual(nghiNgo.j.gui, false, 'quy tắc là "nguy hiểm cao" — mức khác không báo');

    assert.strictEqual((await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'la_lung' }, n.me)).s, 400);
    const tt = await goi('GET', '/api/gia-dinh/tinh-trang-bao', null, n.me);
    assert.deepStrictEqual(tt.j.thanhVien.map((x) => [x.ten, x.coDangKy]), [['Minh thử', true]]);
  } finally { sv.close(); }
});

test('hai chiều + leo thang: 60 giây không ai phản ứng thì báo lần hai; đã phản ứng thì thôi', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: { ...DK_GIA, endpoint: 'https://push.test/may-con-2' }, lang: 'en' }, n.con);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true, baoKhiOtpTrongCuocGoi: true }, n.me);

    henDaBat = [];
    luotGui.length = 0;
    const a = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' }, n.me);
    assert.strictEqual(henDaBat.length, 1, 'phải hẹn giờ leo thang');
    assert.match(luotGui[0].payload.noiDung, /[A-Za-z]/, 'máy con đặt tiếng Anh thì nhận tiếng Anh');

    // Con đọc được sự kiện; người lạ thì không.
    assert.strictEqual((await goi('GET', `/api/gia-dinh/su-kien/${a.j.suKienId}`, null, n.con)).s, 200);
    assert.strictEqual((await goi('GET', `/api/gia-dinh/su-kien/${a.j.suKienId}`, null, n.la)).s, 403);

    await henDaBat[0]();
    assert.strictEqual(luotGui.length, 2, 'chưa ai phản ứng ⇒ báo lần hai');

    // Sự kiện thứ hai (loại khác nên không bị gộp): bố mẹ bấm gọi trước khi hết giờ.
    henDaBat = [];
    const b = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'otp_trong_cuoc_goi' }, n.me);
    assert.strictEqual(b.j.gui, true);
    const truoc = luotGui.length;
    const cn = await goi('POST', '/api/gia-dinh/trang-thai', { suKienId: b.j.suKienId, hanhDong: 'bam_goi_nguoi_than' }, n.me);
    assert.strictEqual(cn.s, 200);
    assert.strictEqual(luotGui.length, truoc + 1, 'con được báo "đã bấm gọi" (thông báo nhẹ)');
    assert.strictEqual(luotGui[luotGui.length - 1].payload.khan, false);
    await henDaBat[0]();
    assert.strictEqual(luotGui.length, truoc + 1, 'đã có phản ứng ⇒ KHÔNG báo lần hai');

    assert.strictEqual((await goi('POST', '/api/gia-dinh/trang-thai', { suKienId: b.j.suKienId, hanhDong: 'la_lung' }, n.me)).s, 400);
    assert.strictEqual((await goi('POST', `/api/gia-dinh/su-kien/${a.j.suKienId}/con-da-goi`, {}, n.con)).s, 200);
    assert.strictEqual((await goi('POST', `/api/gia-dinh/su-kien/${a.j.suKienId}/con-da-goi`, {}, n.la)).s, 403);
    assert.strictEqual((await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' })).s, 401);
  } finally { sv.close(); }
});
