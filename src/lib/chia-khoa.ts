import type { MaKhoangTien } from '../tai-khoan';

/**
 * CHÌA KHOÁ THỨ HAI — bảng mã → khoá catalog cho giao diện (Phần 5, 23/9/2026).
 * Dùng chung cho màn của bố mẹ, màn ngân hàng mô phỏng và màn của con.
 * ⚠️ Khoảng tiền phải KHỚP `KHOANG_TIEN` ở `backend/src/chia-khoa-thu-hai.js`.
 */
export const NHAN_KHOANG: Record<MaKhoangTien, string> = {
  duoi_5: 'Dưới 5 triệu',
  '5_10': '5–10 triệu',
  '10_20': '10–20 triệu',
  '20_50': '20–50 triệu',
  tren_50: 'Trên 50 triệu',
};
export const NHAN_VIEC: Record<'chuyen_khoan' | 'rut_tien', string> = {
  chuyen_khoan: 'Chuyển khoản',
  rut_tien: 'Rút tiền',
};
export const NHAN_AI_BAO: Record<'nguoi_la' | 'nguoi_quen' | 'khong_ro', string> = {
  nguoi_la: 'Người lạ',
  nguoi_quen: 'Người quen',
  khong_ro: 'Không rõ',
};
export const NGUONG: (5 | 10 | 20 | 50)[] = [5, 10, 20, 50];

/**
 * Số tiền (triệu) → MÃ khoảng. Chạy TRÊN MÁY; số chính xác không rời máy (§6.9).
 */
export function khoangTuSo(trieu: number): MaKhoangTien | null {
  if (!Number.isFinite(trieu) || trieu < 0) return null;
  if (trieu < 5) return 'duoi_5';
  if (trieu < 10) return '5_10';
  if (trieu < 20) return '10_20';
  if (trieu < 50) return '20_50';
  return 'tren_50';
}
