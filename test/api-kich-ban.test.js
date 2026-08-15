'use strict';
/**
 * §16.1 — `GET /api/kich-ban/:hoKichBan?giaiDoan=` đo QUA HTTP THẬT.
 *
 * §5.2: "Mọi thay đổi hành vi phải đo ở CẢ HAI, và đo QUA HTTP chứ không chỉ
 * gọi hàm." Gọi hàm thuần đã xanh ở test/kich-ban-di-tiep.test.js; tệp này đo
 * phần còn lại: route, tham số, mã lạ, và chuyện route KHÔNG đòi đăng nhập.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../server');
const { canDangNhap } = require('../src/auth');
const { MA_BUOC_DA_DUNG, TOI_DA_BUOC } = require('../src/kich-ban-di-tiep');

let server;
let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server?.close());

const lay = async (duong) => {
  const res = await fetch(goc + duong);
  return { status: res.status, body: await res.json() };
};

test('trả về bước cho họ có thật', async () => {
  const { status, body } = await lay('/api/kich-ban/gia_danh_cong_an?giaiDoan=tao_long_tin');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.hoKichBan, 'gia_danh_cong_an');
  assert.strictEqual(body.giaiDoan, 'tao_long_tin');
  assert.ok(Array.isArray(body.buoc) && body.buoc.length > 0);
  assert.ok(body.buoc.length <= TOI_DA_BUOC);
  for (const b of body.buoc) {
    assert.ok(MA_BUOC_DA_DUNG.includes(b.maBuoc), `mã lạ: ${b.maBuoc}`);
    assert.ok(Array.isArray(b.tinHieuSeThay));
  }
});

test('§HĐ luật 2 — phản hồi KHÔNG chứa chữ tiếng Việt nào', async () => {
  for (const ho of ['gia_danh_cong_an', 'gia_danh_ngan_hang', 'gia_danh_tuyen_dung']) {
    const { body } = await lay(`/api/kich-ban/${ho}?giaiDoan=tiep_can`);
    assert.ok(!/[À-ỹ]/.test(JSON.stringify(body)),
      `${ho}: backend trả chuỗi hiển thị, frontend phải tra catalog`);
  }
});

test('thiếu giaiDoan ⇒ coi như mới tiếp cận, KHÔNG lỗi', async () => {
  const { status, body } = await lay('/api/kich-ban/gia_danh_cong_an');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.giaiDoan, 'tiep_can');
  assert.ok(body.buoc.length > 0, 'thiếu tham số mà giấu luôn dự báo là sai hướng an toàn');
});

test('họ lạ ⇒ 200 + mảng RỖNG, không phải lỗi và không bịa', async () => {
  for (const d of ['/api/kich-ban/khong_ton_tai',
    '/api/kich-ban/gia_danh_cong_an?giaiDoan=giai_doan_la',
    '/api/kich-ban/gia_danh_co_quan_thue']) {   // họ khai là chưa có dữ liệu
    const { status, body } = await lay(d);
    assert.strictEqual(status, 200, d);
    assert.deepStrictEqual(body.buoc, [], d);
  }
});

test('giai đoạn CUỐI ⇒ rỗng, không dự báo ngược về quá khứ', async () => {
  const { body } = await lay('/api/kich-ban/gia_danh_cong_an?giaiDoan=phuc_hoi');
  assert.deepStrictEqual(body.buoc, []);
});

test('§5.3 — route này KHÔNG đòi đăng nhập', () => {
  assert.strictEqual(canDangNhap('/api/kich-ban/gia_danh_cong_an'), false);
  assert.strictEqual(canDangNhap('/api/kich-ban/bat_ky_ho_nao'), false);
  // Và mở tiền tố KHÔNG được mở lây sang route khác.
  assert.strictEqual(canDangNhap('/api/vu-viec/ung-vien'), true);
  assert.strictEqual(canDangNhap('/api/kich-ban'), true);
});

test('§6.8 — route THUẦN ĐỌC: POST không được nhận', async () => {
  const res = await fetch(`${goc}/api/kich-ban/gia_danh_cong_an`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ vanBan: 'nội dung người dùng' }),
  });
  assert.notStrictEqual(res.status, 200, 'route dự báo đang nhận nội dung người dùng');
});

test('§6.8 — mã họ trong URL KHÔNG được phản chiếu thành HTML', async () => {
  const doc = encodeURIComponent('<script>alert(1)</script>');
  const res = await fetch(`${goc}/api/kich-ban/${doc}`);
  const body = await res.json();
  assert.deepStrictEqual(body.buoc, []);
  // Phản chiếu lại mã là chấp nhận được vì Content-Type là JSON, nhưng phải
  // KHÔNG có route nào trả nó ra dưới dạng HTML.
  assert.match(res.headers.get('content-type') || '', /application\/json/);
});
