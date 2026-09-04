'use strict';
/**
 * TẦNG 0 — mười luật R1–R10, từng luật một.
 *
 * Mỗi luật có ít nhất một ca KHỚP và một ca KHÔNG KHỚP. Ca không khớp mới là ca
 * đáng giá: nó ghim lại VÌ SAO luật phải hẹp đến thế, và nó là thứ vỡ khi ai đó
 * "nới cho bắt được nhiều hơn".
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/detect');
const { laSoDiDong, che } = require('../backend/src/detect/tang-0');
const { boLuat, datLai } = require('../backend/src/detect/bo-luat-store');
const {
  goCheGiaoThuc, goCheDauCham, goCheKhoangTrang, goCheChuCach, chuanHoaTin,
} = require('../backend/src/detect/chuan-hoa');
const { levenshtein, trichMoiUrl, trichLinkLong } = require('../backend/src/detect/tang-1');

const doc = (noiDung, them = {}) => analyze({
  nguon: 'sms', nguoiGui: '0912345678', noiDung, thoiDiem: Date.now(), ...them,
});
const co = (kq, ma) => kq.luatKhopVoi.includes(ma);

test.beforeEach(() => datLai());

// ── R1 ────────────────────────────────────────────────────────────────
test('R1 — mạo danh cơ quan + link ngoài allowlist ⇒ CAO', () => {
  const kq = doc('Thông báo phạt nguội, truy cập csgt-tracuu.top để nộp phạt.');
  assert.ok(co(kq, 'R1'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R1 — KHÔNG nổ khi tên miền nằm trong allowlist', () => {
  // Đây là ca giữ cho tin nhắn CSGT THẬT không bị báo đỏ.
  const kq = doc('Tra cứu phạt nguội tại trang chính thức https://csgt.vn');
  assert.ok(!co(kq, 'R1'), `R1 nổ oan vào tên miền chính thức: ${kq.luatKhopVoi}`);
  assert.notStrictEqual(kq.nhan, 'CAO');
});

test('R1 — KHÔNG nổ khi có từ khoá mạo danh mà KHÔNG có link nào', () => {
  const kq = doc('Bác đã nộp phạt nguội hôm qua chưa ạ?');
  assert.ok(!co(kq, 'R1'));
});

test('R1 — hậu tố gov.vn được nhận là chính thức, không cần liệt kê từng tên miền', () => {
  const kq = doc('Cập nhật thông tin căn cước tại https://motencoquan.gov.vn/tra-cuu');
  assert.ok(!co(kq, 'R1'));
});

// ── R2 ────────────────────────────────────────────────────────────────
test('R2 — link .apk ⇒ CAO và nổ critical override CO-02', () => {
  const kq = doc('Bác tải app tại https://dichvu-vn.top/app.apk nhé');
  assert.ok(co(kq, 'R2'));
  assert.strictEqual(kq.nhan, 'CAO');
  assert.ok(kq.overrides.includes('CO-02'), `thiếu CO-02: ${kq.overrides}`);
  assert.strictEqual(kq.canThiep, 'PROTECTED_CRITICAL');
});

test('R2 — mời cài ứng dụng kèm link ngoài cửa hàng ⇒ CAO', () => {
  const kq = doc('Em gửi anh link cài phần mềm hỗ trợ: http://ho-tro.click/setup');
  assert.ok(co(kq, 'R2'));
});

test('R2 — KHÔNG nổ khi mời cài app mà không có link nào', () => {
  // §12: "ch play" KHÔNG được làm cụm hạ mức — ở đây luật không nổ vì THIẾU
  // LINK, chứ không phải vì thấy chữ "CH Play".
  const kq = doc('Bác cài giúp cháu ứng dụng Zalo trên CH Play nhé.');
  assert.ok(!co(kq, 'R2'));
});

test('R2 — link tới cửa hàng chính thức KHÔNG bị coi là nguồn lạ', () => {
  const kq = doc('Bác tải app tại https://play.google.com/store/apps/details?id=com.zing.zalo');
  assert.ok(!co(kq, 'R2'));
});

// ── R3 ────────────────────────────────────────────────────────────────
test('R3 — link rút gọn + mạo danh ⇒ CAO', () => {
  const kq = doc('Cục thuế thông báo: tra cứu tại https://bit.ly/thue-vn');
  assert.ok(co(kq, 'R3'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R3 — link rút gọn KHÔNG kèm mạo danh thì không nổ R3', () => {
  const kq = doc('Con gửi mẹ bài hát này nhé https://bit.ly/abcdef');
  assert.ok(!co(kq, 'R3'));
});

// ── R4 ────────────────────────────────────────────────────────────────
test('R4 — tên miền nhái thương hiệu ⇒ CAO', () => {
  const kq = doc('Đăng nhập lại tại https://vietcombank-online.top/login');
  assert.ok(co(kq, 'R4'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R4 — eTLD+1 mới là thứ so, không phải chuỗi con', () => {
  // `vietcombank.com.vn.attacker.top` KHÔNG PHẢI Vietcombank.
  const kq = doc('Xác minh tại https://vietcombank.com.vn.xacminh.top/login');
  assert.ok(co(kq, 'R4'));
});

test('R4 — tên miền chính thức của chính thương hiệu đó thì không nhái', () => {
  const kq = doc('Xem tại https://vietcombank.com.vn/khuyen-mai');
  assert.ok(!co(kq, 'R4'));
});

test('levenshtein — cắt sớm khi vượt trần', () => {
  assert.strictEqual(levenshtein('abc', 'abc'), 0);
  assert.strictEqual(levenshtein('vietcombank', 'vietconbank', 2), 1);
  assert.ok(levenshtein('vietcombank', 'hoantoankhac', 2) > 2);
});

// ── R5 ────────────────────────────────────────────────────────────────
test('R5 — đuôi miền rủi ro một mình ⇒ NGHI_NGO, không phải CAO', () => {
  const kq = doc('Xem ảnh cưới nhà mình ở đây nhé https://anhcuoi.xyz/album');
  assert.ok(co(kq, 'R5'));
  assert.notStrictEqual(kq.nhan, 'CAO');
});

test('R5 — đuôi rủi ro + mạo danh ⇒ nâng lên CAO', () => {
  const kq = doc('Bảo hiểm xã hội: cập nhật hồ sơ tại bhxh-capnhat.top');
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R5 — địa chỉ IP trần có đường dẫn vẫn được coi là URL', () => {
  // Đo được 4/9/2026: bản đầu không trích được URL nào cho ca này.
  const kq = doc('Truy cap 192.168.44.201/nganhang de xac minh tai khoan.');
  assert.ok(kq.thucThe.urls.length > 0, 'không trích được URL dạng IP trần');
  assert.ok(co(kq, 'R5'));
});

test('R5 — số có dấu chấm KHÔNG bị nhận là IP', () => {
  const kq = doc('Phiên bản 10.2.14.3 đã cài xong rồi bác nhé.');
  assert.deepStrictEqual(kq.thucThe.urls, []);
});

// ── R6 ────────────────────────────────────────────────────────────────
test('R6 — bộ ba số tài khoản + số tiền + ép thời gian ⇒ CAO', () => {
  const kq = doc('Mẹ chuyển gấp 15 triệu vào số tài khoản 19036661234 giúp con.');
  assert.ok(co(kq, 'R6'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R6 — thiếu vế ép thời gian thì KHÔNG nổ', () => {
  // Ca khó nhất của tập bình thường: người quen vay tiền, có đủ hai vế kia.
  const kq = doc('Chuyển cho anh 3 triệu vào số tài khoản 19001234567 nhé em.');
  assert.ok(!co(kq, 'R6'));
  assert.notStrictEqual(kq.nhan, 'CAO');
});

test('R6 — dãy số KHÔNG có ngữ cảnh tài khoản thì không phải số tài khoản', () => {
  const kq = doc('Đơn hàng 887766554433 sẽ giao trong hôm nay, phí 35.000đ.');
  assert.deepStrictEqual(kq.thucThe.soTaiKhoan, []);
  assert.ok(!co(kq, 'R6'));
});

// ── R7 ────────────────────────────────────────────────────────────────
test('R7 — bí mật + vế hành động ⇒ CAO', () => {
  const kq = doc('Bác chuyển 10 triệu vào tài khoản 55443322110 gấp, đừng nói với ai.');
  assert.ok(co(kq, 'R7'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R7 — bí mật ĐƠN ĐỘC ⇒ NGHI_NGO, KHÔNG phải CAO', () => {
  /*
   * Ca này là lý do R7 lệch khỏi câu chữ của bản đặc tả. Xem khối ghi chú R7
   * trong `tang-0.js`. Nới thành CAO là báo đỏ vào một bí mật sinh nhật.
   */
  const kq = doc('Mẹ giữ bí mật hộ con nhé, con định làm bất ngờ sinh nhật cho bố.');
  assert.ok(co(kq, 'R7'));
  assert.strictEqual(kq.nhan, 'NGHI_NGO');
});

test('R7 — "chuyển hết tiền sang tài khoản an toàn" là vế hành động, dù không có con số', () => {
  const kq = doc('Bac chuyen het tien sang tai khoan an toan cua Bo Cong an ngay, khong duoc noi voi ai.');
  assert.strictEqual(kq.nhan, 'CAO');
});

// ── R8 ────────────────────────────────────────────────────────────────
test('R8 — đòi đọc mã OTP ⇒ CAO', () => {
  const kq = doc('Bác đọc lại mã OTP vừa gửi về máy để nhân viên xác nhận giúp bác ạ.');
  assert.ok(co(kq, 'R8'));
  assert.strictEqual(kq.nhan, 'CAO');
});

test('R8 — SMS OTP THẬT của ngân hàng KHÔNG được nổ', () => {
  const kq = doc('Ma OTP cua quy khach la 482913. Khong chia se ma nay cho bat ky ai.',
    { nguoiGui: 'Vietcombank' });
  assert.ok(!co(kq, 'R8'), `R8 nổ oan vào SMS OTP thật: ${JSON.stringify(kq.chiTietLuat)}`);
  assert.notStrictEqual(kq.nhan, 'CAO');
});

test('R8 — CẢNH BÁO chống lừa đảo của chính ngân hàng KHÔNG được nổ', () => {
  /*
   * "khong cung cap ma OTP" — có đủ vế yêu cầu lẫn vế đối tượng, nhưng bị phủ
   * định. Hàng rào là `laPhuDinh` dùng chung với `direct-precheck.js`.
   */
  const kq = doc('Agribank canh bao: khong cung cap ma OTP, mat khau cho bat ky ai.',
    { nguoiGui: 'Agribank' });
  assert.ok(!co(kq, 'R8'));
  assert.notStrictEqual(kq.nhan, 'CAO');
});

test('R8 — đòi mật khẩu ⇒ tín hiệu CRED_PASSWORD_PIN chứ không phải OTP', () => {
  const kq = doc('Bác cho cháu xin mật khẩu tài khoản ngân hàng để cháu kiểm tra hộ.');
  assert.ok(kq.maLyDo.includes('CRED_PASSWORD_PIN'), kq.maLyDo.join(','));
});

// ── R9 ────────────────────────────────────────────────────────────────
test('R9 — số di động xưng danh tổ chức ⇒ NGHI_NGO', () => {
  const kq = doc('Chào bác, cháu bên tổng đài chăm sóc khách hàng của công ty bảo hiểm.',
    { nguoiGui: '0912121212' });
  assert.ok(co(kq, 'R9'));
  assert.strictEqual(kq.nhan, 'NGHI_NGO');
});

test('R9 — brandname KHÔNG bị coi là số di động', () => {
  const kq = doc('Quy khach vua dang nhap Techcombank Mobile luc 09:15.',
    { nguoiGui: 'Techcombank' });
  assert.ok(!co(kq, 'R9'));
});

test('laSoDiDong — nhận đúng đầu số Việt Nam, từ chối brandname và tổng đài', () => {
  for (const s of ['0912345678', '0338889990', '+84912345678', '0777123456']) {
    assert.ok(laSoDiDong(s), `phải nhận: ${s}`);
  }
  for (const s of ['Vietcombank', '1900558818', '8888', '0281234567']) {
    assert.ok(!laSoDiDong(s), `phải từ chối: ${s}`);
  }
});

// ── R10 ───────────────────────────────────────────────────────────────
test('R10 — link từ người gửi lạ ⇒ NGHI_NGO (lưới an toàn cuối)', () => {
  const kq = doc('Bác xem link này nhé https://vidu.vn/bai-viet');
  assert.ok(co(kq, 'R10'));
  assert.strictEqual(kq.nhan, 'NGHI_NGO');
});

test('R10 — người gửi CÓ trong danh bạ tin cậy thì không nổ', () => {
  const kq = analyze(
    { nguon: 'sms', nguoiGui: '0912345678', noiDung: 'Bác xem link này https://vidu.vn/a' },
    { danhBa: ['+84912345678'] },
  );
  assert.ok(!co(kq, 'R10'), 'số trong danh bạ (dạng +84) phải được nhận là quen');
});

test('R10 — không có link thì không nổ', () => {
  const kq = doc('Bác ơi mai cháu qua đón bác đi khám nhé.');
  assert.ok(!co(kq, 'R10'));
});

// ── CHUẨN HOÁ ─────────────────────────────────────────────────────────
test('gỡ che: hxxp, [.], khoảng trắng trong tên miền', () => {
  assert.match(goCheGiaoThuc('hxxps://abc.com'), /^https:\/\//);
  assert.strictEqual(goCheDauCham('vietcombank[.]com'), 'vietcombank.com');
  assert.strictEqual(goCheDauCham('csgt (.) top'), 'csgt.top');
  assert.strictEqual(goCheKhoangTrang('vietcombank . com . vn'), 'vietcombank.com.vn');
});

test('gỡ che KHÔNG được nuốt dấu chấm kết câu', () => {
  /*
   * Lỗi đo được 4/9/2026: bản đầu nối "csgt.vn. Cuc" thành "csgt.vn.Cuc", eTLD+1
   * hoá ra `vn.cuc`, và R1 nổ CAO vào tin CSGT thật.
   */
  const t = 'Tra cuu tai https://csgt.vn. Cuc CSGT khong yeu cau chuyen tien.';
  assert.ok(goCheKhoangTrang(t).includes('csgt.vn. Cuc'), goCheKhoangTrang(t));
});

test('gỡ che chữ cách: "c s g t - v n . t o p" đọc lại được', () => {
  assert.strictEqual(goCheChuCach('tai c s g t - v n . t o p truoc'), 'tai csgt-vn.top truoc');
});

test('gỡ che chữ cách KHÔNG đụng câu tiếng Việt bình thường', () => {
  const t = 'Bác ơi mai cháu qua đón bác đi khám nhé.';
  assert.strictEqual(goCheChuCach(t), t);
});

test('ký tự đồng hình được ánh xạ về ASCII', () => {
  // "а" ở đây là chữ Kirin U+0430, không phải "a" Latin.
  const ban = chuanHoaTin('vietcombаnk.com', boLuat());
  assert.ok(ban.dongHinhDaGo);
  assert.ok(ban.thap.includes('vietcombank.com'));
});

// ── LINK LỒNG ─────────────────────────────────────────────────────────
test('link lồng trong tham số chuyển hướng được bóc ra', () => {
  const con = trichLinkLong('https://tin-cay.vn/go?url=https%3A%2F%2Fcsgt-phat.top%2Fx');
  assert.ok(con.some((c) => c.includes('csgt-phat.top')), JSON.stringify(con));
});

test('tham số KHÔNG phải chuyển hướng thì không bóc', () => {
  const con = trichLinkLong('https://www.youtube.com/watch?v=abc123');
  assert.deepStrictEqual(con, []);
});

test('trichMoiUrl — "gui.cho" không phải tên miền', () => {
  const { tho } = trichMoiUrl('Bác gửi.cho cháu với ạ');
  assert.deepStrictEqual(tho, []);
});

// ── §6.9 CHE SỐ ───────────────────────────────────────────────────────
test('số người gửi không được giữ nguyên vẹn trong kết quả', () => {
  const kq = doc('Bác xem link https://vidu.vn/a', { nguoiGui: '0912345678' });
  assert.notStrictEqual(kq.nguoiGui, '0912345678');
  assert.strictEqual(che('0912345678'), '091*****78');
});

// ── §4.3 ──────────────────────────────────────────────────────────────
test('§4.3 — nội dung rỗng KHÔNG ra "chưa thấy dấu hiệu rủi ro"', () => {
  const kq = doc('');
  assert.ok(kq.chuaKiem.includes('thong_bao_khong_co_noi_dung'));
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY');
});

test('§4.3 — độ tin cậy đầu vào thấp KHÔNG ra "chưa thấy dấu hiệu rủi ro"', () => {
  const kq = analyze(
    { nguon: 'thong_bao', nguoiGui: 'X', noiDung: 'Bác chuyển 50 triệu sang' },
    { doTinCayDauVao: 0.3 },
  );
  assert.ok(kq.chuaKiem.includes('chi_doc_duoc_mot_phan_tin'));
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY');
});

test('một luật ném lỗi không được làm chết cả tầng 0', () => {
  // Đầu vào quái dị: người gửi là object, thời điểm là chuỗi.
  const kq = analyze({ nguon: 'sms', nguoiGui: { a: 1 }, noiDung: 'phạt nguội csgt-x.top', thoiDiem: 'x' });
  assert.ok(kq.luatKhopVoi.length > 0);
  assert.strictEqual(kq.nhan, 'CAO');
});

test('§4.1 — không có nhãn nào ngoài ba nhãn hợp đồng', () => {
  const ld = require('./fixtures/tin-nhan/lua-dao.json');
  const bt = require('./fixtures/tin-nhan/binh-thuong.json');
  for (const t of [...ld.tin, ...bt.tin]) {
    assert.ok(['CAO', 'NGHI_NGO', 'CHUA_THAY'].includes(analyze(t).nhan));
  }
});

test('§HĐ luật 4 — nhãn CAO thì canThiep không được kẹt dưới PAUSE_60S', () => {
  /*
   * Lỗ hổng đo được 4/9/2026: "phạt nguội + link ngoài gov.vn" ra nhãn CAO
   * (sàn luật R1) nhưng chỉ 26 điểm, nên `chonMuc` trả VERIFY_PATH. Cổng
   * auto-alert của `trusted-circle.js` lấy `canThiep` làm điều kiện, nên NGƯỜI
   * THÂN KHÔNG BAO GIỜ ĐƯỢC BÁO về một tin đã bị gắn "Nguy hiểm cao".
   * Màn hình đỏ mà không ai được gọi — im lặng, không dấu vết.
   */
  const kq = doc('Thông báo phạt nguội, nộp tại csgt-tracuu.top trước 24h.');
  assert.strictEqual(kq.nhan, 'CAO');
  assert.ok(['PAUSE_60S', 'PROTECTED_CRITICAL'].includes(kq.canThiep),
    `nhãn CAO nhưng canThiep = ${kq.canThiep} — cổng cảnh báo người thân sẽ đóng`);
});

test('sàn canThiep CHỈ NÂNG — không hạ PROTECTED_CRITICAL xuống', () => {
  const kq = doc('Bác tải app tại https://dichvu-vn.top/app.apk nhé');
  assert.strictEqual(kq.canThiep, 'PROTECTED_CRITICAL');
});

test('nhãn NGHI_NGO ⇒ canThiep ít nhất VERIFY_PATH', () => {
  const kq = doc('Bác xem link này nhé https://vidu.vn/bai-viet');
  assert.strictEqual(kq.nhan, 'NGHI_NGO');
  assert.ok(['VERIFY_PATH', 'PAUSE_60S', 'PROTECTED_CRITICAL'].includes(kq.canThiep));
});
