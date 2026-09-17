'use strict';
/**
 * TIN NHẮN BẮT TỪ THÔNG BÁO KHÔNG TỰ LÊN MÁY CHỦ — mã và lời cam kết phải khớp nhau.
 *
 * Gộp nhánh web vào dev 17/9/2026 lộ ra: vòng phát hiện thụ động gửi nguyên văn tin
 * mới nhất lên `/api/detect` mỗi 4 giây, trong khi `PERMISSIONS-AND-POLICY.md` và
 * `docs/kien-truc-hai-phia.md` đều hứa KHÔNG BAO GIỜ tự gửi. Đổi điều đó là đổi mô
 * hình riêng tư (§12) — người dùng chốt, không phải một dòng mã lặng lẽ.
 *
 * Test này không cấm bật. Nó cấm bật MÀ tài liệu vẫn hứa điều ngược lại.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (p) => fs.readFileSync(path.join(GOC, p), 'utf8');

test('vòng thụ động không gửi tin nhắn lên máy chủ khi lời cam kết còn nói "never automatically"', () => {
  const vong = doc('src/canh-bao-thu-dong.ts');
  const m = /const TU_GUI_TIN_NHAN_LEN_MAY_CHU = (true|false);/.exec(vong);
  assert.ok(m, 'thiếu công tắc TU_GUI_TIN_NHAN_LEN_MAY_CHU — đường gửi tin không còn cổng nào chặn');

  const hua = /never automatically/.test(doc('PERMISSIONS-AND-POLICY.md'));
  if (m[1] === 'true') {
    assert.ok(!hua,
      'đã bật tự gửi tin nhắn lên máy chủ nhưng PERMISSIONS-AND-POLICY.md vẫn hứa "never automatically" — sửa tài liệu, và hỏi người dùng trước (§12)');
  }

  // Cổng phải đứng TRƯỚC lượt đọc tin — đặt sau thì tin đã được lấy ra rồi mới hỏi.
  const cong = vong.indexOf('if (!TU_GUI_TIN_NHAN_LEN_MAY_CHU) return;');
  const docTin = vong.indexOf('await tinMoiNhat()');
  assert.ok(cong > 0 && docTin > cong, 'cổng chặn phải nằm trước lượt lấy tin mới nhất');
});
