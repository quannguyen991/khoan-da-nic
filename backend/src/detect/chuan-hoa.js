'use strict';
/**
 * CHUẨN HOÁ ĐẦU VÀO CHO TẦNG 0 — chạy TRƯỚC mọi phép khớp.
 *
 * VÌ SAO CẦN: kẻ lừa đảo không viết như trong sách. Ba thủ đoạn né bộ lọc gặp
 * ở gần như mọi mẫu thật thu được:
 *
 *   1. VIẾT KHÔNG DẤU — "phat nguoi", "vi pham giao thong", "chuyen tien gap".
 *      Đây KHÔNG phải ca hiếm: SMS lừa đảo ở Việt Nam viết không dấu là chuyện
 *      thường. Bộ luật cũ của repo đã học bài này một lần (xem khối cảnh báo
 *      trong `direct-precheck.js`): câu "Bac chuyen het tien sang tai khoan an
 *      toan cua Bo Cong an ngay" được 7 điểm, bản có dấu được 61.
 *
 *   2. CHE URL — "hxxp://", "vietcombank[.]com", "csgt (.) top", chèn khoảng
 *      trắng giữa tên miền. Người đọc vẫn hiểu, `new URL()` thì không.
 *
 *   3. KÝ TỰ ĐỒNG HÌNH — chữ "а" Kirin trông y hệt "a" Latin. `vietcombаnk.com`
 *      và `vietcombank.com` khác nhau đúng một byte mà mắt không phân biệt nổi.
 *
 * HÀM THUẦN. Không mạng, không đồng hồ, không trạng thái.
 *
 * ⚠️ CHUẨN HOÁ CHỈ ĐƯỢC THÊM KHẢ NĂNG KHỚP, KHÔNG ĐƯỢC BỚT (§4.2). Mọi hàm ở
 * đây trả về bản GỠ CHE, và tầng khớp thử CẢ bản gốc lẫn bản gỡ che. Không bao
 * giờ vứt bản gốc đi — nếu một phép gỡ che làm hỏng một chuỗi hợp lệ thì bản
 * gốc vẫn còn đó để khớp.
 */

const { boDau, goCheChu } = require('../analysis/context-builder');

/**
 * Trả `hxxp`/`hxxps` về `http`/`https`.
 * Cũng nhận `hxxp[:]//` và `h**p://` — hai biến thể gặp trong mẫu thật.
 */
function goCheGiaoThuc(t) {
  return String(t)
    .replace(/\bh(?:xx|\*\*|##)(ps?)\b/gi, 'htt$1')
    .replace(/\bhttps?\s*\[?:\]?\s*\/\//gi, (m) => m.replace(/[[\]\s]/g, ''));
}

/**
 * Trả `[.]`, `(.)`, `{.}`, ` dot `, `[dot]` về dấu chấm — nhưng CHỈ khi nó đứng
 * giữa hai ký tự chữ/số, tức là đang ở giữa một tên miền.
 *
 * ⚠️ ĐIỀU KIỆN "GIỮA HAI KÝ TỰ CHỮ SỐ" LÀ BẮT BUỘC. Không có nó thì câu tiếng
 * Việt bình thường "(.)" trong một biểu tượng mặt cười, hay dấu ngoặc trong
 * "(xem mục 3.)", đều bị nối bừa thành thứ trông như tên miền — rồi tầng 1 đi
 * phân tích một URL không tồn tại và báo oan.
 */
function goCheDauCham(t) {
  return String(t)
    .replace(/([a-z0-9])\s*[[({<]\s*\.\s*[\])}>]\s*([a-z0-9])/gi, '$1.$2')
    .replace(/([a-z0-9])\s*[[({<]\s*dot\s*[\])}>]\s*([a-z0-9])/gi, '$1.$2')
    .replace(/([a-z0-9])\s+dot\s+([a-z0-9])/gi, '$1.$2');
}

/**
 * Bỏ khoảng trắng chèn GIỮA tên miền: "vietcombank . com . vn" → "vietcombank.com.vn".
 * Chỉ nối quanh dấu chấm đã có sẵn — không tự sinh dấu chấm mới.
 *
 * ⚠️ ĐÒI KHOẢNG TRẮNG Ở TRƯỚC DẤU CHẤM, KHÔNG CHỈ Ở SAU. ĐO ĐƯỢC 4/9/2026.
 *
 * Bản đầu có thêm một luật nối "abc. Def" → "abc.Def" cho ca chỉ cách sau dấu
 * chấm. Nó nuốt luôn DẤU CHẤM KẾT CÂU BÌNH THƯỜNG, và hậu quả rơi đúng vào tin
 * nhắn LÀNH:
 *
 *   "Tra cuu phat nguoi tai trang chinh thuc https://csgt.vn. Cuc CSGT khong
 *    yeu cau chuyen tien qua dien thoai."
 *
 * → nối thành `csgt.vn.Cuc`, eTLD+1 hoá ra `vn.cuc`, KHÔNG nằm trong allowlist,
 * và luật R1 nổ CAO vào đúng tin CSGT thật đang dạy người ta cảnh giác. Một
 * báo động giả tệ hơn mười lần bỏ sót, vì nó dạy bác rằng cả trang thật cũng
 * bị báo đỏ.
 *
 * Câu tiếng Việt bình thường KHÔNG BAO GIỜ có khoảng trắng TRƯỚC dấu chấm kết
 * câu. Nên chỉ nối khi có khoảng trắng ở trước — đủ để bắt "vietcombank . com"
 * và "csgt ( . ) top", mà không đụng vào dấu chấm kết câu.
 */
function goCheKhoangTrang(t) {
  let s = String(t);
  // Lặp: "a . b . c" cần hai lượt vì lượt đầu ăn mất ranh giới của lượt sau.
  for (let i = 0; i < 3; i += 1) {
    const truoc = s;
    s = s.replace(/([a-z0-9])\s+\.\s*([a-z0-9])/gi, '$1.$2');
    if (s === truoc) break;
  }
  return s;
}

/**
 * GỠ CHE BẰNG KHOẢNG TRẮNG GIỮA TỪNG CHỮ CÁI: "c s g t - v n . t o p".
 *
 * `goCheChu()` của `context-builder` đã lo dạng "c-h-u-y-ể-n" (ngăn bằng dấu
 * gạch/chấm). Dạng ngăn bằng KHOẢNG TRẮNG là thủ đoạn khác và nó qua được mọi
 * bộ lọc từ khoá, vì sau khi tách từ thì không còn từ nào cả.
 *
 * ⚠️ ĐÒI ÍT NHẤT BỐN CHỮ CÁI ĐƠN LIÊN TIẾP. Tiếng Việt có từ một chữ cái
 * ("ở", "à", "ơ") nhưng bốn từ một chữ cái đứng liền nhau thì không phải câu
 * tiếng Việt nữa. Ngưỡng thấp hơn là nuốt cả những câu thật.
 */
function goCheChuCach(t) {
  /*
   * Cho phép dấu `- . _` XEN GIỮA các chữ cái đơn, vì mẫu thật trộn cả hai:
   *   "c s g t - v n . t o p"
   * Bỏ khoảng trắng nhưng GIỮ NGUYÊN `-` và `.` — chúng là một phần của tên
   * miền, xoá đi là làm hỏng chính thứ đang cố đọc.
   */
  return String(t).replace(
    /(?:(?<![\p{L}\p{N}])[\p{L}\p{N}][ \t]*[-._]?[ \t]+){4,}[\p{L}\p{N}](?![\p{L}\p{N}])/gu,
    (m) => m.replace(/[ \t]+/g, ''),
  );
}

/**
 * Ánh xạ ký tự đồng hình về ASCII.
 * @param {string} t
 * @param {Record<string,string>} bang  bảng đồng hình từ bộ luật
 */
function goDongHinh(t, bang = {}) {
  let s = String(t);
  let doi = false;
  let ra = '';
  for (const ch of s) {
    const thay = bang[ch];
    if (thay) { ra += thay; doi = true; } else { ra += ch; }
  }
  return { chuoi: ra, coDoi: doi };
}

/**
 * §HĐ luật của chính module này: trả về NHIỀU BẢN, không trả về một bản "đúng".
 *
 * @param {string} vanBan
 * @param {object} luat  bộ luật đang hiệu lực (cần `dongHinh`)
 * @returns {{
 *   goc: string,          // NFC, không sửa gì khác
 *   goCheUrl: string,     // đã gỡ hxxp / [.] / khoảng trắng trong tên miền
 *   thap: string,         // goCheUrl, chữ thường
 *   khongDau: string,     // thap, đã bỏ dấu tiếng Việt
 *   dongHinhDaGo: boolean // có ký tự đồng hình trong bản gốc hay không
 * }}
 */
function chuanHoaTin(vanBan = '', luat = {}) {
  const goc = String(vanBan).normalize('NFC');

  const { chuoi: sauDongHinh, coDoi } = goDongHinh(goc, luat.dongHinh || {});

  /**
   * ⚠️ HAI BẢN, VÀ CHÚNG PHẢI KHÁC NHAU — LỖI ĐO ĐƯỢC 4/9/2026.
   *
   * `goCheChu()` của `context-builder` gỡ che kiểu "c-h-u-y-ể-n" bằng cách XOÁ
   * dấu `- . _` nằm giữa hai chữ cái. Với TỪ thì đúng. Với TÊN MIỀN thì nó phá
   * đúng thứ ta đang cố đọc: `csgt-x.top` → `csgtxtop`, và không luật URL nào
   * còn khớp được.
   *
   * Nó chỉ nổ ở chế độ MẬT ĐỘ CAO, nên tin ngắn không thấy gì. Tin 19.000 ký tự
   * (một chuỗi thông báo bị nối lại) thì mật độ vượt ngưỡng và cả nhóm luật URL
   * im lặng — CAO tụt xuống NGHI_NGO mà không dấu vết.
   *
   *   `goCheUrl`  giữ nguyên dấu chấm  → dùng cho tầng 1 (URL, thực thể)
   *   `thap`/`khongDau`  đã gỡ che chữ → dùng cho khớp CỤM TỪ
   *
   * Đừng gộp lại làm một. Hai mục đích khác nhau đòi hai phép chuẩn hoá khác nhau.
   */
  const nen = goCheGiaoThuc(sauDongHinh);
  const goCheUrl = goCheKhoangTrang(goCheDauCham(goCheChuCach(nen)));
  const thap = goCheChu(goCheChuCach(nen)).toLowerCase();

  return {
    goc,
    goCheUrl,
    thap,
    khongDau: boDau(thap),
    dongHinhDaGo: coDoi,
  };
}

/**
 * Khớp một danh sách cụm từ trên CẢ bản có dấu lẫn bản không dấu.
 * Trả về cụm ĐẦU TIÊN khớp (để làm bằng chứng), hoặc null.
 *
 * ⚠️ SO BẰNG `includes`, KHÔNG BẰNG REGEX CÓ `\b`. `\b` của JavaScript không
 * nhận chữ tiếng Việt có dấu là ký tự chữ, nên `\bgấp\b` không khớp trong
 * "chuyển gấp" ở một số ngữ cảnh. Bài học này đã được ghi trong locale pack
 * vi-VN của repo; đừng học lại lần nữa.
 */
function timCum(ban, danhSach = []) {
  for (const cum of danhSach) {
    if (!cum) continue;
    if (ban.thap.includes(cum)) return cum;
    const khongDau = boDau(cum);
    if (khongDau !== cum && ban.khongDau.includes(khongDau)) return cum;
  }
  return null;
}

/** Tất cả cụm khớp, không chỉ cụm đầu. Dùng cho phần giải thích và kiểm toán. */
function timMoiCum(ban, danhSach = []) {
  const ra = [];
  for (const cum of danhSach) {
    if (!cum) continue;
    const khongDau = boDau(cum);
    if (ban.thap.includes(cum) || (khongDau !== cum && ban.khongDau.includes(khongDau))) {
      ra.push(cum);
    }
  }
  return ra;
}

module.exports = {
  chuanHoaTin, timCum, timMoiCum,
  goCheGiaoThuc, goCheDauCham, goCheKhoangTrang, goCheChuCach, goDongHinh,
};
