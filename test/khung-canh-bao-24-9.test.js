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

// ── ⑤ Lượt 2 (rule 1.5.0): tường thuật, "tại cổng", sức khoẻ thần kỳ ─────────

test('⑤ bài tường thuật viết tắt tên ("bà L.") và từ vựng biên bản KHÔNG thành lệnh', () => {
  for (const cau of [
    'Kẻ gian gọi điện tự xưng nhân viên ngân hàng, yêu cầu bà L. đọc mã OTP để "xác minh giao dịch".',
    'Ke gian goi dien tu xung nhan vien ngan hang, yeu cau ba L. doc ma OTP de "xac minh giao dich".',
    'Đối tượng tự xưng là công an, yêu cầu nạn nhân chuyển tiền vào tài khoản an toàn và chiếm đoạt 300 triệu đồng.',
  ]) {
    assert.strictEqual(cham(cau).nhan, 'CHUA_THAY', cau);
  }
  // Vỏ bọc bằng từ "đối tượng" + lệnh trực tiếp vẫn bị bắt.
  assert.strictEqual(cham('Đối tượng bên em yêu cầu, bác chuyển tiền vào tài khoản an toàn ngay.').nhan, 'CAO');
  // Kẻ lừa "lấy lại tiền" nói "số tiền đã bị lừa" — không được bị xếp là tường thuật rồi lọt.
  const r = cham('Bên tôi có thể hỗ trợ lấy lại số tiền anh/chị đã bị lừa. Cần nộp trước phí xử lý hồ sơ.');
  assert.ok(r.maLyDo.includes('ID_RECOVERY_SUPPORT_IMPERSONATION'), `[${r.maLyDo}]`);
});

test('⑤ "tại cổng dịch vụ công" (không dấu) KHÔNG phải "tải"; "tải ứng dụng … qua link" vẫn CAO', () => {
  const lanh = cham('Bao hiem xa hoi thong bao: So BHXH cua ban da duoc cap nhat. Tra cuu tai cong dich vu cong.');
  assert.notStrictEqual(lanh.canThiep, 'PROTECTED_CRITICAL');
  assert.ok(!lanh.maLyDo.includes('DEV_INSTALL_APK_UNKNOWN'));
  assert.strictEqual(cham('Bac tai ung dung dich vu cong qua link nay de cap nhat.').nhan, 'CAO');
});

test('⑤ quảng cáo sức khoẻ thần kỳ ra NGHI_NGO; lời khuyên phủ định / cảnh giác thì không', () => {
  for (const cau of [
    'Sản phẩm nhập khẩu cao cấp chữa được mọi bệnh, bác dùng là khỏi hẳn tiểu đường.',
    'Thần dược đông y, uống một liệu trình là bỏ được thuốc tây.',
  ]) {
    const r = cham(cau);
    assert.ok(r.maLyDo.includes('MAN_HEALTH_MIRACLE_CLAIM'), cau);
    assert.strictEqual(r.nhan, 'NGHI_NGO', cau);
  }
  for (const cau of [
    'Không có thuốc nào chữa được mọi bệnh, bác nhé.',
    'Cảnh giác quảng cáo thuốc chữa bách bệnh ở các buổi hội thảo tặng quà.',
  ]) {
    assert.ok(!cham(cau).maLyDo.includes('MAN_HEALTH_MIRACLE_CLAIM'), `bật oan: ${cau}`);
  }
});

// ── ⑥ Lượt 3 (rule 1.6.6): cảnh báo cộng đồng / kể lại quá khứ (hai chiều) ───

test('⑥ cảnh báo nhóm khu dân cư và lời kể lại chuyện hôm ấy KHÔNG bật lệnh hành động', () => {
  for (const cau of [
    'Cảnh báo bà con: có kẻ gọi xưng là nhân viên bảo hiểm y tế bảo cập nhật thẻ qua đường link rồi xin mã OTP.',
    'Nhóm cảnh báo lừa đảo phường 5: có người tự xưng công an bảo chuyển tiền vào tài khoản tạm giữ.',
    'Tin nhắn nói bạn vi phạm giao thông và bắt nộp phạt qua đường link lạ có thể là lừa đảo.',
    'Bà kể là hôm ấy nó bảo bà ra ngân hàng rút hết tiền đưa cho người tới lấy, may mà nhân viên ngân hàng giữ bà lại.',
  ]) {
    const r = cham(cau);
    assert.strictEqual(r.nhan, 'CHUA_THAY', `${r.nhan} [${r.maLyDo}] — ${cau}`);
  }
  // Chiều ngược (§12): kẻ gian mượn đúng các khung trên rồi gài lệnh trực tiếp vẫn phải lên CAO.
  for (const voBoc of [
    'Có kẻ gọi xưng là bảo hiểm y tế, bác đọc mã OTP vừa gửi rồi chuyển 5 triệu vào tài khoản an toàn.',
    'Nhóm cảnh báo lừa đảo thông báo, bác chuyển tiền vào tài khoản an toàn 1902xxxx ngay.',
    'Tin nhắn đòi nộp phạt là lừa đảo, giờ bác chuyển tiền vào tài khoản an toàn bên em để xác minh.',
    'Bà kể là hôm ấy suýt mất tiền, nên bác chuyển ngay 20 triệu vào tài khoản an toàn này nhé.',
  ]) {
    const r = cham(voBoc);
    assert.strictEqual(r.nhan, 'CAO', `vỏ bọc lọt: ${r.nhan} [${r.maLyDo}] — ${voBoc}`);
  }
});

// ── ⑦ Lượt 4 (rule 1.6.8): mở rộng từ tin thật `eval/bao-chi` (hai chiều) ─────

test('⑦ mẫu thật báo chí: phạt nguội, vay online đóng bảo hiểm, điện cao bấm phím, thu hồi 100%, like&share', () => {
  for (const cau of [
    'Thông báo bạn đã vi phạm luật giao thông và bị phạt số tiền 50.000 VND. Vui lòng thanh toán khoản phạt này sớm.',
    'Hồ sơ vay của chị đã được duyệt. Chị nộp tiền làm hồ sơ 300.000 vào tài khoản kế toán công ty để công ty xử lý và giải ngân.',
    'Ví chưa được kích hoạt, chị đóng thêm 20% làm phí bảo hiểm cho khoản vay để kích hoạt ví và rút tiền về tài khoản.',
    'Nếu bây giờ chị không đóng tiền bảo hiểm thì mình không rút tiền về tài khoản được.',
    'Bạn đang sử dụng điện cao bất thường, chúng tôi sẽ cắt điện, vui lòng bấm số 9 để gặp nhân viên điện lực.',
    'Thu hồi 100% tiền bị lừa, hỗ trợ lấy lại tiền từ sàn đầu tư.',
  ]) {
    const r = cham(cau);
    assert.notStrictEqual(r.nhan, 'CHUA_THAY', `bỏ sót tin thật: [${r.maLyDo}] — ${cau}`);
  }
  const rTask = cham('Tham gia nhiệm vụ like và share video để nhận hoa hồng 100.000 đồng/giờ.');
  assert.ok(rTask.maLyDo.includes('OFF_TASK_PREPAY') && rTask.maLyDo.includes('ID_EMPLOYER_JOB_IMPERSONATION'), `[${rTask.maLyDo}]`);
  for (const lanh of [
    'Cảnh sát giao thông khuyến cáo người dân cảnh giác tin nhắn giả mạo báo vi phạm luật giao thông.',
    'Hóa đơn tiền điện tháng này của gia đình bác tăng cao hơn tháng trước, bác nhớ kiểm tra lại điều hòa nhé.',
    'Chị ơi cho em thông tin liên hệ của bác bảo vệ để em gửi bưu phẩm nhé.',
  ]) {
    const r = cham(lanh);
    assert.strictEqual(r.nhan, 'CHUA_THAY', `báo oan tin lành: ${r.nhan} [${r.maLyDo}] — ${lanh}`);
  }
});

// ── ⑧ Lượt 5 (rule 1.6.11): thu thập Facebook qua Chrome Debug 9222 ──────────

test('⑧ crawl Facebook 9222 (hai chiều): domain sau dấu hai chấm, cài app file gửi kèm, đặt đơn hoa hồng', () => {
  const rPhat = cham('Thong bao : Quy khach con mot khoan phat giao thong chua duoc thanh toan. Vui long thanh toan som de tranh cac khoan phi phat phat sinh :govdichvucongvn.com');
  assert.strictEqual(rPhat.nhan, 'CAO', `phat nguoi domain sau dau ':': [${rPhat.maLyDo}]`);
  assert.ok(rPhat.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'), `[${rPhat.maLyDo}]`);

  const rDatVneid = cham('Cán bộ xã gọi điện yêu cầu cài ứng dụng qua file gửi kèm để cấp quyền sử dụng đất trên VNeID, bác bấm vào link cập nhật ngay hôm nay.');
  assert.strictEqual(rDatVneid.nhan, 'CAO', `can bo xa VNeID file gui kem: [${rDatVneid.maLyDo}]`);
  assert.ok(rDatVneid.maLyDo.includes('DEV_INSTALL_APK_UNKNOWN') && rDatVneid.maLyDo.includes('ID_AUTHORITY_IMPERSONATION'), `[${rDatVneid.maLyDo}]`);

  const rDonHoaHong = cham('Em tham gia nghe nhạc online kiếm tiền, nạp tiền đặt đơn hàng hưởng hoa hồng rồi đóng phí xác minh nâng cấp tài khoản để rút vốn.');
  assert.notStrictEqual(rDonHoaHong.nhan, 'CHUA_THAY', `[${rDonHoaHong.maLyDo}]`);
  assert.ok(rDonHoaHong.maLyDo.includes('OFF_TASK_PREPAY') && rDonHoaHong.maLyDo.includes('OFF_ADVANCE_FEE'), `[${rDonHoaHong.maLyDo}]`);

  for (const lanh of [
    'Cảnh báo lừa đảo: Tuyệt đối không cung cấp mã OTP, mật khẩu ngân hàng hay chuyển khoản trước cho người lạ tự xưng shipper hoặc cán bộ công an hướng dẫn qua Zalo.',
    'Thông báo: Cán bộ xã mời các hộ gia đình mang sổ hộ khẩu ra hội trường thôn vào 8h30 sáng mai họp định kỳ.',
    'Lưu ý từ cửa hàng: Quý khách chỉ thanh toán khi đã nhận hàng tận tay, không quét mã QR hoặc bấm vào đường link lạ.',
  ]) {
    const r = cham(lanh);
    assert.strictEqual(r.nhan, 'CHUA_THAY', `báo oan tin lành Facebook: ${r.nhan} [${r.maLyDo}] — ${lanh}`);
  }
});
