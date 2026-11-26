/**
 * ═════════ BỘ GIẢI MÃ MÃ VIETQR (EMVCo / NAPAS 247) — 100% OFFLINE ═════════
 *
 * - Đọc chuỗi TLV của VietQR hoàn toàn cục bộ theo độ dài byte UTF-8, không gọi mạng (§6.8).
 * - Kiểm tra CRC-16/CCITT-FALSE Tag 63: thiếu Tag 63 (`crcHopLe === null`) được khai rõ vào
 *   `chuaKiemCrc: true` và cảnh báo người đọc (§4.3: chưa kiểm chứng được ≠ sạch).
 * - Chặn thêm các giao thức nguy hiểm (`javascript:`, `data:`, `intent:`, `tel:`, `sms:`).
 * - Hỗ trợ song ngữ `vi` / `en` và không mã cứng từ xưng hô cố định (§4.1, §4.5, §11).
 */

export type NgonNguVietQR = 'vi' | 'en';

export interface KetQuaVietQR {
  hopLe: boolean;
  loaiQR: 'vietqr' | 'url' | 'scheme_la' | 'khac';
  url: string | null;
  crcHopLe: boolean | null;
  chuaKiemCrc: boolean;
  nganHang: string | null;
  maBin: string | null;
  soTaiKhoan: string | null;
  tenChuTaiKhoan: string | null;
  soTienVnd: number | null;
  noiDungChuyen: string | null;
  canhBaoNoiDung: string[];
  tomTatChoBac: string;
}

const DANH_BA_BIN: Record<string, string> = {
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '970422': 'MB Bank',
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970441': 'VIB',
  '970403': 'Sacombank',
  '970437': 'HDBank',
  '970443': 'SHB',
  '970448': 'OCB',
  '970426': 'MSB',
  '970431': 'Eximbank',
  '970429': 'SCB',
  '970454': 'BVBank',
  '970406': 'DongA Bank',
  '970449': 'LPBank',
};

const TU_KHOA_BAY_NOI_DUNG = [
  {
    ma: 'TAM_GIU',
    mau: /\b(tam giu|tai khoan an toan|bao lanh|chung minh vo toi)\b/i,
    vi: 'Nội dung chuyển ghi "tạm giữ / bảo lãnh / chứng minh vô tội" — dấu hiệu lừa đảo thường gặp.',
    en: 'Transfer memo mentions "holding / bail / prove innocence" — a common scam pattern.',
  },
  {
    ma: 'PHAT_NGUOI',
    mau: /\b(phat nguoi|vi pham giao thong|khoi to|toa an)\b/i,
    vi: 'Nội dung chuyển ghi "phạt nguội / khởi tố / tòa án" vào tài khoản qua QR.',
    en: 'Transfer memo mentions "traffic fine / prosecution / court" via QR transfer.',
  },
  {
    ma: 'PHI_HO_SO',
    mau: /\b(phi ho so|thu hoi von|tien coc|giai ngan|nang han muc)\b/i,
    vi: 'Nội dung chuyển ghi "phí hồ sơ / tiền cọc / giải ngân" — cẩn trọng phí ứng trước.',
    en: 'Transfer memo mentions "processing fee / deposit / disbursement" — watch out for advance-fee traps.',
  },
];

const RE_SCHEME_LA = /^(javascript|vbscript|data|intent|itms-services|tel|sms|mailto):/i;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

function docTLV(chuoi: string): Record<string, string> {
  const kq: Record<string, string> = Object.create(null);
  const bytes = encoder.encode(chuoi);
  let i = 0;
  while (i + 4 <= bytes.length) {
    const tag = decoder.decode(bytes.subarray(i, i + 2));
    const lenStr = decoder.decode(bytes.subarray(i + 2, i + 4));
    if (!/^\d{2}$/.test(lenStr)) break;
    const len = Number.parseInt(lenStr, 10);
    if (!Number.isFinite(len) || len < 0 || i + 4 + len > bytes.length) break;
    kq[tag] = decoder.decode(bytes.subarray(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return kq;
}

/**
 * EMVCo Tag 63 CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF).
 */
export function tinhCrc16Ccitt(bytes: Uint8Array): string {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= (bytes[i] ?? 0) << 8;
    for (let b = 0; b < 8; b += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function kiemTraTag63Crc(chuoi: string): boolean | null {
  const idx = chuoi.lastIndexOf('6304');
  if (idx < 0 || idx + 8 !== chuoi.length) return null;
  const crcTrongMa = chuoi.slice(idx + 4).toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(crcTrongMa)) return false;
  const payloadBytes = encoder.encode(chuoi.slice(0, idx + 4));
  return tinhCrc16Ccitt(payloadBytes) === crcTrongMa;
}

function boDau(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export function phanTichVietQR(raw = '', lang: NgonNguVietQR = 'vi'): KetQuaVietQR {
  const chuoi = String(raw || '').trim();
  const laEn = lang === 'en';

  if (RE_SCHEME_LA.test(chuoi)) {
    const scheme = (chuoi.split(':')[0] || '').toLowerCase();
    const canhBao = laEn
      ? `QR code contains a non-bank action scheme (${scheme}:) — do not open or run it.`
      : `Mã QR chứa lệnh điều hướng đặc biệt (${scheme}:), không phải mã chuyển khoản — không mở hoặc làm theo.`;
    return {
      hopLe: false,
      loaiQR: 'scheme_la',
      url: null,
      crcHopLe: null,
      chuaKiemCrc: false,
      nganHang: null,
      maBin: null,
      soTaiKhoan: null,
      tenChuTaiKhoan: null,
      soTienVnd: null,
      noiDungChuyen: null,
      canhBaoNoiDung: [canhBao],
      tomTatChoBac: canhBao,
    };
  }

  if (/^https?:\/\/\S+/i.test(chuoi)) {
    let tenMien = '';
    try {
      tenMien = new URL(chuoi).hostname;
    } catch {
      tenMien = chuoi.slice(0, 60);
    }
    const laLinkLa =
      /\.(apk|exe|zip|xyz|top|tk|ml|ga|cf|gq|click|loan|buzz|icu|vip)$/i.test(tenMien) ||
      /\.apk(\?|#|$)/i.test(chuoi);
    const canhBaoUrl = laEn
      ? [
          `This QR code opens a web link (${tenMien}), not a standard bank transfer code.`,
          ...(laLinkLa ? ['The link uses a high-risk domain or installer file — do not open or install apps from it.'] : []),
        ]
      : [
          `Mã QR này chứa đường dẫn web (${tenMien}), không phải mã chuyển khoản ngân hàng.`,
          ...(laLinkLa ? ['Đường dẫn có đuôi tên miền hoặc tệp cài đặt rủi ro cao — không mở hoặc tải ứng dụng.'] : []),
        ];
    return {
      hopLe: false,
      loaiQR: 'url',
      url: chuoi,
      crcHopLe: null,
      chuaKiemCrc: false,
      nganHang: null,
      maBin: null,
      soTaiKhoan: null,
      tenChuTaiKhoan: null,
      soTienVnd: null,
      noiDungChuyen: null,
      canhBaoNoiDung: canhBaoUrl,
      tomTatChoBac: laEn
        ? `QR code points to website "${tenMien}". Verify the source before opening.`
        : `Mã QR dẫn tới trang web "${tenMien}". Không nên bấm mở nếu chưa rõ nguồn gốc.`,
    };
  }

  if (!chuoi.startsWith('000201')) {
    return {
      hopLe: false,
      loaiQR: 'khac',
      url: null,
      crcHopLe: null,
      chuaKiemCrc: false,
      nganHang: null,
      maBin: null,
      soTaiKhoan: null,
      tenChuTaiKhoan: null,
      soTienVnd: null,
      noiDungChuyen: null,
      canhBaoNoiDung: [],
      tomTatChoBac: laEn
        ? 'This string is not a standard EMVCo VietQR transfer code.'
        : 'Chuỗi này không phải mã chuyển khoản VietQR chuẩn.',
    };
  }

  const crcHopLe = kiemTraTag63Crc(chuoi);
  const chuaKiemCrc = crcHopLe === null;
  const goc = docTLV(chuoi);
  const tag38 = goc['38'] ? docTLV(goc['38']) : {};
  const tag01 = tag38['01'] ? docTLV(tag38['01']) : {};

  const maBin = tag01['00'] || null;
  const soTaiKhoan = tag01['01'] || null;
  const nganHang = maBin
    ? DANH_BA_BIN[maBin] || (laEn ? `Bank (BIN ${maBin})` : `Ngân hàng (BIN ${maBin})`)
    : null;

  const soTienRaw = goc['54'] ? Number.parseFloat(goc['54']) : NaN;
  const soTienVnd = Number.isFinite(soTienRaw) && soTienRaw > 0 ? Math.round(soTienRaw) : null;
  const tenChuTaiKhoan = goc['59'] ? goc['59'].trim() : null;

  const tag62 = goc['62'] ? docTLV(goc['62']) : {};
  const noiDungChuyen = tag62['08'] ? tag62['08'].trim() : null;

  const canhBaoNoiDung: string[] = [];
  if (crcHopLe === false) {
    canhBaoNoiDung.push(
      laEn
        ? 'Integrity check (CRC Tag 63) does not match — the QR payload may have been altered.'
        : 'Mã kiểm tra toàn vẹn (CRC Tag 63) không khớp — dữ liệu mã QR có thể đã bị chỉnh sửa.'
    );
  } else if (crcHopLe === null) {
    // §4.3 — thiếu mã kiểm tra toàn vẹn không được im lặng coi như bình thường
    canhBaoNoiDung.push(
      laEn
        ? 'QR code is missing integrity check Tag 63 — completeness could not be verified.'
        : 'Mã QR thiếu trường kiểm tra toàn vẹn (CRC Tag 63) — chưa kiểm chứng được dữ liệu có bị cắt thiếu không.'
    );
  }

  if (noiDungChuyen) {
    const khongDau = boDau(noiDungChuyen);
    for (const tk of TU_KHOA_BAY_NOI_DUNG) {
      if (tk.mau.test(khongDau)) {
        canhBaoNoiDung.push(laEn ? tk.en : tk.vi);
      }
    }
  }

  if (!maBin && !soTaiKhoan && !soTienVnd) {
    return {
      hopLe: false,
      loaiQR: 'khac',
      url: null,
      crcHopLe,
      chuaKiemCrc,
      nganHang: null,
      maBin: null,
      soTaiKhoan: null,
      tenChuTaiKhoan: null,
      soTienVnd: null,
      noiDungChuyen: null,
      canhBaoNoiDung,
      tomTatChoBac: laEn
        ? 'Could not read recipient account fields from this QR code.'
        : 'Chưa đọc được thông tin tài khoản nhận từ mã QR này.',
    };
  }

  const phan: string[] = [];
  if (nganHang || soTaiKhoan) {
    phan.push(
      laEn
        ? `Transfer to ${nganHang || 'bank'}${soTaiKhoan ? ` (Acct ${soTaiKhoan})` : ''}`
        : `Chuyển tới ${nganHang || 'ngân hàng'}${soTaiKhoan ? ` (STK ${soTaiKhoan})` : ''}`
    );
  }
  if (tenChuTaiKhoan) {
    phan.push(laEn ? `Account holder: ${tenChuTaiKhoan}` : `Chủ tài khoản: ${tenChuTaiKhoan}`);
  }
  if (soTienVnd !== null) {
    phan.push(
      laEn
        ? `Pre-filled amount: ${soTienVnd.toLocaleString('en-US')} VND`
        : `Số tiền gài sẵn: ${soTienVnd.toLocaleString('vi-VN')} đ`
    );
  }
  if (noiDungChuyen) {
    phan.push(laEn ? `Memo: "${noiDungChuyen}"` : `Nội dung: "${noiDungChuyen}"`);
  }
  if (canhBaoNoiDung.length > 0) {
    phan.push(laEn ? `Note: ${canhBaoNoiDung.join('; ')}` : `Lưu ý: ${canhBaoNoiDung.join('; ')}`);
  } else {
    // §11 — Không khẳng định vắng tín hiệu cụ thể; nhắc đối chiếu người nhận thật
    phan.push(
      laEn
        ? 'Always verify the recipient name and amount with a trusted contact before confirming any transfer.'
        : 'Luôn đối chiếu kỹ tên người nhận và số tiền trước khi xác nhận chuyển khoản.'
    );
  }

  return {
    hopLe: true,
    loaiQR: 'vietqr',
    url: null,
    crcHopLe,
    chuaKiemCrc,
    nganHang,
    maBin,
    soTaiKhoan,
    tenChuTaiKhoan,
    soTienVnd,
    noiDungChuyen,
    canhBaoNoiDung,
    tomTatChoBac: phan.join(' · '),
  };
}
