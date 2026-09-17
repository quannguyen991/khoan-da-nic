'use strict';
/**
 * DANH BẠ SỐ NGÂN HÀNG — giao diện và máy chủ phải cho ra CÙNG một danh sách.
 *
 * Giao diện đọc thẳng `public/config/support-directory.json` để số có sẵn cả khi
 * mất mạng. Nghĩa là có HAI chỗ lọc: sổ đăng ký ở máy chủ và `locDanhBa` ở giao
 * diện. Hai chỗ lọc mà lệch nhau thì một số bị máy chủ loại vẫn có thể hiện ra
 * trước mắt người đang hoảng. Test này giữ hai bên khớp nhau.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const R = require('../backend/src/analysis/verified-institution-registry');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'danh-ba-ngan-hang.cjs');
  fs.mkdirSync(path.dirname(ra), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'lib', 'danh-ba-ngan-hang.ts')],
    bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent',
  });
  return require(ra);
}
const L = goi();

const MUC = (them = {}) => ({
  id: 'vn-x', countryCode: 'VN', type: 'bank', canonicalName: 'Ngân hàng X', aliases: ['X'],
  officialDomains: ['x.com.vn'], officialPhoneNumbers: ['1900 1234'], sourceUrl: 'https://www.x.com.vn/',
  verifiedAt: '2026-09-17', reviewStatus: 'approved', reviewedBy: 'Quân', ...them,
});

const ghi = (o) => {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kd-db-')), 'd.json');
  fs.writeFileSync(p, JSON.stringify(o));
  return p;
};

/** Mỗi ca là một cách một số điện thoại có thể lọt qua một trong hai bộ lọc. */
const CA = [
  ['đủ điều kiện', MUC()],
  ['chưa duyệt', MUC({ id: 'a', reviewStatus: 'pending' })],
  ['không tên người duyệt', MUC({ id: 'b', reviewedBy: ' ' })],
  ['nguồn là báo chí', MUC({ id: 'c', sourceUrl: 'https://baomoi.com/x' })],
  ['nguồn giả đuôi tên miền', MUC({ id: 'd', sourceUrl: 'https://x.com.vn.trang-la.com/' })],
  ['nguồn có tên đăng nhập', MUC({ id: 'e', sourceUrl: 'https://x.com.vn@trang-la.com/' })],
  ['nguồn http', MUC({ id: 'f', sourceUrl: 'http://www.x.com.vn/' })],
  ['số lẫn chữ', MUC({ id: 'g', officialPhoneNumbers: ['gọi 1900 1234'] })],
  ['không có số', MUC({ id: 'h', officialPhoneNumbers: [] })],
  ['ngày sai định dạng', MUC({ id: 'i', verifiedAt: '17/09/2026' })],
  ['tên miền con chính chủ', MUC({ id: 'j', canonicalName: 'Ngân hàng J', sourceUrl: 'https://contact.x.com.vn/' })],
];

test('⚠️ giao diện và máy chủ cho ra CÙNG danh sách trên mọi ca lọt số', () => {
  const tep = ghi({ institutions: CA.map(([, m]) => m) });
  const mayChu = R.layDanhBa(tep).map((m) => m.id).sort();
  const giaoDien = L.locDanhBa(JSON.parse(fs.readFileSync(tep, 'utf8'))).map((m) => m.id).sort();
  assert.deepStrictEqual(giaoDien, mayChu);
  assert.deepStrictEqual(giaoDien, ['j', 'vn-x'], 'chỉ hai ca hợp lệ được hiện');
});

test('tệp THẬT: giao diện và máy chủ cho ra cùng danh sách', () => {
  const tho = JSON.parse(fs.readFileSync(R.DUONG_MAC_DINH, 'utf8'));
  assert.deepStrictEqual(
    L.locDanhBa(tho).map((m) => m.id).sort(),
    R.layDanhBa().filter((m) => m.countryCode === 'VN').map((m) => m.id).sort(),
  );
});

test('dữ liệu hỏng hoặc rỗng thì trả rỗng, KHÔNG ném', () => {
  for (const hong of [null, undefined, 'x', {}, { institutions: 'x' }, { institutions: [null, 1, 'a'] }]) {
    assert.deepStrictEqual(L.locDanhBa(hong), []);
  }
});

test('số để gọi chỉ còn chữ số, giữ dấu + quốc tế', () => {
  assert.strictEqual(L.soDeGoi('1900 54 54 86'), '1900545486');
  assert.strictEqual(L.soDeGoi('(028) 38 247 247'), '02838247247');
  assert.strictEqual(L.soDeGoi('+84 24 3928 8880'), '+842439288880');
});

test('giao diện: liên kết nguồn mở tab mới an toàn, và không có đường nào mở app ngân hàng', () => {
  const s = fs.readFileSync(path.join(GOC, 'src', 'components', 'SoNganHang.tsx'), 'utf8');
  assert.match(s, /rel="noopener noreferrer"/);
  assert.match(s, /tel:/);
  // Người dùng chốt 17/9/2026: không mở app ngân hàng — chỉ để sẵn số cho bác tự bấm.
  assert.ok(!/intent:|market:|getLaunchIntent|package=/.test(s), 'có đường mở app ngân hàng');
});
