'use strict';
/**
 * CORS — CẦN VÌ BẢN APK, VÀ NẾU THIẾU THÌ HỎNG HOÀN TOÀN IM LẶNG.
 *
 * ══════════ KIỂU HỎNG NÀY KHÔNG CÓ CHỖ NÀO BÁO ══════════
 *
 * Trong APK, Capacitor phục vụ giao diện ở origin `https://localhost`, còn máy
 * chủ nằm ở tên miền khác. Đó là gọi KHÁC ORIGIN.
 *
 * Không có header CORS thì WebView vẫn GỬI được yêu cầu, máy chủ vẫn trả 200
 * đàng hoàng — nhưng trình duyệt VỨT phản hồi. Nhìn log máy chủ thì mọi thứ
 * xanh; nhìn từ phía bác thì mọi lượt kiểm đều lỗi. Đo được 16/8/2026: máy chủ
 * không gửi header CORS nào.
 *
 * ⚠️ VÀ ĐÂY KHÔNG PHẢI CHỖ ĐỂ MỞ `*`.
 * `/api/proof/*` nhận token qua header `authorization`. Mở `*` là cho bất kỳ
 * trang web nào người dùng đang mở gọi sang đây kèm token của họ. Test dưới đây
 * chặn việc ai đó "sửa nhanh" bằng dấu sao.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../server');

let server;
let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server?.close());

/** Origin thật của các bản đóng gói. Thiếu một cái là bản đó chết. */
const CHO_PHEP = [
  'https://localhost',        // Capacitor Android
  'capacitor://localhost',    // Capacitor iOS
  'http://localhost:8089',
  'http://localhost:3000',
];

for (const o of CHO_PHEP) {
  test(`origin "${o}" gọi được /api/analyze`, async () => {
    const r = await fetch(`${goc}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: o },
      body: JSON.stringify({ vanBan: 'Bác chuyển tiền giúp cháu nhé.' }),
    });
    assert.strictEqual(r.headers.get('access-control-allow-origin'), o,
      `thiếu header CORS cho ${o} — WebView sẽ vứt phản hồi dù máy chủ trả 200`);
  });

  test(`preflight từ "${o}" được chấp nhận`, async () => {
    const r = await fetch(`${goc}/api/analyze`, {
      method: 'OPTIONS',
      headers: {
        origin: o,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });
    assert.strictEqual(r.status, 204, `preflight từ ${o} trả ${r.status}`);
    assert.match(r.headers.get('access-control-allow-headers') || '', /authorization/,
      'không cho gửi header authorization — Khoan Proof sẽ hỏng');
  });
}

test('origin LẠ KHÔNG được cấp quyền', async () => {
  for (const o of ['https://ke-lua-dao.invalid', 'http://localhost:9999', 'null']) {
    const r = await fetch(`${goc}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: o },
      body: JSON.stringify({ vanBan: 'x' }),
    });
    assert.strictEqual(r.headers.get('access-control-allow-origin'), null,
      `${o} được cấp quyền CORS — trang lạ gọi sang được`);
  }
});

test('preflight từ origin lạ bị TỪ CHỐI', async () => {
  const r = await fetch(`${goc}/api/analyze`, {
    method: 'OPTIONS',
    headers: { origin: 'https://ke-lua-dao.invalid', 'access-control-request-method': 'POST' },
  });
  assert.strictEqual(r.status, 403);
});

/**
 * ⚠️ HÀNG RÀO CHỐNG "SỬA NHANH BẰNG DẤU SAO".
 * Khi CORS hỏng, phản xạ đầu tiên của ai cũng là đặt `*`. Ở đây điều đó phơi
 * token Khoan Proof cho mọi trang web.
 */
test('KHÔNG BAO GIỜ trả access-control-allow-origin: *', async () => {
  for (const duong of ['/api/analyze', '/api/suc-khoe', '/api/proof/ghep/bat-dau']) {
    const r = await fetch(goc + duong, {
      method: duong === '/api/suc-khoe' ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://localhost' },
      body: duong === '/api/suc-khoe' ? undefined : '{}',
    });
    assert.notStrictEqual(r.headers.get('access-control-allow-origin'), '*',
      `${duong} mở CORS cho mọi origin — trang lạ gọi được kèm token của người dùng`);
  }
});

test('KHÔNG bật allow-credentials — danh tính đi bằng Bearer, không bằng cookie', async () => {
  const r = await fetch(`${goc}/api/suc-khoe`, { headers: { origin: 'https://localhost' } });
  assert.notStrictEqual(r.headers.get('access-control-allow-credentials'), 'true');
});
