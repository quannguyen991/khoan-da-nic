'use strict';
/**
 * TOKEN PHIÊN KHÔNG NẰM THÔ TRONG KHO — sửa 24/9/2026.
 * Chạy thử đầu-cuối Guardian thấy token nằm ở cột khoá của `proof_phien`: ai đọc
 * được cơ sở dữ liệu là cầm được phiên của mọi tài khoản trong 30 ngày.
 */
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('node:crypto');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const P = require('../backend/src/khoan-proof');

const bam = (s) => crypto.createHash('sha256').update(s).digest('hex');
const tieuDe = (token) => `Bearer ${token}`;
let dem = 0;
const idMoi = () => `tk-bam-${Date.now()}-${(dem += 1)}`;

test('cấp phiên: kho chỉ giữ BẢN BĂM, không giữ token', async () => {
  const id = idMoi();
  const { token } = await P.capPhien(id);
  const kho = await P.khoChung();
  assert.strictEqual(await kho.doc(P.BANG.PHIEN, token), null, 'token thô vẫn là khoá trong kho');
  const banGhi = await kho.doc(P.BANG.PHIEN, `h:${bam(token)}`);
  assert.ok(banGhi, 'không tìm thấy phiên dưới khoá băm');
  assert.ok(!JSON.stringify(banGhi).includes(token), 'token lọt vào dữ liệu phiên');
  assert.strictEqual(await P.docPhien(tieuDe(token)), id);
});

test('đăng xuất huỷ thật: token cũ không còn dùng được', async () => {
  const id = idMoi();
  const { token } = await P.capPhien(id);
  assert.strictEqual(await P.docPhien(tieuDe(token)), id);
  assert.ok(await P.huyPhien(tieuDe(token)));
  assert.strictEqual(await P.docPhien(tieuDe(token)), null);
});

test('phiên đời cũ (khoá thô) vẫn dùng được, rồi tự chuyển sang khoá băm', async () => {
  const id = idMoi();
  const token = crypto.randomBytes(32).toString('base64url');
  const kho = await P.khoChung();
  await kho.luu(P.BANG.PHIEN, token, { thanhVienId: id, hetHanLuc: Date.now() + 60_000 });
  assert.strictEqual(await P.docPhien(tieuDe(token)), id, 'người đang đăng nhập bị đá ra');
  assert.strictEqual(await kho.doc(P.BANG.PHIEN, token), null, 'bản thô chưa bị xoá sau khi chuyển');
  assert.ok(await kho.doc(P.BANG.PHIEN, `h:${bam(token)}`), 'chưa chuyển sang khoá băm');
  assert.strictEqual(await P.docPhien(tieuDe(token)), id, 'lần sau đọc theo khoá băm phải vẫn được');
});

test('phiên đời cũ đã HẾT HẠN: không cho vào, và bị xoá luôn', async () => {
  const token = crypto.randomBytes(32).toString('base64url');
  const kho = await P.khoChung();
  await kho.luu(P.BANG.PHIEN, token, { thanhVienId: idMoi(), hetHanLuc: Date.now() - 1 });
  assert.strictEqual(await P.docPhien(tieuDe(token)), null);
  assert.strictEqual(await kho.doc(P.BANG.PHIEN, token), null);
  assert.strictEqual(await kho.doc(P.BANG.PHIEN, `h:${bam(token)}`), null, 'phiên hết hạn không được chuyển');
});

test('đăng xuất một phiên đời cũ cũng xoá bản thô', async () => {
  const token = crypto.randomBytes(32).toString('base64url');
  const kho = await P.khoChung();
  await kho.luu(P.BANG.PHIEN, token, { thanhVienId: idMoi(), hetHanLuc: Date.now() + 60_000 });
  assert.ok(await P.huyPhien(tieuDe(token)));
  assert.strictEqual(await kho.doc(P.BANG.PHIEN, token), null);
});
