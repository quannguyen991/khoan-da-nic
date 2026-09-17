/**
 * DANH BẠ SỐ TỔNG ĐÀI NGÂN HÀNG — lọc phía giao diện.
 *
 * ⚠️ KHÔNG TIN MÙ TỆP. Máy chủ đã có sổ đăng ký với đủ luật
 * (`backend/src/analysis/verified-institution-registry.js`). Giao diện đọc CÙNG
 * tệp `public/config/support-directory.json` — để số có sẵn cả khi mất mạng — nên
 * phải tự áp lại ĐÚNG những luật đó ở đây. Test giữ hai bên cho ra cùng một danh
 * sách trên tệp thật: `test/danh-ba-ngan-hang.test.js`.
 *
 * Luật: chỉ mục `approved`, có tên người duyệt, có ngày xác minh, có ít nhất một
 * số chỉ gồm chữ số, và nguồn là `https` trên đúng tên miền chính thức của ngân
 * hàng đó. Thiếu một điều là bỏ — thà không có số còn hơn có số sai.
 *
 * ⚠️ KHÔNG CHỮ HIỂN THỊ TRONG TỆP NÀY. Tên ngân hàng là dữ liệu, không phải câu.
 */

export interface SoNganHang {
  id: string;
  ten: string;
  so: string[];
  sourceUrl: string;
  tenMien: string;
  ngayXacMinh: string;
}

const RE_SO = /^\+?[\d\s().-]{6,20}$/;
const RE_NGAY = /^\d{4}-\d{2}-\d{2}$/;

const chuoi = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Tên miền nguồn nếu nguồn là https trên đúng tên miền chính thức; không thì `null`. */
export function tenMienNguon(sourceUrl: unknown, officialDomains: unknown): string | null {
  if (typeof sourceUrl !== 'string' || !Array.isArray(officialDomains)) return null;
  let u: URL;
  try { u = new URL(sourceUrl); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  const khop = officialDomains.some((d) => {
    const mien = chuoi(d).toLowerCase();
    return !!mien && (host === mien || host.endsWith(`.${mien}`));
  });
  return khop ? host : null;
}

/** Lọc tệp danh bạ thô thành danh sách hiển thị được. KHÔNG BAO GIỜ ném. */
export function locDanhBa(tho: unknown, maNuoc = 'VN'): SoNganHang[] {
  if (!tho || typeof tho !== 'object') return [];
  const vao = (tho as Record<string, unknown>).institutions;
  if (!Array.isArray(vao)) return [];

  const ra: SoNganHang[] = [];
  for (const x of vao) {
    if (!x || typeof x !== 'object') continue;
    const m = x as Record<string, unknown>;
    if (m.reviewStatus !== 'approved' || m.countryCode !== maNuoc) continue;
    if (!chuoi(m.reviewedBy).trim() || !chuoi(m.canonicalName).trim() || !chuoi(m.id) || !chuoi(m.type)) continue;
    if (!RE_NGAY.test(chuoi(m.verifiedAt))) continue;
    const so = Array.isArray(m.officialPhoneNumbers) ? m.officialPhoneNumbers : [];
    if (so.length === 0 || !so.every((s) => typeof s === 'string' && RE_SO.test(s))) continue;
    const tenMien = tenMienNguon(m.sourceUrl, m.officialDomains);
    if (!tenMien) continue;
    ra.push({
      id: chuoi(m.id),
      ten: chuoi(m.canonicalName),
      so: so as string[],
      sourceUrl: chuoi(m.sourceUrl),
      tenMien,
      ngayXacMinh: chuoi(m.verifiedAt),
    });
  }
  return ra.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
}

/** "1900 54 54 86" → "1900545486"; giữ dấu + đầu số quốc tế. Dùng cho `tel:`. */
export function soDeGoi(so: string): string {
  const s = so.trim();
  return (s.startsWith('+') ? '+' : '') + s.replace(/\D/g, '');
}
