'use strict';
/**
 * §9.8 — QUYỀN CUỐI THUỘC VỀ NGƯỜI CAO TUỔI.
 *
 * Giám khảo chắc chắn hỏi "thế nếu chính người con là kẻ lạm dụng thì sao?".
 * Bốn ràng buộc §9.8 là câu trả lời, và nó CHỈ CÓ SỨC NẶNG KHI ĐÃ DỰNG SẴN.
 * Tệp này là bằng chứng chúng đã dựng sẵn.
 */

const test = require('node:test');
const assert = require('node:assert');

const T = require('../backend/src/trusted-circle');

const BAC = 'bac';        // chủ tài khoản — người cao tuổi
const CON = 'con_gai';    // người thân tin cậy
const HO_TRO = 'nguoi_cai_ho';

const dung = () => {
  let vt = T.taoVongTron(BAC);
  vt = T.themThanhVien(vt, { id: CON, vaiTro: 'nguoi_than_tin_cay', boiAi: BAC });
  vt = T.themThanhVien(vt, { id: HO_TRO, vaiTro: 'nguoi_ho_tro', boiAi: BAC });
  return vt;
};

test('§5.3 — đúng bốn vai trò', () => {
  assert.strictEqual(T.VAI_TRO.length, 4);
  assert.ok(T.VAI_TRO.includes('chu_tai_khoan'));
});

// ─────────── §9.8 luật 1 — thu hồi vô điều kiện ───────────

test('§9.8.1 — chủ tài khoản thu hồi được MỌI thành viên, bất cứ lúc nào', () => {
  let vt = dung();
  vt = T.thuHoi(vt, HO_TRO, BAC);
  assert.strictEqual(T.timThanhVien(vt, HO_TRO).daThuHoi, true);
  assert.strictEqual(T.coQuyen(vt, HO_TRO, 'moi_thanh_vien'), false);
});

test('§9.8.1 — thu hồi KHÔNG cần mật khẩu hay xác nhận của người bị thu hồi', () => {
  // Chữ ký hàm cố ý chỉ nhận (vòng tròn, ai bị thu hồi, ai thu hồi).
  // Không có tham số mật khẩu nào để ai đó chèn cổng xác nhận vào sau này.
  assert.strictEqual(T.thuHoi.length, 3);
  const nguon = T.thuHoi.toString();
  for (const cam of ['matKhau', 'password', 'xacNhan', 'confirm', 'otp']) {
    assert.ok(!nguon.includes(cam), `thu hồi không được đòi ${cam}`);
  }
});

test('§9.8.1 — người cài hộ KHÔNG thu hồi được ai, kể cả chính mình', () => {
  const vt = dung();
  assert.throws(() => T.thuHoi(vt, CON, HO_TRO), /CHI_CHU_TAI_KHOAN_THU_HOI_DUOC/);
});

test('§9.8.1 — KHÔNG ai thu hồi được chủ tài khoản', () => {
  const vt = dung();
  assert.throws(() => T.thuHoi(vt, BAC, BAC), /KHONG_THU_HOI_CHU_TAI_KHOAN/);
});

test('§9.8.1 — thành viên đã thu hồi mất sạch quyền, kể cả nhận cảnh báo', () => {
  const vt = T.thuHoi(dung(), CON, BAC);
  assert.strictEqual(T.coQuyen(vt, CON, 'nhan_canh_bao'), false);
});

// ─────────── §9.8 luật 2 — bảng theo dõi mặc định TẮT ───────────

test('§9.8.2 — bảng theo dõi MẶC ĐỊNH TẮT ngay lúc khởi tạo', () => {
  assert.strictEqual(T.taoVongTron(BAC).bangTheoDoiBat, false);
});

test('§9.8.2 — người cài hộ KHÔNG bật thay được', () => {
  const vt = dung();
  assert.throws(() => T.datBangTheoDoi(vt, true, HO_TRO),
    /CHI_CHU_TAI_KHOAN_BAT_DUOC_BANG_THEO_DOI/);
  assert.throws(() => T.datBangTheoDoi(vt, true, CON), /CHI_CHU_TAI_KHOAN/);
});

test('§9.8.2 — bảng tắt thì KHÔNG AI xem được, dù vai trò có quyền trên giấy', () => {
  const vt = dung();
  assert.strictEqual(T.coQuyen(vt, CON, 'xem_bang_theo_doi'), false);
  assert.throws(() => T.ghiLuotXem(vt, CON, 1), /KHONG_DU_QUYEN_XEM/);
});

test('§9.8.2 — chủ tài khoản luôn xem được dữ liệu của chính mình', () => {
  const vt = dung();
  assert.strictEqual(T.coQuyen(vt, BAC, 'xem_bang_theo_doi'), true);
});

test('§9.8 — người cài hộ KHÔNG có quyền xem và KHÔNG có quyền đặt quy tắc', () => {
  assert.deepStrictEqual(T.QUYEN_THEO_VAI.nguoi_ho_tro, ['moi_thanh_vien']);
});

// ─────────── §9.8 luật 3 — nhật ký xem không xoá được ───────────

test('§9.8.3 — mỗi lượt xem ghi một bản ghi', () => {
  let vt = T.datBangTheoDoi(dung(), true, BAC);
  // Bật bảng rồi thì người thân tin cậy vẫn không có quyền xem theo vai trò.
  vt = T.ghiLuotXem(vt, BAC, 1000);
  vt = T.ghiLuotXem(vt, BAC, 2000);
  assert.strictEqual(vt.nhatKyXem.length, 2);
  assert.deepStrictEqual(vt.nhatKyXem[0], { thanhVienId: BAC, thoiDiem: 1000 });
});

test('§9.8.3 — module KHÔNG có hàm xoá nhật ký nào, và đó là chủ đích', () => {
  const ten = Object.keys(T).join(' ').toLowerCase();
  for (const cam of ['xoanhatky', 'xoaluotxem', 'clearlog', 'deletelog']) {
    assert.ok(!ten.includes(cam), `không được có hàm ${cam}`);
  }
});

// ─────────── §9.8 luật 4 — không hiện số tiền chính xác ───────────

test('§9.8.4 — số tiền gửi cho thành viên là KHOẢNG, không phải số chính xác', () => {
  assert.strictEqual(T.khoangTien(500_000), 'duoi_1_trieu');
  assert.strictEqual(T.khoangTien(3_000_000), 'tu_1_den_5_trieu');
  assert.strictEqual(T.khoangTien(10_000_000), 'tu_5_den_20_trieu');
  assert.strictEqual(T.khoangTien(50_000_000), 'tu_20_den_100_trieu');
  assert.strictEqual(T.khoangTien(500_000_000), 'tren_100_trieu');
  assert.strictEqual(T.khoangTien(null), 'khong_ro');
});

test('§9.8.4 — payload cảnh báo KHÔNG mang số tiền chính xác', () => {
  const vt = T.datQuyTac(dung(), { nguongTien: 5_000_000, nguoiNhanCanhBaoId: CON }, BAC);
  const p = T.dungPayloadCanhBao(vt, {
    envelope: { nhan: 'CAO', canThiep: 'PAUSE_60S', hoKichBan: 'gia_danh_cong_an' },
    soTien: 37_500_000, thoiDiem: 1,
  });
  const chu = JSON.stringify(p);
  assert.ok(!chu.includes('37500000'), 'số tiền chính xác bị rò ra ngoài máy');
  assert.strictEqual(p.khoangTien, 'tu_20_den_100_trieu');
});

test('§6.9 — payload KHÔNG mang nội dung thô, số tài khoản, OTP hay evidence', () => {
  const vt = T.datQuyTac(dung(), { nguongTien: 5_000_000, nguoiNhanCanhBaoId: CON }, BAC);
  const p = T.dungPayloadCanhBao(vt, {
    envelope: {
      nhan: 'CAO', canThiep: 'PAUSE_60S', hoKichBan: null,
      signals: [{ evidence: [{ quote: 'mã otp 123456' }] }],
      maLyDo: ['CRED_OTP_SHARE'],
    },
    soTien: 1000, thoiDiem: 1,
  });
  const chu = JSON.stringify(p);
  for (const cam of ['otp', '123456', 'evidence', 'quote', 'signals']) {
    assert.ok(!chu.includes(cam), `payload rò ${cam}`);
  }
});

// ─────────── §9.3 — quy tắc gia đình ───────────

test('§9.3 — CHỈ chủ tài khoản đặt được quy tắc', () => {
  const vt = dung();
  assert.throws(() => T.datQuyTac(vt, { nguongTien: 5e6, nguoiNhanCanhBaoId: CON }, HO_TRO),
    /CHI_CHU_TAI_KHOAN_DAT_QUY_TAC/);
});

test('§9.3 — bản 24 giờ dựng ĐÚNG MỘT quy tắc: ngưỡng số tiền', () => {
  const vt = T.datQuyTac(dung(), { nguongTien: 5_000_000, nguoiNhanCanhBaoId: CON }, BAC);
  assert.strictEqual(vt.quyTac.ma, 'khong_chuyen_tren_nguong_cho_nguoi_moi');
  assert.strictEqual(T.kiemQuyTac(vt, { soTien: 6e6, nguoiNhanMoi: true }).viPham, true);
  assert.strictEqual(T.kiemQuyTac(vt, { soTien: 4e6, nguoiNhanMoi: true }).viPham, false);
  assert.strictEqual(T.kiemQuyTac(vt, { soTien: 6e6, nguoiNhanMoi: false }).viPham, false,
    'người nhận đã quen thì không vi phạm quy tắc này');
});

test('§9.4 — quy tắc có LỊCH SỬ THAY ĐỔI', () => {
  let vt = T.datQuyTac(dung(), { nguongTien: 5e6, nguoiNhanCanhBaoId: CON }, BAC);
  vt = T.datQuyTac(vt, { nguongTien: 2e6, nguoiNhanCanhBaoId: CON }, BAC);
  assert.strictEqual(vt.quyTac.lichSu.length, 2);
});

// ─────────── §9.4 — "Im lặng = gửi" ───────────

const coQuyTac = () => T.datQuyTac(dung(), { nguongTien: 5e6, nguoiNhanCanhBaoId: CON }, BAC);

test('§9.4 — KHÔNG auto-alert ở mức thấp hoặc trung bình', () => {
  const vt = coQuyTac();
  assert.strictEqual(T.nenTuDongCanhBao(vt, { canThiep: 'TRUST_RECEIPT' }).gui, false);
  assert.strictEqual(T.nenTuDongCanhBao(vt, { canThiep: 'VERIFY_PATH' }).gui, false);
  assert.strictEqual(T.nenTuDongCanhBao(vt, { canThiep: 'PAUSE_60S' }).gui, true);
  assert.strictEqual(T.nenTuDongCanhBao(vt, { canThiep: 'PROTECTED_CRITICAL' }).gui, true);
});

test('§9.4 — "Đừng nhắn lần này" huỷ MỘT LẦN GỬI, KHÔNG tắt quy tắc', () => {
  const vt = coQuyTac();
  const kq = T.nenTuDongCanhBao(vt, { canThiep: 'PAUSE_60S', huyLanNay: true });
  assert.strictEqual(kq.gui, false);
  assert.strictEqual(kq.lyDo, 'nguoi_dung_huy_lan_nay');
  // Quy tắc vẫn nguyên: lần sau vẫn gửi.
  assert.strictEqual(T.nenTuDongCanhBao(vt, { canThiep: 'PAUSE_60S' }).gui, true);
});

test('§9.4 — chưa có quy tắc thì KHÔNG tự động cảnh báo', () => {
  assert.strictEqual(T.nenTuDongCanhBao(dung(), { canThiep: 'PROTECTED_CRITICAL' }).gui, false);
});

test('§9.4 — người nhận đã bị thu hồi thì KHÔNG gửi', () => {
  const vt = T.thuHoi(coQuyTac(), CON, BAC);
  const kq = T.nenTuDongCanhBao(vt, { canThiep: 'PROTECTED_CRITICAL' });
  assert.strictEqual(kq.gui, false);
  assert.strictEqual(kq.lyDo, 'nguoi_nhan_da_bi_thu_hoi');
});

// ─────────── §9.4 — trạng thái giao nhận không nói quá ───────────

test('§9.4 — endpoint thành công CHỈ nghĩa là "đã đẩy đi", không phải "đã thấy"', () => {
  assert.strictEqual(T.trangThaiGiaoNhan({ endpointOk: true, coSuKienMo: false }),
    'da_day_canh_bao_di');
});

test('§9.4 — có sự kiện mở thì mới được nói người thân đã mở', () => {
  assert.strictEqual(T.trangThaiGiaoNhan({ endpointOk: true, coSuKienMo: true }),
    'nguoi_than_da_mo_canh_bao');
});

test('§9.4 — gửi lỗi thì nói THẬT, không giả vờ thành công', () => {
  assert.strictEqual(T.trangThaiGiaoNhan({ endpointOk: false, coSuKienMo: false }),
    'khong_xac_nhan_duoc_canh_bao_da_toi_may_nguoi_than');
});

test('§11 — TUYỆT ĐỐI không có trạng thái "đã đọc và hiểu"', () => {
  const chu = JSON.stringify(T.TRANG_THAI_GIAO_NHAN).toLowerCase();
  assert.ok(!/da_doc_va_hieu|da_hieu|read_and_understood/.test(chu));
  assert.strictEqual(Object.keys(T.TRANG_THAI_GIAO_NHAN).length, 3);
});
