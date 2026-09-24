'use strict';
/**
 * §6.11 — BỘ NHỚ VỤ VIỆC, NỐI VÀO GIAO DIỆN — 24/9/2026.
 *
 * Trước ngày này: máy chủ có `/api/vu-viec/ung-vien` và `/gop` nhưng giao diện
 * KHÔNG gọi tới; và chính `/gop` có hai lỗi đo được:
 *   · tín hiệu CASE_* đi qua `llmSignals` ⇒ bị cổng "câu trích phải có trong văn
 *     bản" vứt hết — đường gộp vụ chưa từng cộng được điểm nào;
 *   · `llmSignals` là mảng ⇒ lượt đó tự khai `aiDaChay: true` khi AI không chạy.
 * Test cũ (`api-vu-viec.test.js`) chỉ kiểm tên mã có trong danh sách, không kiểm
 * mã đó có được TÍNH không — nên cả hai lỗi lọt.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');
const { tinHieuMangTheo, locHoSo } = require('../backend/src/journey-engine');

async function moMayChu() {
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (duong, body) => {
    const r = await fetch(goc + duong, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return { s: r.status, j: await r.json() };
  };
  return { sv, goi };
}

const TIN_1 = 'Tôi là cán bộ công an quận, số 0912345678. Bác liên quan vụ án rửa tiền, không được nói với ai.';
const TIN_2 = 'Bác chuyển 50 triệu vào tài khoản này để xác minh, gọi lại số 0912345678 khi xong.';

test('kịch bản hai tin: TÁCH RIÊNG thì tin sau "chưa thấy", GỘP (đã xác nhận) thì CAO', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const a1 = (await goi('/api/analyze/so-bo', { vanBan: TIN_1 })).j;
    const u1 = (await goi('/api/vu-viec/ung-vien', { vanBan: TIN_1, maLyDo: a1.maLyDo, hoSoDangMo: [] })).j;
    const hoSo = { id: 'hs-1', capNhatLuc: Date.now(), thucThe: u1.suKien.thucThe, suKien: [u1.suKien] };

    const a2 = (await goi('/api/analyze/so-bo', { vanBan: TIN_2 })).j;
    assert.strictEqual(a2.nhan, 'CHUA_THAY', 'tiền đề: tin sau một mình không đủ');

    const u2 = (await goi('/api/vu-viec/ung-vien', { vanBan: TIN_2, maLyDo: a2.maLyDo, hoSoDangMo: [hoSo] })).j;
    assert.strictEqual(u2.cauHoiGop.canHoi, true);
    assert.ok(u2.cauHoiGop.viSao.some((v) => v.truong === 'dienThoai'), 'phải nói trùng số điện thoại');

    const g = (await goi('/api/vu-viec/gop', { vanBan: TIN_2, maLyDo: a2.maLyDo, hoSo, daXacNhanGop: true, kenh: 'goi_dien' })).j;
    assert.strictEqual(g.nhan, 'CAO', `gộp vụ mà vẫn ${g.nhan} [${g.maLyDo}]`);
    // Dấu hiệu của tin trước được xét cùng — và CO-05 (giữ bí mật + doạ + chuyển tiền) nổ.
    for (const m of ['ID_AUTHORITY_IMPERSONATION', 'MAN_FEAR_THREAT', 'MAN_SECRECY']) assert.ok(g.maLyDo.includes(m), `thiếu ${m}`);
    assert.strictEqual(g.canThiep, 'PROTECTED_CRITICAL');
  } finally { sv.close(); }
});

test('/gop: CASE_* được TÍNH (có trong maLyDo), và aiDaChay nói THẬT là false', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const hoSo = {
      id: 'hs-2', capNhatLuc: Date.now(), thucThe: { dienThoai: ['0912345678'] },
      suKien: [{ thoiDiem: Date.now() - 1000, kenh: 'sms', giaiDoan: 'tao_long_tin', maLyDo: [] }],
    };
    const g = (await goi('/api/vu-viec/gop', { vanBan: TIN_2, hoSo, daXacNhanGop: true, kenh: 'goi_dien' })).j;
    assert.ok(g.tinHieuVuViec.includes('CASE_MULTI_CHANNEL_ESCALATION'));
    assert.ok(g.maLyDo.includes('CASE_MULTI_CHANNEL_ESCALATION'), 'CASE_* bị vứt — không được tính điểm');
    assert.strictEqual(g.aiDaChay, false, 'lượt gộp không gọi AI mà tự khai đã chạy');
  } finally { sv.close(); }
});

test('/gop: CHƯA xác nhận thì không mang theo gì (Phụ lục A.8)', () => {
  assert.deepStrictEqual(tinHieuMangTheo({ suKien: [{ maLyDo: ['FIN_SAFE_ACCOUNT'] }] }, [], {}), []);
  const co = tinHieuMangTheo({ suKien: [{ maLyDo: ['FIN_SAFE_ACCOUNT', 'CASE_REPEATED_CONTACT'] }] }, ['MAN_URGENCY'], { daXacNhanGop: true });
  assert.deepStrictEqual(co.map((s) => s.id).sort(), ['FIN_SAFE_ACCOUNT', 'MAN_URGENCY'], 'CASE_* của tin trước không được mang theo');
});

test('hồ sơ do máy gửi lên được LỌC: mã lạ bị bỏ, giai đoạn lạ về "tiep_can", tối đa 30 sự kiện', () => {
  const laMa = (m) => m.startsWith('FIN_') || m.startsWith('ID_');
  const h = locHoSo({
    id: 'x', capNhatLuc: 5, thucThe: {},
    suKien: Array.from({ length: 40 }, () => ({ thoiDiem: 1, giaiDoan: 'bịa', maLyDo: ['FIN_SAFE_ACCOUNT', 'MA_BIA', '<script>'] })),
  }, laMa);
  assert.strictEqual(h.suKien.length, 30);
  assert.deepStrictEqual(h.suKien[0].maLyDo, ['FIN_SAFE_ACCOUNT']);
  assert.strictEqual(h.suKien[0].giaiDoan, 'tiep_can');
  assert.strictEqual(locHoSo(null), null);
});

// ── Giao diện ───────────────────────────────────────────────────────────────

const LIB = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'vu-viec.ts'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8');

test('giao diện GỌI bộ nhớ vụ việc sau mỗi lượt kiểm chữ, và KHÔNG chặn kết quả chính', () => {
  assert.match(APP, /void kiemVuViec\(text, finalResult\)\.then\(\(cau\) => setCauHoiVuViec\(cau\)\);/);
  // Chạy SAU setAnalyzeResult — kết quả chính hiện trước.
  const i = APP.indexOf('setAnalyzeResult(finalResult);');
  const j = APP.indexOf('void kiemVuViec(text, finalResult)');
  assert.ok(i > 0 && j > i, 'bộ nhớ vụ việc phải chạy sau khi kết quả đã hiện');
  assert.match(APP, /cauHoiVuViec=\{cauHoiVuViec\}/);
});

test('§6.11 — KHÔNG TỰ GỘP: chỉ /gop sau khi bác bấm "Đúng", và gửi daXacNhanGop: true', () => {
  assert.match(APP, /if \(!dung\) \{ khongGopVuViec\(cau\); return; \}/);
  assert.match(LIB, /daXacNhanGop: true/);
  const iKiem = LIB.indexOf('export async function kiemVuViec');
  const than = LIB.slice(iKiem, LIB.indexOf('export async function gopVuViec'));
  assert.ok(!than.includes('/api/vu-viec/gop'), 'kiemVuViec không được tự gộp');
});

test('§4.2 — ghép kết quả CHỈ LÀM TĂNG; aiDaChay / chuaKiem giữ của lượt gốc', () => {
  const i = LIB.indexOf('export function ghepKetQuaVuViec');
  const than = LIB.slice(i);
  assert.match(than, /if \(!cao\) return \{ \.\.\.goc, daXetCaVu: ngayVuCu \};/);
  assert.ok(!/aiDaChay:\s*gop/.test(than) && !/chuaKiem:\s*gop/.test(than), 'không được lấy aiDaChay / chuaKiem của lượt gộp');
});

test('§6.9 — hồ sơ trên máy KHÔNG lưu nội dung tin', () => {
  const i = LIB.indexOf('export function ghiSuKien');
  const than = LIB.slice(i, LIB.indexOf('export function xoaHoSoVuViec'));
  assert.ok(!/vanBan/.test(than), 'ghiSuKien không được chạm vào nội dung tin');
  assert.match(LIB, /const CUA_SO_MS = 14 \* 24 \* 60 \* 60 \* 1000;/);
});

test('chỉ hỏi khi trùng số điện thoại / tài khoản / tên miền — không hỏi vì cùng nhắc "công an"', () => {
  assert.match(LIB, /\['dienThoai', 'soTaiKhoan', 'tenMien'\]\.includes\(x\.truong\)/);
});
