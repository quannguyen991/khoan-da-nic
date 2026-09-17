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
 * ══════════ LỖI ĐÃ ĐO ĐƯỢC 17/9/2026 — TÊN CƠ QUAN + "THÔNG BÁO" ══════════
 *
 * Bản vá 5/9 bắt tiền tố "Thông báo:" trần phải kèm dấu hiệu tuyên truyền thật.
 * Nhưng ngay bên dưới trong khung còn một dòng cùng họ, vẫn TRỐNG:
 *
 *   `(công an|cơ quan|ngân hàng|…)[^.]{0,40}(cảnh báo|khuyến cáo|lưu ý|thông báo)`
 *
 * Tức là "Công an xã thông báo, …" hay "Ngân hàng thông báo: …" tắt sạch mọi
 * mẫu hành động phía sau. Đo 5 kiểu lệnh (cài app qua link · đọc OTP · chuyển
 * vào tài khoản tạm giữ · cài app điều khiển từ xa · đăng nhập ngân hàng qua
 * link) × 8 tiền tố cơ quan: 40/40 ca về CHUA_THAY.
 *
 * Ca thật tìm ra lỗ này — đúng thủ đoạn Bộ Công an cảnh báo ngày 05/07/2025:
 *   "Công an xã thông báo sáp nhập địa giới, bác cài ứng dụng VNeID mới qua
 *    link này rồi cho cháu xem màn hình để cập nhật."
 *   → CHUA_THAY, KỂ CẢ KHI AI CHẠY: evidence-validator bỏ tín hiệu AI nằm trong
 *     đoạn bị xếp là tuyên truyền.
 *
 * Mở đầu bằng tên cơ quan kèm "thông báo" là kiểu mở đầu phổ biến nhất của
 * chính các vụ giả danh cơ quan.
 */
const TEN_CO_QUAN = [
  'Công an xã thông báo, ',
  'Công an phường thông báo: ',
  'Ngân hàng thông báo: ',
  'Cơ quan thuế thông báo, ',
  'Bộ Công an thông báo sáp nhập địa giới, ',
  'Công an phường lưu ý: ',
  'Ngân hàng cảnh báo tài khoản có giao dịch bất thường, ',
];

const LENH_CO_QUAN = [
  'bác cài ứng dụng VNeID mới qua link này để cập nhật',
  'bác đọc mã OTP vừa nhận cho cán bộ để xác minh',
  'bác chuyển tiền vào tài khoản an toàn 1902xxxx ngay',
  'bác tải ứng dụng UltraView để cán bộ hỗ trợ từ xa',
  'vui lòng cài ứng dụng qua link sau để xác thực',
  'cài ứng dụng qua link sau để mở khoá tài khoản',
];

test('tên cơ quan + "thông báo/lưu ý/cảnh báo" ở đầu KHÔNG được xoá tín hiệu nào',
  { skip: BO_QUA }, () => {
    const mat = [];
    for (const cau of LENH_CO_QUAN) {
      const goc = tinHieuCua(cau);
      assert.ok(goc.length > 0, `câu mẫu "${cau.slice(0, 40)}" đáng lẽ phải có tín hiệu — sửa câu mẫu, đừng sửa test`);
      for (const dau of TEN_CO_QUAN) {
        const sau = tinHieuCua(dau + cau);
        const thieu = goc.filter((id) => !sau.includes(id));
        if (thieu.length) mat.push(`"${dau}" + "${cau.slice(0, 30)}…" mất ${thieu.join(',')}`);
      }
    }
    assert.deepStrictEqual(mat, [],
      'khoác tên cơ quan lên câu ra lệnh không được làm mất tín hiệu — đó là câu thần chú (§12)');
  });

test('tên cơ quan + "thông báo" viết KHÔNG DẤU cũng không được xoá tín hiệu', { skip: BO_QUA }, () => {
  // Văn bản không dấu đi nhánh khung sinh tự động bằng boDau — nhánh riêng,
  // nên phải có ca riêng. Câu có dấu ở trên không chạm tới nhánh này.
  const mat = [];
  for (const [dau, cau] of [
    ['Cong an xa thong bao, ', 'bac cai ung dung VNeID moi qua link nay de cap nhat'],
    ['Ngan hang thong bao: ', 'bac doc ma OTP vua nhan cho nhan vien de xac minh'],
    ['Cong an thong bao co ke gian gia danh ngan hang, ', 'bac chuyen tien vao tai khoan an toan 1902xxxx ngay'],
  ]) {
    const goc = tinHieuCua(cau);
    assert.ok(goc.length > 0, `câu mẫu "${cau}" đáng lẽ phải có tín hiệu — sửa câu mẫu, đừng sửa test`);
    const sau = tinHieuCua(dau + cau);
    const thieu = goc.filter((id) => !sau.includes(id));
    if (thieu.length) mat.push(`"${dau}" + "${cau.slice(0, 30)}…" mất ${thieu.join(',')}`);
  }
  assert.deepStrictEqual(mat, []);
});

/**
 * ⚠️ VỎ BỌC TRONG CÙNG MỘT CÂU.
 *
 * Ca "Kẻ lừa đảo đang nhắm vào bác. Để bảo vệ, …" ở trên được cứu nhờ dấu chấm:
 * khung chỉ tắt đúng câu của nó. Viết liền bằng dấu phẩy thì không còn dấu chấm
 * nào cứu — mà đó lại là giọng của chiêu "tài khoản an toàn": kẻ gian tự nhắc
 * tới kẻ gian để lấy lòng tin, rồi ra lệnh ngay trong câu.
 *
 * Tin tuyên truyền thật KHÔNG ra lệnh trực tiếp cho người đọc làm việc rủi ro
 * mà không phủ định. Câu nào vừa nói "có kẻ gian", vừa bảo "bác chuyển tiền
 * ngay" thì vế sau mới là tin nhắn.
 */
test('từ vựng tuyên truyền trong CÙNG MỘT CÂU, rồi ra lệnh trực tiếp, không làm mất tín hiệu',
  { skip: BO_QUA }, () => {
    const RA_LENH = 'bác chuyển tiền vào tài khoản an toàn 1902xxxx ngay';
    const VO_BOC = [
      'Công an thông báo có kẻ gian giả danh ngân hàng rút tiền của bác,',
      'Tài khoản của bác đang bị kẻ gian tấn công,',
      'Thông báo: tuyệt đối không được nói với ai,',
      'Ngân hàng không bao giờ gọi điện đòi mật khẩu, lần này đặc biệt nên',
      'Có người giả danh nhân viên ngân hàng rút tiền của bác, để bảo vệ thì',
    ];
    const goc = tinHieuCua(RA_LENH);
    assert.ok(goc.length > 0, 'câu mẫu phải có tín hiệu — sửa câu mẫu, đừng sửa test');

    const lot = VO_BOC
      .map((vo) => [vo, tinHieuCua(`${vo} ${RA_LENH}`)])
      .filter(([, s]) => goc.some((id) => !s.includes(id)))
      .map(([vo, s]) => `"${vo}…" → ${s.join(',') || 'RỖNG'}`);

    assert.deepStrictEqual(lot, [],
      'câu ra lệnh viết liền sau từ vựng tuyên truyền không được mất tín hiệu nào');
  });

test('ca thật 17/9/2026: tin VNeID giả mở đầu "Công an xã thông báo" phải ra mức CAO, kể cả khi AI không chạy',
  { skip: BO_QUA }, () => {
    const { analyze } = require(path.join(DUONG, 'pipeline'));
    const vanBan = 'Công an xã thông báo sáp nhập địa giới, bác cài ứng dụng VNeID mới qua link này rồi cho cháu xem màn hình để cập nhật.';
    const kq = analyze({ vanBan, llmSignals: [] });
    assert.strictEqual(kq.nhan, 'CAO', `ra ${kq.nhan} với ${kq.maLyDo.join(',') || 'không tín hiệu nào'}`);
    assert.ok(kq.maLyDo.includes('DEV_INSTALL_APK_UNKNOWN'));
  });

test('ca thật 17/9/2026: tín hiệu AI nằm trong câu đó KHÔNG bị bộ lọc tuyên truyền vứt',
  { skip: BO_QUA }, () => {
    // Dùng tín hiệu mà tầng luật KHÔNG tự bắt được ở câu này (mẫu chia sẻ màn
    // hình của tầng luật đòi chữ "ngân hàng"), để test đi đúng đường AI →
    // evidence-validator, không được tầng luật đỡ hộ.
    const { analyze } = require(path.join(DUONG, 'pipeline'));
    const vanBan = 'Công an xã thông báo sáp nhập địa giới, bác cài ứng dụng VNeID mới qua link này rồi cho cháu xem màn hình để cập nhật.';
    assert.ok(!analyze({ vanBan, llmSignals: [] }).maLyDo.includes('DEV_SCREEN_SHARE_BANKING'),
      'tầng luật đã tự bắt tín hiệu này — đổi sang tín hiệu khác, không thì test không đo đường AI');
    const trich = 'cho cháu xem màn hình';
    const dau = vanBan.indexOf(trich);
    const kq = analyze({
      vanBan,
      llmSignals: [{
        id: 'DEV_SCREEN_SHARE_BANKING', state: 'present', confidence: 0.9, source: 'llm',
        evidence: [{ quote: trich, start: dau, end: dau + trich.length, sourceId: 'van_ban' }],
      }],
    });
    assert.ok(kq.maLyDo.includes('DEV_SCREEN_SHARE_BANKING'),
      `tín hiệu AI bị vứt: ${kq.maLyDo.join(',') || 'không còn tín hiệu nào'}`);
  });

/**
 * ⚠️ NỬA KIA CỦA HÀNG RÀO CHO BẢN VÁ 17/9 — tin tuyên truyền THẬT của cơ quan,
 * có tên cơ quan đứng đầu, vẫn phải được miễn.
 *
 * ⚠️ ĐO TÍN HIỆU HÀNH ĐỘNG, KHÔNG ĐO TÍN HIỆU DANH TÍNH. Câu "Công an TP Hà Nội
 * cảnh báo…" bật `ID_AUTHORITY_IMPERSONATION` từ trước bản vá này, và đó là thiết
 * kế: tín hiệu danh tính mang scope `any` vì danh tính hầu như luôn nằm ở câu
 * tường thuật (Phụ lục C.3 bẫy 1). Một mình nó không đưa mức lên khỏi "Chưa thấy".
 * Khung giáo dục chỉ chi phối tín hiệu scope `action` — nên test đo đúng thứ đó.
 */
test('tin tuyên truyền thật CÓ TÊN CƠ QUAN đứng đầu vẫn được miễn', { skip: BO_QUA }, () => {
  const { scopeCuaTinHieu } = require(path.join(DUONG, 'signal-registry'));
  const { analyze } = require(path.join(DUONG, 'pipeline'));
  const TUYEN_TRUYEN = [
    'Công an TP Hà Nội cảnh báo: kẻ gian giả danh công an gọi điện yêu cầu người dân chuyển tiền',
    'Công an xã thông báo: người dân tuyệt đối không cài ứng dụng qua đường link lạ',
    'Ngân hàng thông báo: ngân hàng không bao giờ yêu cầu khách hàng cung cấp mã OTP',
    'Bộ Công an khuyến cáo người dân chỉ tải VNeID trên CH Play hoặc App Store, không cài qua đường link',
    'Công an phường lưu ý bà con không đọc mã OTP cho bất kỳ ai qua điện thoại',
    'Cơ quan thuế thông báo các đối tượng mạo danh cán bộ thuế yêu cầu cài ứng dụng eTax giả',
    'Công an tỉnh cảnh báo thủ đoạn gửi đường link cài ứng dụng VNeID giả để chiếm quyền điện thoại',
    'Ngân hàng khuyến cáo khách hàng cảnh giác với tin nhắn yêu cầu đăng nhập qua đường link',
    'Ngân hàng lưu ý khách hàng không cung cấp mã OTP cho bất kỳ ai',
    'Công an cảnh báo: nếu có người gọi bảo bác cài ứng dụng qua link, bác hãy dập máy',
  ];
  const bao = TUYEN_TRUYEN
    .map((t) => [t, tinHieuCua(t).filter((id) => scopeCuaTinHieu(id) === 'action'), analyze({ vanBan: t, llmSignals: [] }).nhan])
    .filter(([, s, nhan]) => s.length > 0 || nhan !== 'CHUA_THAY')
    .map(([t, s, nhan]) => `"${t.slice(0, 50)}…" → ${nhan} ${s.join(',')}`);

  assert.deepStrictEqual(bao, [],
    'tin dạy người ta cảnh giác mà bị chấm là lừa đảo thì bác sẽ học cách bỏ qua app');
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
