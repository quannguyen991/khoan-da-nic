'use strict';
/**
 * HÀNG RÀO CHO MỘT LỖI SẼ NỔ ĐÚNG LÚC CÀI APK — VÀ NỔ IM LẶNG.
 *
 * Bản APK dựng bằng Capacitor chạy trong Android System WebView. Web Push
 * (Push API + sự kiện `push` của service worker) KHÔNG có trong WebView, nên
 * trong APK không tạo được đăng ký dạng `{endpoint, keys:{p256dh, auth}}`.
 * Thứ plugin thông báo native đưa về là MỘT CHUỖI TOKEN FCM.
 *
 * Trước bản vá, `chuanHoaDangKy` ném `DANG_KY_KHONG_HOP_LE` với token đó, và
 * `guiCanhBao` biến lỗi ấy thành `PUSH_DELIVERY_UNKNOWN`. Nhìn log máy chủ:
 * bình thường. Nhìn từ phía bác: cảnh báo cho người thân KHÔNG BAO GIỜ TỚI, và
 * không ai biết vì sao — §9.4 vẫn nói thật, nhưng nói thật về một lỗ mà lẽ ra
 * không nên có.
 *
 * ⚠️ Hai hình dạng đăng ký PHẢI cùng tồn tại: trình duyệt dùng Web Push (VAPID),
 * APK dùng FCM. Không được ép cái này qua khuôn cái kia.
 *
 * ⚠️ Mọi bảo đảm §9.4 / §11 / §6.9 áp cho CẢ HAI đường: không giả lập thành
 * công, không có đích đến nào tên "đã đọc", không để token lọt ra ngoài.
 */

const test = require('node:test');
const assert = require('node:assert');

const P = require('../backend/src/push');

const TOKEN = 'fVx9K2mQ:APA91bH-token-gia-lap-cho-kiem-thu_0123456789';
const ENV_FCM = { FCM_SERVER_KEY: 'khoa-may-chu-gia-lap' };

// ═══════════ Lỗ đã gây ra bản vá này ═══════════

test('APK — token FCM KHÔNG bị ép qua khuôn Web Push', () => {
  // Trước bản vá: dòng này ném DANG_KY_KHONG_HOP_LE và cảnh báo im lặng không tới.
  const dk = P.chuanHoaDangKyNative({ loai: 'native', token: TOKEN });
  assert.strictEqual(dk.token, TOKEN);
  assert.strictEqual(dk.loai, 'native');
});

test('APK — đăng ký native KHÔNG đi vào nhánh VAPID', async () => {
  // Chỉ có FCM, KHÔNG có VAPID. Đường native vẫn phải chạy được.
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN },
    payload: {}, env: ENV_FCM,
    guiThatNative: async () => ({ ok: true }),
  });
  assert.strictEqual(kq.trangThai, 'DA_DAY_DI',
    'đăng ký native bị đòi khoá VAPID — đó chính là lỗi trong APK');
});

// ═══════════ §9.4 — không nói quá, áp cho cả đường native ═══════════

test('§9.4 — chưa cấu hình FCM thì NÓI THẬT, không giả lập thành công', async () => {
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN }, payload: {}, env: {},
    guiThatNative: async () => ({ ok: true }),   // có hàm gửi nhưng THIẾU cấu hình
  });
  assert.strictEqual(kq.trangThai, 'CHUA_CAU_HINH_PUSH');
});

test('§9.4 — có cấu hình FCM nhưng chưa cắm nhà cung cấp ⇒ vẫn là CHƯA CẤU HÌNH', async () => {
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN }, payload: {}, env: ENV_FCM,
  });
  assert.strictEqual(kq.trangThai, 'CHUA_CAU_HINH_PUSH');
});

test('§9.4 — nhà cung cấp FCM lỗi ⇒ KHÔNG xác nhận được, không phải thành công', async () => {
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN }, payload: {}, env: ENV_FCM,
    guiThatNative: async () => { throw new Error('mạng hỏng'); },
  });
  assert.strictEqual(kq.trangThai, 'PUSH_DELIVERY_UNKNOWN');
});

test('§9.4 — FCM trả 404 nghĩa là token đã chết ở máy người nhận', async () => {
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN }, payload: {}, env: ENV_FCM,
    guiThatNative: async () => ({ ok: false, status: 404 }),
  });
  assert.strictEqual(kq.trangThai, 'DANG_KY_HET_HAN');
});

test('§9.4 — FCM báo UNREGISTERED cũng là token chết, không phải lỗi mạng', async () => {
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN }, payload: {}, env: ENV_FCM,
    guiThatNative: async () => ({ ok: false, loi: 'UNREGISTERED' }),
  });
  assert.strictEqual(kq.trangThai, 'DANG_KY_HET_HAN');
});

// ═══════════ §6.9 — token không được lọt ra ═══════════

test('§6.9 — chuẩn hoá native chỉ giữ loai + token, bỏ mọi trường thừa', () => {
  const dk = P.chuanHoaDangKyNative({
    loai: 'native', token: TOKEN,
    hoTen: 'Nguyễn Văn A', soDienThoai: '0912345678',
  });
  assert.deepStrictEqual(Object.keys(dk).sort(), ['loai', 'token']);
  assert.ok(!JSON.stringify(dk).includes('0912345678'));
});

test('§6.9 — token KHÔNG bao giờ lọt vào chiTiet trả cho tầng trên', async () => {
  const kq = await P.guiCanhBao({
    dangKy: { loai: 'native', token: TOKEN }, payload: {}, env: ENV_FCM,
    guiThatNative: async () => { throw new Error(`gửi hỏng cho ${TOKEN}`); },
  });
  assert.ok(!JSON.stringify(kq).includes(TOKEN),
    'token FCM lọt ra ngoài — §6.9 cấm ghi khoá/đăng ký dạng thô');
});

test('§6.9 — token rỗng hoặc sai kiểu bị từ chối, không âm thầm nhận', () => {
  for (const xau of [{}, { loai: 'native' }, { loai: 'native', token: '' },
    { loai: 'native', token: '   ' }, { loai: 'native', token: 123 }]) {
    assert.throws(() => P.chuanHoaDangKyNative(xau), /THIEU_TOKEN_NATIVE|DANG_KY_KHONG_HOP_LE/,
      `đăng ký hỏng lọt qua: ${JSON.stringify(xau)}`);
  }
});

// ═══════════ §11 — đích đến hiển thị vẫn chỉ có ba ═══════════

test('§11 — đường native KHÔNG sinh thêm đích đến nào tên "đã đọc"', () => {
  for (const tt of Object.values(P.TRANG_THAI_GUI)) {
    const ma = P.maHienThi(tt);
    assert.ok(!/da_doc|da_hieu/.test(ma), `đích đến cấm xuất hiện: ${ma}`);
  }
});

// ═══════════ Đường web KHÔNG được đổi hành vi ═══════════

test('Đường web giữ nguyên: không có loai ⇒ vẫn là Web Push như cũ', async () => {
  const envVapid = { VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:x@y.z' };
  const kq = await P.guiCanhBao({
    dangKy: { endpoint: 'https://push.example.com/x', keys: { p256dh: 'p', auth: 'a' } },
    payload: {}, env: envVapid, guiThat: async () => ({ ok: true }),
  });
  assert.strictEqual(kq.trangThai, 'DA_DAY_DI');
});

test('Đường web KHÔNG nhận token native trá hình', () => {
  // Không có loai:'native' thì vẫn phải đi khuôn Web Push và bị từ chối.
  assert.throws(() => P.chuanHoaDangKy({ token: TOKEN }), /DANG_KY_KHONG_HOP_LE|ENDPOINT/);
});

// ═══════════ Route đăng ký — chỗ lỗi APK thật sự chạm vào đầu tiên ═══════════
//
// `src/push.js` nhận được hai loại là chưa đủ: POST /api/push/dang-ky mới là
// cửa mà bản APK gõ vào. Nếu route tự kiểm khuôn Web Push thì token FCM bị
// chặn ở đây, và `guiCanhBao` không bao giờ có cơ hội chạy.

const { app } = require('../backend/server');

let server;
let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server?.close());

const dangKy = async (body) => {
  const res = await fetch(`${goc}/api/push/dang-ky`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('APK — POST /api/push/dang-ky NHẬN đăng ký native', async () => {
  const { status, body } = await dangKy({ dangKy: { loai: 'native', token: TOKEN } });
  assert.strictEqual(status, 200, 'route chặn token FCM — bản APK không đăng ký được');
  assert.strictEqual(body.daDangKy, true);
});

test('Route vẫn nhận đăng ký web như cũ', async () => {
  const { status, body } = await dangKy({
    dangKy: { endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p', auth: 'a' } },
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(body.daDangKy, true);
});

test('Route từ chối đăng ký hỏng, KHÔNG âm thầm nhận', async () => {
  for (const xau of [{}, { dangKy: {} }, { dangKy: { loai: 'native' } },
    { dangKy: { loai: 'native', token: '' } }]) {
    const { status } = await dangKy(xau);
    assert.strictEqual(status, 400, `đăng ký hỏng lọt qua: ${JSON.stringify(xau)}`);
  }
});
