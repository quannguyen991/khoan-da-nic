'use strict';
/**
 * MÁY CON DÙNG APK NHẬN BÁO ĐỘNG — FCM HTTP v1. 24/9/2026.
 *
 * Trước ngày này: `nhan-canh-bao` ép token FCM qua khuôn Web Push (400), máy chủ
 * không có bộ gửi FCM nào, và cấu hình đọc `FCM_SERVER_KEY` của API cũ Google đã
 * tắt 6/2024. Máy con dùng APK KHÔNG BAO GIỜ nhận được báo động.
 */
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
process.env.VAPID_PUBLIC_KEY = 'BTEST_cong_khai';
process.env.VAPID_PRIVATE_KEY = 'test_rieng_tu';
process.env.VAPID_SUBJECT = 'https://khoan-da.test';

const { layCauHinhFcm, guiCanhBao, TRANG_THAI_GUI } = require('../backend/src/push');
const F = require('../backend/src/gui-fcm');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const PEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const TK = { project_id: 'khoan-da-thu', client_email: 'fcm@khoan-da-thu.iam.gserviceaccount.com', private_key: PEM };
const TOKEN_MAY = 'fVx9K2mQ:APA91bH-token-may-con-gia-lap';

function fetchGia(traLoiGui = () => ({ status: 200, body: { name: 'projects/x/messages/1' } })) {
  const goi = [];
  const f = async (url, opt) => {
    goi.push({ url, opt });
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'ya29.token-truy-cap', expires_in: 3600 }) };
    }
    const { status, body } = traLoiGui(goi.length);
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
  return { f, goi };
}

// ─────────── Cấu hình ───────────

test('cấu hình: khoá API cũ (FCM_SERVER_KEY) KHÔNG được coi là đã cấu hình', () => {
  assert.strictEqual(layCauHinhFcm({ FCM_SERVER_KEY: 'AAAA-khoa-cu' }).daCauHinh, false);
});

test('cấu hình: nhận JSON thô, nhận base64, và khôi phục "\\n" thành xuống dòng', () => {
  const tho = layCauHinhFcm({ FCM_SERVICE_ACCOUNT: JSON.stringify(TK) });
  assert.strictEqual(tho.daCauHinh, true);
  assert.strictEqual(tho.projectId, 'khoan-da-thu');
  const b64 = layCauHinhFcm({ FCM_SERVICE_ACCOUNT: Buffer.from(JSON.stringify(TK)).toString('base64') });
  assert.strictEqual(b64.daCauHinh, true);
  const motDong = layCauHinhFcm({ FCM_SERVICE_ACCOUNT: JSON.stringify({ ...TK, private_key: PEM.replace(/\n/g, '\\n') }) });
  assert.strictEqual(motDong.privateKey, PEM);
  assert.strictEqual(layCauHinhFcm({ FCM_SERVICE_ACCOUNT: '{hỏng' }).daCauHinh, false);
  assert.strictEqual(layCauHinhFcm({ FCM_SERVICE_ACCOUNT: JSON.stringify({ project_id: 'x' }) }).daCauHinh, false);
});

// ─────────── Bộ gửi ───────────

test('bộ gửi: JWT ký RS256 đúng khoá; access token được nhớ đệm; thông điệp đúng khuôn', async () => {
  F._quenToken();
  const { f, goi } = fetchGia();
  const fcm = layCauHinhFcm({ FCM_SERVICE_ACCOUNT: JSON.stringify(TK) });
  const payload = { tieuDe: 'Bác Lan cần con', noiDung: 'Bác vừa gặp một tin nguy hiểm cao.', khan: true, ma: 'canh-bao-1', duong: '/?view=guardian&canhBao=1', lang: 'vi' };

  const kq = await F.guiThatFcmV1({ dangKy: { loai: 'native', token: TOKEN_MAY }, payload, fcm }, { fetchFn: f });
  assert.deepStrictEqual(kq, { ok: true, status: 200 });

  const lay = goi[0];
  const assertion = new URLSearchParams(lay.opt.body).get('assertion');
  const [dau, than, ky] = assertion.split('.');
  assert.ok(crypto.createVerify('RSA-SHA256').update(`${dau}.${than}`).verify(publicKey, Buffer.from(ky, 'base64url')), 'chữ ký JWT không hợp lệ');
  const c = JSON.parse(Buffer.from(than, 'base64url').toString());
  assert.strictEqual(c.iss, TK.client_email);
  assert.strictEqual(c.scope, 'https://www.googleapis.com/auth/firebase.messaging');

  const gui = goi[1];
  assert.strictEqual(gui.url, 'https://fcm.googleapis.com/v1/projects/khoan-da-thu/messages:send');
  assert.strictEqual(gui.opt.headers.authorization, 'Bearer ya29.token-truy-cap');
  const m = JSON.parse(gui.opt.body).message;
  assert.strictEqual(m.token, TOKEN_MAY);
  assert.strictEqual(m.notification.title, payload.tieuDe);
  assert.strictEqual(m.data.duong, payload.duong);
  assert.strictEqual(m.data.khan, 'true', 'FCM chỉ nhận data dạng chuỗi');
  assert.strictEqual(m.android.priority, 'HIGH');
  assert.strictEqual(m.android.notification.channel_id, F.KENH_CANH_BAO);

  await F.guiThatFcmV1({ dangKy: { loai: 'native', token: TOKEN_MAY }, payload, fcm }, { fetchFn: f });
  assert.strictEqual(goi.filter((g) => g.url.startsWith('https://oauth2')).length, 1, 'không nhớ đệm access token');
});

test('bộ gửi: token máy con đã chết (404 UNREGISTERED) ⇒ push.js xếp là HẾT HẠN, gỡ khỏi danh sách', async () => {
  F._quenToken();
  const { f } = fetchGia(() => ({ status: 404, body: { error: { status: 'NOT_FOUND', details: [{ '@type': 'type.googleapis.com/google.firebase.fcm.v1.FcmError', errorCode: 'UNREGISTERED' }] } } }));
  const env = { FCM_SERVICE_ACCOUNT: JSON.stringify(TK) };
  const kq = await guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN_MAY }, payload: { tieuDe: 'x' }, env,
    guiThatNative: (o) => F.guiThatFcmV1(o, { fetchFn: f }),
  });
  assert.strictEqual(kq.trangThai, TRANG_THAI_GUI.het_han_dang_ky);
});

test('bộ gửi: Google từ chối cấp access token ⇒ KHÔNG xác nhận được, không giả thành công, không lộ token máy', async () => {
  F._quenToken();
  const f = async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant' }) });
  const kq = await guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN_MAY }, payload: {}, env: { FCM_SERVICE_ACCOUNT: JSON.stringify(TK) },
    guiThatNative: (o) => F.guiThatFcmV1(o, { fetchFn: f }),
  });
  assert.strictEqual(kq.trangThai, TRANG_THAI_GUI.khong_xac_nhan_duoc);
  assert.ok(!String(kq.chiTiet).includes(TOKEN_MAY));
});

// ─────────── Trọn luồng qua HTTP ───────────

const { app } = require('../backend/server');

test('trọn luồng: máy con APK đăng ký token → bố mẹ báo động → bộ gửi FCM được gọi; tắt bằng token thì thôi', async () => {
  const luotNative = [];
  app.set('guiNativeThay', async ({ dangKy, payload }) => { luotNative.push({ token: dangKy.token, payload }); return { ok: true, status: 200 }; });
  app.set('guiPushThay', async () => ({ ok: true, status: 201 }));
  app.set('henGioThay', () => 0);
  const envCu = process.env.FCM_SERVICE_ACCOUNT;
  process.env.FCM_SERVICE_ACCOUNT = JSON.stringify(TK);

  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (method, duong, body, token) => {
    const r = await fetch(goc + duong, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  const so = (d) => `${d}${String(Date.now()).slice(-7)}`;
  try {
    const me = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: so('091'), matKhau: 'mk-me-fcm', ten: 'Bác Lan thử' })).j.token;
    const con = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: so('098'), matKhau: 'mk-con-fcm', ten: 'Minh thử' })).j.token;
    const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me);
    await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con);

    const dk = await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: { loai: 'native', token: TOKEN_MAY }, lang: 'vi' }, con);
    assert.strictEqual(dk.s, 200, `máy con APK không đăng ký được: ${JSON.stringify(dk.j)}`);

    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true }, me);
    const bd = await goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' }, me);
    assert.strictEqual(bd.s, 200);
    assert.deepStrictEqual(bd.j.ketQua.map((k) => k.trangThai), ['DA_DAY_DI']);
    assert.strictEqual(luotNative.length, 1, 'bộ gửi FCM không được gọi');
    assert.strictEqual(luotNative[0].token, TOKEN_MAY);
    assert.match(luotNative[0].payload.duong, /view=guardian/);

    const suc = await goi('GET', '/api/suc-khoe');
    assert.strictEqual(suc.j.fcmCauHinh, true);

    await goi('POST', '/api/gia-dinh/nhan-canh-bao/tat', { endpoint: TOKEN_MAY }, con);
    const tt = await goi('GET', '/api/gia-dinh/tinh-trang-bao', null, me);
    assert.strictEqual(tt.j.thanhVien[0].coDangKy, false, 'tắt bằng token FCM không gỡ được máy');
  } finally {
    sv.close();
    app.set('guiNativeThay', undefined);
    if (envCu === undefined) delete process.env.FCM_SERVICE_ACCOUNT; else process.env.FCM_SERVICE_ACCOUNT = envCu;
  }
});
