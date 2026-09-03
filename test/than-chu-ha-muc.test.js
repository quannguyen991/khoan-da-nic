'use strict';
/**
 * §12 — KHÔNG CỤM TỪ NÀO ĐƯỢC HẠ MỨC VÔ ĐIỀU KIỆN.
 *
 * §12 viết nguyên văn:
 *   "Đã đo: thêm 'ch play' vào danh sách tắt thì câu '…đừng tải trên CH Play vì
 *    bản đó cũ' làm tụt hẳn một kịch bản giả danh công an xuống mức thấp.
 *    BẤT KỲ CỤM NÀO HẠ MỨC VÔ ĐIỀU KIỆN ĐỀU LÀ MỘT CÂU THẦN CHÚ TẶNG CHO KẺ
 *    LỪA ĐẢO — cùng bài học với 'please hold'."
 *
 * ĐO ĐƯỢC 2/9/2026 — `KHUNG_TU_QUYET` trong `context-builder.js` chứa đúng sáu
 * câu thần chú như vậy. Nối thêm HAI CHỮ vào một kịch bản giả danh người thân:
 *
 *   "Con đây mẹ ơi, mẹ chuyển gấp 30 triệu vào tài khoản này giúp con"
 *      → NGHI_NGO, 2 tín hiệu
 *   cùng câu + " để mua quà sinh nhật."
 *      → CHUA_THAY, 0 tín hiệu          ← app tự tắt tiếng
 *
 *   Cùng kết quả với: quà tết · mừng tuổi · nhẫn cưới · tặng cháu
 *   Và bản tiếng Anh còn tệ hơn: "for my own" kéo CAO (3 tín hiệu) → CHUA_THAY.
 *
 * VÌ SAO TỪNG LỌT: những cụm này được thêm để cứu các ca lành có thật
 * ("Mua vàng nhẫn cưới cho cháu.", "mai sinh nhật mẹ mình làm bất ngờ"), và
 * chúng cứu đúng. Nhưng chúng là DANH TỪ CHỦ ĐỀ, không phải cấu trúc câu — nên
 * kẻ lừa đảo nối vào đâu cũng được.
 *
 * CÁCH SỬA: khung "tự quyết định" thành CÓ THỂ BỊ BÁC BỎ. Nó không áp dụng khi
 * trong câu còn có CẤU TRÚC ĐÒI HỎI — nơi nhận tiền, hoặc sức ép thời gian.
 * Hai ca lành ở trên không có cả hai, nên vẫn được cứu.
 */

const test = require('node:test');
const assert = require('node:assert');

const { buildContext } = require('../backend/src/analysis/context-builder');
const { analyze } = require('../backend/src/analysis/pipeline');

const act = (t) => buildContext(t).segments[0].speechAct;
const soTinHieu = (t) => (analyze({ vanBan: t, llmSignals: [] }).maLyDo || []).length;

const NEN = 'Con đây mẹ ơi, mẹ chuyển gấp 30 triệu vào tài khoản này giúp con';

// ─────────── PHẢI CHẶN: cụm nối vào KHÔNG được làm tắt tín hiệu ───────────

const THAN_CHU = [
  ['sinh nhật', ' để mua quà sinh nhật.'],
  ['quà tết', ', quà tết ấy mà.'],
  ['mừng tuổi', ' để mừng tuổi các cháu.'],
  ['nhẫn cưới', ' mua nhẫn cưới.'],
  ['tặng cháu', ' để tặng cháu.'],
];

for (const [ten, duoi] of THAN_CHU) {
  test(`§12 — "${ten}" KHÔNG được tắt tín hiệu của kịch bản giả danh`, () => {
    const truoc = soTinHieu(`${NEN}.`);
    const sau = soTinHieu(NEN + duoi);
    assert.ok(truoc > 0, 'câu nền phải bắt được tín hiệu');
    assert.ok(
      sau >= truoc,
      `nối "${ten}" làm tín hiệu tụt ${truoc} → ${sau}. Đây là câu thần chú §12 cấm:\n`
      + '  kẻ lừa đảo chỉ cần nối thêm mấy chữ là app im lặng.',
    );
  });
}

test('§12 — cụm đặt ĐẦU câu cũng không được tắt tín hiệu', () => {
  // Quy tắc theo vị trí thôi thì chưa đủ: kẻ gian chỉ việc đảo cụm lên trước.
  const t = 'Để mua quà sinh nhật, mẹ chuyển gấp 30 triệu vào tài khoản này.';
  assert.ok(soTinHieu(t) > 0, `đảo cụm lên đầu vẫn phải bắt được: ${t}`);
  assert.notStrictEqual(act(t), 'self_directed');
});

test('§12 — "for my own" KHÔNG được tắt tín hiệu tiếng Anh', () => {
  const nen = 'This is your son, transfer 30 million to this account right now';
  const truoc = soTinHieu(`${nen}.`);
  const sau = soTinHieu(`${nen} for my own account.`);
  assert.ok(truoc > 0);
  assert.ok(sau >= truoc, `"for my own" làm tín hiệu tụt ${truoc} → ${sau}`);
});

// ─────────── VẪN PHẢI CỨU: ca lành thật, không có đòi hỏi nào ───────────

test('§4.6 — ca lành KHÔNG có yêu cầu chuyển tiền vẫn được xếp tự quyết định', () => {
  // Hai ca này là lý do các cụm kia được thêm vào. Sửa mà mất chúng là đổi một
  // báo động giả lấy một báo động giả khác.
  for (const t of [
    'Mua vàng nhẫn cưới cho cháu.',
    'Cả nhà giữ bí mật nhé, mai sinh nhật mẹ mình làm bất ngờ cho mẹ.',
    'I want to buy $200 of Bitcoin for my own portfolio.',
    'My son asked me to buy a birthday gift card.',
  ]) {
    assert.strictEqual(act(t), 'self_directed', `mất ca lành: ${t}`);
  }
});

test('§4.6 — ca lành vẫn KHÔNG bật tín hiệu nào', () => {
  for (const t of ['Mua vàng nhẫn cưới cho cháu.', 'I want to buy $200 of Bitcoin for my own portfolio.']) {
    assert.strictEqual(soTinHieu(t), 0, `ca lành bị bắt tín hiệu: ${t}`);
  }
});
