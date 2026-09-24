'use strict';
/**
 * PHÍA APP CỦA ĐƯỜNG FCM — 24/9/2026. Canh những chỗ chỉ lộ ra trên máy thật:
 * kênh thông báo lệch tên (thông báo rơi vào kênh mặc định, không kêu), đăng ký
 * sai hình dạng (máy chủ 400), và dữ liệu thông báo điều hướng app đi lung tung.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const doc = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const APP = doc('src/lib/nhan-canh-bao.ts');

test('tên kênh thông báo TRÙNG giữa app và máy chủ', () => {
  const { KENH_CANH_BAO } = require('../backend/src/gui-fcm');
  assert.match(APP, new RegExp(`const KENH_CANH_BAO = '${KENH_CANH_BAO}'`));
});

test('APK đăng ký đúng hình dạng máy chủ nhận: {loai: "native", token}', () => {
  assert.match(APP, /dangKyNhanCanhBao\(\{ loai: 'native', token \}, lang\)/);
});

test('APK nói đúng lý do khi không bật được — không giả "đã bật"', () => {
  assert.match(APP, /return \{ ok: false, ma: 'CHUA_CAI_FIREBASE' \}/, 'thiếu google-services.json phải nói ra');
  assert.match(APP, /if \(!\(await mayChuGuiDuocFcm\(\)\)\) return \{ ok: false, ma: 'MAY_CHU_CHUA_CAU_HINH' \}/,
    'máy chủ chưa có FCM mà vẫn báo "đã bật" là nói dối');
  const G = doc('src/components/Guardian.tsx');
  assert.match(G, /CHUA_CAI_FIREBASE: '/, 'màn con cháu chưa có câu cho mã mới');
});

test('dữ liệu thông báo chỉ được mở màn Guardian, không điều hướng app đi nơi khác', () => {
  assert.match(APP, /duong\.startsWith\('\/\?view=guardian'\)/);
});

test('app đang mở: hiện thông báo hệ thống, KHÔNG tự nhảy màn', () => {
  const khoi = APP.slice(APP.indexOf("addListener('pushNotificationReceived'"), APP.indexOf("addListener('localNotificationActionPerformed'"));
  assert.ok(khoi.length > 0);
  assert.ok(!/moDuong\(/.test(khoi), 'nhận thông báo lúc app đang mở mà tự nhảy màn — giật con khỏi việc đang làm');
  assert.match(khoi, /LocalNotifications\.schedule/);
});

test('tên kênh (hiện trong Cài đặt Android) đi qua catalog, có ở cả hai ngôn ngữ', () => {
  const G = doc('src/components/Guardian.tsx');
  assert.match(G, /batNhanCanhBao\(lang, tr\('Cảnh báo từ bố mẹ'\)\)/);
  const i18n = doc('src/i18n.ts');
  assert.strictEqual(i18n.split('"Cảnh báo từ bố mẹ":').length - 1, 2);
});

test('main.tsx đăng ký nghe bấm thông báo ngay lúc khởi động', () => {
  assert.match(doc('src/main.tsx'), /langNgheThongBaoApk\(\);/);
});
