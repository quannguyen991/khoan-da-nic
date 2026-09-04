'use strict';
/**
 * PHÁT HIỆN ỨNG DỤNG LẠ VỪA ĐƯỢC CÀI.
 *
 * ══════════ VÌ SAO ĐÂY LÀ TÍN HIỆU MẠNH NHẤT TRONG TẤT CẢ ══════════
 * Một người cao tuổi gần như KHÔNG BAO GIỜ tự cài app từ ngoài cửa hàng. Việc
 * đó đòi phải vào Cài đặt bật "cài từ nguồn không xác định" — một chuỗi thao
 * tác mà gần như chỉ có người khác đọc từng bước qua điện thoại mới làm nổi.
 *
 * Nên khi nó xảy ra, xác suất đang bị dẫn dắt là rất cao. Và đây đúng là chiêu
 * chiếm quyền điều khiển điện thoại phổ biến nhất hiện nay: cài xong thì kẻ gian
 * đọc được màn hình, đọc được mã OTP, và chuyển tiền bằng chính app ngân hàng
 * của bác.
 *
 * Khác với mọi luật trong `tang-0.js`: luật này không đọc chữ. Nó đọc MỘT SỰ
 * KIỆN CỦA HỆ ĐIỀU HÀNH, nên không có gì để kẻ gian viết khác đi cho né được.
 *
 * ══════════ KHÔNG TỰ GỠ, KHÔNG TỰ KHOÁ ══════════
 * §12 — sản phẩm chỉ báo và đề nghị. Module này KHÔNG có hàm gỡ app, KHÔNG có
 * hàm khoá máy, và đó là ràng buộc kiến trúc chứ không phải hạng mục chưa làm.
 * Gỡ nhầm một app bác cần (app ngân hàng, app của bệnh viện) là làm hỏng máy
 * của người khác, từ xa, dựa trên một suy đoán.
 *
 * HÀM THUẦN. Không mạng, không đồng hồ ẩn.
 */

const { che } = require('./tang-0');

/**
 * Cửa hàng chính thức. Tên GÓI của trình cài đặt, không phải tên miền.
 * ⚠️ `null` / chuỗi rỗng ⇒ KHÔNG có nguồn cài — đó là dấu hiệu MẠNH NHẤT
 * (cài bằng tệp APK tải tay), chứ KHÔNG phải "không biết nên bỏ qua" (§4.3).
 */
const KHO_CHINH_THUC = Object.freeze([
  'com.android.vending',              // Google Play
  'com.google.android.packageinstaller',   // — xem ghi chú bên dưới
  'com.android.packageinstaller',          // — xem ghi chú bên dưới
  'com.huawei.appmarket',             // AppGallery
  'com.sec.android.app.samsungapps',  // Galaxy Store
  'com.amazon.venezia',
]);

/**
 * ⚠️ HAI GÓI `packageinstaller` KHÔNG PHẢI CỬA HÀNG — VÀ ĐÓ LÀ BẪY Ở ĐÂY.
 *
 * Chúng là trình cài đặt của HỆ ĐIỀU HÀNH, thứ chạy khi người dùng mở một tệp
 * APK bằng tay. Nếu coi chúng là "chính thức" thì đúng ca nguy hiểm nhất —
 * bác được hướng dẫn tải tệp .apk rồi bấm cài — sẽ lọt sạch.
 *
 * Chúng nằm trong danh sách trên CHỈ để `nguonCaiDat()` phân loại được, và
 * `laKhoChinhThuc()` LOẠI chúng ra. Hai khái niệm khác nhau, đừng gộp.
 */
const TRINH_CAI_HE_THONG = Object.freeze([
  'com.google.android.packageinstaller', 'com.android.packageinstaller',
]);

const laKhoChinhThuc = (installer) => KHO_CHINH_THUC.includes(installer)
  && !TRINH_CAI_HE_THONG.includes(installer);

/** Phân loại nguồn cài. Mã, không phải câu (§HĐ luật 2). */
function nguonCaiDat(installer) {
  if (installer === null || installer === undefined || String(installer).trim() === '') {
    return 'khong_ro_nguon';          // cài bằng tệp APK tải tay — mạnh nhất
  }
  if (TRINH_CAI_HE_THONG.includes(installer)) return 'trinh_cai_he_thong';
  if (laKhoChinhThuc(installer)) return 'cua_hang_chinh_thuc';
  return 'ung_dung_khac';             // một app khác cài app này — hiếm và đáng ngờ
}

/**
 * DANH SÁCH TRẮNG — cho các trường hợp hợp lệ.
 *
 * ⚠️ CHỈ NGƯỜI THÂN THÊM ĐƯỢC, VÀ CHỈ TRONG CỬA SỔ THIẾT LẬP.
 *
 * Vì sao phải chặt: nếu app nào cũng thêm được vào danh sách trắng, thì bước
 * đầu tiên của kẻ lừa đảo là bảo bác thêm app của chúng vào đó. Và nếu danh
 * sách trắng vĩnh viễn thì một lần bị lừa lúc thiết lập là mở cửa mãi mãi.
 *
 * Cửa sổ mặc định 30 phút quanh lúc người thân đang cài hộ. Ngoài cửa sổ thì
 * mục mới KHÔNG được nhận — báo về cho người thân thay vì im lặng.
 */
const CUA_SO_THIET_LAP_MS = 30 * 60_000;

function taoDanhSachTrang() {
  const muc = new Map();       // goi → { themBoi, themLuc, ly }
  return {
    them(goi, { themBoi, themLuc, moThietLapLuc, ly = null }) {
      if (!themBoi) return { nhan: false, ly: 'thieu_nguoi_them' };
      if (typeof moThietLapLuc !== 'number') return { nhan: false, ly: 'khong_trong_cua_so_thiet_lap' };
      if (Math.abs(themLuc - moThietLapLuc) > CUA_SO_THIET_LAP_MS) {
        return { nhan: false, ly: 'ngoai_cua_so_thiet_lap' };
      }
      muc.set(goi, { themBoi, themLuc, ly });
      return { nhan: true, ly: null };
    },
    co: (goi) => muc.has(goi),
    lay: (goi) => muc.get(goi) || null,
    tatCa: () => [...muc.entries()].map(([goi, m]) => ({ goi, ...m })),
    bo: (goi) => muc.delete(goi),
  };
}

/**
 * Phân tích một sự kiện cài đặt.
 *
 * @param {object} suKien { goi, tenHienThi, installer, thoiDiem, laCapNhat }
 * @param {object} tuyChon { danhSachTrang }
 * @returns kết quả CÙNG HÌNH DẠNG với `detect.analyze()`, để luồng cảnh báo
 *          hai phía tiêu thụ được mà không cần nhánh riêng.
 */
function phanTichCaiDat(suKien = {}, tuyChon = {}) {
  const goi = String(suKien.goi || '').trim();
  const nguon = nguonCaiDat(suKien.installer);
  const trong = tuyChon.danhSachTrang?.co(goi) === true;

  /*
   * ⚠️ BẢN CẬP NHẬT KHÔNG PHẢI BẢN CÀI MỚI. Android bắn sự kiện cho cả hai, và
   * báo động mỗi lần một app tự cập nhật là báo động mỗi ngày.
   */
  const laCapNhat = suKien.laCapNhat === true;

  const luatKhopVoi = [];
  let nhan = 'CHUA_THAY';
  let maGiaiThich = 'KHONG_KHOP';

  if (!goi) {
    // §4.3 — sự kiện đến mà không đọc được tên gói: KHÔNG kết luận là sạch.
    return ketQua({
      nhan: 'NGHI_NGO', luatKhopVoi: ['R11'], maGiaiThich: 'KHONG_DOC_DUOC',
      chuaKiem: ['khong_doc_duoc_ten_ung_dung'], goi, nguon, suKien,
    });
  }

  if (!laCapNhat && !trong && nguon !== 'cua_hang_chinh_thuc') {
    nhan = 'CAO';
    luatKhopVoi.push('R11');
    maGiaiThich = 'APP_LA';
  }

  return ketQua({ nhan, luatKhopVoi, maGiaiThich, chuaKiem: [], goi, nguon, suKien, trong });
}

const { CAU } = require('./giai-thich');

function ketQua({ nhan, luatKhopVoi, maGiaiThich, chuaKiem, goi, nguon, suKien, trong = false }) {
  const laCao = nhan === 'CAO';
  return {
    nhan,
    diem: 0,                    // §4.2 — điểm là việc của decision-engine; ở đây không có tín hiệu văn bản nào để chấm
    luatKhopVoi,
    giaiThich: (CAU[maGiaiThich] || CAU.KHONG_KHOP).vi,
    maGiaiThich,
    maLyDo: laCao ? ['DEV_INSTALL_APK_UNKNOWN'] : [],
    tinHieu: laCao ? ['DEV_INSTALL_APK_UNKNOWN'] : [],
    /*
     * `DEV_INSTALL_APK_UNKNOWN` làm nổ critical override CO-02, nên ca này đi
     * thẳng lên PROTECTED_CRITICAL — đúng mức nó xứng đáng.
     */
    overrides: laCao ? ['CO-02'] : [],
    canThiep: laCao ? 'PROTECTED_CRITICAL' : 'TRUST_RECEIPT',
    chuaKiem,
    thucThe: { urls: [], soTaiKhoan: [], soTien: [] },
    doTre: 0,
    nguon: 'cai_dat_app',
    hoKichBan: laCao ? 'chiem_quyen_dieu_khien_may' : null,
    // ── Riêng của luật này ────────────────────────────────────────────
    ungDung: {
      goi,
      tenHienThi: suKien.tenHienThi || null,
      nguonCaiDat: nguon,
      installer: suKien.installer ?? null,
      thoiDiem: Number(suKien.thoiDiem) || null,
      trongDanhSachTrang: trong,
      laCapNhat: suKien.laCapNhat === true,
    },
    nguoiGui: che(suKien.installer || ''),
  };
}

/**
 * Nội dung cho phía người thân. §6.9 — tên gói và tên hiển thị KHÔNG phải dữ
 * liệu riêng tư của bác (chúng mô tả phần mềm, không mô tả bác), nên chúng được
 * gửi. Nội dung tin nhắn, danh bạ, ảnh thì không.
 */
function chiTietChoNguoiThan(kq) {
  return {
    maSuKien: 'ung_dung_la_vua_duoc_cai',
    goi: kq.ungDung.goi,
    tenHienThi: kq.ungDung.tenHienThi,
    nguonCaiDat: kq.ungDung.nguonCaiDat,
    thoiDiem: kq.ungDung.thoiDiem,
    nhan: kq.nhan,
    hanhDong: ['goi_ngay'],
    /*
     * ⚠️ KHÔNG CÓ 'go_ung_dung' TRONG DANH SÁCH HÀNH ĐỘNG, VÀ ĐỪNG THÊM.
     * §12 — sản phẩm chỉ báo. Gỡ app trên máy người khác từ xa là việc con cháu
     * phải làm cùng bố mẹ, không phải việc một nút bấm làm hộ.
     */
  };
}

module.exports = {
  phanTichCaiDat, nguonCaiDat, laKhoChinhThuc, taoDanhSachTrang, chiTietChoNguoiThan,
  KHO_CHINH_THUC, TRINH_CAI_HE_THONG, CUA_SO_THIET_LAP_MS,
};
