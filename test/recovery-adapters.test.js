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

const R = require('../backend/src/analysis/recovery-adapters');

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
  // Sổ thật đã có mục duyệt từ 23/9/2026 — ca "sổ trống" giờ dựng bằng một tệp tạm.
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const tam = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'so-trong-')), 'support-directory.json');
  fs.writeFileSync(tam, JSON.stringify({ institutions: [] }));
  const kh = R.layKeHoachPhucHoi('VN', tam);
  assert.deepStrictEqual(kh.hotline, [], 'sổ không có mục nào được duyệt ⇒ hotline PHẢI rỗng');
  assert.ok(kh.canhBao.includes('chua_xac_minh_duoc_so_tong_dai_dung_so_in_sau_the'),
    '§9.6 — chưa xác minh được thì nói thẳng, bảo người dùng lấy số sau thẻ');
});

test('§2B.5 — sổ thật: MỖI số trả ra đều đúng là số của một mục đã duyệt, có tên người duyệt', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const so = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'config', 'support-directory.json'), 'utf8'));
  const daDuyet = new Map(so.institutions
    .filter((m) => m.reviewStatus === 'approved' && String(m.reviewedBy || '').trim())
    .map((m) => [m.id, m.officialPhoneNumbers]));
  const kh = R.layKeHoachPhucHoi('VN');
  for (const h of kh.hotline) {
    assert.ok(daDuyet.has(h.id), `${h.id} không phải mục đã duyệt có người đứng tên`);
    assert.deepStrictEqual(h.officialPhoneNumbers, daDuyet.get(h.id), `${h.id}: số trả ra khác số đã duyệt`);
  }
  // Mục chờ duyệt không bao giờ mang số (số chỉ lên đĩa cùng tên người duyệt).
  for (const m of so._cho_duyet || []) assert.deepStrictEqual(m.officialPhoneNumbers || [], [], `${m.id} chờ duyệt mà đã có số`);
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

test('§2B.5 — VN có bước trình báo qua VNeID, KHÔNG chỉ "báo công an" chung chung', () => {
  // Nghiên cứu 3/9/2026: VNeID có quy trình 5 bước cụ thể (mở mục phản ánh →
  // tạo yêu cầu → điền thông tin → đính kèm ảnh → gửi), theo dõi được tiến độ.
  // "Báo công an" mà không nói bằng kênh nào là lời khuyên suông.
  const kh = R.layKeHoachPhucHoi('VN');
  assert.ok(R.THEO_NUOC.VN.buocRieng.includes('to_giac_qua_vneid_5_buoc'),
    'thiếu bước trình báo qua VNeID trong bước riêng của VN');
  assert.ok(kh.buoc.includes('to_giac_qua_vneid_5_buoc'));
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
