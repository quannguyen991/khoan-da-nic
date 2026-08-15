'use strict';
/**
 * HAI LÁ CỜ HẠ MỨC KHÔNG ĐƯỢC TỰ KHAI TỪ THÂN YÊU CẦU.
 *
 * `verifiedChannel` và `verifiedRelationship` là hai thứ DUY NHẤT trong toàn bộ
 * đường phân tích có khả năng HẠ mức: chúng tắt `MAN_KEEP_CALL_ACTIVE`,
 * `ID_FAMILY_IMPERSONATION`, `ID_CONTACT_ACCOUNT_TAKEOVER`.
 *
 * `/api/analyze` nằm trong `KHONG_CAN_DANG_NHAP` (src/auth.js) — không có danh
 * tính nào để biện minh cho lá cờ. Ai gọi API cũng khai được. Một kẻ lừa đảo bảo
 * bác "bấm vào ô đã xác minh đi cho nhanh" là được giảm mức miễn phí.
 *
 * §12: "Bất kỳ cụm nào hạ mức vô điều kiện đều là một câu thần chú tặng cho kẻ
 * lừa đảo." Lá cờ tự khai cũng là một câu thần chú, chỉ khác là viết bằng JSON.
 *
 * ⚠️ TEST NÀY KHÔNG XOÁ TÍNH NĂNG SUPPRESS. Suppress vẫn đúng KHI CÓ BẰNG CHỨNG
 * THẬT — và bằng chứng đó phải do MÁY CHỦ đặt, không phải người gọi khai. Test
 * cuối cùng ở đây khẳng định đường máy chủ vẫn còn dùng được.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze, toHopDong } = require('../src/analysis/pipeline');

/** Tin giả danh người thân — đúng thứ `ID_FAMILY_IMPERSONATION` sinh ra để bắt. */
const TIN_GIA_NGUOI_THAN = 'Mẹ ơi con đây, con đổi số mới. Con nhờ mẹ chuyển tiền '
  + 'gấp vào tài khoản 9999 8888 7777, mẹ đừng nói với bố nhé.';

/** Tin ép giữ máy — đúng thứ `MAN_KEEP_CALL_ACTIVE` sinh ra để bắt. */
const TIN_GIU_MAY = 'Bác giữ máy, đừng tắt máy trong lúc tôi kiểm tra hồ sơ. '
  + 'Bác chuyển 50 triệu sang tài khoản an toàn ngay.';

const bac = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };

const chay = (vanBan, them = {}) => toHopDong(analyze({ vanBan, ...them }));

test('verifiedRelationship trong THÂN YÊU CẦU không được đổi kết luận', () => {
  const khong = chay(TIN_GIA_NGUOI_THAN);
  const co = chay(TIN_GIA_NGUOI_THAN, { verifiedRelationship: true });

  assert.strictEqual(co.nhan, khong.nhan,
    `lá cờ tự khai đã đổi nhãn: ${khong.nhan} → ${co.nhan}`);
  assert.deepStrictEqual([...co.maLyDo].sort(), [...khong.maLyDo].sort(),
    'lá cờ tự khai đã đổi danh sách lý do');
});

test('verifiedChannel trong THÂN YÊU CẦU không được đổi kết luận', () => {
  const khong = chay(TIN_GIU_MAY);
  const co = chay(TIN_GIU_MAY, { verifiedChannel: true });

  assert.strictEqual(co.nhan, khong.nhan,
    `lá cờ tự khai đã đổi nhãn: ${khong.nhan} → ${co.nhan}`);
  assert.deepStrictEqual([...co.maLyDo].sort(), [...khong.maLyDo].sort(),
    'lá cờ tự khai đã đổi danh sách lý do');
});

test('mọi biến thể chính tả / kiểu dữ liệu của lá cờ đều bị bỏ qua', () => {
  const chuan = chay(TIN_GIA_NGUOI_THAN);
  const bienThe = [
    { verifiedRelationship: true },
    { verifiedRelationship: 'true' },
    { verifiedRelationship: 1 },
    { verified_relationship: true },
    { verifiedChannel: true, verifiedRelationship: true },
    { nguCanhTinCay: { verifiedRelationship: true } },
    { xacThucMayChu: { verifiedRelationship: true } },
  ];

  for (const b of bienThe) {
    const r = chay(TIN_GIA_NGUOI_THAN, b);
    assert.strictEqual(r.nhan, chuan.nhan,
      `${JSON.stringify(b)} đã đổi nhãn: ${chuan.nhan} → ${r.nhan}`);
  }
});

test('§4.2 — lá cờ tự khai KHÔNG BAO GIỜ được làm TỤT mức', () => {
  // Phát biểu rộng hơn hai ca trên: quét cả một loạt tin, lá cờ chỉ được phép
  // giữ nguyên hoặc làm tăng. Thêm tin mới vào danh sách vẫn được bảo vệ.
  const tin = [
    TIN_GIA_NGUOI_THAN,
    TIN_GIU_MAY,
    'Con gái nhờ mẹ chuyển tiền gấp, số tài khoản mới nhé mẹ.',
    'Bác đừng tắt máy, tôi là cán bộ Bộ Công an đang xử lý vụ án của bác.',
    'Anh giữ máy nhé, em đọc mã OTP vừa gửi cho em là xong.',
  ];

  for (const t of tin) {
    const goc = bac[chay(t).nhan];
    for (const co of [{ verifiedRelationship: true }, { verifiedChannel: true },
      { verifiedChannel: true, verifiedRelationship: true }]) {
      assert.ok(bac[chay(t, co).nhan] >= goc,
        `TỤT MỨC vì ${JSON.stringify(co)}: ${t.slice(0, 50)}`);
    }
  }
});

/**
 * ĐƯỜNG MÁY CHỦ VẪN PHẢI DÙNG ĐƯỢC.
 *
 * Vá lỗ này KHÔNG phải xoá tính năng. Khoan Proof sẽ nối vào đúng đây: khi có
 * chữ ký passkey đã xác minh, MÁY CHỦ đặt cờ qua tham số thứ hai — thứ không
 * bao giờ đến từ `req.body`.
 */
test('đường MÁY CHỦ đặt cờ vẫn hoạt động (Khoan Proof nối vào đây)', () => {
  const khong = chay(TIN_GIA_NGUOI_THAN);
  const co = toHopDong(analyze(
    { vanBan: TIN_GIA_NGUOI_THAN },
    { verifiedRelationship: true },
  ));

  assert.ok(khong.maLyDo.includes('ID_FAMILY_IMPERSONATION'),
    'ca thử hỏng: tin mẫu không còn bật ID_FAMILY_IMPERSONATION');
  assert.ok(!co.maLyDo.includes('ID_FAMILY_IMPERSONATION'),
    'máy chủ đặt cờ mà suppress không chạy — tính năng đã chết');
});

test('máy chủ đặt cờ CŨNG không được hạ mức xuống dưới, chỉ được bỏ tín hiệu', () => {
  // Ngay cả đường hợp lệ cũng không được biến một tin nguy hiểm thành CHUA_THAY
  // chỉ vì một tín hiệu bị tắt. Các tín hiệu còn lại vẫn phải tính đủ.
  const co = toHopDong(analyze(
    { vanBan: TIN_GIA_NGUOI_THAN },
    { verifiedRelationship: true },
  ));
  assert.notStrictEqual(co.nhan, 'CHUA_THAY',
    'tắt một tín hiệu đã kéo cả tin xuống CHUA_THAY — sàn quá thấp');
});
