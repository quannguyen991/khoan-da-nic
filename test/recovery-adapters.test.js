'use strict';
/**
 * §2B.5 — BỘ THÍCH ỨNG PHỤC HỒI.
 *
 * Đây là màn người dùng đọc LÚC VỪA MẤT TIỀN — lúc dễ tin bất cứ ai hứa lấy lại
 * tiền nhất, và cũng là lúc kẻ lừa đảo thứ hai xuất hiện tự xưng bên thu hồi.
 * Nên mọi câu ở đây phải trung thực đến mức khô khan.
 */

const test = require('node:test');
const assert = require('node:assert');

const R = require('../src/analysis/recovery-adapters');

test('§2B.5 — nước ĐÃ DUYỆT có bước riêng, cộng bước chung', () => {
  const kh = R.layKeHoachPhucHoi('VN');
  assert.strictEqual(kh.daDuyet, true);
  assert.strictEqual(kh.maNuoc, 'VN');
  for (const b of R.BUOC_CHUNG) assert.ok(kh.buoc.includes(b), `thiếu bước chung ${b}`);
  assert.ok(kh.buoc.length > R.BUOC_CHUNG.length, 'VN phải có bước riêng');
});

test('§2B.5 — nước CHƯA DUYỆT rơi về bước chung, KHÔNG bịa bước riêng', () => {
  for (const n of ['ZZ', 'KP', 'khong-ton-tai', '']) {
    const kh = R.layKeHoachPhucHoi(n);
    assert.strictEqual(kh.daDuyet, false, `${n} không được coi là đã duyệt`);
    assert.deepStrictEqual(kh.buoc, [...R.BUOC_CHUNG], `${n} có bước riêng bịa ra`);
    assert.ok(kh.canhBao.includes('nuoc_chua_duoc_duyet_chi_co_buoc_chung'));
  }
});

test('§2B.5 — KHÔNG BỊA SỐ HOTLINE: sổ trống thì danh sách rỗng', () => {
  const kh = R.layKeHoachPhucHoi('VN');
  assert.deepStrictEqual(kh.hotline, [],
    'sổ tổ chức hiện chưa có mục nào được duyệt, nên hotline PHẢI rỗng');
  assert.ok(kh.canhBao.includes('chua_xac_minh_duoc_so_tong_dai_dung_so_in_sau_the'),
    '§9.6 — chưa xác minh được thì nói thẳng, bảo người dùng lấy số sau thẻ');
});

test('§2B.5 — mọi số hotline trả ra đều PHẢI kèm nguồn và ngày xác minh', () => {
  for (const h of R.layKeHoachPhucHoi('VN').hotline) {
    assert.ok(h.sourceUrl, `${h.id} thiếu sourceUrl`);
    assert.ok(h.verifiedAt, `${h.id} thiếu verifiedAt`);
  }
});

test('§11 — KHÔNG hứa lấy lại được tiền, ở bất kỳ mã bước nào', () => {
  for (const b of R.BUOC_CHUNG) {
    assert.ok(R.maBuocHopLe(b), `mã bước vi phạm §11: ${b}`);
  }
  // Chứng minh bộ lọc thật sự bắt được, không phải hàm rỗng.
  assert.strictEqual(R.maBuocHopLe('chung_toi_lay_lai_duoc_tien_cho_bac'), false);
  assert.strictEqual(R.maBuocHopLe('dam_bao_hoan_tien_100'), false);
});

test('§9.6 — bước đầu tiên là NGỪNG LIÊN LẠC, không phải gọi hotline', () => {
  // Gọi hotline trước khi cắt liên lạc thì kẻ lừa đảo vẫn đang dẫn dắt trên máy.
  assert.strictEqual(R.BUOC_CHUNG[0], 'ngung_moi_lien_lac_voi_ben_kia');
  assert.strictEqual(R.BUOC_CHUNG[1], 'khong_chuyen_them_bat_ky_khoan_nao');
});

test('§9.6 — có bước gọi ngân hàng bằng SỐ IN TRÊN THẺ, không phụ thuộc danh bạ', () => {
  // Số in trên thẻ luôn đúng, kể cả khi Khoan Đã chưa xác minh được hotline nào.
  assert.ok(R.BUOC_CHUNG.includes('goi_ngan_hang_bang_so_in_tren_the'));
});

test('Có bước cảnh giác với chính kẻ lừa đảo thứ hai', () => {
  // ID_RECOVERY_SUPPORT_IMPERSONATION — kẻ tự xưng bên hỗ trợ lấy lại tiền.
  assert.ok(R.BUOC_CHUNG.includes('canh_giac_voi_ben_hua_lay_lai_tien'));
});

test('Mọi bước là MÃ để frontend tra catalog, không phải câu tiếng Việt', () => {
  for (const b of R.layKeHoachPhucHoi('VN').buoc) {
    assert.match(b, /^[a-z][a-z0-9_]+$/, `không phải mã: ${b}`);
    assert.ok(!/[À-ỹ]/.test(b), `mã chứa dấu tiếng Việt: ${b}`);
  }
});

test('Hàm thuần: gọi hai lần ra y hệt', () => {
  assert.deepStrictEqual(R.layKeHoachPhucHoi('VN'), R.layKeHoachPhucHoi('VN'));
});
