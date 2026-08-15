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

/** Bảng TĨNH: mã nguồn đầu vào → mã hiển thị. Không sinh động, không nội suy. */
const NGUON = Object.freeze({
  van_ban: 'van_ban',
  anh_ocr: 'anh_ocr',
  url: 'url',
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
