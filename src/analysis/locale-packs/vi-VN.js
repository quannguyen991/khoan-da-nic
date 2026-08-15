'use strict';
/**
 * LocalePack vi-VN — §6.12.
 *
 * CHỈ DỮ LIỆU. Không trọng số, không ngưỡng, không logic override.
 *
 * ⚠️ Phụ lục B.4: pack này PHẢI có CẢ "công an" LẪN "cảnh sát", cộng nhóm giả
 * danh ngân hàng. Thiếu một trong hai là `ID_*` không được nhận và cả kịch bản
 * trung tâm tụt xuống dưới ngưỡng.
 *
 * ⚠️ KHÔNG DÙNG `\b` CẠNH CHỮ CÓ DẤU. `\w` của JavaScript chỉ là [A-Za-z0-9_],
 * nên `à ộ ữ ố ả ý` bị coi là ký tự KHÔNG phải chữ. `(tôi là)\b` không bao giờ
 * khớp "tôi là điều tra viên", và `(phong toả)\b` không bao giờ khớp gì cả.
 * Đã đo: lỗi này làm câm ID_AUTHORITY_IMPERSONATION và MAN_FEAR_THREAT, kéo
 * kịch bản giả danh công an từ 45 điểm xuống 21.
 */

module.exports = {
  locale: 'vi-VN',
  language: 'vi',
  localePackVersion: 'vi-VN@1.1.0',
  supportedCountryProfiles: ['VN', 'GLOBAL'],

  directPatterns: {
    CRED_OTP_SHARE: [
      { pattern: '(đọc|gửi|cung cấp|cho|nhắn|báo)\\b[^.]{0,30}\\b(mã otp|mã xác thực|mã xác minh|otp|mã vừa (gửi|nhận)|mã bảo mật)', scope: 'action' },
      { pattern: '\\b(mã otp|otp)\\b[^.]{0,24}(cho (tôi|em|anh|chị)|vừa (gửi|nhận))', scope: 'action' },
    ],
    CRED_PASSWORD_PIN: [
      { pattern: '(cung cấp|đọc|gửi|cho)\\b[^.]{0,26}\\b(mật khẩu|mã pin)\\b', scope: 'action' },
    ],
    CRED_BANK_LOGIN: [
      { pattern: 'đăng nhập\\b[^.]{0,30}(ngân hàng|internet banking|tài khoản|app ngân hàng)', scope: 'action' },
    ],
    FIN_TRANSFER_REQUEST: [
      { pattern: 'chuyển\\b[^.]{0,40}(tiền|triệu|đồng|khoản|vào tài khoản|sang tài khoản)', scope: 'action' },
      { pattern: '\\bchuyển khoản\\b', scope: 'action' },
      { pattern: '\\b(nộp|gửi)\\b[^.]{0,24}(tiền|triệu|đồng)\\b', scope: 'action' },
    ],
    FIN_SAFE_ACCOUNT: [
      { pattern: '(tài khoản|ví)\\s+(an toàn|bảo đảm|tạm giữ|phong toả)', scope: 'action' },
    ],
    FIN_CRYPTO_TRANSFER: [
      { pattern: '(bitcoin|btc|usdt|tiền ảo|tiền mã hoá|tiền điện tử)', scope: 'action' },
    ],
    FIN_RECOVERY_FEE: [
      { pattern: 'phí\\s+(giải ngân|xử lý|mở khoá|hồ sơ|kích hoạt|bảo lãnh)', scope: 'action' },
      // ⚠️ KHÔNG `phí\b` — `í` không phải ký tự chữ trong JavaScript nên mẫu đó
      // CHƯA BAO GIỜ khớp. Hàng rào test/ranh-gioi-tu-unicode.test.js tìm ra.
      { pattern: '(đóng|nộp) phí[^.]{0,44}(lấy lại|hoàn|nhận lại)', scope: 'action' },
    ],
    FIN_GIFT_CARD_PAYMENT: [
      { pattern: 'thẻ\\s+(quà tặng|cào|game|điện thoại)', scope: 'action' },
    ],
    FIN_PRECIOUS_METAL_PURCHASE: [
      { pattern: '(mua|đổi)\\b[^.]{0,16}(vàng|bạc)\\b', scope: 'action' },
      { pattern: '(vàng miếng|kim loại quý)', scope: 'action' },
    ],
    FIN_CASH_COURIER: [
      { pattern: '(tới|đến|qua)\\s+nhà[^.]{0,30}(nhận|lấy|thu)[^.]{0,16}tiền', scope: 'action' },
      { pattern: '(nhận|giao|thu)\\s+tiền mặt\\b', scope: 'action' },
    ],
    DEV_REMOTE_CONTROL_APP: [
      { pattern: '\\b(anydesk|teamviewer|ultraviewer|quicksupport)\\b', scope: 'action' },
      { pattern: '(điều khiển|truy cập)\\s+từ xa', scope: 'action' },
    ],
    DEV_INSTALL_APK_UNKNOWN: [
      { pattern: '(cài|tải)\\b[^.]{0,44}(dịch vụ công|qua (đường )?link|file apk|\\bapk\\b|đường dẫn (tôi|em|anh) gửi)', scope: 'action' },
    ],
    DEV_SCREEN_SHARE_BANKING: [
      { pattern: '(chia sẻ|bật)\\b[^.]{0,16}màn hình\\b[^.]{0,48}(ngân hàng|banking|tài khoản)', scope: 'action' },
      { pattern: 'chia sẻ màn hình\\b[^.]{0,44}(app|ứng dụng)\\s+ngân hàng', scope: 'action' },
    ],
    ID_AUTHORITY_IMPERSONATION: [
      // ⚠️ B.4: phải có CẢ "công an" LẪN "cảnh sát".
      { pattern: '(tôi là|đây là|mình là)[^.]{0,30}(công an|cảnh sát|điều tra viên|viện kiểm sát|toà án|cán bộ)', scope: 'any' },
      { pattern: '(công an|cảnh sát)\\s+(phường|quận|huyện|tỉnh|thành phố)', scope: 'any' },
      { pattern: '\\b(bộ công an|cục cảnh sát|c06)\\b', scope: 'any' },
    ],
    ID_TAX_BENEFIT_IMPERSONATION: [
      { pattern: '(chi cục|cơ quan|cục)\\s+thuế', scope: 'any' },
      { pattern: '\\b(bảo hiểm xã hội|trợ cấp nhà nước)\\b', scope: 'any' },
    ],
    ID_BANK_IMPERSONATION: [
      { pattern: '(tôi là|đây là)[^.]{0,26}(nhân viên|cán bộ)[^.]{0,16}ngân hàng', scope: 'any' },
      { pattern: '(vietcombank|bidv|vietinbank|techcombank|agribank)\\b[^.]{0,26}(thông báo|yêu cầu)', scope: 'any' },
    ],
    ID_TECH_SUPPORT_IMPERSONATION: [
      { pattern: '(hỗ trợ|kỹ thuật viên)\\s+(kỹ thuật|viễn thông)', scope: 'any' },
    ],
    /**
     * §9.2 — MẠO DANH CHÍNH KHOAN ĐÃ.
     * "Hễ một thương hiệu chống lừa đảo được người cao tuổi biết tới, kẻ lừa đảo
     * sẽ dùng chính cái tên đó. Rủi ro này LỚN DẦN THEO MỨC ĐỘ THÀNH CÔNG."
     * ⚠️ §9.2 cấm nâng tín hiệu này thành critical override thứ 11.
     */
    ID_KHOAN_DA_IMPERSONATION: [
      { pattern: '(nhân viên|người của|bên|đội|tổng đài)\\s+khoan đã', scope: 'any' },
      { pattern: '(tôi|em|cháu|mình)\\s+(là|bên)\\s+khoan đã', scope: 'any' },
      { pattern: 'khoan đã\\s+(yêu cầu|đề nghị|gọi|nhắn)', scope: 'any' },
      // inj-06 · inj-13 — mạo danh chính sản phẩm để TỰ CẤP CHỨNG NHẬN cho mình.
      // Đây là dạng nguy hiểm nhất của §9.2: kẻ lừa đảo mượn uy tín của đúng cái
      // app mà bác đang tin.
      { pattern: '(đã kiểm tra|xác nhận|chứng nhận|kiểm duyệt)\\s*(bởi|by)?\\s*khoan đã', scope: 'any' },
      { pattern: '(đội|nhóm|bộ phận)\\s*(phát triển|kỹ thuật|hỗ trợ)\\s*(của\\s*)?khoan đã', scope: 'any' },
    ],
    ID_FAMILY_IMPERSONATION: [
      { pattern: '(con|cháu|em)\\s+(gái|trai)?\\s*(nhờ|bảo|xin)\\b[^.]{0,26}(chuyển|gửi)\\s+tiền', scope: 'any' },
    ],
    MAN_SECRECY: [
      { pattern: '(đừng|không)\\s+(nói|kể|báo|tiết lộ)[^.]{0,28}(với ai|cho ai|người thân|gia đình|vợ|chồng|con)', scope: 'action' },
      { pattern: 'giữ\\s+bí mật', scope: 'action' },
      { pattern: 'không được cho ai biết', scope: 'action' },
    ],
    MAN_FEAR_THREAT: [
      { pattern: '(bắt giữ|bị bắt|khởi tố|truy tố|phong toả|tạm giam)', scope: 'any' },
      { pattern: '\\b(rửa tiền|cắt trợ cấp|liên quan.{0,12}vụ án)\\b', scope: 'any' },
    ],
    MAN_URGENCY: [
      { pattern: '\\b(ngay|gấp|lập tức|khẩn|trong vòng \\d+)\\b', scope: 'action' },
    ],
    MAN_KEEP_CALL_ACTIVE: [
      { pattern: '(giữ máy|đừng tắt máy|không được tắt máy)', scope: 'any' },
    ],
    OFF_INVESTMENT_GUARANTEE: [
      { pattern: '(lợi nhuận|lãi)\\b[^.]{0,20}(cam kết|đảm bảo|chắc chắn)', scope: 'any' },
    ],
  },

  // Phụ lục C.5 — dạng KHÔNG DẤU, chuẩn hoá trước khi so.
  // ⚠️ "ch play" TUYỆT ĐỐI không được vào đây: khớp chuỗi con không phân biệt được
  // "TỪ CH Play" với "ĐỪNG TẢI TRÊN CH Play", và một cụm hạ mức vô điều kiện là
  // một câu thần chú tặng cho kẻ lừa đảo.
  suppressors: {
    CRED_OTP_SHARE: ['khong cung cap ma', 'khong bao gio cung cap', 'khong chia se ma'],
    FIN_TRANSFER_REQUEST: ['da chuyen thanh cong', 'bien dong so du', 'giao dich thanh cong'],
    FIN_GIFT_CARD_PAYMENT: ['sinh nhat', 'tang chau', 'tang con', 'qua tet', 'mung tuoi'],
    FIN_PRECIOUS_METAL_PURCHASE: ['gia vang hom nay', 'nhan cuoi', 'trang suc'],
  },

  verifiedChannelSuppressed: ['MAN_KEEP_CALL_ACTIVE'],
  verifiedRelationshipSuppressed: ['ID_FAMILY_IMPERSONATION', 'ID_CONTACT_ACCOUNT_TAKEOVER'],

  institutionTerms: ['công an', 'cảnh sát', 'viện kiểm sát', 'toà án', 'chi cục thuế', 'bảo hiểm xã hội'],
  paymentTerms: ['momo', 'zalopay', 'vietqr', 'chuyển khoản'],
  credentialTerms: ['otp', 'mã pin', 'mật khẩu', 'mã xác thực'],
  deviceTerms: ['anydesk', 'teamviewer', 'chia sẻ màn hình', 'điều khiển từ xa'],
  moneyMoveTerms: ['chuyển tiền', 'chuyển khoản', 'nộp tiền'],
};
