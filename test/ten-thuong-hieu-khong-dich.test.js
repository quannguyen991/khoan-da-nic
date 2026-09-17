'use strict';
/**
 * §4.1 — "Tên thương hiệu 'Khoan Đã' giữ nguyên tiếng Việt ở mọi locale."
 *
 * ĐO ĐƯỢC 17/9/2026: bật tiếng Anh thì màn chào hiện tiêu đề "Hold On", và
 * thẻ thông báo ghim hiện "Hold On • Ongoing Protection". Khối `en` của
 * `src/i18n.ts` dịch luôn cả tên riêng.
 *
 * Việc này quan trọng hơn vẻ ngoài của nó: dự án đi thi bằng tiếng Anh. Giám
 * khảo mở bản tiếng Anh sẽ thấy một sản phẩm tên khác với sản phẩm trên slide.
 *
 * ⚠️ PHÂN BIỆT TÊN RIÊNG VỚI CÂU THƯỜNG. "Bác khoan hãy thao tác!" hay tiếng
 * kêu "KHOAN ĐÃ!" viết hoa toàn bộ là lời nói, dịch được. Test chỉ canh chuỗi
 * viết đúng dạng tên riêng: "Khoan Đã".
 *
 * Đọc bằng văn bản, không import TypeScript — cùng cách `hop-dong.test.mjs`.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const TEN = 'Khoan Đã';

function capTiengAnh() {
  const nguon = fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n.ts'), 'utf8');
  const dauEn = nguon.indexOf('\n  en: {');
  assert.ok(dauEn > 0, 'không tìm thấy khối `en` trong src/i18n.ts');
  const khoi = nguon.slice(dauEn);
  const bo = (s) => s.replace(/\\"/g, '"');
  const cap = [...khoi.matchAll(/^\s*"((?:[^"\\]|\\.)*)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm)]
    .map((m) => [bo(m[1]), bo(m[2])]);
  assert.ok(cap.length > 400, `khối en chỉ soi ra ${cap.length} cặp — biểu thức soi đã hỏng`);
  return cap;
}

test('§4.1 — chuỗi nào có tên "Khoan Đã" thì bản tiếng Anh cũng giữ nguyên "Khoan Đã"', () => {
  const sai = capTiengAnh()
    .filter(([vi, en]) => vi.includes(TEN) && !en.includes(TEN))
    .map(([vi, en]) => `"${vi.slice(0, 50)}" → "${en.slice(0, 50)}"`);
  assert.deepStrictEqual(sai, [], 'tên thương hiệu bị dịch trong bản tiếng Anh');
});

test('§4.1 — không bản dịch tiếng Anh nào đặt tên sản phẩm là "Hold On"', () => {
  const sai = capTiengAnh()
    .filter(([, en]) => /(^|[^A-Za-z])Hold On([^A-Za-z]|$)/.test(en))
    .map(([vi, en]) => `"${vi.slice(0, 50)}" → "${en.slice(0, 50)}"`);
  assert.deepStrictEqual(sai, []);
});
