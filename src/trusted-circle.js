'use strict';
/**
 * §9.8 — VÒNG TRÒN GIA ĐÌNH. QUYỀN CUỐI THUỘC VỀ NGƯỜI CAO TUỔI.
 *
 * ⚠️ ĐỌC TRƯỚC KHI SỬA BẤT KỲ DÒNG NÀO Ở ĐÂY.
 *
 * Toàn bộ thiết kế mặc định gia đình là an toàn. Nhưng DẠNG LẠM DỤNG TÀI CHÍNH
 * NGƯỜI CAO TUỔI PHỔ BIẾN NHẤT LẠI DO CHÍNH NGƯỜI TRONG NHÀ GÂY RA. Nếu người
 * cài hộ là người có vấn đề, sản phẩm này biến thành công cụ giám sát tài chính
 * trao cho đúng người không nên có, kèm cả danh sách người thân và thói quen
 * chi tiêu.
 *
 * Bốn ràng buộc §9.8, dựng TỪ DÒNG CODE ĐẦU TIÊN, không vá sau:
 *  1. Chủ tài khoản THU HỒI ĐƯỢC MỌI QUYỀN của mọi thành viên, bất cứ lúc nào,
 *     KHÔNG cần mật khẩu hay xác nhận của người đã cài hộ.
 *  2. Bảng theo dõi cho người thân MẶC ĐỊNH TẮT; người cài hộ KHÔNG BẬT THAY ĐƯỢC.
 *  3. Mỗi lần thành viên xem dữ liệu ghi một bản ghi mà CHÍNH NGƯỜI XEM KHÔNG XOÁ ĐƯỢC.
 *  4. KHÔNG hiển thị số tiền chính xác cho thành viên — chỉ khoảng giá trị.
 *
 * Hàm thuần: thời điểm truyền vào qua tham số, không đọc đồng hồ hệ thống.
 */

/** Bốn vai trò. `chu_tai_khoan` là người cao tuổi — người sở hữu quyết định cuối. */
const VAI_TRO = Object.freeze([
  'chu_tai_khoan',      // người dùng chính. Quyền tuyệt đối, không ai lấy được.
  'nguoi_than_tin_cay', // nhận cảnh báo, gọi được. Do CHỦ TÀI KHOẢN chỉ định.
  'nguoi_ho_tro',       // người cài hộ. QUYỀN HẠN CHẾ NHẤT — xem §9.8.
  'nguoi_du_phong',     // nhận cảnh báo khi người thân tin cậy không liên lạc được.
]);

/**
 * ⚠️ `nguoi_ho_tro` KHÔNG có `bat_bang_theo_doi` và KHÔNG có `dat_quy_tac`.
 * Người cài hộ dựng được app cho bố mẹ, nhưng KHÔNG tự trao cho mình quyền nhìn.
 */
const QUYEN_THEO_VAI = Object.freeze({
  chu_tai_khoan: ['nhan_canh_bao', 'xem_bang_theo_doi', 'dat_quy_tac', 'thu_hoi', 'moi_thanh_vien'],
  nguoi_than_tin_cay: ['nhan_canh_bao'],
  nguoi_ho_tro: ['moi_thanh_vien'],
  nguoi_du_phong: ['nhan_canh_bao'],
});

class LoiQuyen extends Error {
  constructor(ma, moTa) { super(moTa || ma); this.name = 'LoiQuyen'; this.ma = ma; }
}

const laChuTaiKhoan = (vt, ai) => vt.chuTaiKhoanId === ai;
const timThanhVien = (vt, id) => vt.thanhVien.find((t) => t.id === id) || null;

function taoVongTron(chuTaiKhoanId) {
  return {
    chuTaiKhoanId,
    thanhVien: [{ id: chuTaiKhoanId, vaiTro: 'chu_tai_khoan', daThuHoi: false }],
    // §9.8 luật 2 — MẶC ĐỊNH TẮT. Đây là giá trị khởi tạo, không phải tuỳ chọn.
    bangTheoDoiBat: false,
    quyTac: null,
    nhatKyXem: [],   // §9.8 luật 3 — chỉ ghi thêm, không xoá
  };
}

function themThanhVien(vt, { id, vaiTro, boiAi }) {
  if (!VAI_TRO.includes(vaiTro)) throw new LoiQuyen('VAI_TRO_LA');
  if (vaiTro === 'chu_tai_khoan') throw new LoiQuyen('CHI_CO_MOT_CHU_TAI_KHOAN');
  const nguoiThem = timThanhVien(vt, boiAi);
  if (!nguoiThem || nguoiThem.daThuHoi
    || !QUYEN_THEO_VAI[nguoiThem.vaiTro].includes('moi_thanh_vien')) {
    throw new LoiQuyen('KHONG_DU_QUYEN_MOI');
  }
  return {
    ...vt,
    thanhVien: [...vt.thanhVien, { id, vaiTro, daThuHoi: false, themBoi: boiAi }],
  };
}

/**
 * §9.8 luật 1 — chủ tài khoản thu hồi được MỌI quyền của MỌI thành viên,
 * BẤT CỨ LÚC NÀO, KHÔNG cần mật khẩu hay xác nhận của người đã cài hộ.
 *
 * Hàm này CỐ Ý không nhận tham số mật khẩu, để không ai thêm được cổng xác nhận
 * vào đây sau này mà không phải sửa chữ ký hàm.
 */
function thuHoi(vt, thanhVienId, boiAi) {
  if (!laChuTaiKhoan(vt, boiAi)) throw new LoiQuyen('CHI_CHU_TAI_KHOAN_THU_HOI_DUOC');
  if (thanhVienId === vt.chuTaiKhoanId) throw new LoiQuyen('KHONG_THU_HOI_CHU_TAI_KHOAN');
  return {
    ...vt,
    thanhVien: vt.thanhVien.map((t) => (t.id === thanhVienId ? { ...t, daThuHoi: true } : t)),
  };
}

/** §9.8 luật 2 — CHỈ chủ tài khoản bật được bảng theo dõi. Người cài hộ thì không. */
function datBangTheoDoi(vt, bat, boiAi) {
  if (!laChuTaiKhoan(vt, boiAi)) throw new LoiQuyen('CHI_CHU_TAI_KHOAN_BAT_DUOC_BANG_THEO_DOI');
  return { ...vt, bangTheoDoiBat: Boolean(bat) };
}

function coQuyen(vt, thanhVienId, quyen) {
  const t = timThanhVien(vt, thanhVienId);
  if (!t || t.daThuHoi) return false;
  if (!QUYEN_THEO_VAI[t.vaiTro].includes(quyen)) return false;
  // Bảng theo dõi tắt ⇒ KHÔNG AI xem được, kể cả người có quyền trên giấy.
  if (quyen === 'xem_bang_theo_doi' && !vt.bangTheoDoiBat && !laChuTaiKhoan(vt, thanhVienId)) {
    return false;
  }
  return true;
}

/**
 * §9.8 luật 3 — mỗi lần thành viên xem dữ liệu ghi MỘT bản ghi mà CHÍNH NGƯỜI XEM
 * KHÔNG XOÁ ĐƯỢC. Nhật ký chỉ ghi thêm; không có hàm xoá nào trong module này,
 * và đó là chủ đích.
 */
function ghiLuotXem(vt, thanhVienId, thoiDiem) {
  if (!coQuyen(vt, thanhVienId, 'xem_bang_theo_doi')) throw new LoiQuyen('KHONG_DU_QUYEN_XEM');
  return {
    ...vt,
    nhatKyXem: [...vt.nhatKyXem, { thanhVienId, thoiDiem }],
  };
}

/**
 * §9.8 luật 4 — KHÔNG hiển thị số tiền chính xác cho thành viên, chỉ khoảng.
 * Chủ tài khoản xem máy của chính mình thì thấy số thật (§9.6: che khi dữ liệu
 * RỜI khỏi máy, không che khi chỉ hiện trên máy của chính chủ).
 */
const BAC_TIEN = [
  [1_000_000, 'duoi_1_trieu'],
  [5_000_000, 'tu_1_den_5_trieu'],
  [20_000_000, 'tu_5_den_20_trieu'],
  [100_000_000, 'tu_20_den_100_trieu'],
  [Infinity, 'tren_100_trieu'],
];

function khoangTien(soTien) {
  if (typeof soTien !== 'number' || !Number.isFinite(soTien) || soTien < 0) return 'khong_ro';
  return BAC_TIEN.find(([tran]) => soTien < tran)[1];
}

// ─────────────────── §9.3 — QUY TẮC GIA ĐÌNH ───────────────────

/**
 * §9.3 — bản 24 giờ dựng ĐÚNG MỘT quy tắc: ngưỡng số tiền, do chủ tài khoản đặt.
 *
 * ⚠️ Cơ chế là ÁP LỰC XÃ HỘI, KHÔNG phải chặn kỹ thuật. Web app không chặn được
 * giao dịch ngân hàng, và nói khác đi thì câu hỏi "vậy nó có chặn được không?"
 * làm sụp cả phần định vị lúc thuyết trình.
 */
function datQuyTac(vt, { nguongTien, nguoiNhanCanhBaoId }, boiAi) {
  if (!laChuTaiKhoan(vt, boiAi)) throw new LoiQuyen('CHI_CHU_TAI_KHOAN_DAT_QUY_TAC');
  if (typeof nguongTien !== 'number' || nguongTien <= 0) throw new LoiQuyen('NGUONG_KHONG_HOP_LE');
  const nguoiNhan = timThanhVien(vt, nguoiNhanCanhBaoId);
  if (!nguoiNhan || nguoiNhan.daThuHoi) throw new LoiQuyen('NGUOI_NHAN_KHONG_HOP_LE');
  return {
    ...vt,
    quyTac: {
      ma: 'khong_chuyen_tren_nguong_cho_nguoi_moi',
      nguongTien,
      nguoiNhanCanhBaoId,
      datBoi: boiAi,
      // §9.4 — quy tắc phải có LỊCH SỬ THAY ĐỔI.
      lichSu: [...(vt.quyTac?.lichSu || []), { nguongTien, nguoiNhanCanhBaoId, datBoi: boiAi }],
    },
  };
}

/** @returns {{viPham:boolean, maQuyTac:string|null, nguoiNhanCanhBaoId:string|null}} */
function kiemQuyTac(vt, { soTien, nguoiNhanMoi }) {
  const q = vt.quyTac;
  if (!q) return { viPham: false, maQuyTac: null, nguoiNhanCanhBaoId: null };
  const viPham = typeof soTien === 'number' && soTien > q.nguongTien && nguoiNhanMoi === true;
  return {
    viPham,
    maQuyTac: viPham ? q.ma : null,
    nguoiNhanCanhBaoId: viPham ? q.nguoiNhanCanhBaoId : null,
  };
}

// ─────────────────── §9.4 — "IM LẶNG = GỬI" ───────────────────

/**
 * §9.4 — bốn ràng buộc, KHÔNG ĐƯỢC NỚI:
 *  - auto-alert CHỈ kích hoạt bởi quy tắc do CHÍNH CHỦ TÀI KHOẢN đặt từ trước,
 *    có người nhận cụ thể, có lịch sử thay đổi
 *  - người cài hộ KHÔNG bật được auto-alert thay chủ tài khoản
 *  - "Đừng nhắn lần này" huỷ MỘT LẦN GỬI, KHÔNG tắt vĩnh viễn quy tắc
 *  - KHÔNG auto-alert ở mức thấp hoặc trung bình
 */
const MUC_CHO_PHEP_AUTO_ALERT = new Set(['PAUSE_60S', 'PROTECTED_CRITICAL', 'RECOVERY']);

function nenTuDongCanhBao(vt, { canThiep, huyLanNay = false }) {
  if (huyLanNay) return { gui: false, lyDo: 'nguoi_dung_huy_lan_nay' };
  if (!vt.quyTac) return { gui: false, lyDo: 'chua_co_quy_tac' };
  if (vt.quyTac.datBoi !== vt.chuTaiKhoanId) return { gui: false, lyDo: 'quy_tac_khong_do_chu_tai_khoan_dat' };
  const nguoiNhan = timThanhVien(vt, vt.quyTac.nguoiNhanCanhBaoId);
  if (!nguoiNhan || nguoiNhan.daThuHoi) return { gui: false, lyDo: 'nguoi_nhan_da_bi_thu_hoi' };
  if (!MUC_CHO_PHEP_AUTO_ALERT.has(canThiep)) return { gui: false, lyDo: 'muc_qua_thap' };
  return { gui: true, lyDo: null, nguoiNhanId: nguoiNhan.id };
}

/**
 * Payload cảnh báo TỐI THIỂU.
 * §6.9 — KHÔNG gửi nội dung thô, không gửi số tài khoản đầy đủ, không gửi OTP.
 * §9.8 luật 4 — số tiền gửi đi dạng KHOẢNG, không phải số chính xác.
 */
function dungPayloadCanhBao(vt, { envelope, soTien, thoiDiem }) {
  return {
    maSuKien: 'canh_bao_quy_tac_gia_dinh',
    thoiDiem,
    nhan: envelope?.nhan ?? null,
    canThiep: envelope?.canThiep ?? null,
    hoKichBan: envelope?.hoKichBan ?? null,
    khoangTien: khoangTien(soTien),
    maQuyTac: vt.quyTac?.ma ?? null,
    // KHÔNG có: nội dung tin nhắn, số tài khoản, số điện thoại, OTP, evidence.
  };
}

/**
 * §9.4 — TRẠNG THÁI GIAO NHẬN, KHÔNG ĐƯỢC NÓI QUÁ.
 *
 * | Hiển thị được              | Hệ thống thật sự biết gì                    |
 * | "Đã đẩy cảnh báo đi"       | endpoint trả thành công — KHÔNG đồng nghĩa   |
 * |                            | người thân đã thấy                           |
 * | "Hương đã mở lúc 14:08"    | có sự kiện mở — ghi audit được               |
 * | "Hương đã đọc và hiểu"     | KHÔNG CÓ BẰNG CHỨNG — KHÔNG BAO GIỜ hiển thị |
 */
const TRANG_THAI_GIAO_NHAN = Object.freeze({
  da_day_di: 'da_day_canh_bao_di',
  da_mo: 'nguoi_than_da_mo_canh_bao',
  khong_xac_nhan_duoc: 'khong_xac_nhan_duoc_canh_bao_da_toi_may_nguoi_than',
});

function trangThaiGiaoNhan({ endpointOk, coSuKienMo }) {
  if (coSuKienMo) return TRANG_THAI_GIAO_NHAN.da_mo;
  if (endpointOk) return TRANG_THAI_GIAO_NHAN.da_day_di;
  // Gửi lỗi / máy offline / quyền bị tắt → nói thật, không giả vờ thành công.
  return TRANG_THAI_GIAO_NHAN.khong_xac_nhan_duoc;
}

module.exports = {
  VAI_TRO, QUYEN_THEO_VAI, LoiQuyen, TRANG_THAI_GIAO_NHAN, MUC_CHO_PHEP_AUTO_ALERT,
  taoVongTron, themThanhVien, thuHoi, datBangTheoDoi, coQuyen, ghiLuotXem,
  khoangTien, datQuyTac, kiemQuyTac, nenTuDongCanhBao, dungPayloadCanhBao,
  trangThaiGiaoNhan, timThanhVien,
};
