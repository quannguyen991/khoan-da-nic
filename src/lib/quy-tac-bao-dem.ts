/**
 * ═════ BẢN SAO QUY TẮC "BÁO CHO CON" TRÊN MÁY BỐ MẸ — thêm 3/10/2026 ═════
 *
 * Quy tắc thật nằm ở MÁY CHỦ (chủ tài khoản đặt, §12). Máy bố mẹ giữ thêm một bản sao để
 * đường SMS dự phòng còn chạy được đúng lúc cần nhất: khi KHÔNG tới được máy chủ.
 *
 * ⚠️ BẢN SAO CHỈ ĐỂ ĐỌC, KHÔNG BAO GIỜ LÀ NGUỒN SỰ THẬT. Nó chỉ được ghi từ phản hồi của máy
 *    chủ (đọc hoặc đặt quy tắc thành công). Không có đường nào ghi vào đây từ chỗ khác — nên
 *    bản sao không thể bật cái mà bác chưa bật.
 * ⚠️ Thiếu / hỏng bản sao ⇒ `null` ⇒ KHÔNG gửi SMS. "Không biết bác đã bật chưa" khác hẳn "đã bật".
 * ⚠️ Chỉ các cờ đúng/sai. Không tên, không số điện thoại, không nội dung.
 */

const KHOA = 'khoan_da_quy_tac_bao_dem';

const CO = [
  'baoKhiCao', 'baoKhiNghiNgo', 'baoKhiChuaKiem', 'baoKhiOtpTrongCuocGoi', 'baoQuaSms', 'choConXemBaoVe',
] as const;

export type BanSaoQuyTac = Record<typeof CO[number], boolean>;

export function docQuyTacDem(): BanSaoQuyTac | null {
  try {
    const tho = JSON.parse(localStorage.getItem(KHOA) || 'null');
    if (!tho || typeof tho !== 'object') return null;
    const ra = {} as BanSaoQuyTac;
    for (const k of CO) ra[k] = tho[k] === true;   // chỉ `true` thật mới là bật
    return ra;
  } catch { return null; }
}

export function ghiQuyTacDem(quyTac: object | null | undefined): void {
  try {
    if (!quyTac || typeof quyTac !== 'object') return;
    const ra: Record<string, boolean> = {};
    for (const k of CO) ra[k] = (quyTac as Record<string, unknown>)[k] === true;
    localStorage.setItem(KHOA, JSON.stringify(ra));
  } catch { /* kho bị chặn: bản sao thiếu ⇒ không gửi SMS, an toàn hơn gửi nhầm */ }
}
