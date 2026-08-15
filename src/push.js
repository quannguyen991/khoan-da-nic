'use strict';
/**
 * §2B.2 hạng mục 25 — ĐẨY THÔNG BÁO TỚI NGƯỜI THÂN.
 *
 * ⚠️ §9.4 — TRẠNG THÁI GIAO NHẬN KHÔNG ĐƯỢC NÓI QUÁ:
 *   "Đã đẩy cảnh báo đi"     endpoint trả thành công — KHÔNG đồng nghĩa người
 *                            thân đã thấy
 *   "Hương đã mở lúc 14:08"  có sự kiện mở — ghi audit được
 *   "Hương đã đọc và hiểu"   KHÔNG CÓ BẰNG CHỨNG — KHÔNG BAO GIỜ hiển thị
 *
 * ⚠️ §6.7 — `PUSH_DELIVERY_UNKNOWN` là một TRẠNG THÁI HỢP LỆ, không phải lỗi cần
 * giấu. Gửi lỗi / máy offline / quyền bị tắt đều ra
 * "Không xác nhận được cảnh báo đã tới máy người thân".
 *
 * ⚠️ §11 — "đã đọc và hiểu" cho notification là câu bị cấm.
 *
 * TRẠNG THÁI HIỆN TẠI: chưa cấu hình khoá VAPID và chưa cắm nhà cung cấp push.
 * Module dựng đủ đường đi và ĐIỂM CẮM, nhưng hàm gửi thật trả
 * `CHUA_CAU_HINH_PUSH` — nói thật, không giả lập thành công.
 */

const { LoiQuyen } = require('./trusted-circle');

const TRANG_THAI_GUI = Object.freeze({
  chua_cau_hinh: 'CHUA_CAU_HINH_PUSH',
  da_day_di: 'DA_DAY_DI',
  khong_xac_nhan_duoc: 'PUSH_DELIVERY_UNKNOWN',
  het_han_dang_ky: 'DANG_KY_HET_HAN',
});

/** Đăng ký push của một thành viên. KHÔNG chứa nội dung, không chứa danh tính. */
function chuanHoaDangKy(dk) {
  if (!dk || typeof dk !== 'object') throw new LoiQuyen('DANG_KY_KHONG_HOP_LE');
  const { endpoint, keys } = dk;
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint)) {
    throw new LoiQuyen('ENDPOINT_PHAI_LA_HTTPS');
  }
  if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
    throw new LoiQuyen('THIEU_KHOA_DANG_KY');
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

function layCauHinhVapid(env = process.env) {
  const congKhai = env.VAPID_PUBLIC_KEY;
  const riengTu = env.VAPID_PRIVATE_KEY;
  const lienHe = env.VAPID_SUBJECT;
  return { congKhai, riengTu, lienHe, daCauHinh: Boolean(congKhai && riengTu && lienHe) };
}

/**
 * @param {object} opts.guiThat  điểm cắm nhà cung cấp push. Không có thì KHÔNG
 *                               giả lập thành công.
 * @returns {Promise<{trangThai:string, chiTiet:string|null}>}
 */
async function guiCanhBao({ dangKy, payload, env, guiThat } = {}) {
  const vapid = layCauHinhVapid(env);
  if (!vapid.daCauHinh || typeof guiThat !== 'function') {
    // §9.4 — KHÔNG giả vờ đã gửi. Người dùng phải biết cảnh báo chưa đi.
    return { trangThai: TRANG_THAI_GUI.chua_cau_hinh, chiTiet: null };
  }

  let dk;
  try { dk = chuanHoaDangKy(dangKy); } catch (e) {
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: e.ma };
  }

  try {
    const kq = await guiThat({ dangKy: dk, payload, vapid });
    // Nhà cung cấp trả 404/410 nghĩa là đăng ký đã chết ở máy người nhận.
    if (kq?.status === 404 || kq?.status === 410) {
      return { trangThai: TRANG_THAI_GUI.het_han_dang_ky, chiTiet: String(kq.status) };
    }
    if (kq?.ok) return { trangThai: TRANG_THAI_GUI.da_day_di, chiTiet: null };
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: String(kq?.status ?? 'khong_ro') };
  } catch (e) {
    // §6.7 — giữ nguyên nhân gốc cho log, câu người dùng thấy vẫn sạch.
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: e.message };
  }
}

/**
 * §9.4 — chuyển trạng thái kỹ thuật thành MÃ NGƯỜI DÙNG ĐỌC.
 * ⚠️ Chỉ có BA đích đến. Không có đích nào tên "đã đọc" hay "đã hiểu".
 */
function maHienThi(trangThai, coSuKienMo = false) {
  if (coSuKienMo) return 'nguoi_than_da_mo_canh_bao';
  if (trangThai === TRANG_THAI_GUI.da_day_di) return 'da_day_canh_bao_di';
  return 'khong_xac_nhan_duoc_canh_bao_da_toi_may_nguoi_than';
}

module.exports = {
  guiCanhBao, chuanHoaDangKy, layCauHinhVapid, maHienThi, TRANG_THAI_GUI,
};
