'use strict';
/**
 * §2B.2 bước 4 — MẪU DETERMINISTIC. CHẠY ĐƯỢC KHI MẤT AI.
 *
 * §6.1 bước 2: bắt critical phrase TRƯỚC khi gọi model.
 * §6.4: direct detector có `source=direct`, `confidence=1.0`,
 *       KHÔNG đi qua ngưỡng LLM.
 *
 * Hàm thuần. Không mạng, không AI.
 */

const { segmentsForScope, boDau, chuanDauThanh, boThanh } = require('./context-builder');
const { layPack } = require('./locale-pack-registry');
const { laTinHieu } = require('./signal-registry');

/**
 * Phủ định ở cấp CỤM — hàng rào thứ hai sau speech act.
 * "Bác cứ bình tĩnh, không cần gấp đâu." — cụm `gấp` bị `không cần` phủ định.
 *
 * ⚠️ "chuyển tiền ngay không sẽ bị bắt giữ" KHÔNG phải phủ định: ở đây `không`
 * nghĩa là "nếu không". Nên bỏ qua khi giữa chúng có `sẽ` hoặc dấu phẩy.
 */
/**
 * ⚠️ VIẾT KHÔNG DẤU và so trên bản đã bỏ dấu.
 *
 * Từ khi cue bank chạy được trên tiếng Việt không dấu, hàng rào phủ định cũng
 * phải chạy trên đó — nếu không thì "khong can gap" không được nhận là phủ định
 * và MAN_URGENCY bật oan. Đúng lỗi đối xứng với chuyện cue bank có dấu.
 *
 * Hệ quả tốt: không dấu là ASCII nên `\b` hoạt động đúng.
 */
/**
 * ⚠️⚠️ `cho` ĐÃ BỊ GỠ KHỎI DANH SÁCH NÀY — ĐỪNG THÊM LẠI. ĐO ĐƯỢC 16/8/2026.
 *
 * Nó vốn ở đây để bắt "chớ" (đừng). Nhưng bỏ dấu xong thì **"chớ" và "cho" là
 * cùng một chuỗi** — mà `cho` (giới từ) là một trong những từ phổ biến nhất
 * tiếng Việt, và nó đứng ngay TRƯỚC đích của gần như mọi câu lừa đảo:
 *
 *     "nộp 20tr CHO cục thuế"          → ID_TAX_BENEFIT_IMPERSONATION bị nuốt
 *     "chuyển tiền CHO công an"        → giả danh cơ quan bị nuốt
 *     "đọc mã OTP CHO tôi"             → xin OTP bị nuốt
 *     "chuyển CHO tài khoản này"       → yêu cầu chuyển tiền bị nuốt
 *
 * Người dùng báo: gõ "nộp 20tr cho cục thuế" ra "Chưa thấy dấu hiệu rủi ro".
 * Tín hiệu KHỚP ĐÚNG rồi bị hàng rào phủ định vứt đi — im lặng, không dấu vết.
 *
 * §4.2: "Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ
 * giảm." Một hàng rào phủ định bắt nhầm là thứ LÀM GIẢM cảnh giác, nên nó phải
 * sai theo hướng ngược lại: thà bỏ sót một câu phủ định thật còn hơn vứt một
 * tín hiệu thật.
 *
 * Cùng bài học với cụm `nhan qua` trong bộ lọc tin tức: **bỏ dấu làm ranh giới
 * ngữ nghĩa biến mất, nên cụm ngắn và phổ biến là bẫy.**
 */
const PHU_DINH = /(khong|dung|chang|never|do not|cannot)\s*(can|phai|nen|duoc|bao gio)?\s*$/;

/**
 * "chớ" vẫn được bắt — nhưng CHỈ trên bản CÒN DẤU, nơi nó khác "cho".
 * Bản đã bỏ dấu thì không phân biệt được, và ta chọn bỏ sót thay vì bắt nhầm.
 */
const PHU_DINH_CO_DAU = /\b(chớ|đừng|chẳng|khỏi)\s*(cần|phải|nên|được)?\s*$/;

const KHONG_PHAI_PHU_DINH = /[,;]|\bse\b|\bthi\b/;

function laPhuDinh(text, viTri) {
  const tho = text.slice(Math.max(0, viTri - 16), viTri);
  const truoc = boDau(tho);

  /*
   * ⚠️ `boDau` GIỮ NGUYÊN SỐ KÝ TỰ (đã kiểm), nên hai chuỗi cùng chỉ số — dùng
   * chung một `KHONG_PHAI_PHU_DINH` là hợp lệ.
   *
   * Thử bản còn dấu trước: nó phân biệt được "chớ" với "cho". Nếu `text` đã là
   * bản bỏ dấu thì nhánh này đơn giản là không khớp, và đó là hướng an toàn.
   */
  const mDau = PHU_DINH_CO_DAU.exec(tho);
  if (mDau && !KHONG_PHAI_PHU_DINH.test(truoc.slice(mDau.index))) return true;

  const m = PHU_DINH.exec(truoc);
  if (!m) return false;
  // Chỉ xét đoạn GIỮA từ phủ định và cụm. Dấu phẩy đứng TRƯỚC từ phủ định là
  // chuyện khác: "Bác cứ bình tĩnh, không cần gấp đâu." vẫn là phủ định thật.
  return !KHONG_PHAI_PHU_DINH.test(truoc.slice(m.index));
}

/**
 * ═════ BỎ DẤU LÀ ĐỂ ĐỌC CHỮ KHÔNG DẤU, KHÔNG PHẢI ĐỂ XOÁ NGHĨA ═════
 *
 * Đo 19/9/2026 — ba câu LÀNH, viết đủ dấu, đều nổ MAN_URGENCY:
 *
 *   "Hẹn gặp bác ngày mai ở nhà con nhé."        → [gặp → "gap" ≡ gấp]
 *   "Bác nhớ mang theo khăn và mũ khi đi chơi."    → [khăn → "khan" ≡ khẩn]
 *   "Cuộc họp tại nhà văn hoá ngày 20 tháng 9."  → [ngày → "ngay"]
 *
 * Bỏ dấu làm nhiều từ khác hẳn nhau sập vào cùng một chuỗi: gặp/gấp, khăn/khẩn,
 * ngày/ngay, tại/tải, chuyện/chuyển. Tiếng Việt có sáu thanh điệu; bỏ dấu là
 * mất sáu đường phân biệt cùng một lúc.
 *
 * NHƯNG KHÔNG ĐƯỢC BỎT PHẦN BỎT DẤU. SMS lừa đảo ở Việt Nam viết không dấu là
 * chuyện thường — đo được "Bac chuyen het tien sang tai khoan an toan cua Bo
 * Cong an ngay" chỉ 7 điểm nếu không bỏ dấu, bản có dấu 61 điểm.
 *
 * LẮT RẤT HẬP: bản bỏ dấu chỉ dùng để đọc CHỮ KHÔNG CÓ DẤU. Một khớp trên bản
 * bỏ dấu chỉ được tính khi ĐOẠN CHỮ TƯƠNG ỨNG trong bản còn dấu cũng không mang
 * dấu. Người viết "gặp" đã tự nói rằng họ không viết "gấp".
 *
 * ⚠️ XÉT THEO ĐOẠN KHỚP, KHÔNG THEO CẢ CÂU. Tin trộn nửa có dấu nửa không là ca
 * thật: "Bác chuyển tiền gap giup con" — đoạn "gap" vẫn không dấu nên vẫn tính.
 * Và vì thế phép quét phải duyệt MỌI lượt khớp chứ không dừng ở lượt đầu: câu
 * "Hẹn gặp bác, chuyen tien gap di" có "gap" giả đứng trước "gap" thật.
 *
 * ⚠️ KHÔNG ĐỤNG VÀO NHÁNH NÀO KHÔNG ĐỒNG CHỈ SỐ. `boDau` giữ nguyên số ký tự
 * nên bản bỏ dấu đồng chỉ số với bản còn dấu. Biến thể OCR thì không ("rn" → "m"
 * làm ngắn chuỗi), nên nhánh đó giữ nguyên cách cũ — thà giữ một báo động giả
 * hiếm còn hơn tự đổi chỉ số rồi cắt nhầm một tín hiệu thật (§4.2).
 */
/**
 * ═════ `\b` CỦA JS KHÔNG BIẾT CHỮ CÓ DẤU LÀ CHỮ ═════
 *
 * Không có cờ `u`, `\w` của JS chỉ là `[A-Za-z0-9_]`. Nên "ẻ" là KÝ TỰ KHÔNG
 * PHẢI CHỮ, và giữa "sẻ" với khoảng trắng đằng sau KHÔNG CÓ ranh giới từ nào cả.
 *
 * Hậu quả đo được 19/9/2026: mẫu `(chia sẻ|bật)\b[^.]{0,16}màn hình\b…` KHÔNG
 * BAO GIỜ khớp được câu có dấu "chia sẻ màn hình khi đang đăng nhập ngân hàng".
 * Nó sống được tới hôm nay là nhờ nhánh BỎ DẤU: "chia se\b" thì `e` lại là `\w`
 * nên ranh giới xuất hiện trở lại. Một lỗi thầm lặng đúng kiểu §4.3: không ai
 * thấy gì hỏng, chỉ thấy "chưa thấy dấu hiệu".
 *
 * Nên ranh giới từ phải được viết lại bằng chính bộ chữ tiếng Việt. Không dùng
 * cờ `u` + `\p{L}`: cờ `u` siết chặt cú pháp escape, và hơn sáu trăm mẫu trong pack
 * đang viết theo cú pháp cũ — đổi cờ là đổi ý nghĩa của cả sáu trăm cái một lượt.
 */
const CHU_VN = 'A-Za-z0-9_'
  + '\u00c0-\u00c3\u00c8-\u00ca\u00cc\u00cd\u00d2-\u00d5\u00d9\u00da\u00dd'
  + '\u00e0-\u00e3\u00e8-\u00ea\u00ec\u00ed\u00f2-\u00f5\u00f9\u00fa\u00fd'
  + '\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01a0\u01a1\u01af\u01b0'
  + '\u1ea0-\u1ef9';

/** `\b` tương đương, nhưng biết chữ tiếng Việt cũng là chữ. */
const RANH_GIOI = '(?:(?<=[' + CHU_VN + '])(?![' + CHU_VN + '])'
  + '|(?<![' + CHU_VN + '])(?=[' + CHU_VN + ']))';

/**
 * ═════ ĐƯỢC PHÉP THIẾU DẤU THANH, KHÔNG ĐƯỢC ĐỔI DẤU THANH ═════
 *
 * Nhánh bỏ dấu cũ gộp hai việc rất khác nhau làm một:
 *
 *   ✓ người viết THIẾU dấu — "phi xu ly" cho mẫu "phí xử lý". Phải bắt.
 *   ✗ người viết dấu KHÁC  — "mua hộ bác" cho mẫu "mua…bạc". Không được bắt.
 *
 * Hai ca đó giống hệt nhau sau khi bỏ dấu, nên bộ luật không cách nào chọn đúng.
 * Chỗ phân biệt nằm ở CHIỀU: chữ trong tin được phép THIẾU cái mẫu có, nhưng
 * không được MANG một dấu khác.
 *
 * Nên mỗi chữ có dấu thanh trong mẫu nở ra thành một lớp hai phần tử:
 *
 *   "phí xử lý"  →  "ph[íi] x[ửu]* l[ýy]"      (xử → ử giữ móc, chỉ bỏ thanh)
 *   "mua…bạc"    →  "mua…b[ạa]c"  → "bác" trượt, đúng ý muốn
 *
 * ⚠️ DẤU TẠO CHỮ (ă â ê ô ơ ư đ) KHÔNG NỞ RA. Chúng không phải thanh điệu mà là
 * chữ khác hẳn: gặp/gấp, khăn/khẩn, chứ/chức phân biệt nhau ở đây. Còn người
 * viết KHÔNG DẤU HẲN thì nhánh bỏ dấu lo, và nhánh đó có luật riêng của nó.
 *
 * ⚠️ BIẾT MÌNH ĐANG Ở TRONG `[...]` HAY KHÔNG. Mẫu của pack có lớp ký tự sẵn;
 * nhét thêm `[` vào giữa một lớp là hỏng cả mẫu — trong lớp thì chỉ thêm ký tự.
 */
function mauKhoanThanh(src) {
  let ra = '';
  let trongLop = false;
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (c === '\\') { ra += c + (src[i + 1] || ''); i += 1; continue; }
    if (c === '[') { trongLop = true; ra += c; continue; }
    if (c === ']') { trongLop = false; ra += c; continue; }
    const tron = boThanh(c);
    if (tron === c || tron.length !== 1) { ra += c; continue; }
    ra += trongLop ? c + tron : '[' + c + tron + ']';
  }
  return ra;
}

/** Biên dịch một mẫu của pack thành RegExp, đổi `\b` sang ranh giới hiểu dấu. */
function bienDich(src) {
  return new RegExp(String(src).replace(/(^|[^\\])\\b/g, (_, t) => t + RANH_GIOI), 'i');
}

function khopBoDauDungCho(normalized, chuoi, start, end) {
  if (chuoi.length !== normalized.length) return true;   // không đồng chỉ số: không xét
  const doanGoc = normalized.slice(start, end);
  return boDau(doanGoc) === doanGoc;
}

/**
 * Duyệt MỌI lượt khớp, trả lượt đầu tiên qua được `hopLe`.
 * `exec` một lần chỉ trả lượt đầu — mà lượt đầu có thể là một "gap" do bỏ dấu
 * sinh ra, trong khi "gap" thật nằm ngay sau đó.
 */
function timKhop(chuoi, re, hopLe) {
  const co = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const reG = new RegExp(re.source, co);
  let m;
  while ((m = reG.exec(chuoi)) !== null) {
    if (m[0].length === 0) { reG.lastIndex += 1; continue; }   // chống vòng lặp vô tận
    if (hopLe(m)) return m;
  }
  return null;
}

/** C.5 — danh sách tắt vô điều kiện, so trên bản KHÔNG DẤU. */
function biTatVoDieuKien(pack, signalId, folded) {
  const cum = pack.suppressors?.[signalId];
  if (!cum) return false;
  return cum.some((c) => folded.includes(c));
}

/** C.4 — hai cơ chế tắt CÓ ĐIỀU KIỆN. Khác hẳn danh sách trên. */
function biTatCoDieuKien(pack, signalId, opts) {
  if (opts.verifiedChannel && pack.verifiedChannelSuppressed?.includes(signalId)) return true;
  if (opts.verifiedRelationship && pack.verifiedRelationshipSuppressed?.includes(signalId)) return true;
  return false;
}

/**
 * @param {object} ctx   kết quả buildContext()
 * @param {object} opts  { verifiedChannel, verifiedRelationship }
 * @returns {Array} tín hiệu direct, đã dedup theo canonical SIGNAL_ID
 */
function directPrecheck(ctx, opts = {}) {
  const ra = new Map();

  for (const tenPack of ctx.activePacks) {
    const pack = layPack(tenPack);
    if (!pack) continue;

    for (const [signalId, mauList] of Object.entries(pack.directPatterns)) {
      if (!laTinHieu(signalId)) continue;                 // tín hiệu lạ: bỏ qua
      if (ra.has(signalId)) continue;                      // dedup: đã bắt rồi
      if (biTatCoDieuKien(pack, signalId, opts)) continue;

      for (const mau of mauList) {
        const re = bienDich(mau.pattern);
        /*
         * ĐƯỜNG THỨ HAI: cùng mẫu đó nhưng cả mẫu lẫn văn bản đưa về MỘT LỐI
         * ĐẶT DẤU THANH. Đây mới là chỗ nối "toà án" với "tòa án" — trước đây việc
         * đó do nhánh bỏ dấu gánh hộ, và gánh kèm theo cả gặp/gấp, khăn/khẩn.
         */
        const reDauChuan = bienDich(mauKhoanThanh(chuanDauThanh(mau.pattern)));
        /**
         * ⚠️ TIẾNG VIỆT KHÔNG DẤU LÀ CA THẬT, KHÔNG PHẢI CA HIẾM.
         *
         * SMS lừa đảo ở Việt Nam rất hay viết không dấu. Cue bank có dấu nên
         * chúng trượt sạch: đo được câu "Bac chuyen het tien sang tai khoan an
         * toan cua Bo Cong an ngay" chỉ 7 điểm, trong khi bản có dấu được 61.
         *
         * `boDau()` chỉ gỡ dấu tổ hợp và đổi đ→d — mọi ký tự cú pháp regex đều
         * là ASCII nên không bị đụng tới. Bỏ dấu CẢ MẪU LẪN VĂN BẢN rồi so.
         */
        const mauKhongDau = boDau(mau.pattern);
        const reKhongDau = mauKhongDau === mau.pattern ? null : bienDich(mauKhongDau);
        const doanList = segmentsForScope(ctx, mau.scope);

        let batDuoc = null;
        for (const doan of doanList) {
          if (biTatVoDieuKien(pack, signalId, doan.folded)) continue;

          // Khớp trên bản chuẩn hoá trước; nếu trượt thì thử các biến thể OCR.
          const ungVien = [
            { chuoi: doan.normalized, re, boDauRoi: false },
            { chuoi: chuanDauThanh(doan.normalized), re: reDauChuan, boDauRoi: false },
            ...(reKhongDau ? [{ chuoi: doan.folded, re: reKhongDau, boDauRoi: true }] : []),
            ...doan.ocrVariants.map((c) => ({ chuoi: c, re: reKhongDau || re, boDauRoi: true })),
          ];
          for (const { chuoi, re: reDung, boDauRoi } of ungVien) {
            const m = timKhop(chuoi, reDung, (k) => {
              if (laPhuDinh(chuoi, k.index)) return false;
              if (boDauRoi && !khopBoDauDungCho(doan.normalized, chuoi, k.index, k.index + k[0].length)) return false;
              return true;
            });
            if (!m) continue;
            batDuoc = {
              quote: m[0],
              start: m.index,
              end: m.index + m[0].length,
              sourceId: ctx.sourceId,
              segmentIndex: doan.index,
            };
            break;
          }
          if (batDuoc) break;
        }

        if (batDuoc) {
          ra.set(signalId, {
            id: signalId,
            state: 'present',
            source: 'direct',
            confidence: 1.0,        // direct KHÔNG đi qua ngưỡng LLM (§6.4)
            evidence: [batDuoc],
          });
          break;
        }
      }
    }
  }

  return [...ra.values()];
}

module.exports = { directPrecheck, laPhuDinh };
