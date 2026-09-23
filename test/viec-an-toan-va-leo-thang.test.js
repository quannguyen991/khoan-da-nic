'use strict';
/**
 * VIỆC #1 (việc an toàn tiếp theo) và VIỆC #3 (leo thang trong một lượt).
 * Thêm 22/9/2026.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'viec-an-toan.cjs');
const NGUON = path.join(GOC, 'src', 'lib', 'viec-an-toan-tiep-theo.ts');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(path.dirname(TEP_GOI), { recursive: true });
  esbuild.buildSync({
    entryPoints: [NGUON], bundle: true, format: 'cjs', platform: 'node',
    outfile: TEP_GOI, absWorkingDir: GOC, logLevel: 'silent',
  });
  return require(TEP_GOI);
}
const V = goi();
const APP = fs.readFileSync(path.join(GOC, 'src', 'App.tsx'), 'utf8');

// ── Việc #1 ────────────────────────────────────────────────────────────────

const CA = [
  ['giả danh ngân hàng', { nhan: 'CAO', maLyDo: ['ID_BANK_IMPERSONATION', 'CRED_OTP_SHARE'] }, 'goi_so_sau_the'],
  ['dụ cài app', { nhan: 'CAO', maLyDo: ['DEV_INSTALL_APK_UNKNOWN', 'FIN_TRANSFER_REQUEST'] }, 'khong_cai_gui_nguoi_than'],
  ['giả danh người thân', { nhan: 'NGHI_NGO', maLyDo: ['ID_FAMILY_IMPERSONATION', 'FIN_TRANSFER_REQUEST'] }, 'goi_so_cu_nguoi_than'],
  ['họ kịch bản người thân', { nhan: 'CAO', maLyDo: [], hoKichBan: 'bao_tin_nguoi_than_gap_nan' }, 'goi_so_cu_nguoi_than'],
  ['chỉ xin OTP', { nhan: 'NGHI_NGO', maLyDo: ['CRED_OTP_SHARE'] }, 'khong_doc_ma'],
  ['giả danh công an', { nhan: 'CAO', maLyDo: ['ID_AUTHORITY_IMPERSONATION', 'FIN_SAFE_ACCOUNT'] }, 'cup_may_goi_nguoi_than'],
  ['bộ luật chọn RECOVERY', { nhan: 'CAO', canThiep: 'RECOVERY', maLyDo: ['FIN_TRANSFER_REQUEST'] }, 'goi_ngan_hang_phuc_hoi'],
  ['bác khai đã lỡ chuyển', { nhan: 'CHUA_THAY', maLyDo: [], daLoChuyen: true }, 'goi_ngan_hang_phuc_hoi'],
];
for (const [ten, vao, mong] of CA) {
  test(`việc an toàn: ${ten} → ${mong}`, () => {
    assert.strictEqual(V.chonViecAnToan(vao), mong);
  });
}

test('chiếm quyền máy thắng mọi kịch bản chưa mất tiền — điều khiển từ xa rút tiền ngay lúc bác đang đọc', () => {
  assert.strictEqual(V.chonViecAnToan({
    nhan: 'CAO', maLyDo: ['DEV_REMOTE_CONTROL_APP', 'ID_BANK_IMPERSONATION', 'ID_FAMILY_IMPERSONATION'],
  }), 'khong_cai_gui_nguoi_than');
});

test('§4.6 — "Chưa thấy dấu hiệu" KHÔNG mọc ra một việc khẩn cấp', () => {
  assert.strictEqual(V.chonViecAnToan({ nhan: 'CHUA_THAY', canThiep: 'TRUST_RECEIPT', maLyDo: [] }), null,
    'màn chưa thấy dấu hiệu mà bày ra một lệnh hành động là tự dựng một cảnh báo bộ luật không hề đưa ra');
});

test('mọi câu việc an toàn đều có trong CẢ HAI catalog (§4.1)', () => {
  const { translations } = (() => {
    const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
    const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'i18n.cjs');
    esbuild.buildSync({ entryPoints: [path.join(GOC, 'src', 'i18n.ts')], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
    return require(ra);
  })();
  for (const cau of Object.values(V.CAU_VIEC_AN_TOAN)) {
    assert.ok(translations.vi[cau], `thiếu bản tiếng Việt: "${cau}"`);
    assert.ok(translations.en[cau] && translations.en[cau] !== cau, `thiếu bản tiếng Anh: "${cau}"`);
  }
});

test('§11 — không câu việc an toàn nào hứa an toàn, hứa lấy lại tiền, hay bịa số', () => {
  for (const cau of Object.values(V.CAU_VIEC_AN_TOAN)) {
    assert.ok(!/an toàn|lấy lại được|chắc chắn/i.test(cau), `câu vượt quá điều app biết: "${cau}"`);
    assert.ok(!/\d{3,}/.test(cau), `câu tự đưa ra một con số điện thoại: "${cau}" — danh bạ ngân hàng có 0 số đã duyệt`);
  }
});

test('hàm việc an toàn không đụng tới nhãn hay mức can thiệp (§4.2)', () => {
  const nguon = fs.readFileSync(NGUON, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/fetch\(|require\(|import .*decision-engine|riskScore/.test(nguon),
    'hàm chọn việc an toàn phải thuần — không gọi mạng, không đọc bộ luật');
});

// ── Việc #3 ────────────────────────────────────────────────────────────────

test('leo thang chỉ bật khi HẾT giờ, CHƯA hành động, và CHƯA lỡ chuyển', () => {
  assert.match(APP, /const leoThang = coKhoangDung && timeLeft === 0 && !daHanhDong && !daBamPhucHoi;/,
    'điều kiện leo thang đã đổi — người đã gọi người thân mà vẫn bị giục gọi là màn nói sai về hành động của họ');
});

/*
 * ⚠️ ĐỔI 23/9/2026 (Phần 1 "Cầu dao gia đình"): bậc leo thang không còn mang nút
 * gọi riêng. Nút gọi của màn gấp đã nằm NGAY TRÊN nó — hai nút gọi sát nhau là
 * thêm một lựa chọn cho người đang hoảng. Ý canh gác giữ nguyên: leo thang chỉ
 * NÓI, không tự làm (§12), và nút gọi phải nằm ngay đó.
 */
test('leo thang KHÔNG tự gọi, không tự nhắn — chỉ NÓI; nút gọi đã nằm ngay trên nó (§12)', () => {
  const i = APP.indexOf('{leoThang && (');
  assert.ok(i > 0, 'không tìm thấy khối leo thang');
  const het = APP.indexOf('{!leoThang && timeLeft > 0 && (', i);
  assert.ok(het > i, 'khối leo thang phải đứng ngay trước dòng đếm giây');
  const khoi = APP.slice(i, het);
  assert.ok(khoi.length < 1500, 'khối leo thang phình to bất thường — xem lại');
  assert.ok(!/window\.open|tel:|sms:|fetch\(|useEffect/.test(khoi),
    '§12 cấm "tự bật auto-alert thay chủ tài khoản" — bậc leo thang chỉ được nói, không được tự làm');
  const iNut = APP.indexOf('{nutHanhDongGap}');
  assert.ok(iNut > 0 && iNut < i, 'nút gọi của màn gấp phải đứng NGAY TRÊN bậc leo thang');
});

test('gọi, nhắn, hoặc báo đã lỡ chuyển đều tính là đã hành động', () => {
  assert.match(APP, /if \(hanhDong === 'bam_goi_nguoi_than' \|\| hanhDong === 'da_lo_chuyen'\) setDaHanhDong\(true\);/);
  const i = APP.indexOf('const handleSendSos = () => {');
  assert.match(APP.slice(i, i + 200), /setDaHanhDong\(true\)/, 'nhắn cho con cháu mà vẫn bị giục gọi');
});

test('§4.6 — lối ra "Tôi ổn" vẫn còn nguyên sau khi thêm bậc leo thang', () => {
  assert.ok(APP.includes("t('Tôi ổn, không có gì nguy hiểm')"));
});

// ── Màn phục hồi phải gọn (người dùng báo 22/9/2026) ─────────────────────

test('khối các bước phục hồi GẤP mặc định — mở ra mới thấy đủ', () => {
  assert.match(APP, /const \[moBuocPhucHoi, setMoBuocPhucHoi\] = useState\(false\);/,
    'khối phục hồi phải gấp lúc đầu: người vừa mất tiền cần MỘT việc (gọi ngân hàng), không cần đọc mười hai bước');
  assert.match(APP, /\{canRecovery && keHoachPhucHoi && !moBuocPhucHoi && \(/, 'thiếu nút mở khối khi đang gấp');
  assert.match(APP, /\{canRecovery && keHoachPhucHoi && moBuocPhucHoi && \(/, 'mở ra mà không thấy đủ bước là GIẤU, không phải GẤP');
});

test('luồng phục hồi KHÔNG có vòng "Dừng 60 giây" — khoảng dừng là để TRƯỚC khi chuyển tiền, không phải sau', () => {
  // 23/9/2026: thẻ này ẩn cả ở màn gấp (`heroGap`) — vòng đếm thành một dòng dưới nút chính.
  assert.match(APP, /relative overflow-hidden border border-white\/25 \$\{dangPhucHoi \|\| heroGap \? 'hidden' : ''\}/,
    'người vừa mất tiền mà thấy "dừng 60 giây" là bị bảo CHỜ, trong khi việc cần làm là gọi ngân hàng ngay');
});
