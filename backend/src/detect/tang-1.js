'use strict';
/**
 * TẦNG 1 — PHÂN TÍCH URL VÀ THỰC THỂ. Ngân sách < 200ms, OFFLINE HOÀN TOÀN.
 *
 * ⚠️ §6.8 — KHÔNG BAO GIỜ TỰ MỞ LINK TRÍCH TỪ NỘI DUNG ĐÁNG NGỜ.
 * Toàn bộ tệp này chỉ đọc CHUỖI. Không fetch, không DNS, không WHOIS, không mở
 * kết nối nào. Mở link của kẻ lừa đảo là tự khai với chúng rằng số máy này có
 * người thật đang đọc — và với một số bẫy, chỉ một lượt truy cập là đủ để lộ IP.
 *
 * ⚠️ §4.3 — KHÔNG PHÂN TÍCH ĐƯỢC ≠ ĐÃ PHÂN TÍCH, KHÔNG THẤY GÌ.
 * URL hỏng cú pháp, tên miền không đọc nổi ⇒ nằm trong `khongDocDuoc`, và tầng
 * gọi PHẢI khai nó ra chứ không được im lặng bỏ qua.
 */

const { layRegistrableDomain, HAU_TO_KEP } = require('../analysis/url-analyzer');
const { timCum } = require('./chuan-hoa');

/**
 * Bắt URL kể cả khi KHÔNG có giao thức.
 *
 * ⚠️ ĐÂY LÀ KHÁC BIỆT QUAN TRỌNG SO VỚI `url-analyzer.trichUrl()`, thứ chỉ bắt
 * `https?://`. Tin nhắn lừa đảo hầu như không bao giờ viết đủ giao thức —
 * "Truy cập csgt-tracuu.top de nop phat" là dạng thật nhất. Bỏ nhánh không có
 * giao thức là bỏ phần lớn mẫu.
 *
 * Vế thứ hai đòi ít nhất một dấu chấm và một đuôi 2–24 chữ cái, nên nó không
 * nuốt "3.5 triệu" hay "mục 4.2".
 */
const RE_URL_DAY_DU = /\bhttps?:\/\/[^\s<>"'`)\]]+/gi;
const RE_URL_TRAN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}(?:\/[^\s<>"'`)\]]*)?/gi;

/**
 * ĐỊA CHỈ IP TRẦN — `RE_URL_TRAN` KHÔNG BẮT ĐƯỢC, vì nó đòi đuôi là chữ cái.
 *
 * ĐO ĐƯỢC 4/9/2026: "Truy cap 192.168.44.201/nganhang de xac minh tai khoan
 * ngay hom nay." ra "chưa thấy dấu hiệu rủi ro" — không một luật nào nổ, vì
 * không URL nào được trích ra. Một trang đăng nhập ngân hàng đặt trên IP trần
 * là thứ không tổ chức hợp pháp nào làm.
 *
 * Đòi có đường dẫn hoặc cổng ở sau (`/…` hay `:8080`) để không nuốt phiên bản
 * phần mềm ("bản 10.2.14.3") hay dãy số có dấu chấm.
 */
const RE_URL_IP = /\b\d{1,3}(?:\.\d{1,3}){3}(?::\d{2,5})?\/[^\s<>"'`)\]]*/g;

const RE_IP = /^\d{1,3}(\.\d{1,3}){3}$/;

/** Số Việt Nam. Giữ đồng bộ với `entity-extractor.js` — hai chỗ không được lệch. */
const RE_DIEN_THOAI = /(?:\+84|0)(?:\d[ .-]?){8,9}\d/g;
const RE_DAY_SO = /\b\d{9,19}\b/g;
const RE_TIEN = /\b\d{1,3}(?:[.,]\d{3})+\s*(?:đ|vnd|vnđ|đồng)?|\b\d+(?:[.,]\d+)?\s*(?:triệu|tỉ|tỷ|nghìn|ngàn|k|tr)\b|\$\s?\d[\d,.]*/gi;

/**
 * Đuôi giả — chuỗi trông như đuôi tên miền nhưng là chữ tiếng Anh thường gặp
 * cuối câu. `RE_URL_TRAN` không phân biệt được "gui.cho" với "abc.com".
 */
const DUOI_GIA = new Set([
  'com', 'net', 'org', 'vn', 'info', 'biz', 'io', 'me', 'co', 'app', 'dev',
  'top', 'xyz', 'icu', 'cc', 'buzz', 'rest', 'cyou', 'click', 'link', 'shop',
  'online', 'site', 'website', 'space', 'fun', 'live', 'work', 'monster',
  'quest', 'sbs', 'cfd', 'bond', 'tk', 'ml', 'ga', 'cf', 'gq', 'su', 'ru',
  'uk', 'au', 'sg', 'my', 'cn', 'hk', 'jp', 'kr', 'in', 'nz', 'us', 'asia',
  'pro', 'store', 'tech', 'cloud', 'page', 'help', 'life', 'world', 'vip',
]);

/** Khoảng cách Levenshtein, cắt sớm khi đã vượt `tran`. Dùng cho LUẬT R4. */
function levenshtein(a, b, tran = 3) {
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

/** Phần nhãn của eTLD+1: `vietcombank.com.vn` → `vietcombank`. */
function phanNhan(reg = '') {
  const p = reg.split('.');
  if (p.length <= 1) return reg;
  const haiCuoi = p.slice(-2).join('.');
  return HAU_TO_KEP.has(haiCuoi) ? p.slice(0, -3).join('.') || p[0] : p.slice(0, -1).join('.');
}

/** Đuôi cuối cùng: `csgt-vn.top` → `top`, `abc.com.vn` → `com.vn`. */
function phanDuoi(reg = '') {
  const p = reg.split('.');
  if (p.length <= 1) return '';
  const haiCuoi = p.slice(-2).join('.');
  if (HAU_TO_KEP.has(haiCuoi)) return haiCuoi;
  return p[p.length - 1];
}

/**
 * Tách hostname mà KHÔNG gọi mạng. `new URL()` chỉ phân tích chuỗi theo WHATWG.
 *
 * ⚠️ CÓ NHÁNH DỰ PHÒNG, VÀ ĐÓ LÀ MỘT LỖ HỔNG §4.3 ĐÃ ĐO ĐƯỢC 4/9/2026.
 *
 * `new URL('https://xn--csgt-vn-6db.top/tracuu')` NÉM LỖI: chuỗi punycode đó
 * không giải mã hợp lệ. Bản đầu trả `null`, tức là một tên miền punycode hỏng —
 * thứ CHỈ kẻ lừa đảo mới tạo ra — được đối xử như "không có URL nào", và tin
 * giả danh CSGT tụt xuống NGHI_NGO.
 *
 * Không phân tích được bằng WHATWG KHÔNG có nghĩa là không có tên miền. Nhánh
 * dự phòng đọc host theo cú pháp thuần, và tên miền đọc kiểu này vẫn bị chấm
 * như mọi tên miền khác — cộng thêm việc `laPunycode` bắt được nó.
 */
function docHostname(url) {
  try {
    const co = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`;
    const h = new URL(co).hostname.toLowerCase().replace(/\.$/, '');
    if (h) return h;
  } catch { /* rơi xuống nhánh dự phòng */ }
  return docHostnameTho(url);
}

/** Dự phòng: cắt host bằng cú pháp, không nhờ WHATWG. */
function docHostnameTho(url) {
  const s = String(url).replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const host = s.split(/[/?#]/)[0].split('@').pop().split(':')[0]
    .toLowerCase().replace(/\.$/, '');
  return /^[a-z0-9.-]+$/.test(host) && host.includes('.') ? host : null;
}

/**
 * LINK LỒNG TRONG LINK — tham số chuyển hướng.
 * "https://tin-cay.vn/go?url=https%3A%2F%2Fcsgt-phat.top" là một link trỏ tới
 * một link khác. Chỉ nhìn hostname ngoài cùng là bị lừa sạch.
 */
const THAM_SO_CHUYEN_HUONG = ['url', 'u', 'redirect', 'redirect_uri', 'next', 'target', 'r', 'link', 'to', 'dest', 'destination', 'continue', 'returnurl', 'return_url', 'goto'];

function trichLinkLong(url) {
  const ra = [];
  try {
    const co = /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `http://${url}`;
    const u = new URL(co);
    for (const [ten, giaTri] of u.searchParams) {
      if (!THAM_SO_CHUYEN_HUONG.includes(ten.toLowerCase())) continue;
      let v = giaTri;
      // Giải mã tối đa hai lượt — kẻ lừa đảo hay mã hoá hai lần để né bộ lọc.
      for (let i = 0; i < 2; i += 1) {
        try {
          const g = decodeURIComponent(v);
          if (g === v) break;
          v = g;
        } catch { break; }
      }
      if (/[a-z0-9-]+\.[a-z]{2,}/i.test(v)) ra.push(v);
    }
  } catch { /* URL hỏng: tầng gọi đã ghi vào khongDocDuoc */ }
  return ra;
}

/**
 * Trích mọi URL trong văn bản, cả dạng đầy đủ lẫn dạng trần, cả link lồng.
 * @returns {{tho:string[], khongDocDuoc:string[]}}
 */
function trichMoiUrl(vanBan = '') {
  const t = String(vanBan);
  const tho = new Set();
  const khongDocDuoc = [];

  RE_URL_DAY_DU.lastIndex = 0;
  for (const u of t.match(RE_URL_DAY_DU) || []) tho.add(u.replace(/[.,;:!?)]+$/, ''));

  RE_URL_IP.lastIndex = 0;
  for (const u of t.match(RE_URL_IP) || []) {
    const sach = u.replace(/[.,;:!?)]+$/, '');
    if (![...tho].some((x) => x.includes(sach))) tho.add(sach);
  }

  RE_URL_TRAN.lastIndex = 0;
  for (const u of t.match(RE_URL_TRAN) || []) {
    const sach = u.replace(/[.,;:!?)]+$/, '');
    // Đã nằm trong một URL đầy đủ rồi thì thôi.
    if ([...tho].some((x) => x.includes(sach))) continue;
    const host = sach.split('/')[0];
    const duoi = host.split('.').pop().toLowerCase();
    if (!DUOI_GIA.has(duoi)) continue;   // "gui.cho", "3.5" — không phải tên miền
    tho.add(sach);
  }

  const tatCa = new Set(tho);
  for (const u of tho) for (const con of trichLinkLong(u)) tatCa.add(con);

  for (const u of tatCa) if (!docHostname(u)) khongDocDuoc.push(u);

  return { tho: [...tatCa], khongDocDuoc };
}

/**
 * Phân tích một URL. KHÔNG kết luận mức rủi ro — chỉ mô tả sự thật về chuỗi.
 * Việc kết luận là của tầng 0 (luật) và của `decision-engine` (điểm).
 */
function phanTichMotUrl(url, luat) {
  const host = docHostname(url);
  if (!host) return null;
  const reg = layRegistrableDomain(host);
  const nhan = phanNhan(reg);
  const duoi = phanDuoi(reg);

  const trongAllowlist = luat.allowlistTenMien.includes(reg)
    || luat.allowlistHauTo.some((h) => reg === h || reg.endsWith(`.${h}`));

  // Lệch thương hiệu: tên thương hiệu có trong hostname NHƯNG eTLD+1 không phải
  // tên miền chính thức của thương hiệu đó. `vietcombank.com.vn.kẻ-gian.top`
  // KHÔNG PHẢI Vietcombank — đây đúng là lý do phải so bằng eTLD+1.
  let lechThuongHieu = null;
  for (const th of luat.thuongHieu) {
    if (host.includes(th.ten) && !th.domains.includes(reg)) { lechThuongHieu = th.ten; break; }
  }

  /**
   * Nhái theo khoảng cách chỉnh sửa: `vietconbank.com.vn`, `dichvucang.gov.vn`.
   *
   * ⚠️ TRẦN KHOẢNG CÁCH PHẢI THEO ĐỘ DÀI, KHÔNG ĐƯỢC CỐ ĐỊNH Ở 2.
   *
   * ĐO ĐƯỢC 4/9/2026: trần cố định 2 làm `vidu.vn` bị coi là nhái `bidv.com.vn`
   * (v→b, u→v: đúng 2 phép sửa) và một tin nhắn hoàn toàn lành ra CAO. Với nhãn
   * ngắn thì hai phép sửa là NỬA CÁI TÊN — mọi từ bốn chữ đều "gần" nhau.
   *
   * Nhãn ngắn (csgt, vcb, tpb) đã được nhánh `lechThuongHieu` ở trên lo: chúng
   * bị bắt khi tên hãng NẰM TRONG hostname mà eTLD+1 không phải của hãng. Nhánh
   * Levenshtein này chỉ để bắt LỖI CHÍNH TẢ trong tên dài, nên đòi nhãn ≥ 6 ký
   * tự và siết trần xuống 1 cho nhãn ngắn hơn 7.
   */
  let nhaiGan = null;
  if (!trongAllowlist && nhan.length >= 6) {
    for (const chinhChu of luat.allowlistTenMien) {
      const nhanChinh = phanNhan(chinhChu);
      if (nhanChinh.length < 6) continue;
      const tran = Math.min(nhan.length, nhanChinh.length) >= 7 ? 2 : 1;
      const d = levenshtein(nhan, nhanChinh, tran);
      if (d > 0 && d <= tran) { nhaiGan = { giong: chinhChu, khoangCach: d }; break; }
    }
  }

  return {
    url,
    host,
    reg,
    nhan,
    duoi,
    trongAllowlist,
    lechThuongHieu,
    nhaiGan,
    laPunycode: host.startsWith('xn--') || host.includes('.xn--'),
    laIp: RE_IP.test(host),
    laRutGon: luat.rutGon.includes(reg),
    duoiRuiRo: luat.duoiMienRuiRo.includes(duoi),
    laApk: /\.apk(\?|#|$)/i.test(url),
    laKhoChinhThuc: luat.khoAppChinhThuc.includes(host) || luat.khoAppChinhThuc.includes(reg),
  };
}

const chuanSo = (s) => s.replace(/[^\d+]/g, '');

/**
 * Trích thực thể. Số tài khoản CHỈ được nhận khi có ngữ cảnh tài khoản đứng gần
 * — xem ghi chú trong `bo-luat-mac-dinh.json`. Một dãy 10 chữ số trần trụi
 * trong tin nhắn thật thường là mã đơn hàng, mã vận đơn, hoặc số hoá đơn.
 */
function trichThucTheTin(ban, luat) {
  const t = ban.goCheUrl;

  const dienThoai = [...new Set((t.match(RE_DIEN_THOAI) || []).map(chuanSo))]
    .filter((s) => {
      const n = s.replace('+', '').length;
      return n >= 9 && n <= 12;
    });
  const dtTho = new Set(dienThoai);

  const daySo = [...new Set((t.match(RE_DAY_SO) || []).map(chuanSo))]
    .filter((s) => s.length >= 9 && !dtTho.has(s) && !dtTho.has(`0${s}`));

  /*
   * Ngữ cảnh tài khoản phải nằm trong cùng tin — không đòi kề sát vì tiếng Việt
   * hay viết "STK: 0123456789 - NGUYEN VAN A - Vietcombank", có khi xuống dòng.
   *
   * ⚠️ PHẢI DÙNG `timCum`, KHÔNG DÙNG `khongDau.includes(c)` TRỰC TIẾP.
   * Cụm trong bộ luật viết CÓ DẤU ("số tài khoản"), còn `ban.khongDau` đã bỏ
   * dấu — so thẳng thì KHÔNG BAO GIỜ khớp, và cả luật R6 chết lặng. Đo được
   * 4/9/2026: năm tin lừa đảo có đủ cả ba vế đều ra "chưa thấy dấu hiệu rủi ro"
   * chỉ vì một phép so lệch bảng mã. `timCum` bỏ dấu CẢ HAI VẾ trước khi so.
   */
  const coNguCanhTk = Boolean(timCum(ban, luat.nguCanhSoTaiKhoan));
  const soTaiKhoan = coNguCanhTk ? daySo : [];

  const soTien = [...new Set((t.match(RE_TIEN) || []).map((s) => s.trim().toLowerCase()))];

  return { dienThoai, daySo, soTaiKhoan, soTien };
}

/**
 * @param {{goc:string,goCheUrl:string,thap:string,khongDau:string}} ban  đã chuẩn hoá
 * @param {object} luat  bộ luật đang hiệu lực
 */
function phanTichTang1(ban, luat) {
  const { tho, khongDocDuoc } = trichMoiUrl(ban.goCheUrl);
  const urls = tho.map((u) => phanTichMotUrl(u, luat)).filter(Boolean);
  const thucThe = trichThucTheTin(ban, luat);
  return { urls, urlKhongDocDuoc: khongDocDuoc, ...thucThe };
}

module.exports = {
  phanTichTang1, trichMoiUrl, phanTichMotUrl, trichLinkLong, trichThucTheTin,
  levenshtein, phanNhan, phanDuoi, docHostname, docHostnameTho,
};
