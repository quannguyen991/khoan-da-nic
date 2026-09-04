'use strict';
/**
 * CÂU GIẢI THÍCH — MỘT CÂU, ĐỌC LÊN NGHE ĐƯỢC.
 *
 * ⚠️ §11 — BỐN CÂU KHÔNG ĐƯỢC VIẾT, VÀ CẢ BỐN ĐỀU DỄ LỌT VÀO ĐÂY:
 *
 *  1. KHÔNG quy kết một cá nhân là tội phạm. Viết "Yêu cầu này có dấu hiệu
 *     thường gặp trong các vụ lừa đảo", KHÔNG viết "Người này là kẻ lừa đảo".
 *     Người gửi có thể là chính con của bác, máy bị chiếm.
 *
 *  2. KHÔNG khẳng định một dấu hiệu VẮNG MẶT. Không bao giờ viết "Chưa thấy lời
 *     đe doạ hay xin mã OTP" — câu đó đã từng phủ nhận đúng dấu hiệu đang nằm
 *     trong tin nhắn.
 *
 *  3. KHÔNG trách móc bác. Không "sao bác lại tin?", không "bác đã sai rồi".
 *
 *  4. KHÔNG hứa an toàn. Mức thấp nói "chưa thấy dấu hiệu trong thông tin bác
 *     cung cấp", không nói "an toàn".
 *
 * ⚠️ KHÔNG ĐƯỢC VIẾT KIỂU KỸ THUẬT. "Phát hiện R1: domain mismatch với
 * allowlist" là câu dành cho người viết mã, không dành cho người đang bị dồn ép
 * trên điện thoại. Mã luật vẫn có (`luatKhopVoi`) cho phần kiểm toán.
 *
 * ⚠️ GIỌNG VĂN §4.5: gọi bác, xưng cháu. Câu ngắn. Không thuật ngữ.
 */

/**
 * Câu theo mã luật. `{...}` là chỗ ghép bằng chứng — luôn có bản không có bằng
 * chứng để rơi về, vì bằng chứng có thể bị che theo §6.9.
 */
const CAU = Object.freeze({
  R1: {
    vi: 'Tin này nói chuyện của cơ quan nhà nước nhưng đường link lại không phải trang chính thức.',
    en: 'This message talks about a government matter, but the link is not an official government site.',
  },
  R2: {
    vi: 'Tin này bảo bác cài một ứng dụng từ đường link — đây là cách kẻ gian chiếm quyền điều khiển điện thoại.',
    en: 'This message asks you to install an app from a link — that is how phones get taken over.',
  },
  R3: {
    vi: 'Tin này xưng danh cơ quan nhưng dùng link rút gọn, mà cơ quan nhà nước thì không dùng link rút gọn.',
    en: 'It claims to be from a government body but uses a shortened link, which official bodies do not use.',
  },
  R4: {
    vi: 'Đường link trong tin có tên gần giống trang thật nhưng không phải trang thật.',
    en: 'The link looks almost like the real site, but it is not the real site.',
  },
  R5: {
    vi: 'Đường link trong tin dùng loại tên miền mà các vụ lừa đảo hay dùng.',
    en: 'The link uses a type of domain commonly seen in scams.',
  },
  R6: {
    vi: 'Tin này vừa đưa số tài khoản, vừa nêu số tiền, vừa giục bác làm ngay — ba thứ đi cùng nhau là dấu hiệu thường gặp trong các vụ lừa đảo.',
    en: 'It gives an account number, an amount, and pushes you to act now — those three together are a common scam pattern.',
  },
  R7: {
    vi: 'Tin này bảo bác đừng nói với ai. Việc thật thì không ai cấm bác hỏi người nhà.',
    en: 'It tells you to keep this from everyone. Nothing legitimate requires you to hide it from your family.',
  },
  R8: {
    vi: 'Tin này hỏi mã hoặc mật khẩu của bác. Ngân hàng và cơ quan nhà nước không bao giờ hỏi những thứ đó.',
    en: 'It asks for your code or password. Banks and government bodies never ask for those.',
  },
  R9: {
    vi: 'Tin gửi từ một số điện thoại thường nhưng lại xưng là cơ quan hoặc ngân hàng.',
    en: 'The message comes from an ordinary mobile number but claims to be a bank or a government body.',
  },
  R10: {
    vi: 'Tin có đường link và bác chưa từng lưu số người gửi này.',
    en: 'The message contains a link and this sender is not in your saved contacts.',
  },

  /** Tầng 2 nâng nhãn sau khi đối chiếu máy chủ. */
  T2_DA_BAO_CAO: {
    vi: 'Đường link trong tin này đã từng bị báo cáo trong các vụ lừa đảo trước đó.',
    en: 'The link in this message has been reported in earlier scam cases.',
  },

  /** Không luật nào khớp. §11 — KHÔNG nói "an toàn", KHÔNG kể ra thứ vắng mặt. */
  KHONG_KHOP: {
    vi: 'Cháu chưa thấy dấu hiệu rủi ro trong phần bác gửi. Nếu vẫn thấy chưa yên tâm, bác gọi cho người nhà nhé.',
    en: 'No clear risk signals found in what you sent. If you are still unsure, please call a family member.',
  },

  /** §4.3 — không đọc được KHÁC đã đọc và không thấy gì. */
  KHONG_DOC_DUOC: {
    vi: 'Cháu chưa đọc được hết phần bác gửi, nên chưa kết luận được gì.',
    en: 'Some of what you sent could not be read, so nothing is concluded yet.',
  },

  /** LUẬT ỨNG DỤNG LẠ — xem `ung-dung-la.js`. */
  APP_LA: {
    vi: 'Vừa có một ứng dụng lạ được cài vào máy. Nếu ai đó đang hướng dẫn bác cài, bác dừng lại và gọi cho người nhà nhé.',
    en: 'An app from outside the official store was just installed. If someone is guiding you through it, please stop and call a family member.',
  },
});

/**
 * Chọn MỘT câu cho cả kết quả.
 *
 * ⚠️ MỘT CÂU, KHÔNG PHẢI DANH SÁCH. Người đang bị kẻ gian giữ trên điện thoại
 * không đọc được năm gạch đầu dòng. Chọn luật có sàn cao nhất; hoà thì lấy luật
 * đứng trước trong bảng (R1 trước R10) vì bảng đã xếp theo độ đặc trưng giảm dần.
 */
const THU_TU = ['CHUA_THAY', 'NGHI_NGO', 'CAO'];

function chonCauChinh(khop = []) {
  if (khop.length === 0) return null;
  let tot = khop[0];
  for (const k of khop) {
    if (THU_TU.indexOf(k.san) > THU_TU.indexOf(tot.san)) tot = k;
  }
  return tot;
}

/**
 * @param {Array} khop         luật đã khớp, từ `chayTang0`
 * @param {object} tuyChon     { ngonNgu: 'vi'|'en', khongDocDuoc: boolean, maThem: string[] }
 * @returns {{ ma: string, cau: string }}
 */
function dungGiaiThich(khop = [], tuyChon = {}) {
  const ngonNgu = tuyChon.ngonNgu === 'en' ? 'en' : 'vi';
  const lay = (ma) => ({ ma, cau: (CAU[ma] || CAU.KHONG_KHOP)[ngonNgu] });

  for (const ma of tuyChon.maThem || []) if (CAU[ma]) return lay(ma);

  const chinh = chonCauChinh(khop);
  if (chinh) return lay(chinh.ma);
  if (tuyChon.khongDocDuoc) return lay('KHONG_DOC_DUOC');
  return lay('KHONG_KHOP');
}

/** Mọi mã câu module này có thể phát ra — frontend cần có nhãn cho từng mã. */
const MA_GIAI_THICH = Object.freeze(Object.keys(CAU));

module.exports = { dungGiaiThich, chonCauChinh, CAU, MA_GIAI_THICH };
