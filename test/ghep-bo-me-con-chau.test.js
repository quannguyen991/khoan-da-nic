'use strict';
/**
 * GHÉP BỐ MẸ ↔ CON CHÁU BẰNG MÃ 6 SỐ — thêm 22/9/2026.
 *
 * Trước ngày này máy chủ đã có luồng ghép, nhưng màn Guardian không gọi tới nó:
 * nút "Nạp tài khoản & máy mẫu" chỉ nạp dữ liệu giả vào localStorage. Bộ test này
 * chạy trọn luồng qua HTTP thật và chốt những điều màn hình được phép nói.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

const GOC = path.join(__dirname, '..');
const GHEP = fs.readFileSync(path.join(GOC, 'src', 'components', 'GhepConChau.tsx'), 'utf8');
const GUARDIAN = fs.readFileSync(path.join(GOC, 'src', 'components', 'Guardian.tsx'), 'utf8');

async function moMayChu() {
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (method, duong, body, token) => {
    const r = await fetch(goc + duong, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  return { sv, goi };
}

test('trọn luồng: bố mẹ lấy mã → con nhập → hai bên thấy nhau → bố mẹ gỡ', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const hauTo = String(Date.now()).slice(-7);
    const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: `091${hauTo}`, matKhau: 'mat-khau-thu-1', ten: 'Bác Lan thử' });
    const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: `098${hauTo}`, matKhau: 'mat-khau-thu-2', ten: 'Minh thử' });
    assert.strictEqual(me.s, 200); assert.strictEqual(con.s, 200);

    const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
    assert.match(ma.j.ma, /^\d{6}$/);
    const noi = await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
    assert.strictEqual(noi.j.daGhep, true);

    const phiaCon = await goi('GET', '/api/proof/ghep', null, con.j.token);
    assert.strictEqual(phiaCon.j.chuTaiKhoan[0].ten, 'Bác Lan thử');
    assert.strictEqual(phiaCon.j.chuTaiKhoan[0].so, `091${hauTo}`);
    const phiaMe = await goi('GET', '/api/proof/ghep', null, me.j.token);
    assert.strictEqual(phiaMe.j.thanhVien[0].ten, 'Minh thử');

    // Không một trường bí mật nào của bản ghi tài khoản lọt ra đường này.
    const tho = JSON.stringify([phiaCon.j, phiaMe.j]);
    assert.ok(!/"bam"|"muoi"|matKhau|mat-khau-thu/.test(tho), `lộ trường bí mật: ${tho}`);

    assert.strictEqual((await goi('GET', '/api/proof/ghep')).s, 401, 'chưa đăng nhập mà đọc được vòng ghép');

    const go = await goi('POST', '/api/proof/thu-hoi', { thanhVienId: con.j.hoSo.id }, me.j.token);
    assert.strictEqual(go.j.daThuHoi, true);
    const sau = await goi('GET', '/api/proof/ghep', null, con.j.token);
    assert.strictEqual(sau.j.chuTaiKhoan.length, 0, 'bố mẹ gỡ rồi mà con vẫn thấy');
  } finally {
    sv.close();
  }
});

test('§4.3 — /api/suc-khoe nói kho gì và có giữ được qua deploy không, không lộ địa chỉ DB', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const k = (await goi('GET', '/api/suc-khoe')).j;
    assert.ok(k.kho && typeof k.kho.loai === 'string', 'thiếu kho.loai');
    assert.strictEqual(typeof k.kho.giuQuaDeploy, 'boolean');
    assert.strictEqual(typeof k.bienDaDat.DATABASE_URL, 'boolean', 'DATABASE_URL chỉ được báo có/không');
    assert.ok(!/postgres(ql)?:\/\//.test(JSON.stringify(k)), 'lộ chuỗi kết nối DB');
  } finally {
    sv.close();
  }
});

test('giuQuaDeploy chỉ true với Postgres, hoặc SQLite ngoài Render', () => {
  const nguon = fs.readFileSync(path.join(GOC, 'backend', 'server.js'), 'utf8');
  assert.match(nguon, /giuQuaDeploy: k\.loai === 'postgres' \|\| \(k\.loai === 'sqlite' && !process\.env\.RENDER\)/,
    'SQLite trên ổ tạm của Render mất sạch sau mỗi deploy — không được báo là giữ được');
});

test('render.yaml khai DATABASE_URL là biến đặt tay, không có giá trị trong tệp', () => {
  const y = fs.readFileSync(path.join(GOC, 'render.yaml'), 'utf8');
  assert.match(y, /- key: DATABASE_URL\s*\n\s*sync: false/);
  assert.ok(!/postgres(ql)?:\/\/[^\s<]/.test(y.replace(/#.*$/gm, '')), 'chuỗi kết nối (có mật khẩu) bị viết vào render.yaml');
});

// ── Màn bố mẹ ───────────────────────────────────────────────────────────────

test('mã nối KHÔNG tự hiện — bác phải bấm lấy (mã này trông y hệt OTP)', () => {
  const i = GHEP.indexOf('export function ManGhepConChau');
  const than = GHEP.slice(i);
  const hieuUng = [...than.matchAll(/useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[/g)].map((m) => m[1]).join('\n');
  assert.ok(!/layMaGhep|layMa\(/.test(hieuUng), 'mã được lấy tự động lúc mở màn');
  assert.match(than, /onClick=\{layMa\}/);
});

test('lời dặn chống lừa đứng TRƯỚC mã, và nói thẳng ai xin mã là lừa đảo', () => {
  const iDan = GHEP.indexOf('Ai gọi đến hay nhắn tin xin mã này thì đó là lừa đảo');
  const iMa = GHEP.indexOf("t('Mã nối của bác')");
  assert.ok(iDan > 0 && iMa > 0 && iDan < iMa, 'lời dặn phải nằm trên mã, không phải dưới');
});

test('§9.8 — bố mẹ luôn thấy ai đang nối và gỡ được bằng một chạm', () => {
  assert.match(GHEP, /onClick=\{\(\) => thuHoi\(n\.id\)\}/);
  assert.match(GHEP, /t\('Gỡ nối'\)/);
});

test('§11 — màn bố mẹ không hứa con cháu "theo dõi" được máy', () => {
  const chu = [...GHEP.matchAll(/t\('([^']+)'\)/g)].map((m) => m[1]).join(' | ');
  assert.ok(!/theo dõi|định vị|giám sát/i.test(chu), `câu vượt quá điều việc nối làm được: ${chu}`);
});

// ── Màn Guardian ────────────────────────────────────────────────────────────

test('Guardian: nối thật thì pin/sóng/vị trí vẫn là "—", không mượn số mẫu', () => {
  assert.match(GUARDIAN, /parentData && !laThat \? '74%' : '—'/);
  assert.match(GUARDIAN, /parentData && !laThat \? tr\('Vị trí mẫu'\) : '—'/);
});

test('Guardian: so trạng thái nối bằng MÃ, không bằng chữ hiển thị (§4.1)', () => {
  assert.match(GUARDIAN, /const laThat = parentData\?\.network === 'that';/);
  assert.match(GUARDIAN, /network: 'that'/);
});

test('Guardian: băng "chế độ xem thử" chỉ biến mất khi đã nối thật', () => {
  const i = GUARDIAN.indexOf("tr('Máy bố mẹ đang ở chế độ xem thử.");
  const truoc = GUARDIAN.slice(Math.max(0, i - 600), i);
  assert.match(truoc, /\{!laThat && \(/, 'băng xem thử bị gỡ vô điều kiện, hoặc còn hiện khi đã nối thật');
});

// ── i18n ────────────────────────────────────────────────────────────────────

test('mọi câu mới của hai màn đều có trong CẢ HAI catalog (§4.1)', () => {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'i18n-ghep.cjs');
  fs.mkdirSync(path.dirname(ra), { recursive: true });
  esbuild.buildSync({ entryPoints: [path.join(GOC, 'src', 'i18n.ts')], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
  const { translations } = require(ra);
  const cau = new Set([
    ...[...GHEP.matchAll(/\bt\('([^']+)'\)/g)].map((m) => m[1]),
    ...[...GHEP.matchAll(/: '([^']+[.!?])',?\n/g)].map((m) => m[1]),   // bảng LOI + câu dự phòng
    ...[...GUARDIAN.matchAll(/tr\('((?:Nối|Mã|Đang nối|Đăng nhập để|Đã nối'|Chỉ có tên|Trên máy bố mẹ)[^']*)'\)/g)].map((m) => m[1]),
  ]);
  for (const c of cau) {
    assert.ok(translations.vi[c], `thiếu bản tiếng Việt: "${c}"`);
    assert.ok(translations.en[c] && translations.en[c] !== c, `thiếu bản tiếng Anh: "${c}"`);
  }
});
