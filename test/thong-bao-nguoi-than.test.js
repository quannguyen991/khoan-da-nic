'use strict';
/**
 * THÔNG BÁO GỬI NGƯỜI THÂN — tối giản, nói rõ cần làm gì, và nói đúng ai đã làm gì.
 *
 * Người dùng mô tả đúng thứ cần có (17/9/2026): người thân chỉ thấy mức rủi ro,
 * loại tình huống, bác đã làm gì, và cần gọi ngay hay có thể theo dõi. Không nội
 * dung tin nhắn, không OTP, không mật khẩu, không số tiền đầy đủ. Không ai gọi
 * tự động thay bác.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const CB = require('../backend/src/canh-bao-hai-phia');
const { taoVongTron, themThanhVien, datQuyTac, thuHoi } = require('../backend/src/trusted-circle');

const GOC = path.join(__dirname, '..');

function vongTron() {
  let vt = taoVongTron('bac');
  vt = themThanhVien(vt, { id: 'lan', vaiTro: 'nguoi_than_tin_cay', boiAi: 'bac' });
  vt = themThanhVien(vt, { id: 'minh', vaiTro: 'nguoi_du_phong', boiAi: 'bac' });
  vt = themThanhVien(vt, { id: 'hoa', vaiTro: 'nguoi_du_phong', boiAi: 'bac' });
  return datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: 'lan' }, 'bac');
}

const KQ = (nhan) => ({
  nhan, canThiep: nhan === 'CAO' ? 'PROTECTED_CRITICAL' : 'VERIFY_PATH',
  hoKichBan: 'gia_danh_cong_an', maGiaiThich: 'R1', maLyDo: ['ID_AUTHORITY_IMPERSONATION'],
  diem: 55, chuaKiem: [],
});

test('mức CAO → "gọi ngay"; NGHI_NGO → "theo dõi" — nói thành mã, không để đoán từ màu', () => {
  const cao = CB.pushNguoiThan(KQ('CAO'), { canhBaoId: 'a', thoiDiem: 1 });
  assert.strictEqual(cao.canLamGi, 'goi_ngay');
  assert.strictEqual(cao.maCauThongBao, 'dang_gap_rui_ro_cao_goi_ngay');
  assert.deepStrictEqual(cao.nguoiCaoTuoiDaLam, ['chua_thao_tac']);
  const ngo = CB.pushNguoiThan(KQ('NGHI_NGO'), { canhBaoId: 'b', thoiDiem: 1 });
  assert.strictEqual(ngo.canLamGi, 'theo_doi');
  assert.strictEqual(ngo.maCauThongBao, 'co_tin_nghi_ngo_theo_doi');
});

test('⚠️ người thân thấy ĐÚNG bốn thứ — không điểm số, không nội dung, kể cả khi bác bật chia sẻ', async () => {
  const kho = CB.taoKhoCanhBao();
  const ra = await CB.phatCanhBao({
    kq: KQ('CAO'), vongTron: vongTron(), kho,
    guiPush: async () => ({ endpointOk: true }),
    chiaSeNoiDung: true, noiDung: 'Bác đọc mã 889231 cho chú công an',
  });
  const xem = CB.tinhTrangChoNguoiThan(kho.lay(ra.canhBaoId));
  assert.deepStrictEqual(Object.keys(xem).sort(),
    ['canLamGi', 'canhBaoId', 'hoKichBan', 'maGiaiThich', 'nguoiCaoTuoiDaLam', 'nhan', 'thoiDiem'].sort());
  // Điểm số đã bị chặn bằng danh sách khoá chính xác ở trên; ở đây canh nội dung.
  assert.ok(!JSON.stringify(xem).includes('889231'), 'lộ nội dung tin nhắn');
  assert.strictEqual(xem.hoKichBan, 'gia_danh_cong_an');
});

test('bác bấm gọi / bấm "Tôi ổn" thì người thân thấy đúng việc đó — và KHÔNG tính là người thân đã gọi', async () => {
  const kho = CB.taoKhoCanhBao();
  const { canhBaoId } = await CB.phatCanhBao({
    kq: KQ('CAO'), vongTron: vongTron(), kho, guiPush: async () => ({ endpointOk: true }),
  });
  CB.ghiNhanBacGoi(kho, canhBaoId, 10);
  CB.ghiNhanToiOn(kho, canhBaoId, 20);
  const ghi = kho.lay(canhBaoId);
  assert.deepStrictEqual(CB.tinhTrangChoNguoiThan(ghi).nguoiCaoTuoiDaLam, ['da_bam_goi_nguoi_than', 'da_bam_toi_on']);
  assert.strictEqual(ghi.nguoiThanDaBamGoi, false, 'bác bấm gọi bị ghi thành người thân đã gọi');
  assert.strictEqual(CB.tongHop([ghi]).daBamGoi, 0);
});

test('đường dự phòng báo đúng người dự phòng — bỏ người đã nhận đầu, bỏ người bị thu hồi', () => {
  const vt = thuHoi(vongTron(), 'hoa', 'bac');
  const ban = { id: 'x', nhan: 'CAO', thoiDiem: 0, nguoiThanDaDay: true, nguoiThanDaMo: false, nguoiThanId: 'lan' };
  const kq = CB.canDuongDuPhong(ban, CB.HAN_XAC_NHAN_MS + 1, vt);
  assert.deepStrictEqual(kq.nguoiDuPhongIds, ['minh']);
  assert.ok(kq.daCam.includes('tu_dong_goi_thay_nguoi_dung'), 'người dùng chốt bỏ gọi tự động');
  assert.deepStrictEqual(CB.canDuongDuPhong(ban, CB.HAN_XAC_NHAN_MS + 1).nguoiDuPhongIds, [], 'không có vòng tròn thì danh sách rỗng, không ném');
});

test('mọi mã thông báo người thân có câu ở CẢ HAI ngôn ngữ trong catalog', () => {
  const cat = fs.readFileSync(path.join(GOC, 'src', 'catalog.ts'), 'utf8');
  const khoi = cat.slice(cat.indexOf('export const THONG_BAO_NGUOI_THAN'), cat.indexOf('// ═══════════════ Theo dõi 72 giờ'));
  const push = CB.pushNguoiThan(KQ('CAO'), { canhBaoId: 'a', thoiDiem: 1 });
  const ngo = CB.pushNguoiThan(KQ('NGHI_NGO'), { canhBaoId: 'b', thoiDiem: 1 });
  const ma = new Set([push.maCauThongBao, ngo.maCauThongBao, push.canLamGi, ngo.canLamGi,
    'chua_thao_tac', 'da_bam_goi_nguoi_than', 'da_bam_toi_on']);
  for (const m of ma) assert.match(khoi, new RegExp(`\\b${m}:\\s*c\\(`), `thiếu câu cho mã ${m}`);
});

test('giao diện bác gửi "bac-goi", máy chủ có đường cho nó — không dùng lẫn "goi" của người thân', () => {
  const thuDong = fs.readFileSync(path.join(GOC, 'src', 'canh-bao-thu-dong.ts'), 'utf8');
  assert.match(thuDong, /ghiHanhDong\('bac-goi'\)/);
  assert.ok(!/ghiHanhDong\('goi'\)/.test(thuDong), 'màn của bác vẫn gửi mã của người thân');
  const may = fs.readFileSync(path.join(GOC, 'backend', 'server.js'), 'utf8');
  assert.match(may, /case 'bac-goi':\s*return res\.json\(CB\.ghiNhanBacGoi/);
});
