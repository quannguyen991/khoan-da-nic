/**
 * MENU TÁC VỤ KHÔNG ĐƯỢC SẬP KHI CHƯA CÓ NGƯỜI THÂN NÀO.
 *
 * Người dùng báo 4/9/2026: "nhiều khi ấn vào menu tác vụ nó cứ không vào được".
 * Đo trên bản web thật, console ném:
 *
 *     [hang-rao-loi] Cannot read properties of null (reading 'name')
 *
 * `AppMenuModal` đặt `firstContact = null` khi danh sách người thân rỗng — và
 * đó là trạng thái MẶC ĐỊNH của app, vì dữ liệu mẫu bịa đã bị bỏ (xem chú thích
 * `familyMembers` trong App.tsx). Mọi chỗ khác đọc `firstContact?.phone`, riêng
 * một chỗ đọc thẳng `firstContact.name` → ném TypeError → hàng rào lỗi chặn cả
 * menu lại → bác bấm mà không vào được.
 *
 * "Nhiều khi" là vì nó chỉ sập khi CHƯA có người thân: ai đã thêm con cháu rồi
 * thì không bao giờ gặp.
 *
 * ⚠️ Đây là test TĨNH, đọc mã nguồn. Bộ test này không dựng React, nên không
 * bắt được lỗi lúc chạy — chính vì thế lỗi mới lọt tới tận bản web.
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEP = path.join(__dirname, '..', 'src', 'components', 'AppMenuModal.tsx');
const BO_QUA = fs.existsSync(TEP) ? false : 'chưa có src/components/AppMenuModal.tsx';

test('menu không đọc thuộc tính của `firstContact` mà thiếu `?.`', { skip: BO_QUA }, () => {
  const ma = fs.readFileSync(TEP, 'utf8');

  /**
   * Bắt `firstContact.` nhưng KHÔNG bắt `firstContact?.`.
   * Cũng bỏ qua dòng khai báo `const firstContact =`.
   */
  const viPham = ma
    .split('\n')
    .map((dong, i) => ({ so: i + 1, dong }))
    .filter(({ dong }) => /\bfirstContact\.[a-zA-Z]/.test(dong))
    .filter(({ dong }) => !/const\s+firstContact/.test(dong))
    // Bỏ qua chú thích — chính chú thích cảnh báo về lỗi này cũng nhắc lại
    // nguyên văn đoạn mã sai, và nó không chạy.
    .filter(({ dong }) => {
      const t = dong.trim();
      return !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*');
    })
    .map(({ so, dong }) => `dòng ${so}: ${dong.trim()}`);

  assert.deepStrictEqual(viPham, [],
    'firstContact có thể là null khi bác chưa thêm người thân — đọc thẳng thuộc tính là làm sập cả menu');
});

test('firstContact vẫn được phép là null — đó là trạng thái mặc định, không phải lỗi', { skip: BO_QUA }, () => {
  const ma = fs.readFileSync(TEP, 'utf8');
  assert.match(ma, /firstContact\s*=[\s\S]{0,200}:\s*null/,
    'giữ nguyên `null` khi chưa có ai; đừng vá bằng cách bịa một người thân mặc định');
});
