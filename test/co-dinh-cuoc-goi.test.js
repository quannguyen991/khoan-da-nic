/**
 * HÀNG RÀO CHO `chua_nghe_duoc_cuoc_goi`.
 *
 * §15.9.1 nói Khoan Đã KHÔNG nghe được cuộc gọi và không được để người dùng tin
 * ngược lại. Từ 16/8/2026 câu đó chỉ nói khi CÓ cuộc gọi dính vào — vì ép vào
 * 100% số lượt làm người dùng ngừng đọc cả vùng `chuaKiem` (§HĐ luật 3 buộc nó
 * hiện cùng cỡ chữ với nhãn).
 *
 * Bộ test này canh đúng một thứ: **nới ra thì được, nới sai thì không.**
 * Mọi ca nghi ngờ đều phải GIỮ.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const { coDinhCuocGoi } = require('../backend/src/analysis/co-dinh-cuoc-goi');

const co = (input) => coDinhCuocGoi(input);
const chuaKiemCua = (input) => analyze(input).chuaKiem;

// ══════════ PHẢI GIỮ ══════════

test('đường ghi âm LUÔN giữ — bác vừa nói vào micro thật', () => {
  assert.ok(co({ ghiAm: true, vanBan: 'chuyển tiền đi' }));
  assert.ok(co({ ghiAm: true, vanBan: '' }));
});

test('bộ hỏi nhanh LUÔN giữ — §15.8: trả lời hết bảng hỏi vẫn không phải nghe cuộc gọi', () => {
  assert.ok(co({ vanBan: 'tin nhắn thường', traLoiBoHoiNhanh: { ho_tu_xung: 'cong_an' } }));
});

test('vụ việc đang theo dõi LUÔN giữ — lượt trước có thể đã có cuộc gọi', () => {
  assert.ok(co({ vanBan: 'tin nhắn thường', caseContext: { id: 'vv1' } }));
});

/**
 * ⚠️ CA QUAN TRỌNG NHẤT. Không có chữ nào để quét thì KHÔNG kết luận được gì.
 * "Chưa quét được" khác "quét rồi, không thấy cuộc gọi" — đúng §4.3.
 */
test('§4.3 — không có chữ nào ⇒ GIỮ, không được im lặng', () => {
  assert.ok(co({}));
  assert.ok(co({ vanBan: '' }));
  assert.ok(co({ vanBan: '   ' }));
  assert.ok(co({ anh: 'data:image/png;base64,xxx' }));
});

test('chữ có nhắc cuộc gọi ⇒ giữ', () => {
  for (const s of [
    'Có người gọi điện bảo tôi chuyển tiền',
    'Cuộc gọi từ số lạ',
    'Họ nói tôi dính án ma tuý',
    'Gọi cho tôi lúc 9 giờ sáng',
    'Ai gọi số này vậy',
    'Tổng đài báo tôi nợ cước',
    'Alo, đây là công an phường',
    'They said I owe money',
    'A phone call from the bank',
  ]) {
    assert.ok(co({ vanBan: s }), `trượt: ${s}`);
  }
});

/**
 * ⚠️ THIẾU DẤU VẪN PHẢI BẮT. Người cao tuổi gõ thiếu dấu là chuyện thường, và
 * OCR cũng hay rụng dấu. So trên bản CÓ dấu thì "goi dien" trượt sạch.
 */
test('thiếu dấu vẫn bắt được', () => {
  assert.ok(co({ vanBan: 'co nguoi goi dien bao toi chuyen tien' }));
  assert.ok(co({ vanBan: 'cuoc goi tu so la' }));
  assert.ok(co({ vanBan: 'ho noi toi dinh an' }));
});

/** Chữ trích từ ảnh cũng phải được quét — bỏ sót là bỏ sót ca đáng giữ. */
test('chữ từ ảnh cũng được quét', () => {
  assert.ok(co({ vanBan: 'xem ảnh này', ocrText: 'Vui lòng gọi điện tới tổng đài' }));
});

// ══════════ ĐƯỢC BỎ ══════════

test('tin nhắn thuần, không nhắc gì tới cuộc gọi ⇒ bỏ', () => {
  assert.ok(!co({ vanBan: 'Chúc mừng bác trúng thưởng, bấm vào link để nhận quà' }));
  assert.ok(!co({ vanBan: 'Tài khoản của bác sắp hết hạn, cập nhật ngay' }));
});

test('qua analyze() — tin nhắn thuần không còn câu chưa nghe được cuộc gọi', () => {
  const c = chuaKiemCua({ vanBan: 'Chúc mừng bác trúng thưởng, bấm link nhận quà' });
  assert.ok(!c.includes('chua_nghe_duoc_cuoc_goi'),
    `vẫn còn: ${JSON.stringify(c)}`);
});

test('qua analyze() — có nhắc cuộc gọi thì câu đó phải còn', () => {
  const c = chuaKiemCua({ vanBan: 'Có người gọi điện tự xưng công an bảo tôi chuyển tiền' });
  assert.ok(c.includes('chua_nghe_duoc_cuoc_goi'), `thiếu: ${JSON.stringify(c)}`);
});

test('qua analyze() — đường ghi âm giữ nguyên câu đó', () => {
  const c = chuaKiemCua({ vanBan: 'bác chuyển tiền đi', ghiAm: true, ghiAmConfidence: 0.9 });
  assert.ok(c.includes('chua_nghe_duoc_cuoc_goi'), `thiếu: ${JSON.stringify(c)}`);
});

// ══════════ KHÔNG ĐƯỢC LÀ ĐƯỜNG HẠ MỨC ══════════

/**
 * ⚠️ §12 CẤM MỌI CỤM TỪ HẠ MỨC VÔ ĐIỀU KIỆN.
 *
 * Đã đo trước đây: thêm "ch play" vào một danh sách tắt khiến câu "…đừng tải
 * trên CH Play vì bản đó cũ" kéo hẳn một kịch bản giả danh công an xuống mức
 * thấp. Bài học: bất kỳ chỗ nào đọc nội dung người dùng rồi đổi hành vi đều
 * phải chứng minh nó KHÔNG chạm tới mức.
 *
 * Ở đây: thêm/bớt chữ "gọi điện" chỉ được đổi `chuaKiem`, tuyệt đối không đổi
 * `nhan`, `maLyDo` hay `canThiep`.
 */
test('§12 — bỏ câu đó KHÔNG làm đổi nhãn, mã lý do hay màn can thiệp', () => {
  const kichBan = 'Tôi là cán bộ công an, tài khoản của bác dính án rửa tiền, '
    + 'bác chuyển ngay 450.000.000đ sang tài khoản an toàn và đọc mã OTP cho tôi';

  const coGoi = analyze({ vanBan: `${kichBan}. Họ gọi điện cho tôi.` });
  const khongGoi = analyze({ vanBan: kichBan });

  assert.strictEqual(khongGoi.nhan, coGoi.nhan, 'nhãn đổi theo chữ "gọi điện"');
  assert.strictEqual(khongGoi.canThiep, coGoi.canThiep, 'màn can thiệp đổi theo chữ "gọi điện"');
  assert.ok(khongGoi.nhan === 'CAO', `kịch bản giả danh công an phải là CAO, đang là ${khongGoi.nhan}`);

  // Khác biệt DUY NHẤT được phép là đúng một mã trong `chuaKiem`.
  const chenh = [
    ...coGoi.chuaKiem.filter((m) => !khongGoi.chuaKiem.includes(m)),
    ...khongGoi.chuaKiem.filter((m) => !coGoi.chuaKiem.includes(m)),
  ];
  assert.deepStrictEqual(chenh, ['chua_nghe_duoc_cuoc_goi'],
    `khác biệt lan ra ngoài chuaKiem: ${JSON.stringify(chenh)}`);
});

/**
 * ⚠️ BỎ CÂU ĐÓ KHÔNG ĐƯỢC LÀM `chuaKiem` RỖNG KHI CÒN CA HỎNG THẬT.
 * Đây là §4.3: ảnh không đọc được, link không phân giải được — những câu đó
 * phải còn nguyên.
 */
test('§4.3 — ca hỏng thật vẫn ở lại sau khi bỏ câu cuộc gọi', () => {
  const kq = analyze({ vanBan: 'Bấm vào đây nhận quà', urlUnresolved: ['http://abc.xyz'] });
  assert.ok(kq.chuaKiem.includes('khong_mo_duoc_link'),
    `mất câu link: ${JSON.stringify(kq.chuaKiem)}`);
});
