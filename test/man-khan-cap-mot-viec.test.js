'use strict';
/**
 * PHẦN 1 "CẦU DAO GIA ĐÌNH" — MÀN KHẨN CẤP CHỈ CÓ MỘT VIỆC (23/9/2026).
 *
 * Người dùng báo: "trong trường hợp hoảng loạn mà cho 1 đống chữ thì ai thèm đọc".
 * Đo trước khi sửa (375×812, PROTECTED_CRITICAL): nút gọi con ở y=716–805 trên
 * màn cao 812, giữa màn là khối "CHƯA kiểm được" 25px, và máy chỉ đọc to khi
 * bác BẤM nút.
 *
 * ⚠️ Test đọc mã nguồn. Đo hình học làm trên trình duyệt — xem Task 6 của
 * `docs/superpowers/plans/2026-09-23-phan-1-man-khan-cap-mot-viec.md`.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => {
  const f = path.join(GOC, ...p);
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
};
const APP = doc('src', 'App.tsx');
const HOOK = doc('src', 'lib', 'doc-to-mot-lan.ts');

test('hook đọc to: một lần mỗi lượt, không gọi mạng, chỉ nói', () => {
  assert.ok(HOOK.length > 0, 'chưa có src/lib/doc-to-mot-lan.ts');
  assert.match(HOOK, /useRef\(false\)/, 'phải có cờ "đã đọc" để không đọc lặp mỗi lần dựng lại');
  assert.match(HOOK, /docTo\(/, 'phải đi qua docTo() — speechSynthesis trần hỏng im lặng trong WebView');
  const khongChuThich = HOOK.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/fetch\(|window\.open|tel:|sms:/.test(khongChuThich), 'hook đọc to chỉ được NÓI, không làm gì khác (§12)');
});

test('màn gấp có biến heroGap: gấp + có kết quả + chưa ở luồng phục hồi', () => {
  assert.match(APP, /const heroGap = manGapGap && !khongGoiDuoc && !dangPhucHoi;/);
});

test('thứ tự trên màn gấp: câu lệnh → nút chính → (dòng AI, lý do, "chưa kiểm được")', () => {
  const iLenh = APP.indexOf('data-vai-tro="cau-lenh"');
  const iNut = APP.indexOf('{nutHanhDongGap}');
  const iAi = APP.indexOf("t('AI đã trích ra các dấu hiệu. Mức rủi ro là do bộ luật cố định quyết định.')");
  const iChuaKiem = APP.indexOf("t('Những thứ cháu CHƯA kiểm được')");
  assert.ok(iLenh > 0 && iNut > 0 && iAi > 0 && iChuaKiem > 0, 'thiếu một mốc — đổi chữ thì sửa cả test');
  assert.ok(iLenh < iNut, 'câu lệnh phải đứng ngay trên nút');
  assert.ok(iNut < iAi && iNut < iChuaKiem, 'nút chính phải đứng TRƯỚC mọi khối chữ giải thích — hành động trước, chữ sau');
});

test('câu lệnh là câu ngắn đã kiểm đếm chữ, không phải câu dài', () => {
  assert.match(APP, /const cauLenh = cauLenhNgan\(viecAnToan, Boolean\(firstContact\.phone\)\);/);
  const i = APP.indexOf('data-vai-tro="cau-lenh"');
  assert.ok(i > 0);
  assert.match(APP.slice(i, i + 300), /\{t\(cauLenh\)\}/);
});

test('màn gấp tự đọc to câu lệnh một lần', () => {
  // Phần 2: thêm điều kiện "chưa có lời nhắn của con" — vẫn phải bắt đầu bằng heroGap.
  assert.match(APP, /useDocToMotLan\(cauTuDoc, heroGap\b/);
});

test('chưa có số người thân: nút chính là 113, 156 KHÔNG nằm ở khối chính', () => {
  const i = APP.indexOf('const nutHanhDongGap');
  assert.ok(i > 0, 'chưa có nutHanhDongGap');
  const khoi = APP.slice(i, APP.indexOf(');', APP.indexOf('</a>', i)) + 2);
  assert.match(khoi, /soCongAn/, 'nút chính khi chưa có số phải là Cảnh sát 113');
  assert.ok(!/soBaoLuaDao/.test(khoi), '156 là tổng đài phản ánh, không cứu được tiền lúc đó — nó thuộc "Xem thêm"');
});

test('"Con bảo không sao" chỉ ghi lại và về trang chủ — KHÔNG hạ nhãn (§4.2)', () => {
  const i = APP.indexOf("t('Con bảo không sao')");
  assert.ok(i > 0, 'chưa có nút "Con bảo không sao"');
  const khoi = APP.slice(APP.lastIndexOf('<button', i), i);
  assert.match(khoi, /ghiHanhDong\('con_bao_khong_sao'\); setView\('home'\);/);
  assert.ok(!/setAnalyzeResult|nhan:|riskLabel/.test(khoi));
});

test('bấm gọi người thân mở câu hỏi "Con bảo sao?"', () => {
  const i = APP.indexOf('const handleCallRelative = () => {');
  assert.match(APP.slice(i, i + 400), /setDaBamGoi\(true\)/);
});

test('hai mã hành động mới có trong kiểu HanhDong', () => {
  const lib = doc('src', 'lib', 'ket-qua-can-thiep.ts');
  assert.match(lib, /'con_bao_lua_dao'/);
  assert.match(lib, /'con_bao_khong_sao'/);
});

// ── Màn "Đang bị ai gọi?" (HoiNhanh) ─────────────────────────────────────────
const HOI = doc('src', 'components', 'HoiNhanh.tsx');

test('hỏi nhanh: chọn "Đưa mã OTP" là thấy ngay "đừng đọc mã" — không đợi hỏi xong', () => {
  assert.match(HOI, /doi_otp: 'Dù thế nào: đừng đọc mã cho ai\.'/);
  assert.match(HOI, /cai_ung_dung: 'Đừng cài gì trong lúc đang gọi\.'/);
  assert.match(HOI, /chuyen_tien: 'Chưa chuyển gì cả\.'/);
  const iDan = HOI.indexOf('DAN_NGAY_CUA_NHANH[selectedBranch]');
  const iCau = HOI.indexOf("chu('tro_ly_hoi')");
  assert.ok(iDan > 0 && iDan < iCau, 'câu dặn phải đứng TRÊN câu hỏi');
});

test('hỏi nhanh: màn kết quả có nút gọi con cháu, và không còn hứa "Cúp máy & dừng 60 giây"', () => {
  assert.match(HOI, /t\('GỌI NGAY CHO CON CHÁU'\)/);
  // Soát MÃ, bỏ chú thích: chú thích được phép kể lại chữ cũ để giải thích vì sao bỏ.
  const maKhongChuThich = HOI.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!/Cúp máy & dừng 60 giây|Hang up & pause 60 seconds/.test(maKhongChuThich),
    'app không cúp máy được — nút không được hứa việc đó');
  assert.match(HOI, /t\('Tôi đã cúp máy'\)/);
});

test('hỏi nhanh: §HĐ luật 3 — "chưa kiểm được" cùng cỡ chữ với nhãn', () => {
  const m = /<h2\s+className="text-\[(\d+)px\] font-black text-white/.exec(HOI);
  assert.ok(m, 'không đọc được cỡ chữ nhãn của màn kết quả');
  const coNhan = Number(m[1]);
  const i = HOI.indexOf("'Những thứ cháu CHƯA kiểm được'");
  assert.ok(i > 0);
  const khoi = HOI.slice(HOI.lastIndexOf('{chuaKiem.length > 0 && (', i), HOI.indexOf('</ul>', i));
  const coChu = [...khoi.matchAll(/text-\[(\d+)px\]/g)].map((x) => Number(x[1]));
  assert.ok(coChu.length >= 2, 'khối phải khai cỡ chữ cho cả tiêu đề lẫn từng dòng');
  assert.deepStrictEqual(coChu.filter((c) => c < coNhan), [], `nhãn ${coNhan}px mà "chưa kiểm được" có ${coChu.join(', ')}px`);
});

test('hỏi nhanh: kết quả CAO tự đọc to một lần; hook gọi ở ĐẦU component, không trong nhánh if', () => {
  const iHook = HOI.indexOf('useDocToMotLan(');
  const iIf = HOI.indexOf('if (result) {');
  assert.ok(iHook > 0 && iHook < iIf, 'hook đặt trong nhánh if là phá luật hook của React');
});

test('hỏi nhanh: nút gọi con đứng TRƯỚC danh sách lý do và khối "chưa kiểm được"', () => {
  const iNut = HOI.indexOf("t('GỌI NGAY CHO CON CHÁU')");
  const iLyDo = HOI.indexOf('{lyDo.length > 0 && (');
  const iChuaKiem = HOI.indexOf('{chuaKiem.length > 0 && (');
  assert.ok(iNut > 0 && iNut < iLyDo && iNut < iChuaKiem, 'hành động trước, chữ sau');
});

// ── Màn giới thiệu (§11) ───────────────────────────────────────────────────────
/*
 * Đo 23/9/2026: KHOÁ trong mã là "AI thông minh kiểm tra cuộc gọi, … giao dịch
 * lạ" — nói quá (app không nghe được cuộc gọi, không thấy giao dịch). Chữ HIỆN RA
 * đã được sửa đúng ở catalog từ trước, nên người dùng không thấy câu đó; nhưng
 * thiếu một dòng dịch là nó lộ nguyên ra màn. Khoá phải nói đúng như chữ hiện.
 */
test('§11 — khoá câu ở màn giới thiệu không hứa "kiểm tra cuộc gọi" hay "giao dịch"', () => {
  assert.ok(!/t\("AI thông minh kiểm tra cuộc gọi/.test(APP), 'khoá nói quá vẫn còn trong mã');
  assert.match(APP, /t\("AI đọc tin nhắn, đường link và ảnh bác gửi để tìm dấu hiệu\. Bộ luật cố định mới quyết mức rủi ro\."\)/);
  const I18N = doc('src', 'i18n.ts');
  assert.ok(!I18N.includes('"AI thông minh kiểm tra cuộc gọi'), 'khoá cũ còn nằm trong catalog');
});
