'use strict';
/**
 * §6.8 — HÀNG RÀO SSRF VÀ KIỂM CHUYỂN HƯỚNG URL.
 *
 * ⚠️ §6.8: "KHÔNG BAO GIỜ tự mở link trích từ nội dung đáng ngờ."
 * Module này KHÔNG mở link. Nó quyết định một URL có ĐƯỢC PHÉP mở hay không,
 * và câu trả lời mặc định là KHÔNG.
 *
 * §6.8 đòi: giới hạn số hop · chặn localhost · chặn dải IP nội bộ · chặn
 * metadata endpoint · chỉ http/https · resolve lại DNS ở MỖI hop.
 *
 * Hàm thuần, không gọi mạng. Việc resolve DNS thuộc về nơi thực sự đi mở link;
 * ở đây ta chỉ dựng luật và kiểm chuỗi.
 */

const SO_HOP_TOI_DA = 3;

const LUOC_DO_CHO_PHEP = new Set(['http:', 'https:']);

/** Endpoint metadata của các nhà cung cấp đám mây — mục tiêu SSRF kinh điển. */
const METADATA_ENDPOINT = new Set([
  '169.254.169.254',     // AWS · Azure · GCP
  'metadata.google.internal',
  'metadata.goog',
  '100.100.200.200',     // Alibaba
]);

const TEN_NOI_BO = /^(localhost|.*\.local|.*\.internal|.*\.localdomain)$/i;

/** Dải IPv4 riêng tư / đặc biệt, theo RFC 1918 · 3927 · 6598 · 5735. */
function laIpNoiBo(host) {
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([a, Number(m[2]), Number(m[3]), Number(m[4])].some((x) => x > 255)) return true; // dị dạng: chặn
  if (a === 10) return true;                       // 10.0.0.0/8
  if (a === 127) return true;                      // loopback
  if (a === 0) return true;                        // 0.0.0.0/8
  if (a === 169 && b === 254) return true;         // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true;         // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a >= 224) return true;                       // multicast + reserved
  return false;
}

function laIpv6NoiBo(host) {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase();
  if (h === '::1' || h === '::') return true;
  if (/^f[cd]/.test(h)) return true;   // fc00::/7 unique local
  if (/^fe[89ab]/.test(h)) return true; // fe80::/10 link-local

  // IPv4-mapped dạng thập phân: ::ffff:127.0.0.1
  const thapPhan = h.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (thapPhan) return laIpNoiBo(thapPhan[1]);

  /**
   * ⚠️ IPv4-mapped dạng HEX: `::ffff:7f00:1`.
   * WHATWG URL CHUẨN HOÁ `[::ffff:127.0.0.1]` thành `[::ffff:7f00:1]`, nên nếu
   * chỉ tìm dạng thập phân thì một địa chỉ loopback đi thẳng qua hàng rào SSRF.
   * Đã đo: ca này lọt ở bản đầu.
   */
  const hex = h.match(/::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const a = parseInt(hex[1], 16);
    const b = parseInt(hex[2], 16);
    const ip = [a >> 8, a & 0xFF, b >> 8, b & 0xFF].join('.');
    return laIpNoiBo(ip);
  }
  return false;
}

/**
 * @returns {{choPhep:boolean, lyDo:string|null, hostname:string|null}}
 * Mặc định là TỪ CHỐI. Mọi nhánh không hiểu được đều rơi về từ chối.
 */
function kiemUrl(url) {
  let u;
  try { u = new URL(String(url)); } catch { return { choPhep: false, lyDo: 'url_khong_doc_duoc', hostname: null }; }

  if (!LUOC_DO_CHO_PHEP.has(u.protocol)) {
    // javascript:, data:, file:, ftp:, intent:… đều rơi vào đây.
    return { choPhep: false, lyDo: 'luoc_do_khong_cho_phep', hostname: u.hostname };
  }

  const host = u.hostname.toLowerCase();
  if (!host) return { choPhep: false, lyDo: 'khong_co_hostname', hostname: null };
  if (METADATA_ENDPOINT.has(host)) return { choPhep: false, lyDo: 'metadata_endpoint', hostname: host };
  if (TEN_NOI_BO.test(host)) return { choPhep: false, lyDo: 'ten_mien_noi_bo', hostname: host };
  if (laIpNoiBo(host)) return { choPhep: false, lyDo: 'ip_noi_bo', hostname: host };
  if (host.includes(':') && laIpv6NoiBo(host)) return { choPhep: false, lyDo: 'ipv6_noi_bo', hostname: host };
  if (host.startsWith('[') && laIpv6NoiBo(host)) return { choPhep: false, lyDo: 'ipv6_noi_bo', hostname: host };
  // Cổng lạ thường là dịch vụ nội bộ; chỉ cho cổng web tiêu chuẩn.
  if (u.port && !['80', '443', ''].includes(u.port)) {
    return { choPhep: false, lyDo: 'cong_khong_chuan', hostname: host };
  }

  return { choPhep: true, lyDo: null, hostname: host };
}

/**
 * Kiểm một chuỗi chuyển hướng. §6.8 đòi resolve lại DNS Ở MỖI HOP — nghĩa là
 * KHÔNG được kiểm hop đầu rồi tin cả chuỗi. Hàm này áp `kiemUrl` cho TỪNG hop.
 */
function kiemChuoiChuyenHuong(danhSachUrl = []) {
  if (danhSachUrl.length > SO_HOP_TOI_DA) {
    return { choPhep: false, lyDo: 'qua_nhieu_hop', hopHong: null, soHop: danhSachUrl.length };
  }
  for (let i = 0; i < danhSachUrl.length; i += 1) {
    const kq = kiemUrl(danhSachUrl[i]);
    if (!kq.choPhep) return { choPhep: false, lyDo: kq.lyDo, hopHong: i, soHop: danhSachUrl.length };
  }
  return { choPhep: true, lyDo: null, hopHong: null, soHop: danhSachUrl.length };
}

module.exports = {
  kiemUrl, kiemChuoiChuyenHuong, laIpNoiBo, laIpv6NoiBo,
  SO_HOP_TOI_DA, LUOC_DO_CHO_PHEP, METADATA_ENDPOINT,
};
