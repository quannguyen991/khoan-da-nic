'use strict';
/**
 * §2B.2 bước 8 — PHIẾU TIN CẬY, dựng từ BẢNG ÁNH XẠ TĨNH.
 *
 * §11 — những câu không được viết:
 *  - KHÔNG khẳng định một dấu hiệu cụ thể là VẮNG MẶT. Câu "Chưa thấy lời đe doạ
 *    hay xin mã OTP" đã từng phủ nhận đúng dấu hiệu đang nằm trong tin nhắn.
 *    Phiếu này chỉ liệt kê thứ ĐÃ THẤY và thứ CHƯA KIỂM ĐƯỢC — không bao giờ
 *    liệt kê thứ "không có".
 *  - KHÔNG hiển thị confidence của model như xác suất lừa đảo (§6.4).
 *
 * Phiếu trả về MÃ. Frontend tra catalog i18n để ra câu.
 */

/**
 * Bảng TĨNH: mã nguồn đầu vào → mã hiển thị. Không sinh động, không nội suy.
 *
 * ⚠️ PHẢI KHỚP `MA_DA_KIEM` trong scripts/xuat-hop-dong.js. Dòng lọc `daKiem`
 * dưới kia vứt IM LẶNG mọi mã không có ở đây — và ba mã đã từng bị vứt như thế
 * suốt một thời gian: ghi_am, thong_bao_tin_nhan, bo_hoi_nhanh. Phiếu khai
 * thiếu thứ nó đã kiểm, không ai thấy, vì chiều sai này không làm đỏ test nào.
 *
 * THÊM NGUỒN ĐẦU VÀO MỚI THÌ THÊM VÀO ĐÂY.
 * Hàng rào: test/nguon-da-kiem-day-du.test.js.
 */
const NGUON = Object.freeze({
  van_ban: 'van_ban',
  anh_ocr: 'anh_ocr',
  url: 'url',
  ghi_am: 'ghi_am',
  thong_bao_tin_nhan: 'thong_bao_tin_nhan',
  bo_hoi_nhanh: 'bo_hoi_nhanh',
  nguoi_than_xac_nhan: 'nguoi_than_xac_nhan',
});

/** Bảng TĨNH: mã giới hạn kèm theo từng lý do chưa kiểm được. */
const GIOI_HAN = Object.freeze({
  chua_nghe_duoc_cuoc_goi: 'chi_doc_duoc_van_ban',
  khong_doc_duoc_anh: 'anh_khong_giai_ma_duoc',
  khong_mo_duoc_link: 'ten_mien_khong_phan_giai',
  ai_khong_phan_hoi: 'chi_chay_bang_bo_luat',
  ai_khong_chay: 'chi_chay_bang_bo_luat',
  khong_nghe_duoc_ghi_am: 'ghi_am_khong_giai_ma_duoc',
  noi_dung_qua_dai: 'chi_doc_duoc_phan_dau',

  /**
   * §4.3 — BA KIỂU HỎNG KHÁC NHAU CỦA NGUỒN GHI ÂM, ba mã riêng.
   * Gộp lại thì Phiếu nói "không giải mã được" trong khi thật ra là "bác chưa
   * tải bộ nghe" — hai việc khác nhau, và một trong hai bác tự sửa được.
   */
  chua_tai_xong_model_nghe: 'chua_co_bo_nghe_tren_may',
  ghi_am_khong_co_tieng_noi: 'ghi_am_khong_co_tieng_noi',
  chi_nghe_duoc_phan_dau: 'chi_doc_duoc_phan_dau',

  /**
   * §15.4.1 — bốn chỗ hỏng của nguồn đọc thông báo, và §16.3.
   *
   * ⚠️ Bốn mã này ĐÃ có trong hợp đồng từ trước nhưng THIẾU ở bảng này, nên
   * `limitations` im lặng về chúng. `chuaKiem` thô vẫn tới được frontend nên
   * §HĐ luật 3 không bị phá — nhưng một trong hai đường hiển thị thì mù.
   *
   * ⚠️ `chua_thay_yeu_cau_da_xac_thuc` CỐ Ý không có ở đây. Xem §16.3 và
   * test/nguon-da-kiem-day-du.test.js — nó là trạng thái BÌNH THƯỜNG.
   */
  chi_doc_duoc_mot_phan_tin: 'chi_doc_duoc_mot_phan_tin',
  thong_bao_khong_co_noi_dung: 'thong_bao_khong_co_noi_dung',
  thong_bao_da_bi_xoa: 'thong_bao_da_bi_xoa',
  chua_lien_lac_duoc_nguoi_than: 'chua_lien_lac_duoc_nguoi_than',
});

function buildTrustReceipt(envelope) {
  const chuaKiem = [...(envelope.chuaKiem || [])];

  // §11 — phải nói rõ AI có chạy hay không, không mập mờ.
  if (!envelope.aiDaChay && !chuaKiem.includes('ai_khong_chay')) {
    chuaKiem.push('ai_khong_chay');
  }

  const limitations = [...new Set(
    chuaKiem.map((ma) => GIOI_HAN[ma]).filter(Boolean),
  )];

  return {
    nhan: envelope.nhan,
    maLyDo: [...envelope.maLyDo],
    daKiem: (envelope.daKiem || []).filter((n) => NGUON[n]),
    chuaKiem,
    limitations,
    aiDaChay: envelope.aiDaChay,
    // §4.1 — dòng giải thích bắt buộc, để frontend tra catalog:
    // "AI extracted the signals. The final risk level was determined by fixed safety rules."
    maGiaiThich: 'ai_bat_co_luat_quyet_dinh',
    soTinHieu: envelope.maLyDo.length,
    overrides: [...(envelope.overrides || [])],
  };
}

module.exports = { buildTrustReceipt, NGUON, GIOI_HAN };
