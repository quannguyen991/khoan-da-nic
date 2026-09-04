'use strict';
/**
 * KHUNG GIÁO DỤC KHÔNG ĐƯỢC LÀ CỬA SAU.
 *
 * ══════════ LỖI ĐÃ ĐO ĐƯỢC 5/9/2026 ══════════
 *
 * `KHUNG_GIAO_DUC` trong `context-builder.js` tắt tín hiệu cho văn bản TUYÊN
 * TRUYỀN — để câu "kẻ lừa đảo thường đòi mã OTP" không bị chấm là lừa đảo. Đúng
 * và cần thiết.
 *
 * Nhưng một dòng trong khung đó là `^\s*(cảnh báo|lưu ý|thông báo)` — TRỐNG,
 * không đòi thêm gì. Nghĩa là chỉ cần gõ ba chữ ấy vào ĐẦU tin nhắn:
 *
 *   "vui lòng chuyển tiền vào tài khoản an toàn 1902xxxx"
 *        → FIN_TRANSFER_REQUEST, FIN_SAFE_ACCOUNT
 *   "Thông báo: vui lòng chuyển tiền vào tài khoản an toàn 1902xxxx"
 *        → RỖNG
 *
 * Đo đủ bốn loại tấn công × ba tiền tố: 12/12 ca về rỗng. Mà "Thông báo:" là
 * câu mở đầu PHỔ BIẾN NHẤT của tin nhắn lừa đảo tiếng Việt.
 *
 * §12 đã viết sẵn bài học này: "Bất kỳ cụm nào hạ mức vô điều kiện đều là một
 * câu thần chú tặng cho kẻ lừa đảo" — cùng họ với "please hold" và "ch play".
 * Lần này cụm nằm trong khung giáo dục chứ không nằm trong danh sách tắt, nên
 * không ai nghĩ tới việc soi nó.
 *
 * ⚠️ TEST NÀY CHẠY BỘ DÒ THẬT, KHÔNG ĐỌC MÃ NGUỒN. Đọc mã thì chỉ thấy có một
 * chuỗi regex; chỉ khi CHẠY mới thấy tín hiệu biến mất.
 *
 * ⚠️ ĐỪNG NỚI THÀNH "CẢNH BÁO THÔI". Một tin lừa đảo không bị chấm điểm là một
 * tin hiện ra "Chưa thấy dấu hiệu rủi ro" — tức app nói dối theo hướng nguy
 * hiểm nhất (§4.3).
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const DUONG = path.join(GOC, 'backend', 'src', 'analysis');
const BO_QUA = fs.existsSync(path.join(DUONG, 'context-builder.js'))
  ? false : 'chưa có backend/src/analysis/context-builder.js';

function tinHieuCua(vanBan) {
  const { buildContext } = require(path.join(DUONG, 'context-builder'));
  const { directPrecheck } = require(path.join(DUONG, 'direct-precheck'));
  const ctx = buildContext(vanBan, { sourceId: 'van_ban' });
  return directPrecheck(ctx, {}).filter((s) => s.state === 'present').map((s) => s.id).sort();
}

/** Bốn câu RA LỆNH — mỗi câu một loại tấn công khác nhau. */
const CAU_RA_LENH = [
  'vui lòng chuyển tiền vào tài khoản an toàn 1902xxxx để bảo vệ',
  'đọc mã OTP vừa gửi cho nhân viên để hoàn tất hồ sơ',
  'cài ứng dụng anydesk để nhân viên hỗ trợ từ xa',
  'cung cấp mật khẩu internet banking để đối chiếu',
];

/** Ba câu mở đầu mà kẻ lừa đảo hay dùng nhất. */
const TIEN_TO = ['Thông báo: ', 'Cảnh báo: ', 'Lưu ý: ', 'THÔNG BÁO '];

test('thêm "Thông báo/Cảnh báo/Lưu ý" vào đầu KHÔNG được xoá tín hiệu nào',
  { skip: BO_QUA }, () => {
    const mat = [];
    for (const cau of CAU_RA_LENH) {
      const goc = tinHieuCua(cau);
      assert.ok(goc.length > 0, `câu mẫu "${cau.slice(0, 40)}" đáng lẽ phải có tín hiệu — sửa câu mẫu, đừng sửa test`);
      for (const dau of TIEN_TO) {
        const sau = tinHieuCua(dau + cau);
        const thieu = goc.filter((id) => !sau.includes(id));
        if (thieu.length) mat.push(`"${dau}" + "${cau.slice(0, 34)}…" mất ${thieu.join(',')}`);
      }
    }
    assert.deepStrictEqual(mat, [],
      'một câu mở đầu vô hại không được làm mất tín hiệu — đó là câu thần chú tặng cho kẻ lừa đảo (§12)');
  });

/**
 * ⚠️ VỎ BỌC BẰNG CHÍNH TỪ VỰNG TUYÊN TRUYỀN.
 *
 * Vá xong lỗ "Thông báo:", quét lại cả khung bằng cách bọc câu ra lệnh trong
 * giọng tuyên truyền — và tìm thêm HAI ca nữa cùng về rỗng:
 *
 *   "Ngân hàng không bao giờ yêu cầu mật khẩu, NHƯNG LẦN NÀY bác vui lòng
 *    chuyển tiền vào tài khoản an toàn 1902xxxx"
 *   "THEO CÔNG AN, bác cần chuyển tiền vào tài khoản an toàn"
 *
 * Ca đầu là chiêu kinh điển: trích đúng lời khuyên của ngân hàng để lấy lòng
 * tin, rồi tạo một ngoại lệ. Ca sau khoác hai chữ "theo công an" lên một câu
 * ra lệnh.
 *
 * Bài học chung của cả tệp này: MỘT LỖ HỔNG LOẠI NÀY KHÔNG ĐỨNG MỘT MÌNH. Tìm
 * ra một cái thì phải quét cả danh sách, và quét bằng cách CHẠY chứ không đọc.
 */
test('từ vựng tuyên truyền không dùng làm vỏ bọc được', { skip: BO_QUA }, () => {
  const RA_LENH = 'vui lòng chuyển tiền vào tài khoản an toàn 1902xxxx để bảo vệ';
  const VO_BOC = [
    'Kẻ lừa đảo đang nhắm vào bác. Để bảo vệ,',
    'Lừa đảo thường xảy ra lúc này. Bác',
    'Ngân hàng không bao giờ yêu cầu mật khẩu, nhưng lần này bác',
    'Công an cảnh báo có đường dây lừa đảo. Bác',
    'Có người giả danh nhân viên ngân hàng. Bác',
    'Theo công an, bác cần',
    'Hồi tháng ba bác từng bị lừa. Nay bác',
  ];
  const goc = tinHieuCua(RA_LENH);
  assert.ok(goc.length > 0, 'câu mẫu phải có tín hiệu — sửa câu mẫu, đừng sửa test');

  const lot = VO_BOC
    .map((vo) => [vo, tinHieuCua(`${vo} ${RA_LENH}`)])
    .filter(([, s]) => goc.some((id) => !s.includes(id)))
    .map(([vo, s]) => `"${vo}…" → ${s.join(',') || 'RỖNG'}`);

  assert.deepStrictEqual(lot, [],
    'bọc câu ra lệnh trong giọng tuyên truyền không được làm mất tín hiệu nào');
});

/**
 * ⚠️ NỬA KIA CỦA HÀNG RÀO — ĐỪNG XOÁ.
 *
 * Cách "sửa" sai là bỏ luôn khung giáo dục. Làm thế thì mọi tin tuyên truyền
 * của ngân hàng và công an đều bị chấm là lừa đảo, và bác học được đúng một
 * điều: bỏ qua cảnh báo của app. Test này giữ cho bản vá không đi quá tay.
 */
test('nhưng tin TUYÊN TRUYỀN THẬT vẫn phải được miễn', { skip: BO_QUA }, () => {
  const NOI_VE_THU_DOAN = [
    'Ngân hàng không bao giờ yêu cầu quý khách cung cấp mã OTP qua điện thoại',
    'Cảnh báo: kẻ lừa đảo thường yêu cầu chuyển tiền vào tài khoản an toàn',
    'Công an TP Hà Nội khuyến cáo người dân tuyệt đối không cung cấp mã OTP cho ai',
    'Lưu ý: thủ đoạn giả danh nhân viên ngân hàng đòi mã xác thực đang tăng',
  ];
  const bao = NOI_VE_THU_DOAN
    .map((t) => [t, tinHieuCua(t)])
    .filter(([, s]) => s.length > 0)
    .map(([t, s]) => `"${t.slice(0, 46)}…" → ${s.join(',')}`);

  assert.deepStrictEqual(bao, [],
    'tin dạy người ta cảnh giác mà bị chấm là lừa đảo thì bác sẽ học cách bỏ qua app');
});
