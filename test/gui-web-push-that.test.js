'use strict';
/**
 * BỘ GỬI WEB PUSH THẬT — Phần 3, 23/9/2026.
 *
 * `bao-dong-gia-dinh.test.js` dùng bộ gửi GIẢ để không bắn push ra mạng. Test này
 * kiểm phần còn lại: thư viện `web-push` THẬT mã hoá (aes128gcm) và ký VAPID với
 * ĐÚNG bộ tuỳ chọn hàm gửi dùng, và hàm gửi đọc đúng kết cục 201 / 410.
 *
 * ⚠️ Vì sao không dựng "dịch vụ push giả" bằng HTTP: `web-push` luôn gọi HTTPS
 * (đo 23/9: endpoint `http://` ra lỗi TLS "wrong version number"). Nên phần mật
 * mã kiểm qua `generateRequestDetails`, phần kết cục kiểm bằng cách thay tạm hàm
 * gửi mạng. Đường mạng thật được thử trên bản đã deploy.
 */
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');
const webpush = require('web-push');
const { guiThatWebPush, tuyChonGui } = require('../backend/src/gui-web-push');

function dangKyGia() {
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  return {
    endpoint: 'https://push.test/may-con',
    keys: { p256dh: ecdh.getPublicKey('base64url'), auth: crypto.randomBytes(16).toString('base64url') },
  };
}

const VAPID = (() => {
  const k = webpush.generateVAPIDKeys();
  return { lienHe: 'https://khoan-da.test', congKhai: k.publicKey, riengTu: k.privateKey };
})();

const PAYLOAD = { tieuDe: 'Khoan Đã — Bác Lan đang cần con', noiDung: 'Bác Lan đang gặp tình huống nguy hiểm cao. Gọi ngay.', khan: true };

test('bản tin THẬT: mã hoá aes128gcm, ký VAPID, TTL 600, ưu tiên cao, không lộ chữ rõ', () => {
  const dk = dangKyGia();
  const ct = webpush.generateRequestDetails(dk, JSON.stringify(PAYLOAD), tuyChonGui(PAYLOAD, VAPID));
  assert.strictEqual(ct.endpoint, dk.endpoint);
  assert.strictEqual(ct.headers['Content-Encoding'], 'aes128gcm');
  assert.match(ct.headers.Authorization, /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/);
  assert.strictEqual(String(ct.headers.TTL), '600');
  assert.strictEqual(ct.headers.Urgency, 'high', 'báo động khẩn phải đi đường ưu tiên cao');
  assert.ok(Buffer.isBuffer(ct.body) && ct.body.length > 0);
  assert.ok(!ct.body.toString('utf8').includes('Bác Lan'), 'thân gửi đi phải là bản MÃ HOÁ, không phải chữ rõ');

  // JWT của VAPID: `aud` là gốc của endpoint, `sub` là URL của app — KHÔNG phải email người dùng.
  const jwt = /vapid t=([^,]+)/.exec(ct.headers.Authorization)[1];
  const than = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
  assert.strictEqual(than.aud, 'https://push.test');
  assert.strictEqual(than.sub, 'https://khoan-da.test');
  assert.ok(!/@/.test(than.sub), 'VAPID_SUBJECT đi ra dịch vụ push bên thứ ba — không dùng email cá nhân');
});

test('cập nhật trạng thái (không khẩn) đi ưu tiên thường', () => {
  const ct = webpush.generateRequestDetails(dangKyGia(), JSON.stringify({ ...PAYLOAD, khan: false }), tuyChonGui({ khan: false }, VAPID));
  assert.strictEqual(ct.headers.Urgency, 'normal');
});

test('kết cục: 201 ⇒ ok; 410 (máy con đã gỡ) ⇒ {ok:false, status:410}, không ném', async () => {
  const goc = webpush.sendNotification;
  try {
    webpush.sendNotification = async () => ({ statusCode: 201 });
    assert.deepStrictEqual(await guiThatWebPush({ dangKy: dangKyGia(), payload: PAYLOAD, vapid: VAPID }), { ok: true, status: 201 });

    webpush.sendNotification = async () => { const e = new Error('gone'); e.statusCode = 410; e.body = 'push subscription has unsubscribed or expired'; throw e; };
    const kq = await guiThatWebPush({ dangKy: dangKyGia(), payload: PAYLOAD, vapid: VAPID });
    assert.strictEqual(kq.ok, false);
    assert.strictEqual(kq.status, 410);
  } finally {
    webpush.sendNotification = goc;
  }
});
