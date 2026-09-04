'use strict';
/**
 * MÃ PHẢI BIÊN DỊCH SẠCH — KHÔNG CÓ BIẾN KHÔNG TỒN TẠI.
 *
 * Ngày 4/9/2026: `tsc --noEmit` báo `Cannot find name 'superBasic'` ở
 * `SearchView`. Lỗi đó nằm trong mã suốt nhiều ngày, và mọi lượt chạy
 * `npm test` đều XANH — vì bộ test không hề gọi trình biên dịch.
 *
 * Hậu quả đo được: bấm nút "Tìm kiếm" ở thanh điều hướng thì
 * `ReferenceError: superBasic is not defined` và TOÀN BỘ app trắng màn.
 * Không phải hỏng một nút — hỏng cả ứng dụng.
 *
 * Cùng họ với lỗi menu tác vụ (`firstContact.name` khi chưa có người thân):
 * lỗi lúc CHẠY mà bộ test đọc-mã-nguồn không bao giờ thấy. Khác ở chỗ lỗi này
 * thì trình biên dịch ĐÃ chỉ thẳng ra — chỉ là không ai bắt nó phải chạy.
 *
 * ⚠️ ĐỪNG NỚI TEST NÀY THÀNH "CHỈ CẢNH BÁO". Một biến không tồn tại là app
 * trắng màn, không phải chuyện thẩm mỹ.
 */

const test = require('node:test');
const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const TSC = process.platform === 'win32'
  ? path.join(GOC, 'node_modules', '.bin', 'tsc.exe')
  : path.join(GOC, 'node_modules', '.bin', 'tsc');

/**
 * Chưa cài phụ thuộc thì BỎ QUA CÓ THÔNG BÁO, đừng báo đỏ oan — nhưng cũng
 * đừng im lặng, kẻo sàn khai mà không có hiệu lực.
 */
const BO_QUA = fs.existsSync(TSC) ? false : 'chưa cài typescript (node_modules/.bin/tsc)';

test('tsc --noEmit không còn lỗi nào', { skip: BO_QUA }, () => {
  let ketQua = '';
  let loi = null;
  try {
    ketQua = execFileSync(TSC, ['--noEmit'], { cwd: GOC, encoding: 'utf8', timeout: 240000 });
  } catch (e) {
    loi = e;
    ketQua = `${e.stdout || ''}${e.stderr || ''}`;
  }

  const dong = ketQua
    .split('\n')
    .map((d) => d.trim())
    .filter((d) => /error TS\d+/.test(d));

  assert.deepStrictEqual(dong, [],
    `trình biên dịch còn báo lỗi:\n${dong.join('\n')}`);
  assert.strictEqual(loi, null, 'tsc thoát với mã lỗi nhưng không in dòng lỗi nào');
});
