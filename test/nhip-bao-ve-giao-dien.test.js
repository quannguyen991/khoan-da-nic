'use strict';
/**
 * NHỊP BẢO VỆ — phía web và phía Java (23/9/2026). Test đọc nguồn.
 * Phía máy chủ có test HTTP riêng: test/nhip-bao-ve.test.js.
 *
 * Canh: §12 đọc quy tắc TRƯỚC khi gửi; chưa bật / đăng xuất là thu hồi token của
 * dịch vụ nền; chỉ bool; máy con nói "N ngày chưa báo về" thay vì im; không "an toàn".
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const doc = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');
const JAVA = 'android/app/src/main/java/vn/khoanda/app/';

test('§12 — máy bố mẹ đọc quy tắc TRƯỚC khi gửi; chưa bật hay đăng xuất thì thu hồi token của dịch vụ nền', () => {
  const L = boChuThich(doc('src/lib/nhip-bao-ve.ts'));
  const iQuyTac = L.indexOf('docQuyTacBao()');
  const iGui = L.indexOf('guiNhipBaoVe(');
  const iNative = L.indexOf('datNhipBaoVeNative(bat ?');
  assert.ok(iQuyTac > 0 && iGui > iQuyTac && iNative > iQuyTac, 'phải biết bác đã bật chưa rồi mới gửi hay trao token');
  assert.match(L, /if \(!phien\) \{ await datNhipBaoVeNative\(\{ bat: false \}\); return; \}/, 'đăng xuất ⇒ thu hồi');
  assert.match(L, /if \(!bat\) return;/);
  // Bản web: null, KHÔNG phải false.
  assert.match(L, /docThongBao: null, theoDoiCuocGoi: null, hienTrenApp: null/);
  // App gọi đồng bộ khi mở / đăng nhập / đăng xuất / quay lại app.
  const APP = doc('src/App.tsx');
  assert.match(APP, /void dongBoNhipBaoVe\(\);\s*const khiQuayLai/);
  assert.match(APP, /\}, \[hoSo\?\.id\]\);/);
});

test('máy con: nói giờ báo về, quá 2 ngày thì nói thẳng "chưa báo về", không bao giờ "an toàn"', () => {
  const V = boChuThich(doc('src/components/TrangThaiBaoVeBoMe.tsx'));
  assert.match(V, /const QUA_LAU_MS = 48 \* 60 \* 60 \* 1000;/);
  assert.match(V, /t\('\{n\} ngày chưa báo về\. Có thể máy đã tắt bảo vệ — gọi hỏi bố mẹ\.'\)/);
  assert.match(V, /t\('Máy \{ten\} chưa báo về lần nào\.'\)/, 'bật mà chưa báo về KHÁC đang được bảo vệ (§4.3)');
  const chu = [...V.matchAll(/(?<![\w.])t\('([^']+)'\)/g), ...V.matchAll(/ten: '([^']+)'/g)].map((m) => m[1]);
  for (const c of chu) assert.ok(!/an toàn|được bảo vệ đầy đủ|safe/i.test(c), `§11: "${c}"`);
  const i18n = doc('src/i18n.ts');
  for (const c of new Set(chu)) assert.strictEqual(i18n.split(JSON.stringify(c) + ':').length - 1, 2, `thiếu catalog: ${c}`);
  assert.match(doc('src/components/Guardian.tsx'), /\{laThat && coPhien && <TrangThaiBaoVeBoMeView /);
});

test('công tắc ở màn cài giúp: mặc định TẮT, nói rõ gửi gì và KHÔNG gửi gì', () => {
  const W = doc('src/components/ConCaiGiup.tsx');
  assert.match(W, /choConXemBaoVe: false \}\)/);
  assert.match(W, /t\('Chỉ gửi bật\/tắt của các quyền bảo vệ\. Không gửi tin nhắn, vị trí hay pin\.'\)/);
  assert.match(W, /void dongBoNhipBaoVe\(\{ ep: true \}\)/, 'vừa bật/tắt là báo hoặc thu hồi ngay');
});

test('Java: chỉ https, chỉ ba bool, không log, 401 là thôi gửi; dịch vụ nền báo mỗi 6 giờ và dọn khi chết', () => {
  const N = boChuThich(doc(JAVA + 'NhipBaoVe.java'));
  assert.match(N, /!duong\.startsWith\("https:\/\/"\)\) return;/);
  assert.match(N, /if \(ketNoi\.getResponseCode\(\) == 401\) xoa\(ctx\);/);
  assert.ok(!/Log\.[dviwe]\(/.test(N), 'không log — yêu cầu có token');
  // Thân yêu cầu: đúng nguon, laApk và ba quyền — không gì khác.
  const khoa = [...N.matchAll(/\\"([a-zA-Z_]+)\\":/g)].map((m) => m[1]).sort();
  assert.deepStrictEqual(khoa, ['docThongBao', 'hienTrenApp', 'laApk', 'nguon', 'quyen', 'theoDoiCuocGoi']);
  assert.match(N, /CHU_KY_MS = 6 \* 60 \* 60 \* 1000L;/);
  const S = boChuThich(doc(JAVA + 'TheoDoiCuocGoi.java'));
  assert.match(S, /NhipBaoVe\.gui\(TheoDoiCuocGoi\.this\);\s*tay\.postDelayed\(this, NhipBaoVe\.CHU_KY_MS\);/);
  assert.match(S, /public void onDestroy\(\) \{\s*huyHen\(\);\s*huyNhipBaoVe\(\);/);
  const P = boChuThich(doc(JAVA + 'KhoanDaPlugin.java'));
  const i = P.indexOf('public void datNhipBaoVe(PluginCall call)');
  assert.ok(i > 0);
  assert.match(P.slice(i, i + 700), /!duong\.startsWith\("https:\/\/"\)\) \{\s*NhipBaoVe\.xoa\(getContext\(\)\);/);
});

test('tài liệu quyền công khai khai đúng luồng dữ liệu mới', () => {
  const D = doc('PERMISSIONS-AND-POLICY.md');
  assert.match(D, /Protection status \("is this phone still protected\?"\)/);
  assert.match(D, /switching it off deletes the stored report/);
});
