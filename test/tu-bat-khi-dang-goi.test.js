'use strict';
/**
 * PHẦN 4 "CẦU DAO GIA ĐÌNH" — APK TỰ BẬT ĐÚNG KHOẢNH KHẮC (23/9/2026).
 *
 * ① đang gọi (hoặc vừa gác máy ≤ 2 phút) + tin có MÃ tới ⇒ tự mở màn cảnh báo
 * ② đang gọi + vừa cài app mới ⇒ tự mở màn cảnh báo
 * ③ nút gọi con: gọi thẳng một chạm (CALL_PHONE, người dùng duyệt 23/9)
 *
 * ⚠️ Máy dựng không chạy javac trong bộ test — test SOÁT MÃ NGUỒN Java theo các
 * ràng buộc riêng tư/an toàn; chạy thật thì người dùng thử trên máy (xem kế hoạch).
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const JAVA = path.join(GOC, 'android', 'app', 'src', 'main', 'java', 'vn', 'khoanda', 'app');
const doc = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const CUOC_GOI = boChuThich(doc(JAVA, 'CuocGoi.java'));
const DOC_TB = boChuThich(doc(JAVA, 'DocThongBao.java'));
const THEO_DOI = boChuThich(doc(JAVA, 'TheoDoiCuocGoi.java'));
const NHAN_APP = boChuThich(doc(JAVA, 'NhanAppMoi.java'));
const PLUGIN = boChuThich(doc(JAVA, 'KhoanDaPlugin.java'));
const MANIFEST = doc(GOC, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const APP = doc(GOC, 'src', 'App.tsx');

test('① mã tới trong lúc đang gọi ⇒ tự mở màn; KHÔNG gửi nội dung, KHÔNG log', () => {
  assert.match(DOC_TB, /kiemMaTrongCuocGoi\(noiDung\)/);
  assert.match(DOC_TB, /CuocGoi\.dangHoacVuaGoi\(this, System\.currentTimeMillis\(\)\)/);
  assert.match(DOC_TB, /CuocGoi\.batManCanhBao\(this, "otp-trong-cuoc-goi"/);
  assert.ok(!/Log\.[dviwe]\(/.test(DOC_TB), '§6.9 — một dòng log ở đây là rò tin nhắn vào logcat');
  assert.ok(!/HttpURLConnection|OkHttp|URL\(/.test(DOC_TB + CUOC_GOI), '§6.9 — đường tự bật không được ra mạng');
});

test('CuocGoi: chỉ đọc "có đang gọi", không số, không nhật ký; tự bật tối đa một lần mỗi 2 phút', () => {
  assert.match(CUOC_GOI, /getCallState\(\) == TelephonyManager\.CALL_STATE_OFFHOOK/);
  assert.ok(!/READ_CALL_LOG|CallLog|getLine1Number|incomingNumber/.test(CUOC_GOI), 'không được biết ai đang gọi');
  assert.match(CUOC_GOI, /GIAN_CACH_BAT_MS = 2 \* 60 \* 1000L/);
  assert.match(CUOC_GOI, /if \(bayGio - lanBatCuoi < GIAN_CACH_BAT_MS\) return;/);
  assert.match(CUOC_GOI, /catch \(SecurityException e\) \{\s*return false;/, 'không có quyền thì KHÔNG tự bật mù');
  // Câu chữ đến từ strings.xml (§4.1), không soạn trong Java.
  assert.ok(!/"[^"]*[àáảãạăâđèéêìíòóôơùúưỳý][^"]*"/i.test(CUOC_GOI), 'CuocGoi.java không được chứa câu tiếng Việt');
});

test('mốc "vừa gác máy" được ghi, và thông báo tự bật đi qua strings.xml cả hai ngôn ngữ', () => {
  assert.match(THEO_DOI, /CuocGoi\.lucGacMay = System\.currentTimeMillis\(\);/);
  for (const f of ['values', 'values-en']) {
    const x = doc(GOC, 'android', 'app', 'src', 'main', 'res', f, 'strings.xml');
    for (const k of ['tb_otp_cuoc_goi_tieu_de', 'tb_otp_cuoc_goi_noi_dung', 'tb_cai_app_cuoc_goi_tieu_de', 'tb_cai_app_cuoc_goi_noi_dung', 'tb_app_moi_tieu_de', 'tb_app_moi_noi_dung']) {
      assert.ok(x.includes(`name="${k}"`), `${f}/strings.xml thiếu ${k}`);
    }
    // aapt từ chối dấu nháy đơn không thoát — lỗi dựng APK im lặng tới lúc build.
    const cacChuoi = [...x.matchAll(/<string name="(tb_[a-z_]+)">([^<]*)<\/string>/g)];
    for (const [, ten, chu] of cacChuoi) assert.ok(!/(^|[^\\])'/.test(chu), `${f}: ${ten} có dấu ' chưa thoát`);
  }
});

test('② vừa cài app: đăng ký ĐỘNG trong service (manifest không nhận được từ Android 8), chặn xử lý hai lần', () => {
  assert.match(THEO_DOI, /new android\.content\.IntentFilter\(Intent\.ACTION_PACKAGE_ADDED\)/);
  assert.match(THEO_DOI, /registerReceiver\(nhanCaiApp, f, Context\.RECEIVER_NOT_EXPORTED\)/);
  assert.match(THEO_DOI, /unregisterReceiver\(nhanCaiApp\)/, 'phải gỡ bộ nhận khi service dừng');
  assert.match(THEO_DOI, /CuocGoi\.batManCanhBao\(c, "cai-app-trong-cuoc-goi"/);
  assert.match(NHAN_APP, /bayGio - lucCuoi < 10_000L/);
  assert.ok(!/"Có một việc cần bác xem/.test(NHAN_APP), 'khoản nợ chuỗi mã cứng đã trả — đừng đưa lại');
});

test('③ gọi thẳng: có quyền thì ACTION_CALL, không có thì ACTION_DIAL — nút không bao giờ chết', () => {
  assert.match(MANIFEST, /<uses-permission android:name="android\.permission\.CALL_PHONE" \/>/);
  assert.match(PLUGIN, /@Permission\(alias = "goiDien", strings = \{ Manifest\.permission\.CALL_PHONE \}\)/);
  assert.match(PLUGIN, /coQuyen \? Intent\.ACTION_CALL : Intent\.ACTION_DIAL/);
  const NATIVE = doc(GOC, 'src', 'native.ts');
  const i = NATIVE.indexOf('export function goiDienThoai');
  const khoi = NATIVE.slice(i, i + 800);
  assert.match(khoi, /if \(!laMayCaiDongBo\(\)\) \{\s*window\.open\(`tel:\$\{sach\}`, '_self'\);/, 'web: mở tel: ngay trong cú bấm');
  assert.match(khoi, /hanGio\(/, 'mọi lệnh native phải có hạn giờ');
});

test('màn web: hai lối tắt tự bật dựng lượt KHÔNG NHÃN, và báo cho con đúng loại sự kiện', () => {
  const i = APP.indexOf("if (d.loiTat === 'otp-trong-cuoc-goi' || d.loiTat === 'cai-app-trong-cuoc-goi') {");
  assert.ok(i > 0);
  const khoi = APP.slice(i, i + 500);
  assert.match(khoi, /tuBamDung: true/);
  assert.ok(!/nhan:/.test(khoi), '§4.2 — máy tự bật không được tự đặt nhãn rủi ro');
  const CAP = doc(GOC, 'src', 'components', 'ConCaiGiup.tsx');
  assert.match(CAP, /xinQuyenGoiThang\(\)/, 'quyền gọi thẳng xin ở bước "Con cháu cài giúp"');
});

test('tài liệu quyền công khai nói đúng: CALL_PHONE giờ ĐƯỢC xin, và vì sao', () => {
  const P = doc(GOC, 'PERMISSIONS-AND-POLICY.md');
  assert.match(P, /CALL_PHONE/);
  assert.ok(!/cố ý không xin[^\n]*CALL_PHONE/i.test(P), 'tài liệu còn ghi CALL_PHONE là "cố ý không xin" — lệch với mã (§11)');
});
