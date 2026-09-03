'use strict';
// §4.3 — SÀN ĐẦU VÀO KHÔNG ĐỌC ĐƯỢC.
// Hàng rào cho unreadableInputFloor() trong src/analysis/pipeline.js.

const test = require('node:test');
const assert = require('node:assert');

const { analyze, unreadableInputFloor } = require('../backend/src/analysis/pipeline');

test('§4.3 — ảnh không đọc được sinh mã chuaKiem, không im lặng', () => {
  const san = unreadableInputFloor({ anh: 'data:image/png;base64,xxx', ocrFailed: true });
  assert.ok(san.chuaKiem.includes('khong_doc_duoc_anh'));
  assert.ok(!san.daKiem.includes('anh_ocr'));
});

test('§4.3 — AI chết sinh mã chuaKiem riêng', () => {
  const san = unreadableInputFloor({ vanBan: 'abc', aiError: 'AI_TIMEOUT' });
  assert.ok(san.chuaKiem.includes('ai_khong_phan_hoi'));
});

test('§4.3 — tên miền không phân giải được sinh mã chuaKiem', () => {
  const san = unreadableInputFloor({ vanBan: 'abc', urlUnresolved: ['abc.xyz'] });
  assert.ok(san.chuaKiem.includes('khong_mo_duoc_link'));
});

test('§4.3 — OCR độ tin cậy thấp KHÔNG được âm thầm đoán', () => {
  const san = unreadableInputFloor({ anh: 'data:image/png;base64,xxx', ocrConfidence: 0.2 });
  assert.ok(san.chuaKiem.length > 0);
});

test('§4.3 — không có gì bất thường thì sàn trả danh sách rỗng', () => {
  const san = unreadableInputFloor({ vanBan: 'Bác ơi cháu về rồi.' });
  assert.deepStrictEqual(san.chuaKiem, []);
  assert.deepStrictEqual(san.daKiem, ['van_ban']);
});

test('§4.3 — KHÔNG nguồn nào đọc được ⇒ nhãn KHÔNG được là CHUA_THAY', () => {
  const kq = analyze({ anh: 'data:image/png;base64,xxx', ocrFailed: true });
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY',
    'ảnh không đọc được mà hiện "Chưa thấy dấu hiệu rủi ro" là đúng lỗi §4.3');
  assert.strictEqual(kq.daKiem.length, 0);
  assert.ok(kq.chuaKiem.length > 0);
});

test('§4.3 — sàn KHÔNG BAO GIỜ hạ mức đã có từ nguồn đọc được', () => {
  const vanBan = 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an ngay.';
  const chiText = analyze({ vanBan });
  const themAnhHong = analyze({ vanBan, anh: 'data:image/png;base64,xxx', ocrFailed: true });
  assert.strictEqual(themAnhHong.nhan, chiText.nhan);
  assert.ok(themAnhHong.score >= chiText.score, 'sàn chỉ được LÀM TĂNG cảnh giác');
  assert.ok(themAnhHong.chuaKiem.includes('khong_doc_duoc_anh'));
});

test('§HĐ luật 3 — chuaKiem không rỗng luôn đi kèm nhãn, không bị nuốt', () => {
  const kq = analyze({ vanBan: 'Bác ơi cháu về rồi.', anh: 'x', ocrFailed: true });
  assert.ok(Array.isArray(kq.chuaKiem) && kq.chuaKiem.length > 0);
  for (const ma of kq.chuaKiem) {
    assert.match(ma, /^[a-z][a-z0-9_]+$/, `chuaKiem phải là MÃ, gặp "${ma}"`);
  }
});

test('§4.3 — THÊM NGUỒN MỚI thì phải thêm ca: sàn nhận diện nguồn lạ', () => {
  // Ràng buộc thường trực: video/ghi âm/tệp khác thêm vào thì phải khai ở đây.
  const san = unreadableInputFloor({ ghiAm: 'x', ghiAmFailed: true });
  assert.ok(san.chuaKiem.length > 0,
    'nguồn đầu vào mới không được rơi vào khoảng lặng của sàn');
});

// ═══════════ §4.3 — NGUỒN ĐẦU VÀO THỨ SÁU: GHI ÂM TRÊN MÁY ═══════════
// Ràng buộc thường trực ở pipeline.js:32 — thêm nguồn mới thì THÊM CA VÀO ĐÂY.

test('ghi âm #1 — model chưa tải xong có mã RIÊNG, không gộp', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'CHUA_TAI_MODEL' });
  assert.ok(san.chuaKiem.includes('chua_tai_xong_model_nghe'));
  assert.ok(!san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
    'chưa tải bộ nghe KHÁC không giải mã được — bác tự sửa được cái đầu');
});

test('ghi âm #2 — có đoạn dưới ngưỡng ⇒ không im lặng', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo alo', ghiAmConfidence: 0.3 });
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('ghi âm #3 — không có tiếng người có mã riêng', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'KHONG_CO_TIENG_NOI' });
  assert.ok(san.chuaKiem.includes('ghi_am_khong_co_tieng_noi'));
});

test('ghi âm #4 — đoạn ghi bị cắt có mã riêng', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo', ghiAmConfidence: 0.9, ghiAmMaLoi: 'BI_CAT' });
  assert.ok(san.chuaKiem.includes('chi_nghe_duoc_phan_dau'));
});

test('ghi âm #5 — whisper ném lỗi ⇒ khong_nghe_duoc_ghi_am', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true });
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('ghi âm #6 — mã lỗi lạ vẫn ra mã, không rơi vào khoảng lặng', () => {
  const san = unreadableInputFloor({ ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'MA_LA_KHONG_BIET' });
  assert.ok(san.chuaKiem.length > 0, 'mã lỗi lạ không được rơi vào khoảng lặng');
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('ghi âm #7 — confidence KHÔNG PHẢI SỐ bị coi là HỎNG, không phải là tốt', () => {
  // ⚠️ `-1` KHÔNG có trong danh sách này: nó là GIÁ TRỊ CANH nghĩa "máy không
  // chấm điểm", không phải rác. Ca #9b giữ nghĩa đó. Mọi số âm khác vẫn là rác.
  for (const bay of [undefined, null, 'cao', NaN, -2, -0.5, 1.5, {}]) {
    const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo', ghiAmConfidence: bay });
    assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
      `ghiAmConfidence=${String(bay)} phải bị coi là hỏng`);
  }
});

test('ghi âm #8 — HỎNG MỘT PHẦN là daKiem VÀ chuaKiem CÙNG LÚC', () => {
  // Ca thường gặp nhất của whisper: nghe được phần lớn, hụt một đoạn.
  // Khai một trong hai đều nói sai (spec §5.1).
  const san = unreadableInputFloor({
    ghiAm: true, vanBan: 'bác chuyển tiền đi', ghiAmConfidence: 0.3,
  });
  assert.ok(san.daKiem.includes('ghi_am'), 'đã phiên âm được thì phải khai');
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'), 'hụt đoạn thì phải khai');
});

test('ghi âm — nghe tốt hoàn toàn thì KHÔNG sinh mã hỏng nào của ghi âm', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo bác ơi', ghiAmConfidence: 0.95 });
  assert.ok(san.daKiem.includes('ghi_am'));
  const maGhiAm = ['khong_nghe_duoc_ghi_am', 'chua_tai_xong_model_nghe',
    'ghi_am_khong_co_tieng_noi', 'chi_nghe_duoc_phan_dau'];
  assert.deepStrictEqual(san.chuaKiem.filter((m) => maGhiAm.includes(m)), []);
});

test('ghi âm #9 — nghe RA CHỮ nhưng máy không chấm điểm có mã RIÊNG', () => {
  // SpeechRecognizer của Android không bắt buộc trả CONFIDENCE_SCORES.
  const san = unreadableInputFloor({
    ghiAm: true, vanBan: 'bác chuyển tiền đi', ghiAmMaLoi: 'KHONG_DO_DUOC_DO_TIN_CAY',
  });
  assert.ok(san.daKiem.includes('ghi_am'), 'đã ra chữ thì phải khai là đã kiểm');
  assert.ok(san.chuaKiem.includes('ghi_am_khong_do_duoc_do_tin_cay'));
  assert.ok(!san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
    'nói "không giải mã được" là sai — máy đã giải mã ra chữ, chỉ là chưa đo được');
});

test('ghi âm #9b — giá trị canh -1 cũng là "không chấm điểm", không phải điểm thấp', () => {
  // Lớp native trả -1; tầng gọi có thể khai bằng mã. Nhận cả hai lối.
  const san = unreadableInputFloor({
    ghiAm: true, vanBan: 'bác chuyển tiền đi', ghiAmConfidence: -1,
  });
  assert.ok(san.daKiem.includes('ghi_am'));
  assert.ok(san.chuaKiem.includes('ghi_am_khong_do_duoc_do_tin_cay'));
  assert.ok(!san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
    '-1 rơi vào nhánh "dưới ngưỡng" là nói sai — máy đã giải mã ra chữ');
});

test('ghi âm #9c — điểm thấp THẬT vẫn là không nghe được, đừng lẫn với -1', () => {
  const san = unreadableInputFloor({ ghiAm: true, vanBan: 'alo', ghiAmConfidence: 0.1 });
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
  assert.ok(!san.chuaKiem.includes('ghi_am_khong_do_duoc_do_tin_cay'));
});

test('ghi âm #10 — bị cắt VÀ đoạn còn lại mờ là HAI mã, không nuốt bớt', () => {
  const san = unreadableInputFloor({
    ghiAm: true, vanBan: 'alo', ghiAmConfidence: 0.2, ghiAmMaLoi: 'BI_CAT',
  });
  assert.ok(san.chuaKiem.includes('chi_nghe_duoc_phan_dau'));
  assert.ok(san.chuaKiem.includes('khong_nghe_duoc_ghi_am'));
});

test('§15.9.1 — nghe được ghi âm KHÔNG gỡ chua_nghe_duoc_cuoc_goi', () => {
  // Ghi qua loa ngoài là nghe cái MICRO ĐẶT CẠNH cuộc gọi, không phải nghe
  // cuộc gọi. Phiếu tin cậy phải nói đúng cái thứ hai.
  const kq = analyze({ vanBan: 'alo bác ơi', ghiAm: true, ghiAmConfidence: 0.95 });
  assert.ok(kq.chuaKiem.includes('chua_nghe_duoc_cuoc_goi'));
});

/**
 * ⚠️ MÃ LỖI CỤ THỂ PHẢI THẮNG "THIẾU SỐ ĐO" — ĐO ĐƯỢC 16/8/2026 KHI NÓ KHÔNG THẮNG.
 *
 * Lớp native báo hỏng thì CŨNG gửi `doTinCayThapNhat = -1` — hỏng thì lấy đâu ra
 * số đo. Nếu để `-1` quyết trước thì mọi mã cụ thể bị nuốt, và cả hai ca dưới
 * đây đều ra `ghi_am_khong_do_duoc_do_tin_cay` — một câu KHẲNG ĐỊNH máy đã giải
 * mã ra chữ, trong khi nó không nghe được gì.
 *
 * Đây là §4.3 sai ngay bên trong chỗ xử lý §4.3, và sai theo hướng NÓI QUÁ những
 * gì máy làm được — hướng nguy hiểm hơn.
 */
test('ghi âm #10 — mã CỤ THỂ thắng, dù có kèm -1', () => {
  const ca = [
    ['CHUA_TAI_MODEL', 'chua_tai_xong_model_nghe'],
    ['KHONG_CO_TIENG_NOI', 'ghi_am_khong_co_tieng_noi'],
  ];
  for (const [maGui, maMong] of ca) {
    const san = unreadableInputFloor({
      ghiAm: true, vanBan: '', ghiAmConfidence: -1, ghiAmFailed: true, ghiAmMaLoi: maGui,
    });
    assert.ok(san.chuaKiem.includes(maMong),
      `${maGui} bị nuốt, chuaKiem = ${san.chuaKiem.join(', ')}`);
    assert.ok(!san.chuaKiem.includes('ghi_am_khong_do_duoc_do_tin_cay'),
      `${maGui} bị đổi thành "không đo được độ tin" — nói máy đã ra chữ trong khi không`);
  }
});

test('ghi âm #10b — BỊ CẮT giữ nguyên mã, kể cả khi điểm tin cậy tốt', () => {
  const san = unreadableInputFloor({
    ghiAm: true, vanBan: 'bác chuyển 50 triệu sang', ghiAmConfidence: 0.8, ghiAmMaLoi: 'BI_CAT',
  });
  assert.ok(san.daKiem.includes('ghi_am'), 'có chữ thì vẫn là đã kiểm được một phần');
  assert.ok(san.chuaKiem.includes('chi_nghe_duoc_phan_dau'));
  assert.ok(!san.chuaKiem.includes('khong_nghe_duoc_ghi_am'),
    'điểm tin cậy tốt mà báo "không nghe được" là nói sai');
});

/**
 * §4.3 — SÀN CHO GHI ÂM MÀ TA BIẾT ĐÃ MẤT NỘI DUNG.
 *
 * Đo qua HTTP 16/8/2026: bản chép bị cắt còn "Bác chuyển 50 triệu sang" ra
 * `CHUA_THAY` — màn hình nói "Chưa thấy dấu hiệu rủi ro" về một đoạn ghi âm mà
 * chính ta biết là chưa nghe hết.
 */
test('ghi âm #11 — bị cắt / nghe kém KHÔNG được ra nhãn thấp nhất', () => {
  const { analyze, toHopDong } = require('../backend/src/analysis/pipeline');
  const cut = 'Bác chuyển 50 triệu sang';

  for (const nguon of [
    { ghiAm: true, ghiAmConfidence: 0.8, ghiAmMaLoi: 'BI_CAT' },
    { ghiAm: true, ghiAmConfidence: 0.2 },
  ]) {
    const r = toHopDong(analyze({ vanBan: cut, ...nguon }));
    assert.notStrictEqual(r.nhan, 'CHUA_THAY',
      `mất nội dung mà vẫn ra CHUA_THAY: ${JSON.stringify(nguon)}`);
  }
});

/**
 * ⚠️ VÀ SÀN ĐÓ KHÔNG ĐƯỢC LAN SANG CA "CHỈ THIẾU SỐ ĐO".
 *
 * Phần lớn bộ nghe trên máy Android không trả `CONFIDENCE_SCORES`. Áp sàn cho ca
 * đó là mọi lượt ghi âm trên gần như mọi máy đều thành NGHI_NGO — báo động giả
 * tràn lan, và §4.6 nhắc thẳng rằng người dùng sẽ gỡ ứng dụng.
 */
test('ghi âm #11b — thiếu SỐ ĐO thì nói ra, KHÔNG nâng mức', () => {
  const { analyze, toHopDong } = require('../backend/src/analysis/pipeline');
  const r = toHopDong(analyze({
    vanBan: 'Chào bác, mai cháu qua chơi nhé.', ghiAm: true, ghiAmConfidence: -1,
  }));
  assert.strictEqual(r.nhan, 'CHUA_THAY', 'thiếu số đo mà nâng mức ⇒ báo động giả tràn lan');
  assert.ok(r.chuaKiem.includes('ghi_am_khong_do_duoc_do_tin_cay'),
    'nâng mức thì không, nhưng NÓI RA thì bắt buộc');
});
