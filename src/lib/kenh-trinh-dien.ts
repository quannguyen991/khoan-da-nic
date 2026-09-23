/**
 * ═════ KÊNH NỐI HAI MÁY TRONG MÀN TRÌNH DIỄN (`?trinhDien=1`, 23/9/2026) ═════
 *
 * Màn trình diễn đặt hai "máy" (hai <iframe> cùng nguồn) cạnh nhau. Chúng nói với
 * nhau qua `BroadcastChannel` của trình duyệt — KHÔNG qua máy chủ, KHÔNG qua mạng.
 * Nhờ vậy trình diễn không phụ thuộc Wi-Fi hội trường, và không đụng tài khoản,
 * cảnh báo hay số liệu thật nào.
 *
 * ⚠️ Chỉ màn trình diễn dùng tệp này. Đường thật đi qua `tai-khoan.ts` và máy chủ.
 * ⚠️ Tin chỉ mang MÃ (loại sự kiện, hành động, CO/KHONG) — y như đường thật (§6.9).
 */

export type MaKichBan = 'otp' | 'xung_con' | 'tien_ra';
export type VaiMay = 'bac' | 'con';

export type TinTrinhDien =
  /** Bảng điều khiển → hai máy: bắt đầu một tình huống. */
  | { loai: 'kich_ban'; ma: MaKichBan }
  | { loai: 'lam_lai' }
  /** Máy bác → máy con: như thông báo đẩy khi bác đã bật "báo cho con". */
  | { loai: 'bao_dong'; loaiSuKien: string; luc: number }
  /** Máy bác → máy con: bác vừa bấm gì trên màn cảnh báo (MÃ trong `HanhDong`). */
  | { loai: 'hanh_dong'; ma: string; luc: number }
  /** "Có phải con đang gọi không?" và câu trả lời. */
  | { loai: 'hoi_con'; hoiId: string; hetHan: number }
  | { loai: 'tra_loi'; hoiId: string; traLoi: 'CO' | 'KHONG'; luc: number }
  /** Cuộc gọi giả lập giữa hai máy: `tu` là máy gọi đi / máy vừa bấm. */
  | { loai: 'goi'; tu: VaiMay }
  | { loai: 'nghe'; tu: VaiMay }
  | { loai: 'cup'; tu: VaiMay };

export const MA_KICH_BAN: readonly MaKichBan[] = ['otp', 'xung_con', 'tien_ra'];

export function coKenh(): boolean {
  return typeof BroadcastChannel !== 'undefined';
}

/** Tên kênh đi qua địa chỉ iframe — chỉ nhận chữ thường và số, không nhận gì khác. */
export function tenKenhHopLe(x: string | null): string | null {
  return x && /^[a-z0-9]{6,24}$/.test(x) ? x : null;
}

export function moKenh(ten: string, khiCoTin: (tin: TinTrinhDien) => void) {
  const k = new BroadcastChannel(`khoan-da-trinh-dien-${ten}`);
  k.onmessage = (e: MessageEvent) => khiCoTin(e.data as TinTrinhDien);
  return {
    gui: (tin: TinTrinhDien) => k.postMessage(tin),
    dong: () => k.close(),
  };
}
