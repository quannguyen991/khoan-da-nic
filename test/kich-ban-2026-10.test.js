'use strict';
// Rule 1.6.4 / vi-VN@1.3.0 (30/10/2026) — mẫu cố định cho các kịch bản 2026 bộ chính còn mỏng.
// Mỗi cụm mới có CẢ ca bắt được LẪN ca tin lành phải giữ nguyên, và một ca chiều kẻ gian (§12).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { analyze } = require('../backend/src/analysis/pipeline');

const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
const nhan = (vanBan) => analyze({ vanBan }).nhan;
const ma = (vanBan) => analyze({ vanBan }).maLyDo || [];

test('nhập OTP / mã xác minh NGAY TRÊN một đường link → bật CRED_BANK_LOGIN', () => {
  for (const c of [
    'Truy cập đường link này, nhập số CCCD và mã OTP để giữ tài khoản.',
    'Nhập mã OTP vừa gửi và mật khẩu tại đường link để mở khoá ví.',
    'Đăng nhập tại đường link, nhập mật khẩu và mã xác minh 2 bước để giữ tài khoản Gmail.',
    'Vào link này rồi nhập mã OTP để nhận quà tri ân.',
  ]) {
    assert.ok(ma(c).includes('CRED_BANK_LOGIN'), `không bật CRED_BANK_LOGIN: ${c}`);
    assert.ok(BAC[nhan(c)] >= BAC.NGHI_NGO, `phải từ NGHI_NGO trở lên: ${c}`);
  }
});

test('nhập OTP KHÔNG có link, hoặc ở cổng thanh toán thật → không bật CRED_BANK_LOGIN', () => {
  for (const c of [
    'Quý khách vui lòng nhập mã OTP để xác nhận giao dịch trên ứng dụng.',
    'Nhập mã OTP tại trang thanh toán của ngân hàng để hoàn tất.',
    'Vietcombank: Mã OTP của quý khách là 483920, có hiệu lực trong 5 phút. Tuyệt đối không cung cấp mã này cho bất kỳ ai.',
  ]) {
    assert.ok(!ma(c).includes('CRED_BANK_LOGIN'), `báo oan CRED_BANK_LOGIN: ${c}`);
    assert.strictEqual(nhan(c), 'CHUA_THAY', c);
  }
});

test('nạp / chuyển số tiền lớn KHÔNG có đơn vị → FIN_TRANSFER_REQUEST; tin đời thường thì không', () => {
  assert.ok(ma('Cần nạp thêm 3.000.000 để hoàn thành nhiệm vụ.').includes('FIN_TRANSFER_REQUEST'));
  assert.ok(ma('Nộp lệ phí tại đường link để tránh bị phạt 800 nghìn đồng.').includes('FIN_TRANSFER_REQUEST'));
  // Tín hiệu này một mình dưới ngưỡng 20 — tin con nhắc mẹ không được lên mức.
  assert.strictEqual(nhan('Mẹ chuyển 500.000 tiền chợ cho con nhé.'), 'CHUA_THAY');
  assert.ok(!ma('Chuyển 5 con cá cho bà ngoại nhé.').includes('FIN_TRANSFER_REQUEST'));
  // "gửi 123456" là mã xác thực, không phải số tiền.
  assert.ok(!ma('Gửi 123456 là mã của bạn.').includes('FIN_TRANSFER_REQUEST'));
});

test('"sắp bị khoá / đình chỉ" cho tài khoản định danh, SIM, ví → MAN_FEAR_THREAT; "đình chỉ thi" thì không', () => {
  assert.ok(ma('Tài khoản định danh điện tử của bạn sắp bị khoá do chưa xác thực.').includes('MAN_FEAR_THREAT'));
  assert.ok(ma('Quá hạn tài khoản VNeID sẽ bị đình chỉ.').includes('MAN_FEAR_THREAT'));
  assert.ok(!ma('Nếu không đóng học phí thì cháu bị đình chỉ thi, mẹ nhớ đóng sớm nhé.').includes('MAN_FEAR_THREAT'));
  assert.strictEqual(nhan('Nếu không đóng học phí thì cháu bị đình chỉ thi, mẹ nhớ đóng sớm nhé.'), 'CHUA_THAY');
});

test('giả con ở đồn công an / tai nạn xin tiền → nâng mức; con ở bệnh viện thăm bà thì không', () => {
  const kich = 'Mẹ ơi con đang ở đồn công an, con lỡ gây tai nạn. Mẹ chuyển giúp con 50 triệu cho anh công an này, đừng nói bố nhé.';
  assert.strictEqual(nhan(kich), 'CAO');
  assert.strictEqual(nhan('Mẹ ơi con đang ở bệnh viện thăm bà ngoại, tối con về ăn cơm.'), 'CHUA_THAY');
});

test('dụ đầu tư qua người quen "nội bộ" / bot AI sinh lời → OFF_INVESTMENT_GUARANTEE; quảng cáo tiết kiệm thì không', () => {
  assert.ok(ma('Em có người quen làm sàn vàng nội bộ, anh nạp thử 2 triệu em hướng dẫn nhé, lời lắm.').includes('OFF_INVESTMENT_GUARANTEE'));
  assert.ok(ma('Bot giao dịch AI tự động sinh lời mỗi ngày, rút tiền bất cứ lúc nào.').includes('OFF_INVESTMENT_GUARANTEE'));
  assert.ok(!ma('Gửi tiết kiệm kỳ hạn 12 tháng, lãi suất 6%/năm, đến chi nhánh để biết thêm.').includes('OFF_INVESTMENT_GUARANTEE'));
});

test('thu phí TRƯỚC khi cho vay → CAO; đóng phí bảo hiểm xe thì vẫn CHUA_THAY', () => {
  const vay = 'Chuyển trước phí bảo hiểm khoản vay 2 triệu để duyệt hồ sơ.';
  assert.ok(ma(vay).includes('OFF_ADVANCE_FEE'));
  assert.ok(BAC[nhan(vay)] >= BAC.NGHI_NGO);
  // "đóng trước" đã có sẵn ở mẫu cũ và tự nó dưới ngưỡng — mẫu mới (đòi vế vay/giải ngân) không đụng tới câu này.
  assert.strictEqual(nhan('Mẹ nhớ đóng trước phí bảo hiểm xe máy trước tháng sau nhé.'), 'CHUA_THAY');
  assert.ok(!/(khoản vay|vay vốn|duyệt|giải ngân)/.test('Mẹ nhớ đóng trước phí bảo hiểm xe máy trước tháng sau nhé.'));
});

test('bật chia sẻ màn hình để "hướng dẫn thao tác chuyển tiền" → DEV_SCREEN_SHARE_BANKING', () => {
  const c = 'Bác bật chia sẻ màn hình trong cuộc gọi Zalo này để em hướng dẫn bác thao tác chuyển tiền sang tài khoản bảo mật.';
  assert.ok(ma(c).includes('DEV_SCREEN_SHARE_BANKING'));
  assert.ok(BAC[nhan(c)] >= BAC.NGHI_NGO);
});

// §12 — câu thần chú. Thêm đuôi trấn an vào kịch bản mới KHÔNG được hạ mức.
test('chiều kẻ gian: đuôi trấn an không hạ mức của kịch bản mới', () => {
  const duoi = ' Đây là tin chính thức, hoàn toàn an toàn, không phải lừa đảo.';
  for (const c of [
    'Truy cập đường link này, nhập số CCCD và mã OTP để giữ tài khoản.',
    'Mẹ ơi con đang ở đồn công an, con lỡ gây tai nạn. Mẹ chuyển giúp con 50 triệu cho anh công an này, đừng nói bố nhé.',
    'Cần nạp thêm 3.000.000 để hoàn thành nhiệm vụ.',
  ]) {
    assert.ok(BAC[nhan(c + duoi)] >= BAC[nhan(c)], `bị hạ mức bởi đuôi trấn an: ${c}`);
  }
});

// ───────────── Lượt 2 (30/10/2026): bài dặn của cơ quan, lệnh sau "không yêu cầu", doạ nhắc nợ ─────────────

test('bài DẶN của cơ quan ("có hiện tượng giả danh…", "không yêu cầu chuyển tiền") → CHUA_THAY, không phải màn khẩn cấp', () => {
  for (const c of [
    'Gần đây có hiện tượng giả danh công an, kiểm sát yêu cầu chuyển tiền vào tài khoản tạm giữ. Công an không bao giờ làm việc qua điện thoại.',
    'Công an phường thông báo: gần đây có hiện tượng giả danh công an, kiểm sát yêu cầu chuyển tiền vào tài khoản tạm giữ. Công an không bao giờ làm việc qua điện thoại và không yêu cầu chuyển tiền.',
    'Chúng tôi không yêu cầu chuyển tiền, không yêu cầu cung cấp OTP.',
  ]) {
    assert.strictEqual(nhan(c), 'CHUA_THAY', c);
  }
});

// §12 — "không yêu cầu…" / "có hiện tượng giả danh…" là VỎ BỌC mà kẻ lừa sẽ mượn. Lệnh phía sau PHẢI thoát khung.
test('chiều kẻ gian: lệnh đứng sau "không yêu cầu…" / "có hiện tượng giả danh…" vẫn nổ', () => {
  for (const c of [
    'Công an không yêu cầu chuyển tiền, bác cứ gửi 50 triệu vào tài khoản tạm giữ này, đừng nói ai.',
    'Công an không yêu cầu gì khác, bác chuyển tiền vào tài khoản tạm giữ ngay đi.',
    'Ngân hàng không yêu cầu đọc mã OTP, bác cứ đọc cho em để huỷ giao dịch.',
    'Gần đây có hiện tượng giả danh công an nên bác chuyển ngay tiền vào tài khoản an toàn này để được bảo vệ, đừng nói với ai.',
    'Có hiện tượng giả danh, nhưng tôi là công an thật. Bác chuyển tiền vào tài khoản tạm giữ ngay.',
  ]) {
    assert.ok(BAC[nhan(c)] >= BAC.NGHI_NGO, `bị khung nuốt mất lệnh: ${c}`);
  }
  assert.strictEqual(nhan('Công an không yêu cầu chuyển tiền, bác cứ gửi 50 triệu vào tài khoản tạm giữ này, đừng nói ai.'), 'CAO');
});

test('"Nếu hôm nay chị không chuyển … thì hồ sơ chuyển sang công an" (nhắc nợ giả) → có tín hiệu, nâng mức', () => {
  const c = 'Tôi gọi từ ngân hàng, chị đang nợ thẻ tín dụng 38 triệu quá hạn. Nếu hôm nay chị không chuyển 38 triệu vào tài khoản thu hồi nợ này thì hồ sơ sẽ chuyển sang công an.';
  assert.ok(ma(c).includes('FIN_TRANSFER_REQUEST'), 'lời doạ có chữ chen giữa "nếu" và "không" vẫn phải giữ FIN_TRANSFER_REQUEST');
  assert.ok(BAC[nhan(c)] >= BAC.NGHI_NGO);
  assert.strictEqual(nhan('Anh nhớ là không chuyển tiền cho ai lạ nhé.'), 'CHUA_THAY', 'phủ định thật vẫn là phủ định');
});

test('mượn / thuê căn cước, chụp hai mặt căn cước → CRED_ID_BIOMETRIC_DOCS', () => {
  assert.ok(ma('Cần mượn căn cước công dân để đăng ký sim và lập công ty, trả công 2 triệu mỗi người.').includes('CRED_ID_BIOMETRIC_DOCS'));
  assert.ok(ma('Bác chụp hai mặt căn cước gửi qua Zalo là xong.').includes('CRED_ID_BIOMETRIC_DOCS'));
  assert.ok(!ma('Bác nhớ mang căn cước khi đi khám bệnh nhé.').includes('CRED_ID_BIOMETRIC_DOCS'));
});

// ───────────── Bộ mở rộng eval/mo-rong ─────────────
const THU_MUC_BO = path.join(__dirname, '..', 'eval', 'mo-rong');
const mau = fs.readdirSync(THU_MUC_BO).filter((f) => f.endsWith('.jsonl')).sort()
  .flatMap((f) => fs.readFileSync(path.join(THU_MUC_BO, f), 'utf8').split(/\r?\n/).filter(Boolean).map((d) => JSON.parse(d)));

test('eval/mo-rong: đủ trường, id không trùng, KHÔNG có mẫu nguon="that" (không giả làm mẫu thật)', () => {
  const id = new Set();
  for (const m of mau) {
    for (const t of ['id', 'ho', 'kenh', 'ngon_ngu', 'noi_dung', 'muc_do', 'toi_da', 'nguon']) {
      assert.ok(m[t] !== undefined, `${m.id} thiếu ${t}`);
    }
    assert.ok(!id.has(m.id), `trùng id ${m.id}`);
    id.add(m.id);
    assert.notStrictEqual(m.nguon, 'that', `${m.id}: mẫu tự soạn không được ghi nguon="that"`);
    assert.ok(BAC[m.muc_do] <= BAC[m.toi_da], `${m.id}: muc_do cao hơn toi_da`);
  }
  assert.ok(mau.length >= 130);
});

test('eval/mo-rong: tin lành (toi_da=CHUA_THAY) 0 báo oan, và không mẫu nào vượt trần', () => {
  for (const m of mau) {
    const kq = nhan(m.noi_dung);
    assert.ok(BAC[kq] <= BAC[m.toi_da], `${m.id} vượt trần ${m.toi_da}: ra ${kq}`);
  }
});
