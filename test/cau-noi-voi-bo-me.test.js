'use strict';
/**
 * "NÓI GÌ VỚI BỐ MẸ" — ba câu cho người con trong thẻ cảnh báo (23/9/2026). Test đọc nguồn.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const doc = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const NGUON = doc('src/lib/cau-noi-voi-bo-me.ts');
const I18N = doc('src/i18n.ts');

const boCau = () => {
  const ra = {};
  for (const m of NGUON.matchAll(/(\w+): \[\s*([\s\S]*?)\],/g)) {
    ra[m[1]] = [...m[2].matchAll(/'([^']+)'|CAU_CUOI/g)].map((x) => x[1] ?? 'Con ở đây rồi, không sao đâu.');
  }
  return ra;
};

test('mỗi loại sự kiện có ĐÚNG ba câu, và đủ ba loại mà máy chủ gửi', () => {
  const b = boCau();
  assert.deepStrictEqual(Object.keys(b).sort(), ['cai_app_trong_cuoc_goi', 'ket_qua_kiem', 'otp_trong_cuoc_goi', 'tien_ra_trong_cuoc_goi']);
  // Khớp đúng danh sách loại sự kiện máy chủ gửi — thiếu bộ câu là thẻ của con rơi về câu chung.
  const BDG = require('../backend/src/bao-dong-gia-dinh');
  assert.deepStrictEqual([...BDG.LOAI_SU_KIEN].sort(), Object.keys(b).sort());
  for (const [k, cau] of Object.entries(b)) assert.strictEqual(cau.length, 3, k);
});

test('câu ngắn — người con đang hoảng đọc to cho bố mẹ nghe (≤ 12 chữ mỗi câu)', () => {
  for (const cau of Object.values(boCau()).flat()) {
    assert.ok(cau.split(/\s+/).length <= 12, `"${cau}" quá dài`);
  }
});

test('§11 — không trách bố mẹ, không buộc tội người gọi, không hứa lấy lại tiền, không "an toàn"', () => {
  const cam = /sao (bố|mẹ|bố\/mẹ) lại|đã sai|lấy lại (được )?tiền|an toàn|tội phạm|lừa đảo là/i;
  for (const cau of Object.values(boCau()).flat()) assert.ok(!cam.test(cau), cau);
});

test('§4.1 — mọi câu có ở CẢ HAI catalog, và thẻ cảnh báo của con dùng chúng qua t()', () => {
  for (const cau of new Set(Object.values(boCau()).flat())) {
    assert.strictEqual(I18N.split(JSON.stringify(cau) + ':').length - 1, 2, cau);
  }
  const g = doc('src/components/Guardian.tsx');
  assert.match(g, /cauNoiVoiBoMe\(suKien\?\.loaiSuKien\)\.map\(\(c\) => <li key=\{c\}>“\{tr\(c\)\}”<\/li>\)/);
});
