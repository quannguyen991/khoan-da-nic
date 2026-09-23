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
  // Nhịp 2 phút RIÊNG từng loại: cảnh báo OTP vừa bật không được nuốt cảnh báo "tiền vừa ra".
  assert.match(CUOC_GOI, /Long truoc = LAN_BAT\.get\(loiTat\);/);
  assert.match(CUOC_GOI, /if \(truoc != null && bayGio - truoc < GIAN_CACH_BAT_MS\) return;/);
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

test('④ tin TRỪ TIỀN tới trong lúc gọi ⇒ tự mở màn, có lối thẳng vào phục hồi; báo con theo quy tắc thứ hai', () => {
  // Chạy TRƯỚC kiểm OTP: tin biến động số dư gấp hơn.
  assert.ok(DOC_TB.indexOf('if (kiemTienRaTrongCuocGoi(noiDung)) return;') < DOC_TB.indexOf('if (kiemMaTrongCuocGoi(noiDung)) return;'));
  assert.match(DOC_TB, /if \(soTienRa\(noiDung\) < NGUONG_TIEN_RA\) return false;/);
  assert.match(DOC_TB, /NGUONG_TIEN_RA = 1_000_000L/);
  assert.match(DOC_TB, /CuocGoi\.batManCanhBao\(this, "tien-ra-trong-cuoc-goi"/);
  // Regex phải có dấu gạch chéo thật — bẫy heredoc đã từng làm `\d` thành ký tự rác.
  const nguon = doc(JAVA, 'DocThongBao.java');
  assert.match(nguon, /\(\\\\d\{1,3\}\(\?:\[\.,\]\\\\d\{3\}\)\+\|\\\\d\{4,\}\)/, 'SO_TIEN_TRU phải chứa \\\\d thật trong mã nguồn Java');
  assert.ok(!/[\x00-\x08]/.test(nguon), 'không có ký tự điều khiển lọt vào mã nguồn');
  for (const f of ['values', 'values-en']) {
    const x = doc(GOC, 'android', 'app', 'src', 'main', 'res', f, 'strings.xml');
    for (const k of ['tb_tien_ra_cuoc_goi_tieu_de', 'tb_tien_ra_cuoc_goi_noi_dung']) assert.ok(x.includes(`name="${k}"`), `${f} thiếu ${k}`);
  }
  assert.match(APP, /'tien-ra-trong-cuoc-goi': 'tien_ra_trong_cuoc_goi'/);
  assert.match(APP, /lyDoTuBat === 'tien_ra_trong_cuoc_goi' && !canRecovery/);
  const BDG = require('../backend/src/bao-dong-gia-dinh');
  assert.ok(BDG.LOAI_SU_KIEN.includes('tien_ra_trong_cuoc_goi'));
  assert.match(BDG.CHU.vi.tien_ra_trong_cuoc_goi, /\{ten\}/);
});

test('⑤ thông báo app NGÂN HÀNG (người dùng quyết 23/9): danh sách cố định, chỉ kiểm trong lúc gọi, không lưu, có nói trước', () => {
  const nguon = doc(JAVA, 'DocThongBao.java');
  const khoi = nguon.slice(nguon.indexOf('GOI_NGAN_HANG = new ArrayList'), nguon.indexOf('}};', nguon.indexOf('GOI_NGAN_HANG = new ArrayList')));
  const goi = [...khoi.matchAll(/add\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.strictEqual(goi.length, 22, 'đổi danh sách thì xác minh trên Google Play rồi sửa số này và PERMISSIONS-AND-POLICY.md');
  for (const g of ['com.VCB', 'com.vnpay.bidv', 'com.mservice.momotransfer']) assert.ok(goi.includes(g), g);
  // Nhánh ngân hàng rẽ ra TRƯỚC khi vào đường tin nhắn, và kết thúc bằng return — không lọt vào HANG.
  const nhanh = DOC_TB.slice(DOC_TB.indexOf('if (GOI_NGAN_HANG.contains(sbn.getPackageName())) {'));
  assert.match(nhanh, /^if \(GOI_NGAN_HANG\.contains\(sbn\.getPackageName\(\)\)\) \{\s*kiemThongBaoNganHang\(sbn\.getNotification\(\)\);\s*return;/);
  const ham = DOC_TB.slice(DOC_TB.indexOf('private void kiemThongBaoNganHang'), DOC_TB.indexOf('private boolean kiemTienRaTrongCuocGoi'));
  assert.ok(!/them\(|sangLocTaiCho\(|Log\./.test(ham), 'thông báo ngân hàng: không lưu vào hàng đợi, không sàng lọc, không log');
  assert.match(ham, /kiemTienRaTrongCuocGoi\(noiDung\)/);
  // Nói trước khi xin quyền, và tài liệu quyền công khai nói đúng.
  assert.match(APP, /data-noi-truoc="ngan-hang"/);
  assert.match(doc(GOC, 'PERMISSIONS-AND-POLICY.md'), /fixed list of 22 Vietnamese bank and e-wallet apps/);
});

test('cuộc gọi QUA MẠNG (Zalo, Messenger…) cũng tính là đang gọi — qua chế độ âm thanh, không thêm quyền', () => {
  // TelephonyManager chỉ thấy cuộc gọi di động. Ở VN nhiều vụ giả danh công an gọi qua Zalo.
  assert.match(CUOC_GOI, /return dangGoiDiDong\(ctx\) \|\| dangGoiQuaMang\(ctx\);/);
  assert.match(CUOC_GOI, /AudioManager\.MODE_IN_COMMUNICATION/);
  assert.match(CUOC_GOI, /am\.getMode\(\)/);
  // Service nghe lúc vào/ra cuộc gọi qua mạng để có mốc "vừa gác máy" (API 31+).
  assert.match(THEO_DOI, /am\.addOnModeChangedListener\(exec, b\)/);
  assert.match(THEO_DOI, /am\.removeOnModeChangedListener/, 'gỡ bộ nghe khi service chết');
  assert.match(THEO_DOI, /doiCheDoAmThanh\(am\.getMode\(\)\)/, 'service sống lại giữa cuộc gọi vẫn bắt được');
  // getMode() và OnModeChangedListener không cần quyền nào — không thêm dòng nào vào manifest.
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

test('màn web: ba lối tắt tự bật dựng lượt KHÔNG NHÃN, và báo cho con đúng loại sự kiện', () => {
  const i = APP.indexOf('const LY_DO_TU_BAT = {');
  assert.ok(i > 0);
  const khoi = APP.slice(i, APP.indexOf("setView('warning');", i));
  for (const ma of ['otp-trong-cuoc-goi', 'cai-app-trong-cuoc-goi', 'tien-ra-trong-cuoc-goi']) assert.ok(khoi.includes(`'${ma}'`), ma);
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
