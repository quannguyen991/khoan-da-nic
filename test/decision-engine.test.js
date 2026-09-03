'use strict';
// Phụ lục B — cap nhóm, dedup, 10 tổ hợp cộng hưởng.
// §6.2 — thang 0–69, ngưỡng 20/45.

const test = require('node:test');
const assert = require('node:assert');

const {
  decide,
  SCORE_CAP,
  THRESHOLD_SUSPICIOUS,
  THRESHOLD_HIGH,
  SYNERGIES,
} = require('../backend/src/analysis/decision-engine');

const tinHieu = (...ids) => ids.map((id) => ({
  id, state: 'present', source: 'direct', confidence: 1.0,
  evidence: [{ quote: id, start: 0, end: 1, sourceId: 'test' }],
}));
const diem = (...ids) => decide(tinHieu(...ids)).score;

// ─────────────── §6.2 — hằng số khoá ───────────────

test('§6.2 — hằng số khoá đúng giá trị đã chốt', () => {
  assert.strictEqual(SCORE_CAP, 69);
  assert.strictEqual(THRESHOLD_SUSPICIOUS, 20);
  assert.strictEqual(THRESHOLD_HIGH, 45);
});

test('§6.2 — điểm KHÔNG BAO GIỜ vượt 69, không có dải 70–100', () => {
  const tatCa = [
    'FIN_SAFE_ACCOUNT', 'FIN_CASH_COURIER', 'FIN_GIFT_CARD_PAYMENT',
    'CRED_OTP_SHARE', 'CRED_PASSWORD_PIN', 'CRED_BANK_LOGIN',
    'DEV_SCREEN_SHARE_BANKING', 'DEV_REMOTE_CONTROL_APP',
    'MAN_SECRECY', 'MAN_FEAR_THREAT', 'MAN_URGENCY',
    'ID_AUTHORITY_IMPERSONATION', 'ID_BANK_IMPERSONATION',
    'OFF_ADVANCE_FEE', 'WEB_BRAND_DOMAIN_MISMATCH', 'FIN_TRANSFER_REQUEST',
  ];
  assert.strictEqual(diem(...tatCa), 69);
});

test('§6.2 — ngưỡng 20/45 chia đúng ba nhãn', () => {
  assert.strictEqual(decide(tinHieu()).riskLabel, 'NO_SIGNS_FOUND');
  // MAN_URGENCY 7 + MAN_SECRECY 10 = 17 (top2) → dưới 20
  assert.strictEqual(decide(tinHieu('MAN_URGENCY', 'MAN_SECRECY')).score, 17);
  assert.strictEqual(decide(tinHieu('MAN_URGENCY', 'MAN_SECRECY')).riskLabel, 'NO_SIGNS_FOUND');
  // CRED_BANK_LOGIN 20 → đúng ngưỡng
  assert.strictEqual(decide(tinHieu('CRED_BANK_LOGIN')).score, 20);
  assert.strictEqual(decide(tinHieu('CRED_BANK_LOGIN')).riskLabel, 'SUSPICIOUS');
});

test('§6.2 — PROTECTED_CRITICAL chỉ đến từ override, không bao giờ từ điểm số', () => {
  const kq = decide(tinHieu('FIN_SAFE_ACCOUNT', 'CRED_OTP_SHARE', 'MAN_FEAR_THREAT'));
  assert.strictEqual(typeof kq.score, 'number');
  assert.ok(['HIGH', 'SUSPICIOUS', 'NO_SIGNS_FOUND'].includes(kq.riskLabel));
  assert.ok(!('CRITICAL' === kq.riskLabel));
});

// ─────────────── B.1 — cap nhóm ───────────────

test('B.1 — credential lấy MAX: một yêu cầu không được cộng bốn lần', () => {
  // 25+25+22+20 = 92 cho MỘT câu nếu cộng thẳng — thang điểm mất hết ý nghĩa.
  const kq = decide(tinHieu('CRED_OTP_SHARE', 'CRED_PASSWORD_PIN', 'CRED_CARD_SECRET', 'CRED_BANK_LOGIN'));
  assert.strictEqual(kq.groupScores.credential, 25);
});

test('B.1 — money là max-plus (+6, tối đa MỘT lần)', () => {
  assert.strictEqual(decide(tinHieu('FIN_TRANSFER_REQUEST')).groupScores.money, 14);
  // max 14 + phụ 6 = 20
  assert.strictEqual(
    decide(tinHieu('FIN_TRANSFER_REQUEST', 'FIN_NEW_RECIPIENT')).groupScores.money, 20);
  // thêm tín hiệu phụ thứ hai KHÔNG cộng thêm lần nữa
  assert.strictEqual(
    decide(tinHieu('FIN_TRANSFER_REQUEST', 'FIN_NEW_RECIPIENT', 'FIN_TRANSFER_MEMO_MISMATCH')).groupScores.money, 20);
  // trần nhóm 30
  assert.strictEqual(
    decide(tinHieu('FIN_SAFE_ACCOUNT', 'FIN_CASH_COURIER')).groupScores.money, 30);
});

test('B.1 — identity là max-plus (+4 nếu có identity thứ hai độc lập)', () => {
  assert.strictEqual(decide(tinHieu('ID_AUTHORITY_IMPERSONATION')).groupScores.identity, 10);
  assert.strictEqual(
    decide(tinHieu('ID_AUTHORITY_IMPERSONATION', 'ID_BANK_IMPERSONATION')).groupScores.identity, 14);
  assert.strictEqual(
    decide(tinHieu('ID_AUTHORITY_IMPERSONATION', 'ID_BANK_IMPERSONATION', 'ID_FAMILY_IMPERSONATION'))
      .groupScores.identity, 14);
  // trần nhóm 16
  assert.strictEqual(
    decide(tinHieu('ID_FAMILY_EMERGENCY_THIRD_PARTY', 'ID_KHOAN_DA_IMPERSONATION')).groupScores.identity, 16);
});

test('B.1 — manipulation lấy TOP2', () => {
  const kq = decide(tinHieu('MAN_FEAR_THREAT', 'MAN_SECRECY', 'MAN_URGENCY', 'MAN_ISOLATION'));
  assert.strictEqual(kq.groupScores.manipulation, 22); // 12 + 10
  // trần 24
  assert.strictEqual(
    decide(tinHieu('MAN_EXTORTION_MEDIA_THREAT', 'MAN_FEAR_THREAT')).groupScores.manipulation, 24);
});

test('B.1 — device lấy MAX', () => {
  assert.strictEqual(
    decide(tinHieu('DEV_SCREEN_SHARE_BANKING', 'DEV_REMOTE_CONTROL_APP', 'DEV_CALL_FORWARD'))
      .groupScores.device, 30);
});

test('B.1 — offer lấy MAX: không stack prize + investment + task', () => {
  assert.strictEqual(
    decide(tinHieu('OFF_ADVANCE_FEE', 'OFF_INVESTMENT_GUARANTEE', 'OFF_PRIZE_GIFT')).groupScores.offer, 12);
});

test('B.1 — web lấy TOP2, trần 20', () => {
  assert.strictEqual(
    decide(tinHieu('WEB_BRAND_DOMAIN_MISMATCH', 'WEB_NONOFFICIAL_APP_SOURCE', 'WEB_SHORTENER_REDIRECT'))
      .groupScores.web, 20); // 16+12 = 28 → cap 20
});

test('B.1 — case lấy TOP2', () => {
  assert.strictEqual(
    decide(tinHieu('CASE_MULTI_CHANNEL_ESCALATION', 'CASE_STAGE_ESCALATION', 'CASE_REPEATED_CONTACT'))
      .groupScores.case, 12); // 8+8 = 16 → cap 12
});

test('Dedup — cùng SIGNAL_ID gửi hai lần không cộng hai lần', () => {
  const trung = [...tinHieu('FIN_TRANSFER_REQUEST'), ...tinHieu('FIN_TRANSFER_REQUEST')];
  assert.strictEqual(decide(trung).groupScores.money, 14);
});

// ─────────────── B.2 — mười tổ hợp cộng hưởng ───────────────

test('B.2 — đúng mười tám tổ hợp, không thừa không thiếu', () => {
  assert.strictEqual(SYNERGIES.length, 18);
  const mong = {
    'secrecy+fear+transfer': 15,
    'recoverysupport+recoveryfee': 15,
    'devicetakeover+banklogin': 15,
    'identity+transfer': 14,
    'identity+credential': 10,
    'identity+device': 10,
    'brandmismatch+credential': 10,
    'family+urgency+transfer': 10,
    // 10 → 12 ngày 2/9/2026: "cớ + hối thúc + chuyển tiền" kẹt ở 43. Xem B.6.
    'coverstory+transfer': 12,
    'stageescalation+action': 8,
    // Thêm 15/8/2026, người dùng duyệt sau khi xem số đo trên 445 mẫu.
    'offer+transfer': 14,
    'advancefee+transfer': 14,
    'orgclaim+transfer': 14,
    // Thêm 2/9/2026, người dùng duyệt sau khi xem số đo. Xem khối B.5 bên dưới.
    'credential+manipulation': 10,
    // Thêm 2/9/2026 — nhắm bốn mẫu hình còn trượt ở tiếng Việt. Xem B.6.
    'extortion+transfer': 10,
    'keepcall+fear+transfer': 12,
    'secrecy+isolation+transfer': 12,
    'brandmismatch+pressure': 10,
  };
  for (const s of SYNERGIES) {
    assert.strictEqual(s.bonus, mong[s.id], `bonus ${s.id}`);
  }
  assert.strictEqual(Object.keys(mong).length, SYNERGIES.length);
});

test('B.3 — identity+transfer là 14, KHÔNG phải 10', () => {
  const s = SYNERGIES.find((x) => x.id === 'identity+transfer');
  assert.strictEqual(s.bonus, 14, '+10 làm kịch bản trung tâm dừng ở 41, dưới ngưỡng 45');
});

test('B.4 — kịch bản trung tâm: giả danh + đòi chuyển khoản + hối thúc = ĐÚNG 45', () => {
  // "Tôi là điều tra viên, bác chuyển tiền ngay, chậm là bị phong toả"
  const kq = decide(tinHieu('ID_AUTHORITY_IMPERSONATION', 'FIN_TRANSFER_REQUEST', 'MAN_URGENCY'));
  assert.strictEqual(kq.groupScores.identity, 10);
  assert.strictEqual(kq.groupScores.money, 14);
  assert.strictEqual(kq.groupScores.manipulation, 7);
  assert.deepStrictEqual(kq.appliedSynergies.map((s) => s.id), ['identity+transfer']);
  assert.strictEqual(kq.score, 45);
  assert.strictEqual(kq.riskLabel, 'HIGH', 'đây là 44/82 mẫu trượt nhãn vàng của bản +10');
});

test('B.3 — identity+credential và identity+device tồn tại (bảng 8.11 thiếu)', () => {
  // Bất đối xứng của 8.11 không có lý do thiết kế: tự xưng công an đòi mã OTP
  // nguy hiểm ngang tự xưng công an đòi chuyển tiền.
  assert.ok(decide(tinHieu('ID_BANK_IMPERSONATION', 'CRED_OTP_SHARE'))
    .appliedSynergies.some((s) => s.id === 'identity+credential'));
  assert.ok(decide(tinHieu('ID_TECH_SUPPORT_IMPERSONATION', 'DEV_REMOTE_CONTROL_APP'))
    .appliedSynergies.some((s) => s.id === 'identity+device'));
});

test('B.3 — hai tổ hợp đó kéo họ kịch bản thật LÊN TRÊN ngưỡng 45', () => {
  // "bank + đòi mã": 8 + 25 + 7 = 40 → thiếu 5 điểm. Cộng hưởng +10 mới qua ngưỡng.
  const bank = tinHieu('ID_BANK_IMPERSONATION', 'CRED_OTP_SHARE', 'MAN_URGENCY');
  assert.strictEqual(decide(bank).baseScore, 40, 'đúng dải 41–44 mà B.3 mô tả');
  assert.ok(decide(bank).score >= 45, 'họ "bank + đòi mã" phải lên Nguy hiểm cao');
  assert.strictEqual(decide(bank).riskLabel, 'HIGH');

  // "tech support + đòi thiết bị": 10 + 28 = 38, cộng hưởng +10 = 48.
  const tech = tinHieu('ID_TECH_SUPPORT_IMPERSONATION', 'DEV_REMOTE_CONTROL_APP');
  assert.strictEqual(decide(tech).baseScore, 38);
  assert.ok(decide(tech).score >= 45);
  assert.strictEqual(decide(tech).riskLabel, 'HIGH');
});

// ─────────── B.5 — vùng chết "đòi mã + gây áp lực" (thêm 2/9/2026) ───────────
//
// VÌ SAO: mọi tổ hợp cộng hưởng có `CRED_` đều đòi kèm `ID_` hoặc
// `WEB_BRAND_DOMAIN_MISMATCH`. Nên tin nhắn THUẦN "đòi mã + gây sức ép" — kẻ
// lừa đảo không tự xưng là ai cả — không có đường nào chạm ngưỡng 45.
//
// Số học của vùng chết: credential cap 25, manipulation lấy top2 nên trần thực
// tế là 12+7 = 19. Tổng luôn ≤ 44, ĐÚNG MỘT ĐIỂM dưới ngưỡng.
//
// ĐO TRÊN 445 MẪU (chi-tiet.jsonl, lượt 15/8): tổ hợp khớp 26 mẫu — 25 mẫu
// vàng CAO, 1 mẫu NGHI_NGO, KHÔNG mẫu lành nào. Báo đỏ oan không đổi.

test('B.5 — vùng chết: CRED_ + MAN_ thuần luôn kẹt ≤44 nếu không có cộng hưởng', () => {
  const kq = decide(tinHieu('CRED_OTP_SHARE', 'MAN_FEAR_THREAT', 'MAN_URGENCY'));
  assert.strictEqual(kq.groupScores.credential, 25);
  assert.strictEqual(kq.groupScores.manipulation, 19, 'top2 = 12 + 7');
  assert.strictEqual(kq.baseScore, 44, 'đúng một điểm dưới ngưỡng 45');
});

test('B.5 — cộng hưởng credential+manipulation kéo vùng chết lên Nguy hiểm cao', () => {
  // vi-otp-05: "ma xac nhan vua gui đó cô, đọc e 6 số ngay nha k quá hạn là tài khoản bị treo"
  const otp = decide(tinHieu('CRED_OTP_SHARE', 'MAN_FEAR_THREAT', 'MAN_URGENCY'));
  assert.ok(otp.appliedSynergies.some((s) => s.id === 'credential+manipulation'));
  assert.strictEqual(otp.score, 54);
  assert.strictEqual(otp.riskLabel, 'HIGH');

  // vi-otp-08: "Cô đừng tắt máy… khi mã xác thực tới, cô đọc ngay cho tôi thì mới chặn kịp"
  const giuMay = decide(tinHieu(
    'CRED_OTP_SHARE', 'MAN_COVER_STORY', 'MAN_URGENCY', 'MAN_KEEP_CALL_ACTIVE',
  ));
  assert.strictEqual(giuMay.baseScore, 44);
  assert.strictEqual(giuMay.riskLabel, 'HIGH');
});

test('B.5 — KHÔNG nổ khi thiếu một trong hai vế', () => {
  const chiMa = decide(tinHieu('CRED_OTP_SHARE'));
  const chiEp = decide(tinHieu('MAN_URGENCY', 'MAN_FEAR_THREAT'));
  for (const kq of [chiMa, chiEp]) {
    assert.ok(!kq.appliedSynergies.some((s) => s.id === 'credential+manipulation'));
  }
  assert.strictEqual(chiEp.riskLabel, 'NO_SIGNS_FOUND', 'sức ép đơn thuần KHÔNG được lên mức nào');
});

test('B.5 — tổ hợp mới KHÔNG đụng tới ngưỡng, cap, hay tin chỉ có tiền + sức ép', () => {
  assert.strictEqual(THRESHOLD_HIGH, 45);
  assert.strictEqual(SCORE_CAP, 69);
  // "Con cần gấp 5 triệu đóng học phí" — tiền + hối thúc, KHÔNG có đòi mã.
  // Tổ hợp mới phải không chạm vào lớp mẫu này (xem neg-tien-04).
  const conXinTien = decide(tinHieu('FIN_TRANSFER_REQUEST', 'MAN_URGENCY'));
  assert.ok(!conXinTien.appliedSynergies.some((s) => s.id === 'credential+manipulation'));
});

// ───────── B.6 — bốn mẫu hình tiếng Việt còn trượt (thêm 2/9/2026) ─────────
//
// Đo trên 497 mẫu, sau khi gỡ cổng lọc cue: recall tiếng Việt 75,3%. Bốn mẫu
// hình dưới đây chiếm phần lớn số còn trượt, tất cả đều TRÍCH TÍN HIỆU ĐÚNG mà
// vẫn dừng dưới 45. Thêm bốn tổ hợp + nâng `coverstory+transfer` 10→12:
//   recall vi 75,3% → 83,6% · en 87,9% · trộn 94,3% · FP báo đỏ KHÔNG ĐỔI 6,5%
//
// Bốn trong năm thay đổi KHÔNG chạm mẫu lành nào. `coverstory+transfer` chạm
// đúng một mẫu (neg-tien-09) vốn đã ở 69 điểm, nên kết luận không đổi.

test('B.6 — tống tiền bằng ảnh riêng tư + đòi chuyển khoản phải là Nguy hiểm cao', () => {
  // real-vi-045: "Tôi có hồ sơ và hình ảnh liên quan đến anh. Nếu không chuyển
  // khoản theo yêu cầu, toàn bộ sẽ được gửi đi."
  // Trần nhóm manipulation là 24, đúng bằng trọng số MAN_EXTORTION_MEDIA_THREAT,
  // nên hai tín hiệu sức ép đi kèm KHÔNG cộng thêm gì: 24 + 14 = 38.
  const kq = decide(tinHieu(
    'MAN_EXTORTION_MEDIA_THREAT', 'FIN_TRANSFER_REQUEST', 'MAN_FEAR_THREAT', 'MAN_URGENCY',
  ));
  assert.strictEqual(kq.baseScore, 38, 'trần nhóm nuốt hết sức ép đi kèm');
  assert.ok(kq.appliedSynergies.some((s) => s.id === 'extortion+transfer'));
  assert.strictEqual(kq.riskLabel, 'HIGH');
});

test('B.6 — giữ máy + doạ + ra ATM rút tiền phải là Nguy hiểm cao', () => {
  // vi-congan-06: "chú giữ máy đấy nhé, ko được tắt. chú ra cây ATM rút hết
  // tiền ra rồi tôi hướng dẫn nộp, chậm là bị bắt"
  const kq = decide(tinHieu(
    'FIN_TRANSFER_REQUEST', 'MAN_FEAR_THREAT', 'MAN_URGENCY', 'MAN_KEEP_CALL_ACTIVE',
  ));
  assert.strictEqual(kq.baseScore, 33);
  assert.ok(kq.appliedSynergies.some((s) => s.id === 'keepcall+fear+transfer'));
  assert.ok(kq.score >= 45);
  assert.strictEqual(kq.riskLabel, 'HIGH');
});

test('B.6 — cô lập + giữ bí mật + chuyển tiền phải là Nguy hiểm cao', () => {
  // vi-nguoithan-06: "Mẹ chuyển giúp con 12 triệu, và mẹ đừng kể với bố nhé"
  // Tách người bị hại khỏi người có thể can là dấu hiệu lõi của kịch bản này.
  const kq = decide(tinHieu('FIN_TRANSFER_REQUEST', 'MAN_ISOLATION', 'MAN_SECRECY'));
  assert.strictEqual(kq.baseScore, 34);
  assert.ok(kq.appliedSynergies.some((s) => s.id === 'secrecy+isolation+transfer'));
  assert.strictEqual(kq.riskLabel, 'HIGH');
});

test('B.6 — tên miền giả mạo thương hiệu + gây sức ép phải là Nguy hiểm cao', () => {
  // real-vi-003: "Tài khoản đang bị ghi nhận phí dịch vụ 2,8 triệu. Hệ thống sẽ
  // khoá nếu không xác minh." — kèm liên kết không khớp thương hiệu.
  const kq = decide(tinHieu('WEB_BRAND_DOMAIN_MISMATCH', 'MAN_FEAR_THREAT', 'MAN_URGENCY'));
  assert.ok(kq.appliedSynergies.some((s) => s.id === 'brandmismatch+pressure'));
  assert.ok(kq.score >= 45);
});

test('B.6 — "cớ + hối thúc + chuyển tiền" thoát vùng chết 43 điểm', () => {
  // 5 mẫu trượt cùng đúng tổ hợp này, gồm cớ chống chế deepfake:
  // "mình đang kẹt. Video lúc nãy mạng yếu nên không nghe rõ"
  const kq = decide(tinHieu('FIN_TRANSFER_REQUEST', 'MAN_COVER_STORY', 'MAN_URGENCY'));
  assert.strictEqual(kq.baseScore, 33, '14 + top2(12,7)=19');
  assert.strictEqual(kq.score, 45, 'bonus 12 đưa đúng lên ngưỡng, không hơn');
  assert.strictEqual(kq.riskLabel, 'HIGH');
});

test('B.6 — không tổ hợp mới nào nổ khi thiếu vế YÊU CẦU HÀNH ĐỘNG', () => {
  // Sức ép đơn thuần, không đòi tiền / không đòi mã: KHÔNG được lên mức nào.
  for (const bo of [
    ['MAN_EXTORTION_MEDIA_THREAT'],
    ['MAN_KEEP_CALL_ACTIVE', 'MAN_FEAR_THREAT'],
    ['MAN_ISOLATION', 'MAN_SECRECY'],
  ]) {
    const kq = decide(tinHieu(...bo));
    const moi = ['extortion+transfer', 'keepcall+fear+transfer', 'secrecy+isolation+transfer'];
    assert.ok(
      !kq.appliedSynergies.some((s) => moi.includes(s.id)),
      `${bo.join('+')} không có vế chuyển tiền mà vẫn nổ tổ hợp`,
    );
  }
});

test('B.2 — mỗi bonus chỉ áp dụng MỘT lần dù nhiều tín hiệu cùng khớp', () => {
  const kq = decide(tinHieu(
    'ID_AUTHORITY_IMPERSONATION', 'ID_BANK_IMPERSONATION',
    'FIN_TRANSFER_REQUEST', 'FIN_CRYPTO_TRANSFER',
  ));
  const lan = kq.appliedSynergies.filter((s) => s.id === 'identity+transfer').length;
  assert.strictEqual(lan, 1);
});

test('B.2 — secrecy+fear+transfer nổ đúng điều kiện ba vế', () => {
  const du = decide(tinHieu('MAN_SECRECY', 'MAN_FEAR_THREAT', 'FIN_TRANSFER_REQUEST'));
  assert.ok(du.appliedSynergies.some((s) => s.id === 'secrecy+fear+transfer'));
  const thieu = decide(tinHieu('MAN_SECRECY', 'FIN_TRANSFER_REQUEST'));
  assert.ok(!thieu.appliedSynergies.some((s) => s.id === 'secrecy+fear+transfer'));
});

test('B.2 — devicetakeover+banklogin nhận CẢ HAI vế OR', () => {
  for (const dev of ['DEV_REMOTE_CONTROL_APP', 'DEV_ACCESSIBILITY_PERMISSION']) {
    const kq = decide(tinHieu(dev, 'CRED_BANK_LOGIN'));
    assert.ok(kq.appliedSynergies.some((s) => s.id === 'devicetakeover+banklogin'), dev);
  }
});

test('B.2 — identity+transfer nhận đủ năm tín hiệu tiền ở vế sau', () => {
  const veSau = ['FIN_TRANSFER_REQUEST', 'FIN_CRYPTO_TRANSFER', 'FIN_CASH_COURIER',
    'FIN_PRECIOUS_METAL_PURCHASE', 'FIN_SAFE_ACCOUNT'];
  for (const fin of veSau) {
    const kq = decide(tinHieu('ID_UTILITY_IMPERSONATION', fin));
    assert.ok(kq.appliedSynergies.some((s) => s.id === 'identity+transfer'), fin);
  }
  // FIN_NEW_RECIPIENT KHÔNG nằm trong vế sau
  const ngoai = decide(tinHieu('ID_UTILITY_IMPERSONATION', 'FIN_NEW_RECIPIENT'));
  assert.ok(!ngoai.appliedSynergies.some((s) => s.id === 'identity+transfer'));
});

test('B.2 — stageescalation+action cần một hành động CRED/FIN/DEV', () => {
  const co = decide(tinHieu('CASE_STAGE_ESCALATION', 'CRED_OTP_SHARE'));
  assert.ok(co.appliedSynergies.some((s) => s.id === 'stageescalation+action'));
  const khong = decide(tinHieu('CASE_STAGE_ESCALATION', 'MAN_URGENCY'));
  assert.ok(!khong.appliedSynergies.some((s) => s.id === 'stageescalation+action'));
});

// ─────────────── §4.2 — hàm thuần, chỉ tăng cảnh giác ───────────────

test('§4.2 — decide là hàm THUẦN, không đọc mạng/DB/LLM', () => {
  const a = decide(tinHieu('ID_AUTHORITY_IMPERSONATION', 'FIN_TRANSFER_REQUEST'));
  const b = decide(tinHieu('ID_AUTHORITY_IMPERSONATION', 'FIN_TRANSFER_REQUEST'));
  assert.deepStrictEqual(a, b);
});

test('§4.2 — thêm tín hiệu chỉ LÀM TĂNG điểm, không bao giờ giảm', () => {
  const goc = diem('ID_AUTHORITY_IMPERSONATION', 'FIN_TRANSFER_REQUEST');
  for (const them of ['MAN_URGENCY', 'WEB_SHORTENER_REDIRECT', 'OFF_PRIZE_GIFT', 'CASE_REPEATED_CONTACT']) {
    const sau = diem('ID_AUTHORITY_IMPERSONATION', 'FIN_TRANSFER_REQUEST', them);
    assert.ok(sau >= goc, `thêm ${them} làm TỤT điểm: ${goc} → ${sau}`);
  }
});

test('§4.2 — maLyDo là MÃ, không phải câu tiếng Việt', () => {
  const kq = decide(tinHieu('ID_AUTHORITY_IMPERSONATION', 'FIN_TRANSFER_REQUEST'));
  assert.ok(Array.isArray(kq.maLyDo));
  for (const ma of kq.maLyDo) {
    assert.match(ma, /^[A-Z][A-Z0-9_]+$/, `"${ma}" không phải MÃ`);
  }
});

test('Tín hiệu state "unknown" KHÔNG được tính điểm', () => {
  const hh = tinHieu('FIN_SAFE_ACCOUNT');
  hh[0].state = 'unknown';
  assert.strictEqual(decide(hh).score, 0);
});

test('Tín hiệu lạ không có trong registry bị bỏ qua, không làm sập', () => {
  assert.strictEqual(decide(tinHieu('KHONG_CO_TRONG_REGISTRY')).score, 0);
});
