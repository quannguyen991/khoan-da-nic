/**
 * ═════ "NÓI GÌ VỚI BỐ MẸ" — ba câu cho người con, ngay trong thẻ cảnh báo (23/9/2026) ═════
 *
 * Con nhận cảnh báo cũng đang hoảng. Gọi được rồi mà mở đầu bằng "sao bố lại tin?"
 * là bố mẹ im lặng, giấu chuyện — đúng thứ kẻ lừa muốn.
 *
 * Mỗi bộ đúng BA câu ngắn, theo thứ tự:
 *   ① một việc làm ngay (cúp máy / đừng đọc mã / đừng mở app)
 *   ② một câu ĐỔ LỖI CHO THỦ ĐOẠN, không đổ lỗi cho bố mẹ (§11 — không trách người dùng)
 *   ③ một câu trấn an — riêng khi tiền đã ra: việc con làm cùng (gọi ngân hàng), vì lúc
 *      đó trấn an suông là phí mất phút đầu tiên
 *
 * ⚠️ §11 — không câu nào khẳng định người gọi là tội phạm, không câu nào hứa lấy lại tiền.
 * ⚠️ Là KHOÁ CATALOG — Guardian dịch qua t(). Thêm loại sự kiện mới thì thêm bộ câu ở đây.
 */
export type LoaiSuKien = 'ket_qua_kiem' | 'ket_qua_nghi_ngo' | 'chua_kiem_duoc' | 'otp_trong_cuoc_goi' | 'cai_app_trong_cuoc_goi' | 'tien_ra_trong_cuoc_goi';

const CAU_CUOI = 'Con ở đây rồi, không sao đâu.';

export const CAU_NOI_VOI_BO_ME: Record<LoaiSuKien, readonly [string, string, string]> = {
  otp_trong_cuoc_goi: [
    'Bố/mẹ cúp máy đi, đừng đọc mã cho ai.',
    'Ngân hàng không bao giờ gọi xin mã.',
    CAU_CUOI,
  ],
  cai_app_trong_cuoc_goi: [
    'Bố/mẹ cúp máy đi, đừng mở app vừa cài.',
    'Bọn này giả làm cơ quan rất giống, ai cũng dễ tin.',
    CAU_CUOI,
  ],
  tien_ra_trong_cuoc_goi: [
    'Bố/mẹ cúp máy đi, đừng chuyển thêm.',
    'Bọn này giả làm cơ quan rất giống, ai cũng dễ tin.',
    'Con gọi ngân hàng ngay với bố/mẹ.',
  ],
  ket_qua_kiem: [
    'Bố/mẹ cúp máy đi, chưa chuyển gì nhé.',
    'Bọn này giả làm cơ quan rất giống, ai cũng dễ tin.',
    CAU_CUOI,
  ],
  // 3/10/2026 — mức giữa: chưa chắc là lừa đảo, nên KHÔNG khẳng định đó là thủ đoạn.
  ket_qua_nghi_ngo: [
    'Bố/mẹ khoan làm theo, chờ con xem cùng.',
    'Tin kiểu này nhìn rất giống thật, ai cũng dễ nhầm.',
    CAU_CUOI,
  ],
  // Chưa kiểm được ≠ có chuyện: giọng hỏi thăm, KHÔNG trấn an "không sao" về thứ chưa kiểm.
  chua_kiem_duoc: [
    'Con hỏi thăm thôi, bố/mẹ vừa nhận gì ạ?',
    'Có gì lạ, bố/mẹ cứ gửi con xem trước nhé.',
    'Chưa chắc có chuyện gì, mình cùng xem nhé.',
  ],
};

export function cauNoiVoiBoMe(loai: string | undefined): readonly [string, string, string] {
  return CAU_NOI_VOI_BO_ME[(loai as LoaiSuKien)] ?? CAU_NOI_VOI_BO_ME.ket_qua_kiem;
}
