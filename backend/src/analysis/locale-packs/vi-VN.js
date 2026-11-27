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
  localePackVersion: 'vi-VN@1.3.5',   // 1.3.5 (26/11/2026): bổ sung từ crawl 35 nhóm Facebook chống lừa đảo —
                                        //   mua card điện thoại, seeding thu hồi vốn bị treo / chỉ chỗ lấy lại,
                                        //   mua hàng ảo hoàn 10% hoa hồng / đặt thêm đơn hàng rút vốn, đóng phí thông quan nhận quà.
                                        // 1.3.4 (26/11/2026): bổ sung mẫu từ crawl Facebook Chrome Debug (chongluadao.vn/BoCongAn/cộng đồng) —
                                        //   cài app qua file gửi kèm (VNeID/đất đai), cán bộ xã/phường đòi VNeID/cài app,
                                        //   nạp tiền đặt đơn hàng hưởng hoa hồng, đóng phí xác minh nâng cấp tài khoản rút vốn.
                                        // 1.3.3 (26/11/2026): thu thập báo chí & chongluadao.vn vòng 2 — shipper thu cước 35k,
                                        //   sai STK/cú pháp chuyển tiền đối ứng, Find My/Apple ID, tuyển dụng dự án hợp tác, cháy phòng & gói AI livestream
                                        // 1.3.2 (26/11/2026): thu thập báo chí & chongluadao.vn — hack Zalo mượn tiền (k0/gởi),
                                        //   bẫy tình thừa kế USDT, kết nối từ xa, xem phim AI kiếm tiền, góp vốn nhàn rỗi, chuyển sai cú pháp
                                        // 1.3.1 (21/11/2026): phạt nguội, SMS 'nếu không phải bạn bấm link', doạ mất lương hưu
                                        // 1.3.0 (30/10/2026): mẫu kịch bản 2026 — OTP trên link, lệ phí qua link,
                                      //   doạ khoá/đình chỉ định danh, giả con ở đồn công an, đầu tư "nội bộ"
                                      // 1.2.1 (24/9/2026): lời kể lại "ngân hàng bảo chuyển", "không thì TK bị khoá"
                                      // 1.2.0 (25/9/2026): mẫu cố định cho tín hiệu AI hay bỏ
  supportedCountryProfiles: ['VN', 'GLOBAL'],

  directPatterns: {
    CRED_OTP_SHARE: [
      // 25/9/2026: "(?<!thông |cảnh )báo" — "THÔNG BÁO mã OTP của quý khách là…" là
      // tin của ngân hàng, không phải lời đòi. Lời đòi thật vẫn có "đọc/gửi/cho cháu".
      // 25/9/2026: + "mã xác nhận" — "Đăng nhập xong gửi mã xác nhận để hệ thống ghi nhận".
      { pattern: '(đọc|gửi|cung cấp|cho|nhắn|(?<!thông |cảnh )báo)\\b[^.]{0,30}\\b(mã otp|mã xác thực|mã xác minh|mã xác nhận|otp|mã vừa (gửi|nhận)|mã bảo mật)', scope: 'action' },
      { pattern: '\\b(mã otp|otp)\\b[^.]{0,24}(cho (tôi|em|anh|chị|cháu|mình|con)|vừa (gửi|nhận))', scope: 'action' },
      /*
       * 25/9/2026 — "bác đọc MÃ cho cháu", "đọc mã đó", "đọc cho cháu mấy số": kẻ gian
       * không cần nói "OTP". Đo trên bộ luật 1.5.0: cả ba câu ra CHUA_THAY khi không
       * có AI. Loại "mã QR / mã vạch / mã giảm giá / mã đơn" — đọc những mã đó là việc thường.
       */
      { pattern: '(đọc|nhắn|chụp|(?<!thông |cảnh )báo)\\s+((lại|giúp|nhanh|ngay|luôn)\\s+)*(cái\\s+)?(mã|code)(?![a-zà-ỹ])(?!\\s*(qr|vạch|giảm giá|khuyến mãi|đơn|vận đơn|bưu))', scope: 'action' },
      { pattern: '(đọc|nhắn|gửi|(?<!thông |cảnh )báo)\\s+((lại|giúp|nhanh|ngay|luôn)\\s+)*cho\\s+(tôi|em|cháu|mình|anh|chị|con)\\s+((cái|dãy|mấy)\\s+)?(mã|code|số)(?![a-zà-ỹ])', scope: 'action' },
      /*
       * 24/9/2026 — "ma xac nhan vua gui do co, doc e 6 so ngay nha" (câu thật trong
       * khối ghi chú `credential+manipulation` của decision-engine) — tầng luật
       * chỉ bắt được MAN_URGENCY. Kẻ gian nói "6 số", không nói "mã OTP".
       */
      // 25/9/2026: "cô READ sáu CON số cho tôi" — tin trộn Việt–Anh, và "con số".
      { pattern: '(đọc|gửi|nhắn|báo|read)[^.]{0,16}(6|sáu|4|bốn)\\s*(con\\s*)?(số|chữ số)(?![a-zà-ỹ])', scope: 'action' },
      // 25/9/2026: "mã xác minh tới rồi chú ĐỌC nhanh CHO CHÁU" — mã đứng trước động từ.
      { pattern: 'mã(?![a-zà-ỹ])[^.]{0,30}(đọc|nhắn|(?<!thông |cảnh )báo)\\s+((lại|giúp|nhanh|ngay|luôn)\\s+)*cho\\s+(tôi|em|cháu|mình|anh|chị|con)(?![a-zà-ỹ])', scope: 'action' },
      { pattern: 'mã\\s*(xác nhận|xác thực|kích hoạt|giao dịch)[^.]{0,30}(đọc|gửi lại|báo|cho (tôi|em|anh|chị))', scope: 'action' },
      { pattern: '(gửi|verify)[^.]{0,28}(6[-\\s]*digit\\s*otp|mã\\s*xác\\s*nhận\\s*6\\s*số|mã\\s*otp[^.]{0,20}(cho (tôi|em|cháu|anh|chị|bên em)|qua zalo))', scope: 'action' },
      { pattern: 'đăng nhập[^.]{0,32}(và|rồi)\\s*(xác nhận|nhập|xác thực)\\s*(mã\\s*)?otp', scope: 'action' },
    ],
    CRED_PASSWORD_PIN: [
      { pattern: '(cung cấp|đọc|gửi|cho|đưa)\\b[^.]{0,26}\\b(mật khẩu|mã pin)\\b', scope: 'action' },
      // 25/9/2026 — "vui lòng phản hồi email này bằng mã PIN hiện tại của thẻ".
      { pattern: '(phản hồi|trả lời)[^.]{0,30}bằng\\s+(mã pin|mật khẩu|pin)(?![a-zà-ỹ])', scope: 'action' },
    ],
    /**
     * ══ THÊM 24/9/2026 — các lỗ đo trên bộ 157 mẫu ChatGPT (nguồn công an/ngân hàng) ══
     *
     * `CRED_CARD_SECRET` trước đây CHỈ có mẫu tiếng Anh (được chấp nhận lệch trong
     * test §6.10). "Anh/chị đọc thông tin thẻ…", "cung cấp thông tin thẻ để làm thủ
     * tục" — kịch bản "miễn phí thường niên / nâng hạng thẻ" — tầng luật câm.
     */
    CRED_CARD_SECRET: [
      /*
       * ⚠️ KHÔNG `báo` trong nhóm động từ, và không cho trườn qua từ phủ định. Đo:
       * "Vietcombank cảnh BÁO không cung cấp thông tin thẻ" — "báo" của "cảnh báo"
       * đứng TRƯỚC chữ "không", nên hàng rào phủ định (chỉ nhìn trước chỗ khớp)
       * không thấy, và câu cảnh báo ra NGHI_NGO.
       */
      // 25/9/2026: + "cập nhật / xác nhận / xác minh" — "Vui lòng CẬP NHẬT số thẻ, ngày
      // hết hạn và ba số ở mặt sau". Ngân hàng không bao giờ đòi cập nhật số thẻ qua tin nhắn.
      // ⚠️ `(?![a-zà-ỹ])` ở cuối: được phép THIẾU dấu thanh nên "thẻ" khớp cả "the", và
      // "cung cấp thông tin THEo mẫu" từng thành CRED_CARD_SECRET. Đo được 25/9/2026.
      { pattern: '(cung cấp|đọc|gửi|nhập|điền|chụp|cập nhật|xác nhận|xác minh)(?:(?!không|đừng|chớ|chẳng)[^.]){0,24}(thông tin thẻ|số thẻ|mã cvv|cvv|cvc|mã bảo mật (của )?thẻ|ba số (ở |mặt )?sau|ngày hết hạn (của )?thẻ|mặt sau (của )?thẻ)(?![a-zà-ỹ])', scope: 'action' },
    ],
    /**
     * Đòi ảnh căn cước / chân dung / video khuôn mặt — xem `signal-registry.js`.
     * ⚠️ Đòi động từ GỬI / CHỤP / QUAY hoặc "xác thực … qua link/Zalo/video":
     * "xác thực khuôn mặt trên ứng dụng ngân hàng" trần là việc thật.
     */
    CRED_ID_BIOMETRIC_DOCS: [
      { pattern: '(gửi|chụp|quay|cung cấp|chuyển)(?:(?!không|đừng|chớ|chẳng)[^.]){0,24}(ảnh|hình|video|clip)[^.]{0,16}(cccd|căn cước|chứng minh|cmnd|chân dung|khuôn mặt|giấy tờ tùy thân|giấy tờ tuỳ thân)', scope: 'action' },
      { pattern: '(xác thực|cập nhật|đăng ký|quét)\\s*(khuôn mặt|sinh trắc)[^.]{0,30}(qua|theo|trên|tại|bằng)\\s*(link|đường dẫn|zalo|cuộc gọi video|ứng dụng (tôi|em|được) gửi)', scope: 'action' },
      // 30/10/2026 — "chụp HAI MẶT căn cước gửi qua Zalo" (không có chữ "ảnh") và "mượn / thuê căn cước để đăng ký sim, lập công ty".
      { pattern: '(chụp|gửi|cung cấp|chuyển)[^.]{0,16}(hai mặt|2 mặt|mặt trước và mặt sau)[^.]{0,16}(cccd|căn cước|chứng minh|cmnd|id card)', scope: 'action' },
      { pattern: '(mượn|thuê|mua|cho thuê|cho mượn)\\s+(cccd|căn cước|chứng minh nhân dân|cmnd|giấy tờ tùy thân|giấy tờ tuỳ thân)', scope: 'action' },
      { pattern: '(quay|gọi|mở cuộc gọi)\\s*video[^.]{0,24}(khuôn mặt|xoay mặt|nháy mắt|quay mặt|quay thẳng mặt|quét khuôn mặt)', scope: 'action' },
      { pattern: '(truy cập|vào|bấm|gửi|cài)[^.]{0,36}(quét khuôn mặt|xác thực khuôn mặt|cập nhật sinh trắc|xác thực sinh trắc|biometric)', scope: 'action' },
      { pattern: '(hỗ trợ|hướng dẫn)[^.]{0,24}(xác thực|cập nhật|quét)\\s*(khuôn mặt|sinh trắc)', scope: 'any' },
      { pattern: '(quét|áp|chạm)[^.]{0,24}(nfc|chip)\\s*(cccd|căn cước)[^.]{0,30}(qua|trên|vào)\\s*(link|app|ứng dụng|điện thoại)', scope: 'action' },
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
      // 24/9/2026 — "cung cấp thông tin đăng nhập", "đăng nhập theo đường dẫn để hoàn tất".
      { pattern: '(cung cấp|gửi|đọc|báo)[^.]{0,20}(thông tin|tên)\\s*đăng nhập', scope: 'action' },
      { pattern: 'đăng nhập[^.]{0,20}(theo|qua|tại|vào)\\s*(đường dẫn|đường link|link)', scope: 'action' },
      /*
       * 25/9/2026 — liên kết trong tin thật hay bị che thành "[đường dẫn]" (mẫu trên
       * không cho dấu "["), "Mở [link rút gọn] để đăng nhập", "nhấn vào link này
       * nhập thông tin ngân hàng để hoàn tiền". Ngân hàng Việt Nam không gửi liên
       * kết đăng nhập qua tin nhắn.
       */
      { pattern: 'đăng nhập[^.]{0,20}(theo|qua|tại|vào)\\s*\\[\\s*(đường dẫn|đường link|link|liên kết)', scope: 'action' },
      { pattern: '(mở|vào|truy cập|bấm|nhấn)\\s*(vào\\s*)?\\[?\\s*(đường dẫn|đường link|link|liên kết)[^.]{0,30}(để\\s+)?đăng nhập', scope: 'action' },
      { pattern: '(link|đường dẫn|liên kết)[^.]{0,20}(nhập|điền)[^.]{0,16}(thông tin\\s+(ngân hàng|tài khoản|thẻ)|tài khoản ngân hàng)', scope: 'action' },
      { pattern: '(click|bấm|vào|nhấn vào)[^.]{0,30}(link|đường dẫn|liên kết)[^.]{0,40}(verify password|đổi mật khẩu|hủy dịch vụ)', scope: 'action' },
      /*
       * 21/11/2026 (luật 1.6.5) — bộ `eval/bao-chi`: 31 tin lừa có thật do báo chí trích.
       * SMS giả ngân hàng / ví: "tài khoản của bạn đã mở dịch vụ, phí 3,6 triệu sẽ bị trừ; nếu
       * không phải bạn vui lòng nhấn vào [liên kết]", "… vào [liên kết] để sửa đổi mật khẩu".
       * Ngân hàng thật bảo gọi tổng đài, không gửi liên kết để huỷ dịch vụ hay đổi mật khẩu.
       */
      { pattern: 'nếu không phải\\s+(bạn|quý khách|anh|chị|ông|bà)[^.]{0,50}(vào|ấn|bấm|nhấn|truy cập|mở)\\s*(vào\\s*)?(\\[\\s*)?(đường dẫn|đường link|link|liên kết|https?:|www)', scope: 'any' },
      { pattern: '(không phải[^.]{0,24}(đăng ký|đk|thực hiện)|không thực hiện giao dịch|muốn\\s+(hủy|huỷ))[^.]{0,48}(vào|ấn|bấm|nhấn|nhấp|truy cập|mở)\\s*(vào\\s*)?(\\[\\s*)?(đường dẫn|đường link|link|liên kết|https?:|www)', scope: 'khong_canh_bao' },
      { pattern: '(nhấp|nhấn|bấm)\\s+(vào\\s+)?(\\[\\s*)?(đường dẫn|đường link|link|liên kết)[^.]{0,24}(hủy|huỷ)(?!\\s*(đơn|lịch))', scope: 'action' },
      { pattern: '(vào|ấn|bấm|nhấn|truy cập|mở)\\s*(vào\\s*)?(\\[\\s*)?(đường dẫn|đường link|link|liên kết|https?:|www)[^.]{0,40}(sửa đổi mật khẩu|đổi mật khẩu|thoát khỏi thiết bị|(hủy|huỷ)\\s+(dịch vụ|đăng ký|gói))', scope: 'any' },
      { pattern: '(vào|ấn|bấm|nhấn|truy cập|mở)\\s*(vào\\s*)?(\\[\\s*)?(đường dẫn|đường link|link|liên kết|https?:|www)[^.]{0,30}kiểm tra hoặc (hủy|huỷ)', scope: 'any' },
      { pattern: 'điểm thưởng[^.]{0,80}(đổi|nhận)[^.]{0,30}(tại|qua)\\s*:?\\s*(\\[\\s*)?(liên kết|link|đường dẫn|https?:)', scope: 'khong_canh_bao' },
      /*
       * 30/10/2026 — NHẬP OTP / MÃ XÁC MINH NGAY TRÊN MỘT ĐƯỜNG LINK. Đo trên bộ `mo-rong`:
       * "Truy cập vneid-xacthuc.top, nhập số CCCD và mã OTP", "Nhập mã OTP vừa gửi và mật
       * khẩu tại đường link để mở khoá ví", "Đăng nhập tại link, nhập mật khẩu và mã xác minh
       * 2 bước" — tầng luật chỉ thấy "mật khẩu" hoặc không thấy gì, nên trang giả ra CHUA_THAY.
       * ⚠️ BẮT BUỘC có LIÊN KẾT trong cùng câu. "Nhập mã OTP để xác nhận giao dịch trên ứng
       * dụng" là tin OTP thật của ngân hàng — không có link, không khớp (đã có ca kiểm).
       * ⚠️ Không dùng "website / trang web": "nhập mã OTP tại trang thanh toán" là cổng 3DS thật.
       */
      { pattern: '(nhập|điền)[^.]{0,36}(mã otp|otp|mã xác (thực|minh|nhận)|xác minh 2 bước)[^.]{0,40}(tại|qua|theo|trên)\\s*(đường dẫn|đường link|link|liên kết)', scope: 'action' },
      { pattern: '(truy cập|vào|bấm|nhấn|mở|đăng nhập)[^.]{0,50}(đường dẫn|đường link|link|liên kết)[^.]{0,60}(nhập|điền)[^.]{0,36}(mã otp|otp|mã xác (thực|minh|nhận)|xác minh 2 bước)', scope: 'action' },
      { pattern: '(find my|iphone|icloud)[^.]{0,50}(được\\s*định vị|đã\\s*định vị|xem vị trí thiết bị)[^.]{0,50}(link|đường dẫn|liên kết|truy cập|bấm|nhấn|https?:|www)', scope: 'any' },
      { pattern: '(bấm|nhấn|truy cập|vào)[^.]{0,30}(link|đường dẫn|liên kết|https?:|www)[^.]{0,30}(xem vị trí thiết bị|đăng nhập apple id)', scope: 'any' },
    ],
    FIN_TRANSFER_REQUEST: [
      { pattern: 'chuyển\\b[^.]{0,40}(tiền|triệu|đồng|khoản|vào tài khoản|sang tài khoản)', scope: 'action' },
      { pattern: '\\bchuyển khoản\\b', scope: 'action' },
      /*
       * Tin TRỘN hai thứ tiếng là ca thật trong bộ dữ liệu: "Mẹ transfer 6.000.000đ
       * tới tài khoản…", "Chú, pay a 600,000đ release fee to account…". Pack
       * tiếng Anh không được bật cho những tin này vì chúng được đoán là tiếng Việt.
       */
      { pattern: '\\b(transfer|pay|send)\\b[^.]{0,36}(tài khoản|account|\\d{3})', scope: 'action' },
      { pattern: '\\b(nộp|gửi)\\b[^.]{0,24}(tiền|triệu|đồng)\\b', scope: 'action' },
      { pattern: '(đóng|nộp)\\s+tiền\\s+ngay', scope: 'action' },
      { pattern: '(đặt cọc|chuyển cọc)\\s*(\\d+%|\\d+[.,]?\\d*\\s*(k|triệu|tr|đ|vnd))', scope: 'action' },
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
      { pattern: '(chuyển|nạp|đóng|nộp|gửi)\\s+((thêm|trước|ngay|gấp)\\s+)?\\d+\\s*(đ|k|tr|triệu|đồng|nghìn|tỷ|tỉ)(?![a-zà-ỹ])', scope: 'action' },
      /**
       * ⚠️ "STK" LÀ CÁCH VIẾT PHỔ BIẾN NHẤT, VÀ TRƯỚC ĐÂY KHÔNG CÓ MẪU NÀO.
       *
       * Đo trên bộ 100 (19/8/2026): "Bo chuyen vao stk nay giup con" chỉ bật
       * MAN_URGENCY, không bật FIN_TRANSFER_REQUEST — nên một tin giả danh con
       * xin tiền ra CHUA_THAY. Bốn mẫu trên đều đòi chữ "tiền/triệu/đồng" hoặc
       * cụm "vào tài khoản" viết đủ; tin nhắn thật viết tắt "stk", "tk".
       */
      { pattern: '(chuyển|gửi|nạp|nộp)[^.]{0,26}(vào|qua|tới|đến)\\s*(stk|tk|số tài khoản|tài khoản)\\b', scope: 'action' },
      // 24/9/2026 — teencode "ck" = chuyển khoản: "bác ck gấp 20tr vào stk 0123…".
      { pattern: '\\bck\\b[^.]{0,30}(\\d|stk|tk|tiền|triệu)', scope: 'action' },
      /*
       * 25/9/2026 — những cách nói AI LÚC BẮT LÚC BỎ (so 3 lượt AI trên cùng mẫu),
       * tầng luật chưa có. Temperature đã là 0 mà đầu ra vẫn dao động, và gọi AI
       * nhiều lần rồi hợp lại là ensemble (§12 cấm) — nên đưa vào luật cố định:
       *   "Thanh toán trước 17 giờ theo tài khoản được gửi"
       *   "Em thanh toán hộ 13,5 triệu vào tài khoản này, lát anh gửi lại"
       *   "Xem hình ảnh và thanh toán trước hạn tại [liên kết]"
       *   "Mẹ thanh toán 1.500.000đ mua váy"            ·  "cần bổ sung vốn ngay"
       *   "thanh toán khoản phí/hồ sơ trước khi nhận tiền"
       * ⚠️ KHÔNG "thanh toán" trần: "nhớ thanh toán tiền điện trước ngày 25" là tin
       * nhắc thật. Phải có TÀI KHOẢN, LIÊN KẾT, MỘT SỐ TIỀN, hoặc "phí … trước khi nhận".
       * ⚠️ `(?<!học )(?<!viện )phí` — học phí, viện phí là tiếng Việt đời thường.
       */
      { pattern: 'thanh toán[^.]{0,30}(vào|theo|qua|sang|tới)\\s*\\[?\\s*(tài khoản|stk|số tài khoản)', scope: 'action' },
      { pattern: 'thanh toán[^.]{0,24}(tại|qua|theo|vào)\\s*\\[?\\s*(đường dẫn|đường link|link|liên kết)', scope: 'action' },
      { pattern: 'thanh toán\\s+((hộ|giúp|trước)\\s+)?\\d+([.,]\\d+)?\\s*(đ|k|tr|triệu|đồng|nghìn)(?![a-zà-ỹ])', scope: 'action' },
      { pattern: 'bổ sung\\s+(thêm\\s+)?(vốn|tiền|số dư|ký quỹ)', scope: 'action' },
      /*
       * 21/11/2026 (luật 1.6.5) — bộ `eval/bao-chi`: 31 tin lừa có thật do báo chí trích.
       * "Vui lòng thanh toán sớm để tránh các khoản phí phạt phát sinh", "chưa thanh toán khoản
       * phạt … mức phạt tăng thêm 50%". Phạt giao thông thật nộp qua Cổng dịch vụ công hoặc kho
       * bạc, không qua tin nhắn đòi "thanh toán".
       */
      { pattern: 'thanh toán[^.]{0,30}(khoản phạt|tiền phạt|phí phạt|phạt giao thông|phạt nguội)', scope: 'any' },
      { pattern: '(thanh toán|nộp|đóng|chuyển)[^.]{0,20}(?<!học )(?<!viện )phí[^.]{0,40}trước khi\\s+(nhận|được|giải ngân|rút)', scope: 'action' },
      /*
       * 30/10/2026 — hai cách đòi tiền mà bộ luật chưa thấy (đo trên bộ `mo-rong`):
       *   "Cần nạp thêm 3.000.000 để hoàn thành nhiệm vụ"  — số có dấu chấm ngăn nghìn, KHÔNG có đơn vị
       *   "Nộp lệ phí tại đường link để tránh bị phạt"      — đóng tiền QUA LIÊN KẾT
       * ⚠️ Số phải từ 6 chữ số trở lên (bộ chuẩn hoá đã bỏ dấu chấm ngăn nghìn: "3.000.000" thành
       * "3000000"): "chuyển 5 con cá" hay "gửi 3 người" không khớp. Không bắt đầu bằng 0 (đó là SĐT/STK).
       * ⚠️ Tín hiệu này một mình là 14 điểm, dưới ngưỡng 20 — nó chỉ nâng mức khi đi cùng một
       * dấu hiệu khác, nên tin nhắn con nhắc mẹ "mẹ chuyển 500.000 tiền chợ" vẫn là CHUA_THAY.
       */
      // Không có "gửi": "gửi 123456 là mã của bạn" là mã xác thực, không phải số tiền.
      { pattern: '(nạp|chuyển|đóng|nộp)\\s+((thêm|trước|ngay|gấp)\\s+)?[1-9]\\d{5,9}(?![\\d])', scope: 'action' },
      { pattern: 'nộp[^.]{0,24}(phạt|lệ phí|phí)[^.]{0,40}(tại|qua|theo|trên)\\s*(đường dẫn|đường link|link|liên kết)', scope: 'action' },
      { pattern: '(nộp|đóng)\\s+(phạt|tiền bảo lãnh|phí\\s+(xác minh|kiểm dịch|hồ sơ|mở băng))', scope: 'action' },
      { pattern: '(chuyển|nạp)\\s+(thêm|vốn|deposit)[^.]{0,30}(tài khoản|số|ví|wallet|mở khóa)', scope: 'action' },
      { pattern: '(đóng trước|nộp trước)[^.]{0,28}(thuế|phí)[^.]{0,30}(nhận thưởng|nhận tiền|giải ngân|rút tiền|khoản vay|duyệt hồ sơ)', scope: 'action' },
      { pattern: '(thanh toán|đóng|nộp)[^.]{0,24}\\d+[^.]{0,24}(theo mã chuyển khoản|trước khi mở niêm phong)', scope: 'action' },
      { pattern: 'đặt cọc\\s+(phí|tiền)\\s+(bảo đảm|giữ chỗ|giao hàng)', scope: 'action' },
      { pattern: '\\bck\\s+luôn\\s+(số|stk|tk)\\b', scope: 'action' },
      { pattern: '(nộp|đóng|thanh toán)\\s+tiền\\s+(làm\\s+)?hồ sơ\\s+[1-9]\\d{4,9}(?![\\d])', scope: 'action' },
      { pattern: '(nộp|đóng)\\s+(thêm\\s+)?\\d+\\s*%[^.]{0,30}(phí|bảo hiểm)', scope: 'action' },
      { pattern: '(cho mượn|mượn|vay)[^.]{0,36}(chuyển|gửi|gởi)\\s*(vào|sang|qua)\\s*(số này|stk|tk|tài khoản)', scope: 'action' },
      { pattern: '(chuyển|gửi|gởi)\\s*(tiền|khoản)?\\s*(vào|sang)\\s*số này', scope: 'action' },
      { pattern: 'đóng\\s+phí[^.]{0,28}(vào|qua|tới)\\s*(stk|tk|số tài khoản|tài khoản)', scope: 'action' },
    ],
    FIN_TRANSFER_MEMO_MISMATCH: [
      { pattern: '(chuyển|ghi)\\s*(sai|nhầm)\\s*(cú pháp|nội dung)[^.]{0,40}(chuyển lại|hoàn tiền|xác nhận)', scope: 'khong_canh_bao' },
      { pattern: '(sai|nhầm)\\s*(số tài khoản|stk|cú pháp|nội dung)[^.]{0,50}(chuyển tiền đối ứng|chuyển lại|chuyển thêm|sửa lỗi hệ thống|hoàn lại)', scope: 'khong_canh_bao' },
    ],
    /**
     * "Chuyển nhầm" rồi đòi trả sang tài khoản KHÁC — xem `signal-registry.js`.
     * `any` cho mẫu đầu: câu "tôi chuyển nhầm" là tường thuật, không phải mệnh lệnh.
     */
    FIN_MISTAKEN_TRANSFER_REDIRECT: [
      /*
       * ⚠️ ĐÒI NƠI NHẬN LÀ MỘT TÀI KHOẢN KHÁC ("khác", "này", "được chỉ định", "bên
       * thu hồi", "công ty"). "Em chuyển nhầm 500k vào tài khoản anh, anh trả lại
       * giúp em" là chuyện thật — trả về chính người đã gửi. Đo 24/9: mẫu rộng hơn
       * (chỉ cần "chuyển nhầm … trả lại") đẩy đúng câu đó lên NGHI_NGO.
       */
      { pattern: '(chuyển trả|trả lại|hoàn lại|chuyển lại)[^.]{0,40}(sang|vào|qua|tới)\\s*\\[?\\s*(tài khoản|stk|tk|số tài khoản)\\s*\\]?\\s*(khác|này|được chỉ định|chỉ định|bên thu hồi|của công ty|công ty)', scope: 'action' },
      { pattern: '(khoản tiền|số tiền)\\s*(vừa nhận|không phải của)[^.]{0,60}(chuyển trả|trả lại|hoàn lại)', scope: 'action' },
      { pattern: '(lỡ|gửi)\\s*(chuyển nhầm|nhầm số tài khoản)[^.]{0,45}(tài khoản khác|hủy ngay|bấm vào link)', scope: 'any' },
    ],
    /**
     * Mở ví / thẻ / tài khoản hộ để lấy hoa hồng, hoặc cho thuê tài khoản.
     * ⚠️ KHÔNG khớp "nhận lương / nhận tiền": công ty bảo mở tài khoản nhận lương là
     * chuyện thật. Chỉ HOA HỒNG / TIỀN CÔNG / THUÊ / BÁN.
     */
    FIN_ACCOUNT_OPENING_FOR_OTHERS: [
      { pattern: '(mở|đăng ký|làm)[^.]{0,20}(ví điện tử|ví|tài khoản ngân hàng|tài khoản|thẻ tín dụng|thẻ)[^.]{0,40}(hoa hồng|tiền công|trả công)', scope: 'khong_canh_bao' },
      { pattern: '(thuê|mướn|mua lại)\\s+(tài khoản ngân hàng|thẻ atm|thẻ ngân hàng)[^.]{0,40}(hoa hồng|trả công|triệu)', scope: 'khong_canh_bao' },
      { pattern: '(tuyển|tìm)\\s+người\\s+mở\\s+(ví điện tử|tài khoản ngân hàng)[^.]{0,40}(trả công|hoa hồng)', scope: 'khong_canh_bao' },
      { pattern: '(cho thuê|bán|mua lại|cho mượn)[^.]{0,12}(tài khoản ngân hàng|tài khoản|thẻ ngân hàng|ví điện tử)', scope: 'khong_canh_bao' },
      { pattern: '(mở|kích hoạt)\\s*hạn mức[^.]{0,30}(ví|thẻ)', scope: 'action' },
    ],
    /**
     * Tổ chức tự xưng nhưng đòi chuyển vào TÀI KHOẢN CÁ NHÂN. Trước 24/9/2026 tín
     * hiệu này không có mẫu ở ngôn ngữ nào — chỉ AI bắt được.
     * ⚠️ Không khớp khi chủ tài khoản là NGƯỜI ĐỌC ("vào tài khoản cá nhân của anh"
     * — công ty trả lương là chuyện thật).
     */
    FIN_ORG_CLAIM_PERSONAL_ACCOUNT: [
      { pattern: '(điện lực|evn|ngân hàng|công an|thuế|bảo hiểm|công ty|nhà mạng|bưu điện|hải quan|nhà trường|bệnh viện|cơ quan)[^.]{0,80}(chuyển|nộp|thanh toán|đóng)[^.]{0,40}(vào|sang|qua)\\s*(tài khoản|stk|tk)\\s*(cá nhân|riêng)(?!\\s*(của\\s*)?(anh|chị|bạn|bác|em|con|quý khách|mình|ông|bà|cô|chú))', scope: 'khong_canh_bao' },
    ],
    FIN_SAFE_ACCOUNT: [
      { pattern: '(tài khoản|ví)\\s+(an toàn|bảo đảm|tạm giữ|phong toả)', scope: 'action' },
    ],
    FIN_CRYPTO_TRANSFER: [
      /*
       * "Đồng này sắp lên sàn lớn… Bác chuyển tiền vào ví em gửi địa chỉ" — không
       * có chữ bitcoin nào, nên hai miếng dưới đều trượt. "Ví" + "địa chỉ" là
       * cách nói của chính họ.
       */
      { pattern: '(chuyển|gửi|nạp)[^.]{0,24}(vào|tới|qua)\\s*ví(?![a-zà-ỹ])', scope: 'action' },
      { pattern: '(bitcoin|btc|usdt|tiền ảo|tiền mã hoá|tiền điện tử)', scope: 'action' },
    ],
    FIN_RECOVERY_FEE: [
      { pattern: 'phí\\s+(giải ngân|xử lý|mở khoá|hồ sơ|kích hoạt|bảo lãnh)', scope: 'action' },
      // ⚠️ KHÔNG `phí\b` — `í` không phải ký tự chữ trong JavaScript nên mẫu đó
      // CHƯA BAO GIỜ khớp. Hàng rào test/ranh-gioi-tu-unicode.test.js tìm ra.
      { pattern: '(đóng|nộp) phí[^.]{0,44}(lấy lại|hoàn|nhận lại)', scope: 'action' },
      /*
       * 24/9/2026 — "muốn rút cần nạp thêm", "muốn rút lợi nhuận… nộp thêm khoản xác
       * minh": phí để LẤY RA tiền của chính mình — dấu hiệu định nghĩa của sàn đầu
       * tư / nhiệm vụ giả. Đi kèm lời mời chào thì tổ hợp `withdrawfee+offer` nổ.
       */
      { pattern: '(muốn|để|mới|được)\\s*rút[^.]{0,40}(phải|cần|thì)\\s*(nạp|nộp|đóng|chuyển)\\s*(thêm|phí|tiền|khoản)', scope: 'action' },
      { pattern: 'rút\\s*(tiền|lợi nhuận|lãi|vốn|hoa hồng)[^.]{0,30}(nạp thêm|nộp thêm|đóng thêm|phí rút|phí xác minh|thuế thu nhập)', scope: 'action' },
      { pattern: 'không\\s+(đóng|nộp)[^.]{0,24}(tiền|phí)\\s+(bảo hiểm|hồ sơ)[^.]{0,36}(không rút|chưa rút|bị treo)', scope: 'action' },
      { pattern: 'đặt thêm\\s*\\d*\\s*đơn hàng[^.]{0,30}(để\\s+)?(rút|nhận lại|mở khoá|mở khóa)', scope: 'action' },
    ],
    FIN_GIFT_CARD_PAYMENT: [
      { pattern: '(thẻ|card)\\s+(quà tặng|cào|game|điện thoại)', scope: 'action' },
    ],
    FIN_PRECIOUS_METAL_PURCHASE: [
      { pattern: '(mua|đổi)\\b[^.]{0,16}(vàng|bạc)\\b', scope: 'action' },
      { pattern: '(vàng miếng|kim loại quý)', scope: 'action' },
    ],
    FIN_CASH_COURIER: [
      { pattern: '(tới|đến|qua)\\s+nhà[^.]{0,30}(nhận|lấy|thu)[^.]{0,16}tiền', scope: 'action' },
      { pattern: '(nhận|giao|thu)\\s+tiền mặt\\b', scope: 'action' },
      // 25/9/2026 — "nhân viên pháp lý sẽ TỚI NHẬN 10 triệu TIỀN MẶT" (số tiền chen giữa),
      // và tin trộn "Put 15,000,000đ in an envelope and hand the cash to the courier".
      { pattern: '(tới|đến|qua|cử người)[^.]{0,24}(nhận|lấy|thu)[^.]{0,24}tiền mặt', scope: 'action' },
      { pattern: '((put|bỏ)[^.]{0,30}(in an envelope|vào phong bì)|hand (the )?cash to|cash to the courier)', scope: 'action' },
    ],
    DEV_REMOTE_CONTROL_APP: [
      { pattern: '\\b(anydesk|teamviewer|ultraviewer|quicksupport)\\b', scope: 'action' },
      { pattern: '(điều khiển|truy cập|kết nối)\\s+từ xa', scope: 'action' },
      /**
       * Đo trên bộ 100: "tai ung dung Ultraview roi cho toi ma de toi ho tro
       * tu xa" — KHÔNG bật tín hiệu nào. `ultraviewer` có trong danh sách
       * nhưng người ta viết "Ultraview" (thiếu "er"), và "hỗ trợ từ xa" thì
       * chưa có mẫu. Kẻ lừa đảo không đọc chính tả tên phần mềm.
       */
      // `khong_canh_bao` (24/9/2026): câu khuyến cáo "đừng cài AnyDesk" không được nổ CO-02.
      { pattern: '\\b(ultraview|teamview|any ?desk|quick ?support|rustdesk)\\w*\\b', scope: 'khong_canh_bao' },
      { pattern: '(hỗ trợ|thao tác|làm giúp|cài giúp)[^.]{0,16}từ xa', scope: 'action' },
      { pattern: '(cho|đọc|gửi)[^.]{0,14}(mã|id)[^.]{0,20}(để|cho)[^.]{0,14}(tôi|em|anh|mình)[^.]{0,20}(vào|truy cập|hỗ trợ|điều khiển)', scope: 'action' },
      { pattern: 'cho\\s+(em|tôi)\\s+thông tin[^.]{0,24}(em|tôi)\\s+cài\\s+(cho|giúp)', scope: 'action' },
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
      /*
       * ⚠️ `(?!…cổng|trang|…)` — "TẠI CỔNG dịch vụ công" viết không dấu là "tai cong
       * dich vu cong", trùng mặt chữ với "TẢI … dịch vụ công". Đo 24/9/2026: thông
       * báo BHXH thật "Tra cuu tai cong dich vu cong" ra CAO · PROTECTED_CRITICAL.
       * "tải/tại" + cổng / trang / website / trụ sở / quầy là CHỖ, không phải việc tải.
       */
      { pattern: '(cài|tải)(?!\\s*(cổng|trang|website|web|địa chỉ|trụ sở|quầy|văn phòng|điểm giao dịch))\\b[^.]{0,44}(dịch vụ công|(qua|tại|từ|theo|ở|vào)\\s*(đường\\s*)?link|đường link|link\\s*(bên )?dưới|file apk|\\bapk\\b|đường dẫn (tôi|em|anh) gửi)', scope: 'action' },
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
      /*
       * ⚠️ `khong_canh_bao`, KHÔNG PHẢI `any` — sửa 24/9/2026. `any` khớp cả câu
       * khuyến cáo: "Cơ quan điều tra khuyến cáo người dân không cài … các tệp APK
       * gửi qua tin nhắn" từng ra CAO · PROTECTED_CRITICAL. Câu `unknown` vẫn khớp.
       */
      { pattern: '\\b(file\\s*)?apk\\b', scope: 'khong_canh_bao' },
      { pattern: '(cài|tải)[^.]{0,30}(tôi|em|anh|mình)\\s*(vừa\\s*)?gửi[^.]{0,20}(qua|trên)\\s*(zalo|messenger|viber|telegram|tin nhắn)', scope: 'khong_canh_bao' },
      /*
       * ── "CÀI ỨNG DỤNG THEO FILE/LINK TÔI GỬI" — THÊM 24/9/2026 ──
       * Bộ 157 mẫu ChatGPT (nguồn công an/ngân hàng): "Anh/chị cài ứng dụng VNeID
       * theo file/link tôi gửi", "Bác cài ứng dụng theo hướng dẫn để đồng bộ",
       * "Mở file ứng dụng tôi gửi và cấp quyền" — tầng luật KHÔNG bật gì, AI cũng
       * không. Hình chung: cài/mở một ỨNG DỤNG mà NGƯỜI NHẮN GỬI TỚI (file, link
       * "tôi gửi", "được gửi"), không phải từ kho chính thức.
       *
       * ⚠️ HẸP CÓ CHỦ Ý — tín hiệu này nổ THẲNG CO-02 (màn khẩn cấp). KHÔNG khớp
       * "cài ứng dụng theo hướng dẫn" trần: "con cài VNeID theo hướng dẫn của công
       * an phường" là câu thật. Phải có vế "file/link/ứng dụng … (tôi|em…|được) gửi".
       * KHÔNG có "con/cháu" trong chủ ngữ: con cài app giúp bố mẹ là chuyện thường.
       */
      // "(file|link)(/link)?" — tin thật viết "theo file/link tôi gửi".
      { pattern: '(cài|tải|mở)\\s*(đặt\\s*)?[^.]{0,24}(ứng dụng|app|phần mềm)[^.]{0,24}(theo|qua|từ|trong|ở)\\s*(file|tệp|link|đường link|đường dẫn)(\\s*/\\s*(file|tệp|link|đường dẫn))?\\s*(mà\\s*)?(tôi|em|anh|chị|bên (tôi|em)|được)\\s*(vừa\\s*)?(gửi|cung cấp)', scope: 'action' },
      { pattern: '(mở|cài)[^.]{0,12}(file|tệp)\\s*(ứng dụng|cài đặt|cài)[^.]{0,30}(gửi|cung cấp)', scope: 'khong_canh_bao' },
      { pattern: '(cài|mở|tải)[^.]{0,20}(ứng dụng|app|phần mềm)\\s*(được|mà\\s*(tôi|em|anh|chị)|tôi|em|bên (tôi|em))\\s*(vừa\\s*)?(gửi|cung cấp)', scope: 'action' },
      { pattern: '(cài|tải)[^.]{0,20}(phần mềm bảo mật|ứng dụng\\s+(vneid|vssid|etax)\\s*(bản\\s*)?(mới|cập nhật))', scope: 'action' },
      { pattern: '(cài|tải)\\s*(đặt\\s*)?(ứng dụng|app|phần mềm)\\s+theo\\s+hướng dẫn[^.]{0,24}(gửi|đồng bộ|cập nhật)', scope: 'action' },
      { pattern: '(cài|tải)[^.]{0,28}(ứng dụng|app|phần mềm)[^.]{0,24}(qua|theo)\\s*file\\s*(gửi|đính)\\s*kèm', scope: 'action' },
      { pattern: '(cài|tải|install)[^.]{0,24}(file|tệp)?[^.]{0,16}\\.apk\\b', scope: 'khong_canh_bao' },
    ],
    DEV_SCREEN_SHARE_BANKING: [
      { pattern: '(chia sẻ|bật)\\b[^.]{0,16}màn hình\\b[^.]{0,48}(ngân hàng|banking|tài khoản|zalo|cho tôi|để kiểm tra)', scope: 'action' },
      { pattern: 'chia sẻ màn hình\\b[^.]{0,44}(app|ứng dụng)\\s+ngân hàng', scope: 'action' },
      // 30/10/2026 — "bật chia sẻ màn hình trong cuộc gọi Zalo… để em hướng dẫn bác thao tác chuyển
      // tiền sang tài khoản bảo mật": câu dài hơn 48 ký tự nên hai mẫu trên trượt. Đòi vế chuyển tiền.
      { pattern: '(chia sẻ|bật)\\b[^.]{0,16}màn hình\\b[^.]{0,90}(thao tác|hướng dẫn)[^.]{0,30}(chuyển tiền|chuyển khoản|giao dịch)', scope: 'action' },
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
    /**
     * Đổi eSIM / cấp lại SIM qua link, mã QR; đọc serial / PUK — xem registry.
     * ⚠️ Đòi KÊNH LẠ (link, QR, Zalo, "mã"): "chuyển eSIM tại cửa hàng / trên ứng
     * dụng nhà mạng" là việc thật.
     */
    DEV_SIM_SWAP_ESIM: [
      { pattern: '(chuyển|đổi|nâng cấp|kích hoạt|cấp lại)\\s*(sang\\s*)?(esim|e-sim|sim)[^.]{0,40}(qua|theo|tại|bằng)\\s*(link|đường dẫn|mã qr|qr|zalo)', scope: 'action' },
      { pattern: '(quét|scan)\\s*(mã\\s*)?qr[^.]{0,30}(esim|e-sim|sim)', scope: 'action' },
      { pattern: '(đọc|gửi|cung cấp|báo)[^.]{0,20}(mã|số)\\s*(serial|seri|imei|puk)', scope: 'action' },
      { pattern: '(nâng cấp|chuẩn hóa|chuẩn hoá|chuyển đổi)\\s*(sim|4g|5g|thuê bao)[^.]{0,36}(qua|theo|tại|bấm)\\s*(link|đường dẫn|mã|\\*{1,2}\\d+)', scope: 'action' },
    ],
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
      { pattern: '\\b(bộ công an|cục cảnh sát|cục csgt|phòng csgt|cơ quan điều tra|cảnh sát khu vực|c06)\\b', scope: 'any' },
      // 30/10/2026 — "em chuyển máy cho công an điều tra": kẻ nhận cuộc gọi đầu CHUYỂN MÁY sang "công an".
      // Không có động từ gọi/báo nên mẫu tường thuật bên dưới không thấy. Một mình 10 điểm.
      { pattern: '(chuyển máy|nối máy|chuyển cuộc gọi|chuyển tiếp cuộc gọi)[^.]{0,24}(công an|cảnh sát|điều tra viên|viện kiểm sát|toà án)', scope: 'any' },

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
      { pattern: 'cán bộ\\s+(xã|phường|địa chính|tổ dân phố)(?:(?!không|chẳng|đừng|chớ)[^.]){0,30}(gọi|yêu cầu|báo|cài|cập nhật|cấp quyền|vneid)', scope: 'any' },
      { pattern: '(gọi|nhắn|điện)(?:(?!không|chẳng)[^.]){0,18}(từ|của|xưng là|tự xưng)[^.]{0,12}(công an|cảnh sát|viện kiểm sát|toà án)', scope: 'any' },
      /*
       * 21/11/2026 (luật 1.6.5) — bộ `eval/bao-chi`: 31 tin lừa có thật do báo chí trích.
       * "Phương tiện của quý khách bị ghi nhận vi phạm…", "Quý khách còn một khoản phạt giao
       * thông chưa thanh toán" — tin PHẠT NGUỘI giả; cả 4 mẫu ra CHUA_THAY. Thông báo phạt thật
       * (VNeID, CSGT) cũng nói "phương tiện vi phạm", nên một mình chỉ 10 điểm, dưới ngưỡng 20.
       */
      { pattern: '(phương tiện|biển số|biển kiểm soát)[^.]{0,50}(vi phạm|phạt nguội|vượt đèn đỏ)', scope: 'any' },
      { pattern: '(khoản|tiền)\\s+phạt\\s+(giao thông|vi phạm|nguội)', scope: 'any' },
      { pattern: 'vi phạm\\s+luật\\s+giao thông', scope: 'any' },
      { pattern: 'bị phạt\\s+(số\\s+)?tiền\\s+\\d', scope: 'any' },
      { pattern: '\\[\\s*phạt nguội\\s*\\]', scope: 'any' },
    ],
    ID_TAX_BENEFIT_IMPERSONATION: [
      /*
       * "Một chương trình hỗ trợ người cao tuổi đang cập nhật danh sách người thụ
       * hưởng" — tin mở đường cho màn xin thông tin/lệ phí ở lượt sau. Không nêu
       * tên cơ quan nào, không đường tra cứu nào — chính sách thật thì có cả hai.
       */
      { pattern: '(chương trình|gói|chính sách)\\s*(hỗ trợ|trợ cấp|ưu đãi)[^.]{0,44}(danh sách|thụ hưởng|đối tượng|xét duyệt)', scope: 'any' },
      { pattern: '(chi cục|cơ quan|cục)\\s+thuế', scope: 'any' },
      { pattern: '\\b(bảo hiểm xã hội|trợ cấp nhà nước|nợ thuế quá hạn)\\b', scope: 'any' },
      { pattern: 'mã số thuế[^.]{0,24}cưỡng chế', scope: 'any' },
      { pattern: '(hoàn thuế|quyết toán thuế|cập nhật mã số thuế|etax)[^.]{0,36}(qua|trên|tại|cài)\\s*(link|app|ứng dụng|đường dẫn)', scope: 'any' },
      { pattern: '(vssid|bảo hiểm y tế|bhyt|lương hưu|trợ cấp người cao tuổi)[^.]{0,36}(cập nhật|đồng bộ|xác thực|tạm dừng|bị cắt)', scope: 'any' },
    ],
    ID_BANK_IMPERSONATION: [
      /*
       * 21/11/2026 (luật 1.6.5) — bộ `eval/bao-chi`: 31 tin lừa có thật do báo chí trích.
       * "Tài khoản của quý khách đã đăng ký chương trình…", "Tài khoản của bạn đã mở dịch vụ…",
       * "đang được đăng nhập trên thiết bị khác". Một mình 8 điểm; chỉ nâng mức khi đi cùng liên
       * kết đổi mật khẩu / huỷ dịch vụ (CRED_BANK_LOGIN).
       */
      { pattern: '(tài khoản|tk)\\s+(ngân hàng\\s+)?(của\\s+)?(quý khách|bạn|cô|chú|bác|anh|chị|ông|bà)[^.]{0,20}(đã|đang)\\s+(được\\s+)?(đăng ký|mở|đăng nhập|kích hoạt)', scope: 'any' },
      { pattern: '(tôi|em|đây)\\s+là[^.]{0,20}(nhân viên|cán bộ)[^.]{0,16}(ngân hàng|vietcombank|bidv|vietinbank|techcombank|agribank|mb bank|acb|vpbank|sacombank)', scope: 'any' },
      { pattern: '(vietcombank|bidv|vietinbank|techcombank|agribank)\\b[^.]{0,26}(thông báo|yêu cầu)', scope: 'any' },
      /*
       * 24/9/2026 — lời bác KỂ LẠI: "ngân hàng bảo chuyển tiền…", "bên ngân hàng yêu cầu
       * nộp…". Ngân hàng thật không đòi khách chuyển tiền đi đâu cả. Không trườn qua từ
       * phủ định ("ngân hàng KHÔNG BAO GIỜ yêu cầu chuyển tiền" là lời dặn), và
       * `khong_canh_bao` bỏ các câu tuyên truyền.
       */
      { pattern: '(ngân hàng|nhân viên ngân hàng|bên ngân hàng)(?:(?!không|chẳng|đừng|chưa|chớ)[^.]){0,20}(bảo|yêu cầu|đề nghị|đòi|hướng dẫn|bắt)(?:(?!không|chẳng|đừng|chưa|chớ)[^.]){0,30}(chuyển|nộp|nạp|gửi tiền)', scope: 'khong_canh_bao' },
      // 30/10/2026 — "Tôi gọi từ ngân hàng, chị đang nợ thẻ tín dụng…": mở đầu bằng "gọi / nhắn từ ngân hàng".
      { pattern: '(tôi|em|chúng tôi|bên em|bên tôi)\\s+(đang\\s+)?(gọi|nhắn|liên hệ|gọi điện)\\s+(từ|bên)\\s+(ngân hàng|phòng tín dụng|bộ phận thu hồi nợ)', scope: 'khong_canh_bao' },
      { pattern: '(hỗ trợ|giúp)\\s*(mở khoá|mở khóa)\\s*(tài khoản|thẻ)\\s*(ngân hàng)?', scope: 'any' },
    ],
    /**
     * ══ HAI MÃ DANH TÍNH CHƯA TỪNG CÓ MẪU Ở NGÔN NGỮ NÀO — thêm 24/9/2026 ══
     *
     * `ID_FAMILY_EMERGENCY_THIRD_PARTY`: người LẠ (giáo viên, bác sĩ, nhà trường)
     * báo người nhà gặp nạn. Bộ 157: "Tôi là giáo viên của cháu. Cháu vừa gặp tai
     * nạn, gia đình chuyển tiền viện phí gấp" — tầng luật chỉ thấy FIN + URGENCY.
     * ⚠️ Đòi dấu hiệu NGƯỜI THỨ BA ("tôi là giáo viên", "con anh/chị", "người nhà
     * của bác"). Con gái tự nhắn "bà vừa nhập viện" là tin thật — không khớp.
     */
    ID_FAMILY_EMERGENCY_THIRD_PARTY: [
      { pattern: '(tôi|em|chúng tôi)\\s*(là|gọi từ|gọi điện từ|bên|ở)\\s*[^.]{0,20}(giáo viên|cô giáo|thầy giáo|chủ nhiệm|nhà trường|bác sĩ|y tá|bệnh viện|phòng khám|trạm y tế)', scope: 'any' },
      { pattern: '(con|cháu)\\s*(nhà\\s*)?(của\\s*)?(anh|chị|bác|cô|chú|ông|bà)(?![a-zà-ỹ])[^.]{0,30}(bị tai nạn|gặp tai nạn|đang cấp cứu|đi cấp cứu|được đưa đi cấp cứu|nhập viện|bị thương|đang mổ|bị bắt)', scope: 'any' },
      { pattern: '(người nhà|người thân)\\s*(của\\s*)?(anh|chị|bác|cô|chú|ông|bà)(?![a-zà-ỹ])[^.]{0,30}(cấp cứu|nhập viện|tai nạn|bị thương|bị bắt)', scope: 'any' },
    ],
    /**
     * `ID_RECOVERY_SUPPORT_IMPERSONATION`: "bên tôi hỗ trợ lấy lại số tiền đã bị
     * lừa". Đi cùng phí xử lý thì `recoverysupport+recoveryfee` (+15) nổ.
     * ⚠️ `any`, KHÔNG `khong_canh_bao` — câu của kẻ lừa loại này TỰ NÓ nghe như
     * tường thuật ("số tiền đã bị lừa / bị chiếm đoạt"), nên dễ bị xếp là cảnh báo.
     * Một mình 12 điểm: câu khuyến cáo có nhắc tới cũng không vượt ngưỡng; còn phí
     * (FIN_RECOVERY_FEE, scope action) trong câu cảnh báo vẫn bị lọc như cũ.
     */
    ID_RECOVERY_SUPPORT_IMPERSONATION: [
      { pattern: '(hỗ trợ|giúp|dịch vụ|đơn vị|văn phòng|luật sư|có thể|có khả năng)[^.]{0,30}(lấy lại|thu hồi|truy hồi|đòi lại)\\s*(số\\s*|khoản\\s*)?(tiền|tài sản)', scope: 'any' },
      { pattern: '(thu hồi|lấy lại)\\s*(\\d+\\s*%\\s*)?tiền\\s*(đã\\s*)?(bị\\s*lừa|từ\\s+sàn)', scope: 'any' },
      { pattern: 'chuyên viên\\s+hỗ trợ\\s+tài chính[^.]{0,40}(hoàn lại|thu hồi|giải ngân|xử lý)', scope: 'any' },
      { pattern: 'thu hồi\\s+(vốn|tiền)\\s+(bị\\s+)?treo', scope: 'any' },
      { pattern: '(chỉ cho|giới thiệu)\\s*(ch[oỗổ]|bên|nơi|cách)\\s*(lấy lại|thu hồi)(?![a-zà-ỹ])', scope: 'any' },
    ],
    ID_TECH_SUPPORT_IMPERSONATION: [
      { pattern: '(hỗ trợ|kỹ thuật viên)\\s+(kỹ thuật|viễn thông)', scope: 'any' },
      { pattern: '(find my|hỗ trợ\\s+apple|trung tâm\\s+apple)', scope: 'any' },
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
      { pattern: '(mẹ|bố|ba|má)\\s+ơi\\s+con\\b[^.]{0,60}(vỡ màn hình|hỏng máy|máy hư|chuyển gấp|stk bạn)', scope: 'any' },

      // ── Người thân Ở XA: không gặp mặt được nên không xác minh được ──
      { pattern: '(con|cháu|em|anh|chị|bố|mẹ)[^.]{0,26}(nước ngoài|bên kia|du học|xuất khẩu lao động|đi làm xa|ở xa)', scope: 'any' },

      // ── 30/10/2026 — "mẹ ơi con đang ở đồn công an / bệnh viện / lỡ gây tai nạn" ──
      // Người xưng là con TỰ NHẮN gặp nạn (khác ID_FAMILY_EMERGENCY_THIRD_PARTY, người LẠ báo).
      // Một mình 12 điểm: "mẹ ơi con ở bệnh viện thăm bà" không đủ ngưỡng; chỉ nâng khi đi cùng
      // yêu cầu chuyển tiền hay giữ bí mật.
      { pattern: '(mẹ|bố|ba|má)\\s*ơi[^.]{0,40}(con|em)[^.]{0,30}(đồn công an|bị bắt|bị giữ|gây tai nạn|bị tai nạn|nằm viện|đang cấp cứu)', scope: 'any' },
      { pattern: '(mẹ|bố|ba|má)\\s*(à|ơi)[^.]{0,30}(con|em)[^.]{0,30}(đâm vào|cấp cứu|viện phí|máy con bị hư)', scope: 'any' },
      { pattern: '(con|em)\\s+(đang\\s+)?ở\\s+(đồn công an|đồn cảnh sát|trại tạm giam)', scope: 'any' },
      { pattern: '(sếp|giám đốc)\\s+đây[^.]{0,30}(đang họp gấp|chuyển ngay)', scope: 'any' },
    ],
    ID_CONTACT_ACCOUNT_TAKEOVER: [
      { pattern: '(cho mượn|mượn|vay)[^.]{0,36}(chuyển|gửi|gởi)[^.]{0,20}(số này|stk|tk|tài khoản)[\\s\\S]{0,60}(trả lại|gửi lại|gởi lại|hoàn lại)', scope: 'khong_canh_bao' },
      { pattern: '(cho mượn|mượn)\\s+(tạm\\s+)?(chuyển|gửi|gởi)\\s+(vào\\s+)?(số này|stk này|tk này|tài khoản này)', scope: 'khong_canh_bao' },
      { pattern: '(nick|tài khoản|zalo|fb|facebook)[^.]{0,24}(đang bị|bị)\\s*(lỗi|khóa|khoá|hạn chế)[^.]{0,30}(chuyển|gửi|nhờ)\\s*(tạm|giúp)', scope: 'khong_canh_bao' },
      { pattern: '(chuyển|bắn)\\s*(tạm|giúp)[^.]{0,24}(tí|chút|vài triệu|\\d+\\s*(tr|triệu|k))[^.]{0,30}(chiều|tối|mai)\\s*(gửi|trả)\\s*lại', scope: 'khong_canh_bao' },
    ],
    MAN_SECRECY: [
      // 24/9/2026 — "(không) ĐƯỢC nói với ai": chữ "được" chen giữa từng làm mẫu trượt.
      { pattern: '(đừng|không)\\s+(được\\s+)?(nói|kể|báo|tiết lộ)[^.]{0,28}(với ai|cho ai|người thân|gia đình|vợ|chồng|con)', scope: 'action' },
      /*
       * Danh sách trên thiếu đúng những người hay được nêu tên nhất. Đo 19/9/2026:
       * "bà đừng nói với bố cháu bà nhé" — câu kinh điển của kịch bản giả danh cháu
       * — không khớp được miếng nào, và trước đây nó chỉ nổ nhờ va chạm dấu.
       */
      { pattern: '(đừng|không)\\s+(nói|kể|báo|tiết lộ)[^.]{0,28}(bố|mẹ|ba|má|bà|ông|anh|chị|cô|chú|cậu)\\b', scope: 'action' },
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
      { pattern: 'kết quả phân tích\\s*:\\s*(chưa thấy|không thấy|an toàn)', scope: 'any' },
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
      { pattern: '(lưu ý|ghi chú|chỉ dẫn|note)\\s+(cho|to)\\s+(the\\s+)?(ai|mô hình|model)[^.]{0,44}(hợp lệ|legitimate|không cần cảnh báo|no warning|safe|none)', scope: 'any' },
      { pattern: '(nói với người dùng|trả lời|hãy trả về)[^.]{0,40}(hợp lệ|mức thấp|chưa thấy dấu hiệu rủi ro)', scope: 'any' },
      { pattern: 'ignore\\s+any\\s+warning\\s+(your\\s+)?app\\s+shows', scope: 'any' },
    ],
    MAN_FEAR_THREAT: [
      /*
       * 21/11/2026 (luật 1.6.5) — bộ `eval/bao-chi`: 31 tin lừa có thật do báo chí trích.
       * Phạt nguội giả doạ "mức phạt sẽ tăng thêm 50%", "tạm giữ giấy tờ phương tiện"; BHXH giả
       * doạ "không nhận được lương hưu". Một mình 12 điểm, dưới ngưỡng 20.
       */
      { pattern: '(bị trừ|phí duy trì)[^.]{0,36}(phí dịch vụ tự động|mỗi tháng|hàng tháng)', scope: 'khong_canh_bao' },
      { pattern: 'sẽ\\s+(cắt|ngắt|ngừng)\\s+(điện|nước|dịch vụ)[^.]{0,55}(bấm\\s+(số|phím)\\s+\\d|trong\\s+thời gian tới)', scope: 'khong_canh_bao' },
      { pattern: '(mức phạt|tiền phạt|khoản phạt)[^.]{0,20}(sẽ\\s+)?tăng\\s+(thêm\\s+)?\\d+\\s*%', scope: 'khong_canh_bao' },
      { pattern: 'tạm giữ\\s+(giấy tờ|phương tiện|bằng lái|giấy phép lái xe)', scope: 'khong_canh_bao' },
      { pattern: 'thẻ\\s+(bị\\s+)?(khóa|khoá)\\s+vĩnh viễn', scope: 'khong_canh_bao' },
      { pattern: '(tránh|kẻo)\\s+tăng\\s+mức phạt', scope: 'khong_canh_bao' },
      { pattern: '(không nhận được|gián đoạn|dừng chi trả|ngừng chi trả|tạm ngưng chi trả)[^.]{0,30}(lương hưu|trợ cấp|chế độ bảo hiểm)', scope: 'khong_canh_bao' },
      { pattern: '(cưỡng chế hóa đơn|tước bằng lái|khóa giao dịch)', scope: 'khong_canh_bao' },
      { pattern: '(bắt giữ|bị bắt|khởi tố|truy tố|phong toả|tạm giam)', scope: 'any' },
      { pattern: '\\b(rửa tiền|cắt trợ cấp|liên quan.{0,12}vụ án)\\b', scope: 'any' },
      /*
       * 25/9/2026 — doạ KHOÁ / NGẮT / TẠM NGỪNG nếu không làm theo; AI lúc bắt lúc bỏ:
       *   "Hệ thống sẽ khóa nếu khách hàng không xác nhận tại [liên kết]"
       *   "mã chỉ có hiệu lực 30 giây, hết hạn sẽ bị ngắt dịch vụ"
       * ⚠️ Tin nhắc hoá đơn THẬT cũng viết "nếu không sẽ tạm ngừng cấp điện". Tín hiệu
       * này một mình là 12 điểm, dưới ngưỡng 20 — nó chỉ nâng mức khi đi cùng liên
       * kết giả, đòi tiền hay mạo danh. `khong_canh_bao`: bài cảnh báo không tính.
       * ⚠️ KHÔNG "đình chỉ": "nếu không đóng học phí là cháu bị đình chỉ thi" là lời nhắc thật.
       */
      { pattern: '(sẽ|bị)\\s+(tạm\\s+)?(khóa|khoá|ngừng|ngắt|cắt|phong tỏa|thu hồi)[^.]{0,40}(nếu|khi)\\s+([^.,]{0,20}\\s)?(không|chưa)', scope: 'khong_canh_bao' },
      { pattern: 'nếu\\s+(không|chưa)[^.]{0,40}(sẽ\\s+)?(bị\\s+)?(tạm\\s+)?(khóa|khoá|ngắt|cắt|ngừng|khởi kiện|truy cứu)', scope: 'khong_canh_bao' },
      { pattern: '(hết hạn|quá hạn)[^.]{0,20}(sẽ\\s+)?bị\\s+(tạm\\s+)?(khóa|khoá|ngắt|cắt|ngừng)', scope: 'khong_canh_bao' },
      /*
       * 24/9/2026 — người dùng gõ vào trợ lý: "ngân hàng bảo chuyển tiền KHÔNG TÀI KHOẢN
       * BỊ KHOÁ" — lời doạ không có chữ "nếu". Bộ luật chỉ thấy "chuyển tiền" (14 điểm)
       * ⇒ chưa thấy dấu hiệu. Đòi dạng doạ: "không (thì) / kẻo / … sẽ bị khoá". Câu báo
       * thật "tài khoản đã bị khoá do nhập sai mật khẩu" không có dạng đó.
       */
      { pattern: '(không\\s+(thì\\s+)?|kẻo\\s+)(tài khoản|tk|thẻ|sim|số|thuê bao)[^.]{0,20}(sẽ\\s+)?bị\\s+(tạm\\s+)?(khóa|khoá|phong tỏa|phong toả|đóng băng)', scope: 'khong_canh_bao' },
      { pattern: '(tài khoản|tk|thẻ|sim|thuê bao)[^.]{0,38}sẽ\\s+bị\\s+(tạm\\s+)?(khóa|khoá|phong tỏa|phong toả|đóng băng|thu hồi)', scope: 'khong_canh_bao' },
      { pattern: '(mỗi tháng|hàng tháng|tự động)\\s*(thu phí|trừ phí|trừ)\\s*\\d[\\d.,]*\\s*(vnd|vnđ|đ|đồng|triệu|k)', scope: 'khong_canh_bao' },
      { pattern: 'bắt buộc\\s+(phong tỏa|phong toả|đóng băng)[^.]{0,24}(toàn bộ\\s+)?(tiền|tài khoản)', scope: 'khong_canh_bao' },
      /*
       * 30/10/2026 — "SẮP bị khoá do chưa xác thực" và "sẽ bị đình chỉ / vô hiệu hoá" cho tài khoản
       * định danh, SIM, ví (kịch bản VNeID, chuẩn hoá thuê bao). Hai mẫu trên chỉ có "sẽ bị khoá".
       * ⚠️ "đình chỉ" CHỈ khi đứng sau tài khoản / định danh / SIM / ví — vẫn KHÔNG tính "cháu bị
       * đình chỉ thi" (xem ghi chú ở đầu nhóm). Một mình 12 điểm, dưới ngưỡng 20.
       */
      { pattern: '(tài khoản|tk|thẻ|sim|thuê bao|vneid|định danh|căn cước|cccd|ví)[^.]{0,30}(sắp|sẽ|đang)\\s+bị\\s+(tạm\\s+)?(khóa|khoá|đình chỉ|vô hiệu hoá|vô hiệu hóa|phong tỏa|phong toả)', scope: 'khong_canh_bao' },
      // 30/10/2026 — "hồ sơ sẽ chuyển sang công an": doạ đẩy vụ việc lên cơ quan điều tra (kịch bản nhắc nợ giả).
      { pattern: '(hồ sơ|vụ việc|trường hợp)[^.]{0,24}(chuyển sang|chuyển cho|chuyển giao|bàn giao|đẩy sang)[^.]{0,12}(công an|cơ quan điều tra|toà án|viện kiểm sát)', scope: 'khong_canh_bao' },
    ],
    MAN_URGENCY: [
      { pattern: '\\b(ngay|gấp|lập tức|khẩn|trong vòng \\d+)\\b', scope: 'action' },
      // 21/11/2026 (luật 1.6.5) — "phí sẽ bị trừ trong 3 giờ", "sẽ bị khoá sau 2 giờ nữa". 7 điểm.
      { pattern: '(trong|sau)\\s+\\d+\\s*(giờ|tiếng|phút)(\\s+nữa)?(?![a-zà-ỹ])', scope: 'any' },
    ],
    MAN_KEEP_CALL_ACTIVE: [
      { pattern: '(giữ máy|đừng tắt máy|không được tắt máy)', scope: 'any' },
    ],
    OFF_INVESTMENT_GUARANTEE: [
      { pattern: '(lợi nhuận|lãi)\\b[^.]{0,20}(cam kết|đảm bảo|chắc chắn)', scope: 'any' },
      /*
       * 25/9/2026 — "Lệnh vàng đang có cơ hội lợi nhuận cao", "nâng gói để nhận lợi
       * nhuận cao hơn", "lãi 20%/tháng". ⚠️ KHÔNG "lãi suất hấp dẫn" / "lãi 6%/năm":
       * đó là quảng cáo tiết kiệm thật — chỉ tính lãi theo NGÀY / TUẦN / THÁNG.
       */
      { pattern: '(lợi nhuận|lãi)\\s+(cao|khủng|gấp \\d|x\\d)', scope: 'khong_canh_bao' },
      { pattern: '\\d+([.,]\\d+)?\\s*%\\s*(\\/|một|mỗi|trên)\\s*(ngày|tuần|tháng)', scope: 'khong_canh_bao' },
      /*
       * 30/10/2026 — DỤ ĐẦU TƯ QUA NGƯỜI QUEN / "NỘI BỘ" (kịch bản tình cảm dẫn dắt, bot AI sinh lời):
       *   "em có người quen làm sàn vàng nội bộ, anh nạp thử 2 triệu… lời lắm"
       *   "bot giao dịch AI tự động sinh lời, rút tiền bất cứ lúc nào"
       * ⚠️ KHÔNG "sàn" trần, "đầu tư" trần hay "sinh lời" trần — tin quảng cáo tiết kiệm thật có
       * những chữ này. Đòi "nội bộ", hoặc người quen + sàn + lãi, hoặc bot tự động + sinh lời.
       */
      { pattern: '\\b(sàn|kèo|dự án|mã)\\s+[^.]{0,12}nội bộ', scope: 'khong_canh_bao' },
      { pattern: '(người quen|bạn|anh|chị|thầy|cô)[^.]{0,24}(làm|bên|trong)\\s+(sàn|chứng khoán|forex|tiền ảo|crypto)[^.]{0,60}(lời|lãi|lợi nhuận|nạp|đầu tư)', scope: 'khong_canh_bao' },
      { pattern: '\\b(bot|robot|ai)\\b[^.]{0,30}(tự động|tự giao dịch)[^.]{0,30}(sinh lời|sinh lãi|kiếm tiền|lợi nhuận)', scope: 'khong_canh_bao' },
      { pattern: '(thu hồi|lấy lại)\\s+100\\s*%\\s*(tiền|số tiền|vốn)\\s*(đã\\s*)?(bị\\s*(lừa|mất|treo))?', scope: 'any' },
      { pattern: '(chỉ cần|chỉ việc)\\s+góp vốn[^.]{0,30}(không phải làm gì|ngồi hưởng|nhận lãi)', scope: 'khong_canh_bao' },
    ],
    /**
     * QR DẪN TỚI ĐĂNG NHẬP / THANH TOÁN / NHẬN TIỀN — 25/9/2026. Trước đây tầng luật
     * KHÔNG có mẫu tiếng Việt nào; AI lúc bắt lúc bỏ:
     *   "Quét mã QR này rồi đăng nhập; mã chỉ còn hiệu lực hai phút"
     *   "Quét mã để nhận tiền lì xì" · "quét mã để mở tài khoản…, xong được trả tiền công"
     * Một mình chỉ 8 điểm: "anh quét mã QR này để thanh toán tiền cơm" vẫn là chưa thấy.
     */
    WEB_QR_TO_LOGIN_PAYMENT: [
      { pattern: '(quét|scan)\\s*(mã|qr|mã qr)[^.]{0,30}(để|rồi|và|xong)\\s*(đăng nhập|thanh toán|xác nhận|xác thực|nhận\\s+(tiền|quà|thưởng|lì xì|hoàn tiền)|hoàn\\s+(tiền|lại)|mở tài khoản|đăng ký)', scope: 'action' },
      { pattern: '(quét|scan)\\s*(mã\\s*)?qr[^.]{0,24}(đổi\\s*esim|qua\\s*link|giữ\\s*số)', scope: 'action' },
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
      { pattern: 'chuyển\\s+(lại\\s+)?tiền cọc\\s+\\d', scope: 'action' },
      /*
       * Ba lối viết đo được 19/9/2026, không miếng nào ở trên bắt được:
       *   · "nạp thêm 4.800.000đ để đồng bộ lệnh, xong là rút được"
       *   · "chuyển cọc 50 triệu vào tài khoản này để giữ chỗ"   (cọc đứng một mình)
       *   · "em chuyển khoản giúp để giải phóng kiện hàng"
       * Cả ba đều là một hình: trả tiền TRƯỚC để được một thứ hứa SAU.
       */
      { pattern: '(nạp|nộp|đóng|chuyển)\\s*(thêm\\s*)?[^.]{0,26}(để|thì mới|rồi mới)[^.]{0,26}(rút|nhận|giải ngân|kích hoạt|đồng bộ|mở khoá|mở khóa)', scope: 'action' },
      { pattern: '(chuyển|đóng|nộp|đặt)\\s*cọc\\b', scope: 'action' },
      { pattern: '(giải phóng|thông quan|giải toả|giải tỏa)[^.]{0,20}(kiện hàng|lô hàng|hàng|tiền)', scope: 'action' },
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
      /*
       * 30/10/2026 — "Chuyển trước phí bảo hiểm khoản vay 2 triệu để duyệt hồ sơ": phí đứng
       * TRƯỚC số tiền nên mẫu "số rồi mới phí" ở trên trượt. ⚠️ ĐÒI vế vay / duyệt hồ sơ / giải ngân:
       * "đóng trước phí bảo hiểm xe" là việc thường, và cho vay thật không thu phí trước khi giải ngân.
       */
      { pattern: '(đóng|nộp|chuyển|thanh toán)\\s+trước\\s+(phí|lệ phí)[^.]{0,40}(khoản vay|vay vốn|duyệt (hồ sơ|vay)|giải ngân)', scope: 'action' },
      { pattern: 'cọc\\s+(\\d+\\s*%|\\d+\\s*(k|tr|triệu|nghìn|đồng))[^.]{0,28}(giữ phòng|giữ chỗ|nhận hàng|nguyên liệu|ship\\s+hỏa\\s+tốc)', scope: 'action' },
      { pattern: 'nộp[^.]{0,24}phí\\s+giữ\\s+chỗ[^.]{0,36}(trước thời hạn|hướng dẫn)', scope: 'action' },
      { pattern: '(đóng|nộp)[^.]{0,24}(phí|tiền)\\s+(làm\\s+hồ sơ|bảo hiểm\\s*(cho\\s*)?khoản vay)[^.]{0,44}(giải ngân|rút tiền|kích hoạt ví)', scope: 'action' },
      { pattern: 'nộp\\s+tiền\\s+làm\\s+hồ sơ[^.]{0,75}(xử lý|giải ngân)', scope: 'action' },
      { pattern: '(anh|chị|bác|em|bạn)\\s+cứ\\s+cọc\\s+đi', scope: 'action' },
      { pattern: 'chuyển\\s+lại\\s+tiền\\s+do\\s+sai\\s+(nội dung|cú pháp)', scope: 'action' },
      { pattern: '(chuyển|nạp|đóng)[^.]{0,20}(tiền đối ứng|phí sửa lỗi)[^.]{0,40}(sửa lỗi|hệ thống|giải ngân|hoàn lại)', scope: 'action' },
      { pattern: 'tiền hàng\\s+(đã\\s+)?thanh toán rồi[^.]{0,30}(tiền ship|cước|phí)[^.]{0,30}(gửi|chuyển)\\s*(vào|sang)\\s*(số tài khoản|tài khoản|stk)', scope: 'action' },
      { pattern: '(đóng|nộp|chuyển|thanh toán)\\s+phí\\s+(giao lại|lưu kho|thông quan|hải quan|vận chuyển)[^.]{0,24}(vào|qua|\\d|nhận quà|nhận hàng|để nhận)', scope: 'action' },
      { pattern: '(đóng|nộp|chuyển)[^.]{0,24}(phí xác minh|nâng cấp tài khoản)[^.]{0,24}(rút tiền|rút vốn|hoàn tiền)', scope: 'action' },
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
      { pattern: '(không có|tránh)\\s+người thứ ba', scope: 'any' },
      { pattern: '(không gian|phòng|chỗ)\\s+yên tĩnh[^.]{0,30}(không có người|một mình)', scope: 'any' },
    ],
    ID_UTILITY_IMPERSONATION: [
      { pattern: '\\b(evn|điện lực|công ty (cấp )?nước|cấp điện)\\b[^.]{0,40}(nợ|quá hạn|cắt|ngừng cung cấp)', scope: 'any' },
      { pattern: '(cắt|ngừng)\\s*(điện|nước)[^.]{0,24}(trong|nếu không|hôm nay|\\d+\\s*(giờ|tiếng))', scope: 'any' },
      /*
       * Cướp SIM: "bấm mã **21*…# rồi bấm GỌI để hệ thống tự đồng bộ sóng 5G".
       * Chữ "hệ thống" ở đây đang đóng vai nhà mạng — không nhà mạng nào bảo khách
       * bấm mã chuyển hướng cuộc gọi để "nâng sóng".
       */
      { pattern: '(hệ thống|nhà mạng|tổng đài)[^.]{0,30}(sóng|5g|4g|sim)\\b', scope: 'any' },
      { pattern: 'sử dụng\\s+điện\\s+cao\\s+bất thường', scope: 'any' },
      { pattern: 'bấm\\s+(số|phím)\\s+\\d[^.]{0,30}(nhân viên\\s+)?(điện lực|cấp nước|tổng đài)', scope: 'any' },
      { pattern: '\\bsim\\b[^.]{0,28}(sai thông tin|chưa chuẩn hoá|chưa chuẩn hóa|bị khóa|bị khoá)', scope: 'khong_canh_bao' },
      { pattern: '(hóa đơn|hoá đơn|tiền)\\s*(điện|nước)[^.]{0,30}(quá hạn|chưa thanh toán|sai số|tính nhầm)[^.]{0,36}(liên hệ|zalo|link|cài|tải)', scope: 'any' },
      { pattern: '(tổng đài|nhân viên)\\s*(điện lực|evn|cấp nước)[^.]{0,30}(gửi|kết bạn)\\s*zalo', scope: 'any' },
    ],
    ID_DELIVERY_IMPERSONATION: [
      { pattern: '(bưu điện|bưu phẩm|bưu kiện|kiện hàng|đơn hàng|đơn vị vận chuyển|giao hàng tiết kiệm|hải quan)[^.]{0,40}(đang (bị )?giữ|lưu kho|quá thời gian lưu kho|hải quan|tạm giữ|phát sinh phí|thu hộ|0đ|chưa đóng phí)', scope: 'any' },
      { pattern: '(giao hàng|shipper|bưu tá)[^.]{0,40}(nhầm[^.]{0,24}hội viên|trừ\\s+\\d[^.]{0,24}tháng|(hủy|huỷ)\\s+(gói|hội viên|thẻ))', scope: 'any' },
      { pattern: '(tiền hàng|đơn hàng)[^.]{0,30}(thanh toán rồi|đã thanh toán)[^.]{0,30}(tiền ship|cước|phí giao)[^.]{0,40}(gửi|chuyển)[^.]{0,20}(số tài khoản|tài khoản|stk|tk)', scope: 'any' },
      { pattern: '(viettel\\s*post|vnpost|vietnampost|giao hàng nhanh|ghn|ghtk|j&t|shopee)[^.]{0,40}(lưu kho|sai địa chỉ|hải quan|tạm giữ|chưa đóng phí|xác nhận đơn|nhận hoàn tiền)', scope: 'any' },
      { pattern: '(shipper|giao hàng)[^.]{0,30}(chuyển khoản trước|cọc trước|nhầm số tài khoản|kích hoạt hoàn tiền)', scope: 'any' },
    ],
    ID_EMPLOYER_JOB_IMPERSONATION: [
      { pattern: '(tuyển|tuyển dụng|tuyển gấp)[^.]{0,40}(cộng tác viên|ctv|nhân viên|việc tại nhà|part ?time)', scope: 'any' },
      { pattern: 'tham gia\\s+nhiệm vụ\\s+(like|share|chia sẻ|xem video|thả tim)', scope: 'khong_canh_bao' },
      { pattern: '(tuyển|tuyển dụng)[^.]{0,40}(dự án hợp tác|tham gia dự án)', scope: 'any' },
      { pattern: '(tuyển|tìm)\\s*(ctv|cộng tác viên|nhân viên)[^.]{0,36}(shopee|lazada|tiki|tiktok|đánh giá|tăng tương tác|nhập liệu tại nhà)', scope: 'any' },
      { pattern: '(việc nhẹ|thu nhập|lương)[^.]{0,24}(\\d+\\s*(k|nghìn|ngàn|triệu)\\s*/\\s*(ngày|giờ|tuần)|không cần kinh nghiệm)[^.]{0,30}(nhắn|zalo|telegram)', scope: 'khong_canh_bao' },
    ],
    MAN_LOVE_BOMBING: [
      /*
       * "Thấy em sống tình cảm nên anh muốn làm quen" — lời khen của một người
       * chưa từng gặp, đặt ngay trong tin đầu tiên. Đây là bước vào của kịch bản
       * tình cảm; cảnh báo ở bước này còn kịp, cảnh báo ở bước xin tiền thì muộn.
       */
      { pattern: '(thấy|nhìn)\\s*(em|chị|cô)(?![a-zà-ỹ])[^.]{0,26}(tình cảm|hiền|dễ thương|đặc biệt|khác người)', scope: 'any' },
    ],
    OFF_ROMANCE_EMERGENCY: [
      /*
       * "Anh là bạn của cô [đã ẩn], cô ấy cho anh số của em" — câu giải thích VÌ SAO
       * một người lạ có số của bác. Đây là bước MỞ ĐẦU của kịch bản tình cảm,
       * đứng trước lời xin tiền hàng tuần — và đúng lúc đó cảnh báo mới có tác dụng.
       */
      { pattern: '(bạn của|quen)[^.]{0,30}(cho|gửi)\\s*(anh|em|tôi|chị)\\s*số(?![a-zà-ỹ])', scope: 'any' },
      { pattern: '(muốn|xin)\\s*(được\\s*)?(làm quen|kết bạn)[^.]{0,30}(lâu dài|nghiêm túc|trò chuyện)', scope: 'any' },
      { pattern: '(quen|nói chuyện|yêu)[^.]{0,26}(trên mạng|qua mạng|chưa gặp)[^.]{0,40}(gửi|chuyển|cho)\\s*(tiền|\\d)', scope: 'any' },
      { pattern: '(em yêu|anh yêu|bé yêu|honey|darling)\\b[^.]{0,60}(chuyển|gửi|đóng|nộp)[^.]{0,20}(tiền|\\d)', scope: 'any' },
      { pattern: '(chỉ còn|sống được)[^.]{0,20}(tháng|tuần|ngày)[\\s\\S]{0,60}(để lại|tài sản|thừa kế)', scope: 'khong_canh_bao' },
      { pattern: 'bức thư cuối cùng[\\s\\S]{0,60}(để lại|tài sản|cho bạn)', scope: 'khong_canh_bao' },
      { pattern: 'để lại cho bạn\\s+(một số\\s+)?(tài sản|thừa kế)', scope: 'khong_canh_bao' },
      { pattern: 'tất cả những gì tôi có\\s+(đều\\s+)?để lại', scope: 'khong_canh_bao' },
      { pattern: 'bức thư cuối cùng', scope: 'khong_canh_bao' },
    ],
    OFF_PRIZE_GIFT: [
      { pattern: '(trúng|nhận)\\s*(thưởng|giải|quà)[^.]{0,40}(nộp|đóng|chuyển|phí)', scope: 'any' },
      /*
       * "Bé nào Top 1 được hợp đồng 50 triệu" — mồi nhử nói bằng CON SỐ chứ không
       * bằng chữ "trúng thưởng", nên miếng trên trượt. Giải thưởng lớn gắn với một
       * cuộc thi phải nạp tiền mới được dự là hình của cả họ kịch bản "mẫu nhí".
       */
      { pattern: '(giải thưởng|hợp đồng|phần thưởng|giải nhất|top\\s*1)[^.]{0,24}\\d+\\s*(triệu|tỷ|tỉ)', scope: 'any' },
      { pattern: 'điểm thưởng[^.]{0,55}(đổi|nhận)[^.]{0,30}miễn phí', scope: 'khong_canh_bao' },
      { pattern: 'điểm thưởng\\s+(sắp\\s+)?hết hạn[^.]{0,44}(đổi|nhận)[^.]{0,24}(tại|qua)', scope: 'khong_canh_bao' },
      { pattern: 'điểm thưởng\\s+(sắp\\s+)?hết hạn', scope: 'khong_canh_bao' },
      { pattern: 'đổi\\s+(quà|thưởng)\\s+ngay', scope: 'khong_canh_bao' },
      { pattern: 'may mắn\\s+(trúng|nhận)\\s+(thưởng|giải|phần quà|quà)', scope: 'khong_canh_bao' },
    ],
    /**
     * Quảng cáo sức khoẻ thần kỳ — xem registry. `(?<!nào\s)`: "không có thuốc
     * NÀO chữa được mọi bệnh" là lời khuyên, không phải lời quảng cáo.
     */
    MAN_HEALTH_MIRACLE_CLAIM: [
      { pattern: '(?<!nào\\s)(chữa|trị)\\s*(khỏi|dứt điểm|tận gốc|được)?\\s*(mọi|nhiều|bách|hàng chục|trăm|các loại|đủ loại)\\s*(bệnh|loại bệnh|chứng)', scope: 'action' },
      { pattern: '(thần dược|tiên dược|thuốc thần|thuốc tiên)', scope: 'action' },
      { pattern: '(khỏi|dứt|hết)\\s*(hẳn|hoàn toàn|dứt điểm|vĩnh viễn)\\s*(bệnh\\s*)?(tiểu đường|ung thư|xương khớp|huyết áp|tai biến|gout|gút|thoái hoá|thoái hóa)', scope: 'action' },
      { pattern: '(không cần|bỏ|ngừng|thay)\\s*(uống\\s*)?(thuốc tây|thuốc bác sĩ|thuốc bệnh viện|thuốc điều trị)', scope: 'action' },
    ],
    MAN_SCARCITY_PRESSURE: [
      { pattern: '(chỉ còn|còn duy nhất|số lượng có hạn|suất cuối)[^.]{0,30}(hôm nay|trong ngày|tối nay|\\d+\\s*(suất|phút|giờ))', scope: 'any' },
      { pattern: '(giữ (chỗ|suất)|đặt cọc)[^.]{0,24}(ngay|hôm nay|trong ngày)[^.]{0,20}(kẻo|nếu không|mai là)', scope: 'action' },
      { pattern: '(giữ\\s+(xe|phòng|chỗ)|cọc\\s+ngay)[^.]{0,24}(không|kẻo)\\s+(khách khác|người khác)\\s+(thuê|đặt|lấy)\\s*mất', scope: 'khong_canh_bao' },
      { pattern: '(sắp\\s+cháy phòng|cháy phòng)[^.]{0,30}(cọc|giữ phòng|chuyển khoản)', scope: 'khong_canh_bao' },
      { pattern: '(cọc|đặt cọc|giữ phòng)[^.]{0,30}(sắp\\s+cháy phòng|cháy phòng)', scope: 'khong_canh_bao' },
    ],
    OFF_TASK_PREPAY: [
      { pattern: '(nhiệm vụ|đơn hàng|chốt đơn)[^.]{0,40}(nạp|ứng|đặt cọc|chuyển)', scope: 'action' },
      /* "nạp tiền mua lượt vote cho bé" — cuộc thi ảnh mẫu nhí, bộ 100 kịch bản. */
      { pattern: '(nạp|mua|chuyển)[^.]{0,24}(lượt|vote|bình chọn)\\b', scope: 'action' },
      { pattern: '(nạp|ứng)[^.]{0,30}(làm nhiệm vụ|hoàn thành nhiệm vụ|nâng (gói|cấp)|rút (được|về))', scope: 'action' },
      { pattern: '(nạp|đóng)[^.]{0,20}(deposit|vốn)[^.]{0,30}(wallet|rút cả gốc lẫn lãi|phí mở băng|unlock commission)', scope: 'action' },
      { pattern: 'nhiệm vụ\\s+(like|share|chia sẻ|xem video|thả tim)(\\s+(và|&)\\s+(like|share|chia sẻ))?[^.]{0,44}(hoa hồng|nhận\\s+\\d)', scope: 'khong_canh_bao' },
      { pattern: '(xỏ vòng|xỏ hạt|gấp phong bì|dán tem)[^.]{0,36}tại nhà', scope: 'khong_canh_bao' },
      { pattern: 'làm\\s+(vài\\s+)?nhiệm vụ\\s+(video|online)[^.]{0,30}(thưởng|hoa hồng)', scope: 'khong_canh_bao' },
      { pattern: '(xem phim|xem video)[^.]{0,24}(ai|giải trí|ngắn)?[^.]{0,16}(vừa\\s+)?kiếm tiền', scope: 'khong_canh_bao' },
      { pattern: '(nạp|đóng|chuyển)[^.]{0,24}(tham gia\\s+(dự án|nhiệm vụ)|dự án hợp tác)', scope: 'action' },
      { pattern: '(phí kích hoạt|nạp|đóng)[^.]{0,30}(gói ai|ai livestream|kiếm hoa hồng hàng ngày)', scope: 'action' },
      { pattern: '(nạp|đóng|chuyển)[^.]{0,24}(đặt đơn hàng|chốt đơn)[^.]{0,24}(hoa hồng|kiếm tiền)', scope: 'action' },
      { pattern: '(mua hàng ảo|đặt thêm\\s*\\d*\\s*đơn hàng)[^.]{0,40}(hoàn tiền|hoa hồng|lỗi|rút)', scope: 'action' },
      { pattern: '(sai cú pháp|sai thao tác|lỗi hệ thống|đóng băng|treo vốn)[^.]{0,36}(nạp thêm|chuyển thêm|làm lại đơn|bù đơn)', scope: 'action' },
      { pattern: '(tăng hạn mức rút|phí mở khóa rút|thuế thu nhập cá nhân)[^.]{0,30}(trước khi rút|mới rút được)', scope: 'action' },
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
