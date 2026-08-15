/**
 * CÓ DÍNH CUỘC GỌI KHÔNG?
 *
 * ══════════ VÌ SAO CÓ TỆP NÀY ══════════
 *
 * §15.9.1 trước đây ép `chua_nghe_duoc_cuoc_goi` vào `chuaKiem` của MỌI lượt,
 * không ngoại lệ. Lý do gốc là đúng và không đổi: Khoan Đã **không nghe được
 * cuộc gọi** — Android chặn luồng âm thanh cuộc gọi từ bản 10 — nên nó không
 * bao giờ được để người dùng tin rằng cuộc gọi đã được kiểm (§4.3).
 *
 * Nhưng ép vào MỌI lượt thì trả giá ở chỗ khác. §HĐ luật 3 buộc `chuaKiem` hiện
 * **cùng cỡ chữ với nhãn**. Nghĩa là bác dán một tin nhắn — không có cuộc gọi
 * nào trong đời thực — và màn hình vẫn dành một nửa cỡ chữ tiêu đề để nói về
 * một cuộc gọi không tồn tại. Câu đó xuất hiện ở 100% số lượt, không bao giờ
 * đổi, nên nó dạy người dùng bỏ qua vùng `chuaKiem`. Rồi tới lượt câu THẬT SỰ
 * quan trọng — "chỉ nghe được phần đầu" — cũng bị bỏ qua nốt. §4.6 đã gọi tên
 * đúng cơ chế này: báo động không đổi thì người ta ngừng đọc.
 *
 * ══════════ LUẬT ══════════
 *
 * ⚠️ MẶC ĐỊNH LÀ **GIỮ**. Chỉ bỏ khi CHẮC CHẮN không có cuộc gọi nào dính vào.
 * Nghi ngờ ⇒ giữ. Đây là hướng an toàn: thừa một câu thì phiền, thiếu một câu
 * thì người ta tin nhầm rằng cuộc gọi đã được kiểm.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI ĐƯỜNG HẠ MỨC. §12 cấm thêm cụm từ nào hạ mức vô điều kiện.
 * Tệp này KHÔNG chạm tới điểm, tới nhãn, tới `canThiep`. Nó chỉ quyết định một
 * dòng chữ trong `chuaKiem` có được nói ra hay không. Kẻ lừa đảo soạn câu để
 * lọt qua đây cũng chỉ đạt được đúng một việc: làm màn hình bớt đi một lời cảnh
 * báo phụ — trong khi nhãn, điểm và màn can thiệp giữ nguyên.
 */

'use strict';

const { boDau } = require('./context-builder');

/**
 * Cụm chỉ dấu có cuộc gọi / có người nói.
 *
 * ⚠️ VIẾT KHÔNG DẤU, và so trên bản đã bỏ dấu. Người cao tuổi gõ thiếu dấu là
 * chuyện thường, và OCR cũng hay rụng dấu. So bản có dấu thì "goi dien" trượt.
 *
 * ⚠️ `\bgoi\b` KHÔNG dùng được: "gọi" bỏ dấu ra "goi", trùng với "gói" (gói
 * hàng, gói cước) và "gòi". Nên phải đi kèm ngữ cảnh — "goi dien", "cuoc goi",
 * "goi cho", "ai goi", "vua goi", "goi toi", "goi den".
 */
const CO_GOI = new RegExp([
  'cuoc goi', 'goi dien', 'dien thoai', 'goi cho', 'goi toi', 'goi den',
  'vua goi', 'moi goi', 'ai goi', 'nguoi goi', 'so la', 'tong dai',
  'nhac may', 'bat may', 'a lo', 'alo', 'noi chuyen', 'ho noi', 'ho bao',
  'ban ghi am', 'ghi am', 'video call', 'goi video', 'zalo call',
  // tiếng Anh
  'phone call', 'called me', 'calling', 'caller', 'hotline', 'on the phone',
  'voice ?mail', 'answer the call', 'hung up', 'they said',
].join('|'), 'i');

/**
 * Có gì trong lượt này dính tới một cuộc gọi không?
 *
 * @param {object} input — nguyên vẹn đầu vào của `analyze()`
 * @returns {boolean} true ⇒ PHẢI giữ `chua_nghe_duoc_cuoc_goi`
 */
function coDinhCuocGoi(input = {}) {
  /*
   * ⚠️ ĐƯỜNG GHI ÂM LUÔN GIỮ. Bác bấm micro nghĩa là bác đang kể lại một việc
   * vừa nghe — gần như luôn là một cuộc gọi. Và đây đúng là ca mà hiểu nhầm
   * "app đã nghe cuộc gọi" nguy hiểm nhất, vì bác vừa nói vào micro thật.
   * Xem luật ④ trong `components/GhiAm.tsx`.
   */
  if (input.ghiAm) return true;

  /*
   * ⚠️ BỘ HỎI NHANH LUÔN GIỮ. §15.9.1 nói rõ: bác trả lời hết bảng hỏi cũng
   * KHÔNG biến nó thành `nghe_cuoc_goi`. Bảng hỏi hỏi VỀ cuộc gọi.
   */
  if (input.traLoiBoHoiNhanh && Object.keys(input.traLoiBoHoiNhanh).length > 0) return true;

  /* Vụ việc đang theo dõi có thể đã ghi nhận một cuộc gọi ở lượt trước. */
  if (input.caseContext) return true;

  /*
   * ⚠️ QUÉT MỌI CHỖ CÓ CHỮ, không chỉ `vanBan`. Chữ trích từ ảnh (OCR) cũng có
   * thể nói về cuộc gọi — bỏ sót nó là bỏ sót đúng ca đáng giữ nhất.
   */
  const nguon = [input.vanBan, input.ocrText, input.anhVanBan, input.transcript]
    .filter((s) => typeof s === 'string' && s.trim());

  /*
   * ⚠️ KHÔNG CÓ CHỮ NÀO ⇒ GIỮ. Không đọc được gì thì không kết luận được gì —
   * đó đúng là §4.3. "Chưa quét được" khác "quét rồi, không thấy cuộc gọi".
   */
  if (nguon.length === 0) return true;

  return nguon.some((s) => CO_GOI.test(boDau(s.toLowerCase())));
}

module.exports = { coDinhCuocGoi, CO_GOI };
