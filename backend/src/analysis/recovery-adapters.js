'use strict';
/**
 * §2B.5 — BỘ THÍCH ỨNG PHỤC HỒI: GLOBAL + ít nhất một nước đã duyệt.
 *
 * ⚠️ §2B.5: "Nước chưa duyệt → RƠI VỀ BƯỚC CHUNG, KHÔNG BỊA SỐ HOTLINE."
 * ⚠️ §11: KHÔNG hứa lấy lại được tiền. Dùng "các bước làm TĂNG KHẢ NĂNG xử lý".
 *
 * Đây là màn hình người dùng đọc lúc vừa mất tiền — lúc dễ tin bất cứ ai hứa
 * lấy lại tiền nhất. Chính lúc đó kẻ lừa đảo thứ hai xuất hiện, tự xưng là bên
 * hỗ trợ thu hồi (`ID_RECOVERY_SUPPORT_IMPERSONATION`). Nên mọi câu ở đây phải
 * trung thực đến mức khô khan, và tuyệt đối không dẫn tới một số điện thoại
 * chưa xác minh.
 *
 * Module trả về MÃ BƯỚC. Frontend tra catalog i18n để ra câu.
 */

const { theoNuoc, trangThaiDanhBa } = require('./verified-institution-registry');

/**
 * Bước chung, đúng cho mọi nước. Thứ tự là thứ tự thực hiện.
 * Không bước nào ở đây cần số điện thoại do Khoan Đã cung cấp.
 */
const BUOC_CHUNG = Object.freeze([
  'ngung_moi_lien_lac_voi_ben_kia',
  'khong_chuyen_them_bat_ky_khoan_nao',
  'goi_ngan_hang_bang_so_in_tren_the',
  'yeu_cau_ngan_hang_ghi_nhan_tra_soat',
  'chup_lai_toan_bo_tin_nhan_va_bien_lai',
  'bao_cho_mot_nguoi_than',
  'trinh_bao_co_quan_chuc_nang_dia_phuong',
  'doi_mat_khau_tren_thiet_bi_khac',
  'canh_giac_voi_ben_hua_lay_lai_tien',
]);

/**
 * Nước đã duyệt. Mỗi mục CHỈ được thêm bước RIÊNG của nước đó; bước chung ở trên
 * luôn chạy trước. `maCoQuan` là MÃ, không phải số điện thoại — số lấy từ sổ
 * tổ chức đã xác minh, và nếu sổ trống thì không render nút gọi.
 */
const THEO_NUOC = Object.freeze({
  VN: Object.freeze({
    daDuyet: true,
    buocRieng: Object.freeze([
      'gui_don_trinh_bao_cong_an_phuong_noi_cu_tru',
      'yeu_cau_ngan_hang_phong_toa_tai_khoan_nhan',
    ]),
    // Cửa sổ vàng: càng sớm càng dễ chặn lệnh. KHÔNG hứa chặn được.
    gioVang: 24,
  }),
  GLOBAL: Object.freeze({ daDuyet: true, buocRieng: Object.freeze([]), gioVang: 24 }),
});

/**
 * @param {string} countryCode
 * @returns {{maNuoc:string, daDuyet:boolean, buoc:string[], gioVang:number,
 *            hotline:Array, canhBao:string[]}}
 */
function layKeHoachPhucHoi(countryCode = 'GLOBAL', duongDanhBa) {
  /**
   * ⚠️ KHÔNG mặc định mã rỗng thành GLOBAL rồi coi là "đã duyệt".
   * Không biết người dùng ở nước nào KHÁC với biết họ ở hồ sơ GLOBAL. Gộp hai
   * thứ đó lại là một biến thể của §4.3: "không biết" bị đọc thành "đã kiểm".
   */
  const ma = String(countryCode || '').trim().toUpperCase();
  const cauHinh = ma ? THEO_NUOC[ma] : null;
  const canhBao = [];
  if (!ma) canhBao.push('chua_biet_nguoi_dung_o_nuoc_nao');

  // §2B.5 — nước chưa duyệt thì RƠI VỀ BƯỚC CHUNG, không bịa bước riêng.
  const daDuyet = Boolean(cauHinh?.daDuyet);
  if (!daDuyet) canhBao.push('nuoc_chua_duoc_duyet_chi_co_buoc_chung');

  const hotline = daDuyet ? theoNuoc(ma, duongDanhBa) : [];
  const soDanhBa = trangThaiDanhBa(duongDanhBa);

  // §9.6 — chưa xác minh được số thì KHÔNG render nút gọi. Nói thẳng lý do.
  if (hotline.length === 0) canhBao.push('chua_xac_minh_duoc_so_tong_dai_dung_so_in_sau_the');
  if (!soDanhBa.dungDuoc) canhBao.push('danh_ba_chua_co_muc_nao_duoc_duyet');

  return {
    maNuoc: daDuyet ? ma : 'GLOBAL',
    daDuyet,
    buoc: [...BUOC_CHUNG, ...(cauHinh?.buocRieng || [])],
    gioVang: cauHinh?.gioVang ?? 24,
    hotline: hotline.map((h) => ({
      id: h.id,
      canonicalName: h.canonicalName,
      officialPhoneNumbers: h.officialPhoneNumbers,
      sourceUrl: h.sourceUrl,
      verifiedAt: h.verifiedAt,   // §2B.5 — số nào cũng phải kèm ngày xác minh
    })),
    canhBao,
  };
}

/**
 * §11 — NHỮNG CÂU KHÔNG ĐƯỢC VIẾT, kiểm ngay trong code.
 * Hàm này tồn tại để test gọi được, và để chỗ cấm có tên trong mã nguồn.
 */
const CUM_TU_CAM = Object.freeze([
  'lay_lai_duoc_tien', 'dam_bao_hoan_tien', 'chac_chan_thu_hoi',
  'guarantee_refund', 'get_your_money_back',
]);

function maBuocHopLe(ma) {
  if (typeof ma !== 'string' || !/^[a-z][a-z0-9_]+$/.test(ma)) return false;
  return !CUM_TU_CAM.some((c) => ma.includes(c));
}

module.exports = {
  layKeHoachPhucHoi, BUOC_CHUNG, THEO_NUOC, CUM_TU_CAM, maBuocHopLe,
};
