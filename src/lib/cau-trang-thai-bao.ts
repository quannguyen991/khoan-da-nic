/**
 * CÂU TRẠNG THÁI "ĐÃ BÁO CHO CON CHƯA" — Phần 3, 23/9/2026.
 *
 * Một dòng dưới nút gọi trên màn khẩn cấp của bố mẹ. Nói ĐÚNG điều máy chủ biết:
 *   DA_DAY_DI              → dịch vụ push đã NHẬN (không phải "con đã thấy")
 *   PUSH_DELIVERY_UNKNOWN  → không xác nhận được
 *   CHUA_BAT_NHAN / DANG_KY_HET_HAN → máy con chưa (hoặc không còn) bật nhận
 *   CHUA_CAU_HINH_PUSH     → máy chủ chưa có khoá gửi
 *
 * ⚠️ §9.4 / §11 — KHÔNG có câu "đã thấy", "đã đọc". Có test chặn.
 * ⚠️ Câu là KHOÁ catalog; người gọi đưa `t` vào để dịch (§4.1).
 */
export const CAU_TRANG_THAI = Object.freeze({
  DA_DAY_DI: 'Đã gửi tới máy {ten}',
  PUSH_DELIVERY_UNKNOWN: 'Chưa chắc đã tới máy {ten}',
  CHUA_BAT_NHAN: '{ten} chưa bật nhận cảnh báo',
  CHUA_CAU_HINH_PUSH: 'Máy chủ chưa bật gửi cảnh báo',
});

type Dong = { ten: string; trangThai: string };

export function cauTrangThaiBao(ketQua: Dong[], t: (s: string) => string): string {
  /*
   * §4.3 — THÊM 24/9/2026. Bố mẹ đã bật quy tắc báo nhưng CHƯA NỐI MÁY với ai: máy
   * chủ trả `gui: true, ketQua: []`, và bản trước ghép ra chuỗi rỗng — màn khẩn cấp
   * im lặng, bác tưởng con đã được báo. Không ai nhận thì phải NÓI là không ai nhận.
   */
  if (ketQua.length === 0) return t('Chưa nối máy với con cháu nào nên chưa báo được cho ai.');
  const nhom: Record<keyof typeof CAU_TRANG_THAI, string[]> = {
    DA_DAY_DI: [], PUSH_DELIVERY_UNKNOWN: [], CHUA_BAT_NHAN: [], CHUA_CAU_HINH_PUSH: [],
  };
  for (const d of ketQua) {
    const k = d.trangThai === 'DANG_KY_HET_HAN' ? 'CHUA_BAT_NHAN' : d.trangThai;
    if (k in nhom) nhom[k as keyof typeof nhom].push(d.ten);
  }
  const phan: string[] = [];
  for (const k of Object.keys(CAU_TRANG_THAI) as (keyof typeof CAU_TRANG_THAI)[]) {
    if (nhom[k].length === 0) continue;
    // Máy chủ chưa cấu hình là chuyện của máy chủ, không của từng người — nói MỘT lần.
    phan.push(k === 'CHUA_CAU_HINH_PUSH' ? t(CAU_TRANG_THAI[k]) : t(CAU_TRANG_THAI[k]).split('{ten}').join(nhom[k].join(', ')));
  }
  return phan.join(' · ');
}
