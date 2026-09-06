'use strict';
/**
 * LỌC ỒN VÀ CHỐNG TRÙNG CHO LUỒNG THÔNG BÁO ĐẾN.
 *
 * ══════════ VÌ SAO PHẦN NÀY LÀ JAVASCRIPT, KHÔNG PHẢI JAVA ══════════
 * Lớp `DocThongBao.java` cũng lọc, và đó là đúng — lọc sớm ở native thì thông
 * báo của app nhạc không bao giờ rời khỏi tiến trình. Nhưng nếu CHỈ có bản Java
 * thì không test tự động được (máy dựng không có Android SDK), và mọi thay đổi
 * đều phải kiểm bằng mắt trên máy thật.
 *
 * Nên: Java lọc THÔ (chỉ nhận app nhắn tin), tệp này lọc TINH và chống trùng —
 * và tệp này có test. Hai tầng lọc, không phải hai bản sao của một tầng.
 *
 * ══════════ §4.3 ÁP CẢ Ở ĐÂY ══════════
 * "Bỏ qua vì là app nhạc" KHÁC "bỏ qua vì không đọc được". Mọi lượt bỏ qua đều
 * trả về LÝ DO, và tầng gọi phải phân biệt được hai loại: `bo_qua_on` thì im,
 * `khong_doc_duoc` thì phải khai ra.
 *
 * HÀM THUẦN + một cửa sổ chống trùng. Không mạng, không đồng hồ ẩn.
 */

/** Gói ứng dụng NHẮN TIN — nguồn duy nhất đáng phân tích cho luồng này. */
const GOI_NHAN_TIN = Object.freeze([
  'com.google.android.apps.messaging',
  'com.samsung.android.messaging',
  'com.android.mms',
  'com.android.messaging',
  'com.zing.zalo',
  'com.facebook.orca',
  'com.facebook.mlite',
  'org.telegram.messenger',
  'com.viber.voip',
  'com.whatsapp',
  'jp.naver.line.android',
]);

/**
 * Gói NGÂN HÀNG — thông báo biến động số dư và cảnh báo đăng nhập.
 *
 * ⚠️ DANH SÁCH NÀY CỐ Ý NGẮN VÀ CỐ Ý KHÔNG TỰ MỞ RỘNG. Mỗi gói thêm vào là một
 * bề mặt riêng tư rộng ra. §6.9 — không thu thập rộng hơn mức cần.
 */
const GOI_NGAN_HANG = Object.freeze([
  'com.VCB', 'com.vietinbank.ipay', 'com.bidv.smartbanking', 'com.vnpay.bidv',
  'com.mbmobile', 'com.tpb.mb.gprsandroid', 'com.vnpay.Agribank3g',
  'com.techcombank.bb.app', 'src.com.tpb', 'vn.com.techcombank.bb.app',
  'com.sacombank.ewallet', 'com.vpbankonline', 'com.acb.acbmobile',
]);

/**
 * Gói LUÔN BỎ QUA. Ngoài chuyện gây ồn, thông báo của chính Khoan Đã mà đi qua
 * bộ phát hiện là một vòng lặp: cảnh báo sinh ra thông báo, thông báo sinh ra
 * cảnh báo.
 */
const GOI_BO_QUA = Object.freeze([
  'vn.khoanda.app',
  'android', 'com.android.systemui', 'com.android.settings',
  'com.google.android.gms', 'com.google.android.apps.wellbeing',
]);

/** Hạng mục thông báo của Android mà ta không bao giờ cần. */
const HANG_MUC_BO_QUA = Object.freeze([
  'transport',      // trình phát nhạc / video
  'progress',       // tải xuống
  'service',        // service nền
  'sys',            // hệ thống
  'navigation',     // dẫn đường
  'stopwatch',      // đồng hồ
  'workout',
]);

/** Cửa sổ chống trùng. Zalo và app SMS bắn cùng một tin cách nhau vài giây. */
const CUA_SO_TRUNG_MS = 15_000;

/** Lý do bỏ qua — MÃ, và chúng chia làm HAI LOẠI, đừng trộn. */
const LY_BO_QUA = Object.freeze({
  // Loại 1 — ồn thật. Im lặng bỏ qua là đúng.
  on_app_khong_lien_quan: 'on_app_khong_lien_quan',
  on_hang_muc: 'on_hang_muc',
  on_chinh_khoan_da: 'on_chinh_khoan_da',
  trung_tin_da_xu_ly: 'trung_tin_da_xu_ly',
  // Loại 2 — KHÔNG đọc được. Phải khai ra (§4.3).
  khong_co_noi_dung: 'khong_co_noi_dung',
});

/** Loại 2 phải được khai; loại 1 thì không. Đây là ranh giới §4.3 ở tầng lọc. */
const PHAI_KHAI = Object.freeze(['khong_co_noi_dung']);

const laTinNhan = (goi) => GOI_NHAN_TIN.includes(goi);
const laNganHang = (goi) => GOI_NGAN_HANG.includes(goi);

/**
 * Khoá chống trùng: cùng NGƯỜI GỬI + cùng NỘI DUNG (đã chuẩn hoá) trong cửa sổ.
 *
 * ⚠️ KHÔNG DÙNG TÊN GÓI LÀM MỘT PHẦN CỦA KHOÁ. Cả điểm của việc chống trùng là
 * cùng một tin đến qua HAI gói khác nhau. Nhét gói vào khoá là vô hiệu hoá nó.
 *
 * ⚠️ KHOÁ LÀ BĂM RÚT GỌN, KHÔNG PHẢI NỘI DUNG. Bộ đệm chống trùng sống trong
 * bộ nhớ và có thể bị dump khi máy sập; giữ nguyên văn tin nhắn trong đó là
 * dựng một kho dữ liệu nhạy cảm mà không ai xin phép (§6.9).
 */
function khoaTrung(nguoiGui, noiDung) {
  const chuan = String(noiDung || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const ai = String(nguoiGui || '').replace(/[\s.()-]/g, '').replace(/^\+?84/, '0');
  return `${ai}|${bamNhanh(`${ai}::${chuan}`)}`;
}

/**
 * Băm 32-bit (FNV-1a). ĐỦ cho việc chống trùng trong 15 giây và KHÔNG đủ để
 * dựng lại nội dung — đó chính là điều mong muốn ở đây.
 * Không dùng `node:crypto` vì tệp này cũng chạy trong WebView.
 */
function bamNhanh(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/** Bộ chống trùng. Tự dọn mục hết hạn, nên không phình theo thời gian. */
function taoBoChongTrung(cuaSoMs = CUA_SO_TRUNG_MS) {
  const thay = new Map();   // khoá → thời điểm

  const don = (bayGio) => {
    for (const [k, t] of thay) if (bayGio - t > cuaSoMs) thay.delete(k);
  };

  return {
    daThay(nguoiGui, noiDung, bayGio = Date.now()) {
      don(bayGio);
      const k = khoaTrung(nguoiGui, noiDung);
      if (thay.has(k)) return true;
      thay.set(k, bayGio);
      return false;
    },
    coBaoNhieu: () => thay.size,
    xoaHet: () => thay.clear(),
  };
}

/**
 * Lọc một thông báo.
 *
 * @param {object} tb { goi, tieuDe, noiDung, hangMuc, thoiDiem, nguoiGui }
 * @param {object} tuyChon { boChongTrung, bayGio }
 * @returns {{nhan:boolean, ly:string|null, phaiKhai:boolean, tin?:object}}
 */
function locThongBao(tb = {}, tuyChon = {}) {
  const goi = String(tb.goi || '');
  const bayGio = Number(tuyChon.bayGio) || Number(tb.thoiDiem) || Date.now();

  const bo = (ly) => ({ nhan: false, ly, phaiKhai: PHAI_KHAI.includes(ly) });

  if (GOI_BO_QUA.includes(goi)) {
    return bo(goi === 'vn.khoanda.app' ? LY_BO_QUA.on_chinh_khoan_da : LY_BO_QUA.on_app_khong_lien_quan);
  }
  if (!laTinNhan(goi) && !laNganHang(goi)) return bo(LY_BO_QUA.on_app_khong_lien_quan);
  if (tb.hangMuc && HANG_MUC_BO_QUA.includes(String(tb.hangMuc))) return bo(LY_BO_QUA.on_hang_muc);

  const noiDung = typeof tb.noiDung === 'string' ? tb.noiDung.trim() : '';
  /*
   * ⚠️ THÔNG BÁO RỖNG PHẢI ĐƯỢC KHAI, KHÔNG ĐƯỢC IM LẶNG BỎ QUA.
   * Một thông báo đến từ app nhắn tin mà không đọc được nội dung là §4.3 nguyên
   * bản: ta BIẾT có một tin, và ta KHÔNG đọc được nó. Im lặng bỏ qua là biến
   * "chưa đọc được" thành "không có gì".
   */
  if (!noiDung) return bo(LY_BO_QUA.khong_co_noi_dung);

  const nguoiGui = tb.nguoiGui || tb.tieuDe || '';
  if (tuyChon.boChongTrung?.daThay(nguoiGui, noiDung, bayGio)) {
    return bo(LY_BO_QUA.trung_tin_da_xu_ly);
  }

  return {
    nhan: true,
    ly: null,
    phaiKhai: false,
    tin: {
      nguon: nguonTuGoi(goi),
      nguoiGui: String(nguoiGui),
      noiDung,
      thoiDiem: bayGio,
      goi,
    },
  };
}

/** Gói → mã nguồn của `detect.analyze()`. */
function nguonTuGoi(goi) {
  if (goi === 'com.zing.zalo') return 'zalo';
  if (goi === 'com.facebook.orca' || goi === 'com.facebook.mlite') return 'messenger';
  if (GOI_NHAN_TIN.includes(goi)) return 'sms';
  return 'thong_bao';
}

/**
 * ══════════ MẤT QUYỀN / SERVICE BỊ KILL ══════════
 *
 * ⚠️ BÁO CHO NGƯỜI THÂN, KHÔNG BÁO CHO NGƯỜI CAO TUỔI.
 *
 * Lý do không phải là giấu giếm: bác **không sửa được**. Đường vào nằm sâu
 * trong Cài đặt hệ thống, và trên máy Xiaomi/Oppo/Vivo còn phải qua bộ quản lý
 * pin riêng của hãng. Một thông báo "Khoan Đã đã mất quyền đọc thông báo" hiện
 * lên máy bác chỉ tạo ra lo lắng không giải quyết được — và tệ hơn, nó dạy bác
 * bỏ qua thông báo của Khoan Đã.
 *
 * ⚠️ NHƯNG KHÔNG ĐƯỢC GIẤU HẲN. Màn chính của bác phải hiện trạng thái "chưa
 * canh được" một cách bình thản, không phải hiện "đang bảo vệ bác". §4.3 lại
 * đúng ở đây: không canh được KHÁC canh và không thấy gì.
 */
const LOAI_MAT_CANH = Object.freeze({
  quyen_bi_thu_hoi: 'quyen_doc_thong_bao_bi_thu_hoi',
  service_bi_kill: 'service_bi_he_thong_kill',
  toi_uu_pin: 'bi_toi_uu_pin_chan',
  chua_cap_quyen: 'chua_cap_quyen_lan_nao',
});

function suKienMatCanh({ loai, tu, den = null, hangMay = null }) {
  if (!Object.values(LOAI_MAT_CANH).includes(loai)) throw new Error(`Loại mất canh lạ: ${loai}`);
  return {
    maSuKien: 'mat_kha_nang_canh',
    loai,
    tu,
    den,
    hangMay,
    // AI ĐƯỢC BÁO — đây là quyết định sản phẩm, không phải chi tiết kỹ thuật.
    baoCho: ['nguoi_than'],
    khongBaoCho: ['nguoi_cao_tuoi'],
    // Vào `khoangMu` của báo cáo tuần, để câu "tuần này không có gì đáng ngại"
    // không được phát cho một tuần mù.
    laKhoangMu: true,
    lyKhoangMu: loai,
  };
}

/** Đổi danh sách sự kiện mất canh thành `khoangMu` cho `bao-cao-tuan.js`. */
function khoangMuTuSuKien(danhSach = [], den = Date.now()) {
  return danhSach
    .filter((s) => s.laKhoangMu)
    .map((s) => ({ tu: s.tu, den: s.den ?? den, ly: s.lyKhoangMu }));
}

module.exports = {
  locThongBao, taoBoChongTrung, khoaTrung, bamNhanh, nguonTuGoi,
  suKienMatCanh, khoangMuTuSuKien,
  GOI_NHAN_TIN, GOI_NGAN_HANG, GOI_BO_QUA, HANG_MUC_BO_QUA,
  LY_BO_QUA, PHAI_KHAI, LOAI_MAT_CANH, CUA_SO_TRUNG_MS,
};
