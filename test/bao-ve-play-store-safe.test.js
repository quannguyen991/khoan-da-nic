'use strict';
/**
 * KIỂM TRA 4 LỚP BẢO VỆ PLAY-STORE-SAFE TRÊN ANDROID + CHÍNH SÁCH:
 *   1. Hướng A SMS/Thông báo: DocThongBao nâng cấp Tầng 0 offline + app Tin nhắn mặc định, KHÔNG READ_SMS/RECEIVE_SMS.
 *   2. UsageStatsManager (F3 Co-Pilot) + NFC (F1), KHÔNG dùng AccessibilityService.
 *   3. On-device OCR offline (ML Kit Text Recognition) chỉ cho ảnh chụp/chia sẻ, KHÔNG quét thư viện ảnh.
 *   4. Local DNS VPN (VpnService) chỉ định tuyến DNS 10.111.222.2/32, KHÔNG 0.0.0.0/0, KHÔNG gửi lưu lượng ra ngoài.
 *   5. PERMISSIONS-AND-POLICY.md + strings.xml (VI/EN) đồng bộ, tuân thủ §4.1 & §11.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8').replace(/\r\n/g, '\n');
const JAVA = (t) => doc('android/app/src/main/java/vn/khoanda/app', t);
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const MANIFEST = doc('android/app/src/main/AndroidManifest.xml');
const POLICY = doc('PERMISSIONS-AND-POLICY.md');
const STR_VI = doc('android/app/src/main/res/values/strings.xml');
const STR_EN = doc('android/app/src/main/res/values-en/strings.xml');
const NATIVE_TS = doc('src/native.ts');
const PLUGIN = JAVA('KhoanDaPlugin.java');

test('1. SMS/Thông báo Hướng A: đọc app SMS mặc định qua NotificationListener + Tầng 0 offline, không READ_SMS', () => {
  const manifestCode = MANIFEST.replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(!/READ_SMS|RECEIVE_SMS/.test(manifestCode), 'không được khai báo READ_SMS / RECEIVE_SMS');

  const dtb = boChuThich(JAVA('DocThongBao.java'));
  assert.match(dtb, /Telephony\.Sms\.getDefaultSmsPackage/, 'phải nhận diện app SMS mặc định động');
  assert.match(dtb, /laTinDangKiem\(/, 'phải có bộ lọc Tầng 0 offline');
  assert.match(dtb, /ALLOWLIST_TEN_MIEN/, 'phải có allowlist tên miền chính thức');
  assert.match(dtb, /DUOI_MIEN_RUI_RO/, 'phải có danh sách đuôi miền rủi ro');
  assert.match(dtb, /CANH_BAO_NGAN_HANG_THAT/, 'phải có hàng rào phủ định tránh báo nhầm SMS ngân hàng');
  assert.ok(!/Log\.[dvie]\(/.test(dtb), '§6.9 — không được ghi log nội dung thông báo');
  assert.match(PLUGIN, /trangThaiAppTinNhanMacDinh/);
  assert.match(NATIVE_TS, /trangThaiAppTinNhanMacDinh/);
});

test('2. UsageStatsManager (F3 Co-Pilot) + NFC (F1): không dùng AccessibilityService', () => {
  const manifestCode = MANIFEST.replace(/<!--[\s\S]*?-->/g, '');
  assert.match(manifestCode, /android\.permission\.PACKAGE_USAGE_STATS/);
  assert.match(manifestCode, /android\.permission\.NFC/);
  assert.ok(!/BIND_ACCESSIBILITY_SERVICE/.test(manifestCode), 'không được khai báo AccessibilityService');

  const gs = boChuThich(JAVA('GiamSatUngDung.java'));
  assert.match(gs, /UsageStatsManager/);
  assert.match(gs, /NfcAdapter/);
  assert.match(gs, /isEnabled\(\)/);
  assert.ok(!/AccessibilityService/.test(gs), 'GiamSatUngDung không được dùng AccessibilityService');

  const td = boChuThich(JAVA('TheoDoiCuocGoi.java'));
  assert.match(td, /GiamSatUngDung\.kiemTraNhip/);
  assert.match(PLUGIN, /trangThaiQuyenUsageStats/);
  assert.match(PLUGIN, /kiemTraNfc/);
  assert.match(NATIVE_TS, /quyenUsageStats/);
  assert.match(NATIVE_TS, /kiemTraNfc/);
});

test('3. On-device OCR offline (ML Kit): chỉ xử lý 1 ảnh chụp/chia sẻ, không quét thư viện ảnh', () => {
  const ocr = boChuThich(JAVA('OcrTaiMay.java'));
  assert.match(ocr, /TextRecognition\.getClient/);
  assert.match(ocr, /DocThongBao\.laTinDangKiem/);
  assert.ok(!/MediaStore|READ_MEDIA_IMAGES|READ_EXTERNAL_STORAGE|getContentResolver/.test(ocr),
    'OCR không được quét thư viện ảnh cá nhân');
  const manifestCode = MANIFEST.replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(!/READ_MEDIA_IMAGES|READ_EXTERNAL_STORAGE/.test(manifestCode),
    'Manifest không được xin quyền đọc toàn bộ thư viện ảnh');
  assert.match(PLUGIN, /ocrAnh\(/);
  assert.match(NATIVE_TS, /ocrAnhTaiMay/);
});

test('4. Local DNS VPN: chỉ định tuyến 10.111.222.2/32, không 0.0.0.0/0, phản hồi NXDOMAIN cục bộ', () => {
  const manifestCode = MANIFEST.replace(/<!--[\s\S]*?-->/g, '');
  assert.match(manifestCode, /android\.permission\.BIND_VPN_SERVICE/);
  assert.match(manifestCode, /android\.net\.VpnService/);

  const vpn = boChuThich(JAVA('VpnLocDns.java'));
  assert.match(vpn, /extends VpnService/);
  assert.match(vpn, /addRoute\(DIA_CHI_DNS_AO,\s*32\)/);
  assert.ok(!/0\.0\.0\.0/.test(vpn), 'không được định tuyến toàn bộ lưu lượng 0.0.0.0/0');
  assert.match(vpn, /BoLocTenMien\.nenChan/);
  assert.match(vpn, /taoPhanHoiNxDomain/);
  assert.match(vpn, /onRevoke\(/, 'VpnLocDns phải override onRevoke() để dừng sạch khi bị thu hồi VPN');
  assert.match(vpn, /ExecutorService/, 'VpnLocDns phải xử lý gói DNS đồng thời, không chặn luồng TUN');
  assert.match(PLUGIN, /batVpnDns/);
  assert.match(PLUGIN, /tatVpnDns/);
  assert.match(NATIVE_TS, /batVpnDns/);

  const bl = boChuThich(JAVA('BoLocTenMien.java'));
  assert.match(bl, /levenshtein\(/, 'BoLocTenMien phải có kiểm tra typosquatting bằng Levenshtein');
  assert.match(bl, /viettelpost/, 'BoLocTenMien phải có từ khóa mạo danh giao hàng/ví điện tử');

  const appTsx = doc('src/App.tsx');
  for (const fn of [
    'trangThaiAppTinNhanMacDinh', 'quyenUsageStats', 'xinQuyenUsageStats',
    'kiemTraNfc', 'ocrAnhTaiMay', 'trangThaiVpnDns', 'batVpnDns', 'tatVpnDns',
  ]) {
    assert.ok(appTsx.includes(fn), `src/App.tsx phải nối giao diện cho ${fn}`);
  }
});

test('5. PERMISSIONS-AND-POLICY.md & strings.xml (VI/EN) đồng bộ và tuân thủ §4.1 / §11', () => {
  assert.match(POLICY, /PACKAGE_USAGE_STATS/);
  assert.match(POLICY, /NfcAdapter\.isEnabled/);
  assert.match(POLICY, /BIND_VPN_SERVICE/);
  assert.match(POLICY, /Telephony\.Sms\.getDefaultSmsPackage/);
  assert.match(POLICY, /ML Kit Text Recognition/);

  const khoaMoi = [
    'tb_ngan_hang_cuoc_goi_tieu_de',
    'tb_ngan_hang_cuoc_goi_noi_dung',
    'tb_cai_dat_cuoc_goi_tieu_de',
    'tb_cai_dat_cuoc_goi_noi_dung',
    'tb_chat_sang_ngan_hang_tieu_de',
    'tb_chat_sang_ngan_hang_noi_dung',
    'vpn_kenh',
    'vpn_thuong_truc_tieu_de',
    'vpn_thuong_truc_noi_dung',
    'vpn_chan_tieu_de',
    'vpn_chan_noi_dung',
  ];
  for (const k of khoaMoi) {
    assert.ok(STR_VI.includes(`name="${k}"`), `strings.xml thiếu ${k}`);
    assert.ok(STR_EN.includes(`name="${k}"`), `values-en/strings.xml thiếu ${k}`);
  }
  const strEnClean = STR_EN.replace(/<!--[\s\S]*?-->/g, '');
  assert.ok(!/\bsafe\b/i.test(strEnClean), '§4.1 — values-en/strings.xml không được chứa từ "safe"');
});
