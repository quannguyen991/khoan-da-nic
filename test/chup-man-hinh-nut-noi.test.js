'use strict';
// Nút "Chụp màn hình đi kiểm" của bong bóng nổi (30/10/2026) — canh BỐN RÀNG BUỘC riêng tư của
// `ChupManHinh.java`. Đây là test đọc mã nguồn (không chạy được Android ở đây), cùng kiểu với các
// test canh Java khác: nó không chứng minh máy thật chụp được, nó chặn việc ai đó lặng lẽ nới lỏng.

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8').replace(/\r\n/g, '\n');
const JAVA = (t) => doc('android/app/src/main/java/vn/khoanda/app', t);

const CHUP = JAVA('ChupManHinh.java');
const ACT = JAVA('ChupManHinhActivity.java');
const SVC = JAVA('ChupManHinhService.java');
const BONG = JAVA('BongBongNoi.java');
const CHIA = JAVA('NhanChiaSe.java');
const MANIFEST = doc('android/app/src/main/AndroidManifest.xml');
const APP = doc('src/App.tsx');

const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('① chỉ khởi động được từ nút trong menu: activity/service không exported, không có intent-filter', () => {
  const act = MANIFEST.match(/<activity[^>]*ChupManHinhActivity[\s\S]*?\/>/);
  assert.ok(act, 'manifest thiếu ChupManHinhActivity');
  assert.match(act[0], /android:exported="false"/);
  const svc = MANIFEST.match(/<service[^>]*ChupManHinhService[\s\S]*?\/>/);
  assert.ok(svc, 'manifest thiếu ChupManHinhService');
  assert.match(svc[0], /android:exported="false"/);
  assert.match(svc[0], /foregroundServiceType="mediaProjection"/);
  assert.match(MANIFEST, /FOREGROUND_SERVICE_MEDIA_PROJECTION/);
  // Không receiver / intent-filter nào kéo được việc chụp lên từ bên ngoài.
  assert.ok(!/ChupManHinh[^>]*>\s*<intent-filter/.test(MANIFEST), 'việc chụp không được có intent-filter');
});

test('① nơi DUY NHẤT mở ChupManHinhActivity là nút trong menu bong bóng nổi', () => {
  const dung = [];
  for (const f of fs.readdirSync(path.join(GOC, 'android/app/src/main/java/vn/khoanda/app'))) {
    if (!f.endsWith('.java')) continue;
    if (boChuThich(JAVA(f)).includes('ChupManHinhActivity.class')) dung.push(f);
  }
  assert.deepStrictEqual(dung, ['BongBongNoi.java'], `ai khác mở được việc chụp: ${dung}`);
  assert.match(BONG, /nutChup\(/);
});

test('① nút chụp ẩn bong bóng trước khi chụp, và luôn hiện lại; hỏng thì rơi về chọn ảnh', () => {
  assert.match(BONG, /setVisibility\(View\.INVISIBLE\)/);
  assert.match(BONG, /setVisibility\(View\.VISIBLE\)/);
  assert.match(BONG, /khoanda:\/\/loi-tat\/quet-anh/, 'phải còn đường rơi về chỗ chọn ảnh');
});

test('② MỘT khung hình rồi dừng: có dừng MediaProjection, nhả màn hình ảo, dừng service', () => {
  const m = boChuThich(SVC);
  assert.match(m, /chieu\.stop\(\)/, 'phải dừng MediaProjection sau khi chụp');
  assert.match(m, /manAo\.release\(\)/);
  assert.match(m, /stopSelf\(\)/);
  assert.match(m, /acquireLatestImage\(\)/);
  assert.ok(!/setOnImageAvailableListener/.test(m),
    'không được lắng nghe khung hình liên tục — đó là đường dẫn tới quay video');
  assert.ok(!/MediaRecorder|MediaCodec|MediaMuxer/.test(m), 'không quay video');
  // Có trần số lần thử: không bao giờ chạy mãi.
  assert.match(m, /SO_LAN_TOI_DA/);
});

test('② service đúng thứ tự Android 10–14: startForeground TRƯỚC getMediaProjection, registerCallback TRƯỚC createVirtualDisplay', () => {
  const m = boChuThich(SVC);
  assert.ok(m.indexOf('startForeground(') < m.indexOf('getMediaProjection('), 'startForeground phải đứng trước');
  assert.ok(m.indexOf('registerCallback(') < m.indexOf('createVirtualDisplay('), 'Android 14 đòi registerCallback trước');
  assert.match(m, /FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION/);
});

test('③ không ghi ảnh ra đĩa / thư viện ảnh / bộ nhớ ngoài', () => {
  for (const [ten, ma] of [['ChupManHinh', CHUP], ['ChupManHinhActivity', ACT], ['ChupManHinhService', SVC]]) {
    const m = boChuThich(ma);
    assert.ok(!/FileOutputStream|MediaStore|getExternalStorage|openFileOutput|FileWriter|insertImage|createTempFile/.test(m),
      `${ten} ghi ảnh ra đĩa`);
  }
});

test('③ ảnh giữ trong bộ nhớ và chỉ LẤY MỘT LẦN rồi xoá', () => {
  const m = boChuThich(CHUP);
  assert.match(m, /static synchronized String layVaXoa\(\)/);
  assert.match(m, /anhDangCho = null/);
  assert.match(m, /CANH_TOI_DA = 1600/, 'khớp NhanChiaSe');
  assert.match(m, /TRAN_BYTE = 5 \* 1024 \* 1024/, 'khớp trần 5 MB');
});

test('④ ảnh đi qua NhanChiaSe với cờ tuChup, và tầng web ĐỢI bác bấm — không tự gửi', () => {
  assert.match(CHIA, /r\.tuChup = true/);
  assert.match(doc('android/app/src/main/java/vn/khoanda/app/KhoanDaPlugin.java'), /r\.put\("tuChup", true\)/);
  const i = APP.indexOf('if (d.tuChup && d.anh)');
  assert.ok(i > 0, 'tầng web chưa có nhánh tuChup');
  const khoi = APP.slice(i, i + 500);
  assert.match(khoi, /setAnhChupSan\(d\.anh\)/, 'phải đặt vào ô xem trước');
  // Nhánh thường (không phải chế độ siêu đơn giản) KHÔNG gọi handleAnalyze.
  const nhanhThuong = khoi.slice(khoi.indexOf('} else {'), khoi.indexOf('return;'));
  assert.ok(!/handleAnalyze/.test(nhanhThuong), 'ảnh chụp không được tự gửi đi kiểm ở chế độ thường');
});

test('§4.3 chụp hỏng thì NÓI (Toast), không mở app với ảnh rỗng', () => {
  const m = boChuThich(SVC);
  assert.match(m, /Toast\.makeText/);
  assert.match(m, /R\.string\.chup_loi/);
  assert.ok(!/moAppVoiAnh/.test(m.slice(m.indexOf('void thatBai()'), m.indexOf('void thatBai()') + 200)),
    'thatBai() không được mở app');
});

test('chuỗi giao diện có đủ ở cả hai ngôn ngữ', () => {
  for (const f of ['values', 'values-en']) {
    const x = doc(`android/app/src/main/res/${f}/strings.xml`);
    for (const k of ['bb_chup_man_hinh', 'chup_kenh', 'chup_tieu_de', 'chup_noi_dung', 'chup_loi']) {
      assert.ok(x.includes(`name="${k}"`), `${f} thiếu ${k}`);
    }
  }
});

test('không có nhãn "an toàn" trong chuỗi của tính năng chụp (§4.1)', () => {
  for (const f of ['values', 'values-en']) {
    const x = doc(`android/app/src/main/res/${f}/strings.xml`);
    for (const m of x.matchAll(/name="(chup_[a-z_]+|bb_chup_man_hinh)">([^<]*)</g)) {
      assert.ok(!/an toàn|\bsafe\b/i.test(m[2]), `${m[1]} chứa "an toàn/safe"`);
    }
  }
});

test('tài liệu quyền ghi rõ việc đảo chiều và bốn ràng buộc', () => {
  const d = doc('PERMISSIONS-AND-POLICY.md');
  assert.match(d, /Capture screen to check/);
  assert.match(d, /30\/10\/2026/);
  assert.match(d, /one frame, then it stops/);
  assert.match(d, /never written to disk/);
});
