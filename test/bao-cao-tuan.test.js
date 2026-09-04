'use strict';
/**
 * BÁO CÁO TUẦN — hàng rào cho câu nguy hiểm nhất của cả tính năng:
 * "Tuần này không có gì đáng ngại."
 *
 * Nó chỉ đúng khi CẢ TUẦN thật sự được canh. Một tuần mù cũng "không có sự
 * kiện nào" — và nói hai thứ đó bằng cùng một câu chính là §4.3.
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  dungBaoCaoTuan, doPhuSong, kyBaoCao, nenGui, dungBanGui, TUAN_MS, TAN_SUAT,
} = require('../backend/src/bao-cao-tuan');

const DEN = 1_757_000_000_000;
const TU = DEN - TUAN_MS;
const NGAY = 86_400_000;

const heThongTot = {
  quyenDocThongBao: true, chayNen: true, dongBoGanNhat: DEN - 60_000, phienBanLuat: '2026.09.04+2',
};

const ca = (nhan, them = {}) => ({
  thoiDiem: DEN - NGAY, nhan, maGiaiThich: 'R1', luatKhopVoi: ['R1'], nguon: 'sms',
  nguoiThanDaDay: true, ketQua: 'chua_ro', ...them,
});

test('tuần yên ả VÀ phủ sóng đủ ⇒ nói rõ "không có gì đáng ngại"', () => {
  const bc = dungBaoCaoTuan({ tu: TU, den: DEN, soLuotQuet: 42, trangThaiHeThong: heThongTot });
  assert.strictEqual(bc.maCauChinh, 'tuan_nay_khong_co_gi_dang_ngai');
  assert.strictEqual(bc.soLuotQuet, 42);
  assert.deepStrictEqual(bc.khoangKhongCanhDuoc, []);
});

test('§4.3 — tuần yên ả NHƯNG có khoảng mù ⇒ KHÔNG được nói "không có gì đáng ngại"', () => {
  /*
   * Đây là ca cả tệp sinh ra để chặn. Quyền đọc thông báo bị thu hồi hôm thứ
   * Ba: bốn ngày cuối tuần không có gì được quét, mà số liệu vẫn "0 sự kiện".
   */
  const bc = dungBaoCaoTuan({
    tu: TU, den: DEN, soLuotQuet: 12, trangThaiHeThong: heThongTot,
    khoangMu: [{ tu: DEN - 4 * NGAY, den: DEN, ly: 'quyen_doc_thong_bao_bi_thu_hoi' }],
  });
  assert.strictEqual(bc.maCauChinh, 'tuan_nay_co_khoang_khong_canh_duoc');
  assert.strictEqual(bc.khoangKhongCanhDuoc.length, 1);
  assert.ok(bc.khoangKhongCanhDuoc[0].ly.includes('quyen_doc_thong_bao_bi_thu_hoi'));
  assert.ok(bc.tyLePhuSong < 0.5);
});

test('§4.3 — quyền đã mất ⇒ không được nói tuần yên ả, dù không có khoảng mù nào được khai', () => {
  const bc = dungBaoCaoTuan({
    tu: TU, den: DEN, trangThaiHeThong: { ...heThongTot, quyenDocThongBao: false },
  });
  assert.strictEqual(bc.maCauChinh, 'tuan_nay_co_khoang_khong_canh_duoc');
  assert.strictEqual(bc.heThong.quyenDocThongBao, 'da_mat');
});

test('§4.3 — trạng thái KHÔNG ĐO ĐƯỢC không được biến thành "vẫn tốt"', () => {
  const bc = dungBaoCaoTuan({ tu: TU, den: DEN, trangThaiHeThong: {} });
  assert.strictEqual(bc.heThong.quyenDocThongBao, 'khong_do_duoc');
  assert.strictEqual(bc.heThong.chayNen, 'khong_do_duoc');
  assert.strictEqual(bc.heThong.dongBoGanNhat, null);
});

test('có sự kiện ⇒ câu chính đổi, kèm tóm tắt từng ca', () => {
  const bc = dungBaoCaoTuan({
    tu: TU, den: DEN, soLuotQuet: 88, trangThaiHeThong: heThongTot,
    canhBao: [ca('CAO', { nguoiThanDaBamGoi: true, ketQua: 'that' }), ca('NGHI_NGO'), ca('NGHI_NGO')],
  });
  assert.strictEqual(bc.maCauChinh, 'co_su_kien_trong_tuan');
  assert.deepStrictEqual(bc.demTheoNhan, { cao: 1, nghiNgo: 2 });
  assert.strictEqual(bc.ca.cao.length, 1);
  assert.strictEqual(bc.ca.nghiNgo.length, 2);
  assert.strictEqual(bc.giaoNhan.daBamGoi, 1);
  assert.strictEqual(bc.ketQua.that, 1);
});

test('§6.9 — tóm tắt ca KHÔNG mang nội dung, số tài khoản hay số điện thoại', () => {
  const bc = dungBaoCaoTuan({
    tu: TU, den: DEN, trangThaiHeThong: heThongTot,
    canhBao: [ca('CAO', {
      noiDung: 'Bác chuyển 15 triệu vào số tài khoản 19036661234',
      nguoiGuiDaChe: '091*****78',
    })],
  });
  const chu = JSON.stringify(bc);
  assert.ok(!chu.includes('19036661234'));
  assert.ok(!chu.includes('chuyển 15 triệu'));
  assert.ok(!chu.includes('091*****78'));
});

test('§4.6 — số lần bấm "Tôi ổn" có mặt trong báo cáo', () => {
  const bc = dungBaoCaoTuan({
    tu: TU, den: DEN, trangThaiHeThong: heThongTot,
    canhBao: [ca('CAO', { nguoiCaoTuoiBamToiOn: true }), ca('CAO')],
  });
  assert.strictEqual(bc.soLanBamToiOn, 1);
});

test('kết quả diễn tập gần nhất và xu hướng đi kèm', () => {
  const luot = [
    { kichBanMa: 'DT-01', ho: 'giao_hang', doKho: 1, guiLuc: DEN - 3 * NGAY, daGoiNguoiThan: true, goiLuc: DEN - 3 * NGAY + 1000 },
    { kichBanMa: 'DT-02', ho: 'trung_thuong', doKho: 1, guiLuc: DEN - 20 * NGAY, daBamLink: true },
  ];
  const bc = dungBaoCaoTuan({ tu: TU, den: DEN, trangThaiHeThong: heThongTot, luotDienTap: luot });
  assert.strictEqual(bc.dienTap.ganNhat.kichBanMa, 'DT-01');
  assert.strictEqual(bc.dienTap.ganNhat.hanhVi, 'goi_nguoi_than');
  assert.ok(bc.dienTap.ganNhat.goiYNoiChuyen);
  assert.strictEqual(bc.dienTap.xuHuong.length, 12);
  assert.ok(bc.dienTap.chiSoCanhGiac > 0);
});

test('không có bài diễn tập nào ⇒ chỉ số là null, không phải 0', () => {
  const bc = dungBaoCaoTuan({ tu: TU, den: DEN, trangThaiHeThong: heThongTot });
  assert.strictEqual(bc.dienTap.chiSoCanhGiac, null);
  assert.strictEqual(bc.dienTap.ganNhat, null);
});

// ── ĐỘ PHỦ SÓNG ───────────────────────────────────────────────────────
test('khoảng mù chồng nhau được gộp, không đếm trùng', () => {
  const p = doPhuSong({
    tu: 0, den: 100,
    khoangMu: [{ tu: 10, den: 40, ly: 'a' }, { tu: 30, den: 50, ly: 'b' }],
  });
  assert.strictEqual(p.muMs, 40);
  assert.strictEqual(p.khoang.length, 1);
  assert.deepStrictEqual(p.khoang[0].ly, ['a', 'b']);
});

test('khoảng mù ngoài kỳ bị cắt về đúng kỳ', () => {
  const p = doPhuSong({ tu: 50, den: 100, khoangMu: [{ tu: 0, den: 60, ly: 'a' }] });
  assert.strictEqual(p.muMs, 10);
});

// ── TẦN SUẤT ──────────────────────────────────────────────────────────
test('tuần yên ả VẪN GỬI — đó là cả điểm của tính năng', () => {
  assert.strictEqual(nenGui({ tanSuat: 'tuan', guiLanTruoc: DEN - TUAN_MS, bayGio: DEN }).gui, true);
});

test('người thân tắt được báo cáo', () => {
  assert.strictEqual(nenGui({ tanSuat: 'tat', bayGio: DEN }).gui, false);
  assert.strictEqual(kyBaoCao('tat', DEN), null);
  assert.ok(TAN_SUAT.includes('tat'));
});

test('chưa tới kỳ thì không gửi', () => {
  assert.strictEqual(nenGui({ tanSuat: 'tuan', guiLanTruoc: DEN - 1000, bayGio: DEN }).ly, 'chua_toi_ky');
});

test('tần suất chỉnh được sang hai tuần / tháng', () => {
  assert.strictEqual(kyBaoCao('hai_tuan', DEN).tu, DEN - 2 * TUAN_MS);
  assert.strictEqual(kyBaoCao('thang', DEN).tu, DEN - 30 * NGAY);
});

// ── ĐƯỜNG GỬI ─────────────────────────────────────────────────────────
test('§9.4 — push báo cáo KHÔNG đổ chuông', () => {
  const bc = dungBaoCaoTuan({ tu: TU, den: DEN, trangThaiHeThong: heThongTot });
  const gui = dungBanGui(bc);
  assert.strictEqual(gui.push.doChuong, false);
  assert.strictEqual(gui.push.tuyChonHienThi.silent, true);
  assert.ok(gui.email.duLieu);
});

test('§HĐ luật 2 — báo cáo trả MÃ, không trả câu tiếng Việt dựng sẵn', () => {
  const bc = dungBaoCaoTuan({
    tu: TU, den: DEN, trangThaiHeThong: heThongTot, canhBao: [ca('CAO')],
  });
  const chu = JSON.stringify(bc);
  for (const cau of ['Tuần này', 'Nguy hiểm cao', 'Nghi ngờ', 'An toàn', 'Safe']) {
    assert.ok(!chu.includes(cau), `báo cáo dựng sẵn câu hiển thị: "${cau}"`);
  }
});

test('§11 — mã câu không mang chữ "an toàn"', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const nguon = fs.readFileSync(path.join(__dirname, '..', 'backend', 'src', 'bao-cao-tuan.js'), 'utf8');
  const chuoi = nguon.match(/'[^']*'/g) || [];
  for (const s of chuoi) {
    assert.ok(!/an_toan|antoan|\bsafe\b/i.test(s), `mã câu mang chữ "an toàn": ${s}`);
  }
});
