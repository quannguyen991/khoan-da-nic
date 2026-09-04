'use strict';
/**
 * MÔ TẢ TÍN HIỆU CHO LỜI NHẮC.
 *
 * Đây là VẬT LIỆU LỜI NHẮC, không phải dữ liệu bộ luật. Trọng số, nhóm và cap
 * nằm ở `signal-registry.js`; file này chỉ giúp model hiểu mỗi mã NGHĨA LÀ GÌ.
 *
 * ⚠️ Đo 15/8/2026: lời nhắc chỉ liệt kê 58 mã trần, không mô tả. `MAN_COVER_STORY`
 * hay `FIN_ORG_CLAIM_PERSONAL_ACCOUNT` không tự giải thích được, và 83/213 mẫu
 * nguy hiểm dừng ở dải 20–44 điểm vì thiếu tín hiệu.
 *
 * KHÔNG viết ngưỡng, điểm số hay mức rủi ro vào đây. Model không được biết
 * tín hiệu nào "nặng" hơn tín hiệu nào — biết là nó bắt đầu tự chấm mức.
 */

module.exports = Object.freeze({
  // ── MONEY ──
  FIN_SAFE_ACCOUNT: 'đòi chuyển tiền sang một "tài khoản an toàn / tạm giữ / bảo đảm" do người gọi chỉ định',
  FIN_CASH_COURIER: 'sẽ có người tới tận nhà nhận tiền mặt, hoặc bảo mang tiền mặt tới điểm hẹn',
  FIN_GIFT_CARD_PAYMENT: 'đòi thanh toán bằng thẻ quà tặng, thẻ cào, thẻ game',
  FIN_PRECIOUS_METAL_PURCHASE: 'đòi mua vàng, bạc, kim loại quý rồi giao lại',
  FIN_RECOVERY_FEE: 'đòi nộp phí trước thì mới lấy lại được tiền đã mất, hoặc mới nhận được hoàn tiền',
  FIN_ORG_CLAIM_PERSONAL_ACCOUNT: 'người tự xưng đại diện tổ chức nhưng số tài khoản nhận lại là tài khoản CÁ NHÂN',
  FIN_RECIPIENT_NAME_MISMATCH: 'tên chủ tài khoản nhận không khớp với tổ chức hay người mà họ tự xưng',
  FIN_TRANSFER_REQUEST: 'yêu cầu chuyển tiền / chuyển khoản, dù có hối thúc hay không',
  FIN_CRYPTO_TRANSFER: 'yêu cầu chuyển tiền mã hoá, bitcoin, USDT',
  FIN_REPEATED_TRANSFER_PRESSURE: 'thúc chuyển thêm lần nữa sau khi đã chuyển một lần',
  FIN_TRANSFER_MEMO_MISMATCH: 'nội dung chuyển khoản được dặn ghi khác với lý do thật',
  FIN_NEW_RECIPIENT: 'người nhận tiền là người mới, chưa từng giao dịch',

  // ── CREDENTIAL ──
  CRED_OTP_SHARE: 'đòi đọc / gửi mã OTP, mã xác thực, mã sáu số vừa nhận',
  CRED_PASSWORD_PIN: 'đòi mật khẩu hoặc mã PIN',
  CRED_CARD_SECRET: 'đòi số thẻ đầy đủ, CVV, ngày hết hạn',
  CRED_BANK_LOGIN: 'đòi tên đăng nhập / thông tin đăng nhập ngân hàng, hoặc bảo đăng nhập trong lúc họ xem',

  // ── DEVICE ──
  DEV_SCREEN_SHARE_BANKING: 'đòi chia sẻ màn hình trong lúc người dùng mở ứng dụng ngân hàng',
  DEV_REMOTE_CONTROL_APP: 'đòi cài phần mềm điều khiển từ xa (AnyDesk, TeamViewer, UltraViewer…)',
  DEV_ACCESSIBILITY_PERMISSION: 'đòi bật quyền trợ năng / accessibility cho một ứng dụng',
  DEV_INSTALL_APK_UNKNOWN: 'đòi cài ứng dụng từ đường link gửi tới, file APK, hoặc nguồn ngoài kho chính thức',
  DEV_CALL_FORWARD: 'đòi bật chuyển hướng cuộc gọi, hoặc bấm mã chuyển tiếp',

  // ── MANIPULATION ──
  MAN_EXTORTION_MEDIA_THREAT: 'doạ phát tán ảnh, video riêng tư để ép làm theo',
  MAN_FEAR_THREAT: 'doạ bắt giữ, khởi tố, phong toả tài khoản, cắt trợ cấp, quy kết liên quan vụ án',
  MAN_COVER_STORY: 'kèm một lý do làm cho yêu cầu bất thường nghe ra hợp lý — đang họp, đang ở '
    + 'nước ngoài, tài khoản bị khoá, hệ thống đang lỗi, người nhà nằm viện, xe hỏng, chiều '
    + 'sẽ hoàn lại. Lý do đó giải thích vì sao phải nhờ, và vì sao không gọi trực tiếp được',
  MAN_SECRECY: 'dặn giữ bí mật, không nói với gia đình / người thân / ngân hàng',
  MAN_ISOLATION: 'tách người dùng khỏi người xung quanh, bảo đừng hỏi ai, đừng ra ngoài',
  MAN_URGENCY: 'ép làm ngay, đặt hạn giờ, nói chậm là mất cơ hội hoặc gặp hậu quả',
  MAN_KEEP_CALL_ACTIVE: 'bảo giữ máy, đừng tắt, đừng cúp, ở lại đầu dây',
  MAN_LOVE_BOMBING: 'tán tỉnh dồn dập, tỏ tình nhanh bất thường, gọi bằng những lời thân mật quá mức',
  MAN_SCARCITY_PRESSURE: 'ép ký / mua ngay tại chỗ vì giảm giá sốc, suất cuối, hết hôm nay',

  // ── IDENTITY ──
  ID_FAMILY_EMERGENCY_THIRD_PARTY: 'người lạ báo tin người thân gặp nạn, tai nạn, bị bắt',
  ID_RECOVERY_SUPPORT_IMPERSONATION: 'tự xưng là bên hỗ trợ lấy lại tiền đã bị lừa',
  ID_KHOAN_DA_IMPERSONATION: 'tự xưng là nhân viên / tổng đài của chính ứng dụng Khoan Đã',
  ID_AUTHORITY_IMPERSONATION: 'tự xưng công an, cảnh sát, điều tra viên, viện kiểm sát, toà án, cán bộ nhà nước',
  ID_CONTACT_ACCOUNT_TAKEOVER: 'tài khoản của người quen bị chiếm rồi nhắn mượn tiền',
  ID_TECH_SUPPORT_IMPERSONATION: 'tự xưng hỗ trợ kỹ thuật, nhân viên Microsoft / Apple / nhà mạng',
  ID_TAX_BENEFIT_IMPERSONATION: 'tự xưng cơ quan thuế, bảo hiểm xã hội, cơ quan chi trả trợ cấp',
  ID_BANK_IMPERSONATION: 'tự xưng nhân viên ngân hàng, bộ phận an ninh / chống gian lận của ngân hàng',
  ID_FAMILY_IMPERSONATION: 'tự xưng là con, cháu, người thân trong lúc xin tiền hoặc nhờ việc gấp',
  ID_EMPLOYER_JOB_IMPERSONATION: 'tự xưng nhà tuyển dụng, bộ phận nhân sự, sàn thương mại điện tử tuyển cộng tác viên',
  ID_UTILITY_IMPERSONATION: 'tự xưng điện lực, nước, viễn thông, dịch vụ công thiết yếu',
  ID_DELIVERY_IMPERSONATION: 'tự xưng đơn vị giao hàng, bưu điện, hải quan giữ hàng',

  // ── OFFER ──
  OFF_ADVANCE_FEE: 'đòi nộp một khoản trước thì mới nhận được thứ đã hứa — có thể là tiền lớn hơn, '
    + 'nhưng cũng có thể là hàng, phòng, suất hay dịch vụ. Gồm phí giao hàng, phí lưu kho, '
    + 'phí hải quan, tiền cọc giữ chỗ, phí kích hoạt, phí dịch vụ phải trả trước',
  OFF_CONTRACT_EXIT_UPSELL: 'ép mua thêm hợp đồng / gói mới để thoát khỏi hợp đồng cũ',
  OFF_INVESTMENT_GUARANTEE: 'mời đầu tư kèm cam kết lợi nhuận cao, chắc chắn, không rủi ro',
  OFF_TASK_PREPAY: 'mời làm nhiệm vụ, chốt đơn, nạp trước để nhận hoa hồng',
  OFF_ROMANCE_EMERGENCY: 'người quen qua mạng chưa từng gặp mặt, nay xin tiền vì lý do khẩn cấp',
  OFF_HIGH_VALUE_CONTRACT: 'chào hợp đồng giá trị lớn, nhiều năm, cho người không có chuyên môn',
  OFF_PRIZE_GIFT: 'báo trúng thưởng, mời hội thảo có quà tặng miễn phí',

  // ── WEB ──
  WEB_BRAND_DOMAIN_MISMATCH: 'tên miền mạo danh thương hiệu nhưng không phải tên miền chính thức',
  WEB_NONOFFICIAL_APP_SOURCE: 'link tải ứng dụng nằm ngoài kho ứng dụng chính thức',
  WEB_PUNYCODE_IP_LITERAL: 'tên miền dùng ký tự đánh lừa mắt, hoặc trỏ thẳng vào địa chỉ IP',
  WEB_POPUP_SUPPORT_NUMBER: 'cửa sổ bật lên báo máy nhiễm virus kèm số tổng đài để gọi',
  WEB_QR_TO_LOGIN_PAYMENT: 'mã QR dẫn tới trang đăng nhập hoặc trang thanh toán',
  WEB_SHORTENER_REDIRECT: 'link rút gọn che mất địa chỉ thật',

  // ── CASE ──
  CASE_MULTI_CHANNEL_ESCALATION: 'cùng một vụ nhưng chuyển sang kênh liên lạc khác',
  CASE_STAGE_ESCALATION: 'vụ việc tiến sang giai đoạn nặng hơn so với lần liên hệ trước',
  CASE_REPEATED_CONTACT: 'liên hệ lặp lại nhiều lần gây áp lực',
});
