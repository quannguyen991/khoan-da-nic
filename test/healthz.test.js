'use strict';
/**
 * /healthz — địa chỉ để dịch vụ ngoài (UptimeRobot, cron-job.org) gõ cửa giữ máy chủ
 * Render không ngủ (29/9/2026). Đo QUA HTTP THẬT (§5.2), vì cái cần canh là hành vi
 * của route chứ không phải một hàm.
 */
process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { app } = require('../backend/server');
const { canDangNhap } = require('../backend/src/auth');

let server;
let goc;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server?.close());

test('GET /healthz trả 200 "ok", không nhớ đệm', async () => {
  const res = await fetch(`${goc}/healthz`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(await res.text(), 'ok');
  assert.match(res.headers.get('content-type'), /^text\/plain/);
  assert.match(res.headers.get('cache-control'), /no-store/);
});

test('HEAD /healthz cũng 200 — UptimeRobot mặc định gọi HEAD', async () => {
  const res = await fetch(`${goc}/healthz`, { method: 'HEAD' });
  assert.strictEqual(res.status, 200);
});

test('không đòi đăng nhập', () => {
  assert.strictEqual(canDangNhap('/healthz'), false);
});

test('không bị giới hạn tần suất: gọi 200 lượt liền vẫn 200 (dịch vụ gõ cửa mà bị 429 sẽ gửi thư báo hỏng)', async () => {
  for (let i = 0; i < 200; i += 1) {
    const res = await fetch(`${goc}/healthz`);
    assert.strictEqual(res.status, 200, `lượt ${i + 1}`);
    await res.text();
  }
});

test('không lộ thông tin: thân trả về chỉ là "ok"', async () => {
  const res = await fetch(`${goc}/healthz`);
  const chu = await res.text();
  assert.ok(chu.length <= 8, `thân dài bất thường (${chu.length})`);
  for (const [k] of res.headers) assert.doesNotMatch(k, /^x-powered-by$/i);
});

test('mã nguồn: /healthz đứng TRƯỚC express.json và không chạm kho / AI', () => {
  const nguon = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  const viTri = nguon.indexOf("app.get('/healthz'");
  assert.ok(viTri > 0, 'thiếu route');
  assert.ok(viTri < nguon.indexOf('app.use(express.json('), 'phải đứng trước express.json');
  const khoi = nguon.slice(viTri, nguon.indexOf('});', viTri) + 3);
  assert.doesNotMatch(khoi, /await|kho\.|goiChat|process\.env|analyze|layCauHinh/, 'route phải chỉ trả "ok"');
});

test('render.yaml khai kiểm sống trỏ đúng /healthz', () => {
  const yaml = fs.readFileSync(path.join(__dirname, '..', 'render.yaml'), 'utf8');
  assert.match(yaml, /^\s*healthCheckPath:\s*\/healthz\s*$/m);
});
