'use strict';
/**
 * HÀNG RÀO CHO MỘT LỖI ĐÃ CẮN BỐN LẦN TRONG CÙNG MỘT DỰ ÁN.
 *
 * `\b` và `\w` của JavaScript CHỈ HIỂU ASCII. `\w` là đúng `[A-Za-z0-9_]`.
 * Nghĩa là `à ộ ữ ố ả ý ì` bị coi là KÝ TỰ KHÔNG PHẢI CHỮ, và:
 *
 *   `(tôi là)\b`      không bao giờ khớp "tôi là điều tra viên"
 *   `(phong toả)\b`   không bao giờ khớp gì cả
 *   `\bthì\b`         không bao giờ khớp "thì"
 *   `[^\s\W\d]`       đứt ở "c-h-u-y-ể-n", chỉ gỡ được thành "chuy-ể-n"
 *
 * Bốn lần đó lần lượt làm câm ID_AUTHORITY_IMPERSONATION, MAN_FEAR_THREAT,
 * khung giáo dục điều kiện, và bộ gỡ che chữ. Mỗi lần đều IM LẶNG — mẫu không
 * khớp thì không có lỗi nào ném ra, chỉ là tín hiệu biến mất.
 *
 * Tệp này quét TOÀN BỘ mẫu regex trong bộ luật để nó không có lần thứ năm.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

/** Ký tự ngoài ASCII — thứ mà `\b` và `\w` của JavaScript không nhận. */
const NGOAI_ASCII = /[^\x00-\x7F]/;

/**
 * Tìm mọi chỗ `\b` đứng CẠNH một ký tự ngoài ASCII trong một chuỗi mẫu.
 * `\b` phía trước ký tự có dấu, hoặc phía sau ký tự có dấu, đều hỏng.
 */
/**
 * ⚠️ Ký tự ngay cạnh `\b` thường là CÚ PHÁP regex, không phải chữ. Trong
 * `(tôi là)\b` thì ký tự trước `\b` là `)`, còn chữ thật là `à` nằm sau nó.
 * Nhìn một ký tự là bỏ sót đúng ca quan trọng nhất.
 */
/**
 * ⚠️ KHÔNG bỏ qua dấu `|`. Nó ngăn cách hai NHÁNH khác nhau, nên chữ bên kia `|`
 * không hề nằm cạnh `\b` này. Bản đầu của hàm dò nhảy qua `|` và báo oan
 * `\bapk\b|đường dẫn` — trong đó `\bapk\b` hoàn toàn đúng.
 */
const CU_PHAP = new Set([')', '(', ']', '[', '?', '*', '+', ':', '^', '$']);
const DUNG_LAI = new Set(['|']);

function chuThatTruoc(mau, i) {
  for (let j = i - 1; j >= 0; j -= 1) {
    const c = mau[j];
    if (c === '}') { while (j >= 0 && mau[j] !== '{') j -= 1; continue; }  // bỏ {0,30}
    if (DUNG_LAI.has(c)) return null;
    if (CU_PHAP.has(c)) continue;
    return c;
  }
  return null;
}

function chuThatSau(mau, i) {
  for (let j = i; j < mau.length; j += 1) {
    const c = mau[j];
    if (c === '{') { while (j < mau.length && mau[j] !== '}') j += 1; continue; }
    if (DUNG_LAI.has(c)) return null;
    if (CU_PHAP.has(c)) continue;
    return c;
  }
  return null;
}

function timRanhGioiHong(mau) {
  const hong = [];
  for (let i = 0; i < mau.length - 1; i += 1) {
    if (mau[i] !== '\\' || mau[i + 1] !== 'b') continue;
    if (mau[i - 1] === '\\') continue;   // `\\b` thoát, không phải ranh giới từ

    const truoc = chuThatTruoc(mau, i);
    const sau = chuThatSau(mau, i + 2);
    if (truoc && NGOAI_ASCII.test(truoc)) hong.push({ viTri: i, phia: 'sau', ky: truoc });
    if (sau && NGOAI_ASCII.test(sau)) hong.push({ viTri: i, phia: 'truoc', ky: sau });
  }
  return hong;
}

test('Hàm dò tự nó bắt được ca mẫu — không phải hàm rỗng', () => {
  assert.strictEqual(timRanhGioiHong('(tôi là)\\b[^.]{0,30}').length, 1);
  assert.strictEqual(timRanhGioiHong('\\bthì\\b').length, 1, 'phải bắt \\b SAU chữ ì');
  assert.strictEqual(timRanhGioiHong('\\b(bắt giữ)\\b').length, 1);
  // ASCII hai bên thì hợp lệ, không được báo nhầm.
  assert.deepStrictEqual(timRanhGioiHong('\\bapk\\b'), []);
  assert.deepStrictEqual(timRanhGioiHong('\\b(anydesk|teamviewer)\\b'), []);
});

const PACK = ['en-US', 'vi-VN'];

for (const ten of PACK) {
  test(`Locale pack ${ten}: không mẫu nào đặt \\b cạnh chữ có dấu`, () => {
    const pack = require(`../src/analysis/locale-packs/${ten}`);
    const hong = [];
    for (const [signalId, ds] of Object.entries(pack.directPatterns)) {
      for (const m of ds) {
        for (const h of timRanhGioiHong(m.pattern)) {
          hong.push(`${signalId}: "${m.pattern}" — \\b ${h.phia} ký tự "${h.ky}"`);
        }
      }
    }
    assert.deepStrictEqual(hong, [],
      `mẫu sẽ KHÔNG BAO GIỜ khớp:\n  ${hong.join('\n  ')}`);
  });
}

test('context-builder: không khung nào đặt \\b cạnh chữ có dấu', () => {
  // Đọc mã nguồn vì các khung là RegExp đã biên dịch, không phải dữ liệu.
  const nguon = fs.readFileSync(require.resolve('../src/analysis/context-builder'), 'utf8');
  const hong = [];
  // Chỉ soi các dòng chứa mẫu, bỏ dòng chú thích (chú thích CỐ Ý nhắc tới lỗi).
  for (const dong of nguon.split('\n')) {
    const sach = dong.replace(/^\s*(\/\/|\*).*$/, '');
    if (!sach.includes('\\\\b')) continue;
    for (const h of timRanhGioiHong(sach.replace(/\\\\/g, '\\'))) {
      hong.push(`"${sach.trim().slice(0, 70)}" — \\b ${h.phia} ký tự "${h.ky}"`);
    }
  }
  assert.deepStrictEqual(hong, [], `khung sẽ KHÔNG BAO GIỜ khớp:\n  ${hong.join('\n  ')}`);
});

test('Không dùng \\w hay [^\\W] để bắt chữ — phải dùng \\p{L}', () => {
  const nguon = fs.readFileSync(require.resolve('../src/analysis/context-builder'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.ok(!/\[\^\\s\\W/.test(nguon),
    '[^\\s\\W] là ASCII-only, dùng \\p{L} với cờ u');
});

test('Bốn ca đã từng câm nay đều khớp trở lại', () => {
  const { buildContext } = require('../src/analysis/context-builder');
  const { analyze } = require('../src/analysis/pipeline');

  // 1 + 2. ID_AUTHORITY_IMPERSONATION và MAN_FEAR_THREAT
  const a = analyze({ vanBan: 'Tôi là điều tra viên, bác chuyển tiền ngay, chậm là bị phong toả tài khoản.' });
  assert.ok(a.maLyDo.includes('ID_AUTHORITY_IMPERSONATION'));
  assert.ok(a.maLyDo.includes('MAN_FEAR_THREAT'));

  // 3. Khung giáo dục điều kiện "ai … thì … lừa đảo"
  const b = buildContext('Mẹ nhớ nhé: ai gọi bảo chuyển tiền vào tài khoản an toàn thì chắc chắn là lừa đảo.');
  assert.ok(!b.segments[0].actionable, 'câu dạy con cháu vẫn bị coi là hành động');

  // 4. Gỡ che chữ
  const c = buildContext('c-h-u-y-ể-n t-i-ề-n v-à-o t-à-i k-h-o-ả-n a-n t-o-à-n');
  assert.ok(c.ocrVariants.some((v) => v.includes('chuyển tiền') || v.includes('chuyen tien')));
});
