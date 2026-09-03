'use strict';
/**
 * BỀ MẶT TẤN CÔNG CỦA THÂN YÊU CẦU, khi thêm bốn trường ghi âm.
 *
 * `xuLyPhanTich` CỐ Ý không trải `...req.body` — trường tự khai từng là đường
 * hạ mức (`verifiedChannel`, `verifiedRelationship`). Thêm bốn trường ghi âm
 * phải giữ đúng tính chất đó: người gọi bịa được chúng, nên không trường nào
 * được hạ mức, và không trường nào được mở cửa cho trường thứ năm đi ké.
 */

const test = require('node:test');
const assert = require('node:assert');

// Test KHÔNG được gọi ra gateway thật — vừa tốn tiền, vừa làm kết quả phụ thuộc mạng.
process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { analyze } = require('../backend/src/analysis/pipeline');
const { app } = require('../backend/server');

let server;
let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server?.close());

const goi = async (duong, body) => {
  const res = await fetch(goc + duong, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('trường tự khai đi KÉ trường ghi âm vẫn không lọt vào phân tích', () => {
  const doc = 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an ngay.';
  const sach = analyze({ vanBan: doc });
  const banBiu = analyze({
    vanBan: doc,
    ghiAm: true,
    ghiAmConfidence: 1,
    verifiedChannel: true,
    verifiedRelationship: 'con_ruot',
    riskLabel: 'NO_SIGNS_FOUND',
  });
  assert.strictEqual(banBiu.nhan, sach.nhan,
    'trường tự khai đi ké trường ghi âm là đường hạ mức');
});

test('ghiAm không kèm chữ nào ⇒ KHÔNG được khai là đã kiểm', () => {
  const kq = analyze({ vanBan: '', ghiAm: true, ghiAmConfidence: 1 });
  assert.ok(!kq.daKiem.includes('ghi_am'),
    'khai đã nghe được mà không có chữ nào là đúng bẫy §4.3');
  assert.ok(kq.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('§4.3 — ghi âm hỏng MỘT MÌNH ⇒ nhãn KHÔNG được là CHUA_THAY', () => {
  const kq = analyze({ ghiAm: true, ghiAmFailed: true });
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY',
    'không nghe được gì mà hiện "Chưa thấy dấu hiệu rủi ro" là đúng lỗi §4.3');
  assert.strictEqual(kq.daKiem.length, 0);
  assert.ok(kq.chuaKiem.length > 0);
});

test('§4.3 — chưa tải model MỘT MÌNH cũng không được ra CHUA_THAY', () => {
  const kq = analyze({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'CHUA_TAI_MODEL' });
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY');
  assert.ok(kq.chuaKiem.includes('chua_tai_xong_model_nghe'));
});

/**
 * ─────────── ĐO QUA HTTP, KHÔNG CHỈ GỌI HÀM ───────────
 *
 * §5.2: "Mọi thay đổi hành vi phải đo ở CẢ HAI, và đo QUA HTTP chứ không chỉ
 * gọi hàm." Bốn ca trên chứng minh `analyze()` đúng — chúng KHÔNG chứng minh
 * `server.js` chịu truyền bốn trường xuống. Bỏ sót một dòng ở handler thì bốn
 * ca trên vẫn xanh trong khi sản phẩm thật mù hoàn toàn với ghi âm.
 */

test('§HĐ — ghi âm hỏng qua HTTP: KHÔNG ra CHUA_THAY, và có mã chuaKiem', async () => {
  const { status, body } = await goi('/api/analyze', { ghiAm: true, ghiAmFailed: true });
  assert.strictEqual(status, 200, 'ghi âm hỏng là một ĐẦU VÀO, không phải yêu cầu thiếu');
  assert.notStrictEqual(body.nhan, 'CHUA_THAY');
  assert.ok(body.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('§HĐ — chưa tải model qua HTTP giữ đúng mã RIÊNG, không bị gộp', async () => {
  const { body } = await goi('/api/analyze', {
    ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'CHUA_TAI_MODEL',
  });
  assert.ok(body.chuaKiem.includes('chua_tai_xong_model_nghe'),
    'server nuốt ghiAmMaLoi ⇒ bác được bảo đi sửa thứ bác không sửa được');
});

test('§HĐ — hỏng một phần qua HTTP: daKiem VÀ chuaKiem cùng lúc', async () => {
  const { body } = await goi('/api/analyze', {
    vanBan: 'bác chuyển tiền đi', ghiAm: true, ghiAmConfidence: 0.3,
  });
  assert.ok(body.daKiem.includes('ghi_am'));
  assert.ok(body.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('§HĐ — /api/analyze/so-bo cũng nhận ghi âm, không lệch với đường chính', async () => {
  const than = { vanBan: 'alo bác ơi', ghiAm: true, ghiAmConfidence: 0.3 };
  const { body: soBo } = await goi('/api/analyze/so-bo', than);
  const { body: day } = await goi('/api/analyze', than);
  // §HĐ: sơ bộ LUÔN ≤ kết quả cuối. Nếu sơ bộ mù với ghi âm còn đường chính thì
  // không, hai đường sẽ lệch nhau ở đúng chỗ khó soi nhất.
  assert.ok(soBo.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
    'đường sơ bộ bỏ qua trường ghi âm');
  assert.ok(day.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('§HĐ — chỉ có ghi âm, không văn bản không ảnh ⇒ KHÔNG trả THIEU_DAU_VAO', async () => {
  const { status, body } = await goi('/api/analyze', {
    ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'KHONG_CO_TIENG_NOI',
  });
  assert.strictEqual(status, 200,
    'trả 400 cho lượt ghi âm hỏng là biến một trạng thái CẦN NÓI RA thành lỗi im lặng');
  assert.ok(body.chuaKiem.includes('ghi_am_khong_co_tieng_noi'));
});

test('§HĐ — thêm bốn trường ghi âm KHÔNG làm rò trường thứ tám ra hợp đồng', async () => {
  const { body } = await goi('/api/analyze', {
    vanBan: 'alo', ghiAm: true, ghiAmConfidence: 0.9,
  });
  assert.deepStrictEqual(Object.keys(body).sort(),
    ['aiDaChay', 'canThiep', 'chuaKiem', 'daKiem', 'hoKichBan', 'maLyDo', 'nhan']);
});
