'use strict';
/**
 * 25/9/2026 — ĐƯA TÍN HIỆU AI "LÚC CÓ LÚC KHÔNG" VÀO LUẬT CỐ ĐỊNH.
 *
 * So 3 lượt AI trên cùng một mẫu: temperature đã là 0 mà đầu ra vẫn dao động,
 * và gọi AI nhiều lần rồi hợp lại là ensemble — §12 cấm. Nên những cách nói rõ
 * ràng AI hay bỏ được viết thành mẫu cố định. Mỗi mẫu đi kèm câu đời thường mà
 * nó KHÔNG được bắt — thiếu chiều đó thì test xanh cũng không canh gì.
 */

const test = require('node:test');
const assert = require('node:assert');
const { analyze } = require('../backend/src/analysis/pipeline');

const tin = (t) => analyze({ vanBan: t });
const co = (t, id) => tin(t).maLyDo.includes(id);

const PHAI_BAT = [
  ['Thanh toán trước 17 giờ theo tài khoản được gửi.', 'FIN_TRANSFER_REQUEST'],
  ['Em thanh toán hộ 13,5 triệu vào tài khoản này, lát anh gửi lại.', 'FIN_TRANSFER_REQUEST'],
  ['Xem hình ảnh và thanh toán trước hạn tại [liên kết].', 'FIN_TRANSFER_REQUEST'],
  ['Mẹ thanh toán 1.500.000đ mua váy cho bé nhé.', 'FIN_TRANSFER_REQUEST'],
  ['Lệnh vàng đang có cơ hội lợi nhuận cao; cần bổ sung vốn ngay.', 'FIN_TRANSFER_REQUEST'],
  ['Lệnh vàng đang có cơ hội lợi nhuận cao; cần bổ sung vốn ngay.', 'OFF_INVESTMENT_GUARANTEE'],
  ['Sàn cam kết lãi 20%/tháng cho gói vàng.', 'OFF_INVESTMENT_GUARANTEE'],
  ['Khoản vay đã được duyệt; anh/chị thanh toán khoản phí hồ sơ trước khi nhận tiền.', 'FIN_TRANSFER_REQUEST'],
  ['Chiều nay nhân viên pháp lý sẽ tới nhận 10 triệu tiền mặt làm khoản bảo chứng.', 'FIN_CASH_COURIER'],
  ['Vui long dang nhap tai [duong dan] trong 24h de mo khoa.', 'CRED_BANK_LOGIN'],
  ['Mở [link rút gọn] để đăng nhập và hoàn tất kiểm tra.', 'CRED_BANK_LOGIN'],
  ['Chị nhấn vào link này nhập thông tin ngân hàng để hoàn tiền.', 'CRED_BANK_LOGIN'],
  ['Vui lòng cập nhật số thẻ, ngày hết hạn và ba số ở mặt sau.', 'CRED_CARD_SECRET'],
  ['Chú đọc code vừa gửi về máy cho cháu.', 'CRED_OTP_SHARE'],
  ['Đăng nhập xong gửi mã xác nhận để hệ thống ghi nhận.', 'CRED_OTP_SHARE'],
  ['Hệ thống sẽ khóa nếu khách hàng không xác nhận trong hôm nay.', 'MAN_FEAR_THREAT'],
  ['Mã chỉ có hiệu lực 30 giây, hết hạn sẽ bị ngắt dịch vụ.', 'MAN_FEAR_THREAT'],
  ['Quét mã QR này rồi đăng nhập; mã chỉ còn hiệu lực hai phút.', 'WEB_QR_TO_LOGIN_PAYMENT'],
  ['Quét mã để nhận tiền lì xì nhé.', 'WEB_QR_TO_LOGIN_PAYMENT'],
  ['Scan the QR code to claim your refund.', 'WEB_QR_TO_LOGIN_PAYMENT'],
  // Lời bác KỂ LẠI trong trợ lý (người dùng thử 24/9/2026).
  ['ngân hàng bảo chuyển tiền không tài khoản bị khóa', 'ID_BANK_IMPERSONATION'],
  ['ngân hàng bảo chuyển tiền không tài khoản bị khóa', 'MAN_FEAR_THREAT'],
  ['Bên ngân hàng yêu cầu bác nộp phí kẻo thẻ bị khóa.', 'MAN_FEAR_THREAT'],
  // Cùng hai ý bằng tiếng Anh (en-US@1.1.1, 25/9/2026) — trợ lý bản tiếng Anh cần chúng.
  ['The bank says transfer the money or my account gets locked.', 'ID_BANK_IMPERSONATION'],
  ['The bank says transfer the money or my account gets locked.', 'MAN_FEAR_THREAT'],
  ['Someone from the bank told me to transfer everything to a new account.', 'ID_BANK_IMPERSONATION'],
  ['My bank asked me to urgently send the money today.', 'ID_BANK_IMPERSONATION'],
  ['Pay the fee today or your account will be frozen.', 'MAN_FEAR_THREAT'],
  ['Your SIM will be deactivated within 2 hours.', 'MAN_FEAR_THREAT'],
];

const KHONG_DUOC_BAT = [
  ['Mẹ nhớ thanh toán tiền điện trước ngày 25 nhé.', 'FIN_TRANSFER_REQUEST'],
  ['Con nhớ đóng học phí trước khi nhận bằng nhé.', 'FIN_TRANSFER_REQUEST'],
  ['Nếu không đóng học phí trước thứ sáu là cháu bị đình chỉ thi đấy bác ạ.', 'MAN_FEAR_THREAT'],
  ['Vui lòng cung cấp thông tin theo mẫu đính kèm.', 'CRED_CARD_SECRET'],
  ['Ngân hàng thông báo: vui lòng xác minh thông tin theo hướng dẫn tại quầy.', 'CRED_CARD_SECRET'],
  ['Gửi tiết kiệm kỳ hạn 12 tháng, lãi suất hấp dẫn 6%/năm.', 'OFF_INVESTMENT_GUARANTEE'],
  ['Cảnh báo: kẻ gian doạ sẽ khóa tài khoản nếu không làm theo, bà con cảnh giác.', 'MAN_FEAR_THREAT'],
  ['Ngân hàng không bao giờ yêu cầu khách chuyển tiền qua điện thoại.', 'ID_BANK_IMPERSONATION'],
  ['Cảnh báo: kẻ gian giả ngân hàng bảo chuyển tiền kẻo tài khoản bị khóa.', 'ID_BANK_IMPERSONATION'],
  ['Tài khoản của quý khách đã bị khóa do nhập sai mật khẩu 5 lần.', 'MAN_FEAR_THREAT'],
  ['Banks never ask you to transfer money over the phone.', 'ID_BANK_IMPERSONATION'],
  ['My bank has never asked me to transfer money.', 'ID_BANK_IMPERSONATION'],
  ['The bank said my transfer went through.', 'ID_BANK_IMPERSONATION'],
  ['Be careful: fraudsters say the bank told them to transfer money.', 'ID_BANK_IMPERSONATION'],
  ['Warning: scammers claim your account will be locked unless you pay.', 'MAN_FEAR_THREAT'],
  ['Your card was blocked after three wrong PIN attempts.', 'MAN_FEAR_THREAT'],
];

test('câu kể lại tiếng Anh ngang câu tiếng Việt: cả hai ra "Nguy hiểm cao"', () => {
  assert.strictEqual(tin('The bank says transfer the money or my account gets locked.').nhan, 'CAO');
  assert.strictEqual(tin('ngân hàng bảo chuyển tiền không tài khoản bị khóa').nhan, 'CAO');
});

for (const [t, id] of PHAI_BAT) {
  test(`phải bắt ${id}: "${t.slice(0, 60)}"`, () => {
    assert.ok(co(t, id), `maLyDo ${tin(t).maLyDo.join(',')}`);
  });
}

for (const [t, id] of KHONG_DUOC_BAT) {
  test(`KHÔNG được bắt ${id}: "${t.slice(0, 60)}"`, () => {
    assert.ok(!co(t, id), `bắt nhầm — maLyDo ${tin(t).maLyDo.join(',')}`);
  });
}

test('QR thanh toán ở cửa hàng: có tín hiệu QR nhưng vẫn "chưa thấy dấu hiệu" (một mình 8 điểm)', () => {
  const k = tin('Anh quét mã QR này để thanh toán tiền cơm nhé.');
  assert.strictEqual(k.nhan, 'CHUA_THAY');
});

test('Doạ khoá một mình (tin nhắc hoá đơn thật) không vượt "chưa thấy dấu hiệu"', () => {
  const k = tin('Quý khách vui lòng thanh toán trước ngày 25, nếu không sẽ bị tạm ngừng cấp điện.');
  assert.strictEqual(k.nhan, 'CHUA_THAY');
});
