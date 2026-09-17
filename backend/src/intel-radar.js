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
 * @returns {{maThuDoanTrung:string[], nguon:string[], soMuc:number, canhBao:object[], anhHuongMuc:false}}
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

  /*
   * CẢNH BÁO CHÍNH THỨC ĐỂ HIỂN THỊ — chỉ nguồn A, tối đa hai.
   *
   * Xếp: mỗi DẤU HIỆU trùng được 2 điểm, trùng HỌ kịch bản được 1, bằng điểm
   * thì mới nhất trước.
   *
   * ⚠️ ĐẾM SỐ DẤU HIỆU TRÙNG, KHÔNG CHỈ HỎI "CÓ TRÙNG KHÔNG". Tin "tôi bên công
   * an kinh tế, hỗ trợ lấy lại tiền, bác nộp phí hồ sơ" ra họ `gia_danh_cong_an`
   * (dấu hiệu giả danh công an đứng đầu bảng họ). Chỉ hỏi có/không thì cảnh báo
   * giả danh công an chung chung (trùng họ + một dấu hiệu) thắng cảnh báo lấy
   * lại tiền (trùng hai dấu hiệu) — tức là đẩy đúng cảnh báo cần đọc xuống dưới.
   *
   * ⚠️ CHỈ TRẢ TRƯỜNG HIỂN THỊ. Không có `duyetBoi`: tên người duyệt là để truy
   * trách nhiệm nội bộ, không phải để hiện trên màn hình người đang bị lừa.
   */
  const canhBao = trung
    .filter((m) => m.nguon === NGUON.A_CHINH_THUC)
    .map((m) => {
      const soDauHieu = Array.isArray(m.tinHieuLienQuan)
        ? m.tinHieuLienQuan.filter((t) => maLyDo.has(t)).length
        : 0;
      const khopHo = Boolean(hoKichBan) && m.maThuDoan === hoKichBan;
      return { m, diem: soDauHieu * 2 + (khopHo ? 1 : 0) };
    })
    .sort((a, b) => b.diem - a.diem
      || String(b.m.ngayCongBo ?? '').localeCompare(String(a.m.ngayCongBo ?? '')))
    .slice(0, TOI_DA_CANH_BAO)
    .map(({ m }) => ({
      id: m.id ?? m.maThuDoan,
      coQuan: m.coQuan ?? null,
      ngayCongBo: m.ngayCongBo ?? null,
      tomTat: m.tomTat ?? null,
      tomTatEn: m.tomTatEn ?? null,
      sourceUrl: m.sourceUrl,
    }));

  return {
    maThuDoanTrung: trung.map((m) => m.maThuDoan),
    nguon: [...new Set(trung.map((m) => m.nguon))],
    soMuc: trung.length,
    canhBao,
    // Khẳng định TRONG DỮ LIỆU TRẢ VỀ rằng Ra-đa không đổi mức. Frontend đọc
    // được, test đọc được, người đọc code đọc được.
    anhHuongMuc: false,
  };
}

/** Hai cảnh báo là đủ. Nhiều hơn thì người đang hoảng không đọc hết. */
const TOI_DA_CANH_BAO = 2;

/**
 * Đọc đầu vào của `POST /api/ra-da` — CHỈ LẤY MÃ.
 *
 * ⚠️ KHÔNG NHẬN NỘI DUNG TIN NHẮN. Bản cũ nhận `vanBan` rồi phân tích lại trên
 * máy chủ: tin nhắn đi lên máy chủ lần thứ hai, và cảnh báo khớp theo một lượt
 * phân tích khác với lượt người dùng đang nhìn thấy. Giao diện đã có sẵn mã từ
 * kết quả trước; gửi mã là đủ, và không lộ thêm gì.
 *
 * Mã sai định dạng bị lọc bỏ, không đi vào đối chiếu.
 */
function docMaRaDa(body) {
  const b = body && typeof body === 'object' ? body : {};
  const hoKichBan = typeof b.hoKichBan === 'string' && /^[a-z][a-z0-9_]{1,60}$/.test(b.hoKichBan)
    ? b.hoKichBan
    : null;
  const maLyDo = Array.isArray(b.maLyDo)
    ? [...new Set(b.maLyDo.filter((x) => typeof x === 'string' && /^[A-Z][A-Z0-9_]{1,60}$/.test(x)))].slice(0, 60)
    : [];
  if (!hoKichBan && maLyDo.length === 0) return { ok: false, maLoi: 'THIEU_MA' };
  return { ok: true, hoKichBan, maLyDo };
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

module.exports = { traNguCanh, raDaKhongDoiMuc, docMaRaDa, taoKho, NGUON, TOI_DA_CANH_BAO };
