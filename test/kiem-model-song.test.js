'use strict';
/**
 * MODEL CHẾT MÀ IM LẶNG — dạng hỏng đắt nhất của sản phẩm này.
 *
 * Ngày 16/9/2026: nhà cung cấp gỡ `deepseek-v4-flash`. Sáu ngày liền mọi lượt
 * phân tích trên bản chạy thật rơi về rule-only, và KHÔNG có gì kêu lên —
 * `/api/suc-khoe` vẫn báo `aiCauHinh: true`, vì nó chỉ hỏi "biến môi trường có
 * giá trị không", không hỏi "gọi thử có ra gì không".
 *
 * Biến có giá trị ≠ model còn sống. Đây là cùng một họ lỗi với §4.3: khai một
 * việc mình chưa thực sự kiểm.
 *
 * ⚠️ HAI LOẠI HỎNG PHẢI PHÂN BIỆT ĐƯỢC:
 *   · MODEL_KHONG_TON_TAI — nhà cung cấp gỡ model. Tự nó KHÔNG khỏi. Cần người.
 *   · LOI_TAM_THOI        — mạng chập, quá tải, hết giờ chờ. Thường tự khỏi.
 * Gộp hai thứ này vào một chữ "lỗi AI" là lý do sáu ngày trôi qua mà không ai
 * biết phải làm gì.
 */

const test = require('node:test');
const assert = require('node:assert');

const K = require('../backend/src/ai/kiem-model-song');

/** `goiChat` giả: kể lại nó được gọi mấy lần, và ném thứ mình muốn. */
function goiGia({ nem = null, tre = 0 } = {}) {
  const f = async () => {
    f.soLanGoi += 1;
    if (tre) await new Promise((r) => setTimeout(r, tre));
    if (nem) throw nem;
    return { noiDung: 'ok', noiChay: 'gateway' };
  };
  f.soLanGoi = 0;
  return f;
}

test('model trả lời được → modelSong = true', async () => {
  const kq = await K.kiemModelSong(goiGia(), { kho: K.taoKho(), bayGio: 1000 });
  assert.equal(kq.modelSong, true);
  assert.equal(kq.ma, null);
});

test('⚠️ model bị GỠ → nói rõ MODEL_KHONG_TON_TAI, không gộp vào "lỗi AI"', async () => {
  // Đúng thông điệp nhà cung cấp trả về ngày 16/9/2026.
  const loi = new Error('Không có kênh khả dụng cho model deepseek-v4-flash trong nhóm default');
  loi.status = 503;
  const kq = await K.kiemModelSong(goiGia({ nem: loi }), { kho: K.taoKho(), bayGio: 1000 });
  assert.equal(kq.modelSong, false);
  assert.equal(kq.ma, 'MODEL_KHONG_TON_TAI');
});

test('⚠️ "model_not_found" ở dạng mã cũng nhận ra', async () => {
  const loi = new Error('{"error":{"code":"model_not_found"}}');
  loi.status = 404;
  const kq = await K.kiemModelSong(goiGia({ nem: loi }), { kho: K.taoKho(), bayGio: 1000 });
  assert.equal(kq.ma, 'MODEL_KHONG_TON_TAI');
});

test('lỗi mạng hoặc quá tải → LOI_TAM_THOI, vì loại này thường tự khỏi', async () => {
  for (const [msg, status] of [['fetch failed', 0], ['Too Many Requests', 429], ['Bad Gateway', 502]]) {
    const loi = new Error(msg);
    loi.status = status;
    const kq = await K.kiemModelSong(goiGia({ nem: loi }), { kho: K.taoKho(), bayGio: 1000 });
    assert.equal(kq.modelSong, false);
    assert.equal(kq.ma, 'LOI_TAM_THOI', `"${msg}" phải là lỗi tạm thời`);
  }
});

test('khoá sai → KHOA_KHONG_DUNG, vì nó cần người sửa chứ không tự khỏi', async () => {
  const loi = new Error('Unauthorized');
  loi.status = 401;
  const kq = await K.kiemModelSong(goiGia({ nem: loi }), { kho: K.taoKho(), bayGio: 1000 });
  assert.equal(kq.ma, 'KHOA_KHONG_DUNG');
});

test('⚠️ §6.9 — kết quả KHÔNG chứa khoá, base URL hay nội dung lỗi thô', async () => {
  const loi = new Error('401 tại https://home.ai-box.vn/v1 với khoá sk-abc123def456ghi789');
  loi.status = 401;
  const kq = await K.kiemModelSong(goiGia({ nem: loi }), { kho: K.taoKho(), bayGio: 1000 });
  const chuoi = JSON.stringify(kq);
  assert.ok(!chuoi.includes('sk-abc123'), 'khoá không được lọt ra');
  assert.ok(!chuoi.includes('home.ai-box.vn'), 'địa chỉ máy chủ không được lọt ra');
  assert.ok(!/https?:\/\//.test(chuoi), 'không đường dẫn nào được lọt ra');
});

test('⚠️ CÓ ĐỆM — gọi dồn dập không được biến phép kiểm thành máy đốt tiền', async () => {
  const kho = K.taoKho();
  const g = goiGia();
  await K.kiemModelSong(g, { kho, bayGio: 1000 });
  await K.kiemModelSong(g, { kho, bayGio: 1000 + 5_000 });
  await K.kiemModelSong(g, { kho, bayGio: 1000 + 30_000 });
  assert.equal(g.soLanGoi, 1, 'trong cửa sổ đệm chỉ được gọi model một lần');
});

test('hết hạn đệm thì gọi lại — model sống lại phải được nhận ra', async () => {
  const kho = K.taoKho();
  const g = goiGia();
  await K.kiemModelSong(g, { kho, bayGio: 1000 });
  await K.kiemModelSong(g, { kho, bayGio: 1000 + K.HAN_DEM_MS + 1 });
  assert.equal(g.soLanGoi, 2);
});

test('kết quả mang theo tên model đang cấu hình, để người vận hành biết kiểm cái gì', async () => {
  const kq = await K.kiemModelSong(goiGia(), { kho: K.taoKho(), bayGio: 1000, tenModel: 'abc-1' });
  assert.equal(kq.model, 'abc-1');
});

test('⚠️ phép kiểm KHÔNG được ném — hỏng ở đây không được làm chết /api/suc-khoe', async () => {
  const noRa = () => { throw new Error('vỡ ngay lúc gọi'); };
  const kq = await K.kiemModelSong(noRa, { kho: K.taoKho(), bayGio: 1000 });
  assert.equal(kq.modelSong, false);
  assert.ok(kq.ma);
});

test('⚠️ HỒI QUY — CHỮ KÝ GỌI: messages là THAM SỐ THỨ NHẤT, không phải một trường', async () => {
  /*
   * Lỗi đã gặp ngày 16/9/2026: gọi `goiChat({ messages, maxTokens })`, trong khi
   * `fable-client` khai `goiChatCoDuPhong(messages, opts)`. Object bị đọc thành
   * mảng tin nhắn, lượt gọi hỏng ngay trong 0,26 giây — và phép kiểm sức khoẻ
   * báo "model chết" cho một model đang sống.
   *
   * Một phép kiểm luôn báo hỏng còn tệ hơn không có phép kiểm nào: nó dạy người
   * vận hành bỏ qua chính cái đèn báo.
   */
  let thamSo = null;
  const ghiLai = async (...args) => { thamSo = args; return { noiDung: 'ok' }; };

  await K.kiemModelSong(ghiLai, { kho: K.taoKho(), bayGio: 1000 });

  assert.ok(Array.isArray(thamSo[0]), 'tham số thứ nhất PHẢI là mảng tin nhắn');
  assert.equal(thamSo[0][0].role, 'user');
  assert.equal(typeof thamSo[1], 'object', 'tuỳ chọn đi ở tham số thứ hai');
});
