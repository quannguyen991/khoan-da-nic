'use strict';
/**
 * Phụ lục C — CHỐNG BÁO ĐỘNG GIẢ.
 *
 * HÀM THUẦN: không mạng, không AI, không đồng hồ.
 *
 * C.1 — hàng rào là CẤU TRÚC, không phải danh sách từ khoá. Câu
 * "The FTC warns that scammers may ask you to buy gift cards" chứa ĐỦ MỌI từ khoá
 * của một vụ lừa thẻ quà tặng. Không danh sách từ khoá nào phân biệt được nó với
 * một vụ lừa thật — chỉ có cấu trúc câu.
 *
 * C.3 — bốn bẫy đã cắn, đừng cắn lại:
 *  1. Sức ép và danh tính hầu như luôn nằm ở câu TƯỜNG THUẬT. Bắt từng câu tự
 *     chứng minh mình là mệnh lệnh là hiểu sai cách một kịch bản lừa đảo được viết.
 *  2. Rất nhiều lời đòi tiền được viết dạng tường thuật, không có mệnh lệnh nào.
 *  3. Mệnh lệnh phủ định ở mệnh đề PHỤ không được quyết định cả câu.
 *  4. Động từ quá khứ ngôi thứ nhất ở GIỮA câu thường là mệnh đề phụ.
 */

const SPEECH_ACTS = Object.freeze([
  'request_command',    // yêu cầu hiện tại gửi tới người dùng
  'notification',       // "Quý khách đã chuyển 5.000.000đ"
  'warning_education',  // bài cảnh báo chống lừa đảo
  'quoted_report',      // "kẻ lừa đảo bảo tôi rằng…"
  'past_event',         // "hôm qua tôi đã chuyển rồi"
  'self_directed',      // người dùng tự quyết định làm
  'unknown',
]);

/**
 * Đoạn ĐÃ ĐƯỢC NHẬN RA là ngữ cảnh an toàn thì tự loại mình khỏi action-risk.
 * ⚠️ "unknown" KHÔNG nằm trong danh sách này — không nhận ra được thì KHÔNG có
 * quyền im lặng bỏ qua. Đó là biến thể của lỗi §4.3.
 */
const NON_ACTIONABLE_ACTS = new Set([
  'warning_education', 'notification', 'past_event', 'self_directed', 'quoted_report',
]);

// ─────────────────────── Chuẩn hoá (§6.13) ───────────────────────

const CONTRACTIONS = [
  [/\bdon't\b/g, 'do not'], [/\bcan't\b/g, 'cannot'], [/\bwon't\b/g, 'will not'],
  [/\bdoesn't\b/g, 'does not'], [/\bdidn't\b/g, 'did not'], [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'], [/\bwasn't\b/g, 'was not'], [/\bweren't\b/g, 'were not'],
  [/\bhaven't\b/g, 'have not'], [/\bhasn't\b/g, 'has not'], [/\bhadn't\b/g, 'had not'],
  [/\bshouldn't\b/g, 'should not'], [/\bwouldn't\b/g, 'would not'],
  [/\bcouldn't\b/g, 'could not'], [/\bi'm\b/g, 'i am'], [/\bit's\b/g, 'it is'],
  [/\byou're\b/g, 'you are'], [/\bthey're\b/g, 'they are'], [/\bi've\b/g, 'i have'],
  [/\bi'll\b/g, 'i will'], [/\byou'll\b/g, 'you will'], [/\bthat's\b/g, 'that is'],
];

/**
 * Gỡ CHE CHỮ BẰNG DẤU PHÂN CÁCH: `c-h-u-y-ể-n t-i-ề-n` → `chuyển tiền`.
 *
 * ⚠️ ĐÂY LÀ BIẾN THỂ PHỤ, KHÔNG PHẢI BẢN CHUẨN HOÁ GỐC.
 *
 * Bản đầu tôi đặt hàm này thẳng vào `chuanHoa()`. Đo được: recall KHÔNG đổi
 * (65,3% cả hai bên) nhưng FP tăng 10,1% → 10,8%. Vì đổi bản chuẩn hoá gốc là
 * đổi luôn phân loại speech act và cách khớp scope của MỌI mẫu, kể cả mẫu không
 * hề bị che chữ.
 *
 * Nên nó nằm cùng chỗ với biến thể nhiễu OCR: CHỈ THÊM khả năng bắt, không bao
 * giờ đụng vào bản gốc. Đúng tinh thần §4.2 — chỉ làm tăng cảnh giác.
 */
const RE_CAP_CHE = /\p{L}[-._·•]\p{L}/gu;
const NGUONG_MAT_DO_CHE = 5;

function goCheChu(t) {
  // ⚠️ PHẢI dùng \p{L}, KHÔNG dùng \w hay [^\W]. `\w` của JavaScript chỉ là
  // [A-Za-z0-9_], nên `ể` bị coi là KHÔNG phải chữ và biểu thức đứt giữa chừng:
  // "c-h-u-y-ể-n" chỉ gỡ được thành "chuy-ể-n". Cùng gốc rễ với lỗi `\b` không
  // nhận chữ có dấu đã ghi ở locale-packs/vi-VN.js.
  RE_CAP_CHE.lastIndex = 0;
  const matDo = (t.match(RE_CAP_CHE) || []).length;

  // Che chữ là thủ đoạn áp cho CẢ TIN NHẮN, không phải cho một từ. Mật độ cao ⇒
  // gỡ triệt để, bắt được cả từ ngắn như "v-à-o", "a-n".
  if (matDo >= NGUONG_MAT_DO_CHE) {
    return t.replace(/(\p{L})[-._·•](?=\p{L})/gu, '$1');
  }
  // Mật độ thấp ⇒ chỉ gỡ chuỗi dài, để yên "Việt-Anh", "e-mail", "2026-08-15".
  return t.replace(/(?:\p{L}[-._·•]){3,}\p{L}/gu, (m) => m.replace(/[-._·•]/g, ''));
}

/** Case-fold để khớp, GIỮ ranh giới câu và dấu câu tới khi phủ định/scope giải xong. */
/**
 * DẤU NGĂN HÀNG NGHÌN GIỮA HAI CHỮ SỐ — bỏ đi.
 *
 * ⚠️ ĐÂY LÀ LỖ LỚN NHẤT ĐÃ TÌM RA Ở CUE BANK, và nó nằm ở chỗ không ai nhìn.
 *
 * Gần như MỌI mẫu trong locale pack dùng `[^.]{0,N}` làm cách nói "trong cùng
 * một câu". Nhưng tiền Việt viết `1.200.000đ` — dấu chấm nằm GIỮA cụm, nên
 * `[^.]` chặn ngang. Đo được:
 *   "Bác chuyển 1.200.000đ vào tài khoản này ngay" → FIN_TRANSFER_REQUEST TRƯỢT
 *   "Bác chuyển 1200000đ  vào tài khoản này ngay"  → bắt được
 * Cùng một câu, khác mỗi cách viết số. Mà cách viết CÓ dấu chấm mới là cách
 * tin nhắn thật viết.
 *
 * `catCau()` đã xử lý đúng ở tầng cắt câu (`laRanhGioi` bỏ qua dấu chấm giữa
 * hai chữ số) — nhưng tầng KHỚP MẪU thì chưa. Vá ở đây một lần cho tất cả mẫu,
 * thay vì sửa từng dòng cue và chắc chắn quên vài dòng.
 *
 * An toàn theo §4.2: bỏ ký tự ngăn chỉ làm khoảng `[^.]{0,N}` với tới XA HƠN,
 * tức chỉ THÊM khớp. Không mẫu nào trong locale pack chứa dấu chấm giữa số.
 */
/*
 * ⚠️ KHÔNG CÓ `` Ở CUỐI — ĐO ĐƯỢC 19/8/2026, VÀ ĐÂY LÀ MỘT LỖ CHỈ HỞ VỚI
 * TIẾNG VIỆT KHÔNG DẤU.
 *
 * Bản trước kết thúc bằng `\d{3}`. Ranh giới từ phân biệt chữ cái ASCII với
 * chữ khác, nên nó cư xử KHÁC NHAU giữa hai cách viết cùng một số tiền:
 *
 *   "1.200.000đ"  ->  1200000đ   (đ không phải chữ ASCII, có ranh giới)
 *   "1.200.000d"  ->  1200.000d  (d là chữ ASCII, KHÔNG có ranh giới)
 *
 * Dấu chấm còn sót chặn ngang `[^.]{0,N}` của gần như mọi mẫu trong locale
 * pack — tức toàn bộ cue bank mù với tin nhắn viết KHÔNG DẤU có kèm số tiền.
 * Mà không dấu chính là cách tin nhắn lừa đảo hay được viết nhất.
 *
 * Đo trên ca `viec-nhe-luong-cao` ("Chi nap 1.200.000d lam nhiem vu cuoi la rut
 * duoc ca von lan thuong"): cả hai mẫu OFF_TASK_PREPAY đều trượt, tầng luật câm
 * hoàn toàn — trong khi mẫu viết ra chính là để bắt câu đó.
 *
 * `evidence-validator.js` đã dùng đúng dạng không có ranh giới từ từ trước. Hai
 * tầng chuẩn hoá khác nhau tự nó là một lỗi: cùng một câu, tầng này thấy, tầng
 * kia không.
 */
/*
 * ⚠️ `(?!\d)` Ở CUỐI CHẶN NGÀY THÁNG. Không có nó thì "19.8.2026" thành
 * "19.82026" — dấu chấm giữa ngày và năm bị nuốt vì "202" trông như nhóm ba
 * chữ số. Tiền Việt luôn có nhóm ba chữ số ĐẦY ĐỦ rồi hết số, nên yêu cầu đó
 * loại được ngày tháng mà không bỏ sót số tiền nào.
 */
const NGAN_HANG_NGHIN = /(\d)[.,](?=\d{3}(?!\d))/g;

/**
 * Đuôi tên miền hay gặp trong tin nhắn lừa đảo Việt Nam. Dấu chấm trước chúng
 * được đổi thành dấu chấm giữa (·) để không chặn `[^.]` của cue bank.
 */
const DUOI_TEN_MIEN = /\.(com|net|org|info|online|top|xyz|site|vn|shop|store|club|icu|live|cc|app|link|space|website)\b/g;

function chuanHoa(s) {
  let t = s.toLowerCase().replace(NGAN_HANG_NGHIN, '$1');
  /*
   * ⚠️ DẤU CHẤM TRONG TÊN MIỀN CHẶN `[^.]` Y HỆT DẤU CHẤM TRONG SỐ TIỀN.
   *
   * Đo trên bộ 100 (19/8/2026): "Vao link nuoc-sach.online tai ung dung" —
   * mẫu `(vào|bấm|truy cập) link[^.]{0,40}(tải|cài)` trượt, vì dấu chấm của
   * `.online` nằm đúng giữa hai vế. Cùng một lỗ với `1.200.000d`, chỉ khác
   * loại dấu chấm; và nó bịt luôn cả họ kịch bản "vào link này tải app".
   *
   * ⚠️ CHỈ ĐỔI KHI THẤY ĐUÔI TÊN MIỀN THẬT. Đổi mọi dấu chấm giữa hai chữ cái
   * là nối liền hai câu ("...xong. Tôi..."), và `[^.]{0,N}` sẽ lan qua câu
   * khác — đúng thứ nó sinh ra để ngăn. Danh sách đuôi giữ hẹp, thêm được khi
   * gặp đuôi mới trong tin nhắn thật.
   */
  t = t.replace(DUOI_TEN_MIEN, '\u00b7$1');
  for (const [re, thay] of CONTRACTIONS) t = t.replace(re, thay);
  return t.replace(/[ \t]+/g, ' ').trim();
}

/** Bỏ dấu tiếng Việt — để so với danh sách C.5 (viết dạng không dấu). */
function boDau(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// ── Nhiễu OCR: KHÔNG có một ánh xạ đúng duy nhất ────────────────────
// "1nsta11" cần 1→l ở cuối nhưng 1→i ở đầu; "s1x-d1g1t" cần 1→i cả ba chỗ.
// Nên sinh TỔ HỢP các khả năng rồi chấp nhận bản nào khớp, thay vì chọn sẵn một bảng.
// "1nsta11" cần 1→i ở vị trí đầu VÀ 1→l ở hai vị trí cuối cùng một lúc — không
// bảng đồng nhất nào ra được "install". Nên sinh TỔ HỢP theo vị trí.
const OCR_LUA_CHON = { 0: ['o'], 1: ['l', 'i'], 5: ['s'] };
const OCR_TRAN = 128;

function bienTheOcr(s, ...themVao) {
  const viTri = [];
  for (let i = 0; i < s.length; i += 1) {
    if (OCR_LUA_CHON[s[i]]) viTri.push(i);
  }
  const rn = s.includes('rn') ? [s.replace(/rn/g, 'm')] : [];
  const phu = themVao.filter((x) => x && x !== s);
  if (viTri.length === 0) return [...new Set([s, ...rn, ...phu])];

  let bien = [s];
  for (const i of viTri) {
    if (bien.length * OCR_LUA_CHON[s[i]].length > OCR_TRAN) break;
    const tiep = [];
    for (const b of bien) {
      for (const ky of OCR_LUA_CHON[s[i]]) tiep.push(b.slice(0, i) + ky + b.slice(i + 1));
    }
    bien = tiep;
  }
  return [...new Set([...bien, ...rn, ...phu])];
}

// ─────────────────────── Nhận diện ngôn ngữ ───────────────────────
// ⚠️ Ngưỡng `mixed` là 1/1 — chỉ cần MỘT từ của ngôn ngữ kia là bật.
// Chạy thừa một pack rẻ hơn nhiều so với bỏ sót: "Bác ơi, please install AnyDesk"
// từng bị xếp tiếng Việt thuần nên pack tiếng Anh không chạy và CO-02 IM LẶNG.

const DAU_VIET = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;
const TU_VIET = /\b(bac|oi|nhe|khong|chuyen|tien|giup|cua|minh|toi|cai|nguoi|ngay|ma|quy khach|chau|anh|chi|ong|ba)\b/;
const TU_ANH = /\b(please|install|the|you|your|and|is|are|was|were|for|with|from|this|that|my|me|we|they|can|will|would|should|does|did|have|has|not|so|help|send|transfer|account|code|money|call|bank|share|hold|check|now|today|never|if|someone|officer|scammer|refund|fee|gift|card|screen|wallet|crypto|collect|cash|arrested|confidential)\b/;

function detectLanguage(raw) {
  if (!raw || !raw.trim()) return 'unknown';
  const n = chuanHoa(raw);
  const laViet = DAU_VIET.test(n) || TU_VIET.test(boDau(n));
  const laAnh = TU_ANH.test(n);
  if (laViet && laAnh) return 'mixed';
  if (laViet) return 'vi';
  if (laAnh) return 'en';
  return 'unknown';
}

function packDangDung(language) {
  if (language === 'vi') return ['vi-VN'];
  if (language === 'en') return ['en-US'];
  return ['en-US', 'vi-VN'];   // mixed và unknown: nạp cả hai, thà thừa còn hơn sót
}

// ─────────────────────── Cắt câu ───────────────────────
// ⚠️ KHÔNG bỏ dấu câu khi chuẩn hoá. Dấu chấm câu chính là thứ chia câu, mà chia
// sai thì phủ định trượt sang câu bên cạnh: "Never share your OTP. Send $500 now."
// gộp làm một là mất luôn cảnh báo HOẶC mất luôn yêu cầu.

/** Dấu chấm giữa hai chữ số KHÔNG phải ranh giới câu ("5.000.000đ", "20.8"). */
function laRanhGioi(s, i) {
  const c = s[i];
  if (c === '\n') return true;
  if (!'.!?;'.includes(c)) return false;
  if (c === '.' && /\d/.test(s[i - 1] || '') && /\d/.test(s[i + 1] || '')) return false;
  return true;
}

function catCau(goc) {
  const doan = [];
  let dau = 0;
  for (let i = 0; i < goc.length; i += 1) {
    if (!laRanhGioi(goc, i)) continue;
    // nuốt các dấu kết thúc liền nhau ("?!", "...")
    let cuoi = i + 1;
    while (cuoi < goc.length && '.!?;'.includes(goc[cuoi])) cuoi += 1;
    doan.push([dau, cuoi]);
    dau = cuoi;
  }
  if (dau < goc.length) doan.push([dau, goc.length]);

  return doan
    .map(([a, b]) => {
      const raw = goc.slice(a, b);
      const truoc = raw.length - raw.trimStart().length;
      const sau = raw.length - raw.trimEnd().length;
      return { start: a + truoc, end: b - sau };
    })
    .filter((d) => goc.slice(d.start, d.end).trim().length > 0)
    .map((d) => ({ ...d, text: goc.slice(d.start, d.end) }));
}

// ─────────────────────── Phân loại speech act ───────────────────────

/** Động từ mang RỦI RO HÀNH ĐỘNG — thứ mà một yêu cầu lừa đảo phải có. */
const DONG_TU_RUI_RO = new RegExp([
  // en
  'transfer', 'send', 'move', 'install', 'download', 'share', 'log ?in', 'logon',
  'pay', 'buy', 'purchase', 'provide', 'give', 'reveal', 'collect', 'wire', 'deposit',
  // vi
  'chuyển', 'gửi', 'đọc', 'cài', 'tải', 'bật', 'nộp', 'mua', 'cung cấp',
  'chia sẻ', 'đăng nhập', 'đóng phí', 'nhận tiền', 'giữ bí mật', 'nói với',
].join('|'), 'g');

/** Khung GIÁO DỤC / CẢNH BÁO. Vị trí của nó quyết định phạm vi chi phối. */
const KHUNG_GIAO_DUC = new RegExp([
  'never\\s+(share|give|send|tell|provide|reveal|install|ask|request)',
  'scammers?\\b[^.]{0,40}\\b(may|might|will|often|can)',
  'fraudsters?\\b', 'warns?\\s+(that|you)', 'be (aware|careful)',
  'if\\s+(someone|anyone|a caller)',

  /**
   * ── KHUNG CẢNH BÁO TIẾNG ANH BỔ SUNG — 20/8/2026 ──
   *
   * Đo trên bộ 200 tiếng Anh: cả BA ca báo oan đều là lời khuyên an toàn.
   *   "The bank will never ask you to transfer money to a safe account"
   *   "no one from HMRC will ever ask you to pay with gift cards"
   * Khung cũ có `never (share|give|send|tell…)` nhưng THIẾU `ask` — mà "sẽ không
   * bao giờ HỎI" mới là câu khuyên hay gặp nhất. Thiếu đúng một động từ.
   *
   * Đây chính là bẫy Phụ lục C: câu cảnh báo chứa ĐỦ MỌI từ khoá của vụ lừa mà
   * nó đang cảnh báo. Bên tiếng Việt đã có khung cho chuyện này từ lâu.
   *
   * ⚠️ MỖI KHUNG Ở ĐÂY LÀ MỘT LẦN HẠ CẢNH GIÁC — PHẢI ĐÒI CẤU TRÚC.
   * Không lấy từ khoá trần. "scam" một mình thì kẻ lừa cũng viết được
   * ("this is not a scam"); phải là dạng câu mà chỉ người ĐANG KHUYÊN mới viết.
   *
   * ⚠️ VÀ NÓ CHỈ TẮT ĐÚNG MỘT ĐOẠN, KHÔNG TẮT CẢ TIN. Kẻ lừa viết "We will never
   * ask for your PIN. Now read me the code." thì câu sau vẫn nguyên vẹn — đó là
   * lý do phân đoạn theo câu có giá trị.
   */
  'will\\s+(never|not)\\s+(ask|call|contact|request|phone)',
  '(no one|nobody)\\b[^.]{0,30}\\b(will|would)\\s+(ever\\s+)?(ask|call|request)',
  'is\\s+(always\\s+)?a\\s+scam\\b',
  'how to (spot|avoid|recognise|recognize)\\b',
  '(watch out for|beware of|look out for)\\b',
  '(hang up|put the phone down)\\b[^.]{0,30}\\b(call|ring|check)\\b',
  /**
   * ── KHUNG TIẾNG VIỆT ──
   *
   * ⚠️ VIẾT CÓ DẤU. Bản không dấu SINH TỰ ĐỘNG ở `KHUNG_GIAO_DUC_KHONG_DAU`,
   * không chép tay hai lần.
   *
   * Vì sao KHÔNG viết thẳng dạng không dấu: `đừng` và `dụng` cùng bỏ dấu thành
   * `dung`, nên khung `dung…nhe` khớp trúng câu "mở ứng DỤNG ngân hàng rồi bật
   * chia sẻ màn hình NHÉ" — một câu lừa đảo bị xếp là giáo dục, vứt luôn
   * DEV_SCREEN_SHARE_BANKING và mất CO-04. Đồng âm khi bỏ dấu là có thật.
   *
   * ⚠️ KHÔNG đặt `\b` cạnh chữ có dấu — test/ranh-gioi-tu-unicode.test.js chặn.
   */
  'không bao giờ\\s+(yêu cầu|hỏi|đòi|gọi|nhắn|cử)',
  'không có[^.]{0,30}nào[^.]{0,20}(yêu cầu|đòi|hỏi)',
  'kẻ (lừa đảo|gian)', 'lừa đảo thường',
  '^\\s*(cảnh báo|lưu ý|thông báo)',
  'đừng[^.]{0,60}(hãy|dập máy|tắt máy)',
  'đừng ai\\s', 'không ai[^.]{0,20}(nên|được)',
  '^\\s*không\\s+(cài|chuyển|đọc|bấm|tải)',

  // Cơ quan / tổ chức đứng TRƯỚC động từ cảnh báo: "Công an TP Hà Nội cảnh báo:"
  '(công an|cảnh sát|cơ quan|ngân hàng|tổ dân phố|bộ|cục|chi cục)[^.]{0,40}'
    + '(cảnh báo|khuyến cáo|lưu ý|thông báo)',

  // Khung TƯỜNG THUẬT về nạn nhân, hoặc về kẻ giả danh.
  '(nạn nhân|người bị hại)[^.]{0,30}(được|bị)\\s+(yêu cầu|dụ|lừa)',
  'có người[^.]{0,20}(giả danh|mạo danh|xưng là)',
  'theo (cơ quan|công an|báo|nguồn tin)',

  /**
   * ⚠️ CHUYỆN ĐÃ QUA — MỐC THỜI GIAN QUÁ KHỨ + LỜI KỂ.
   *
   * Thêm 16/8/2026 cùng lúc với mẫu tường thuật của `ID_AUTHORITY_IMPERSONATION`.
   * Mẫu đó bắt "công an gọi báo tôi… phải chuyển tiền" — đúng thứ bác gõ vào ô
   * "Hãy kể tình huống của Bác". Nhưng nó cũng bắt luôn "HỒI THÁNG BA bác bị một
   * đứa gọi xưng công an…", tức là bác đang KỂ LẠI một việc đã xong.
   *
   * Khác biệt duy nhất giữa hai câu là MỐC THỜI GIAN. Chuyện đang xảy ra thì
   * không ai gắn "hồi tháng ba" vào.
   *
   * ⚠️ ĐÒI CẢ HAI VẾ. Chỉ "năm ngoái" thôi thì quá rộng — kẻ lừa đảo cũng nói
   * "năm ngoái anh có vay…". Phải đi kèm một động từ KỂ về trải nghiệm.
   */
  '(hồi|năm ngoái|tháng trước|tuần trước|hôm trước|dạo trước|trước đây)'
    + '[^.]{0,40}(bị|suýt|từng|đã)\\s*(một|có)?[^.]{0,16}(lừa|gọi|nhắn|xưng|giả danh)',

  // Cấu trúc ĐIỀU KIỆN — tương đương "if someone … hang up" của tiếng Anh.
  '\\bai\\s[^.]{0,60}thì[^.]{0,40}(lừa đảo|kẻ gian|đừng|không nên|hãy|dập máy|tắt máy|cúp máy)',
  '(nếu|hễ)\\s[^.]{0,60}(thì\\s[^.]{0,40})?(lừa đảo|đừng|không nên|hãy|dập máy|tắt máy|cúp máy)',

  // GỌI THẲNG TÊN là lừa đảo — không ai vừa lừa vừa tự khai mình đang lừa.
  '(chắc chắn|đúng) là lừa đảo', 'là (trò|chiêu|thủ đoạn) lừa',
  'không có (cái gì|thứ gì|khái niệm)',
].join('|'), 'g');

/** Bản KHÔNG DẤU, sinh tự động. Chỉ dùng khi văn bản cũng không dấu. */
const KHUNG_GIAO_DUC_KHONG_DAU = new RegExp(boDau(KHUNG_GIAO_DUC.source), 'g');

/** Văn bản có ít nhất một chữ mang dấu tiếng Việt? */
const CO_DAU = /[À-ỹ]/;

const KHUNG_THONG_BAO = new RegExp([
  '(was|were|has been|have been)\\s+(completed|processed|received|credited|debited|sent)',
  'biến động số dư', 'giao dịch thành công', 'đã chuyển thành công',
  '(quý khách|tk|tài khoản)[^.]{0,40}đã (chuyển|nhận|thanh toán)',
  'không cung cấp mã này', 'mã này cho bất kỳ ai',
  '^\\s*lịch (khám|hẹn|làm việc)',
].join('|'));

const KHUNG_QUA_KHU = new RegExp([
  '^\\s*(yesterday|last (night|week|month)|earlier)',
  '^\\s*(a |the )?scammer\\s+(told|said|asked|called)',
  '^\\s*i\\s+(told|sent|transferred|paid|gave|installed|opened|called)',
  // Mở rộng mốc thời gian quá khứ: "Năm ngoái mẹ suýt bị lừa…" là lời KỂ LẠI,
  // không phải yêu cầu đang diễn ra.
  '^\\s*(hôm qua|hôm trước|tuần trước|tháng trước|năm ngoái|năm trước|dạo trước|hồi đó|lúc nãy|ban nãy)',
  '\\b(suýt|đã từng|có lần)\\b[^.]{0,20}(bị lừa|mắc lừa)',
  '^\\s*[^.,]{0,30}\\btôi đã\\s',
].join('|'));

const KHUNG_TU_QUYET = new RegExp([
  'i\\s+(want|need|decided|am going|chose)\\s+to',
  'for my own', 'my own (portfolio|wallet|account)',
  'my (son|daughter|grandson|granddaughter|wife|husband) asked me',
  'i opened\\b[^.]{0,60}\\bafter (calling|contacting|phoning)',
  '(cài|tải)\\b[^.]{0,60}(ch play|app store|chính thức)',
  'mừng tuổi', 'nhẫn cưới', 'sinh nhật', 'tặng (cháu|con)', 'quà tết',
].join('|'));

/**
 * §12 — CẤU TRÚC ĐÒI HỎI. Sự có mặt của nó BÁC BỎ khung "tự quyết định".
 *
 * VÌ SAO CẦN (đo 2/9/2026): `KHUNG_TU_QUYET` chứa những DANH TỪ CHỦ ĐỀ như
 * `sinh nhật`, `quà tết`, `mừng tuổi`, `nhẫn cưới`, `tặng cháu`, `for my own`.
 * Chúng được thêm để cứu ca lành có thật, và cứu đúng. Nhưng vì là danh từ chứ
 * không phải cấu trúc câu, kẻ lừa đảo nối vào đâu cũng được:
 *
 *   "Con đây mẹ ơi, mẹ chuyển gấp 30 triệu vào tài khoản này giúp con"
 *      → NGHI_NGO, 2 tín hiệu
 *   cùng câu + " để mua quà sinh nhật."
 *      → CHUA_THAY, 0 tín hiệu
 *
 *   Bản tiếng Anh còn nặng hơn: "for my own" kéo CAO (3 tín hiệu) → CHUA_THAY.
 *
 * §12 gọi đúng tên: "Bất kỳ cụm nào hạ mức vô điều kiện đều là một câu thần chú
 * tặng cho kẻ lừa đảo" — cùng bài học với "please hold" và "ch play".
 *
 * ⚠️ QUY TẮC THEO VỊ TRÍ KHÔNG ĐỦ. Khung giáo dục dùng mẹo "động từ rủi ro đứng
 * TRƯỚC khung thì khung không chi phối". Ở đây mẹo đó thua, vì kẻ gian chỉ việc
 * đảo cụm lên đầu: "Để mua quà sinh nhật, mẹ chuyển gấp 30 triệu…". Nên phép
 * kiểm này KHÔNG xét vị trí — có đòi hỏi ở bất kỳ đâu trong câu là khung tắt.
 *
 * ⚠️ HAI VẾ, VÀ CHỈ HAI: NƠI NHẬN TIỀN, hoặc SỨC ÉP THỜI GIAN. Đừng nới thêm.
 * Hai ca lành mà các cụm kia sinh ra để cứu — "Mua vàng nhẫn cưới cho cháu." và
 * "mai sinh nhật mẹ mình làm bất ngờ cho mẹ" — không có vế nào trong hai vế này,
 * nên vẫn được cứu. Nới danh sách là bắt đầu ăn vào chúng.
 *
 * Hàng rào: test/than-chu-ha-muc.test.js (canh CẢ HAI chiều).
 */
const KHUNG_DOI_HOI = new RegExp([
  // nơi nhận tiền
  'tài khoản', 'số thẻ', '\\bstk\\b', '\\btk\\b',
  '\\baccount\\b', '\\bwallet address\\b',
  // sức ép thời gian
  'gấp\\b', 'ngay\\b', 'khẩn', 'lập tức', 'trong vòng \\d',
  '\\b(urgent|urgently|immediately|asap)\\b', 'right (now|away)', 'within \\d',
].join('|'));

const KHUNG_MENH_LENH = new RegExp([
  '^\\s*(please|kindly)\\b', '\\bplease\\b',
  '^\\s*(bác|anh|chị|ông|bà|cô|chú|em|con)\\s+\\S+',
  '\\b(hãy|vui lòng|nhớ)\\s',
  '^\\s*(chuyển|gửi|đọc|cài|tải|bật|nộp|mua|cung cấp|đăng nhập)\\b',
  // mệnh lệnh tiếng Anh ở ĐẦU câu — "Send $500 now." không có "please" nào cả,
  // và phần lớn mệnh lệnh lừa đảo cũng vậy.
  '^\\s*(transfer|send|move|install|download|share|pay|buy|call|click|open|read|give|provide|log ?in|hold|collect|deposit|wire)\\b',
  '\\byou (must|need to|have to|should)\\b',
].join('|'));

/**
 * Trả về vị trí sớm nhất của một khung giáo dục, hoặc -1.
 * C.1: khung này chi phối MỌI động từ rủi ro đứng SAU nó.
 */
/**
 * ⚠️ CHỌN BỘ KHUNG THEO VĂN BẢN, KHÔNG BỎ DẤU TẤT.
 *
 * Trước đây hàm này bỏ dấu MỌI văn bản rồi khớp bằng khung không dấu. Đo được
 * hậu quả: `đừng` và `dụng` cùng bỏ dấu thành `dung`, nên khung `dung…nhé` khớp
 * trúng "mở ứng DỤNG ngân hàng giúp em rồi bật chia sẻ màn hình NHÉ". Một câu
 * lừa đảo bị xếp `warning_education`, DEV_SCREEN_SHARE_BANKING bị vứt, mất
 * override CO-04. Bỏ dấu là phép ánh xạ MẤT THÔNG TIN — chỉ dùng khi buộc phải.
 *
 * Nên: có dấu thì khớp khung có dấu trên nguyên văn; không dấu mới hạ xuống bản
 * đã bỏ dấu (ở đó `warn-01` "Cong an TP Ha Noi canh bao:" vẫn nhận được).
 *
 * Bỏ dấu giữ nguyên ĐỘ DÀI chuỗi (chỉ gỡ dấu tổ hợp và đổi đ→d), nên chỉ số trả
 * về ở cả hai nhánh đều so được với vị trí động từ rủi ro tính trên `n`.
 */
function viTriKhungGiaoDuc(n) {
  const coDau = CO_DAU.test(n);
  const re = coDau ? KHUNG_GIAO_DUC : KHUNG_GIAO_DUC_KHONG_DAU;
  re.lastIndex = 0;
  const m = re.exec(coDau ? n : boDau(n));
  return m ? m.index : -1;
}

function viTriDongTuRuiRo(n) {
  DONG_TU_RUI_RO.lastIndex = 0;
  const ra = [];
  let m = DONG_TU_RUI_RO.exec(n);
  while (m) { ra.push(m.index); m = DONG_TU_RUI_RO.exec(n); }
  return ra;
}

function phanLoai(n) {
  // Thông báo được kiểm TRƯỚC khung giáo dục: "Không cung cấp mã này cho bất kỳ ai."
  // là đuôi của một SMS ngân hàng thật, không phải bài giáo dục.
  if (KHUNG_THONG_BAO.test(n)) return 'notification';

  const viTriEdu = viTriKhungGiaoDuc(n);
  const viTriRuiRo = viTriDongTuRuiRo(n);

  if (viTriEdu >= 0) {
    // C.3 bẫy 3: khung giáo dục chỉ chi phối động từ đứng SAU nó. Một động từ
    // rủi ro đứng TRƯỚC khung là mệnh lệnh thật ở mệnh đề chính —
    // "Please transfer the money now and do not tell Mum." KHÔNG phải bài giáo dục.
    const coRuiRoNgoaiKhung = viTriRuiRo.some((v) => v < viTriEdu);
    if (!coRuiRoNgoaiKhung) {
      return /kẻ (lừa đảo|gian)|scammers?\b.*\b(told|said) me/.test(n)
        && /\btôi\b|\bme\b/.test(n) ? 'quoted_report' : 'warning_education';
    }
  }

  // C.3 bẫy 4: chỉ nhận quá khứ khi nó ở MỆNH ĐỀ CHÍNH (đầu câu).
  // "…to the account I gave you" nằm giữa câu — là mệnh đề phụ, không tính.
  if (KHUNG_QUA_KHU.test(n)) return 'past_event';

  // §12 — khung "tự quyết định" CÓ THỂ BỊ BÁC BỎ. Xem khối KHUNG_DOI_HOI.
  // Không ai vừa "tự quyết định" vừa bị hối chuyển tiền vào một tài khoản.
  if (KHUNG_TU_QUYET.test(n) && !KHUNG_DOI_HOI.test(n)) return 'self_directed';
  if (KHUNG_MENH_LENH.test(n)) return 'request_command';

  // C.3 bẫy 1 + 2: không nhận ra được thì là `unknown` — và `unknown` VẪN ĐƯỢC
  // PHÂN TÍCH. Danh tính và sức ép hầu như luôn nằm ở câu tường thuật.
  return 'unknown';
}

/** B.4 — `direction = unknown` phải được chấm như `sender_to_user`, không phải 0 điểm. */
function huong(n) {
  if (/^\s*(i|tôi|mình|em)\s/.test(n)) return 'user_to_sender';
  if (/\b(you|your|bác|anh|chị|ông|bà|quý khách)\b/.test(n)) return 'sender_to_user';
  return 'unknown';
}

// ─────────────────────── API ───────────────────────

function buildContext(raw = '', opts = {}) {
  const original = typeof raw === 'string' ? raw : '';
  const normalized = chuanHoa(original);
  const folded = boDau(normalized);
  const language = detectLanguage(original);

  const segments = catCau(original).map((d, index) => {
    const n = chuanHoa(d.text);
    const speechAct = phanLoai(n);
    return {
      index,
      text: d.text,
      start: d.start,
      end: d.end,
      normalized: n,
      folded: boDau(n),
      ocrVariants: bienTheOcr(boDau(n), goCheChu(n)),
      speechAct,
      direction: huong(n),
      actionable: !NON_ACTIONABLE_ACTS.has(speechAct),
    };
  });

  return {
    original,
    normalized,
    folded,
    ocrVariants: bienTheOcr(folded, goCheChu(normalized)),
    language,
    activePacks: packDangDung(language),
    sourceId: opts.sourceId || 'van_ban',
    segments,
  };
}

/** C.2 — với scope "any" / "context" thì lấy TẤT CẢ đoạn; scope khác mới lọc. */
function segmentsForScope(ctx, scope = 'action') {
  if (scope === 'any' || scope === 'context') return ctx.segments;
  return ctx.segments.filter((s) => s.actionable);
}

module.exports = {
  buildContext, detectLanguage, segmentsForScope,
  chuanHoa, boDau, bienTheOcr, catCau, goCheChu,
  SPEECH_ACTS, NON_ACTIONABLE_ACTS,
};
