'use strict';
/**
 * QUY TẮC GIA ĐÌNH KHÔNG ĐƯỢC CHẠM VÀO MỨC RỦI RO.
 *
 * §4.2: `decision-engine.js` là bộ luật DUY NHẤT quyết định mức. §12: không
 * thêm cụm từ nào hạ mức vô điều kiện — và quy tắc gia đình là chuỗi DO NGƯỜI
 * DÙNG TỰ VIẾT, tức là nội dung không kiểm soát được.
 *
 * Nếu một ngày nào đó bộ luật đọc quy tắc gia đình, kẻ lừa đảo chỉ cần đọc cho
 * nạn nhân chép vào một câu "quy tắc" vô hại, và cảnh báo tự tắt. Test này đóng
 * cửa đó lại trước khi có ai kịp mở.
 *
 * ⚠️ Test soi bằng TÌM CHUỖI, không phải chạy thử. Cố ý: chạy thử chỉ bắt được
 * đường đã có, còn tìm chuỗi bắt được cả import mới thêm hôm nay.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const MODULE_VT = path.join(GOC, 'src', 'lib', 'vong-tron-gia-dinh.ts');

/** Mọi tệp .js trong một thư mục, đệ quy. */
function moiTepJs(thuMuc) {
  const ra = [];
  for (const m of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    const p = path.join(thuMuc, m.name);
    if (m.isDirectory()) ra.push(...moiTepJs(p));
    else if (m.name.endsWith('.js')) ra.push(p);
  }
  return ra;
}

test('§4.2 — KHÔNG tệp backend nào nhắc tới module vòng tròn gia đình', () => {
  const pham = [];
  for (const tep of moiTepJs(path.join(GOC, 'backend', 'src'))) {
    const s = fs.readFileSync(tep, 'utf8');
    // Bỏ chú thích: nhắc tên module trong ghi chú thì được, import thì không.
    const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    if (ma.includes('vong-tron-gia-dinh')) pham.push(path.relative(GOC, tep));
  }
  assert.deepEqual(pham, [],
    'bộ luật và pipeline KHÔNG được đọc quy tắc gia đình — đó là chuỗi do người dùng viết');
});

test('§4.2 — module vòng tròn KHÔNG nhắc tới bộ luật, điểm số hay nhãn rủi ro', () => {
  const s = fs.readFileSync(MODULE_VT, 'utf8');
  const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  for (const cam of ['decision-engine', 'SCORE_CAP', 'THRESHOLD', 'riskLabel', 'baseScore']) {
    assert.ok(!ma.includes(cam),
      `module vòng tròn không được nhắc \`${cam}\` — nó là tầng hiển thị`);
  }
});

test('§4.2 — module vòng tròn KHÔNG tự sinh nhãn rủi ro, chỉ ĐỌC nhãn có sẵn', () => {
  const s = fs.readFileSync(MODULE_VT, 'utf8');
  const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  // Được phép SO SÁNH với nhãn (`nhan === 'CAO'`), không được phép GÁN nhãn.
  const ganNhan = /\b(nhan|riskLabel)\s*=\s*['"](CAO|NGHI_NGO|CHUA_THAY|HIGH|SUSPICIOUS)/;
  assert.ok(!ganNhan.test(ma), 'module vòng tròn không được gán mức rủi ro');
});

test('§11 — mức thấp nhất KHÔNG hiện khối quy tắc', () => {
  // Nhắc một quy tắc an toàn ngay dưới dòng "chưa thấy dấu hiệu rủi ro" làm
  // người đọc hiểu là hệ thống đang cảnh báo — tức là sản phẩm tự tạo ra một
  // cảnh báo mà bộ luật không hề đưa ra.
  const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'vong-tron-guard.cjs');
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(path.dirname(TEP_GOI), { recursive: true });
  esbuild.buildSync({
    entryPoints: [MODULE_VT],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: TEP_GOI,
    absWorkingDir: GOC,
    logLevel: 'silent',
  });
  const V = require(TEP_GOI);

  assert.equal(V.duocHienQuyTac('CHUA_THAY'), false);
  assert.equal(V.duocHienQuyTac(null), false);
  assert.equal(V.duocHienQuyTac(undefined), false);
  assert.equal(V.duocHienQuyTac('CAO'), true);
  assert.equal(V.duocHienQuyTac('NGHI_NGO'), true);
});

test('§HĐ luật 2 — mọi mã quy tắc đều có câu ở CẢ HAI ngôn ngữ trong catalog', () => {
  const nguon = fs.readFileSync(MODULE_VT, 'utf8');
  const ma = [...nguon.matchAll(/ma:\s*'([A-Z_]+)'/g)].map((m) => m[1]);
  assert.ok(ma.length >= 4, 'phải có ít nhất bốn mẫu quy tắc');

  const cat = fs.readFileSync(path.join(GOC, 'src', 'catalog.ts'), 'utf8');
  const i = cat.indexOf('export const QUY_TAC_MAU');
  assert.ok(i > 0, 'catalog thiếu QUY_TAC_MAU');
  const khoi = cat.slice(i, cat.indexOf('export const QUY_TAC_KHUNG'));

  for (const m of [...new Set(ma), 'TUY_CHINH']) {
    assert.ok(khoi.includes(`${m}: c(`), `catalog thiếu câu cho mã ${m}`);
  }
});
