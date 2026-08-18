'use strict';
/**
 * §6.8 · §6.10 — KIỂM TỆP: CHỮ KÝ THẬT, GIỚI HẠN 5MB.
 *
 * ⚠️ §6.8 liệt kê "giả mạo MIME" và "chữ ký tệp" là hai mục riêng, vì tin vào
 * phần mở rộng hay `Content-Type` do client khai là tin vào lời của kẻ tấn công.
 * Module này đọc BYTE ĐẦU TỆP.
 *
 * §4.3 — tệp không đọc được KHÔNG được đi tiếp như thể đã kiểm xong. Hàm trả về
 * mã lý do để `unreadableInputFloor()` biết đường đưa vào `chuaKiem`.
 */

const GIOI_HAN_BYTE = 5 * 1024 * 1024;   // §6.10 — 5MB

/** Chữ ký (magic bytes) của các định dạng CHO PHÉP. */
const CHU_KY = [
  { loai: 'image/jpeg', byte: [0xFF, 0xD8, 0xFF] },
  { loai: 'image/png', byte: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { loai: 'image/gif', byte: [0x47, 0x49, 0x46, 0x38] },
  { loai: 'image/webp', byte: [0x52, 0x49, 0x46, 0x46], oViTri12: [0x57, 0x45, 0x42, 0x50] },
  { loai: 'image/heic', oViTri4: [0x66, 0x74, 0x79, 0x70] },
];

/** Định dạng NGUY HIỂM — nhận ra để từ chối có tên, không im lặng. */
const CHU_KY_NGUY_HIEM = [
  { loai: 'application/pdf', byte: [0x25, 0x50, 0x44, 0x46] },
  { loai: 'application/zip-hoac-apk', byte: [0x50, 0x4B, 0x03, 0x04] },
  { loai: 'application/x-msdownload', byte: [0x4D, 0x5A] },
  { loai: 'application/x-elf', byte: [0x7F, 0x45, 0x4C, 0x46] },
  { loai: 'text/html', byte: [0x3C, 0x21, 0x44, 0x4F, 0x43] },
  { loai: 'text/html', byte: [0x3C, 0x68, 0x74, 0x6D, 0x6C] },
  { loai: 'image/svg+xml', byte: [0x3C, 0x73, 0x76, 0x67] },   // SVG chạy script được
];

const khop = (buf, byte, tu = 0) => byte.every((b, i) => buf[tu + i] === b);

function nhanDangLoai(buf) {
  if (!buf || buf.length < 4) return null;
  for (const c of CHU_KY) {
    if (c.byte && khop(buf, c.byte)) {
      if (c.oViTri12 && !khop(buf, c.oViTri12, 8)) continue;
      return c.loai;
    }
    if (c.oViTri4 && khop(buf, c.oViTri4, 4)) return c.loai;
  }
  return null;
}

function nhanDangNguyHiem(buf) {
  if (!buf || buf.length < 2) return null;
  return CHU_KY_NGUY_HIEM.find((c) => khop(buf, c.byte))?.loai ?? null;
}

/** Đọc base64 data URI thành buffer, KHÔNG tin phần khai `data:image/png`. */
function docDataUri(chuoi) {
  if (typeof chuoi !== 'string') return null;
  const m = chuoi.match(/^data:([^;,]*)?(;base64)?,(.*)$/s);
  const phanThan = m ? m[3] : chuoi;
  const loaiKhai = m?.[1] || null;
  try {
    return { buf: Buffer.from(phanThan, 'base64'), loaiKhai };
  } catch { return null; }
}

/**
 * @returns {{hopLe:boolean, loai:string|null, loaiKhai:string|null,
 *            maLoi:string|null, soByte:number}}
 */
function kiemTep(dauVao) {
  const doc = docDataUri(dauVao);
  if (!doc || doc.buf.length === 0) {
    return { hopLe: false, loai: null, loaiKhai: null, maLoi: 'khong_doc_duoc_tep', soByte: 0 };
  }
  const { buf, loaiKhai } = doc;

  if (buf.length > GIOI_HAN_BYTE) {
    return { hopLe: false, loai: null, loaiKhai, maLoi: 'FILE_TOO_LARGE', soByte: buf.length };
  }

  const nguyHiem = nhanDangNguyHiem(buf);
  if (nguyHiem) {
    return { hopLe: false, loai: nguyHiem, loaiKhai, maLoi: 'dinh_dang_khong_cho_phep', soByte: buf.length };
  }

  const loai = nhanDangLoai(buf);
  if (!loai) {
    return { hopLe: false, loai: null, loaiKhai, maLoi: 'chu_ky_tep_khong_nhan_ra', soByte: buf.length };
  }

  // §6.8 — giả mạo MIME: client khai một đằng, byte nói một nẻo.
  const giaMao = Boolean(loaiKhai) && loaiKhai !== loai;

  return {
    hopLe: true,
    loai,
    loaiKhai,
    giaMaoMime: giaMao,
    maLoi: null,
    soByte: buf.length,
  };
}

module.exports = { kiemTep, nhanDangLoai, nhanDangNguyHiem, docDataUri, GIOI_HAN_BYTE };
