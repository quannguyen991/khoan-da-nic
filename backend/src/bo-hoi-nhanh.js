'use strict';
/**
 * §15.3.3 · §15.11.1 — BỘ HỎI NHANH LÚC ĐANG BỊ GỌI.
 *
 * ⚠️ §15.8 — ĐÂY LÀ KÊNH ĐẦU VÀO MỚI, KHÔNG PHẢI MỨC CAN THIỆP MỚI.
 *   `canThiep` vẫn đúng NĂM giá trị. KHÔNG thêm `LIVE_CALL`.
 *   Mọi câu trả lời đẩy `maLyDo` vào CÙNG `decision-engine.js` ra mức.
 *   `aiDaChay: false` — chạy offline, thuần luật, dưới 1 giây. Không gọi mạng.
 *
 * ⚠️ §15.3.3 — KHÔNG THÊM OVERRIDE THỨ 11. Bộ luật hiện có đã bắt trọn:
 *   OTP + chuyển tiền là CO-01 · "tài khoản an toàn" là CO-03 ·
 *   bí mật + đe doạ + chuyển tiền là CO-05 · cài app lạ là CO-02.
 *
 * §6.10 — câu trả lời tạo `source=user_confirmed`, `confidence=1.0`. Nó BỔ SUNG
 * tín hiệu, KHÔNG được xoá direct signal đã có.
 *
 * Hàm thuần. Không mạng, không AI, không đồng hồ.
 */

/**
 * §15.3.3 — tám câu, mỗi màn MỘT câu, chỉ CÓ/KHÔNG, không bàn phím.
 *
 * ⚠️ §15.13 — câu "nói gì với ngân hàng" ĐẶT Ở VỊ TRÍ THỨ HAI, không phải cuối.
 * Nhân viên ngân hàng là hàng rào cuối cùng, và kẻ lừa đảo BIẾT điều đó nên luôn
 * dặn bác nói dối. Không có giao dịch tử tế nào cần nói dối ngân hàng.
 */
const CAU_HOI = Object.freeze([
  { ma: 'ho_bao_dung_cup_may', tinHieu: 'MAN_KEEP_CALL_ACTIVE' },
  { ma: 'co_ai_dan_noi_gi_voi_ngan_hang', tinHieu: 'MAN_SECRECY', ghiChuVuViec: true },
  { ma: 'ho_bao_dung_noi_voi_ai', tinHieu: 'MAN_SECRECY' },
  { ma: 'ho_noi_sap_bi_bat_hoac_phat', tinHieu: 'MAN_FEAR_THREAT' },
  { ma: 'ho_bao_chuyen_tien_hoac_rut_tien', tinHieu: 'FIN_TRANSFER_REQUEST' },
  { ma: 'ho_xin_ma_trong_tin_nhan', tinHieu: 'CRED_OTP_SHARE' },
  { ma: 'ho_nhac_tai_khoan_an_toan', tinHieu: 'FIN_SAFE_ACCOUNT' },
  { ma: 'ho_bao_cai_ung_dung_hoac_bam_link', tinHieu: 'DEV_INSTALL_APK_UNKNOWN' },
]);

/**
 * §15.11.1 — hỏi HÀNH ĐỘNG trước, hỏi dấu hiệu sau. Rút thời gian tới kết luận
 * từ ~20 giây xuống ~8 giây.
 *
 * ⚠️ `khong_ro` và `gui_giay_to` KHÔNG sinh tín hiệu và KHÔNG được dẫn tới mức
 * thấp — chúng sang bộ hỏi đầy đủ. Người không diễn đạt được mình đang gặp
 * chuyện gì là người CẦN GIÚP NHẤT, không phải người ít rủi ro nhất.
 */
const NHANH_HANH_DONG = Object.freeze([
  {
    ma: 'chuyen_tien',
    tinHieu: 'FIN_TRANSFER_REQUEST',
    hoiTiep: ['ho_noi_sap_bi_bat_hoac_phat', 'co_ai_dan_noi_gi_voi_ngan_hang', 'ho_nhac_tai_khoan_an_toan'],
  },
  {
    ma: 'doi_otp',
    tinHieu: 'CRED_OTP_SHARE',
    hoiTiep: ['ho_bao_chuyen_tien_hoac_rut_tien', 'ho_bao_dung_cup_may'],
  },
  {
    ma: 'cai_ung_dung',
    tinHieu: 'DEV_INSTALL_APK_UNKNOWN',
    hoiTiep: ['ho_bao_dung_cup_may', 'ho_noi_sap_bi_bat_hoac_phat'],
  },
  {
    // §15.11.1 — QUYẾT ĐỊNH 15/8/2026: KHÔNG thêm tín hiệu cho "gửi ảnh giấy tờ".
    // Thêm là đổi bảng điểm, kéo theo chạy lại eval và thêm ca âm.
    // ⚠️ LỖ HỔNG ĐÃ BIẾT, ghi lại để không ai tưởng đã phủ: tin nhắn CHỈ đòi ảnh
    // căn cước mà không kèm dấu hiệu nào khác có thể ra mức thấp.
    // Cạm bẫy nếu muốn vá: neg-app-16 trong bộ eval — "bác ra chi nhánh, mang
    // theo căn cước" là ngân hàng thật làm đúng. Phải bắt theo hình dạng
    // GỬI ảnh đi xa ≠ MANG giấy ra quầy.
    ma: 'gui_giay_to',
    tinHieu: null,
    sangBoHoiDayDu: true,
  },
  {
    ma: 'khong_ro',
    tinHieu: null,
    sangBoHoiDayDu: true,
  },
]);

const timCauHoi = (ma) => CAU_HOI.find((c) => c.ma === ma) || null;
const timNhanh = (ma) => NHANH_HANH_DONG.find((n) => n.ma === ma) || null;

/**
 * @returns {{tinHieu:string[], hoiTiep:string[], sangBoHoiDayDu:boolean}|null}
 */
function chonNhanh(maNhanh) {
  const n = timNhanh(maNhanh);
  if (!n) return null;
  return {
    tinHieu: n.tinHieu ? [n.tinHieu] : [],
    // Nhánh không rõ ⇒ đi HẾT bộ hỏi, không rút gọn.
    hoiTiep: n.sangBoHoiDayDu ? CAU_HOI.map((c) => c.ma) : [...n.hoiTiep],
    sangBoHoiDayDu: Boolean(n.sangBoHoiDayDu),
  };
}

/**
 * @param {object} traLoi  { maCauHoi: true|false }
 * @returns {Array} tín hiệu dạng chuẩn, source=user_confirmed
 *
 * ⚠️ Chỉ câu trả lời CÓ mới sinh tín hiệu. Trả lời KHÔNG là "chưa thấy dấu hiệu
 * này trong điều bác kể" — KHÔNG phải bằng chứng vắng mặt, và tuyệt đối không
 * được trừ điểm. §4.2: mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác.
 */
function tinHieuTuTraLoi(traLoi = {}) {
  const ra = new Map();
  for (const [ma, dapAn] of Object.entries(traLoi)) {
    if (dapAn !== true) continue;
    const c = timCauHoi(ma);
    if (!c || !c.tinHieu) continue;
    ra.set(c.tinHieu, {
      id: c.tinHieu,
      state: 'present',
      source: 'user_confirmed',
      confidence: 1.0,
      evidence: [{
        quote: ma, start: 0, end: ma.length, sourceId: 'bo_hoi_nhanh',
      }],
    });
  }
  return [...ra.values()];
}

/** Câu nào cần ghi chú vào hồ sơ vụ việc (§15.3.3 — câu về ngân hàng). */
function ghiChuVuViec(traLoi = {}) {
  return CAU_HOI
    .filter((c) => c.ghiChuVuViec && traLoi[c.ma] === true)
    .map((c) => c.ma);
}

module.exports = {
  CAU_HOI, NHANH_HANH_DONG, chonNhanh, tinHieuTuTraLoi, ghiChuVuViec,
  timCauHoi, timNhanh,
};
