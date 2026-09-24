'use strict';
/**
 * §2B.6 — mẫu thật là loại mẫu duy nhất có thể làm lộ danh tính người thật,
 * và repo này công khai. Luật che thông tin phải chặn ở bộ đo, không chỉ ở
 * lời dặn trong README.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { kiemMauThat } = require('../eval/lib/mau-that');
const B = require('../eval/lib/bo-danh-gia');

const MAU = (ghiDe = {}) => ({
  id: 'that-test-1', ho: 'gia_danh_cong_an', kenh: 'zalo', ngon_ngu: 'vi',
  noi_dung: 'Tôi là cán bộ công an, bác chuyển 50.000.000đ vào [số đã che] để xác minh.',
  muc_do: 'CAO', toi_da: 'CAO', nguon: 'that',
  nguoi_duyet: 'Người Duyệt', ngay_nhan: '2026-09', dong_y: true,
  ...ghiDe,
});

test('mẫu đã che đủ, có người duyệt ⇒ không lỗi', () => {
  assert.deepStrictEqual(kiemMauThat(MAU()).loi, []);
});

test('số tiền có dấu chấm KHÔNG bị coi là số tài khoản', () => {
  assert.deepStrictEqual(kiemMauThat(MAU({ noi_dung: 'Chuyển 120.000.000 đồng ngay.' })).loi, []);
});

for (const [ten, nd] of [
  ['số điện thoại', 'Gọi lại số 0912 345 678 ngay.'],
  ['số điện thoại +84', 'Liên hệ +84912345678.'],
  ['số tài khoản', 'Chuyển vào STK 1903456789012 Techcombank.'],
  ['CCCD 12 số', 'CCCD của bác 001234567890 đã bị khoá.'],
  ['email', 'Gửi ảnh về ho.tro@gmail.com.'],
  ['liên kết https', 'Bấm https://vneid-capnhat.top để cập nhật.'],
  ['liên kết www', 'Vào www.dichvucong-vn.xyz ngay.'],
]) {
  test(`còn ${ten} ⇒ LỖI`, () => {
    assert.ok(kiemMauThat(MAU({ noi_dung: nd })).loi.length > 0, nd);
  });
}

test('liên kết đã viết hỏng (hxxps, [.]) được giữ', () => {
  assert.deepStrictEqual(kiemMauThat(MAU({ noi_dung: 'Vào hxxps://vneid-capnhat[.]top để cập nhật.' })).loi, []);
});

test('thiếu người duyệt / ngày nhận / đồng ý ⇒ LỖI', () => {
  assert.ok(kiemMauThat(MAU({ nguoi_duyet: undefined })).loi.some((l) => l.includes('nguoi_duyet')));
  assert.ok(kiemMauThat(MAU({ ngay_nhan: 'tháng 9' })).loi.some((l) => l.includes('ngay_nhan')));
  assert.ok(kiemMauThat(MAU({ dong_y: 'có' })).loi.some((l) => l.includes('dong_y')));
});

test('họ tên đầy đủ ⇒ CẢNH BÁO; tên đã che "Nguyễn Văn A" thì không', () => {
  assert.ok(kiemMauThat(MAU({ noi_dung: 'Chào bác Nguyễn Thị Hồng, con là cán bộ ngân hàng.' })).canhBao.length > 0);
  assert.deepStrictEqual(kiemMauThat(MAU({ noi_dung: 'Chào bác Nguyễn Văn A, con là cán bộ ngân hàng.' })).canhBao, []);
});

test('bộ đo TỪ CHỐI nạp mẫu thật chưa che, ở bất kỳ thư mục nào', () => {
  const tm = fs.mkdtempSync(path.join(os.tmpdir(), 'kd-mt-'));
  fs.writeFileSync(path.join(tm, 'a.jsonl'), [
    JSON.stringify(MAU()),
    JSON.stringify(MAU({ id: 'that-test-2', noi_dung: 'Gọi 0912345678 ngay.' })),
    JSON.stringify(MAU({ id: 'tu-soan-1', nguon: 'tu_soan', nguoi_duyet: undefined, noi_dung: 'Gọi 0912345678 ngay.' })),
  ].join('\n'));
  const { mau, loi } = B.napDataset(tm);
  assert.deepStrictEqual(mau.map((m) => m.id), ['that-test-1', 'tu-soan-1'],
    'mẫu tự soạn không bị luật che thông tin chặn — chỉ mẫu nguon=that');
  assert.strictEqual(loi.length, 1);
  assert.match(loi[0], /mẫu thật chưa đạt/);
});

test('bộ chính gồm eval/dataset + eval/mau-that, KHÔNG gồm eval/doi-chung', () => {
  const { mau } = B.napDataset();
  assert.ok(!mau.some((m) => String(m.id).startsWith('gpt-')),
    'bộ đối chứng đã dùng để chỉnh luật — trộn vào là tự chấm bài mình chép đáp án');
  const tepThat = fs.existsSync(B.MAU_THAT)
    ? fs.readdirSync(B.MAU_THAT).filter((f) => f.endsWith('.jsonl')) : [];
  for (const f of tepThat) assert.ok(mau.some((m) => m._lo === f), `thiếu tệp mẫu thật ${f}`);
});

test('bộ đối chứng nạp được và đủ trường', () => {
  const { mau, loi } = B.napDataset(path.join(__dirname, '..', 'eval', 'doi-chung'));
  assert.deepStrictEqual(loi, []);
  assert.strictEqual(mau.length, 153);
});
