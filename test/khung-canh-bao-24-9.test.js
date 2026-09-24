'use strict';
/**
 * BỘ LUẬT 24/9/2026 — rule 1.4.0 · registry 1.1.0. Người dùng duyệt ("ok").
 *
 * Nguồn của mọi ca dưới đây: chạy bộ 157 mẫu ChatGPT (nguồn công an / ngân hàng /
 * báo chí 2024–2026) qua tầng luật và qua hệ thống thật trên Render, cộng 30 ca
 * "tấn công" viết tay. Bốn nhóm thay đổi, mỗi nhóm canh HAI chiều:
 *
 *   ① Câu cảnh báo / phủ định không được nổ màn khẩn cấp   ↔  kẻ gian không được
 *      mượn chính những khung đó làm vỏ bọc.
 *   ② Gỡ che cấp ký tự (chen chấm, 0TP, ký tự vô hình, chữ Kirin).
 *   ③ "Nếu không chuyển khoản…" là lời doạ, không phải phủ định.
 *   ④ Mẫu câu cho 4 tín hiệu mới + 3 tín hiệu cũ chưa từng có mẫu.
 *
 * Tầng luật THUẦN — không AI (§6.10: tầng luật phải đứng một mình được).
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { analyze, toHopDong } = require('../backend/src/analysis/pipeline');
const { goCheKyTu, catCau } = require('../backend/src/analysis/context-builder');

const cham = (vanBan) => toHopDong(analyze({ vanBan }));
const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };

// ── ① Khung cảnh báo mới ────────────────────────────────────────────────────

test('① câu cảnh báo / phủ định KHÔNG nổ màn khẩn cấp, KHÔNG lên CAO', () => {
  for (const cau of [
    // từng ra CAO · PROTECTED_CRITICAL
    'Thông tin điều chỉnh trợ cấp BHXH được công bố công khai; không phải yêu cầu chuyển tiền hay cung cấp OTP.',
    'Chúng tôi không yêu cầu chuyển tiền, không yêu cầu cung cấp OTP.',
    'Cơ quan điều tra khuyến cáo người dân không cài đặt ứng dụng ngoài kho chính thức, đặc biệt là các tệp APK gửi qua tin nhắn.',
    'Bài học 3: Nhận biết yêu cầu chia sẻ màn hình khi đang đăng nhập ngân hàng.',
    // từng ra NGHI_NGO trong khi trần là CHUA_THAY
    'Bác nhớ nhé, ngân hàng không cử ai đến nhà lấy tiền mặt bao giờ.',
    'Khoan Đã không bao giờ chủ động gọi điện hoặc nhắn riêng để xin tiền, mã OTP, mật khẩu hay yêu cầu bác cài ứng dụng.',
    'Vietcombank cảnh báo không cung cấp thông tin thẻ hoặc mã OTP cho bất kỳ ai.',
    'Nếu đã nhập thông tin thẻ vào website giả mạo, khách hàng cần khóa thẻ và liên hệ kênh chính thức của ngân hàng.',
  ]) {
    const r = cham(cau);
    assert.notStrictEqual(r.canThiep, 'PROTECTED_CRITICAL', `màn khẩn cấp oan: ${cau}`);
    assert.strictEqual(r.nhan, 'CHUA_THAY', `${r.nhan} [${r.maLyDo}] — ${cau}`);
  }
});

test('① kẻ gian MƯỢN khung mới làm vỏ bọc vẫn bị bắt (không có câu thần chú mới — §12)', () => {
  for (const cau of [
    'Chúng tôi không yêu cầu mật khẩu, chỉ cần bác đọc mã OTP vừa gửi rồi chuyển 5 triệu vào tài khoản an toàn.',
    'Ngân hàng không yêu cầu bác ra quầy, bác chuyển tiền vào tài khoản an toàn 1902xxxx ngay.',
    'Đây không phải yêu cầu gì đâu, bác chỉ cần đọc mã OTP cho em thôi, rồi chuyển khoản 3 triệu phí.',
    'Bên em không yêu cầu phí, nhưng bác đọc giúp em mã OTP vừa gửi rồi chuyển khoản 2 triệu.',
    'Cảnh giác cuộc gọi tự xưng công an nhé bác, bác chuyển tiền vào tài khoản an toàn này để bảo vệ.',
    'Không yêu cầu phí đâu, giờ bác chuyển tiền vào tài khoản an toàn ngay.',
    'Cẩn thận người lạ, bác cài file APK em gửi qua Zalo để bảo mật tài khoản.',
    'Nếu đã nhận được mã, bác đọc mã OTP cho em rồi chuyển khoản vào tài khoản an toàn.',
  ]) {
    const r = cham(cau);
    assert.strictEqual(r.nhan, 'CAO', `vỏ bọc lọt: ${r.nhan} [${r.maLyDo}] — ${cau}`);
  }
});

// ── ② Gỡ che cấp ký tự ──────────────────────────────────────────────────────

test('② gỡ che: ký tự vô hình, chữ Kirin, 0TP, chen chấm, cách chữ — GIỮ nguyên dấu tiếng Việt', () => {
  assert.strictEqual(goCheKyTu('mã O​T​P'), 'mã otp');
  assert.strictEqual(goCheKyTu('mã ОТР'), 'mã otp');                  // Kirin
  assert.strictEqual(goCheKyTu('tài khoản аn toàn'), 'tài khoản an toàn'); // "а" Kirin
  assert.strictEqual(goCheKyTu('mã 0TP'), 'mã otp');
  assert.strictEqual(goCheKyTu('c.h.u.y.ể.n k.h.o.ả.n'), 'chuyển khoản');
  assert.strictEqual(goCheKyTu('m.ã O T P'), 'mã otp');
  assert.strictEqual(goCheKyTu('c h u y ể n'), 'chuyển');
  // Tin bình thường thì không đổi gì ngoài chữ thường.
  assert.strictEqual(goCheKyTu('Mẹ ơi con về muộn nhé'), 'mẹ ơi con về muộn nhé');
});

test('② cắt câu: chấm chen giữa chữ đơn KHÔNG phải hết câu; "xong.Tôi" và "TP.HCM" vẫn như cũ', () => {
  assert.strictEqual(catCau('rồi c.h.u.y.ể.n k.h.o.ả.n 10 triệu vào tài khoản.').length, 1);
  assert.strictEqual(catCau('Em làm xong.Tôi về đây.').length, 2);
  assert.strictEqual(catCau('Tôi ở TP.HCM.').length, 2);
});

test('② năm mẹo che chữ đều ra CAO', () => {
  const ZW = '​';
  for (const cau of [
    'Bác đọc cho em m.ã O T P vừa gửi, rồi c.h.u.y.ể.n k.h.o.ả.n 10 triệu vào tài khoản bên em để x.á.c m.i.n.h.',
    'Bác đọc cho em mã 0TP vừa gửi rồi chuyển khoản 10 triệu vào tài khoản bên em để xác minh.',
    `Bác đọc cho em mã O${ZW}T${ZW}P vừa gửi rồi chuyển${ZW} khoản 10 triệu vào tài khoản an${ZW} toàn.`,
    'Bác đọc cho em mã ОТР vừa gửi rồi chuyển khoản 10 triệu vào tài khoản аn toàn.',
  ]) {
    const r = cham(cau);
    assert.strictEqual(r.nhan, 'CAO', `${r.nhan} [${r.maLyDo}] — ${cau}`);
  }
});

// ── ③ "Nếu không" ───────────────────────────────────────────────────────────

test('③ "nếu không chuyển khoản" là lời doạ — tín hiệu đòi tiền KHÔNG bị vứt', () => {
  const r = cham('Điện lực thông báo nhà bác nợ tiền điện, sẽ cắt điện trong 2 giờ nếu không chuyển khoản 1.850.000đ vào tài khoản cá nhân sau.');
  assert.ok(r.maLyDo.includes('FIN_TRANSFER_REQUEST'), `mất vế đòi tiền: [${r.maLyDo}]`);
  assert.notStrictEqual(r.nhan, 'CHUA_THAY');
  // Phủ định thật vẫn là phủ định.
  assert.strictEqual(cham('Bác không chuyển tiền cho ai nhé.').nhan, 'CHUA_THAY');
  assert.strictEqual(cham('Nếu không chắc thì bác đừng chuyển tiền.').nhan, 'CHUA_THAY');
});

// ── ④ Tín hiệu mới và mẫu câu mới ───────────────────────────────────────────

test('④ mỗi tín hiệu mới có mẫu tiếng Việt bắt được câu thật của thủ đoạn', () => {
  const ca = [
    ['CRED_CARD_SECRET', 'Ngân hàng hỗ trợ miễn phí thường niên cho thẻ. Anh/chị đọc thông tin thẻ và ba số mặt sau để xác nhận.'],
    ['CRED_ID_BIOMETRIC_DOCS', 'Để cập nhật sinh trắc học, bác chụp ảnh căn cước hai mặt và quay video khuôn mặt gửi qua Zalo cho em.'],
    ['FIN_MISTAKEN_TRANSFER_REDIRECT', 'Tôi chuyển nhầm tiền vào tài khoản của anh. Anh chuyển trả ngay sang tài khoản này giúp tôi.'],
    ['FIN_ACCOUNT_OPENING_FOR_OTHERS', 'Có việc part-time, chỉ cần mở ví điện tử theo hướng dẫn là nhận hoa hồng 300 nghìn.'],
    ['DEV_SIM_SWAP_ESIM', 'Thuê bao của bác sắp bị khoá, bác chuyển sang eSIM qua link em gửi để giữ số.'],
    ['ID_FAMILY_EMERGENCY_THIRD_PARTY', 'Tôi là giáo viên của cháu. Cháu vừa gặp tai nạn, gia đình chuyển tiền viện phí gấp.'],
    ['ID_RECOVERY_SUPPORT_IMPERSONATION', 'Bên tôi có thể hỗ trợ lấy lại số tiền anh chị đã bị lừa, cần nộp trước phí xử lý hồ sơ.'],
    ['FIN_RECOVERY_FEE', 'Tài khoản đang có lãi nhưng muốn rút cần nạp thêm để hoàn tất xác minh giao dịch.'],
    ['DEV_INSTALL_APK_UNKNOWN', 'Anh/chị cài ứng dụng VNeID theo file/link tôi gửi để cập nhật định danh mức 2.'],
    ['CRED_OTP_SHARE', 'ma xac nhan vua gui do co, doc e 6 so ngay nha, qua han la tai khoan bi treo'],
    ['FIN_TRANSFER_REQUEST', 'bác ck gấp 20tr vào stk 0123456789 để xác minh'],
  ];
  for (const [ma, cau] of ca) {
    assert.ok(cham(cau).maLyDo.includes(ma), `${ma} không bật: ${cau}`);
  }
});

test('④ tin LÀNH gần giống KHÔNG bật tín hiệu mới', () => {
  const ca = [
    ['FIN_MISTAKEN_TRANSFER_REDIRECT', 'Anh ơi em chuyển nhầm 500k vào tài khoản anh lúc nãy, anh trả lại vào tài khoản em giúp em với.'],
    ['DEV_INSTALL_APK_UNKNOWN', 'Con cài ứng dụng VNeID theo hướng dẫn của công an phường rồi mẹ ạ.'],
    ['FIN_ACCOUNT_OPENING_FOR_OTHERS', 'Công ty nhờ anh mở tài khoản ngân hàng để nhận lương tháng này.'],
    ['FIN_ORG_CLAIM_PERSONAL_ACCOUNT', 'Công ty đã chuyển lương vào tài khoản cá nhân của anh rồi nhé.'],
    ['ID_FAMILY_EMERGENCY_THIRD_PARTY', 'Mẹ ơi bà vừa nhập viện, con đang ở với bà, mẹ đừng lo.'],
    ['CRED_CARD_SECRET', 'Vietcombank cảnh báo không cung cấp thông tin thẻ hoặc mã OTP cho bất kỳ ai.'],
  ];
  for (const [ma, cau] of ca) {
    const r = cham(cau);
    assert.ok(!r.maLyDo.includes(ma), `${ma} bật oan: ${cau}`);
    assert.ok(BAC[r.nhan] < BAC.CAO, `tin lành lên CAO: ${cau}`);
  }
});
