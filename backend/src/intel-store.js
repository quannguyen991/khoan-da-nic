'use strict';
/**
 * §5.3 — RA-ĐA THỦ ĐOẠN: nguồn · kho · CỔNG DUYỆT.
 *
 * ⚠️ HAI RÀNG BUỘC §12 QUYẾT ĐỊNH TOÀN BỘ THIẾT KẾ FILE NÀY:
 *   "❌ Tự thu thập / scrape danh tính người bị tố lừa đảo. Ra-đa nhận
 *    TACTIC / PATTERN, không quy kết cá nhân từ một báo cáo."
 * và §11:
 *   "❌ số lượt báo cáo cộng đồng GIẢ, cảnh báo KHÔNG CÓ NGUỒN"
 *   "❌ quy kết một cá nhân là tội phạm từ một báo cáo"
 *
 * Nên kho này KHÔNG CÓ TRƯỜNG NÀO chứa danh tính. Không phải "có nhưng ẩn đi" —
 * là không có chỗ để đặt vào. Mọi mục nhập mang danh tính bị NÉM LỖI.
 */

/** Trường mang danh tính — kho từ chối nhận, không phải lọc bỏ rồi nhận. */
const TRUONG_DANH_TINH = Object.freeze([
  'soDienThoai', 'phone', 'phoneNumber', 'soTaiKhoan', 'accountNumber',
  'hoTen', 'ten', 'name', 'fullName', 'cccd', 'cmnd', 'nationalId',
  'email', 'facebook', 'zalo', 'diaChi', 'address', 'nguoiBiTo', 'accused',
]);

/** Trạng thái duyệt. CHỈ `da_duyet` được ra tới người dùng. */
const TRANG_THAI = Object.freeze(['cho_duyet', 'da_duyet', 'tu_choi', 'het_han']);

/** Ba nguồn của Ra-đa. Mỗi nguồn có yêu cầu chứng minh riêng. */
const NGUON = Object.freeze({
  A_CHINH_THUC: 'a_canh_bao_chinh_thuc',   // cơ quan / ngân hàng công bố
  B_TONG_HOP: 'b_tong_hop_bao_cao',        // gộp nhiều báo cáo thành THỦ ĐOẠN
  C_DIEM_MU: 'c_diem_mu_do_duoc',          // blind-spot.js — đo từ chính bộ eval
});

class LoiIntel extends Error {
  constructor(ma, chiTiet) { super(ma); this.name = 'LoiIntel'; this.ma = ma; this.chiTiet = chiTiet; }
}

/** Quét SÂU — kẻ gọi có thể lồng danh tính vào object con. */
function timDanhTinh(o, duong = '') {
  if (o === null || typeof o !== 'object') return null;
  if (Array.isArray(o)) {
    for (let i = 0; i < o.length; i += 1) {
      const v = timDanhTinh(o[i], `${duong}[${i}]`);
      if (v) return v;
    }
    return null;
  }
  for (const [k, v] of Object.entries(o)) {
    if (TRUONG_DANH_TINH.includes(k)) return `${duong}${duong ? '.' : ''}${k}`;
    const sau = timDanhTinh(v, `${duong}${duong ? '.' : ''}${k}`);
    if (sau) return sau;
  }
  return null;
}

/** Chuỗi trông như số điện thoại / số tài khoản, dù nằm ở trường tên gì. */
const RE_SO_DAI = /(?:\+?\d[\s.-]?){9,}/;

function timSoTrongChuoi(o) {
  const chu = JSON.stringify(o ?? {});
  const m = chu.match(RE_SO_DAI);
  return m ? m[0] : null;
}

/**
 * §11 — SỐ LƯỢT BÁO CÁO PHẢI CÓ THẬT. Mục nhập từ nguồn B phải kèm số báo cáo
 * đã đếm được, và số đó không được tự sinh ra.
 * §11 — CẢNH BÁO PHẢI CÓ NGUỒN. Nguồn A phải có `sourceUrl`.
 */
function kiemMuc(muc) {
  if (!muc || typeof muc !== 'object') throw new LoiIntel('MUC_KHONG_HOP_LE');

  const viPham = timDanhTinh(muc);
  if (viPham) throw new LoiIntel('MUC_CHUA_DANH_TINH', viPham);

  const so = timSoTrongChuoi(muc);
  if (so) throw new LoiIntel('MUC_CHUA_CHUOI_SO_DAI', so);

  if (!muc.maThuDoan || !/^[a-z][a-z0-9_]+$/.test(muc.maThuDoan)) {
    throw new LoiIntel('THIEU_MA_THU_DOAN');
  }
  if (!Object.values(NGUON).includes(muc.nguon)) throw new LoiIntel('NGUON_LA');

  if (muc.nguon === NGUON.A_CHINH_THUC) {
    if (typeof muc.sourceUrl !== 'string' || !/^https?:\/\//.test(muc.sourceUrl)) {
      throw new LoiIntel('NGUON_A_THIEU_SOURCE_URL');   // §11 — cảnh báo không nguồn
    }
  }
  if (muc.nguon === NGUON.B_TONG_HOP) {
    if (!Number.isInteger(muc.soBaoCao) || muc.soBaoCao < 1) {
      throw new LoiIntel('NGUON_B_THIEU_SO_BAO_CAO');   // §11 — không bịa số lượt
    }
    // §12 — MỘT báo cáo KHÔNG đủ để thành một mục Ra-đa.
    if (muc.soBaoCao < NGUONG_BAO_CAO_TOI_THIEU) {
      throw new LoiIntel('CHUA_DU_SO_BAO_CAO', muc.soBaoCao);
    }
  }
  return true;
}

/**
 * §12 — "không quy kết cá nhân TỪ MỘT BÁO CÁO". Một báo cáo là một lời kể; ba
 * báo cáo độc lập cùng một hình dạng mới là một THỦ ĐOẠN.
 */
const NGUONG_BAO_CAO_TOI_THIEU = 3;

function taoKho() {
  const muc = new Map();
  return {
    /** Mọi mục vào kho đều ở `cho_duyet`. KHÔNG có đường nào nhập thẳng `da_duyet`. */
    them(m) {
      kiemMuc(m);
      const ban = { ...m, trangThai: 'cho_duyet', duyetBoi: null };
      muc.set(m.maThuDoan, ban);
      return ban;
    },

    /** CỔNG DUYỆT — chỉ con người bật được, và phải ghi tên người duyệt. */
    duyet(maThuDoan, nguoiDuyet) {
      if (!nguoiDuyet || typeof nguoiDuyet !== 'string') throw new LoiIntel('THIEU_NGUOI_DUYET');
      const m = muc.get(maThuDoan);
      if (!m) throw new LoiIntel('KHONG_TIM_THAY_MUC');
      const ban = { ...m, trangThai: 'da_duyet', duyetBoi: nguoiDuyet };
      muc.set(maThuDoan, ban);
      return ban;
    },

    tuChoi(maThuDoan, nguoiDuyet, lyDo) {
      const m = muc.get(maThuDoan);
      if (!m) throw new LoiIntel('KHONG_TIM_THAY_MUC');
      const ban = { ...m, trangThai: 'tu_choi', duyetBoi: nguoiDuyet, lyDoTuChoi: lyDo ?? null };
      muc.set(maThuDoan, ban);
      return ban;
    },

    /** CHỈ mục đã duyệt mới ra được tới người dùng. */
    layDaDuyet() {
      return [...muc.values()].filter((m) => m.trangThai === 'da_duyet');
    },

    layTatCa() { return [...muc.values()]; },
    lay(ma) { return muc.get(ma) ?? null; },
  };
}

module.exports = {
  taoKho, kiemMuc, timDanhTinh, timSoTrongChuoi, LoiIntel,
  TRUONG_DANH_TINH, TRANG_THAI, NGUON, NGUONG_BAO_CAO_TOI_THIEU,
};
