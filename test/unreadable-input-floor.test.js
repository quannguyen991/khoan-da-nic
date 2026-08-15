'use strict';
// §4.3 — SÀN ĐẦU VÀO KHÔNG ĐỌC ĐƯỢC.
// Hàng rào cho unreadableInputFloor() trong src/analysis/pipeline.js.

const test = require('node:test');
const assert = require('node:assert');

const { analyze, unreadableInputFloor } = require('../src/analysis/pipeline');

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
