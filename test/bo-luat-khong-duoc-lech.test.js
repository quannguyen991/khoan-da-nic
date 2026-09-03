'use strict';
/**
 * §4.2 — "bộ luật DUY NHẤT". Hàng rào chặn việc bộ luật bị NHÂN BẢN lần nữa.
 *
 * VÌ SAO CÓ TỆP NÀY:
 * Đợt chuyển sang React/vite (20/8/2026) đã chép `src/` thành `backend/src/`.
 * Từ đó app và APK chạy `backend/src/analysis/`, còn bộ eval và 34 tệp test vẫn
 * đo `src/analysis/`. Hai bản trôi xa nhau — `pipeline.js` lệch 7,3KB — nên MỌI
 * SỐ ĐO đều mô tả một bản mã KHÔNG PHẢI thứ người dùng chạy.
 *
 * ĐO ĐƯỢC 2/9/2026, cùng dataset, cùng đệm AI, chỉ khác cây mã:
 *      src/analysis (bản eval đo)   recall vi 75,3%
 *      backend/src/analysis (ship)  recall vi 32,9%
 * Không ai biết, vì không test nào so hai bản — và lúc đó cả bộ test cũng không
 * nạp được (`package.json` bị scaffold ghi đè thành ESM).
 *
 * 2/9/2026 đã GỘP: xoá 40 tệp `.js` trong `src/`, xoá `server.js` ở gốc, trỏ
 * toàn bộ test + script + eval sang `backend/src/`. Từ đây `src/` CHỈ chứa
 * frontend (`.ts`/`.tsx`/`.css`), `backend/src/` CHỈ chứa backend.
 *
 * Tệp này giữ cho ranh giới đó không bị xoá nhoà lần nữa.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');

/** Tệp là nơi RA QUYẾT ĐỊNH mức rủi ro. Chỉ được tồn tại MỘT bản. */
const TEP_LUAT = [
  'analysis/decision-engine.js',
  'analysis/critical-overrides.js',
  'analysis/signal-registry.js',
  'analysis/pipeline.js',
  'analysis/context-builder.js',
  'analysis/evidence-validator.js',
];

for (const ten of TEP_LUAT) {
  test(`§4.2 — ${ten} chỉ tồn tại MỘT bản, ở backend/src`, () => {
    const chuan = path.join(GOC, 'backend', 'src', ten);
    const nhanBan = path.join(GOC, 'src', ten);

    assert.ok(fs.existsSync(chuan), `thiếu bản chuẩn: backend/src/${ten}`);
    assert.ok(
      !fs.existsSync(nhanBan),
      `BỘ LUẬT ĐÃ BỊ NHÂN BẢN LẠI: src/${ten}\n`
      + '  Đúng một lần trước đây, việc này làm recall tiếng Việt của bản đang\n'
      + '  ship tụt từ 75,3% xuống 32,9% mà không số đo nào phát hiện ra.\n'
      + '  Bản chuẩn là backend/src/ — xoá bản trong src/ đi.',
    );
  });
}

test('§4.2 — src/ KHÔNG được chứa tệp .js nào (chỉ frontend .ts/.tsx)', () => {
  const jsTrongSrc = [];
  const quet = (thuMuc) => {
    for (const m of fs.readdirSync(thuMuc, { withFileTypes: true })) {
      const p = path.join(thuMuc, m.name);
      if (m.isDirectory()) quet(p);
      else if (m.name.endsWith('.js')) jsTrongSrc.push(path.relative(GOC, p).replace(/\\/g, '/'));
    }
  };
  quet(path.join(GOC, 'src'));

  assert.deepStrictEqual(
    jsTrongSrc, [],
    'src/ là thư mục FRONTEND. Mã backend viết bằng CommonJS đặt ở backend/src/.\n'
    + '  Trộn hai thứ vào một chỗ chính là cách bộ luật bị nhân bản lần trước.',
  );
});

test('§6.14 — bộ eval và script phải nạp bản CHUẨN, không nạp src/', () => {
  // Đo sai cây là dạng lỗi tốn kém nhất: số đo trông vẫn hợp lý nhưng mô tả một
  // bản mã không ai chạy.
  const tep = [
    'eval/lib/bo-danh-gia.js',
    'eval/khoanbench.js',
    'eval/run.js',
    'scripts/xuat-hop-dong.js',
  ];
  for (const t of tep) {
    const p = path.join(GOC, t);
    if (!fs.existsSync(p)) continue;
    const s = fs.readFileSync(p, 'utf8');
    const nham = s.match(/require\((['"])(?:\.\.\/)+src\/[^'"]+\1\)/g);
    assert.strictEqual(
      nham, null,
      `${t} còn nạp src/ (bản cũ đã xoá). Phải nạp backend/src/.\n  còn: ${nham && nham.join(', ')}`,
    );
  }
});

test('§4.2 — server.js ở gốc đã bị xoá, không sống lại', () => {
  // `server.js` gốc require `./src/tai-khoan` — tệp đã bị migration xoá — nên nó
  // KHÔNG nạp được nữa. 9 tệp test từng kiểm nó và đỏ hàng loạt, che mất việc
  // máy chủ thật (backend/server.js) không được test nào canh.
  assert.ok(
    !fs.existsSync(path.join(GOC, 'server.js')),
    'server.js ở gốc đã sống lại. Máy chủ thật là backend/server.js, '
    + 'chạy qua server.ts. Hai máy chủ = test canh nhầm bản, đã xảy ra một lần.',
  );
});
