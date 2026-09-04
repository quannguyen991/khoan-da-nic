'use strict';
/**
 * TẦNG 0 KHÔNG ĐƯỢC BÁO OAN VÀO TIN LÀNH.
 *
 * Báo oan không phải phiền toái nhỏ. Mỗi lần app hét "Nguy hiểm cao" vào một
 * tin bình thường là một lần bác học rằng cảnh báo của app không đáng tin — và
 * đến lượt tin lừa đảo thật, bác bỏ qua y như những lần trước (§4.6).
 *
 * ══════ HAI LỖI ĐO ĐƯỢC 5/9/2026, CẢ HAI ĐỀU DIỆN RỘNG ══════
 *
 * 1. TIN TUYÊN TRUYỀN CỦA CHÍNH NGÂN HÀNG BỊ CHẤM LÀ LỪA ĐẢO.
 *      "Ngân hàng không bao giờ yêu cầu quý khách cung cấp mã OTP qua điện thoại"
 *        · directPrecheck  → RỖNG (đúng — `speechAct = warning_education`)
 *        · tầng 0 + R1–R20 → CAO, CRED_OTP_SHARE
 *    Hàng rào phủ định của R8 chỉ nhìn 16 ký tự trước; cụm "không bao giờ yêu
 *    cầu quý khách cung cấp" dài 30 ký tự nên "không" nằm ngoài tầm nhìn.
 *    Ngân hàng nào cũng gửi tin dạng này hằng tháng.
 *
 * 2. "ĐIỆN THOẠI" BỊ ĐỌC THÀNH "ĐIỀN".
 *    Bỏ dấu thì cả hai đều ra `dien`, và trong `dien thoai` thì `dien` là một
 *    TỪ TRỌN VẸN — nên ngay cả khớp trọn từ cũng khớp trúng chỗ sai. Từ "điện
 *    thoại" có trong vô số tin nhắn lành.
 *
 * ⚠️ TEST NÀY CHẠY BỘ MÁY THẬT. Đọc mã nguồn không thấy được hai lỗi này.
 *
 * ⚠️ ĐỪNG "SỬA" BẰNG CÁCH NỚI HÀNG RÀO PHỦ ĐỊNH. Nới một bộ chặn là đi ngược
 * §4.2, và sẽ tha luôn "không phải lừa đảo đâu, chuyển tiền đi". Cách đúng đã
 * dùng: theo bộ phân loại câu canonical, và so khớp trên bản CÓ DẤU.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const BO_QUA = fs.existsSync(path.join(GOC, 'backend', 'src', 'detect', 'index.js'))
  ? false : 'chưa có backend/src/detect/';

function nhanCua(noiDung, nguoiGui = 'Vietcombank') {
  const { analyze } = require(path.join(GOC, 'backend', 'src', 'detect'));
  const r = analyze({ nguon: 'sms', nguoiGui, noiDung, thoiDiem: 1 }, {});
  return { nhan: r.nhan || r.san, maLyDo: r.maLyDo || [] };
}

test('tin TUYÊN TRUYỀN của ngân hàng không bị chấm là lừa đảo', { skip: BO_QUA }, () => {
  const LANH = [
    'Ngân hàng không bao giờ yêu cầu quý khách cung cấp mã OTP qua điện thoại',
    'Cảnh báo: kẻ lừa đảo thường yêu cầu chuyển tiền vào tài khoản an toàn',
    'Công an TP Hà Nội khuyến cáo người dân tuyệt đối không cung cấp mã OTP cho ai',
    'Mã OTP của bạn là 483920. Không chia sẻ mã này cho bất kỳ ai.',
  ];
  const bao = LANH
    .map((t) => [t, nhanCua(t)])
    .filter(([, r]) => r.nhan !== 'CHUA_THAY')
    .map(([t, r]) => `${r.nhan} (${r.maLyDo.join(',') || 'không mã nào'}) ← "${t.slice(0, 48)}…"`);

  assert.deepStrictEqual(bao, [],
    'tin dạy người ta cảnh giác mà bị báo động thì bác sẽ học cách bỏ qua app');
});

test('"điện thoại" không được đọc thành yêu cầu "điền"', { skip: BO_QUA }, () => {
  const LANH = [
    'Số điện thoại của bạn gắn với mã OTP mới',
    'Liên hệ tổng đài qua điện thoại nếu mã bảo mật hết hạn',
  ];
  const bao = LANH
    .map((t) => [t, nhanCua(t)])
    .filter(([, r]) => r.maLyDo.some((m) => m.startsWith('CRED_')))
    .map(([t, r]) => `${r.maLyDo.join(',')} ← "${t}"`);

  assert.deepStrictEqual(bao, [],
    'bỏ dấu làm "điền" và "điện" thành một — phải so trên bản CÓ DẤU');
});

/**
 * ⚠️ NỬA KIA CỦA HÀNG RÀO. Cách "sửa báo oan" sai nhất là làm bộ dò im đi.
 * Ba câu dưới đây RA LỆNH thật, và chúng phải luôn kêu.
 */
test('nhưng tin RA LỆNH thật vẫn phải kêu', { skip: BO_QUA }, () => {
  const NGUY = [
    'Đọc mã OTP vừa nhận cho nhân viên để hoàn tất hồ sơ',
    'Vui lòng điền mã xác thực vào ô bên dưới',
    'Anh cung cấp mật khẩu tài khoản giúp em nhé',
    'Thông báo: vui lòng chuyển tiền vào tài khoản an toàn 1902xxxx để bảo vệ',
  ];
  const sot = NGUY
    .map((t) => [t, nhanCua(t)])
    .filter(([, r]) => r.nhan === 'CHUA_THAY')
    .map(([t]) => `"${t.slice(0, 52)}…"`);

  assert.deepStrictEqual(sot, [],
    'một tin đòi tiền hoặc đòi mã mà ra "chưa thấy dấu hiệu" là app nói dối theo hướng nguy hiểm nhất (§4.3)');
});
