'use strict';
/**
 * §6.11 — BỘ NHỚ VỤ VIỆC. Ba ràng buộc phải giữ:
 *  1. ghép hồ sơ là hàm XÁC ĐỊNH, KHÔNG do AI quyết định
 *  2. HỎI LẠI người dùng trước khi gộp
 *  3. CASE_* CHỈ tính SAU KHI người dùng xác nhận gộp (Phụ lục A.8)
 */

const test = require('node:test');
const assert = require('node:assert');

const J = require('../src/journey-engine');
const { trichThucThe, thucTheTrung } = require('../src/analysis/entity-extractor');

const NGAY = 24 * 60 * 60 * 1000;
const T0 = 1_760_000_000_000;   // mốc thời gian cố định, không đọc đồng hồ

// ─────────── Trích thực thể ───────────

test('§6.11 — trích đủ bảy loại thực thể', () => {
  const e = trichThucThe(
    'Tôi là công an. Bác cài AnyDesk rồi chuyển 50 triệu vào số tài khoản '
    + '1902345678901 tại vietcombank. Gọi lại 0912345678 hoặc vào https://vcb-secure.tk',
  );
  assert.ok(e.toChuc.includes('cong_an'));
  assert.ok(e.toChuc.includes('ngan_hang'));
  assert.ok(e.app.includes('anydesk'));
  assert.ok(e.soTaiKhoan.includes('1902345678901'));
  assert.ok(e.dienThoai.includes('0912345678'));
  assert.ok(e.tenMien.includes('vcb-secure.tk'));
  assert.ok(e.hanhDong.includes('chuyen_tien'));
  assert.ok(e.hanhDong.includes('cai_app'));
});

test('§6.11 — số điện thoại KHÔNG bị nhận nhầm thành số tài khoản', () => {
  const e = trichThucThe('Gọi 0912345678 nhé');
  assert.ok(e.dienThoai.includes('0912345678'));
  assert.strictEqual(e.soTaiKhoan.length, 0, 'gộp hai loại là ghép hồ sơ sai');
});

test('§6.11 — hàm thuần: cùng đầu vào ra cùng kết quả', () => {
  const t = 'Tôi là công an, chuyển 50 triệu vào 1902345678901.';
  assert.deepStrictEqual(trichThucThe(t), trichThucThe(t));
});

test('§6.11 — soTien và hanhDong KHÔNG dùng để ghép hồ sơ', () => {
  // Hai vụ hoàn toàn khác nhau nhưng cùng nhắc "5 triệu" và cùng đòi chuyển tiền.
  const a = trichThucThe('Chuyển 5 triệu vào 1111111111111 nhé');
  const b = trichThucThe('Chuyển 5 triệu vào 2222222222222 nhé');
  assert.deepStrictEqual(thucTheTrung(a, b), [], 'trùng số tiền không phải cùng một vụ');
});

test('§6.11 — trùng một thực thể thật thì nhận ra', () => {
  const a = trichThucThe('Gọi 0912345678');
  const b = trichThucThe('Số 0912345678 lại nhắn tiếp');
  const trung = thucTheTrung(a, b);
  assert.strictEqual(trung.length, 1);
  assert.strictEqual(trung[0].truong, 'dienThoai');
});

// ─────────── Ghép hồ sơ ───────────

const hoSo = (ghiDe = {}) => ({
  id: 'hs-1',
  capNhatLuc: T0,
  thucThe: trichThucThe('Gọi 0912345678, tôi là công an'),
  suKien: [{ kenh: 'goi_dien', giaiDoan: 'tao_long_tin' }],
  dong: false,
  ...ghiDe,
});

test('§6.11 — trùng ít nhất MỘT thực thể trong 14 ngày thì thành ứng viên', () => {
  const sk = J.taoSuKien({ vanBan: 'Số 0912345678 nhắn tiếp', thoiDiem: T0 + 3 * NGAY });
  const uv = J.timHoSoCoTheGop(sk, [hoSo()], T0 + 3 * NGAY);
  assert.ok(uv);
  assert.strictEqual(uv.hoSo.id, 'hs-1');
});

test('§6.11 — quá cửa sổ 14 ngày thì KHÔNG ghép', () => {
  const sk = J.taoSuKien({ vanBan: 'Số 0912345678 nhắn tiếp', thoiDiem: T0 + 15 * NGAY });
  assert.strictEqual(J.timHoSoCoTheGop(sk, [hoSo()], T0 + 15 * NGAY), null);
});

test('§6.11 — không trùng thực thể nào thì KHÔNG ghép', () => {
  const sk = J.taoSuKien({ vanBan: 'Số 0987654321 nhắn', thoiDiem: T0 + NGAY });
  assert.strictEqual(J.timHoSoCoTheGop(sk, [hoSo()], T0 + NGAY), null);
});

test('§6.11 — hồ sơ đã đóng không nhận thêm', () => {
  const sk = J.taoSuKien({ vanBan: 'Số 0912345678 nhắn tiếp', thoiDiem: T0 + NGAY });
  assert.strictEqual(J.timHoSoCoTheGop(sk, [hoSo({ dong: true })], T0 + NGAY), null);
});

test('§6.11 — hàm ghép XÁC ĐỊNH, gọi hai lần ra y hệt', () => {
  const sk = J.taoSuKien({ vanBan: 'Số 0912345678', thoiDiem: T0 + NGAY });
  const ds = [hoSo()];
  assert.deepStrictEqual(J.timHoSoCoTheGop(sk, ds, T0 + NGAY), J.timHoSoCoTheGop(sk, ds, T0 + NGAY));
});

// ─────────── Hỏi trước khi gộp ───────────

test('§6.11 — HỎI LẠI trước khi gộp, kèm lý do vì sao nghi là cùng vụ', () => {
  const sk = J.taoSuKien({ vanBan: 'Số 0912345678 nhắn tiếp', thoiDiem: T0 + NGAY });
  const ch = J.dungCauHoiGop(J.timHoSoCoTheGop(sk, [hoSo()], T0 + NGAY));
  assert.strictEqual(ch.canHoi, true);
  assert.match(ch.maCauHoi, /^[a-z][a-z0-9_]+$/, 'phải là MÃ để frontend tra catalog');
  assert.ok(ch.viSao.length > 0, 'phải nói vì sao nghi là cùng vụ');
});

test('§6.11 — không có ứng viên thì không hỏi', () => {
  assert.strictEqual(J.dungCauHoiGop(null).canHoi, false);
});

// ─────────── A.8 — CASE_* chỉ tính SAU khi xác nhận ───────────

const hsHaiSuKien = () => ({
  ...hoSo(),
  suKien: [
    { kenh: 'goi_dien', giaiDoan: 'tao_long_tin' },
    { kenh: 'goi_dien', giaiDoan: 'gay_ap_luc' },
  ],
});

test('A.8 — CHƯA xác nhận gộp thì KHÔNG sinh tín hiệu CASE_* nào', () => {
  const sk = { kenh: 'zalo', giaiDoan: 'doi_hanh_dong' };
  assert.deepStrictEqual(J.tinHieuCase(hsHaiSuKien(), sk, { daXacNhanGop: false }), []);
  assert.deepStrictEqual(J.tinHieuCase(hsHaiSuKien(), sk, {}), [],
    'thiếu cờ xác nhận cũng phải là rỗng');
});

test('A.8 — ĐÃ xác nhận gộp thì sinh đúng tín hiệu CASE_*', () => {
  const sk = { kenh: 'zalo', giaiDoan: 'doi_hanh_dong' };
  const ids = J.tinHieuCase(hsHaiSuKien(), sk, { daXacNhanGop: true }).map((s) => s.id);
  assert.ok(ids.includes('CASE_MULTI_CHANNEL_ESCALATION'), 'gọi điện → zalo là đổi kênh');
  assert.ok(ids.includes('CASE_STAGE_ESCALATION'), 'gây áp lực → đòi hành động là leo thang');
  assert.ok(ids.includes('CASE_REPEATED_CONTACT'));
});

test('A.8 — cùng kênh thì KHÔNG bật CASE_MULTI_CHANNEL_ESCALATION', () => {
  const ids = J.tinHieuCase(hsHaiSuKien(), { kenh: 'goi_dien', giaiDoan: 'doi_hanh_dong' },
    { daXacNhanGop: true }).map((s) => s.id);
  assert.ok(!ids.includes('CASE_MULTI_CHANNEL_ESCALATION'));
});

test('A.8 — giai đoạn đi LÙI thì không tính là leo thang', () => {
  const ids = J.tinHieuCase(hsHaiSuKien(), { kenh: 'goi_dien', giaiDoan: 'tiep_can' },
    { daXacNhanGop: true }).map((s) => s.id);
  assert.ok(!ids.includes('CASE_STAGE_ESCALATION'));
});

test('A.8 — tín hiệu CASE_* mang evidence và source deterministic', () => {
  for (const s of J.tinHieuCase(hsHaiSuKien(), { kenh: 'zalo', giaiDoan: 'doi_hanh_dong' },
    { daXacNhanGop: true })) {
    assert.strictEqual(s.state, 'present');
    assert.strictEqual(s.source, 'deterministic-context');
    assert.ok(s.evidence[0].quote);
  }
});

// ─────────── Giai đoạn ───────────

test('§2B.2 — đúng tám giai đoạn', () => {
  assert.strictEqual(J.GIAI_DOAN.length, 8);
});

test('Suy giai đoạn từ tín hiệu, theo bảng TĨNH', () => {
  assert.strictEqual(J.suyGiaiDoan(['ID_AUTHORITY_IMPERSONATION']), 'tao_long_tin');
  assert.strictEqual(J.suyGiaiDoan(['MAN_FEAR_THREAT']), 'gay_ap_luc');
  assert.strictEqual(J.suyGiaiDoan(['MAN_SECRECY']), 'co_lap');
  assert.strictEqual(J.suyGiaiDoan(['FIN_TRANSFER_REQUEST']), 'doi_hanh_dong');
  assert.strictEqual(J.suyGiaiDoan([]), 'tiep_can');
  assert.strictEqual(J.suyGiaiDoan(['FIN_RECOVERY_FEE']), 'phuc_hoi');
  assert.strictEqual(J.suyGiaiDoan(['MAN_URGENCY'], { daMatTien: true }), 'phuc_hoi');
});

// ─────────── §6.11 — ba lớp ───────────

test('§6.11 — hiển thị rõ BA LỚP: biết chắc · nghi ngờ · cần xác minh thêm', () => {
  const bl = J.baLop(hsHaiSuKien(), {
    daKiem: ['van_ban'], maLyDo: ['FIN_SAFE_ACCOUNT'],
    chuaKiem: ['chua_nghe_duoc_cuoc_goi'], overrides: ['CO-03'],
  });
  assert.ok(bl.bietChac.some((x) => x.startsWith('da_doc_duoc:')));
  assert.ok(bl.bietChac.some((x) => x.startsWith('quy_tac_khan_cap:')));
  assert.ok(bl.nghiNgo.some((x) => x.startsWith('dau_hieu:')));
  assert.ok(bl.canXacMinhThem.some((x) => x.startsWith('chua_kiem:')));
  for (const x of [...bl.bietChac, ...bl.nghiNgo, ...bl.canXacMinhThem]) {
    assert.ok(!/[À-ỹ]/.test(x), `phải là MÃ, không phải câu tiếng Việt: ${x}`);
  }
});

test('§4.2 — journey-engine KHÔNG import bộ luật, không tự tính điểm', () => {
  const nguon = require('node:fs').readFileSync(require.resolve('../src/journey-engine'), 'utf8');
  assert.ok(!nguon.includes('decision-engine'));
  assert.ok(!/riskScore|riskLabel/.test(nguon));
});
