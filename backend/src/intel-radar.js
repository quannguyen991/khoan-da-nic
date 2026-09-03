'use strict';
/**
 * §5.3 — RA-ĐA THỦ ĐOẠN: TẦNG RUNTIME.
 *
 * ⚠️ RA-ĐA KHÔNG ĐƯỢC ĐỤNG VÀO MỨC RỦI RO.
 * §4.2: bộ luật duy nhất là `decision-engine.js`. Nếu Ra-đa cộng điểm được thì
 * một mục dữ liệu ngoài — thứ có thể bị đầu độc — sẽ đổi được kết luận. Ra-đa
 * chỉ trả về NGỮ CẢNH để hiển thị bên cạnh kết quả.
 *
 * ⚠️ §11 — "Yêu cầu này có dấu hiệu thường gặp trong các vụ lừa đảo."
 * Ra-đa mô tả THỦ ĐOẠN, không nói về người gửi. Không có câu nào ở đây quy kết
 * một cá nhân, vì không có dữ liệu cá nhân nào để mà quy kết.
 */

const { taoKho, NGUON } = require('./intel-store');

/**
 * @param {object} kho          kho intel (chỉ mục đã duyệt mới ra tới đây)
 * @param {object} envelope     kết quả phân tích
 * @returns {{maThuDoanTrung:string[], nguon:string[], soMuc:number, anhHuongMuc:false}}
 */
function traNguCanh(kho, envelope) {
  const daDuyet = kho.layDaDuyet();
  const hoKichBan = envelope?.hoKichBan ?? null;
  const maLyDo = new Set(envelope?.maLyDo ?? []);

  const trung = daDuyet.filter((m) => {
    if (hoKichBan && m.maThuDoan === hoKichBan) return true;
    if (Array.isArray(m.tinHieuLienQuan)) {
      return m.tinHieuLienQuan.some((t) => maLyDo.has(t));
    }
    return false;
  });

  return {
    maThuDoanTrung: trung.map((m) => m.maThuDoan),
    nguon: [...new Set(trung.map((m) => m.nguon))],
    soMuc: trung.length,
    // Khẳng định TRONG DỮ LIỆU TRẢ VỀ rằng Ra-đa không đổi mức. Frontend đọc
    // được, test đọc được, người đọc code đọc được.
    anhHuongMuc: false,
  };
}

/**
 * §4.2 — chứng minh bằng code: chạy pipeline có Ra-đa và không có Ra-đa phải ra
 * CÙNG MỘT MỨC. Hàm này để test gọi, và để chỗ ràng buộc có tên trong mã nguồn.
 */
function raDaKhongDoiMuc(envelopeKhongRaDa, envelopeCoRaDa) {
  return envelopeKhongRaDa.nhan === envelopeCoRaDa.nhan
    && envelopeKhongRaDa.score === envelopeCoRaDa.score
    && envelopeKhongRaDa.canThiep === envelopeCoRaDa.canThiep;
}

module.exports = { traNguCanh, raDaKhongDoiMuc, taoKho, NGUON };
