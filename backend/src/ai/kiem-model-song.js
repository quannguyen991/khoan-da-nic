'use strict';
/**
 * MODEL CÒN SỐNG KHÔNG — phép kiểm gọi thật, không hỏi biến môi trường.
 *
 * ⚠️ VÌ SAO TỆP NÀY TỒN TẠI.
 *
 * Ngày 16/9/2026 phát hiện nhà cung cấp đã gỡ `deepseek-v4-flash` từ 10/9. Sáu
 * ngày liền mọi lượt phân tích trên bản chạy thật rơi về rule-only, và KHÔNG có
 * gì kêu lên: `/api/suc-khoe` vẫn báo `aiCauHinh: true`, vì nó chỉ hỏi "biến
 * môi trường có giá trị không".
 *
 * Biến có giá trị ≠ model còn sống. Đó là cùng một họ lỗi với §4.3 — khai một
 * việc mình chưa thực sự kiểm. Tệp này đi hỏi câu còn lại: gọi thử một lượt.
 *
 * ⚠️ PHÂN BIỆT HAI LOẠI HỎNG, VÌ CHÚNG CẦN HAI CÁCH XỬ LÝ KHÁC NHAU:
 *
 *   MODEL_KHONG_TON_TAI — nhà cung cấp gỡ model. Tự nó KHÔNG khỏi. Cần người
 *                         vào đổi cấu hình rồi chạy lại bộ đánh giá.
 *   KHOA_KHONG_DUNG     — khoá sai hoặc hết hạn. Cũng cần người.
 *   LOI_TAM_THOI        — mạng chập, quá tải, hết giờ chờ. Thường tự khỏi.
 *
 * Gộp cả ba vào một chữ "lỗi AI" chính là lý do sáu ngày trôi qua mà không ai
 * biết phải làm gì.
 *
 * ⚠️ KHÔNG BAO GIỜ TRẢ KHOÁ, ĐỊA CHỈ MÁY CHỦ, HAY THÔNG ĐIỆP LỖI THÔ (§6.9).
 * Thông điệp lỗi của nhà cung cấp hay mang theo URL và đôi khi cả khoá. Tệp này
 * chỉ trả MÃ.
 */

/** Đệm kết quả trong một phút — phép kiểm không được thành máy đốt tiền. */
const HAN_DEM_MS = 60 * 1000;

/** Trần chờ riêng cho phép kiểm: nó phải nhanh hơn một lượt phân tích thật. */
const TRAN_CHO_MS = 8000;

/** Kho đệm. Truyền vào để test không phải chờ đồng hồ thật. */
function taoKho() {
  return { luc: 0, ketQua: null };
}

const KHO_CHUNG = taoKho();

/**
 * Đọc thông điệp lỗi thành MÃ.
 *
 * ⚠️ ĐỌC CẢ CHỮ LẪN MÃ SỐ. Nhà cung cấp ngày 16/9 trả HTTP 503 kèm câu tiếng
 * Việt "Không có kênh khả dụng cho model …", trong khi chuẩn OpenAI dùng
 * `model_not_found` với 404. Chỉ soi mã số thì trượt ca thứ nhất; chỉ soi chữ
 * thì trượt ca thứ hai.
 */
function docMaLoi(loi) {
  const msg = String(loi && loi.message ? loi.message : loi || '').toLowerCase();
  const status = Number(loi && loi.status) || 0;

  if (msg.includes('model_not_found')
    || msg.includes('không có kênh khả dụng')
    || msg.includes('khong co kenh kha dung')
    || msg.includes('model not found')
    || msg.includes('does not exist')) {
    return 'MODEL_KHONG_TON_TAI';
  }
  if (status === 401 || status === 403
    || msg.includes('unauthorized') || msg.includes('invalid api key')) {
    return 'KHOA_KHONG_DUNG';
  }
  return 'LOI_TAM_THOI';
}

/**
 * Gọi thử một lượt cực ngắn.
 *
 * @param {Function} goiChat  hàm gọi model (tiêm vào để test được)
 * @param {object}   tuyChon  { kho, bayGio, tenModel }
 * @returns {Promise<{modelSong:boolean, ma:string|null, model:string|null, giay:number, tuDem:boolean}>}
 */
async function kiemModelSong(goiChat, tuyChon = {}) {
  const kho = tuyChon.kho || KHO_CHUNG;
  const bayGio = typeof tuyChon.bayGio === 'number' ? tuyChon.bayGio : Date.now();
  const tenModel = tuyChon.tenModel ?? process.env.RISK_LLM_MODEL ?? null;

  if (kho.ketQua && bayGio - kho.luc < HAN_DEM_MS) {
    return { ...kho.ketQua, tuDem: true };
  }

  const batDau = Date.now();
  let ketQua;
  try {
    /*
     * Lời nhắc ngắn nhất có thể: phép kiểm này chạy mỗi phút, và mục đích của
     * nó là "đường đi tới model có thông không", không phải "model trả lời hay
     * không".
     */
    await goiChat(
      [{ role: 'user', content: 'ping' }],
      { maxTokens: 1, timeoutMs: TRAN_CHO_MS },
    );
    ketQua = { modelSong: true, ma: null, model: tenModel, giay: (Date.now() - batDau) / 1000 };
  } catch (loi) {
    /*
     * ⚠️ BẮT MỌI THỨ. Phép kiểm sức khoẻ mà tự ném thì nó làm chết đúng cái
     * endpoint sinh ra để báo tin hỏng — người vận hành mất luôn đường nhìn vào.
     */
    ketQua = {
      modelSong: false,
      ma: docMaLoi(loi),
      model: tenModel,
      giay: (Date.now() - batDau) / 1000,
    };
  }

  kho.luc = bayGio;
  kho.ketQua = ketQua;
  return { ...ketQua, tuDem: false };
}

module.exports = { kiemModelSong, taoKho, docMaLoi, HAN_DEM_MS, TRAN_CHO_MS };
