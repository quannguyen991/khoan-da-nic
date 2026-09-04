/**
 * CATALOG MÃ → CHỮ HIỂN THỊ. §HĐ luật 1 và 2 sống hay chết ở tệp này.
 *
 * Backend trả về MÃ. Chữ tiếng Việt và tiếng Anh nằm ở đây, và CHỈ ở đây.
 * Hệ quả cố ý: đổi ngôn ngữ KHÔNG THỂ làm đổi kết luận, vì kết luận là enum.
 *
 * ⚠️ BA NHÃN RỦI RO LÀ NGUYÊN VĂN, KHÔNG ĐƯỢC SỬA:
 *      CAO        → "Nguy hiểm cao"                / "High risk"
 *      NGHI_NGO   → "Nghi ngờ"                     / "Suspicious"
 *      CHUA_THAY  → "Chưa thấy dấu hiệu rủi ro"    / "No clear risk signals found"
 *
 *    TUYỆT ĐỐI KHÔNG có nhãn "An toàn" / "Safe" / bất kỳ biến thể nào. Hệ thống
 *    chỉ nói *chưa thấy dấu hiệu trong thông tin bác cung cấp* — nó KHÔNG HỨA
 *    an toàn. Có test chặn ở `catalog.test.ts`.
 *
 * ⚠️ §11 — NHỮNG CÂU KHÔNG ĐƯỢC VIẾT Ở ĐÂY:
 *    · không hứa lấy lại được tiền
 *    · không khẳng định một dấu hiệu là VẮNG MẶT ("chưa thấy họ đòi OTP")
 *    · không quy kết một cá nhân là tội phạm — dùng "Yêu cầu này có dấu hiệu
 *      thường gặp trong các vụ lừa đảo"
 *    · không trách móc người dùng
 *
 * ⚠️ Tên thương hiệu "Khoan Đã" giữ nguyên tiếng Việt ở MỌI locale.
 */

export type Lang = 'vi' | 'en';

type Cap = { vi: string; en: string };

const c = (vi: string, en: string): Cap => ({ vi, en });

// ═══════════════ Ba nhãn rủi ro — §4.1, nguyên văn ═══════════════

export const NHAN: Record<string, Cap> = {
  CAO: c('Nguy hiểm cao', 'High risk'),
  NGHI_NGO: c('Nghi ngờ', 'Suspicious'),
  CHUA_THAY: c('Chưa thấy dấu hiệu rủi ro', 'No clear risk signals found'),
};

/** Màu theo §4.1. Đỏ / vàng-cam / xanh lá. */
/**
 * ⚠️ MỨC CAO DÙNG NỀN ĐỎ ĐẶC, KHÔNG PHẢI HỒNG NHẠT.
 *
 * Bản cũ cho `CAO` nền `#fef2f2` — hồng rất nhạt, nhìn lướt không khác gì mức
 * vàng. Người dùng báo 16/8/2026: *"nếu nguy hiểm cao thì UI phải màu đỏ, phải
 * nhấn mạnh cảnh báo"*. Đúng: đây là màn hình bác nhìn khi có người đang thúc
 * bác chuyển tiền, và nó phải khác hẳn hai mức kia trong một cái liếc.
 *
 * ⚠️ `#b91c1c` CHỨ KHÔNG PHẢI `#dc2626`. Chữ trắng trên `#dc2626` chỉ đạt tương
 * phản 4,53:1 — sát mép sàn 4,5:1 của §4.4, và trượt ngay nếu ai đó chỉnh sáng
 * lên một chút. `#b91c1c` cho ~6,4:1.
 *
 * ⚠️ ĐÂY LÀ CÁCH HIỆN NHÃN, KHÔNG PHẢI CHỌN MÀN HÌNH. §HĐ luật 4: `canThiep`
 * quyết định MÀN, `nhan` quyết định NHÃN. Đổi màu nhãn theo `nhan` là đúng vai;
 * đổi xem màn nào được dựng thì không.
 */
export const MAU_NHAN: Record<string, {
  nen: string; chu: string; vien: string;
  /** Nền đặc dùng cho khối nhãn khi cần nhấn mạnh. */
  nenDac?: string;
  /** Chữ đặt trên `nenDac`. */
  chuTrenDac?: string;
}> = {
  CAO: {
    nen: '#fef2f2', chu: '#991b1b', vien: '#b91c1c',
    nenDac: '#b91c1c', chuTrenDac: '#ffffff',
  },
  NGHI_NGO: { nen: '#fffbeb', chu: '#92400e', vien: '#d97706' },
  CHUA_THAY: { nen: '#f0fdf4', chu: '#166534', vien: '#16a34a' },
};

// ═══════════════ Can thiệp — quyết định MÀN HÌNH ═══════════════

export const CAN_THIEP: Record<string, Cap> = {
  TRUST_RECEIPT: c('Phiếu tin cậy', 'Trust Receipt'),
  VERIFY_PATH: c('Đường xác minh', 'Verify Safely'),
  PAUSE_60S: c('Dừng 60 giây', 'Pause for 60 Seconds'),
  PROTECTED_CRITICAL: c('Bác đang được bảo vệ', 'Protected Mode'),
  RECOVERY: c('Bảo vệ 72 giờ', '72-Hour Recovery Watch'),
};

// ═══════════════ §15.11.1 — BỘ HỎI NHANH LÚC ĐANG BỊ GỌI ═══════════════
//
// Danh sách MÃ là của backend, đọc từ `public/config/ma-hop-dong.json`
// (`cauHoiNhanh` 8 mã · `nhanhHanhDong` 5 mã). Chữ hiển thị chỉ ở đây — §HĐ
// luật 2. `src/components/HoiNhanh.tsx` đối chiếu hai bên lúc chạy và kêu lên
// nếu lệch, thay vì để hai bản phân kỳ im lặng.

export const CAU_HOI_NHANH: Record<string, Cap> = {
  ho_bao_dung_cup_may: c(
    'Họ có bảo bác KHÔNG ĐƯỢC cúp máy, phải giữ máy liên tục không?',
    'Are they telling you not to hang up, to stay on the line?',
  ),
  co_ai_dan_noi_gi_voi_ngan_hang: c(
    'Có ai dặn bác phải nói gì với nhân viên ngân hàng không?',
    'Has anyone told you what to say to the bank staff?',
  ),
  ho_bao_dung_noi_voi_ai: c(
    'Họ có dặn bác giữ bí mật, không nói với con cháu hay ai khác không?',
    'Are they telling you to keep this secret from your family?',
  ),
  ho_noi_sap_bi_bat_hoac_phat: c(
    'Họ có nói bác sắp bị bắt, bị niêm phong tài sản hoặc bị phạt không?',
    'Are they saying you will be arrested, fined, or have assets seized?',
  ),
  ho_bao_chuyen_tien_hoac_rut_tien: c(
    'Họ có bảo bác chuyển tiền, nộp tiền hoặc ra ngân hàng rút tiền không?',
    'Are they asking you to transfer, deposit, or withdraw money?',
  ),
  ho_xin_ma_trong_tin_nhan: c(
    'Họ có hỏi mã OTP hoặc dãy số vừa gửi về tin nhắn của bác không?',
    'Are they asking for the OTP or the code just sent to your phone?',
  ),
  ho_nhac_tai_khoan_an_toan: c(
    'Họ có nhắc tới “tài khoản an toàn” để giữ tiền xác minh không?',
    'Do they mention a “safe account” to hold your money for checking?',
  ),
  ho_bao_cai_ung_dung_hoac_bam_link: c(
    'Họ có bảo bác bấm vào đường dẫn lạ hoặc tải ứng dụng lạ không?',
    'Are they telling you to tap a link or install an app?',
  ),
};

export const NHANH_HANH_DONG: Record<string, Cap> = {
  chuyen_tien: c('Chuyển tiền / Rút tiền', 'Transfer or withdraw money'),
  doi_otp: c('Đưa mã OTP / Mật khẩu', 'Give an OTP or password'),
  cai_ung_dung: c('Cài ứng dụng / Bấm link', 'Install an app or tap a link'),
  gui_giay_to: c('Gửi ảnh căn cước / Giấy tờ', 'Send ID or document photos'),
  khong_ro: c('Tôi không rõ / Chuyện khác', 'I am not sure / something else'),
};

export const CAU_HOI_NHANH_KHUNG: Record<string, Cap> = {
  tieu_de: c('Người ta đang yêu cầu bác làm gì?', 'What are you being asked to do?'),
  dan_dat: c(
    'Bác chạm vào một việc dưới đây, cháu hỏi thêm vài câu rồi kiểm ngay.',
    'Tap one below. I will ask a couple of questions, then check.',
  ),
  dang_nghe_may: c('Lúc đang nghe máy', 'While you are on the call'),
  cau_so: c('Câu {i} trên {n}', 'Question {i} of {n}'),
  tro_ly_hoi: c('Cháu hỏi bác:', 'Let me ask you:'),
  tra_loi_co: c('CÓ, HỌ ĐANG BẢO VẬY', 'YES, THAT IS WHAT THEY SAID'),
  tra_loi_khong: c('KHÔNG PHẢI', 'NO, NOT THAT'),
  dang_kiem: c('Cháu đang kiểm…', 'Checking…'),
  hoi_lai: c('Hỏi lại tình huống khác', 'Ask about another situation'),
  ve_trang_chu: c('Về trang chủ', 'Back to home'),
  ket_qua: c('Kết quả kiểm nhanh', 'Quick check result'),
  so_hai: c(
    'Bác thấy sợ hoặc bị đe doạ? Dừng 60 giây ngay',
    'Feeling scared or threatened? Pause for 60 seconds',
  ),
  /**
   * ⚠️ §15.8 — CÂU NÀY BẮT BUỘC Ở MỌI KẾT QUẢ CỦA BỘ HỎI NHANH.
   * Bộ hỏi nhanh nghe LỜI BÁC KỂ, nó không nghe được cuộc gọi. Không có câu này
   * thì màn kết quả đọc như thể máy đã nghe xong cuộc gọi rồi.
   */
  nhac_gioi_han: c(
    'Cháu chỉ đọc được điều bác vừa trả lời.',
    'I could only read what you just answered.',
  ),
};

// ═══════════════ maLyDo — 58 tín hiệu ═══════════════
//
// ⚠️ Câu mô tả HÀNH VI TRONG NỘI DUNG, không phán xét con người.
// "Yêu cầu chuyển tiền" chứ không phải "Kẻ lừa đảo đòi tiền".

export const MA_LY_DO: Record<string, Cap> = {
  // tiền
  FIN_SAFE_ACCOUNT: c('Nhắc tới “tài khoản an toàn”', 'Mentions a “safe account”'),
  FIN_CASH_COURIER: c('Hẹn tới nhận tiền mặt tận nhà', 'Someone will collect cash in person'),
  FIN_GIFT_CARD_PAYMENT: c('Đòi trả bằng thẻ cào / thẻ quà tặng', 'Asks for gift or scratch cards'),
  FIN_PRECIOUS_METAL_PURCHASE: c('Đòi mua vàng hoặc kim loại quý', 'Asks to buy gold or precious metals'),
  FIN_RECOVERY_FEE: c('Đòi phí để “lấy lại tiền”', 'Asks for a fee to “recover money”'),
  FIN_ORG_CLAIM_PERSONAL_ACCOUNT: c('Xưng danh cơ quan nhưng đưa tài khoản cá nhân', 'Claims to be an institution but gives a personal account'),
  FIN_RECIPIENT_NAME_MISMATCH: c('Tên người nhận không khớp', 'Recipient name does not match'),
  FIN_TRANSFER_REQUEST: c('Yêu cầu chuyển tiền', 'Asks for a money transfer'),
  FIN_CRYPTO_TRANSFER: c('Yêu cầu chuyển tiền mã hoá', 'Asks for a crypto transfer'),
  FIN_REPEATED_TRANSFER_PRESSURE: c('Thúc chuyển thêm lần nữa', 'Pushes for another transfer'),
  FIN_TRANSFER_MEMO_MISMATCH: c('Nội dung chuyển khoản không khớp', 'Transfer memo does not match'),
  FIN_NEW_RECIPIENT: c('Người nhận lần đầu xuất hiện', 'Recipient appears for the first time'),

  // thông tin bí mật
  CRED_OTP_SHARE: c('Đòi mã OTP', 'Asks for an OTP'),
  CRED_PASSWORD_PIN: c('Đòi mật khẩu hoặc mã PIN', 'Asks for a password or PIN'),
  CRED_CARD_SECRET: c('Đòi số thẻ và ba số mặt sau', 'Asks for card number and CVV'),
  CRED_BANK_LOGIN: c('Đòi đăng nhập ngân hàng', 'Asks you to log in to your bank'),

  // thiết bị
  DEV_SCREEN_SHARE_BANKING: c('Đòi chia sẻ màn hình khi mở app ngân hàng', 'Asks to share your screen while banking'),
  DEV_REMOTE_CONTROL_APP: c('Đòi cài app điều khiển từ xa', 'Asks to install remote-control software'),
  DEV_ACCESSIBILITY_PERMISSION: c('Đòi quyền trợ năng của máy', 'Asks for accessibility permissions'),
  DEV_INSTALL_APK_UNKNOWN: c('Đòi cài ứng dụng ngoài kho chính thức', 'Asks to install an app from outside the official store'),
  DEV_CALL_FORWARD: c('Đòi bật chuyển tiếp cuộc gọi', 'Asks to set up call forwarding'),

  // sức ép
  MAN_EXTORTION_MEDIA_THREAT: c('Doạ phát tán hình ảnh, video', 'Threatens to release photos or video'),
  MAN_FEAR_THREAT: c('Doạ bắt giữ, khởi tố, phong toả', 'Threatens arrest, prosecution or freezing'),
  MAN_COVER_STORY: c('Dựng một câu chuyện để giải thích', 'Builds a story to explain the request'),
  MAN_SECRECY: c('Dặn đừng nói với ai', 'Tells you to keep it secret'),
  MAN_ISOLATION: c('Tách bác khỏi người thân', 'Separates you from family'),
  MAN_URGENCY: c('Thúc phải làm ngay', 'Pushes you to act immediately'),
  MAN_KEEP_CALL_ACTIVE: c('Bắt giữ máy, không cho tắt', 'Insists you stay on the line'),
  MAN_LOVE_BOMBING: c('Dồn dập lời yêu thương', 'Overwhelming affection'),
  MAN_SCARCITY_PRESSURE: c('Doạ hết suất, hết hạn', 'Claims the offer is about to run out'),

  // danh tính
  ID_FAMILY_EMERGENCY_THIRD_PARTY: c('Người lạ báo tin người thân gặp nạn', 'A stranger reports a family emergency'),
  ID_RECOVERY_SUPPORT_IMPERSONATION: c('Xưng là bên hỗ trợ lấy lại tiền', 'Claims to help recover lost money'),
  ID_KHOAN_DA_IMPERSONATION: c('Mạo danh chính Khoan Đã', 'Impersonates Khoan Đã itself'),
  ID_AUTHORITY_IMPERSONATION: c('Xưng là công an, viện kiểm sát, toà án', 'Claims to be police or prosecutors'),
  ID_CONTACT_ACCOUNT_TAKEOVER: c('Tài khoản người quen có dấu hiệu bị chiếm', 'A contact’s account may be taken over'),
  ID_TECH_SUPPORT_IMPERSONATION: c('Xưng là hỗ trợ kỹ thuật', 'Claims to be technical support'),
  ID_TAX_BENEFIT_IMPERSONATION: c('Xưng là cơ quan thuế hoặc bảo hiểm', 'Claims to be tax or benefits office'),
  ID_BANK_IMPERSONATION: c('Xưng là nhân viên ngân hàng', 'Claims to be from a bank'),
  ID_FAMILY_IMPERSONATION: c('Xưng là con cháu trong nhà', 'Claims to be a family member'),
  ID_EMPLOYER_JOB_IMPERSONATION: c('Xưng là bên tuyển dụng', 'Claims to be an employer'),
  ID_UTILITY_IMPERSONATION: c('Xưng là điện, nước, viễn thông', 'Claims to be a utility company'),
  ID_DELIVERY_IMPERSONATION: c('Xưng là bên giao hàng', 'Claims to be a delivery service'),

  // lời mời chào
  OFF_ADVANCE_FEE: c('Đòi nộp phí trước', 'Asks for a fee up front'),
  OFF_CONTRACT_EXIT_UPSELL: c('Đòi nâng gói để rút ra được', 'Asks you to upgrade to get your money out'),
  OFF_INVESTMENT_GUARANTEE: c('Cam kết lợi nhuận, bảo toàn vốn', 'Guarantees profit or protected capital'),
  OFF_TASK_PREPAY: c('Đòi ứng tiền để làm nhiệm vụ', 'Asks you to pre-pay for tasks'),
  OFF_ROMANCE_EMERGENCY: c('Chuyện khẩn cấp trong quan hệ tình cảm', 'An emergency in a romantic relationship'),
  OFF_HIGH_VALUE_CONTRACT: c('Hứa hợp đồng giá trị lớn', 'Promises a high-value contract'),
  OFF_PRIZE_GIFT: c('Báo trúng thưởng, tặng quà', 'Claims you won a prize or gift'),

  // web
  WEB_BRAND_DOMAIN_MISMATCH: c('Tên miền không khớp thương hiệu', 'Domain does not match the brand'),
  WEB_NONOFFICIAL_APP_SOURCE: c('Nguồn tải app không chính thức', 'Unofficial app download source'),
  WEB_PUNYCODE_IP_LITERAL: c('Địa chỉ web dùng ký tự lạ hoặc số IP', 'Web address uses odd characters or a raw IP'),
  WEB_POPUP_SUPPORT_NUMBER: c('Cửa sổ hiện số tổng đài lạ', 'Pop-up shows an unknown support number'),
  WEB_QR_TO_LOGIN_PAYMENT: c('Mã QR dẫn tới đăng nhập hoặc thanh toán', 'QR code leads to a login or payment page'),
  WEB_SHORTENER_REDIRECT: c('Đường dẫn rút gọn, không rõ đích', 'Shortened link with an unclear destination'),

  // vụ việc
  CASE_MULTI_CHANNEL_ESCALATION: c('Cùng một vụ, nhiều kênh liên lạc', 'Same case, escalating across channels'),
  CASE_STAGE_ESCALATION: c('Vụ việc đã sang giai đoạn nặng hơn', 'The case has moved to a later stage'),
  CASE_REPEATED_CONTACT: c('Liên lạc lặp lại nhiều lần', 'Repeated contact'),
};

// ═══════════════ daKiem — nguồn đã đọc được ═══════════════

export const DA_KIEM: Record<string, Cap> = {
  van_ban: c('văn bản bác gửi', 'the text you sent'),
  anh_ocr: c('chữ trong ảnh', 'text in the image'),
  url: c('đường dẫn trong nội dung', 'the link in the content'),
  thong_bao_tin_nhan: c('thông báo tin nhắn', 'the message notification'),
  bo_hoi_nhanh: c('câu trả lời của bác', 'your answers'),
  nguoi_than_xac_nhan: c('trả lời của người thân', 'your family member’s reply'),
  // ⚠️ "lời bác kể", KHÔNG phải "cuộc gọi". Khoan Đã nghe micro, không nghe
  // được cuộc gọi — Android chặn từ bản 10, và §15.9.1 giữ nguyên
  // `chua_nghe_duoc_cuoc_goi` trong chuaKiem không ngoại lệ.
  ghi_am: c('lời bác vừa kể', 'what you just told me'),
};

// ═══════════════ chuaKiem — §4.3, thứ KHÔNG kiểm được ═══════════════
//
// ⚠️ ĐÂY LÀ DẠNG LỖI ĐẶC TRƯNG CỦA SẢN PHẨM NÀY.
// "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ". Câu chữ ở đây phải nói ra
// giới hạn, không được nghe như một lời trấn an.
//
// ⚠️ HAI MÃ CUỐI TRÔNG GIỐNG NHAU NHƯNG NGƯỢC NHAU. Đừng viết câu giống nhau:
//   chua_lien_lac_duoc_nguoi_than  — ĐÃ hỏi mà không ai đáp. Im lặng CÓ nghĩa.
//   chua_thay_yeu_cau_da_xac_thuc  — CHƯA ai hỏi ai cả. Bình thường.

export const CHUA_KIEM: Record<string, Cap> = {
  /**
   * §4.3 — CÓ BẢN APK NHƯNG KHÔNG XEM ĐƯỢC TRẠNG THÁI MÁY.
   * Khác hẳn "đã xem, máy không có gì lạ" — và cũng khác bản web, nơi trường
   * này không được gửi đi chút nào.
   */
  chua_xem_duoc_trang_thai_may: c(
    'Cháu chưa xem được trong máy có ứng dụng nào bấm thay bác không',
    'Could not check whether any app can tap on your behalf',
  ),

  chua_nghe_duoc_cuoc_goi: c(
    'Khoan Đã chưa nghe được cuộc gọi',
    'Khoan Đã could not hear the call',
  ),
  khong_doc_duoc_anh: c(
    'Khoan Đã chưa đọc được chữ trong ảnh',
    'Khoan Đã could not read the text in the image',
  ),
  khong_mo_duoc_link: c(
    'Khoan Đã chưa mở được đường dẫn',
    'Khoan Đã could not open the link',
  ),
  ai_khong_phan_hoi: c(
    'Lượt này AI không trả lời được',
    'The AI layer did not respond this time',
  ),
  ai_khong_chay: c(
    'Lượt này không có AI đọc nội dung',
    'No AI read the content this time',
  ),
  khong_nghe_duoc_ghi_am: c(
    'Cháu nghe chưa rõ đoạn bác vừa nói',
    'I could not hear that clearly',
  ),
  noi_dung_qua_dai: c(
    'Nội dung quá dài, Khoan Đã chưa đọc hết',
    'The content was too long to read in full',
  ),
  /*
   * §4.3 — QUÁ NGẮN ĐỂ KẾT LUẬN, ĐỐI XỨNG VỚI QUÁ DÀI Ở TRÊN.
   * Đo 20/8/2026: người dùng gõ "police told me bank 50$" và nhận về "Chưa thấy
   * dấu hiệu rủi ro" — đọc thành "cháu đã xem và thấy ổn", trong khi sự thật là
   * không đủ chữ để xem. Câu này hiện cùng cỡ chữ với nhãn (§HĐ luật 3).
   */
  noi_dung_qua_ngan: c(
    'Bác kể thêm vài câu nữa thì cháu mới đủ để kiểm',
    'Tell me a bit more — that is not enough to check yet',
  ),
  chi_doc_duoc_mot_phan_tin: c(
    'Khoan Đã chỉ đọc được một phần tin nhắn',
    'Khoan Đã could only read part of the message',
  ),
  thong_bao_khong_co_noi_dung: c(
    'Thông báo không kèm nội dung để đọc',
    'The notification carried no readable content',
  ),
  thong_bao_da_bi_xoa: c(
    'Thông báo đã bị xoá trước khi đọc',
    'The notification was deleted before it could be read',
  ),
  chua_lien_lac_duoc_nguoi_than: c(
    'Đã hỏi người thân nhưng chưa ai trả lời',
    'Your family member was asked but has not replied',
  ),
  chua_thay_yeu_cau_da_xac_thuc: c(
    'Khoan Đã chưa tìm thấy yêu cầu đã xác thực nào',
    'Khoan Đã has not found a verified request',
  ),

  /**
   * ⚠️ MÃ NÀY DO FRONTEND TỰ ĐẶT, KHÔNG ĐẾN TỪ MÁY CHỦ — và đó chính là lý do
   * nó tồn tại. Khi `fetch` không đi được thì máy chủ chưa hề nghe thấy gì, nên
   * không có `chuaKiem` nào để mà đọc. Nếu màn hình im lặng ở đúng lúc đó, người
   * dùng sẽ đọc màn trống thành "kiểm rồi, không sao" — đúng dạng lỗi §4.3.
   *
   * Nó KHÔNG được gửi lên máy chủ và KHÔNG nằm trong `ma-hop-dong.json`.
   */
  khong_goi_duoc_may_chu: c(
    'Máy chưa gửi được nội dung này đi kiểm',
    'This could not be sent for checking',
  ),

  /**
   * ─── Nguồn đầu vào thứ sáu: ghi âm nghe trên máy ───
   *
   * ⚠️ BỐN CA HỎNG, BỐN CÂU KHÁC NHAU. Viết chung một câu là gộp mất thông tin
   * bác cần để biết phải làm gì tiếp: máy chưa có bộ nghe thì đi tải, không có
   * tiếng nói thì nói to hơn, nghe cụt thì nói lại đoạn sau.
   *
   * ⚠️ Và không câu nào được nghe như một lời trấn an. Đây là §4.3: chúng nói
   * ra GIỚI HẠN, không nói "không sao đâu".
   */
  chua_tai_xong_model_nghe: c(
    'Máy bác chưa có bộ nghe tiếng Việt nên cháu chưa nghe được',
    'Your device has no on-device recogniser, so I could not listen',
  ),
  ghi_am_khong_co_tieng_noi: c(
    'Cháu không nghe thấy tiếng nói nào',
    'I did not hear any speech',
  ),
  chi_nghe_duoc_phan_dau: c(
    'Cháu chỉ nghe được đoạn đầu',
    'I only caught the beginning',
  ),
  /**
   * ⚠️ CA §4.3 TINH TẾ NHẤT CỦA CẢ TÍNH NĂNG GHI ÂM.
   *
   * Bộ nghe của Android không bắt buộc trả điểm tin cậy, và bộ nghe trên máy
   * thường bỏ trống. Lúc đó CÓ chữ nhưng KHÔNG có số đo — và câu ở đây phải nói
   * đúng CẢ HAI VẾ.
   *
   * Viết thành "nghe chưa rõ" là nói sai: rõ ràng đã giải mã ra chữ.
   * Bỏ trống là nói sai kiểu khác: người dùng tưởng đã kiểm xong.
   */
  ghi_am_khong_do_duoc_do_tin_cay: c(
    'Cháu nghe ra chữ, nhưng máy không cho biết nghe có chuẩn không',
    'I got the words, but the device did not report how accurate they are',
  ),
};

// ═══════════════ AI chạy ở đâu — §11 minh bạch ═══════════════
//
// ⚠️ CÂU CHỮ Ở ĐÂY NÓI VỀ MỘT SỰ THẬT KIỂM ĐƯỢC, KHÔNG PHẢI MỘT LỜI QUẢNG CÁO.
// `/api/suc-khoe` đọc thẳng cấu hình đang chạy. Nếu máy chủ đang gọi ra ngoài
// mà màn hình nói "chạy trên máy" thì đó là lời khai SAI — tệ hơn lời khai
// THIẾU, vì người dùng dựa vào nó để quyết định có gõ nội dung nhạy cảm hay không.

export const NOI_CHAY_AI: Record<string, Cap> = {
  /**
   * ⚠️ HAI CÂU NÀY TRÔNG GIỐNG NHAU NHƯNG NÓI HAI CHUYỆN KHÁC HẲN.
   * Một cái nói nội dung KHÔNG RỜI MÁY. Cái kia chỉ nói nó KHÔNG SANG CÔNG TY
   * KHÁC — nó vẫn rời khỏi điện thoại của bác để tới máy chủ. Dùng nhầm câu
   * mạnh cho trường hợp yếu là hứa một thứ không có thật.
   */
  tren_may_nguoi_dung: c(
    'AI chạy ngay trên máy này — nội dung không rời khỏi máy',
    'The AI runs on this machine — nothing leaves the device',
  ),
  tren_may_chu_tu_van_hanh: c(
    'AI chạy trên máy chủ của Khoan Đã — nội dung không gửi cho công ty nào khác',
    'The AI runs on Khoan Đã’s own server — nothing is sent to any other company',
  ),
  gateway: c(
    'Nội dung được gửi tới máy chủ AI để đọc',
    'The content is sent to an AI server to be read',
  ),
  gemini: c(
    'Nội dung được gửi tới máy chủ AI để đọc',
    'The content is sent to an AI server to be read',
  ),
  khong_chay: c(
    'Lượt này không có AI đọc nội dung',
    'No AI read the content this time',
  ),
};

// ═══════════════ Tin lừa đảo lấy từ báo — §11 · §4.3 ═══════════════
//
// ⚠️ "CHƯA LẤY ĐƯỢC TIN" KHÁC "KHÔNG CÓ TIN NÀO".
// Mất mạng, báo đổi địa chỉ, đường hầm chết — cả ba đều cho danh sách rỗng.
// Màn hình rỗng mà im lặng sẽ được đọc thành "dạo này ít lừa đảo".

export const CHUA_LAY_TIN: Record<string, Cap> = {
  khong_lay_duoc_tin_moi: c(
    'Lúc này chưa lấy được tin mới từ các báo',
    'Could not fetch fresh news from the papers right now',
  ),
  khong_lay_duoc_mot_so_bao: c(
    'Có báo chưa trả lời, nên danh sách này còn thiếu',
    'Some papers did not respond, so this list is incomplete',
  ),
};

// ═══════════════ Họ kịch bản ═══════════════

export const HO_KICH_BAN: Record<string, Cap> = {
  gia_danh_cong_an: c('giả danh công an', 'police impersonation'),
  gia_danh_co_quan_thue: c('giả danh cơ quan thuế', 'tax office impersonation'),
  gia_danh_ngan_hang: c('giả danh ngân hàng', 'bank impersonation'),
  gia_danh_ho_tro_ky_thuat: c('giả danh hỗ trợ kỹ thuật', 'tech support impersonation'),
  gia_danh_ho_tro_lay_lai_tien: c('giả danh bên lấy lại tiền', 'recovery service impersonation'),
  gia_danh_nguoi_than: c('giả danh người thân', 'family impersonation'),
  bao_tin_nguoi_than_gap_nan: c('báo tin người thân gặp nạn', 'family emergency claim'),
  tai_khoan_nguoi_than_bi_chiem: c('tài khoản người thân bị chiếm', 'hijacked contact account'),
  gia_danh_giao_hang: c('giả danh bên giao hàng', 'delivery impersonation'),
  gia_danh_dich_vu_thiet_yeu: c('giả danh điện nước viễn thông', 'utility impersonation'),
  gia_danh_tuyen_dung: c('giả danh bên tuyển dụng', 'fake job offer'),
  lua_lay_lai_tien: c('lừa lấy lại tiền', 'recovery scam'),
  chiem_quyen_thiet_bi: c('chiếm quyền thiết bị', 'device takeover'),
  du_dau_tu_loi_nhuan_cao: c('dụ đầu tư lợi nhuận cao', 'high-return investment lure'),
  lua_tinh_cam: c('lừa tình cảm', 'romance scam'),
};

// ═══════════════ §16.1 — bước kịch bản đi tiếp ═══════════════
//
// ⚠️ ĐÂY LÀ CHỖ TÍNH NĂNG NÀY DỄ TRƯỢT §11 NHẤT, vì bản chất nó đang liệt kê
// các bước. Khung câu BẮT BUỘC là "kịch bản này THƯỜNG đi tiếp như sau", và mỗi
// dòng bắt đầu bằng "Họ thường…" — KHÔNG phải "Họ SẼ…", KHÔNG phải "Chắc chắn".
// Và tuyệt đối không dòng nào nói một dấu hiệu là VẮNG MẶT.

export const KHUNG_KICH_BAN: Cap = c(
  'Kịch bản này thường đi tiếp như sau',
  'This scenario usually continues like this',
);

export const KET_KICH_BAN: Cap = c(
  'Nếu bác nghe thấy đúng những câu này, thì bác đã có câu trả lời rồi.',
  'If you hear exactly these things, you already have your answer.',
);

export const MA_BUOC: Record<string, Cap> = {
  BAO_CO_KIEN_HANG: c('Họ thường nói có kiện hàng gửi cho bác', 'They usually say a parcel is waiting for you'),
  BAO_DOI_SO_DIEN_THOAI: c('Họ thường nói vừa đổi số điện thoại', 'They usually say they changed their phone number'),
  BAO_MAY_NHIEM_VIRUS: c('Họ thường nói máy bác nhiễm vi-rút', 'They usually say your device is infected'),
  BAO_TAI_KHOAN_CO_GIAO_DICH_LA: c('Họ thường nói tài khoản có giao dịch lạ', 'They usually say your account had an odd transaction'),
  BAT_GIU_MAY_LIEN_TUC: c('Họ thường bắt bác giữ máy, không cho tắt', 'They usually insist you stay on the line'),
  CAM_KET_LOI_NHUAN_BAO_TOAN_VON: c('Họ thường cam kết lợi nhuận và bảo toàn vốn', 'They usually guarantee profit and protected capital'),
  CAM_KE_CHO_NGUOI_NHA: c('Họ thường cấm bác kể cho người nhà', 'They usually forbid you from telling family'),
  CHO_LAM_NHIEM_VU_NHO_TRA_TIEN_THAT: c('Họ thường cho làm vài việc nhỏ và trả tiền thật', 'They usually let you do small tasks and pay you for real'),
  DAT_HAN_CHOT_RAT_GAP: c('Họ thường đặt một hạn chót rất gấp', 'They usually set a very tight deadline'),
  DOA_BAT_GIU_KHOI_TO: c('Họ thường doạ bắt giữ hoặc khởi tố', 'They usually threaten arrest or prosecution'),
  DOA_KHOA_TAI_KHOAN: c('Họ thường doạ khoá tài khoản', 'They usually threaten to lock your account'),
  DOI_CAI_UNG_DUNG_DIEU_KHIEN_TU_XA: c('Họ thường đòi bác cài ứng dụng điều khiển từ xa', 'They usually ask you to install remote-control software'),
  DOI_CAI_UNG_DUNG_THEO_DUONG_DAN: c('Họ thường đòi bác cài ứng dụng theo đường dẫn họ gửi', 'They usually ask you to install an app from their link'),
  DOI_CHIA_SE_MAN_HINH_NGAN_HANG: c('Họ thường đòi bác chia sẻ màn hình khi mở app ngân hàng', 'They usually ask you to share your screen while banking'),
  DOI_CHUYEN_SANG_TAI_KHOAN_AN_TOAN: c('Họ thường đòi bác chuyển sang một “tài khoản an toàn”', 'They usually ask you to move money to a “safe account”'),
  DOI_CHUYEN_TIEN_TAI_KHOAN_LA: c('Họ thường đòi chuyển tiền vào một tài khoản lạ', 'They usually ask for a transfer to an unfamiliar account'),
  DOI_DANG_NHAP_QUA_DUONG_DAN: c('Họ thường đòi bác đăng nhập qua đường dẫn họ gửi', 'They usually ask you to log in through their link'),
  DOI_DOC_MA_XAC_MINH: c('Họ thường đòi bác đọc mã vừa nhận được', 'They usually ask you to read out the code you just received'),
  DOI_GIAO_TIEN_MAT_TAN_NHA: c('Họ thường hẹn tới tận nhà nhận tiền mặt', 'They usually arrange to collect cash at your home'),
  DOI_MUA_THE_CAO: c('Họ thường đòi bác mua thẻ cào rồi đọc mã', 'They usually ask you to buy scratch cards and read the codes'),
  DOI_NANG_GOI_DE_TANG_HOA_HONG: c('Họ thường đòi nâng gói để tăng hoa hồng', 'They usually ask you to upgrade for higher commission'),
  DOI_NAP_LAI_VI_THAO_TAC_SAI: c('Họ thường nói bác thao tác sai và đòi nạp lại', 'They usually say you made a mistake and ask you to pay again'),
  DOI_NAP_THEM_DE_RUT_DUOC: c('Họ thường đòi nạp thêm thì mới rút được', 'They usually ask for more money before you can withdraw'),
  DOI_NAP_VON_BAN_DAU: c('Họ thường đòi nạp một khoản vốn ban đầu', 'They usually ask for an initial deposit'),
  DOI_NOP_THUE_PHI_DE_RUT: c('Họ thường đòi nộp thuế hoặc phí thì mới rút được', 'They usually ask for tax or fees before releasing money'),
  DOI_PHI_UNG_TRUOC: c('Họ thường đòi một khoản phí ứng trước', 'They usually ask for a fee up front'),
  DOI_RUT_TIEN_MAT_TAI_ATM: c('Họ thường đòi bác ra cây ATM rút tiền mặt', 'They usually ask you to withdraw cash at an ATM'),
  DOI_SO_THE_VA_MA_CVV: c('Họ thường đòi số thẻ và ba số ở mặt sau', 'They usually ask for your card number and the three digits on the back'),
  KE_CHUYEN_KHAN_CAP: c('Họ thường kể một chuyện khẩn cấp', 'They usually tell an urgent story'),
  MOI_VAO_NHOM_LOP_HOC: c('Họ thường mời bác vào một nhóm hoặc lớp học', 'They usually invite you into a group or class'),
  MOI_VIEC_NHE_LUONG_CAO: c('Họ thường mời một công việc nhẹ, lương cao', 'They usually offer easy work with high pay'),
  NHAC_LAI_VU_DA_BI_LUA: c('Họ thường nhắc lại vụ bác từng bị lừa', 'They usually bring up a scam you fell for before'),
  NHAN_MINH_LA_NGUOI_QUEN: c('Họ thường nhận mình là người quen', 'They usually claim to be someone you know'),
  NHO_QUET_MA_QR: c('Họ thường nhờ bác quét một mã QR', 'They usually ask you to scan a QR code'),
  NOI_BAC_DANG_BI_DIEU_TRA: c('Họ thường nói bác đang bị điều tra', 'They usually say you are under investigation'),
  NOI_DA_TIM_THAY_TIEN: c('Họ thường nói đã tìm thấy số tiền bác mất', 'They usually say they found the money you lost'),
  NOI_HANG_BI_GIU_O_KHO: c('Họ thường nói hàng đang bị giữ ở kho', 'They usually say the parcel is held at a depot'),
  TU_XUNG_CO_QUAN_TO_TUNG: c('Họ thường tự xưng là công an hoặc viện kiểm sát', 'They usually claim to be police or prosecutors'),
  TU_XUNG_HO_TRO_KY_THUAT: c('Họ thường tự xưng là hỗ trợ kỹ thuật', 'They usually claim to be technical support'),
  TU_XUNG_NHAN_VIEN_NGAN_HANG: c('Họ thường tự xưng là nhân viên ngân hàng', 'They usually claim to work for a bank'),
  XAY_DUNG_TINH_CAM_TU_XA: c('Họ thường xây dựng tình cảm từ xa một thời gian', 'They usually build a relationship from a distance first'),
  XIN_DUNG_KE_CHO_NGUOI_KHAC: c('Họ thường xin bác đừng kể cho ai', 'They usually ask you not to tell anyone'),
};

// ═══════════════ §2B.5 — bảo vệ 72 giờ (RECOVERY) ═══════════════
//
// Màn người dùng đọc LÚC VỪA MẤT TIỀN. §11: không hứa lấy lại được tiền — dùng
// khung "các bước làm TĂNG KHẢ NĂNG xử lý". Mã lấy từ
// `backend/src/analysis/recovery-adapters.js` — BUOC_CHUNG (9) + buocRieng
// của từng nước (VN: 3). `maBuocHopLe()` đã chặn cụm hứa hẹn ở tầng backend;
// đây chỉ là câu hiển thị, không phải hàng rào thứ hai.

export const KHUNG_PHUC_HOI: Cap = c(
  'Những bước sau làm TĂNG khả năng xử lý — không ai hứa lấy lại được tiền',
  'These steps increase the chance of a resolution — no one can promise your money back',
);

export const BUOC_PHUC_HOI: Record<string, Cap> = {
  // ── Bước chung, mọi nước ──
  ngung_moi_lien_lac_voi_ben_kia: c(
    'Ngừng mọi liên lạc với bên kia — đừng nghe máy, đừng nhắn lại',
    'Stop all contact with them — do not answer calls or reply to messages',
  ),
  khong_chuyen_them_bat_ky_khoan_nao: c(
    'Không chuyển thêm bất kỳ khoản nào nữa, dù họ nói lý do gì',
    'Do not send any more money, no matter what reason they give',
  ),
  goi_ngan_hang_bang_so_in_tren_the: c(
    'Gọi ngay ngân hàng bằng số in trên thẻ hoặc mặt sau thẻ — không dùng số họ gửi',
    'Call your bank now using the number printed on your card — not a number they sent you',
  ),
  yeu_cau_ngan_hang_ghi_nhan_tra_soat: c(
    'Yêu cầu ngân hàng ghi nhận tra soát giao dịch',
    'Ask the bank to formally log a transaction dispute',
  ),
  chup_lai_toan_bo_tin_nhan_va_bien_lai: c(
    'Chụp lại toàn bộ tin nhắn, cuộc gọi và biên lai chuyển khoản',
    'Screenshot every message, call log, and transfer receipt',
  ),
  bao_cho_mot_nguoi_than: c(
    'Báo cho một người thân biết — đừng tự mình xử lý một mình',
    'Tell a family member — do not handle this alone',
  ),
  trinh_bao_co_quan_chuc_nang_dia_phuong: c(
    'Trình báo với cơ quan chức năng ở nơi bác cư trú',
    'Report to the local authorities where you live',
  ),
  doi_mat_khau_tren_thiet_bi_khac: c(
    'Đổi mật khẩu ngân hàng và email — làm trên MỘT THIẾT BỊ KHÁC, không phải máy vừa dùng',
    'Change your banking and email passwords — do this on a DIFFERENT device, not the one you just used',
  ),
  canh_giac_voi_ben_hua_lay_lai_tien: c(
    'Cảnh giác với bất kỳ ai tự xưng có thể giúp lấy lại tiền và đòi phí trước',
    'Be wary of anyone who claims they can recover your money for an upfront fee',
  ),
  // ── Bước riêng của Việt Nam ──
  gui_don_trinh_bao_cong_an_phuong_noi_cu_tru: c(
    'Gửi đơn trình báo tại công an phường/xã nơi bác cư trú',
    'File a report at the local police station where you live',
  ),
  yeu_cau_ngan_hang_phong_toa_tai_khoan_nhan: c(
    'Yêu cầu ngân hàng phong toả tài khoản đã NHẬN tiền của bác — gọi hotline của NGÂN HÀNG ĐÓ, không phải ngân hàng của bác',
    'Ask for the RECEIVING account to be frozen — call that bank\'s hotline, not your own bank',
  ),
  to_giac_qua_vneid_5_buoc: c(
    'Tố giác qua VNeID: mục Kiến nghị, phản ánh về an ninh trật tự — có thể theo dõi tiến độ xử lý',
    'Report via the VNeID app\'s security feedback section — you can track how it is being handled',
  ),
};

export const CANH_BAO_PHUC_HOI: Record<string, Cap> = {
  chua_biet_nguoi_dung_o_nuoc_nao: c(
    'Chưa biết bác đang ở nước nào, nên chỉ hiện được các bước chung',
    'We do not yet know which country you are in, so only the general steps are shown',
  ),
  nuoc_chua_duoc_duyet_chi_co_buoc_chung: c(
    'Nước này chưa có bước riêng đã kiểm chứng, chỉ hiện các bước chung',
    'This country has no verified local steps yet — only the general steps are shown',
  ),
  chua_xac_minh_duoc_so_tong_dai_dung_so_in_sau_the: c(
    'Khoan Đã chưa xác minh được số tổng đài nào — bác tự lấy số ở mặt sau thẻ ngân hàng',
    'Khoan Đã has not verified any hotline number — please use the number on the back of your bank card',
  ),
  danh_ba_chua_co_muc_nao_duoc_duyet: c(
    'Sổ danh bạ tổ chức đã xác minh hiện chưa có mục nào',
    'The verified organization directory currently has no entries',
  ),
};

// ═══════════════ Khoan Proof ═══════════════
//
// ⚠️ §11 — CHỈ NÓI AI ĐÃ KÝ. Tuyệt đối không nói yêu cầu tốt hay xấu.
// Tài khoản người con vẫn có thể bị chiếm quyền, VÀ dạng lạm dụng tài chính
// người cao tuổi phổ biến nhất là do NGƯỜI TRONG NHÀ gây ra — nên một chữ ký
// hợp lệ KHÔNG chứng minh yêu cầu là chính đáng.
//
// ❌ "Giao dịch an toàn"  ❌ "Yêu cầu này hợp lệ"  ❌ "Đã xác minh là người thân"

export const KET_QUA_PROOF: Record<string, Cap> = {
  YEU_CAU_DA_DUOC_KY_BOI_TAI_KHOAN: c(
    'Yêu cầu đã được ký bởi tài khoản của {ten}',
    'The request was signed by {ten}’s account',
  ),
  TAI_KHOAN_DA_KY_TU_CHOI_YEU_CAU: c(
    'Tài khoản của {ten} đã ký từ chối yêu cầu này',
    '{ten}’s account signed a refusal of this request',
  ),
  DANG_CHO_TAI_KHOAN_KIA_KY: c(
    'Đang chờ {ten} ký',
    'Waiting for {ten} to sign',
  ),
  CHUA_LIEN_LAC_DUOC_NGUOI_THAN: c(
    'Đã hỏi {ten} nhưng chưa nhận được trả lời',
    '{ten} was asked but has not replied',
  ),
  chua_thay_yeu_cau_da_xac_thuc: c(
    'Khoan Đã chưa tìm thấy yêu cầu đã xác thực từ {ten}.',
    'Khoan Đã has not found a verified request from {ten}.',
  ),
  TOI_ON_KHONG_CO_GI_NGUY_HIEM: c(
    'Tôi ổn, không có gì nguy hiểm',
    'I’m fine, nothing dangerous here',
  ),
};

/**
 * ⚠️ CÂU PHẢI ĐI KÈM khi hiện "chưa tìm thấy yêu cầu đã xác thực".
 * Không có câu này thì người dùng đọc "chưa tìm thấy" thành "người kia không hề
 * gửi" — mà app KHÔNG BIẾT điều đó. Ở đời thật hầu như không ai dùng tính năng
 * này, nên câu trên bật cả với yêu cầu THẬT.
 */
export const GHI_CHU_CHUA_THAY_YEU_CAU: Cap = c(
  'Hầu như chưa ai dùng tính năng này, nên điều đó là bình thường. '
  + 'Đây là một lý do để dừng lại hỏi kỹ, không phải một kết luận.',
  'Almost nobody uses this feature yet, so that is normal. '
  + 'It is a reason to pause and check, not a conclusion.',
);

export const CUM_TU: Record<string, Cap> = {
  LA_TIM: c('Lá Tím', 'Purple Leaf'),
  NUI_XANH: c('Núi Xanh', 'Green Mountain'),
  SONG_HONG: c('Sông Hồng', 'Red River'),
  MUA_HA: c('Mùa Hạ', 'Summer'),
  TRE_LANG: c('Tre Làng', 'Village Bamboo'),
  CAU_VONG: c('Cầu Vồng', 'Rainbow'),
  BIEN_LAN: c('Biển Lặng', 'Calm Sea'),
  DEN_LONG: c('Đèn Lồng', 'Lantern'),
  GIENG_KHOI: c('Giếng Khơi', 'Deep Well'),
  CANH_DIEU: c('Cánh Diều', 'Kite'),
  HOA_SEN: c('Hoa Sen', 'Lotus'),
  MAI_NGOI: c('Mái Ngói', 'Tiled Roof'),
  CHIM_SE: c('Chim Sẻ', 'Sparrow'),
  BEN_DO: c('Bến Đò', 'Ferry Landing'),
  GIO_MUA: c('Gió Mùa', 'Monsoon'),
  TRANG_RAM: c('Trăng Rằm', 'Full Moon'),
};

// ═══════════════ Lối ra — §4.6 ═══════════════
//
// ⚠️ Mức PROTECTED_CRITICAL bỏ hết điều hướng, NHƯNG LUÔN PHẢI CÓ dòng
// "Tôi ổn, không có gì nguy hiểm" ở cuối màn hình. Nếu bộ luật báo động giả,
// người dùng bị kẹt trong màn khẩn cấp sẽ hoảng và gỡ ứng dụng.

export const MA_LOI_RA: Record<string, Cap> = {
  quay_lai_trang_chu: c('Quay lại trang chủ', 'Back to home'),
  toi_on_khong_co_gi_nguy_hiem: c('Tôi ổn, không có gì nguy hiểm', 'I’m fine, nothing dangerous here'),
};

// ═══════════════ Tài khoản ═══════════════
//
// ⚠️ §11 — KHÔNG CÂU NÀO TRÁCH NGƯỜI DÙNG. "Bác nhập sai rồi" là trách; "cháu
// chưa tìm thấy" là nói việc. Người đọc những câu này thường đang vội, và với
// người cao tuổi thì một câu trách làm họ bỏ luôn, không thử lại.
//
// ⚠️ VÀ KHÔNG CÂU NÀO ĐƯỢC NÓI SỐ ĐÓ CÓ TỒN TẠI HAY KHÔNG. Máy chủ cố ý gộp
// "chưa đăng ký" với "sai mật khẩu" thành một mã duy nhất, vì phân biệt hai ca
// là dựng sẵn một máy dò xem số nào đang dùng Khoan Đã — danh sách người cao
// tuổi quan tâm tới lừa đảo là thứ kẻ lừa đảo rất muốn có. Chữ ở đây phải giữ
// nguyên sự mập mờ đó, đừng "cho rõ ràng hơn".

export const MA_TAI_KHOAN: Record<string, Cap> = {
  SAI_SO_HOAC_MAT_KHAU: c(
    'Số điện thoại hoặc mật khẩu chưa đúng. Bác thử lại nhé.',
    'That phone number or password is not right. Please try again.',
  ),
  SO_DA_DUOC_DANG_KY: c(
    'Số này đã có tài khoản rồi. Bác bấm "Tôi đã có tài khoản" để vào.',
    'This number already has an account. Tap “I already have an account”.',
  ),
  MAT_KHAU_QUA_NGAN: c(
    'Mật khẩu cần ít nhất 6 ký tự.',
    'The password needs at least 6 characters.',
  ),
  SO_KHONG_HOP_LE: c(
    'Số điện thoại chưa đúng dạng. Bác xem lại giúp cháu.',
    'That phone number does not look right. Please check it.',
  ),
  THIEU_THONG_TIN: c(
    'Bác điền giúp cháu đủ các ô nhé.',
    'Please fill in all the fields.',
  ),
  /**
   * ⚠️ CÂU NÀY PHẢI NÓI RÕ LÀ CHỜ, KHÔNG PHẢI SAI.
   * Nó xuất hiện sau vài lần gõ nhầm, tức người đọc đang bắt đầu lo là mình
   * quên mật khẩu. Nói "chờ mấy giây" thì bác chờ; nói "có lỗi" thì bác bỏ.
   */
  THU_LAI_SAU: c(
    'Bác thử hơi nhanh. Chờ một chút rồi bấm lại giúp cháu.',
    'That was a bit quick. Please wait a moment and try again.',
  ),
  CHUA_DANG_NHAP: c(
    'Phiên đăng nhập đã hết hạn. Bác đăng nhập lại nhé.',
    'Your session has expired. Please sign in again.',
  ),
  KHONG_GOI_DUOC: c(
    'Chưa nối được với máy chủ. Bác kiểm tra mạng rồi thử lại.',
    'Could not reach the server. Please check your connection and try again.',
  ),
};

// ═══════════════ Nhắc cuộc gọi dài ═══════════════
//
// ⚠️ APP KHÔNG BIẾT AI ĐANG GỌI, NÊN KHÔNG CÂU NÀO ĐƯỢC NÓI VỀ NGƯỜI GỌI.
//
// Cố ý không xin `READ_CALL_LOG` (xem `TheoDoiCuocGoi.java`), nên thứ duy nhất
// app biết là: máy đang trong một cuộc gọi, và nó đã kéo dài 25 phút. Không số,
// không danh bạ, không biết đó là con gái hay kẻ lừa đảo.
//
// Vì vậy mọi câu ở đây chỉ được nói về THỜI LƯỢNG và hỏi về YÊU CẦU. Một câu
// như "người này có thể đang lừa bác" là bịa ra một điều app không hề đo được —
// và nếu người bên kia là con gái bác thật, đó là một lời vu cho người nhà (§11).
//
// ⚠️ CÂU HỎI, KHÔNG PHẢI CẢNH BÁO. Bác đang nghe điện thoại; một dòng đỏ báo
// nguy hiểm giữa cuộc gọi với con là cách nhanh nhất để bác tắt tính năng này.

export const NHAC_CUOC_GOI: Record<string, Cap> = {
  tieu_de: c(
    'Cuộc gọi này đã lâu rồi',
    'This call has been going a while',
  ),
  /**
   * ⚠️ HAI CÂU HỎI, KHÔNG CÓ CÂU KHẲNG ĐỊNH NÀO.
   * Đây là toàn bộ thứ app được phép nói ở đây: nhắc bác tự nhìn lại yêu cầu
   * mình đang nhận, chứ không phán về người đang nói chuyện với bác.
   */
  noi_dung: c(
    'Bác có đang được yêu cầu chuyển tiền, đọc mã, hay cài ứng dụng nào không? Nếu có, khoan đã — hỏi cháu một câu trước.',
    'Are you being asked to transfer money, read out a code, or install an app? If so, wait — check with me first.',
  ),
  nut_mo: c('Hỏi cháu', 'Ask me'),
  nut_on: c('Tôi ổn, tắt đi', 'I’m fine, dismiss'),
};

// ═══════════════ Trạng thái máy — §11, nói về sự việc, không kết tội ═══════════════
//
// ⚠️ KHÔNG CÂU NÀO ĐƯỢC GỌI MỘT ỨNG DỤNG LÀ "ĐỘC HẠI" (§11).
// App đọc được đúng ba điều: tên, có phải cài sẵn không, cài từ đâu. Từ ba điều
// đó tới kết luận "đây là phần mềm gián điệp" là một bước nhảy mà không dữ liệu
// nào ở đây đỡ được — và nếu đoán sai, bác gỡ mất một ứng dụng mình cần.
//
// Nói SỰ VIỆC ("ứng dụng này xem và bấm được thay bác") và nói HOÀN CẢNH ("kẻ
// lừa đảo hay bảo bác cài rồi bấm cho phép"), rồi để bác quyết.

export const TRANG_THAI_MAY: Record<string, Cap> = {
  tieu_de: c(
    'Có ứng dụng đang xem và bấm được thay bác',
    'An app can see and tap for you',
  ),
  giai_thich: c(
    'Kẻ lừa đảo thường bảo bác cài một ứng dụng rồi bấm cho phép. Nếu bác không nhớ đã cài cái này, nên tắt nó đi.',
    'Scammers often ask you to install an app and grant it permission. If you do not remember installing this, turn it off.',
  ),
  nut_cai_dat: c('Mở Cài đặt để tắt', 'Open settings to turn it off'),
  nut_tu_cai: c('Cái này tôi tự cài', 'I installed this myself'),

  /** §11 — tên chế độ tối giản. KHÔNG gọi là "Safe mode" hay "An toàn". */
  che_do_toi_gian: c('Chế độ tối giản', 'Minimalist mode'),
  che_do_toi_gian_mo_ta: c(
    'Chỉ thấy kiểm tra, gia đình, dừng 60s',
    'Only check, family, and pause for 60s'
  ),
  che_do_toi_gian_aria: c('Bật/Tắt chế độ tối giản', 'Toggle minimalist mode'),

  /*
   * ⚠️ §4.1 — NHÃN ĐIỀU KHIỂN CÀI ĐẶT. Tiếng Việt dài hơn tiếng Anh ~30%
   * nên phải giữ chữ ngắn, và dùng cùng một từ cho cùng một khái niệm ở mọi
   * chỗ. Đổi "Ngôn ngữ" thành "Language" mà quên đổi ở chỗ khác là vỡ phép
   * liên tục giữa các màn.
   */
  nhan_cai_dat: c('Cài đặt', 'Settings'),
  nhan_co_chu: c('Cỡ chữ', 'Text size'),
  nhan_nho: c('Nhỏ', 'Small'),
  nhan_vua: c('Vừa', 'Medium'),
  nhan_lon: c('Lớn', 'Large'),
  nhan_ngon_ngu: c('Ngôn ngữ', 'Language'),
  nhan_tieng_viet: c('Tiếng Việt', 'Tiếng Việt'),
  nhan_english: c('English', 'English'),

  // Nguồn cài — nói đúng cái đọc được, không suy diễn thêm.
  tu_tep: c('cài từ một tệp, không qua chợ ứng dụng', 'installed from a file, not from an app store'),
  khong_ro: c('không rõ cài từ đâu', 'unknown where it came from'),
  vua_cai: c('vừa cài trong tuần này', 'installed this week'),
};

// ═══════════════ Chữ cho lớp native của bản APK ═══════════════
//
// ⚠️ §11 — LỚP JAVA KHÔNG ĐƯỢC TỰ SOẠN CÂU NÀO.
// `KhoanDaPlugin.hienPopup` và `hienCanhBaoHeadsUp` đều TỪ CHỐI chạy nếu tầng
// web không truyền chữ xuống. Chữ phải đi qua đây để đổi ngôn ngữ là đổi được
// cả popup đè màn hình lẫn thông báo — chứ không phải một nửa app nói tiếng
// Việt còn nửa kia mắc kẹt ở chuỗi mã cứng trong Java.
//
// ⚠️ KHÔNG CÂU NÀO ĐƯỢC BUỘC TỘI MỘT NGƯỜI CỤ THỂ (§11). Popup hiện đè lên màn
// hình lúc bác đang nghe điện thoại — đúng lúc dễ hiểu nhầm thành "app nói
// người này là kẻ lừa đảo". Nói về YÊU CẦU, không nói về người.

export const CHU_NATIVE: Record<string, Cap> = {
  /** Tiêu đề dải popup đè màn hình. Ngắn — nó nằm trên một dải hẹp. */
  popup_tieu_de: c('Khoan đã — hãy dừng lại 60 giây', 'Wait — pause for 60 seconds'),
  /** Nút mở app từ popup. */
  popup_nut_mo: c('Mở Khoan Đã', 'Open Khoan Đã'),
  /**
   * ⚠️ LỐI RA CỦA §4.6, VÀ NÓ QUAN TRỌNG HƠN Ở ĐÂY SO VỚI TRONG APP.
   * Popup này đè lên mọi thứ. Không có nút tắt thì một lần báo động giả là bác
   * bị một dải chữ đỏ che màn hình giữa lúc đang nghe điện thoại thật —
   * `hienPopup` từ chối chạy nếu thiếu chuỗi này, và đó là chủ ý.
   */
  popup_nut_on: c('Tôi ổn, tắt đi', 'I’m fine, dismiss'),

  /** Tiêu đề thông báo heads-up khi mức CAO. */
  heads_up_tieu_de: c('Khoan Đã: hãy dừng lại 60 giây', 'Khoan Đã: pause for 60 seconds'),
  /**
   * ⚠️ NÓI VỀ YÊU CẦU, KHÔNG NÓI VỀ NGƯỜI GỌI (§11).
   * Không "người này đang lừa bác" — hệ thống không biết người kia là ai.
   */
  heads_up_noi_dung: c(
    'Yêu cầu bác vừa nhận có dấu hiệu thường gặp trong các vụ lừa đảo. Chạm để xem.',
    'What you were just asked shows signals commonly seen in scams. Tap to see.',
  ),
};

// ═══════════════ Lỗi ═══════════════

export const MA_LOI: Record<string, Cap> = {
  MAT_KET_NOI: c(
    'Không kết nối được máy chủ. Khoan Đã chưa kiểm được lượt này.',
    'Could not reach the server. Khoan Đã could not check this one.',
  ),
  INPUT_TOO_LONG: c('Nội dung quá dài', 'The content is too long'),
  FILE_TOO_LARGE: c('Tệp quá lớn', 'The file is too large'),
  THIEU_DAU_VAO: c('Bác chưa nhập nội dung nào', 'You have not entered anything yet'),
  JSON_KHONG_HOP_LE: c('Dữ liệu gửi lên không hợp lệ', 'The data sent was not valid'),
  RATE_LIMITED: c('Bác vừa kiểm hơi nhiều, chờ một chút nhé', 'A few too many checks — please wait a moment'),
  LOI_MAY_CHU: c('Máy chủ đang gặp sự cố', 'The server hit a problem'),
  CHUA_DANG_NHAP: c('Cần đăng nhập để dùng phần này', 'You need to sign in for this'),
  THIET_BI_KHONG_HO_TRO_PASSKEY: c(
    'Thiết bị hoặc trình duyệt này chưa dùng được passkey',
    'This device or browser cannot use passkeys',
  ),
  NGUOI_DUNG_HUY: c('Đã huỷ', 'Cancelled'),
  NGUOI_KY_KHONG_TRONG_VONG_GHEP: c(
    'Tài khoản này chưa được ghép vào vòng tròn gia đình',
    'This account is not paired into the family circle',
  ),
  MA_GHEP_SAI_DINH_DANG: c('Mã ghép phải là 6 chữ số', 'The pairing code must be 6 digits'),
  MA_SAI: c('Mã ghép không đúng', 'The pairing code is wrong'),
  MA_HET_HAN: c('Mã ghép đã hết hạn', 'The pairing code has expired'),
  MA_DA_DUNG_ROI: c('Mã ghép đã dùng rồi', 'The pairing code was already used'),
  YEU_CAU_HET_HAN: c('Yêu cầu đã hết hạn', 'The request has expired'),
  NONCE_DA_DUNG: c('Yêu cầu này đã được ký rồi', 'This request was already signed'),
  CHU_KY_KHONG_HOP_LE: c('Chữ ký không hợp lệ', 'The signature is not valid'),
  CHUA_DANG_KY_PASSKEY: c('Tài khoản chưa đăng ký passkey', 'This account has no passkey yet'),
};

// ═══════════════ Tra cứu ═══════════════

/**
 * ⚠️ THIẾU MÃ THÌ TRẢ VỀ `null`, KHÔNG trả về chính cái mã.
 *
 * Trả về mã trần nghĩa là người dùng nhìn thấy `FIN_ORG_CLAIM_PERSONAL_ACCOUNT`
 * giữa màn hình — và không ai phát hiện ra vì màn hình vẫn có chữ. Trả `null`
 * để chỗ gọi phải quyết định làm gì, và để `catalog.test.ts` bắt được.
 */
export function tra(bang: Record<string, Cap>, ma: string, lang: Lang): string | null {
  const m = bang[ma];
  return m ? m[lang] : null;
}

/** Danh sách mã dịch được, bỏ qua mã lạ. Dùng cho maLyDo / chuaKiem / daKiem. */
export function traNhieu(bang: Record<string, Cap>, ma: string[], lang: Lang): string[] {
  return ma.map((m) => tra(bang, m, lang)).filter((x): x is string => x !== null);
}

/** "LA_TIM 47" → "Lá Tím 47". Cụm từ là thứ ĐỂ HIỆN, không phải bí mật. */
export function traCumTu(cum: string | undefined, lang: Lang): string | null {
  if (!cum) return null;
  const [tu, so] = cum.split(' ');
  // Chuỗi rỗng hoặc chỉ có khoảng trắng cho `tu === undefined` — trả `null`,
  // đừng tra một khoá không tồn tại rồi hiện ra mã trần.
  if (!tu) return null;
  const nhan = tra(CUM_TU, tu, lang);
  return nhan ? `${nhan} ${so ?? ''}`.trim() : null;
}
