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
      /**
       * Ca `ld-ngan-hang-gia-01` và `-02` (bộ 100): "Dang nhap ngay tai
       * tcb-verify.info va NHAP MAT KHAU cung ma OTP de mo khoa" — chỉ bật
       * ID_BANK_IMPERSONATION + MAN_URGENCY = 17đ, dưới ngưỡng 20. Một trang
       * ngân hàng giả đòi mật khẩu mà ra CHUA_THAY.
       *
       * Mẫu cũ đòi chữ "đăng nhập" ĐỨNG TRƯỚC "ngân hàng/tài khoản"; tin thật
       * viết "đăng nhập tại <link> và nhập mật khẩu" — hai vế đảo nhau.
       */
      { pattern: '(nhập|điền|cung cấp)[^.]{0,24}(mật khẩu|password|mã pin|số thẻ)', scope: 'action' },
      { pattern: '(đăng nhập|truy cập)[^.]{0,40}(xác minh|xác thực|mở khoá|mở khóa|cập nhật)[^.]{0,24}(tài khoản|mật khẩu)', scope: 'action' },
    ],
    FIN_TRANSFER_REQUEST: [
      { pattern: 'chuyển\\b[^.]{0,40}(tiền|triệu|đồng|khoản|vào tài khoản|sang tài khoản)', scope: 'action' },
      { pattern: '\\bchuyển khoản\\b', scope: 'action' },
      { pattern: '\\b(nộp|gửi)\\b[^.]{0,24}(tiền|triệu|đồng)\\b', scope: 'action' },
      /**
       * ⚠️ BỐN ĐỘNG TỪ "ĐƯA TIỀN VÀO" CÒN THIẾU — vá 15/8/2026.
       *
       * Đo được trong 23 ca `CAO → CHUA_THAY`: ba mẫu dưới đây ra ĐÚNG 0 ĐIỂM
       * vì cue bank chỉ có `chuyển` / `nộp` / `gửi`:
       *   "cô nạp 50 triệu vốn ban đầu"
       *   "bác đặt cọc 1.200.000đ tiền nguyên liệu"
       *   "chị nạp 8 triệu nâng gói"
       * Tiếng Việt gọi việc đưa tiền bằng nhiều động từ khác nhau tuỳ bối cảnh
       * (nạp cho ví/ứng dụng, đóng cho tổ chức, đặt cọc cho hợp đồng). Thiếu
       * một động từ là thiếu cả một họ kịch bản.
       *
       * ⚠️ KHÔNG có `đóng` ở đây, dù nó cũng là "đưa tiền". Đo được: "Mẹ nhớ
       * ĐÓNG TIỀN bảo hiểm y tế trước ngày 30 nhé" — tin nhắn con nhắc mẹ, nhãn
       * CHUA_THAY, trần CHUA_THAY — bị đẩy lên NGHI_NGO. `đóng tiền học`,
       * `đóng tiền điện`, `đóng tiền bảo hiểm` là tiếng Việt đời thường.
       * `đóng` chỉ được dùng ở OFF_ADVANCE_FEE, nơi có thêm ràng buộc `phí …
       * trước`. Rộng thêm một động từ mà mất một mẫu lành là lỗ vốn.
       *
       * ⚠️ KHÔNG `\b` cạnh `đ` — `đ` không phải ký tự chữ trong JavaScript.
       */
      { pattern: '(nạp|đặt cọc|góp vốn)[^.]{0,24}(tiền|triệu|đồng|vốn|nghìn)', scope: 'action' },
      /**
       * ĐỘNG TỪ + MỘT SỐ TIỀN CỤ THỂ. Trục phân biệt không phải là từ khoá mà là
       * HÌNH DẠNG: nói ra một con số là đang đòi đúng số đó.
       *   "Cô chuyển 6.500.000đ vào số 9999 8888 7777"  → bắt
       *   "đóng 70 triệu đồng phí thông quan"           → bắt
       *   "Mẹ nhớ đóng tiền bảo hiểm y tế"              → BỎ QUA (không có số)
       * Nhờ vậy `đóng` dùng lại được mà không đụng vào tin nhắn hoá đơn đời thường.
       *
       * ⚠️ KHÔNG có `ứng` trong danh sách động từ: "tạm ứng 8 triệu" là từ chuẩn
       * của bệnh viện, và đã đo được nó đẩy một tin nhắn con gái thật lên CAO.
       * ⚠️ `(?![a-zà-ỹ])` thay cho `\b` — `đ` không phải ký tự chữ trong JavaScript.
       */
      { pattern: '(chuyển|nạp|đóng|nộp|gửi)\\s+\\d+\\s*(đ|k|tr|triệu|đồng|nghìn|tỷ|tỉ)(?![a-zà-ỹ])', scope: 'action' },
      /**
       * ⚠️ "STK" LÀ CÁCH VIẾT PHỔ BIẾN NHẤT, VÀ TRƯỚC ĐÂY KHÔNG CÓ MẪU NÀO.
       *
       * Đo trên bộ 100 (19/8/2026): "Bo chuyen vao stk nay giup con" chỉ bật
       * MAN_URGENCY, không bật FIN_TRANSFER_REQUEST — nên một tin giả danh con
       * xin tiền ra CHUA_THAY. Bốn mẫu trên đều đòi chữ "tiền/triệu/đồng" hoặc
       * cụm "vào tài khoản" viết đủ; tin nhắn thật viết tắt "stk", "tk".
       */
      { pattern: '(chuyển|gửi|nạp|nộp)[^.]{0,26}(vào|qua|tới|đến)\\s*(stk|tk|số tài khoản|tài khoản)\\b', scope: 'action' },
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
      /**
       * Đo trên bộ 100: "tai ung dung Ultraview roi cho toi ma de toi ho tro
       * tu xa" — KHÔNG bật tín hiệu nào. `ultraviewer` có trong danh sách
       * nhưng người ta viết "Ultraview" (thiếu "er"), và "hỗ trợ từ xa" thì
       * chưa có mẫu. Kẻ lừa đảo không đọc chính tả tên phần mềm.
       */
      { pattern: '\\b(ultraview|teamview|any ?desk|quick ?support|rustdesk)\\w*\\b', scope: 'any' },
      { pattern: '(hỗ trợ|thao tác|làm giúp|cài giúp)[^.]{0,16}từ xa', scope: 'action' },
      { pattern: '(cho|đọc|gửi)[^.]{0,14}(mã|id)[^.]{0,20}(để|cho)[^.]{0,14}(tôi|em|anh|mình)[^.]{0,20}(vào|truy cập|hỗ trợ|điều khiển)', scope: 'action' },
    ],
    DEV_INSTALL_APK_UNKNOWN: [
      /**
       * ⚠️ NHIỀU CÁCH NÓI "LẤY APP TỪ LINK", KHÔNG CHỈ "QUA LINK" — MỞ 19/8/2026.
       *
       * Bản trước chỉ nhận `qua (đường )?link`. Đo được trên ca
       * `gia-danh-dien-luc`: "Vui long TAI UNG DUNG TAI LINK evn-thanhtoan.xyz"
       * — tầng luật không bật một tín hiệu nào, nhãn ra CHUA_THAY.
       *
       * Cùng nội dung viết bằng tiếng Anh ("install our support app from this
       * link") thì pack en-US bắt được ngay. Cùng một vụ lừa, hai ngôn ngữ hai
       * kết quả — đó là lỗ, không phải khác biệt văn hoá.
       *
       * Người Việt nói "tải tại link", "tải ở link", "tải theo đường link",
       * "vào link tải" — `qua` chỉ là một trong nhiều giới từ.
       */
      { pattern: '(cài|tải)\\b[^.]{0,44}(dịch vụ công|(qua|tại|từ|theo|ở|vào)\\s*(đường\\s*)?link|đường link|link\\s*(bên )?dưới|file apk|\\bapk\\b|đường dẫn (tôi|em|anh) gửi)', scope: 'action' },
      /**
       * Ngược lại: "vào link … tải/cài" — động từ đứng SAU. Không có mẫu này
       * thì nửa số cách đặt câu vẫn lọt.
       */
      { pattern: '(vào|bấm|nhấn|truy cập)\\s*(đường\\s*)?link[^.]{0,40}(tải|cài)\\b', scope: 'action' },
      /**
       * Ca `ld-app-gia-02`: "bac CAI FILE APK toi vua gui QUA ZALO". Mẫu đầu có
       * `file apk` trong nhóm chọn, nhưng cả nhóm nằm sau `[^.]{0,44}` tính từ
       * "cài" — mà ở đây "cài" và "file apk" liền nhau nên phải khớp. Đo lại
       * thì trượt vì đoạn này không được xếp vào scope `action`.
       *
       * Nới scope thành `any` cho ĐÚNG hai dấu hiệu cứng nhất — tệp apk và
       * đường dẫn gửi qua ứng dụng nhắn tin. Hai thứ này không xuất hiện trong
       * hội thoại bình thường của người cao tuổi.
       */
      { pattern: '\\b(file\\s*)?apk\\b', scope: 'any' },
      { pattern: '(cài|tải)[^.]{0,30}(tôi|em|anh|mình)\\s*(vừa\\s*)?gửi[^.]{0,20}(qua|trên)\\s*(zalo|messenger|viber|telegram|tin nhắn)', scope: 'any' },
    ],
    DEV_SCREEN_SHARE_BANKING: [
      { pattern: '(chia sẻ|bật)\\b[^.]{0,16}màn hình\\b[^.]{0,48}(ngân hàng|banking|tài khoản)', scope: 'action' },
      { pattern: 'chia sẻ màn hình\\b[^.]{0,44}(app|ứng dụng)\\s+ngân hàng', scope: 'action' },
    ],
    /**
     * ⚠️ MÃ USSD CHUYỂN HƯỚNG CUỘC GỌI — THÊM 2/9/2026.
     *
     * `DEV_CALL_FORWARD` có trong registry (trọng số 18) từ đầu nhưng pack
     * tiếng Việt KHÔNG có mẫu nào, nên nó chỉ bật được khi tầng AI tình cờ nhận
     * ra. Mất mạng hoặc AI chết là thủ đoạn này vô hình — trong khi nó là thủ
     * đoạn ÍT ĐỂ LẠI DẤU NHẤT: không link để quét, không app để kiểm, không
     * tệp để đọc. Nạn nhân tự bấm một dãy số trên bàn phím máy mình.
     *
     * Hậu quả: MỌI cuộc gọi tới — kể cả cuộc gọi tự động đọc mã xác thực của
     * ngân hàng — chuyển thẳng sang máy kẻ gian, còn máy nạn nhân im lặng.
     *
     * Vì sao mẫu này an toàn để bắt xác định: đây là CHUỖI KÝ TỰ CỐ ĐỊNH do
     * chuẩn GSM quy định, không có cách diễn đạt vòng vo. `*21*` là chuyển
     * hướng vô điều kiện, `*67*`/`*61*`/`*62*` là chuyển khi bận/không nghe.
     * Không người dùng bình thường nào tự nhiên gõ dãy này theo lời người lạ.
     *
     * `scope: 'any'` — không đòi câu phải ở thể mệnh lệnh. Một tin nhắn chỉ
     * chứa trần trụi dãy mã cũng phải bị bắt.
     */
    DEV_CALL_FORWARD: [
      { pattern: '\\*{1,2}\\s*(21|61|62|67)\\s*\\*\\s*[+0-9][0-9\\s.-]{6,}#', scope: 'any' },
      { pattern: '(bấm|nhấn|gõ|nhập)\\b[^.]{0,30}(\\*{1,2}\\s*(21|61|62|67)\\s*\\*|##\\s*(21|61|62|67))', scope: 'any' },
      { pattern: '(chuyển hướng|chuyển tiếp)\\b[^.]{0,20}cuộc gọi', scope: 'any' },
    ],
    /**
     * ⚠️ HAI GIỌNG, KHÔNG PHẢI MỘT — ĐO ĐƯỢC 16/8/2026.
     *
     * Ba mẫu đầu viết theo GIỌNG KẺ LỪA ĐẢO: "tôi là công an…". Chúng đúng cho
     * tin nhắn bác DÁN VÀO.
     *
     * Nhưng trang chủ ghi "Hãy kể tình huống của Bác" — app MỜI BÁC KỂ LẠI. Và
     * người kể lại thì nói ở ngôi thứ ba: "công an gọi báo tôi dính án, phải
     * chuyển tiền cho họ". Câu đó không khớp mẫu nào, nên nó ra 14 điểm và
     * CHUA_THAY — một kịch bản giả danh công an kinh điển đi lọt.
     *
     * Đây là lệch giữa CÁCH SẢN PHẨM MỜI NGƯỜI DÙNG NÓI và CÁCH TẦNG LUẬT NGHE.
     * Thêm mẫu tường thuật là vá đúng chỗ lệch đó.
     *
     * ⚠️ §4.2 — chỉ ĐƯỢC THÊM tín hiệu, không gỡ mẫu nào. Và mẫu tường thuật
     * một mình KHÔNG đủ để báo động: nó phải đi cùng yêu cầu chuyển tiền hay
     * doạ dẫm mới vượt ngưỡng. Một cuộc gọi thật từ công an, kể lại mà không
     * kèm đòi tiền, vẫn ra CHUA_THAY.
     */
    ID_AUTHORITY_IMPERSONATION: [
      // ── Giọng kẻ lừa đảo (tin nhắn dán vào) ──
      // ⚠️ B.4: phải có CẢ "công an" LẪN "cảnh sát".
      { pattern: '(tôi là|đây là|mình là)[^.]{0,30}(công an|cảnh sát|điều tra viên|viện kiểm sát|toà án|cán bộ)', scope: 'any' },
      { pattern: '(công an|cảnh sát)\\s+(phường|quận|huyện|tỉnh|thành phố)', scope: 'any' },
      { pattern: '\\b(bộ công an|cục cảnh sát|c06)\\b', scope: 'any' },

      /*
       * ── Giọng người kể lại (bác tự gõ vào ô "kể tình huống") ──
       *
       * ⚠️ CHẶN PHỦ ĐỊNH NẰM GIỮA HAI VẾ — TEST C.6.2 BẮT ĐƯỢC 16/8/2026.
       *
       * Bản đầu là `(công an|…)[^.]{0,26}(gọi|yêu cầu|…)`. Nó khớp luôn câu
       * KHUYẾN CÁO "Công an KHÔNG BAO GIỜ yêu cầu chuyển tiền" — biến một câu
       * dạy người ta cảnh giác thành một tín hiệu giả danh.
       *
       * Hàng rào `laPhuDinh` không cứu được: nó chỉ nhìn 16 ký tự TRƯỚC chỗ
       * khớp, mà chỗ khớp bắt đầu ở "công an" — phủ định nằm SAU đó.
       *
       * `(?:(?!không|chẳng|đừng|chớ)[^.]){0,26}` là "tối đa 26 ký tự, nhưng
       * không được trườn qua một từ phủ định nào".
       */
      { pattern: '(công an|cảnh sát|điều tra viên|viện kiểm sát|toà án)(?:(?!không|chẳng|đừng|chớ)[^.]){0,26}(gọi|gọi điện|nhắn|báo|yêu cầu|thông báo|bảo)', scope: 'any' },
      { pattern: '(gọi|nhắn|điện)(?:(?!không|chẳng)[^.]){0,18}(từ|của|xưng là|tự xưng)[^.]{0,12}(công an|cảnh sát|viện kiểm sát|toà án)', scope: 'any' },
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
    /**
     * ⚠️ ĐÂY LÀ KỊCH BẢN LỪA ĐẢO PHỔ BIẾN NHẤT VIỆT NAM, VÀ NÓ TỪNG CHỈ CÓ
     * ĐÚNG MỘT MẪU. Người dùng báo 16/8/2026:
     *
     *     "Mẹ ơi con đổi số mới, mẹ chuyển cho con 20 triệu"   → 14 điểm, CHUA_THAY
     *     "con gái tôi bên nước ngoài bảo gửi tiền"            → 14 điểm, CHUA_THAY
     *
     * Mẫu cũ đòi cấu trúc quá cứng: `(con|cháu|em)\s+(gái|trai)?\s*(nhờ|bảo)`.
     * Chỉ cần chen "tôi bên nước ngoài" vào giữa là trượt, vì `\s*` không cho
     * chữ nào ở đó.
     *
     * Và thiếu hẳn DẤU HIỆU ĐỊNH DANH của họ kịch bản này: **"đổi số mới"**.
     * Toàn bộ mưu mẹo nằm ở chỗ đó — kẻ lừa đảo phải giải thích vì sao tin nhắn
     * đến từ một số lạ, nên gần như lần nào chúng cũng tự khai ra.
     *
     * ⚠️ MỖI MẪU Ở ĐÂY CHỈ ĐƯỢC 8 ĐIỂM, KHÔNG TỰ ĐỦ ĐỂ BÁO ĐỘNG.
     * Ngưỡng là 20. "Con gái tôi bên nước ngoài" một mình = 8 điểm = CHUA_THAY,
     * đúng như nó phải thế — đó là một câu bình thường. Chỉ khi ĐI CÙNG yêu cầu
     * chuyển tiền (14 điểm) mới thành 22 và vượt ngưỡng.
     *
     * Và mức đó là NGHI_NGO, không phải CAO — màn hình sẽ bảo bác gọi thẳng cho
     * con để xác minh. Với kịch bản này thì đó đúng là việc cần làm.
     */
    ID_FAMILY_IMPERSONATION: [
      // Cấu trúc gốc, nới khoảng cách giữa danh xưng và động từ.
      { pattern: '(con|cháu|em)\\s+(gái|trai)?[^.]{0,26}(nhờ|bảo|xin|nhắn)[^.]{0,22}(chuyển|gửi)\\s*(tiền|khoản)', scope: 'any' },

      // ── Dấu hiệu định danh: ĐỔI SỐ ──
      { pattern: '(đổi|dùng|chuyển)\\s*(sang\\s*)?(số|sđt|số điện thoại)\\s*(mới|khác)', scope: 'any' },
      { pattern: '(số|sđt)\\s*(này|mới|khác)\\s*(là\\s*)?(của\\s*)?(con|cháu|em|mẹ|bố|ba|má|anh|chị)', scope: 'any' },
      { pattern: '(con|cháu|em|mẹ|bố|ba|má)[^.]{0,20}(đổi|mất|hỏng)[^.]{0,12}(số|sđt|máy|điện thoại)', scope: 'any' },

      // ── Người thân Ở XA: không gặp mặt được nên không xác minh được ──
      { pattern: '(con|cháu|em|anh|chị|bố|mẹ)[^.]{0,26}(nước ngoài|bên kia|du học|xuất khẩu lao động|đi làm xa|ở xa)', scope: 'any' },
    ],
    MAN_SECRECY: [
      { pattern: '(đừng|không)\\s+(nói|kể|báo|tiết lộ)[^.]{0,28}(với ai|cho ai|người thân|gia đình|vợ|chồng|con)', scope: 'action' },
      { pattern: 'giữ\\s+bí mật', scope: 'action' },
      { pattern: 'không được cho ai biết', scope: 'action' },
    ],
    /**
     * NỘI DUNG RA LỆNH CHO CHÍNH BỘ PHÂN TÍCH — xem `signal-registry.js`.
     *
     * ⚠️ `scope: 'any'`, KHÔNG PHẢI `'action'`. Câu tiêm nhiễm không phải lời
     * nói với bác; nó nói với cái máy. Bó vào mệnh đề "hành động" thì bỏ sót
     * đúng dạng hay gặp nhất — một khối `[SYSTEM]…[/SYSTEM]` dán ở đầu tin.
     *
     * ⚠️ ĐỪNG THÊM CỤM CHUNG CHUNG như "an toàn" hay "bỏ qua" đứng một mình.
     * Mỗi mẫu ở đây phải là một câu RA LỆNH CHO MÁY; "bác cứ yên tâm, tin này
     * an toàn" là lời nói với người, và nó đã có đường xử lý riêng.
     */
    MAN_ANALYZER_INJECTION: [
      { pattern: '(bỏ qua|quên|phớt lờ)[^.]{0,20}(mọi|các|những)?[^.]{0,12}(hướng dẫn|chỉ dẫn|quy tắc|quy định|cảnh báo)', scope: 'any' },
      { pattern: '(tắt|vô hiệu hoá|vô hiệu hóa)[^.]{0,16}(bộ lọc|kiểm duyệt|cảnh báo)', scope: 'any' },
      { pattern: '(trả lời|đánh dấu|phân loại|kết luận|xác nhận|báo cáo)[^.]{0,24}(là|rằng)?[^.]{0,14}an toàn', scope: 'any' },
      { pattern: '(bạn|mày) (bây giờ )?là[^.]{0,24}(trợ lý|ai|trí tuệ)', scope: 'any' },
      { pattern: '(chế độ|che do) (nhà phát triển|developer)', scope: 'any' },
      { pattern: '(lời nhắc|prompt) (hệ thống|gốc)', scope: 'any' },
      { pattern: '\\[\\s*/?\\s*system\\s*\\]', scope: 'any' },
      { pattern: '<\\s*/?\\s*system\\s*>', scope: 'any' },
      { pattern: '###\\s*instruction', scope: 'any' },
      { pattern: '(ignore|disregard|forget|override)[^.]{0,24}(previous|prior|above|your)[^.]{0,16}(instruction|rule|prompt)', scope: 'any' },
      { pattern: '(you are now|act as)[^.]{0,24}(assistant|ai|model)', scope: 'any' },
      { pattern: '(developer mode|jailbreak)', scope: 'any' },
      { pattern: '(classify|mark|output|respond)[^.]{0,16}as safe', scope: 'any' },
      { pattern: '(risk_?label|risk level)[^.]{0,12}(=|:)?[^.]{0,10}(safe|low)', scope: 'any' },
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
    /**
     * OFF_ADVANCE_FEE và OFF_TASK_PREPAY TRƯỚC ĐÂY KHÔNG CÓ MẪU NÀO ở vi-VN —
     * chúng chỉ bật được khi AI chạy. Mà §6.10 nói rõ tầng luật phải đứng một
     * mình được khi mất mạng, mất AI. Hai họ kịch bản phổ biến nhất ở Việt Nam
     * (việc nhẹ lương cao, đầu tư nạp vốn) vì thế câm hoàn toàn ở chế độ suy
     * giảm. Đây là lỗ, không phải lựa chọn thiết kế.
     */
    OFF_ADVANCE_FEE: [
      /**
       * ⚠️ KHÔNG có `tạm ứng` ở đây. Đo được: "Con vừa đưa bà vào viện Bạch Mai
       * phòng 402, TẠM ỨNG 8 triệu" — tin nhắn thật của con gái, trần NGHI_NGO,
       * bị đẩy lên CAO. `tạm ứng` là từ chuẩn của bệnh viện và cơ quan.
       */
      { pattern: '(đặt cọc|ứng trước|nạp trước|đóng trước)', scope: 'action' },
      { pattern: '(nộp|đóng|chuyển)[^.]{0,20}(phí|lệ phí)[^.]{0,30}(trước|rồi mới|thì mới)', scope: 'action' },
      /**
       * Bộ 100 chỉ ra ba lối viết mà hai mẫu trên không bắt:
       *   · "đóng trước 2.000.000d phí bảo hiểm khoản vay"  (phí đứng SAU số)
       *   · "chuyển trước 350.000d phí lưu kho"
       *   · "nộp 1.500.000d lệ phí hải quan trước để nhận hàng"
       * Mẫu cũ đòi "phí" đứng trước và "trước" đứng sau — thứ tự thật đảo lộn.
       */
      { pattern: '(đóng|nộp|chuyển|thanh toán)\\s*(trước)?[^.]{0,20}\\d[\\d.,]*\\s*[dđk]?[^.]{0,20}(phí|lệ phí|tiền cọc|tiền đặt cọc)', scope: 'action' },
      { pattern: '(phí|lệ phí|tiền cọc)[^.]{0,26}(trước|mới|thì)[^.]{0,26}(nhận|rút|giải ngân|giao|lấy)', scope: 'action' },
      { pattern: '(nộp|đóng|chuyển)[^.]{0,30}(rồi|sau đó|xong)[^.]{0,20}(nhận|rút|hoàn|trả lại|giải ngân)', scope: 'action' },
    ],
    /**
     * ══════ TÍN HIỆU THÊM 19/8/2026, SAU KHI ĐO BỘ 100 TÌNH HUỐNG ══════
     *
     * Bộ thử cũ có 10 mẫu và cho 5/5 — nhìn như đã xong. Bộ 100 cho 30/50
     * (60%), và danh sách bỏ sót chỉ thẳng ra từng họ kịch bản còn trống.
     * Mọi mẫu dưới đây sinh ra từ một ca bỏ sót CỤ THỂ, không mẫu nào đoán.
     *
     * ⚠️ HẸP CÓ CHỦ Ý. Sau khi thêm, đã đo lại toàn bộ 50 tin nhắn LÀNH của bộ
     * 100 — trong đó có tin ngân hàng thật, hoá đơn điện thật, nhắc học phí
     * thật, tin cảnh báo lừa đảo thật. Báo oan phải giữ ở 0.
     */
    DEV_ACCESSIBILITY_PERMISSION: [
      /*
       * Ca `ld-app-gia-02`: "cai file apk toi vua gui qua zalo, BAT QUYEN TRO
       * NANG de he thong tu dong dong bo". Đây là bước ③ của kịch bản chiếm
       * máy, và tiếng Việt không có mẫu nào cho nó — trong khi en-US thì có.
       */
      { pattern: '(bật|cấp|cho phép|mở)[^.]{0,20}(quyền\\s*)?(trợ năng|hỗ trợ|accessibility)', scope: 'action' },
      { pattern: '(cho phép|bấm đồng ý|bấm cho phép)[^.]{0,24}(tất cả|toàn bộ|mọi)\\s*(quyền|thứ)', scope: 'action' },
    ],
    MAN_EXTORTION_MEDIA_THREAT: [
      /*
       * Ca `ld-doa-lo-anh-01`: chỉ bật FIN_TRANSFER_REQUEST (14đ), không chạm
       * ngưỡng 20 — một tin tống tiền bằng ảnh riêng tư ra CHUA_THAY.
       */
      { pattern: '(giữ|có|đang có)[^.]{0,26}(hình ảnh|clip|video|ảnh)[^.]{0,16}(riêng tư|nhạy cảm|nóng|của (anh|chị|bạn|em))', scope: 'any' },
      { pattern: '(gửi|tung|phát tán|đăng)[^.]{0,30}(cho|lên)[^.]{0,24}(danh bạ|bạn bè|gia đình|người thân|mạng xã hội|facebook)', scope: 'any' },
    ],
    MAN_ISOLATION: [
      /*
       * Khác `MAN_SECRECY` ("đừng nói với ai") ở chỗ: đây là CẮT ĐƯỜNG LIÊN
       * LẠC NGƯỢC LẠI — "đừng gọi lại", "đừng gọi cho bố". Kẻ lừa đảo dùng nó
       * để nạn nhân không kiểm chứng được bằng một cuộc gọi.
       */
      { pattern: '(đừng|không được|khoan)\\s*(gọi|nhắn|liên hệ|hỏi)[^.]{0,24}(lại|cho|với)', scope: 'action' },
      { pattern: '(một mình|tự đi|đi một mình)[^.]{0,20}(đừng|không)\\s*(cho|nói|báo)', scope: 'action' },
    ],
    ID_UTILITY_IMPERSONATION: [
      { pattern: '\\b(evn|điện lực|công ty (cấp )?nước|cấp điện)\\b[^.]{0,40}(nợ|quá hạn|cắt|ngừng cung cấp)', scope: 'any' },
      { pattern: '(cắt|ngừng)\\s*(điện|nước)[^.]{0,24}(trong|nếu không|hôm nay|\\d+\\s*(giờ|tiếng))', scope: 'any' },
    ],
    ID_DELIVERY_IMPERSONATION: [
      { pattern: '(bưu điện|bưu phẩm|kiện hàng|đơn hàng)[^.]{0,36}(đang (bị )?giữ|lưu kho|hải quan|tạm giữ)', scope: 'any' },
    ],
    ID_EMPLOYER_JOB_IMPERSONATION: [
      { pattern: '(tuyển|tuyển dụng|tuyển gấp)[^.]{0,40}(cộng tác viên|ctv|nhân viên|việc tại nhà|part ?time)', scope: 'any' },
    ],
    OFF_ROMANCE_EMERGENCY: [
      { pattern: '(quen|nói chuyện|yêu)[^.]{0,26}(trên mạng|qua mạng|chưa gặp)[^.]{0,40}(gửi|chuyển|cho)\\s*(tiền|\\d)', scope: 'any' },
      { pattern: '(em yêu|anh yêu|bé yêu|honey|darling)\\b[^.]{0,60}(chuyển|gửi|đóng|nộp)[^.]{0,20}(tiền|\\d)', scope: 'any' },
    ],
    OFF_PRIZE_GIFT: [
      { pattern: '(trúng|nhận)\\s*(thưởng|giải|quà)[^.]{0,40}(nộp|đóng|chuyển|phí)', scope: 'any' },
    ],
    MAN_SCARCITY_PRESSURE: [
      { pattern: '(chỉ còn|còn duy nhất|số lượng có hạn|suất cuối)[^.]{0,30}(hôm nay|trong ngày|tối nay|\\d+\\s*(suất|phút|giờ))', scope: 'any' },
      { pattern: '(giữ (chỗ|suất)|đặt cọc)[^.]{0,24}(ngay|hôm nay|trong ngày)[^.]{0,20}(kẻo|nếu không|mai là)', scope: 'action' },
    ],
    OFF_TASK_PREPAY: [
      { pattern: '(nhiệm vụ|đơn hàng|chốt đơn)[^.]{0,40}(nạp|ứng|đặt cọc|chuyển)', scope: 'action' },
      { pattern: '(nạp|ứng)[^.]{0,30}(làm nhiệm vụ|hoàn thành nhiệm vụ|nâng (gói|cấp)|rút (được|về))', scope: 'action' },
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
