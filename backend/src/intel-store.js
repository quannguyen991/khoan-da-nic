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

/** Tóm tắt dài hơn thì không còn là tóm tắt — là dán nguyên bài báo vào kho. */
const TOI_DA_TOM_TAT = 160;

/**
 * Số di động Việt Nam: 10 chữ số, bắt đầu bằng 0.
 *
 * ⚠️ VÌ SAO CHẶN RIÊNG TRONG sourceUrl. Đường dẫn của Bộ Công an có mã bài 10
 * chữ số (`…-1758700973`), nên `sourceUrl` phải được miễn bộ chặn chuỗi số dài.
 * Mã bài đó bắt đầu bằng 1 (dạng mốc thời gian); số di động bắt đầu bằng 0.
 * Khác hình dạng, nên miễn cho mã bài mà vẫn chặn được số điện thoại.
 */
const RE_SO_DI_DONG = /(?<!\d)0\d{9}(?!\d)/;

/**
 * §11 — CẢNH BÁO CHÍNH THỨC PHẢI TRUY NGƯỢC ĐƯỢC TỚI CƠ QUAN NHÀ NƯỚC.
 *
 * Chỉ nhận `https` trên tên miền `.gov.vn`. Người dùng chốt ngày 17/9/2026:
 * lấy trang của công an và cơ quan nhà nước, KHÔNG lấy báo chí đưa tin lại.
 *
 * Đọc bằng `new URL()` chứ không soi chuỗi: `https://bocongan.gov.vn@evil.com`
 * trông như trang Bộ Công an nhưng tên miền thật là `evil.com`.
 */
function kiemSourceUrl(url) {
  if (typeof url !== 'string' || !url) throw new LoiIntel('NGUON_A_THIEU_SOURCE_URL');
  let u;
  try { u = new URL(url); } catch { throw new LoiIntel('NGUON_A_THIEU_SOURCE_URL'); }
  if (u.protocol !== 'https:') throw new LoiIntel('SOURCE_URL_PHAI_HTTPS');
  if (u.username || u.password) throw new LoiIntel('NGUON_A_KHONG_PHAI_GOV_VN');
  if (!u.hostname.endsWith('.gov.vn')) throw new LoiIntel('NGUON_A_KHONG_PHAI_GOV_VN');
  if (RE_SO_DI_DONG.test(url)) throw new LoiIntel('SOURCE_URL_CHUA_SO_DIEN_THOAI');
}

/**
 * §11 — SỐ LƯỢT BÁO CÁO PHẢI CÓ THẬT. Mục nhập từ nguồn B phải kèm số báo cáo
 * đã đếm được, và số đó không được tự sinh ra.
 * §11 — CẢNH BÁO PHẢI CÓ NGUỒN. Nguồn A phải có `sourceUrl` trên `.gov.vn`.
 */
function kiemMuc(muc) {
  if (!muc || typeof muc !== 'object') throw new LoiIntel('MUC_KHONG_HOP_LE');

  const viPham = timDanhTinh(muc);
  if (viPham) throw new LoiIntel('MUC_CHUA_DANH_TINH', viPham);

  if (muc.id !== undefined && (typeof muc.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,80}$/.test(muc.id))) {
    throw new LoiIntel('ID_KHONG_HOP_LE');
  }
  if (!muc.maThuDoan || !/^[a-z][a-z0-9_]+$/.test(muc.maThuDoan)) {
    throw new LoiIntel('THIEU_MA_THU_DOAN');
  }
  if (!Object.values(NGUON).includes(muc.nguon)) throw new LoiIntel('NGUON_LA');

  const laNguonA = muc.nguon === NGUON.A_CHINH_THUC;
  if (laNguonA) kiemSourceUrl(muc.sourceUrl);   // §11 — cảnh báo không nguồn

  /*
   * ⚠️ MIỄN QUÉT SỐ DÀI CHO ĐÚNG MỘT TRƯỜNG, CỦA ĐÚNG MỘT NGUỒN.
   * `sourceUrl` của nguồn A đã qua `kiemSourceUrl` ở trên. Mọi trường khác — kể
   * cả `sourceUrl` của nguồn khác — vẫn bị quét như cũ.
   */
  const so = timSoTrongChuoi(laNguonA ? { ...muc, sourceUrl: undefined } : muc);
  if (so) throw new LoiIntel('MUC_CHUA_CHUOI_SO_DAI', so);

  for (const truong of ['tomTat', 'tomTatEn']) {
    if (muc[truong] !== undefined && muc[truong] !== null) {
      if (typeof muc[truong] !== 'string') throw new LoiIntel('TOM_TAT_KHONG_HOP_LE');
      if (muc[truong].length > TOI_DA_TOM_TAT) throw new LoiIntel('TOM_TAT_QUA_DAI', truong);
    }
  }
  if (muc.ngayCongBo !== undefined) {
    const ngay = typeof muc.ngayCongBo === 'string' ? muc.ngayCongBo : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || Number.isNaN(Date.parse(ngay))) {
      throw new LoiIntel('NGAY_CONG_BO_KHONG_HOP_LE');
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

/**
 * Khoá của một mục: `id` nếu có, không thì mã thủ đoạn.
 *
 * ⚠️ TRƯỚC ĐÂY CHỈ DÙNG MÃ THỦ ĐOẠN. Công an Lâm Đồng và Hưng Yên cùng cảnh báo
 * "lấy lại tiền bị lừa" thì cảnh báo sau đè mất cảnh báo trước. Mục cũ không có
 * `id` vẫn khoá theo mã thủ đoạn, nên mọi chỗ gọi cũ vẫn chạy.
 */
const khoaCua = (m) => m.id ?? m.maThuDoan;

function taoKho() {
  const muc = new Map();
  return {
    /** Mọi mục vào kho đều ở `cho_duyet`. KHÔNG có đường nào nhập thẳng `da_duyet`. */
    them(m) {
      kiemMuc(m);
      const ban = { ...m, trangThai: 'cho_duyet', duyetBoi: null };
      muc.set(khoaCua(m), ban);
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

/**
 * Nạp tệp `backend/data/canh-bao-chinh-thuc.json` vào kho.
 *
 * ⚠️ VẪN ĐI QUA CỔNG DUYỆT. Tệp ghi `duyet: { boi, luc }` cho mục đã có người
 * duyệt, nhưng mục vẫn vào kho bằng `them()` — tức là `cho_duyet` — rồi mới qua
 * `duyet()` với đúng tên đó. Trường `trangThai` hay `duyetBoi` tự khai trong tệp
 * bị bỏ đi trước khi nạp: không có đường nào nhập thẳng trạng thái đã duyệt.
 *
 * ⚠️ MỘT MỤC HỎNG KHÔNG LÀM HỎNG CẢ TỆP. Lỗi được gom lại để kể ra; máy chủ
 * không được sập chỉ vì một đường dẫn gõ sai.
 */
function napTuDuLieu(kho, duLieu) {
  const ketQua = { nap: 0, daDuyet: 0, loi: [] };
  const ds = duLieu && Array.isArray(duLieu.canhBao) ? duLieu.canhBao : [];

  for (const tho of ds) {
    if (!tho || typeof tho !== 'object') {
      ketQua.loi.push({ id: null, ma: 'MUC_KHONG_HOP_LE' });
      continue;
    }
    // eslint-disable-next-line no-unused-vars
    const { duyet, trangThai, duyetBoi, ...m } = tho;
    try {
      kho.them(m);
      ketQua.nap += 1;
      const nguoi = duyet && typeof duyet.boi === 'string' ? duyet.boi.trim() : '';
      if (nguoi) {
        kho.duyet(khoaCua(m), nguoi);
        ketQua.daDuyet += 1;
      }
    } catch (e) {
      ketQua.loi.push({ id: m.id ?? null, ma: e && e.ma ? e.ma : 'LOI_KHONG_RO' });
    }
  }
  return ketQua;
}

module.exports = {
  taoKho, kiemMuc, kiemSourceUrl, napTuDuLieu, timDanhTinh, timSoTrongChuoi, LoiIntel,
  TRUONG_DANH_TINH, TRANG_THAI, NGUON, NGUONG_BAO_CAO_TOI_THIEU, TOI_DA_TOM_TAT,
};
