'use strict';
/**
 * Phụ lục A.7 — nhóm WEB. DETERMINISTIC, KHÔNG GỌI MẠNG TỪ CLIENT.
 *
 * §6.8: "KHÔNG BAO GIỜ tự mở link trích từ nội dung đáng ngờ."
 * File này chỉ đọc chuỗi. Không fetch, không DNS, không mở kết nối nào.
 *
 * Hợp nhất năng lực của `detect/tang-1.js` vào đường phân tích chính:
 * - Bắt cả URL đầy đủ (`https?://`), tên miền trần (`csgt-tracuu.top`), IP trần có đường dẫn
 *   (`192.168.44.201/nganhang`) và link lồng trong tham số chuyển hướng (`?url=...`).
 * - Nhánh dự phòng `docHostnameTho` để Punycode hỏng (`xn--...`) không bị nuốt thành null (§4.3).
 * - Khoảng cách chỉnh sửa Levenshtein (nhãn ≥ 6 ký tự) để bắt tên miền nhái chính tả (`vietconbank.com.vn`).
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
  { ten: 'mbbank', domains: ['mbbank.com.vn'] },
  { ten: 'vpbank', domains: ['vpbank.com.vn'] },
  { ten: 'acb', domains: ['acb.com.vn'] },
  { ten: 'sacombank', domains: ['sacombank.com.vn'] },
  { ten: 'tpbank', domains: ['tpbank.vn'] },
  { ten: 'hdbank', domains: ['hdbank.com.vn'] },
  { ten: 'vib', domains: ['vib.com.vn'] },
  { ten: 'msb', domains: ['msb.com.vn'] },
  { ten: 'ocb', domains: ['ocb.com.vn'] },
  { ten: 'shb', domains: ['shb.com.vn'] },
  { ten: 'seabank', domains: ['seabank.com.vn'] },
  { ten: 'lpbank', domains: ['lpbank.com.vn'] },
  { ten: 'momo', domains: ['momo.vn'] },
  { ten: 'zalopay', domains: ['zalopay.vn'] },
  { ten: 'vnpay', domains: ['vnpay.vn'] },
  { ten: 'viettelmoney', domains: ['viettelmoney.vn'] },
  { ten: 'dichvucong', domains: ['dichvucong.gov.vn'] },
  { ten: 'vneid', domains: ['vneid.gov.vn', 'dichvucong.gov.vn', 'bocongan.gov.vn'] },
  { ten: 'csgt', domains: ['csgt.vn', 'bocongan.gov.vn', 'dichvucong.gov.vn'] },
  { ten: 'etax', domains: ['thuedientu.gdt.gov.vn', 'gdt.gov.vn'] },
  { ten: 'vssid', domains: ['baohiemxahoi.gov.vn'] },
  { ten: 'baohiemxahoi', domains: ['baohiemxahoi.gov.vn'] },
  { ten: 'evn', domains: ['evn.com.vn', 'evnhanoi.vn', 'evnspc.vn'] },
  { ten: 'paypal', domains: ['paypal.com'] },
  { ten: 'hsbc', domains: ['hsbc.co.uk', 'hsbc.com'] },
  { ten: 'vietnampost', domains: ['vietnampost.vn', 'vnpost.vn'] },
  { ten: 'vnpost', domains: ['vnpost.vn', 'vietnampost.vn'] },
  { ten: 'vietpost', domains: ['vietnampost.vn', 'vnpost.vn'] },
  { ten: 'viettelpost', domains: ['viettelpost.com.vn'] },
  { ten: 'ghn', domains: ['ghn.vn'] },
  { ten: 'ghtk', domains: ['ghtk.vn'] },
  { ten: 'shopee', domains: ['shopee.vn'] },
  { ten: 'facebook', domains: ['facebook.com', 'fb.com', 'messenger.com'] },
  { ten: 'apple', domains: ['apple.com', 'icloud.com'] },
  { ten: 'icloud', domains: ['icloud.com', 'apple.com'] },
];

const TEN_MIEN_CHINH_CHU = Object.freeze([
  ...new Set(THUONG_HIEU.flatMap((t) => t.domains)),
]);

const RUT_GON = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'rb.gy', 'cutt.ly', 'shorturl.at', 'rebrand.ly', 's.id', 'tiny.cc',
  's.net.vn', 'bom.so', 'bom.to', 'rg.link', 'surl.vn',
  't.ly', 'v.gd', 'short.io', 'bit.do', 'clck.ru', 'gg.gg', 'ln.run', 'dub.sh', 'urlis.net',
]);

const KHO_APP_CHINH_THUC = new Set([
  'play.google.com', 'apps.apple.com', 'itunes.apple.com', 'appgallery.huawei.com',
]);

/**
 * Đuôi tên miền rõ nghĩa cho URL trần (không có `http://`).
 * Cố ý loại các từ tiếng Anh 2 chữ cái dễ dính dấu chấm câu (`in`, `me`, `co`, `us`, `at`)
 * trừ khi có đường dẫn `/` phía sau — tránh bắt nhầm văn bản gõ thiếu dấu cách sau dấu chấm.
 */
const DUOI_TEN_MIEN_RO = new Set([
  'vn', 'com', 'net', 'org', 'gov', 'edu', 'info', 'biz', 'io', 'app', 'dev',
  'top', 'xyz', 'icu', 'cc', 'buzz', 'rest', 'cyou', 'click', 'link', 'shop',
  'online', 'site', 'website', 'space', 'fun', 'live', 'work', 'monster',
  'quest', 'sbs', 'cfd', 'bond', 'tk', 'ml', 'ga', 'cf', 'gq', 'su', 'ru',
  'uk', 'au', 'sg', 'my', 'cn', 'hk', 'jp', 'kr', 'nz', 'asia',
  'pro', 'store', 'tech', 'cloud', 'page', 'help', 'life', 'world', 'vip', 'loan',
]);

const DUOI_CAN_DUONG_DAN = new Set(['me', 'co', 'in', 'us']);

const THAM_SO_CHUYEN_HUONG = new Set([
  'url', 'u', 'redirect', 'redirect_uri', 'next', 'target', 'r', 'link',
  'to', 'dest', 'destination', 'continue', 'returnurl', 'return_url', 'goto',
]);

const RE_URL_DAY_DU = /\bhttps?:\/\/[^\s<>"'`)\]]+/gi;
const RE_URL_IP = /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{2,5})?\/[^\s<>"'`)\]]*/g;
const RE_URL_TRAN = /(?:^|[\s(["'<:])((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:\/[^\s<>"'`)\]]*)?)/gi;
const RE_IP = /^\d{1,3}(\.\d{1,3}){3}$/;

function lamSachDuoiUrl(u = '') {
  return String(u).replace(/[.,;:!?)]+$/, '');
}

/** eTLD+1. `vietcombank.com.vn.attacker.tld` → `attacker.tld`, KHÔNG phải Vietcombank. */
function layRegistrableDomain(hostname = '') {
  const phan = hostname.toLowerCase().replace(/\.$/, '').split('.');
  if (phan.length <= 2) return phan.join('.');
  const haiCuoi = phan.slice(-2).join('.');
  if (HAU_TO_KEP.has(haiCuoi)) return phan.slice(-3).join('.');
  return haiCuoi;
}

function phanNhan(reg = '') {
  const p = reg.split('.');
  if (p.length <= 1) return reg;
  const haiCuoi = p.slice(-2).join('.');
  return HAU_TO_KEP.has(haiCuoi) ? p.slice(0, -3).join('.') || p[0] : p.slice(0, -1).join('.');
}

function levenshtein(a, b, tran = 2) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > tran) return tran + 1;
  let truoc = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const hienTai = [i];
    let nhoNhat = i;
    for (let j = 1; j <= b.length; j += 1) {
      const gia = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(hienTai[j - 1] + 1, truoc[j] + 1, truoc[j - 1] + gia);
      hienTai[j] = v;
      if (v < nhoNhat) nhoNhat = v;
    }
    if (nhoNhat > tran) return tran + 1;
    truoc = hienTai;
  }
  return truoc[b.length];
}

/** Dự phòng cú pháp thuần cho Punycode không hợp lệ khiến `new URL()` ném lỗi (§4.3). */
function docHostnameTho(url) {
  const s = String(url).replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const host = s.split(/[/?#]/)[0].split('@').pop().split(':')[0]
    .toLowerCase().replace(/\.$/, '');
  return /^[a-z0-9.-]+$/.test(host) && host.includes('.') ? host : null;
}

function docHostname(url) {
  try {
    const coGiaoThuc = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`;
    const h = new URL(coGiaoThuc).hostname.toLowerCase().replace(/\.$/, '');
    if (h) return h;
  } catch {
    // rơi xuống nhánh dự phòng
  }
  return docHostnameTho(url);
}

function trichLinkLong(url) {
  const ra = [];
  try {
    const coGiaoThuc = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`;
    const u = new URL(coGiaoThuc);
    for (const [ten, giaTri] of u.searchParams) {
      if (!THAM_SO_CHUYEN_HUONG.has(ten.toLowerCase())) continue;
      let v = giaTri;
      for (let i = 0; i < 2; i += 1) {
        try {
          const g = decodeURIComponent(v);
          if (g === v) break;
          v = g;
        } catch {
          break;
        }
      }
      if (/[a-z0-9-]+\.[a-z]{2,}/i.test(v)) ra.push(lamSachDuoiUrl(v));
    }
  } catch {
    // URL hỏng cú pháp được ghi nhận ở trichUrlChiTiet
  }
  return ra;
}

/**
 * Trích xuất toàn bộ URL (đầy đủ, IP trần, tên miền trần, link lồng) và tách riêng URL hỏng cú pháp.
 */
function goCheUrl(text = '') {
  return String(text || '')
    .replace(/\bhxxps:\/\//gi, 'https://')
    .replace(/\bhxxp:\/\//gi, 'http://')
    .replace(/\[\.\]|\(\.\)|\{\.\}/g, '.');
}

function trichUrlChiTiet(text = '') {
  const t = goCheUrl(String(text || '').slice(0, 10_000));
  const tho = new Set();

  RE_URL_DAY_DU.lastIndex = 0;
  for (const m of t.match(RE_URL_DAY_DU) || []) {
    tho.add(lamSachDuoiUrl(m));
  }

  RE_URL_IP.lastIndex = 0;
  for (const m of t.match(RE_URL_IP) || []) {
    const sach = lamSachDuoiUrl(m);
    if (![...tho].some((x) => x.includes(sach))) tho.add(sach);
  }

  RE_URL_TRAN.lastIndex = 0;
  let match;
  while ((match = RE_URL_TRAN.exec(t)) !== null) {
    const sach = lamSachDuoiUrl(match[1] || '');
    if (!sach) continue;
    // Bỏ địa chỉ email (ký tự ngay trước ứng viên là `@`)
    const viTriBatDau = match.index + match[0].lastIndexOf(match[1]);
    if (viTriBatDau > 0 && t[viTriBatDau - 1] === '@') continue;
    if ([...tho].some((x) => x.includes(sach))) continue;

    const coDuongDan = sach.includes('/');
    const hostPart = sach.split('/')[0].toLowerCase();
    const duoi = hostPart.split('.').pop() || '';
    const laWww = hostPart.startsWith('www.');
    if (!DUOI_TEN_MIEN_RO.has(duoi) && !(coDuongDan && DUOI_CAN_DUONG_DAN.has(duoi)) && !laWww) {
      continue;
    }
    tho.add(sach);
  }

  const tatCa = new Set(tho);
  for (const u of tho) {
    for (const con of trichLinkLong(u)) tatCa.add(con);
  }

  const docDuoc = [];
  const khongDocDuoc = [];
  for (const u of tatCa) {
    if (docHostname(u)) docDuoc.push(u);
    else khongDocDuoc.push(u);
  }
  return { docDuoc, khongDocDuoc };
}

function trichUrl(text = '') {
  const { docDuoc, khongDocDuoc } = trichUrlChiTiet(text);
  return [...docDuoc, ...khongDocDuoc];
}

function phanTichUrl(text = '') {
  const ra = new Map();
  const them = (id, quote) => {
    if (!ra.has(id)) {
      ra.set(id, {
        id,
        state: 'present',
        source: 'deterministic',
        confidence: 1.0,
        evidence: [{ quote, start: 0, end: quote.length, sourceId: 'url' }],
      });
    }
  };

  const { docDuoc } = trichUrlChiTiet(text);
  for (const url of docDuoc) {
    const host = docHostname(url);
    if (!host) continue;
    const reg = layRegistrableDomain(host);
    const nhan = phanNhan(reg);

    if (host.startsWith('xn--') || host.includes('.xn--') || RE_IP.test(host)) {
      them('WEB_PUNYCODE_IP_LITERAL', host);
    }
    if (RUT_GON.has(reg)) {
      them('WEB_SHORTENER_REDIRECT', host);
    }

    let daBatNhai = false;
    for (const th of THUONG_HIEU) {
      if (host.includes(th.ten) && !th.domains.includes(reg)) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        daBatNhai = true;
        break;
      }
    }

    // Kiểm tra viết tắt thương hiệu / cơ quan theo ranh giới token (tránh khớp nhầm chuỗi con)
    if (!daBatNhai && !TEN_MIEN_CHINH_CHU.includes(reg)) {
      const tokens = host.split(/[.-]/);
      const tld = tokens[tokens.length - 1] || '';
      const laTldRuiRo = [
        'top', 'xyz', 'icu', 'cc', 'buzz', 'click', 'link', 'tk', 'ml', 'ga', 'cf', 'gq',
        'site', 'online', 'vip', 'loan', 'rest', 'cyou', 'shop', 'website', 'space',
        'fun', 'live', 'work', 'monster', 'quest', 'sbs', 'cfd', 'bond', 'pro', 'store', 'life', 'help', 'asia',
      ].includes(tld);
      if (tokens.includes('vcb') && !reg.endsWith('vietcombank.com.vn')) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        daBatNhai = true;
      } else if (tokens.includes('tcb') && !reg.endsWith('techcombank.com.vn')) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        daBatNhai = true;
      } else if (tokens.includes('vtb') && !reg.endsWith('vietinbank.vn')) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        daBatNhai = true;
      } else if (tokens.includes('bhxh') && !reg.endsWith('baohiemxahoi.gov.vn')) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        daBatNhai = true;
      } else if ((tokens.includes('gov') || tokens.includes('bca')) && !host.endsWith('.gov') && !host.includes('.gov.') && laTldRuiRo) {
        them('WEB_BRAND_DOMAIN_MISMATCH', host);
        daBatNhai = true;
      }
    }

    // Lưới 2: bắt nhái chính tả kiểu `vietconbank.com.vn`, `dichvucang.gov.vn`, `paypa1-security.top` (mảnh ≥ 6 ký tự)
    if (!daBatNhai && !TEN_MIEN_CHINH_CHU.includes(reg)) {
      const ungVien = new Set([nhan, ...host.split(/[.-]/)]
        .map((s) => s.trim())
        .filter((s) => s.length >= 6));
      outer: for (const manh of ungVien) {
        for (const chinhChu of TEN_MIEN_CHINH_CHU) {
          const nhanChinh = phanNhan(chinhChu);
          if (nhanChinh.length < 6) continue;
          const tran = Math.min(manh.length, nhanChinh.length) >= 8 ? 2 : 1;
          const d = levenshtein(manh, nhanChinh, tran);
          if (d > 0 && d <= tran) {
            them('WEB_BRAND_DOMAIN_MISMATCH', host);
            break outer;
          }
        }
      }
    }

    if (/\.(apk|exe|msi|scr|bat|ipa|mobileconfig)(\?|$|#)/i.test(url) && !KHO_APP_CHINH_THUC.has(host) && !KHO_APP_CHINH_THUC.has(reg)) {
      them('WEB_NONOFFICIAL_APP_SOURCE', url);
    }
  }

  return [...ra.values()];
}

module.exports = {
  phanTichUrl,
  trichUrl,
  trichUrlChiTiet,
  docHostname,
  docHostnameTho,
  trichLinkLong,
  levenshtein,
  layRegistrableDomain,
  HAU_TO_KEP,
  THUONG_HIEU,
  RUT_GON,
};
