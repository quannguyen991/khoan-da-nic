/**
 * MÃ PHẢI BIÊN DỊCH SẠCH — KHÔNG CÓ BIẾN KHÔNG TỒN TẠI, KHÔNG ĐỌC NULL.
 *
 * Ngày 4/9/2026 bộ test này XANH 100% trong khi bản web thật đang mang hai lỗi
 * làm TRẮNG CẢ APP:
 *
 *   - `ReferenceError: superBasic is not defined` ở `SearchView` — bấm nút
 *     "Tìm kiếm" là mất sạch màn hình.
 *   - `TypeError: Cannot read properties of null (reading 'name')` ở
 *     `FloatingQuickAccess` — bấm nút bóng nổi khi chưa có người thân.
 *
 * Cả hai đều là lỗi LÚC CHẠY, còn bộ test này chỉ đọc mã nguồn — nó không dựng
 * React bao giờ. Nhưng trình biên dịch thì thấy cả hai. Nó vẫn luôn thấy; chỉ
 * là không ai bắt nó phải chạy.
 *
 * ⚠️ ĐỪNG NỚI TEST NÀY THÀNH "CHỈ CẢNH BÁO". Một biến không tồn tại là app
 * trắng màn, không phải chuyện thẩm mỹ.
 *
 * ⚠️ VÀ ĐÂY VẪN CHƯA PHẢI HÀNG RÀO ĐỦ. Trình biên dịch bắt được lỗi kiểu; nó
 * không bắt được nút bấm vào không ra gì. Bộ test này vẫn chưa hề dựng React
 * một lần nào.
 */

import test from 'node:test';
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TSC = process.platform === 'win32'
  ? path.join(GOC, 'node_modules', '.bin', 'tsc.cmd')
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
    ketQua = execFileSync(TSC, ['--noEmit'], {
      cwd: GOC,
      encoding: 'utf8',
      timeout: 240000,
      shell: process.platform === 'win32',
    });
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
