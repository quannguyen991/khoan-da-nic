/**
 * TRANG MINH BẠCH — HAI THỨ KHÔNG ĐƯỢC MẤT.
 *
 * ══════ 1. CON SỐ 100% KHÔNG BAO GIỜ ĐƯỢC ĐỨNG MỘT MÌNH ══════
 *
 * Tầng quét tin nhắn đến đo được 100% cả bốn chỉ số trên bộ 86 mẫu — nhưng
 * chính 86 mẫu đó là bộ đã dùng để CHỈNH các luật. Đó là đo lại bài đã học
 * thuộc. Trên bộ 571 mẫu, cùng bộ luật ấy chỉ bắt được 26,7%.
 *
 * Một trang minh bạch in "100%" mà bỏ ba lời cảnh báo đi kèm thì tệ hơn là
 * không in gì — nó biến một phép đo trung thực thành một lời quảng cáo. §11
 * cấm đúng chuyện này.
 *
 * ⚠️ Ba dòng cảnh báo đó SẼ trông thừa với người dọn giao diện. Test này tồn
 * tại để việc dọn đó thành màu đỏ, chứ không thành một bản vá lặng lẽ.
 *
 * ══════ 2. TRANG PHẢI CÓ TIẾNG ANH ══════
 *
 * Đây là artifact chứng minh sự nghiêm túc của dự án, và người đọc nó — ban
 * giám khảo, người rà soát — hầu hết đọc tiếng Anh. Giao diện app đã đủ 748/748
 * khoá tiếng Anh từ lâu; đúng trang quan trọng nhất thì đến 6/9/2026 mới có.
 */

import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { dungTrang } = require(path.join(GOC, 'backend', 'src', 'safety-card-page'));
const { dungSafetyCard } = require(path.join(GOC, 'backend', 'src', 'safety-card'));

const chu = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('trang tiếng Anh KHÔNG còn sót câu tiếng Việt nào', () => {
  const t = chu(dungTrang(undefined, 'en'));
  /*
   * Không quét dấu tiếng Việt chung chung — "Khoan Đã" là TÊN THƯƠNG HIỆU và
   * §4.1 giữ nguyên nó ở mọi ngôn ngữ. Quét đúng những câu của bản tiếng Việt.
   */
  const CAU_VIET = [
    'Chúng tôi đo được gì',
    'Cần đọc trước',
    'Bắt được ca nguy hiểm',
    'Cách hệ thống quyết định',
    'Phép đo này lấy từ đâu',
    'Số tín hiệu',
    'chưa đo',
    'bác',
  ];
  const sot = CAU_VIET.filter((c) => t.includes(c));
  assert.deepStrictEqual(sot, [],
    'bản tiếng Anh còn sót chữ Việt — giám khảo đọc trang này bằng tiếng Anh');
});

test('trang tiếng Anh có đủ các mục như bản tiếng Việt', () => {
  const t = chu(dungTrang(undefined, 'en'));
  for (const c of ['What we have measured', 'Read this first', 'How the system decides',
    'Where this measurement came from', 'Signals', 'WCAG 2.2 AA']) {
    assert.ok(t.includes(c), `bản tiếng Anh thiếu mục "${c}"`);
  }
});

test('mặc định vẫn là tiếng Việt — người dùng thật của app là người Việt', () => {
  assert.ok(chu(dungTrang()).includes('Chúng tôi đo được gì'));
  assert.ok(chu(dungTrang(undefined, 'xx')).includes('Chúng tôi đo được gì'),
    'ngôn ngữ lạ phải rơi về tiếng Việt, không được vỡ trang');
});

/**
 * ⚠️ HÀNG RÀO CHÍNH CỦA TỆP NÀY. Đừng nới.
 */
test('có số của tầng quét thì PHẢI có đủ ba lời cảnh báo đi kèm', () => {
  const the = dungSafetyCard();
  if (!the.tangQuet) {
    // Chưa chạy `node eval/do-tang-quet.js --ghi` thì trang không in bảng nào —
    // đó là hành vi đúng, giống hệt cách trang xử lý `latest.json` vắng mặt.
    for (const ng of ['vi', 'en']) {
      const t = chu(dungTrang(the, ng));
      assert.ok(!/100\.0%/.test(t), 'không có phép đo mà vẫn in số là sai (§11)');
    }
    return;
  }

  const DAU_HIEU = {
    vi: ['học thuộc', 'SÀN', 'không phải bộ giữ riêng sạch'],
    en: ['re-sitting the exam', 'FLOOR', 'not a clean hold-out'],
  };
  for (const ng of ['vi', 'en']) {
    const t = chu(dungTrang(the, ng));
    assert.ok(/Bắt được ca nguy hiểm|Dangerous messages caught/.test(t),
      `bản ${ng} phải in bảng tầng quét`);
    for (const d of DAU_HIEU[ng]) {
      assert.ok(t.includes(d),
        `bản ${ng} in số của tầng quét mà thiếu cảnh báo "${d}" — `
        + 'con số 100% đứng một mình biến phép đo thành quảng cáo');
    }
  }
});

test('trang nói rõ bộ mẫu nào là bộ đã dùng để chỉnh luật', () => {
  const the = dungSafetyCard();
  if (!the.tangQuet) return;
  assert.match(chu(dungTrang(the, 'vi')), /Bộ mẫu dùng để chỉnh luật/);
  assert.match(chu(dungTrang(the, 'en')), /The set the rules were tuned on/);
});
