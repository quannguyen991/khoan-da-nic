'use strict';
/**
 * MỌI MÃ BACKEND PHÁT RA ĐỀU PHẢI CÓ CÂU Ở CẢ HAI NGÔN NGỮ.
 *
 * §4.1: "Mọi chuỗi khác người dùng đọc — kể cả ARIA label, notification,
 * manifest shortcut và hướng dẫn phục hồi — phải đến từ catalog i18n, không mã
 * cứng."
 *
 * VÌ SAO CẦN TEST NÀY: thêm một luật R11 mà quên thêm câu thì người dùng thấy
 * mã trần ("R11") trên màn khẩn cấp, hoặc tệ hơn — thấy câu tiếng Việt trong khi
 * đang chọn English. Cả hai đều im lặng: không lỗi, không cảnh báo, và chỉ lộ
 * ra khi có người thật nhìn màn hình đó.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { MA_GIAI_THICH, CAU } = require('../backend/src/detect/giai-thich');
const { LUAT } = require('../backend/src/detect/tang-0');
const { MA_DONG_BA } = require('../backend/src/canh-bao-hai-phia');

const GOC = path.join(__dirname, '..');

/** Đọc hai khối `vi` và `en` của `src/i18n.ts` dưới dạng văn bản thô. */
function docI18n() {
  const s = fs.readFileSync(path.join(GOC, 'src', 'i18n.ts'), 'utf8');
  const iVi = s.indexOf('  vi: {');
  const iEn = s.indexOf('  en: {');
  assert.ok(iVi >= 0 && iEn > iVi, 'không tìm thấy hai khối vi/en trong i18n.ts');
  return { vi: s.slice(iVi, iEn), en: s.slice(iEn) };
}

const coKhoa = (khoi, khoa) => khoi.includes(`${JSON.stringify(khoa)}:`);

/** Đọc bảng mã → khoá i18n trong component màn cảnh báo. */
function docBangComponent() {
  const s = fs.readFileSync(
    path.join(GOC, 'src', 'components', 'CanhBaoToanManHinh.tsx'), 'utf8',
  );
  const lay = (ten) => {
    const i = s.indexOf(`const ${ten}: Record<string, string> = {`);
    assert.ok(i >= 0, `không tìm thấy bảng ${ten}`);
    const j = s.indexOf('\n};', i);
    const than = s.slice(i, j);
    const bang = {};
    for (const m of than.matchAll(/^\s{2}([A-Za-z0-9_]+):\s*'((?:[^'\\]|\\.)*)',$/gm)) {
      bang[m[1]] = m[2].replace(/\\'/g, "'");
    }
    return bang;
  };
  return { CAU_DONG3: lay('CAU_DONG3'), CAU_GIAI_THICH: lay('CAU_GIAI_THICH') };
}

test('mọi mã giải thích của backend đều có trong bảng của frontend', () => {
  const { CAU_GIAI_THICH } = docBangComponent();
  const thieu = MA_GIAI_THICH.filter((ma) => !CAU_GIAI_THICH[ma]);
  assert.deepStrictEqual(
    thieu, [],
    `mã backend phát ra mà frontend không có câu: ${thieu.join(', ')}\n`
    + '  Thêm vào CAU_GIAI_THICH trong src/components/CanhBaoToanManHinh.tsx.',
  );
});

test('mỗi luật R1–R20 có một mã giải thích riêng', () => {
  for (const l of LUAT) {
    assert.ok(CAU[l.ma], `luật ${l.ma} (${l.ten}) không có câu giải thích`);
  }
});

test('mọi mã dòng-ba của backend đều có trong bảng của frontend', () => {
  const { CAU_DONG3 } = docBangComponent();
  for (const ma of Object.values(MA_DONG_BA)) {
    assert.ok(CAU_DONG3[ma], `mã trạng thái giao nhận thiếu câu: ${ma}`);
  }
});

test('§4.1 — mọi câu của màn cảnh báo có khoá ở CẢ vi lẫn en', () => {
  const { vi, en } = docI18n();
  const { CAU_DONG3, CAU_GIAI_THICH } = docBangComponent();
  const moiCau = [...Object.values(CAU_DONG3), ...Object.values(CAU_GIAI_THICH)];

  const thieuVi = moiCau.filter((c) => !coKhoa(vi, c));
  const thieuEn = moiCau.filter((c) => !coKhoa(en, c));

  assert.deepStrictEqual(thieuVi, [], `thiếu khoá trong khối vi:\n  ${thieuVi.join('\n  ')}`);
  assert.deepStrictEqual(
    thieuEn, [],
    `thiếu khoá trong khối en — người chọn English sẽ thấy tiếng Việt:\n  ${thieuEn.join('\n  ')}`,
  );
});

test('§4.1 — chữ trên nút và ARIA label của màn cảnh báo có ở cả hai khối', () => {
  const { vi, en } = docI18n();
  for (const k of ['Khoan đã!', 'Cảnh báo khẩn', 'Gọi', 'Báo cho', 'Đóng',
    'người nhà', 'Tôi ổn, không có gì nguy hiểm']) {
    assert.ok(coKhoa(vi, k), `khối vi thiếu: ${k}`);
    assert.ok(coKhoa(en, k), `khối en thiếu: ${k}`);
  }
});

test('§4.1 — bản dịch tiếng Anh KHÔNG có nhãn "Safe"', () => {
  const { en } = docI18n();
  const { CAU_GIAI_THICH } = docBangComponent();
  for (const cau of Object.values(CAU_GIAI_THICH)) {
    const i = en.indexOf(`${JSON.stringify(cau)}:`);
    if (i < 0) continue;
    const dong = en.slice(i, en.indexOf('\n', i));
    assert.ok(!/\bsafe\b/i.test(dong.split('": "')[1] || ''), `bản dịch có chữ "safe": ${dong}`);
  }
});

test('§11 — câu tiếng Anh không quy kết cá nhân, không trách móc người dùng', () => {
  for (const [ma, ban] of Object.entries(CAU)) {
    for (const re of [/this person is/i, /you were fooled/i, /your fault/i, /you should have/i]) {
      assert.ok(!re.test(ban.en), `${ma}.en vi phạm §11: "${ban.en}"`);
    }
  }
});
