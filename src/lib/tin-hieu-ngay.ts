/**
 * ═════════ TÍN HIỆU GIA ĐÌNH ĐỔI MỖI NGÀY (DAILY FAMILY TOTEM) ═════════
 *
 * Thuật toán tất định 100% OFFLINE:
 * - Cả máy bố mẹ và máy con cháu giữ chung một `familySeed` sinh bằng CSPRNG (`crypto.getRandomValues`).
 * - Mỗi ngày theo múi giờ Việt Nam (`UTC+7`), cả hai máy tự tính ra CÙNG một bộ 3 thành tố:
 *   (8 Màu sắc × 16 Biểu tượng × 90 Số kiểm 2 chữ số = 11.520 tổ hợp), chống đoán mò.
 * - Hỗ trợ song ngữ `vi` / `en`, không gửi dữ liệu qua mạng (§12).
 */

export type NgonNguTotem = 'vi' | 'en';

export interface TinHieuNgay {
  ngay: string;
  mau: { ten: string; tenEn: string; maHex: string; nenHex: string };
  bieuTuong: { ten: string; tenEn: string; kyHieu: string };
  soKiem: number;
  chuoiHienThi: string;
}

const MAU_SAC = [
  { ten: 'Đỏ thẫm', tenEn: 'Deep Red', maHex: '#991b1b', nenHex: '#fee2e2' },
  { ten: 'Xanh lá', tenEn: 'Forest Green', maHex: '#166534', nenHex: '#dcfce7' },
  { ten: 'Xanh dương', tenEn: 'Ocean Blue', maHex: '#1e40af', nenHex: '#dbeafe' },
  { ten: 'Vàng cam', tenEn: 'Amber', maHex: '#9a3412', nenHex: '#ffedd5' },
  { ten: 'Tím đậm', tenEn: 'Royal Purple', maHex: '#5b21b6', nenHex: '#ede9fe' },
  { ten: 'Nâu đất', tenEn: 'Earth Brown', maHex: '#78350f', nenHex: '#fef3c7' },
  { ten: 'Xanh ngọc', tenEn: 'Teal', maHex: '#115e59', nenHex: '#ccfbf1' },
  { ten: 'Hồng sen', tenEn: 'Lotus Pink', maHex: '#9d174d', nenHex: '#fce7f3' },
];

const BIEU_TUONG = [
  { ten: 'Quả Xoài', tenEn: 'Mango', kyHieu: '🥭' },
  { ten: 'Hoa Sen', tenEn: 'Lotus', kyHieu: '🪷' },
  { ten: 'Quả Cam', tenEn: 'Orange', kyHieu: '🍊' },
  { ten: 'Con Mèo', tenEn: 'Cat', kyHieu: '🐱' },
  { ten: 'Cây Tre', tenEn: 'Bamboo', kyHieu: '🎋' },
  { ten: 'Bát Phở', tenEn: 'Pho Bowl', kyHieu: '🍜' },
  { ten: 'Quả Chuối', tenEn: 'Banana', kyHieu: '🍌' },
  { ten: 'Con Chim', tenEn: 'Bird', kyHieu: '🐦' },
  { ten: 'Hoa Mai', tenEn: 'Apricot Blossom', kyHieu: '🌼' },
  { ten: 'Quả Dưa Hấu', tenEn: 'Watermelon', kyHieu: '🍉' },
  { ten: 'Ấm Trà', tenEn: 'Teapot', kyHieu: '🫖' },
  { ten: 'Mặt Trời', tenEn: 'Sun', kyHieu: '☀️' },
  { ten: 'Con Cá', tenEn: 'Fish', kyHieu: '🐟' },
  { ten: 'Ngôi Sao', tenEn: 'Star', kyHieu: '⭐' },
  { ten: 'Chiếc Lá', tenEn: 'Leaf', kyHieu: '🍃' },
  { ten: 'Con Rùa', tenEn: 'Turtle', kyHieu: '🐢' },
];

export const SO_TO_HOP_TOTEM = MAU_SAC.length * BIEU_TUONG.length * 90; // 11.520 tổ hợp

export function layNgayVietNam(mocMs = Date.now()): string {
  const d = new Date(mocMs + 7 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function bam32BitKep(str: string, muoi: number): number {
  let hash = (2166136261 ^ muoi) >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  // Avalanche trộn bit chống lệch modulo
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;
  return hash >>> 0;
}

export function tinhTinHieuNgay(
  familySeed: string,
  mocMs = Date.now(),
  lang: NgonNguTotem = 'vi'
): TinHieuNgay {
  const seedSach = String(familySeed || '').trim().toUpperCase();
  const ngay = layNgayVietNam(mocMs);
  const goc = `KHOANDA_TOTEM_V2|${seedSach}|${ngay}`;
  const h1 = bam32BitKep(goc, 0x13579bdf);
  const h2 = bam32BitKep(goc, 0x2468ace0);

  const mau = MAU_SAC[h1 % MAU_SAC.length] ?? MAU_SAC[0]!;
  const bieuTuong = BIEU_TUONG[Math.floor(h1 / MAU_SAC.length) % BIEU_TUONG.length] ?? BIEU_TUONG[0]!;
  const soKiem = 10 + (h2 % 90);

  const tenMau = lang === 'en' ? mau.tenEn : mau.ten;
  const tenBt = lang === 'en' ? bieuTuong.tenEn : bieuTuong.ten;

  return {
    ngay,
    mau,
    bieuTuong,
    soKiem,
    chuoiHienThi: `${tenMau} · ${bieuTuong.kyHieu} ${tenBt} · ${soKiem}`,
  };
}

export function taoMaGiongGiaDinh(): string {
  const chu = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // độ dài 32 (lũy thừa 2 -> không lệch modulo)
  const buf = new Uint8Array(8);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < 8; i += 1) buf[i] = Math.floor(Math.random() * 256);
  }
  let kq = '';
  for (let i = 0; i < 8; i += 1) {
    kq += chu[(buf[i] ?? 0) & 31];
  }
  return kq;
}
