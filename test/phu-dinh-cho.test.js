/**
 * HÀNG RÀO CHO HÀNG RÀO PHỦ ĐỊNH.
 *
 * ⚠️ LỖI ĐÃ MẮC 16/8/2026, VÀ NÓ IM LẶNG HOÀN TOÀN.
 *
 * `PHU_DINH` từng chứa `cho` — vốn để bắt "chớ" (đừng) sau khi bỏ dấu. Nhưng bỏ
 * dấu xong thì "chớ" và "cho" là CÙNG MỘT CHUỖI, mà `cho` (giới từ) đứng ngay
 * trước đích của gần như mọi câu lừa đảo tiếng Việt:
 *
 *     "nộp 20tr CHO cục thuế"      "chuyển tiền CHO công an"
 *     "đọc mã OTP CHO tôi"         "chuyển CHO tài khoản này"
 *
 * Tín hiệu khớp đúng rồi bị vứt đi — không lỗi, không dấu vết. Người dùng gõ
 * "nộp 20tr cho cục thuế" và nhận "Chưa thấy dấu hiệu rủi ro".
 *
 * §4.2 nói mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác. Một hàng rào phủ định
 * bắt nhầm làm điều ngược lại, nên nó phải sai theo hướng an toàn: thà bỏ sót
 * một câu phủ định thật còn hơn vứt một tín hiệu thật.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');

const nhan = (v) => analyze({ vanBan: v }).nhan;

test('"cho" là GIỚI TỪ, không được nuốt tín hiệu đứng sau nó', () => {
  const phai = [
    'nộp 20tr cho cục thuế',
    'Anh nộp 20 triệu cho cục thuế trong hôm nay',
    'Chuyển tiền cho công an ngay',
    'Bác đọc mã OTP cho tôi',
    'Chuyển 50 triệu cho tài khoản an toàn của Bộ Công an',
    'gửi mã xác thực cho nhân viên ngân hàng',
  ];
  const lot = phai.filter((v) => nhan(v) === 'CHUA_THAY');
  assert.deepStrictEqual(lot, [],
    `bị "cho" nuốt mất tín hiệu:\n  ${lot.join('\n  ')}`);
});

/**
 * ⚠️ CHIỀU NGƯỢC LẠI CŨNG PHẢI ĐÚNG.
 * Gỡ `cho` ra không được biến mọi câu khuyên bảo thành báo động — đó là báo
 * động giả, và §4.6 nói người bị báo động giả sẽ gỡ ứng dụng.
 */
test('phủ định THẬT vẫn được nhận, không báo động oan', () => {
  const khuyen = [
    'Bác đừng đọc mã OTP cho ai cả',
    'Chớ chuyển tiền cho người lạ',
    'Ngân hàng không bao giờ hỏi mã OTP',
    'Công an không bao giờ yêu cầu chuyển tiền qua điện thoại',
  ];
  const oan = khuyen.filter((v) => nhan(v) !== 'CHUA_THAY');
  assert.deepStrictEqual(oan, [],
    `báo động oan trên câu khuyên bảo:\n  ${oan.join('\n  ')}`);
});

/**
 * ⚠️ `cho` KHÔNG ĐƯỢC QUAY LẠI DANH SÁCH BỎ DẤU.
 * Test hành vi ở trên có thể xanh nhờ một tín hiệu khác bù vào. Test này canh
 * thẳng cái nguyên nhân.
 */
test('`cho` không nằm trong danh sách phủ định bỏ dấu', () => {
  const src = require('node:fs')
    .readFileSync(require.resolve('../backend/src/analysis/direct-precheck.js'), 'utf8');
  const m = src.match(/const PHU_DINH = \/\(([^)]+)\)/);
  assert.ok(m, 'không tìm thấy PHU_DINH — đổi tên thì cập nhật test này');
  const tu = m[1].split('|');
  assert.ok(!tu.includes('cho'),
    '`cho` quay lại danh sách bỏ dấu — nó sẽ nuốt tín hiệu ở mọi câu có giới từ "cho"');
});

test('"chớ" vẫn bắt được trên bản còn dấu', () => {
  const src = require('node:fs')
    .readFileSync(require.resolve('../backend/src/analysis/direct-precheck.js'), 'utf8');
  assert.match(src, /PHU_DINH_CO_DAU[\s\S]{0,80}chớ/,
    'mất đường bắt "chớ" — gỡ `cho` mà không bù lại là mất hẳn một dạng phủ định');
});
