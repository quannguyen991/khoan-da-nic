/**
 * TIN LỪA ĐẢO LẤY TỪ BÁO THẬT.
 *
 * ══════════ BỐN LUẬT CHO TỆP NÀY ══════════
 *
 * ① §11 — KHÔNG CẢNH BÁO NÀO ĐƯỢC THIẾU NGUỒN.
 *    Mỗi tin BẮT BUỘC mang tên báo và đường dẫn gốc. Tin nào thiếu một trong
 *    hai thì bị loại, không "tạm hiển thị". Danh sách tin cứng trước đây không
 *    có nguồn nào — đó đúng là thứ §11 cấm.
 *
 * ② §4.3 — "KHÔNG LẤY ĐƯỢC TIN" KHÁC "KHÔNG CÓ TIN NÀO".
 *    Mất mạng, báo đổi địa chỉ, đường hầm chết — cả ba đều cho ra danh sách
 *    rỗng. Trả về `[]` trơn là để màn hình nói "hôm nay không có vụ lừa đảo
 *    nào", một câu vừa sai vừa nguy hiểm. Nên phong bì có `chuaLayDuoc` và
 *    frontend PHẢI hiện nó.
 *
 * ③ §12 — KHÔNG QUY KẾT CÁ NHÂN. Ta chỉ chuyển tiếp TIÊU ĐỀ và LIÊN KẾT của
 *    báo. Không tóm tắt lại, không rút ra kết luận, không ghép tên người vào
 *    thủ đoạn. Ai muốn biết chi tiết thì bấm sang báo đọc.
 *
 * ④ KHÔNG CHẶN ĐƯỜNG PHÂN TÍCH. Lấy tin chạy nền theo hẹn giờ và có bộ nhớ
 *    đệm trên đĩa. §6.7: không tính năng phụ nào được chặn đường kiểm tin nhắn.
 *    Không lượt `/api/analyze` nào chờ một tờ báo trả lời.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { boDau } = require('./analysis/context-builder');

/**
 * Nguồn RSS — đã dò sống ngày 16/8/2026.
 *
 * ⚠️ `ten` là thứ hiện cho người đọc thấy, và nó là một phần của §11: bác phải
 * biết tin này của báo nào. Đừng bỏ nó đi cho gọn.
 *
 * ⚠️ cand.com.vn trả 302 và không theo được — bỏ ra, không để một mục chết
 * trong danh sách rồi tưởng là đang có 6 nguồn.
 */
const NGUON = [
  { ten: 'VnExpress', rss: 'https://vnexpress.net/rss/phap-luat.rss' },
  { ten: 'Tuổi Trẻ', rss: 'https://tuoitre.vn/rss/phap-luat.rss' },
  { ten: 'Dân Trí', rss: 'https://dantri.com.vn/rss/phap-luat.rss' },
  { ten: 'VietnamNet', rss: 'https://vietnamnet.vn/rss/phap-luat.rss' },
  { ten: 'Thanh Niên', rss: 'https://thanhnien.vn/rss/thoi-su.rss' },
];

/**
 * Lọc tin thật sự về lừa đảo.
 *
 * ⚠️ VIẾT KHÔNG DẤU và so trên bản đã bỏ dấu — tiêu đề báo có dấu, nhưng viết
 * luật không dấu thì một biểu thức bắt được cả hai.
 *
 * ⚠️ ĐỪNG THÊM CỤM QUÁ RỘNG. "cong an" một mình sẽ kéo về mọi tin bổ nhiệm,
 * hội nghị, trụ sở — đúng cái đã thấy ở dòng đầu feed VnExpress. Cụm phải nói
 * về THỦ ĐOẠN, không phải về ngành.
 */
const LA_TIN_LUA_DAO = new RegExp(`\\b(${[
  'lua dao', 'lua tien', 'chiem doat', 'gia danh', 'mao danh', 'gia mao',
  'lua qua mang', 'bay lua', 'chieu tro', 'thu doan', 'sap bay',
  'otp', 'ma xac thuc', 'tai khoan ngan hang', 'chuyen khoan',
  'app gia', 'ung dung gia', 'web gia', 'link la', 'duong link gia',
  'sim rac', 'cuoc goi rac', 'tin nhan rac', 'deepfake', 'cuoc goi video gia',
  'viec nhe luong cao', 'tuyen cong tac vien', 'dau tu tai chinh',
  'san thuong mai gia', 'trung thuong',
  /*
   * ⚠️ ĐỪNG THÊM 'nhan qua' — ĐÃ ĐO NGÀY 16/8/2026.
   * Bỏ dấu xong, tiêu đề "Ba công an hiến máu cứu phạm NHÂN QUA nguy kịch"
   * chứa đúng chuỗi "nhan qua". Một tin hiến máu lọt thẳng vào danh sách cảnh
   * báo lừa đảo. Bỏ dấu làm ranh giới ngữ nghĩa biến mất, nên cụm hai âm tiết
   * quá phổ biến là bẫy: phải cụ thể tới mức chỉ thủ đoạn mới trúng.
   */
].join('|')})\\b`, 'i');

/**
 * ═════ NGUỒN TIẾNG ANH — đã dò sống ngày 20/8/2026 ═════
 *
 * Người chọn English vẫn nhận nguyên tin tiếng Việt: năm tờ báo trong `NGUON`
 * đều là báo Việt, và bộ lọc `LA_TIN_LUA_DAO` cũng viết bằng tiếng Việt không
 * dấu nên tiêu đề tiếng Anh không bao giờ khớp — người dùng English thấy một
 * danh sách trống hoặc một danh sách tiếng Việt. Cả hai đều sai.
 *
 * ⚠️ ƯU TIÊN CƠ QUAN BẢO VỆ NGƯỜI TIÊU DÙNG, KHÔNG PHẢI BÁO CÔNG NGHỆ.
 * FTC và FBI IC3 viết cho người bị nhắm tới, bằng câu thường; trang tin bảo mật
 * viết cho quản trị hệ thống. Người dùng của app này thuộc nhóm thứ nhất.
 *
 * ⚠️ ĐÃ DÒ VÀ LOẠI: Action Fraud UK trả 403, Scamwatch AU và Which? trả 404.
 * Để một mục chết trong danh sách rồi tưởng đang có sáu nguồn là tự lừa mình —
 * cùng bài học với cand.com.vn ở `NGUON`.
 */
const NGUON_EN = [
  { ten: 'FTC Consumer Alerts', rss: 'https://consumer.ftc.gov/blog/rss' },
  { ten: 'FBI IC3', rss: 'https://www.ic3.gov/CSA/RSS' },
  { ten: 'BleepingComputer', rss: 'https://www.bleepingcomputer.com/feed/' },
  { ten: 'Krebs on Security', rss: 'https://krebsonsecurity.com/feed/' },
];

/**
 * Lọc tin lừa đảo trong tiêu đề tiếng Anh.
 *
 * ⚠️ VIẾT ĐỦ BIẾN THỂ, ĐỪNG TRÔNG CHỜ VÀO GỐC TỪ. Biểu thức dùng `\b(...)\b`
 * nên 'scammer' KHÔNG bắt được 'scammers', và 'impersonat' không bắt được gì
 * cả. Thà liệt kê dài còn hơn im lặng trượt.
 *
 * ⚠️ CÙNG LUẬT VỚI BẢN TIẾNG VIỆT: cụm phải nói về THỦ ĐOẠN. Không thêm
 * 'police', 'bank', 'crypto' đứng một mình — chúng kéo về mọi tin của ngành.
 */
const LA_TIN_LUA_DAO_EN = new RegExp(`\\b(${[
  'scam', 'scams', 'scammer', 'scammers', 'scamming',
  'fraud', 'frauds', 'fraudster', 'fraudsters', 'fraudulent',
  'phishing', 'smishing', 'vishing', 'spoofing', 'spoofed',
  'impersonation', 'impersonating', 'impersonator', 'impersonators',
  'deepfake', 'deepfakes', 'sextortion', 'extortion',
  'identity theft', 'gift card', 'gift cards', 'wire transfer',
  'romance scam', 'tech support', 'robocall', 'robocalls',
  'one-time passcode', 'otp', 'fake app', 'fake apps', 'malicious app',
  'account takeover', 'money mule', 'con artist', 'swindle', 'swindled',
].join('|')})\\b`, 'i');

/** Chọn bộ nguồn và bộ lọc theo ngôn ngữ. Ngôn ngữ lạ ⇒ tiếng Việt. */
function boNguon(lang) {
  return lang === 'en'
    ? { nguon: NGUON_EN, loc: LA_TIN_LUA_DAO_EN }
    : { nguon: NGUON, loc: LA_TIN_LUA_DAO };
}

/*
 * ⚠️ MỖI NGÔN NGỮ MỘT TỆP ĐỆM. Dùng chung một tệp thì lượt tiếng Anh ghi đè
 * đệm tiếng Việt và ngược lại — người dùng sau nhận tin của ngôn ngữ khác,
 * hoặc tệ hơn, nhận danh sách rỗng vì bộ lọc bên kia không khớp.
 */
const tepDem = (lang) => path.join(
  __dirname, '..', '.cache', lang === 'en' ? 'tin-lua-dao-en.json' : 'tin-lua-dao.json');
const HAN_DEM_MS = 30 * 60 * 1000;        // 30 phút
const HAN_GOI_MS = 8000;                  // mỗi tờ báo tối đa 8 giây
const SO_TIN = 12;

// ═══════════ Phân tích RSS ═══════════

/**
 * ⚠️ BẢNG TÊN THỰC THỂ DỰNG BẰNG CÔNG THỨC, KHÔNG LIỆT KÊ TAY.
 *
 * Đo 16/8/2026: Thanh Niên gửi chữ có dấu dưới dạng TÊN thực thể — 143 lần
 * `&agrave;`, 132 lần `&aacute;`, 75 lần `&ocirc;`… Không giải ra thì tiêu đề
 * hiện nguyên văn "C&ocirc;ng an C&agrave; Mau" trên màn hình của bác.
 *
 * Tên thực thể theo đúng một quy tắc: chữ cái + tên dấu. Ghép chữ cái với dấu
 * tổ hợp Unicode rồi chuẩn hoá NFC là ra ký tự đúng — 7 dòng thay cho một bảng
 * trăm dòng, và không bỏ sót chữ nào.
 *
 * ⚠️ Dấu tiếng Việt CHỒNG HAI TẦNG (ế, ộ, ữ) không có tên thực thể — báo gửi
 * chúng dưới dạng UTF-8 thô hoặc số. Cả hai đường đều đã xử lý bên dưới.
 */
const DAU = {
  grave: '̀', acute: '́', circ: '̂', tilde: '̃',
  uml: '̈', ring: '̊', cedil: '̧',
};

const TEN_THUC_THE = (() => {
  const b = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    dstrok: 'đ', Dstrok: 'Đ', ndash: '–', mdash: '—',
    hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  };
  for (const c of 'aeiouyAEIOUYnNcC') {
    for (const [ten, dau] of Object.entries(DAU)) {
      b[c + ten] = (c + dau).normalize('NFC');
    }
  }
  return b;
})();

/**
 * Giải mã thực thể HTML.
 *
 * ⚠️ MỘT LƯỢT QUÉT DUY NHẤT, KHÔNG GIẢI NHIỀU VÒNG.
 * Giải lặp cho tới khi "hết thực thể" thì `&amp;lt;` — một dấu `<` do người ta
 * cố tình viết ra — sẽ thành `<` thật, và mở đúng cái cửa mà việc gỡ thẻ HTML
 * bên dưới sinh ra để đóng.
 */
function goThucThe(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-zA-Z]+);/gi, (nguyen, ma) => {
    if (ma[0] === '#') {
      const n = ma[1] === 'x' || ma[1] === 'X'
        ? parseInt(ma.slice(2), 16)
        : parseInt(ma.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : nguyen;
    }
    // Không biết tên nào thì GIỮ NGUYÊN, đừng nuốt mất chữ.
    return Object.prototype.hasOwnProperty.call(TEN_THUC_THE, ma) ? TEN_THUC_THE[ma] : nguyen;
  });
}

/** Lấy nội dung một thẻ, bóc CDATA nếu có. */
function lay(khoi, the) {
  const m = khoi.match(new RegExp(`<${the}[^>]*>([\\s\\S]*?)</${the}>`, 'i'));
  if (!m) return '';
  const trong = m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
  return goThucThe(trong).trim();
}

/**
 * Bóc các mục từ một chuỗi RSS.
 *
 * ⚠️ KHÔNG DỰNG HTML CỦA BÁO. `<description>` chứa HTML thật (thẻ `<a>`,
 * `<img>` trỏ ra ngoài). Đưa thẳng vào giao diện là mở đường chèn mã và phá
 * luôn CSP `img-src 'self'`. Ở đây gỡ sạch thẻ, chỉ giữ chữ.
 */
/**
 * Bỏ thẻ HTML và giải mã thực thể trong chữ lấy từ RSS.
 *
 * ⚠️ TIÊU ĐỀ CŨNG PHẢI LÀM SẠCH, KHÔNG CHỈ PHẦN TÓM TẮT.
 * Đo 20/8/2026: feed của FTC gói tiêu đề trong một thẻ `<a href="…">`, nên màn
 * hình hiện nguyên `<a href="https://consumer.ftc.gov/…` thay vì tên bài. Bản
 * trước chỉ làm sạch `description` — mọi báo Việt để tiêu đề trần nên lỗi này
 * nằm im cho tới khi thêm nguồn tiếng Anh.
 */
function lamSachChu(x) {
  return String(x || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#8217;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bocRss(xml, tenBao) {
  const ra = [];
  for (const m of xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)) {
    const khoi = m[1];
    const tieuDeTho = lay(khoi, 'title');
    const tieuDe = lamSachChu(tieuDeTho);

    /*
     * ⚠️ THẺ `<link>` CỦA MỘT SỐ FEED LÀ RÁC — PHẢI NHẬN RA VÀ VÒNG QUA.
     *
     * Đo 20/8/2026, feed của FTC trả về:
     *   <link>https://consumer.ftc.gov/%3Ca%20href%3D%22https%3A//consumer.ftc.gov/
     *         consumer-alerts/2026/08/...%22%20hreflang%3D%22en%22%3Eview%3C/a%3E</link>
     * Tức cả một thẻ <a> bị mã hoá URL nhét vào chỗ đáng lẽ là địa chỉ. Nó
     * VẪN qua được phép kiểm `^https?://` vì phần đầu trông như URL thật — nên
     * mọi tin FTC hiện ra bình thường, bấm vào mới ra "page not found".
     *
     * Địa chỉ thật nằm trong `href` của thẻ <a> ở tiêu đề. Dấu hiệu nhận biết
     * là `%3C` (dấu `<` đã mã hoá) hoặc `%22` (dấu nháy kép) nằm trong đường dẫn.
     */
    const hrefTrongTieuDe = (tieuDeTho.match(/href="(https?:\/\/[^"]+)"/i) || [])[1];
    const lienKetTho = lay(khoi, 'link');
    const lienKet = (/%3C|%3E|%22|<a[\s>]/i.test(lienKetTho) && hrefTrongTieuDe)
      ? hrefTrongTieuDe
      : lienKetTho;

    // §11 — thiếu tiêu đề hoặc thiếu link thì LOẠI, không hiện nửa vời.
    if (!tieuDe || !/^https?:\/\//.test(lienKet)) continue;

    const tom = lamSachChu(lay(khoi, 'description')).slice(0, 220);

    const luc = Date.parse(lay(khoi, 'pubDate'));

    ra.push({
      tieuDe,
      tomTat: tom,
      lienKet,
      nguon: tenBao,
      luc: Number.isFinite(luc) ? luc : null,
    });
  }
  return ra;
}

// ═══════════ Lấy tin ═══════════

async function lay1Nguon(n) {
  const bo = new AbortController();
  const h = setTimeout(() => bo.abort(), HAN_GOI_MS);
  try {
    const r = await fetch(n.rss, {
      signal: bo.signal,
      headers: { 'user-agent': 'KhoanDa/1.0 (+doc-tin-canh-bao-lua-dao)' },
    });
    if (!r.ok) return { ten: n.ten, tin: [], loi: `http_${r.status}` };
    return { ten: n.ten, tin: bocRss(await r.text(), n.ten), loi: null };
  } catch (e) {
    return { ten: n.ten, tin: [], loi: e?.name === 'AbortError' ? 'het_gio' : 'khong_goi_duoc' };
  } finally {
    clearTimeout(h);
  }
}

function docDem(lang) {
  try {
    const d = JSON.parse(fs.readFileSync(tepDem(lang), 'utf8'));
    if (Array.isArray(d?.tin) && Number.isFinite(d?.luc)) return d;
  } catch { /* chưa có đệm, hoặc đệm hỏng — cả hai đều xử như không có */ }
  return null;
}

function ghiDem(d, lang) {
  try {
    fs.mkdirSync(path.dirname(tepDem(lang)), { recursive: true });
    fs.writeFileSync(tepDem(lang), JSON.stringify(d));
  } catch { /* đĩa chỉ đọc — vẫn chạy được, chỉ là lần sau phải lấy lại */ }
}

/**
 * Lấy tin từ mọi nguồn, lọc, gộp, sắp theo thời gian.
 *
 * @returns {Promise<{tin: object[], luc: number, chuaLayDuoc: string[], nguonHong: string[]}>}
 */
async function layTinMoi(lang = 'vi') {
  const { nguon, loc } = boNguon(lang);
  const ket = await Promise.all(nguon.map(lay1Nguon));

  const nguonHong = ket.filter((k) => k.loi).map((k) => k.ten);
  const gop = ket.flatMap((k) => k.tin).filter((t) => loc.test(boDau(t.tieuDe.toLowerCase())));

  // Trùng bài giữa các báo — bỏ theo đường dẫn.
  const thay = new Set();
  const rieng = gop.filter((t) => (thay.has(t.lienKet) ? false : (thay.add(t.lienKet), true)));

  rieng.sort((a, b) => (b.luc ?? 0) - (a.luc ?? 0));

  return {
    tin: rieng.slice(0, SO_TIN),
    luc: Date.now(),
    /*
     * ⚠️ §4.3 — MẤT NGUỒN PHẢI NÓI RA.
     * Ba trong năm tờ báo không trả lời thì danh sách ngắn đi, nhưng màn hình
     * KHÔNG được để bác hiểu là "dạo này ít lừa đảo". `chuaLayDuoc` là mã, tra
     * ra câu ở catalog frontend — §HĐ luật 2.
     */
    chuaLayDuoc: nguonHong.length ? ['khong_lay_duoc_mot_so_bao'] : [],
    nguonHong,
  };
}

/**
 * Tin để phục vụ. Dùng đệm nếu còn hạn; hết hạn thì lấy mới, lỗi thì vẫn trả
 * đệm cũ kèm lời khai.
 *
 * ⚠️ KHÔNG BAO GIỜ NÉM. Đây là tính năng phụ; §6.7 nói nó không được chặn gì.
 */
async function tinLuaDao({ epLayMoi = false, lang = 'vi' } = {}) {
  const dem = docDem(lang);
  const conHan = dem && Date.now() - dem.luc < HAN_DEM_MS;
  if (conHan && !epLayMoi) return { ...dem, tuDem: true };

  try {
    const moi = await layTinMoi(lang);
    /*
     * ⚠️ LẤY VỀ RỖNG THÌ GIỮ ĐỆM CŨ, ĐỪNG GHI ĐÈ BẰNG SỰ TRỐNG RỖNG.
     * Mọi tờ báo cùng lỗi một lúc (mất mạng) sẽ cho `tin: []`. Ghi cái đó vào
     * đệm là tự tay xoá mất dữ liệu tốt, rồi lần sau đọc đệm ra rỗng và tưởng
     * là thật.
     */
    if (moi.tin.length === 0 && dem?.tin?.length) {
      return { ...dem, chuaLayDuoc: ['khong_lay_duoc_tin_moi'], nguonHong: moi.nguonHong, tuDem: true };
    }
    ghiDem(moi, lang);
    return { ...moi, tuDem: false };
  } catch {
    if (dem) return { ...dem, chuaLayDuoc: ['khong_lay_duoc_tin_moi'], tuDem: true };
    // Không đệm, không lấy được: nói thẳng là chưa lấy được, KHÔNG nói là không có tin.
    return { tin: [], luc: Date.now(), chuaLayDuoc: ['khong_lay_duoc_tin_moi'], nguonHong: [], tuDem: false };
  }
}

module.exports = { tinLuaDao, layTinMoi, bocRss, lamSachChu, LA_TIN_LUA_DAO, LA_TIN_LUA_DAO_EN, NGUON, NGUON_EN };
