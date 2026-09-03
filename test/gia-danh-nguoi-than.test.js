/**
 * HÀNG RÀO CHO KỊCH BẢN LỪA ĐẢO PHỔ BIẾN NHẤT VIỆT NAM.
 *
 * ⚠️ Người dùng báo 16/8/2026: "Mẹ ơi con đổi số mới, mẹ chuyển cho con 20
 * triệu" ra CHUA_THAY. `ID_FAMILY_IMPERSONATION` khi đó có ĐÚNG MỘT mẫu, và
 * mẫu đó đòi cấu trúc quá cứng — chen một cụm vào giữa là trượt.
 *
 * Thiếu hẳn dấu hiệu ĐỊNH DANH của họ kịch bản: "đổi số mới". Toàn bộ mưu mẹo
 * nằm ở đó — kẻ lừa đảo phải giải thích vì sao tin nhắn đến từ số lạ, nên gần
 * như lần nào chúng cũng tự khai ra.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const nhan = (v) => analyze({ vanBan: v }).nhan;

test('bắt được giả danh người thân đòi tiền', () => {
  const phai = [
    'Mẹ ơi con đổi số mới, mẹ chuyển cho con 20 triệu nhé',
    'con gái tôi bên nước ngoài bảo gửi tiền',
    'Con gái tôi đang ở nước ngoài nhắn bảo mẹ gửi gấp 50 triệu',
    'con tôi nhắn đổi số mới, bảo chuyển tiền gấp',
    'Đây là số mới của con, mẹ lưu lại rồi chuyển giúp con 10 triệu',
  ];
  const lot = phai.filter((v) => nhan(v) === 'CHUA_THAY');
  assert.deepStrictEqual(lot, [], `lọt kịch bản giả danh người thân:\n  ${lot.join('\n  ')}`);
});

/**
 * ⚠️ CHIỀU NGƯỢC LẠI QUAN TRỌNG NGANG NHAU.
 *
 * "Con gái tôi ở nước ngoài" là một câu HOÀN TOÀN BÌNH THƯỜNG. Mỗi mẫu ở đây
 * chỉ đáng 8 điểm, dưới ngưỡng 20 — nó chỉ vượt ngưỡng khi ĐI CÙNG một yêu cầu
 * chuyển tiền. Báo động trên câu kể chuyện gia đình là cách nhanh nhất để bác
 * gỡ ứng dụng (§4.6).
 */
test('câu kể chuyện gia đình bình thường KHÔNG bị báo động', () => {
  const thuong = [
    'con gái tôi đang ở nước ngoài',
    'con đổi số mới rồi mẹ nhé',
    'chiều nay con ghé chơi mẹ',
    'con nhắn mẹ là tối nay về muộn',
    'mẹ ơi con về tới nhà rồi',
  ];
  const oan = thuong.filter((v) => nhan(v) !== 'CHUA_THAY');
  assert.deepStrictEqual(oan, [], `báo động oan trên câu bình thường:\n  ${oan.join('\n  ')}`);
});

/**
 * Dấu hiệu "đổi số" một mình KHÔNG đủ báo động — nó chỉ là một mảnh.
 * Test này canh đúng tính chất đó, để ai đó nâng điểm mẫu lên thì đỏ ngay.
 */
test('dấu hiệu "đổi số" một mình chưa đủ vượt ngưỡng', () => {
  const k = analyze({ vanBan: 'con đổi số mới rồi mẹ nhé' });
  assert.strictEqual(k.nhan, 'CHUA_THAY');
  assert.ok(k.score < 20, `điểm ${k.score} đã vượt ngưỡng 20 — sẽ báo động trên câu bình thường`);
});
