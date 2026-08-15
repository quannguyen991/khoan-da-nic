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

/** Case-fold để khớp, GIỮ ranh giới câu và dấu câu tới khi phủ định/scope giải xong. */
function chuanHoa(s) {
  let t = s.toLowerCase();
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

function bienTheOcr(s) {
  const viTri = [];
  for (let i = 0; i < s.length; i += 1) {
    if (OCR_LUA_CHON[s[i]]) viTri.push(i);
  }
  const rn = s.includes('rn') ? [s.replace(/rn/g, 'm')] : [];
  if (viTri.length === 0) return [s, ...rn];

  let bien = [s];
  for (const i of viTri) {
    if (bien.length * OCR_LUA_CHON[s[i]].length > OCR_TRAN) break;
    const tiep = [];
    for (const b of bien) {
      for (const ky of OCR_LUA_CHON[s[i]]) tiep.push(b.slice(0, i) + ky + b.slice(i + 1));
    }
    bien = tiep;
  }
  return [...new Set([...bien, ...rn])];
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
  'never\\s+(share|give|send|tell|provide|reveal|install)',
  'scammers?\\b[^.]{0,40}\\b(may|might|will|often|can)',
  'fraudsters?\\b', 'warns?\\s+(that|you)', 'be (aware|careful)',
  'if\\s+(someone|anyone|a caller)',
  'không bao giờ\\s+(yêu cầu|hỏi|đòi|gọi|nhắn|cử)',
  'kẻ (lừa đảo|gian)', 'lừa đảo thường',
  '^\\s*(cảnh báo|lưu ý)\\b',
  'đừng\\b[^.]{0,60}\\bhãy\\b',
  '^\\s*không\\s+(cài|chuyển|đọc|bấm|tải)',
].join('|'), 'g');

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
  '^\\s*(hôm qua|hôm trước|tuần trước|lúc nãy|ban nãy)',
  '^\\s*[^.,]{0,30}\\btôi đã\\b',
].join('|'));

const KHUNG_TU_QUYET = new RegExp([
  'i\\s+(want|need|decided|am going|chose)\\s+to',
  'for my own', 'my own (portfolio|wallet|account)',
  'my (son|daughter|grandson|granddaughter|wife|husband) asked me',
  'i opened\\b[^.]{0,60}\\bafter (calling|contacting|phoning)',
  '(cài|tải)\\b[^.]{0,60}(ch play|app store|chính thức)',
  'mừng tuổi', 'nhẫn cưới', 'sinh nhật', 'tặng (cháu|con)', 'quà tết',
].join('|'));

const KHUNG_MENH_LENH = new RegExp([
  '^\\s*(please|kindly)\\b', '\\bplease\\b',
  '^\\s*(bác|anh|chị|ông|bà|cô|chú|em|con)\\s+\\S+',
  '\\b(hãy|vui lòng|nhớ)\\b',
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
function viTriKhungGiaoDuc(n) {
  KHUNG_GIAO_DUC.lastIndex = 0;
  const m = KHUNG_GIAO_DUC.exec(n);
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

  if (KHUNG_TU_QUYET.test(n)) return 'self_directed';
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
      ocrVariants: bienTheOcr(boDau(n)),
      speechAct,
      direction: huong(n),
      actionable: !NON_ACTIONABLE_ACTS.has(speechAct),
    };
  });

  return {
    original,
    normalized,
    folded,
    ocrVariants: bienTheOcr(folded),
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
  chuanHoa, boDau, bienTheOcr, catCau,
  SPEECH_ACTS, NON_ACTIONABLE_ACTS,
};
