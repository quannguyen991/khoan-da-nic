'use strict';
/**
 * Phụ lục A.7 — nhóm WEB. DETERMINISTIC, KHÔNG GỌI MẠNG TỪ CLIENT.
 *
 * §6.8: "KHÔNG BAO GIỜ tự mở link trích từ nội dung đáng ngờ."
 * File này chỉ đọc chuỗi. Không fetch, không DNS, không mở kết nối nào.
 *
 * A.7: "So sánh domain bằng registrable domain / eTLD+1, không dùng `contains`
 * hay `endsWith` ngây thơ — `vietcombank.com.vn.attacker.tld` KHÔNG PHẢI domain
 * Vietcombank. Punycode decode để hiển thị nhưng GIỮ hostname ASCII để so sánh."
 */

/**
 * Hậu tố công cộng nhiều thành phần. Đây là danh sách RÚT GỌN, đủ cho các nước
 * trong phạm vi bản 24 giờ — không phải Public Suffix List đầy đủ.
 * ⚠️ Thêm nước mới thì thêm hậu tố vào đây, đừng đoán bằng số dấu chấm.
 */
const HAU_TO_KEP = new Set([
  'com.vn', 'net.vn', 'org.vn', 'gov.vn', 'edu.vn', 'ac.vn', 'biz.vn', 'info.vn',
  'co.uk', 'org.uk', 'gov.uk', 'ac.uk', 'me.uk',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au',
  'com.sg', 'com.my', 'com.cn', 'com.hk', 'co.jp', 'co.kr', 'co.in', 'co.nz',
]);

/** Tên miền chính thức đã xác minh. AI KHÔNG được tự thêm mục nào (§2B.5). */
const THUONG_HIEU = [
  { ten: 'vietcombank', domains: ['vietcombank.com.vn'] },
  { ten: 'bidv', domains: ['bidv.com.vn'] },
  { ten: 'vietinbank', domains: ['vietinbank.vn'] },
  { ten: 'techcombank', domains: ['techcombank.com.vn'] },
  { ten: 'agribank', domains: ['agribank.com.vn'] },
  { ten: 'dichvucong', domains: ['dichvucong.gov.vn'] },
  { ten: 'paypal', domains: ['paypal.com'] },
  { ten: 'hsbc', domains: ['hsbc.co.uk', 'hsbc.com'] },
];

const RUT_GON = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'rb.gy', 'cutt.ly', 'shorturl.at', 'rebrand.ly',
]);

const KHO_APP_CHINH_THUC = new Set([
  'play.google.com', 'apps.apple.com', 'itunes.apple.com', 'appgallery.huawei.com',
]);

const RE_URL = /\bhttps?:\/\/[^\s<>"')\]]+/gi;
const RE_IP = /^\d{1,3}(\.\d{1,3}){3}$/;

function trichUrl(text = '') {
  RE_URL.lastIndex = 0;
  return text.match(RE_URL) || [];
}

/** eTLD+1. `vietcombank.com.vn.attacker.tld` → `attacker.tld`, KHÔNG phải Vietcombank. */
function layRegistrableDomain(hostname = '') {
  const phan = hostname.toLowerCase().replace(/\.$/, '').split('.');
  if (phan.length <= 2) return phan.join('.');
  const haiCuoi = phan.slice(-2).join('.');
  if (HAU_TO_KEP.has(haiCuoi)) return phan.slice(-3).join('.');
  return haiCuoi;
}

function docHostname(url) {
  try {
    // URL không gọi mạng — chỉ phân tích chuỗi theo WHATWG.
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function phanTichUrl(text = '') {
  const ra = new Map();
  const them = (id, quote) => {
    if (!ra.has(id)) {
      ra.set(id, {
        id, state: 'present', source: 'deterministic', confidence: 1.0,
        evidence: [{ quote, start: 0, end: quote.length, sourceId: 'url' }],
      });
    }
  };

  for (const url of trichUrl(text)) {
    const host = docHostname(url);
    if (!host) continue;
    const reg = layRegistrableDomain(host);

    if (host.startsWith('xn--') || host.includes('.xn--') || RE_IP.test(host)) {
      them('WEB_PUNYCODE_IP_LITERAL', host);
    }
    if (RUT_GON.has(reg)) them('WEB_SHORTENER_REDIRECT', host);

    // Lệch thương hiệu: tên thương hiệu xuất hiện trong hostname NHƯNG eTLD+1
    // không phải tên miền chính thức của thương hiệu đó.
    for (const th of THUONG_HIEU) {
      if (host.includes(th.ten) && !th.domains.includes(reg)) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        break;
      }
    }

    if (/\.apk(\?|$|#)/i.test(url) && !KHO_APP_CHINH_THUC.has(host)) {
      them('WEB_NONOFFICIAL_APP_SOURCE', url);
    }
  }

  return [...ra.values()];
}

module.exports = {
  phanTichUrl, trichUrl, layRegistrableDomain,
  HAU_TO_KEP, THUONG_HIEU,
};
