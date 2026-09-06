'use strict';
/**
 * TẦNG 2 — ĐỐI CHIẾU MÁY CHỦ. BẤT ĐỒNG BỘ, 1–3 GIÂY, KHÔNG CHẶN TẦNG 0.
 *
 * ══════════════════ BỐN RÀNG BUỘC, KHÔNG CÁI NÀO LÀ TUỲ CHỌN ══════════════════
 *
 * 1. TẦNG 2 CHỈ NÂNG NHÃN, KHÔNG BAO GIỜ HẠ (§4.2).
 *    Máy chủ nói "chưa thấy tên miền này trong danh sách" KHÔNG có nghĩa là tên
 *    miền lành — chỉ có nghĩa là chưa ai báo. Đây đúng dạng lỗi §4.3, và nó là
 *    dạng lỗi nguy hiểm nhất ở tầng này vì kết luận đến từ một "cơ sở dữ liệu"
 *    nghe rất đáng tin.
 *
 * 2. HỎNG MẠNG KHÔNG PHẢI LỖI CỦA BÁC. Quá hạn, mất sóng, máy chủ chết đều trả
 *    về nguyên nhãn tầng 0, KHÔNG hiện thông báo lỗi. Bác đang bị dồn ép thì
 *    một hộp thoại "Lỗi kết nối 503" là thứ vô dụng nhất có thể hiện ra.
 *
 * 3. §6.9 + PROMPT 3 — MẶC ĐỊNH KHÔNG GỬI TOÀN VĂN TIN NHẮN.
 *    Chỉ gửi tên miền và BĂM của số tài khoản. Toàn văn chỉ đi khi bác tự bật
 *    công tắc "gửi để cải thiện hệ thống", và công tắc đó mặc định TẮT.
 *
 * 4. §11 + §12 — KHÔNG QUY KẾT CÁ NHÂN, KHÔNG CẢNH BÁO KHÔNG NGUỒN.
 *    Kho đối chiếu KHÔNG chứa tên, không chứa số điện thoại, không chứa số tài
 *    khoản dạng thô. Số tài khoản chỉ tồn tại ở dạng băm, và CHỈ nhận từ cảnh
 *    báo đã công bố chính thức — không nhận từ báo cáo cộng đồng lẻ. Mỗi mục
 *    BẮT BUỘC có `nguon`; thiếu nguồn là ném lỗi, không phải bỏ qua.
 */

const { nangNhan } = require('./tang-0');
const { CAU } = require('./giai-thich');

const THOI_HAN_MAC_DINH = 3000;

class LoiKhoXacMinh extends Error {
  constructor(ma) { super(ma); this.name = 'LoiKhoXacMinh'; this.ma = ma; }
}

/** Trường mang danh tính — kho TỪ CHỐI nhận, không phải lọc bỏ rồi nhận. */
const TRUONG_CAM = Object.freeze([
  'hoTen', 'ten', 'name', 'soDienThoai', 'phone', 'email', 'cccd', 'cmnd',
  'facebook', 'zalo', 'diaChi', 'address', 'nguoiBiTo', 'accused',
  'soTaiKhoan', 'accountNumber',
]);

/**
 * Băm một chuỗi. Chạy được ở CẢ Node lẫn WebView của Capacitor.
 * @returns {Promise<string>} hex SHA-256
 */
async function bam(chuoi) {
  const s = String(chuoi);
  const web = globalThis.crypto?.subtle;
  if (web) {
    const bytes = new TextEncoder().encode(s);
    const d = await web.digest('SHA-256', bytes);
    return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // eslint-disable-next-line global-require
  const { createHash } = require('node:crypto');
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

/**
 * Kho đối chiếu. Trong bản này là bộ nhớ trong; đường cắm cơ sở dữ liệu thật
 * nằm ở `napTu()`. Cố ý KHÔNG tự tải từ mạng — §12 cấm cho đường risk analysis
 * gọi mạng trực tiếp, và một kho tự kéo dữ liệu là đúng cánh cửa đó.
 */
function taoKhoXacMinh() {
  const tenMien = new Map();      // reg → { nguon, ngayCongBo, moTa }
  const bamTaiKhoan = new Map();  // hex  → { nguon, ngayCongBo }

  const kiem = (muc) => {
    if (!muc || typeof muc !== 'object') throw new LoiKhoXacMinh('MUC_KHONG_HOP_LE');
    if (!muc.nguon || typeof muc.nguon !== 'string') {
      // §11 — "cảnh báo KHÔNG CÓ NGUỒN" là câu bị cấm. Chặn ở cửa vào.
      throw new LoiKhoXacMinh('THIEU_NGUON');
    }
    for (const k of TRUONG_CAM) {
      if (k in muc) throw new LoiKhoXacMinh(`TRUONG_DANH_TINH:${k}`);
    }
  };

  return {
    themTenMien(reg, muc) {
      kiem(muc);
      tenMien.set(String(reg).toLowerCase(), {
        nguon: muc.nguon, ngayCongBo: muc.ngayCongBo || null, moTa: muc.moTa || null,
      });
      return true;
    },

    /**
     * ⚠️ NHẬN BĂM, KHÔNG NHẬN SỐ. Người gọi băm trước rồi mới đưa vào — kho
     * không bao giờ nhìn thấy một số tài khoản nào.
     */
    themBamTaiKhoan(hex, muc) {
      kiem(muc);
      if (!/^[0-9a-f]{64}$/.test(String(hex))) throw new LoiKhoXacMinh('BAM_SAI_DINH_DANG');
      bamTaiKhoan.set(String(hex), { nguon: muc.nguon, ngayCongBo: muc.ngayCongBo || null });
      return true;
    },

    napTu(danhSach = []) {
      let n = 0;
      for (const m of danhSach) {
        if (m.loai === 'ten_mien') { this.themTenMien(m.giaTri, m); n += 1; }
        else if (m.loai === 'bam_tai_khoan') { this.themBamTaiKhoan(m.giaTri, m); n += 1; }
      }
      return n;
    },

    /**
     * @returns {{trung:Array, coTrung:boolean}}
     * KHÔNG trả về nhãn. Việc ra nhãn là của `tinhChinhTang2`.
     */
    doiChieu({ tenMien: ds = [], bamSoTaiKhoan = [] } = {}) {
      const trung = [];
      for (const r of ds) {
        const m = tenMien.get(String(r).toLowerCase());
        if (m) trung.push({ loai: 'ten_mien', giaTri: String(r).toLowerCase(), ...m });
      }
      for (const h of bamSoTaiKhoan) {
        const m = bamTaiKhoan.get(String(h));
        // Không trả lại chính cái băm: nó là đầu vào của người gọi, không phải
        // thông tin mới, và trả lại chỉ tạo thêm một chỗ để rò.
        if (m) trung.push({ loai: 'so_tai_khoan', ...m });
      }
      return { trung, coTrung: trung.length > 0 };
    },

    coBaoNhieu: () => ({ tenMien: tenMien.size, bamTaiKhoan: bamTaiKhoan.size }),
    xoaHet: () => { tenMien.clear(); bamTaiKhoan.clear(); },
  };
}

/**
 * Dựng payload gửi lên máy chủ. §6.9 — TỐI THIỂU HOÁ, không phải "che bớt".
 *
 * @param {object} kq         kết quả `analyze()`
 * @param {object} tuyChon    { guiToanVan: boolean }  ← mặc định FALSE
 */
async function dungPayloadTang2(kq, tuyChon = {}) {
  const bamSoTaiKhoan = [];
  for (const s of kq.thucThe?.soTaiKhoan || []) bamSoTaiKhoan.push(await bam(s));

  const p = {
    tenMien: kq.tenMien || [],
    bamSoTaiKhoan,
    nhanTang0: kq.nhan,
    luatKhopVoi: kq.luatKhopVoi || [],
    phienBanLuat: kq.phienBanLuat,
  };

  /**
   * ⚠️ CÔNG TẮC MẶC ĐỊNH TẮT, VÀ NÓ PHẢI Ở ĐÂY CHỨ KHÔNG PHẢI Ở TẦNG GỌI.
   * Đặt mặc định ở tầng gọi nghĩa là mỗi nơi gọi có một mặc định riêng, và chỉ
   * cần một nơi quên là toàn văn tin nhắn của bác đi lên máy chủ.
   */
  if (tuyChon.guiToanVan === true) p.toanVan = kq.__toanVan || null;

  return p;
}

/**
 * TINH CHỈNH — CHỈ NÂNG.
 * @param {object} kq        kết quả `analyze()`
 * @param {object} doiChieu  kết quả `kho.doiChieu()`
 */
function tinhChinhTang2(kq, doiChieu, tuyChon = {}) {
  const ngonNgu = tuyChon.ngonNgu === 'en' ? 'en' : 'vi';
  if (!doiChieu?.coTrung) {
    /**
     * ⚠️ KHÔNG TRÙNG KHÔNG PHẢI LÀ SẠCH (§4.3).
     * Không đổi nhãn, và ghi rõ tầng 2 đã chạy mà không có gì để nói thêm —
     * chứ không ghi "đã kiểm, không thấy gì".
     */
    return {
      ...kq,
      tangDaChay: [...(kq.tangDaChay || []), 'tang_2'],
      tang2: { coTrung: false, daNang: false, nguon: [] },
    };
  }

  const nhanMoi = nangNhan(kq.nhan, 'CAO');
  const daNang = nhanMoi !== kq.nhan;

  return {
    ...kq,
    nhan: nhanMoi,
    maGiaiThich: 'T2_DA_BAO_CAO',
    giaiThich: CAU.T2_DA_BAO_CAO[ngonNgu],
    luatKhopVoi: [...(kq.luatKhopVoi || []), 'T2'],
    tangDaChay: [...(kq.tangDaChay || []), 'tang_2'],
    tang2: {
      coTrung: true,
      daNang,
      // §11 — cảnh báo phải có nguồn. Trả nguồn lên để màn hình hiện được.
      nguon: [...new Set(doiChieu.trung.map((t) => t.nguon))],
      loai: [...new Set(doiChieu.trung.map((t) => t.loai))],
    },
  };
}

/**
 * Gọi tầng 2 với hạn 3 giây. KHÔNG BAO GIỜ NÉM LỖI RA NGOÀI.
 *
 * @param {object} kq         kết quả `analyze()`
 * @param {Function} guiYeuCau  async (payload) => doiChieu — do tầng gọi cắm vào
 *                              (máy chủ dùng kho tại chỗ, Android dùng HTTP)
 */
async function chayTang2(kq, guiYeuCau, tuyChon = {}) {
  const thoiHan = Number(tuyChon.thoiHan) || THOI_HAN_MAC_DINH;
  if (typeof guiYeuCau !== 'function') return { ...kq, tang2: { coTrung: false, daNang: false, ly: 'KHONG_CO_DUONG_GUI' } };

  let hetGio;
  const dongHo = new Promise((giai) => {
    hetGio = setTimeout(() => giai({ __quaHan: true }), thoiHan);
  });

  try {
    const payload = await dungPayloadTang2(kq, tuyChon);
    const ra = await Promise.race([guiYeuCau(payload), dongHo]);
    if (ra?.__quaHan) {
      return { ...kq, tang2: { coTrung: false, daNang: false, ly: 'QUA_HAN' } };
    }
    return tinhChinhTang2(kq, ra, tuyChon);
  } catch {
    /**
     * ⚠️ NUỐT LỖI Ở ĐÂY LÀ CÓ CHỦ Ý, VÀ NÓ NUỐT THEO HƯỚNG AN TOÀN: giữ nguyên
     * nhãn tầng 0. Không có đường nào để một lỗi mạng làm HẠ nhãn.
     */
    return { ...kq, tang2: { coTrung: false, daNang: false, ly: 'LOI_MANG' } };
  } finally {
    clearTimeout(hetGio);
  }
}

module.exports = {
  taoKhoXacMinh, chayTang2, tinhChinhTang2, dungPayloadTang2, bam,
  LoiKhoXacMinh, TRUONG_CAM, THOI_HAN_MAC_DINH,
};
