'use strict';
/**
 * LocalePack en-US — §6.12.
 *
 * CHỈ DỮ LIỆU. Không trọng số, không ngưỡng, không logic override.
 * Pack được THÊM cue phát hiện; KHÔNG được hạ mức rủi ro hay tắt một direct
 * signal toàn cục.
 *
 * Tên tổ chức (IRS/HMRC/ATO) chỉ là CUE CHO LỜI TỰ XƯNG DANH TÍNH — không phải
 * bằng chứng hợp pháp, cũng không phải bằng chứng lừa đảo.
 * Tên app thanh toán (Venmo, Zelle) là TỪ VỰNG, không phải tín hiệu rủi ro.
 */

module.exports = {
  locale: 'en-US',
  language: 'en',
  localePackVersion: 'en-US@1.0.0',
  supportedCountryProfiles: ['US', 'GB', 'AU', 'SG', 'GLOBAL'],

  // { SIGNAL_ID: [ { pattern, scope } ] } — pattern là nguồn regex, khớp trên
  // chuỗi đã chuẩn hoá (thường, contraction đã mở, dấu câu còn nguyên).
  directPatterns: {
    CRED_OTP_SHARE: [
      /*
       * ⚠️ HAI LỐI VIẾT, MẪU CŨ CHỈ CÓ MỘT.
       *   ra lệnh : "Read out the one-time passcode we just sent"
       *   kể lại  : "he asked me to read the code from the text message"
       * Đo bộ 200: cả hai ca ngân hàng dạng này đều được 0 điểm.
       */
      { pattern: '\\b(read|tell|give|send|share)\\b[^.]{0,26}\\b(the )?(code|otp|passcode|pin)\\b', scope: 'any' },
      { pattern: '\\b(code|otp|passcode)\\b[^.]{0,30}\\b(we|i) (just )?(sent|texted|messaged)\\b', scope: 'any' },
      { pattern: '\\basked (me|you|him|her)\\b[^.]{0,30}\\b(code|otp|passcode|pin)\\b', scope: 'any' },
      { pattern: '(send|give|read|share|provide|tell|text)\\b(\\s+(me|us|him|her))?\\b[^.]{0,32}\\b(otp|one[- ]time (code|password)|verification code|security code|six[- ]digit code)', scope: 'action' },
      { pattern: '\\b(otp|verification code)\\b[^.]{0,24}\\b(you just received|we (just )?sent)', scope: 'action' },
    ],
    CRED_PASSWORD_PIN: [
      { pattern: '(send|give|tell|share|provide|confirm)\\b[^.]{0,26}\\b(password|pin|passcode)\\b', scope: 'action' },
    ],
    CRED_CARD_SECRET: [
      { pattern: '\\b(confirm|verify|update|provide|give)\\b[^.]{0,26}\\b(card|bank|account|payment) details\\b', scope: 'any' },
      { pattern: '\\b(card|account) (number|details)\\b[^.]{0,30}\\b(to|so we can|for)\\b[^.]{0,26}\\b(receive|release|process|confirm)\\b', scope: 'any' },
      { pattern: '\\b(cvv|cvc|card number|expiry date)\\b', scope: 'action' },
    ],
    CRED_BANK_LOGIN: [
      { pattern: '\\bscan\\b[^.]{0,20}\\bqr\\b[^.]{0,40}\\b(confirm|verify|account|receive|payment)\\b', scope: 'any' },
      { pattern: '\\bqr code\\b[^.]{0,40}\\b(login|log in|sign in|banking|account)\\b', scope: 'any' },
      { pattern: '\\blog ?in\\b[^.]{0,16}\\b(here|now|at|via|through)\\b', scope: 'any' },
      { pattern: '\\b(verify|confirm|reactivate|unlock)\\b[^.]{0,26}\\b(your )?(account|online banking|access)\\b[^.]{0,26}\\b(here|now|link|within)\\b', scope: 'any' },
      // "log into" — nhánh `in` khớp trước rồi `\b` trượt vì sau `in` là `t`.
      // Phải để nhánh DÀI trước nhánh ngắn.
      { pattern: 'log ?(into|onto|in|on)\\b[^.]{0,30}\\b(bank|banking|account)\\b', scope: 'action' },
      { pattern: '\\b(your )?(bank|banking) (login|credentials|username)\\b', scope: 'action' },
    ],
    FIN_TRANSFER_REQUEST: [
      /*
       * ĐÒI TIỀN KHÔNG KÈM SỐ. Đo trên bộ 200: ca điện lực được 15 điểm, thiếu đúng
       * 5 điểm, chỉ vì "Pay now to avoid disconnection" không có con số nên
       * không mẫu nào coi là đòi tiền. Đòi CHI TRẢ + SỨC ÉP THẮNG, không lấy mỗi "pay".
       */
      { pattern: '\\b(pay|settle|clear)\\b[^.]{0,20}\\b(now|today|immediately|within|before)\\b[^.]{0,30}\\b(avoid|or|otherwise|prevent)\\b', scope: 'any' },
      { pattern: '\\b(pay|settle)\\b[^.]{0,14}\\b(the )?(fee|charge|fine|bill|balance|deposit)\\b[^.]{0,20}\\b(now|today|immediately)\\b', scope: 'any' },
      /*
       * ⚠️ TIẾNG ANH VIẾT SỐ TIỀN TRẦN, KHÔNG KÈM ĐƠN VỊ.
       * Các mẫu cũ đòi `vnd|dong|million|k|m` hoặc dấu `$` — hợp với tiếng Việt
       * ("chuyển 50 triệu") nhưng tin nhắn tiếng Anh viết "send 2,000 to this
       * account". Đo trên bộ 200: đây là mẫu hụt nhiều ca nhất.
       * Vẫn đòi ĐỘNG TỪ CHUYỂN + SỐ, không lấy mỗi con số.
       */
      { pattern: '\\b(send|transfer|wire|remit|deposit|pay)\\b[^.]{0,24}\\b[\\d][\\d,.]{2,}\\b', scope: 'action' },
      { pattern: '\\b(send|transfer|wire|pay)\\b[^.]{0,30}\\b(to|into)\\b[^.]{0,24}\\b(this|that|the following|our) (account|number)\\b', scope: 'action' },
      { pattern: '\\btransfer\\b[^.]{0,40}\\b(to|into)\\b', scope: 'action' },
      { pattern: '\\btransfer\\b[^.]{0,24}\\b(money|funds)\\b', scope: 'action' },
      { pattern: '\\b(send|wire|move)\\b[^.]{0,26}\\b(the )?(money|funds|\\$\\s?[\\d,]+)', scope: 'action' },
      { pattern: '\\bsend\\b[^.]{0,14}\\$\\s?[\\d,]+', scope: 'action' },
      /**
       * ⚠️ SỐ TIỀN VIẾT TRẦN, KHÔNG CÓ KÝ HIỆU TIỀN TỆ — THÊM 19/8/2026.
       *
       * Bốn mẫu trên đòi chữ "money/funds" hoặc dấu `$`. Nhưng tin nhắn lừa
       * đảo nhắm vào người Việt, dù viết bằng tiếng Anh, gần như luôn ghi số
       * trần: "top up 1,200,000". Không đồng, không đô, không chữ "money".
       *
       * Đo được: ca `task-prepay` bật đúng OFF_TASK_PREPAY và MAN_URGENCY
       * (10+7=17 điểm) nhưng THIẾU FIN_TRANSFER_REQUEST nên không chạm ngưỡng
       * 20 — trong khi bản tiếng Việt CÙNG NỘI DUNG bật đủ ba tín hiệu và ra
       * CAO. Cùng một vụ lừa, hai ngôn ngữ hai kết quả: đó là lỗ, không phải
       * khác biệt văn hoá.
       *
       * ⚠️ CHỈ BA ĐỘNG TỪ HẸP, và số phải từ SÁU chữ số. `send` cố ý không có
       * trong danh sách: "send me 3 photos" là câu bình thường, còn số điện
       * thoại mười chữ số hay đi sau "call"/"text" chứ không sau "top up".
       * Dấu phân cách nghìn đã bị `chuanHoa()` gom trước khi so, nên
       * "1,200,000" tới đây là "1200000".
       */
      { pattern: '\\b(top ?up|deposit|transfer)\\b[^.]{0,20}\\b\\d{6,}\\b', scope: 'action' },
      { pattern: '\\b(transfer|send|deposit|top ?up|pay|remit|wire)\\b[^.]{0,24}\\b\\d+\\s*(vnd|dong|million|k|m)\\b', scope: 'action' },
    ],
    FIN_SAFE_ACCOUNT: [
      /*
       * ⚠️ MỘT CHỮ CHÈN VÀO GIỮA LÀM TRƯỢT CẢ MẪU. Đo 20/8/2026:
       *   "transfer to a safe account"       → bắt được
       *   "transfer to a safe bank account"  → TRƯỢT
       * Chỉ vì chữ "bank" nằm giữa hai từ. Cho phép một chữ đệm tuỳ ý.
       */
      { pattern: '\\b(safe|secure|protected|holding)( \\w+)? (account|wallet)\\b', scope: 'action' },
    ],
    FIN_CRYPTO_TRANSFER: [
      { pattern: '\\b(bitcoin|btc|crypto|cryptocurrency|ethereum|usdt)\\b', scope: 'action' },
    ],
    FIN_RECOVERY_FEE: [
      { pattern: '\\b(unlock|release|processing|clearance|admin|activation) fee\\b', scope: 'action' },
      { pattern: '\\bfee\\b[^.]{0,34}\\b(refund|recover|get your money back|released)', scope: 'action' },
    ],
    FIN_GIFT_CARD_PAYMENT: [
      /*
       * Lối kể lại: "he told me to go to the shop and buy vouchers, then
       * photograph the codes and send them to him." Không có chữ "gift card".
       */
      /*
       * ⚠️ TÁCH LÀM HAI VÌ `scope: 'any'` KHÔNG ĐƯỢC KHUNG CẢNH BÁO CHE.
       *
       * Đo 20/8/2026: mẫu này viết ở `any` và lập tức bắt oan đúng câu kinh điển
       * của Phụ lục C — "The FTC warns that scammers may ask you to buy gift
       * cards." Khung `warning_education` CHỈ vô hiệu hoá mẫu `scope: 'action'`;
       * mẫu `any` bắn bất kể đoạn đó là lời khuyên hay lời sai khiến.
       *
       * Nên: lối RA LỆNH để `action` (khung cảnh báo che được), còn lối KỂ LẠI
       * giữ `any` nhưng phải đòi "told/asked ai đó" — câu khuyên không viết vậy.
       */
      { pattern: '\\b(buy|purchase|get)\\b[^.]{0,26}\\b(voucher|vouchers|gift cards?|top ?up cards?)\\b', scope: 'action' },
      { pattern: '\\b(told|asked|instructed)\\b[^.]{0,16}\\b(me|us|him|her)\\b[^.]{0,30}\\b(buy|purchase|get)\\b[^.]{0,24}\\b(voucher|gift cards?)\\b', scope: 'any' },
      { pattern: '\\b(voucher|gift card)s?\\b[^.]{0,40}\\b(code|number|photo|photograph|scratch)\\b', scope: 'any' },
      { pattern: '\\bgift ?cards?\\b', scope: 'action' },
    ],
    FIN_PRECIOUS_METAL_PURCHASE: [
      { pattern: '\\b(gold|silver) (bars?|bullion|coins?)\\b', scope: 'action' },
    ],
    FIN_CASH_COURIER: [
      { pattern: '\\b(only accepted?|only takes?|cash only)\\b[^.]{0,30}\\b(cash|transfer)\\b', scope: 'any' },
      { pattern: '\\b(no receipt|without a receipt)\\b', scope: 'any' },
      /*
       * Hai kịch bản đã có ở Việt Nam và đang lan sang tin tiếng Anh:
       *   · người tới tận nhà "thu giữ thẻ để bảo quản"
       *   · nhờ nhận tiền vào tài khoản rồi chuyển tiếp (money mule)
       */
      { pattern: '\\b(courier|driver|officer|colleague)\\b[^.]{0,40}\\b(collect|pick up|come for)\\b[^.]{0,26}\\b(card|cards|cash|money)\\b', scope: 'any' },
      { pattern: '\\b(withdraw|take out)\\b[^.]{0,30}\\b(cash|money)\\b[^.]{0,40}\\b(hand|give|pass)\\b', scope: 'any' },
      { pattern: '\\b(receive|accept)\\b[^.]{0,30}\\b(payment|money|funds)\\b[^.]{0,40}\\b(forward|pass|send) (it|them|on)\\b', scope: 'any' },
      { pattern: '\\b(collect|pick up|courier)\\b[^.]{0,40}\\b(cash|money)\\b', scope: 'action' },
      { pattern: '\\bcome to your (home|house|address)\\b[^.]{0,40}\\b(cash|money|collect)', scope: 'action' },
    ],
    DEV_REMOTE_CONTROL_APP: [
      { pattern: '\\b(anydesk|teamviewer|ultraviewer|quicksupport|airdroid)\\b', scope: 'action' },
      { pattern: '\\bremote (control|desktop|access|support) (app|software|tool)\\b', scope: 'action' },
    ],
    DEV_INSTALL_APK_UNKNOWN: [
      { pattern: '\\binstall\\b[^.]{0,40}\\b(apk|from (this|the|my) link|outside the (play )?store)', scope: 'action' },
    ],
    DEV_SCREEN_SHARE_BANKING: [
      { pattern: '\\b(share|mirror|cast)\\b[^.]{0,16}\\bscreen\\b[^.]{0,44}\\b(bank|banking|account)\\b', scope: 'action' },
      { pattern: '\\bscreen ?shar(e|ing)\\b[^.]{0,40}\\b(bank|banking)\\b', scope: 'action' },
    ],
    /*
     * ⚠️ BA MẪU, MỘT KHÓA. Ngày 19/8/2026 chính khóa này bị khai HAI LẦN trong
     * cùng một object — JavaScript không báo lỗi, nó lặng lẽ lấy bản sau và vứt
     * bản trước. Mẫu "accessibility service" biến mất trong khi toàn bộ test vẫn
     * xanh, vì test chỉ hỏi "khóa này có tồn tại không". Chỉ cảnh báo của esbuild
     * lúc dựng mới nói ra — và cảnh báo thì rất dễ lướt qua.
     * Thêm mẫu thì thêm vào ĐÂY, đừng khai một khóa mới cùng tên.
     */
    DEV_ACCESSIBILITY_PERMISSION: [
      { pattern: '\\baccessibility (service|permission|setting)\\b', scope: 'action' },
      { pattern: '\\b(enable|allow|turn on|grant)\\b[^.]{0,24}\\b(accessibility|assistive)\\b', scope: 'action' },
      { pattern: '\\b(allow|accept|grant)\\b[^.]{0,20}\\b(all|every)\\b[^.]{0,16}\\bpermissions?\\b', scope: 'action' },
    ],
    ID_AUTHORITY_IMPERSONATION: [
      { pattern: '\\bthis is (officer|detective|inspector|sergeant|agent)\\b', scope: 'any' },
      { pattern: '\\b(an|the) officer will\\b', scope: 'any' },
      { pattern: '\\bfrom the (police|federal|ministry|department of)\\b', scope: 'any' },
      /*
       * ⚠️ BẮT CẢ DẠNG NGƯỜI DÙNG KỂ LẠI, KHÔNG CHỈ DẠNG KẺ LỪA TỰ XƯNG.
       *
       * Ba mẫu trên đều bắt lời của KẺ LỪA ("this is officer…"). Nhưng bác không
       * dán nguyên lời thoại vào — bác KỂ LẠI: "police told me…". Đo 20/8/2026,
       * người dùng gõ "police told me bank 50$" và nhận về KHÔNG một tín hiệu
       * nào. Đó mới là cách người ta thật sự gõ vào ô tìm kiếm.
       *
       * ⚠️ VẪN ĐÒI CẤU TRÚC, KHÔNG LẤY MỖI CHỮ "police". "Police arrest three in
       * fraud ring" là tin báo, không phải việc của bác — cùng bài học với cụm
       * 'cong an' ở pack tiếng Việt. Phải có ai đó nói VỚI một người.
       */
      { pattern: '\\b(police|officer|investigator|detective|prosecutor)\\b[^.]{0,24}\\b(told|called|contacted|says|said)\\b[^.]{0,16}\\b(me|us|you|my)\\b', scope: 'any' },
    ],
    ID_TAX_BENEFIT_IMPERSONATION: [
      { pattern: '\\b(irs|hmrc|ato)\\b', scope: 'any' },
      { pattern: '\\btax (office|department|debt|bureau)\\b', scope: 'any' },
    ],
    ID_TECH_SUPPORT_IMPERSONATION: [
      { pattern: '\\b(pop.?up|popup|message)\\b[^.]{0,34}\\b(virus|infected|malware)\\b', scope: 'any' },
      { pattern: '\\b(take|took|taking) control\\b[^.]{0,24}\\b(of )?(my |your )?(screen|computer|laptop|device)\\b', scope: 'any' },
      { pattern: '\\btech(nical)? support\\b', scope: 'any' },
      { pattern: '\\b(microsoft|apple|google) (support|technician|security)\\b', scope: 'any' },
    ],
    ID_BANK_IMPERSONATION: [
      { pattern: '\\bbank (security|fraud) (team|department|officer)\\b', scope: 'any' },
      { pattern: '\\bthis is\\b[^.]{0,22}\\bbank\\b', scope: 'any' },
    ],
    // §9.2 — mạo danh chính Khoan Đã. Tên thương hiệu giữ nguyên tiếng Việt ở
    // mọi locale (§4.1), nên cue cũng phải bắt được nó trong câu tiếng Anh.
    ID_KHOAN_DA_IMPERSONATION: [
      { pattern: '(agent|staff|support|team|representative)\\b[^.]{0,16}\\bkhoan da\\b', scope: 'any' },
      { pattern: '\\bi am (from |with )?khoan da\\b', scope: 'any' },
      { pattern: '\\bkhoan da\\b[^.]{0,20}\\b(asks?|requires?|needs?) you to\\b', scope: 'any' },
    ],
    ID_FAMILY_IMPERSONATION: [
      /*
       * ⚠️ "SỐ MỚI" + "MÁY HỎNG" LÀ DẤU HIỆU MẠNH NHẤT CỦA HỌ NÀY, và mẫu cũ
       * không có. Kẻ giả danh con cháu luôn phải giải thích vì sao số lạ.
       * Mẫu cũ đòi "my daughter… asked" (bác kể) hoặc "this is your son" — bỏ sót
       * dạng phổ biến nhất: gọi thẳng "Mum," rồi vào việc.
       */
      { pattern: '\\b(this is|it is) my new number\\b', scope: 'any' },
      { pattern: '\\bmy (phone|mobile) (is|got) (broken|lost|stolen|damaged)\\b', scope: 'any' },
      { pattern: '\\b(using|from) (this|a) (new )?(number|account)\\b[^.]{0,40}\\b(send|transfer|pay|help)\\b', scope: 'any' },
      { pattern: '^\\s*(hi |hello )?(mum|mom|dad|grandma|grandad|granny|nan)\\b[^.]{0,80}\\b(send|transfer|pay|money|deposit)\\b', scope: 'any' },
      { pattern: '\\b(mum|mom|dad|grandma|grandad)\\b[^.]{0,40}\\b(do not|don.t) tell\\b', scope: 'any' },
      { pattern: '\\bmy (daughter|son|mum|mom|dad|father|mother)\\b[^.]{0,20}\\b(asked|needs|wants|said)\\b', scope: 'any' },
      { pattern: '\\b(it is|this is) (me|your) (son|daughter|mum|mom|dad)\\b', scope: 'any' },
    ],
    MAN_SECRECY: [
      { pattern: '\\bdo not (tell|mention|discuss|inform)\\b', scope: 'action' },
      { pattern: '\\bkeep (this|it|the matter)\\b[^.]{0,16}\\b(confidential|secret|between us|to yourself)\\b', scope: 'action' },
      { pattern: '\\btell (no one|nobody)\\b', scope: 'action' },
    ],
    MAN_FEAR_THREAT: [
      /*
       * "You have 15 minutes to comply" và "the call is being recorded for the
       * investigation" là hai câu ép quen thuộc, mẫu cũ không có câu nào.
       */
      { pattern: '\\b\\d{1,3} (minutes?|hours?)\\b[^.]{0,24}\\b(to comply|to pay|to respond|or)\\b', scope: 'any' },
      { pattern: '\\b(the )?(call|conversation) (is|was) being recorded\\b', scope: 'any' },
      { pattern: '\\b(escalated|prosecuted|detained|arrested|charged)\\b[^.]{0,30}\\b(if|unless|otherwise)\\b', scope: 'any' },
      { pattern: '\\b(if|unless)\\b[^.]{0,40}\\b(you will be|we will)\\b[^.]{0,24}\\b(arrested|detained|prosecuted|charged|cut off)\\b', scope: 'any' },
      { pattern: '\\b(will be|face|facing) arrest(ed)?\\b', scope: 'any' },
      { pattern: '\\b(money laundering|criminal charges?|arrest warrant|legal action)\\b', scope: 'any' },
      { pattern: '\\b(freeze|frozen|suspend|suspended)\\b[^.]{0,20}\\baccount\\b', scope: 'any' },
    ],
    MAN_URGENCY: [
      { pattern: '\\b(immediately|right away|urgent(ly)?|within \\d+ (minutes?|hours?))\\b', scope: 'action' },
      { pattern: '\\b(now|today)\\b', scope: 'action' },
    ],
    MAN_KEEP_CALL_ACTIVE: [
      { pattern: '\\b(please )?hold\\b', scope: 'any' },
      { pattern: '\\bstay on the (line|phone|call)\\b', scope: 'any' },
      { pattern: '\\bdo not hang up\\b', scope: 'any' },
    ],
    OFF_INVESTMENT_GUARANTEE: [
      /*
       * Lối kể lại: "A man I met online showed me his trading profits and told me
       * to put 5,000 into the platform he uses." Không có chữ "guaranteed".
       */
      { pattern: '\\b(showed|shows)\\b[^.]{0,24}\\b(profits?|returns?|earnings?)\\b[^.]{0,40}\\b(put|invest|deposit|transfer)\\b', scope: 'any' },
      { pattern: '\\b(move|put|invest)\\b[^.]{0,26}\\b(my |your )?(pension|savings|money)\\b[^.]{0,30}\\b(platform|his|her|their|the app)\\b', scope: 'any' },
      { pattern: '\\b(trading|investment) (group|mentor|bot|platform|signals)\\b', scope: 'any' },
      { pattern: '\\bguaranteed (return|profit|income)\\b', scope: 'any' },
    ],
    /**
     * OFF_ADVANCE_FEE và OFF_TASK_PREPAY — THÊM 19/8/2026, LẤP ĐÚNG LỖ ĐÃ LẤP
     * BÊN vi-VN.
     *
     * Đo được trên bộ thử tiếng Anh 10 tình huống: tầng luật bỏ sót đúng ca
     * `task-prepay` ("top up 1,200,000 for the final task and you can withdraw
     * both your capital and the bonus") — cùng họ kịch bản với
     * `viec-nhe-luong-cao` bên tiếng Việt, và cùng một nguyên nhân: hai tín
     * hiệu này KHÔNG CÓ MẪU NÀO ở pack này.
     *
     * §6.10 nói tầng luật phải đứng một mình được. Một họ kịch bản phổ biến mà
     * pack ngôn ngữ này câm hoàn toàn là lỗ, không phải lựa chọn thiết kế.
     */
    /**
     * ══════ ĐỐI XỨNG VỚI vi-VN — THÊM 19/8/2026 ══════
     *
     * Chín tín hiệu này vừa được thêm cho tiếng Việt sau khi đo bộ 100. Test
     * `§6.10 · hai pack ngôn ngữ phủ cùng một tập tín hiệu` đỏ ngay khi chỉ
     * thêm một bên — và nó đỏ ĐÚNG: một kịch bản mà tiếng Việt bắt được còn
     * tiếng Anh thì không nghĩa là một nửa người dùng không được bảo vệ.
     */
    MAN_EXTORTION_MEDIA_THREAT: [
      { pattern: '\\b(have|got|holding)\\b[^.]{0,26}\\b(photos?|videos?|clips?|images?)\\b[^.]{0,20}\\b(private|intimate|of you)\\b', scope: 'any' },
      { pattern: '\\b(send|post|share|leak)\\b[^.]{0,30}\\b(to|on)\\b[^.]{0,24}\\b(contacts|friends|family|facebook|everyone)\\b', scope: 'any' },
    ],
    MAN_ISOLATION: [
      /*
       * "Do not hang up" và "stay on the line" là hai câu định nghĩa của kịch bản
       * giữ máy hàng giờ — cùng thủ đoạn mà `MAN_KEEP_CALL_ACTIVE` mô tả, nhưng
       * viết ở dạng mệnh lệnh thẳng. Mẫu cũ không có câu nào trong hai câu này.
       */
      { pattern: '\\b(do not|don.t)\\b[^.]{0,14}\\bhang up\\b', scope: 'any' },
      { pattern: '\\bstay on the (line|phone)\\b', scope: 'any' },
      { pattern: '\\b(kept|keep|keeping) (me|you|him|her)\\b[^.]{0,20}\\bon the (phone|line)\\b', scope: 'any' },
      { pattern: '\\b(do not|don.t) (discuss|mention|speak about) this\\b', scope: 'any' },
      { pattern: '\\b(do not|don.t)\\b[^.]{0,16}\\b(call|text|contact|ask)\\b[^.]{0,20}\\b(back|anyone|dad|mum|mom|your)\\b', scope: 'action' },
      { pattern: '\\bcome alone\\b', scope: 'action' },
    ],
    ID_UTILITY_IMPERSONATION: [
      /*
       * ⚠️ CÙNG LỖI TRẬT TỰ TỪ ĐÃ ĐO 20/8/2026:
       *   "They will cut off the electricity…"  → bắt được
       *   "Your electricity will be cut off…"   → TRƯỢT
       * Neo vào CẶP KHÁI NIỆM (điện + cắt), không vào thứ tự xuất hiện.
       */
      { pattern: '\\b(electricity|power|water|energy|gas)\\b[^.]{0,44}\\b(cut off|cut|disconnect|disconnected|arrears|unpaid|overdue)\\b', scope: 'any' },
      { pattern: '\\b(bill|account)\\b[^.]{0,30}\\b(unpaid|in arrears|overdue)\\b[^.]{0,40}\\b(pay|settle|now|today)\\b', scope: 'any' },
      { pattern: '\\b(electricity|power|water) (company|department|board)\\b[^.]{0,40}\\b(overdue|unpaid|cut off|disconnect)', scope: 'any' },
      { pattern: '\\b(cut off|disconnect)\\b[^.]{0,24}\\b(power|electricity|water)\\b', scope: 'any' },
    ],
    ID_DELIVERY_IMPERSONATION: [
      /*
       * Mẫu cũ chỉ bắt "parcel … held/customs". Nhưng thủ đoạn nằm ở chỗ ĐÒI
       * TIỀN hoặc ĐÒI THÔNG TIN, và câu thật hay đảo trật tự ("Customs is holding
       * a parcel of yours") — cùng lỗi trật tự từ với điện lực.
       */
      { pattern: '\\b(parcel|package|shipment|delivery)\\b[^.]{0,44}\\b(fee|charge|customs|duty|pay|settle)\\b', scope: 'any' },
      { pattern: '\\bcustoms\\b[^.]{0,40}\\b(parcel|package|item|shipment)\\b', scope: 'any' },
      { pattern: '\\b(redelivery|re-delivery)\\b', scope: 'any' },
      { pattern: '\\b(parcel|package|shipment)\\b[^.]{0,36}\\b(held|on hold|customs|detained|stuck)\\b', scope: 'any' },
    ],
    ID_EMPLOYER_JOB_IMPERSONATION: [
      { pattern: '\\b(recruiting|hiring|looking for)\\b[^.]{0,40}\\b(part.?time|work from home|collaborators?|helpers?)\\b', scope: 'any' },
    ],
    OFF_ROMANCE_EMERGENCY: [
      /*
       * Mẫu cũ đòi (met|chatting) rồi (online|never met) rồi (send) THEO ĐÚNG
       * THỨ TỰ ĐÓ. Câu thật: "I have never met you in person but I need you to
       * wire 3,000" — "never met" đứng trước, mẫu trượt.
       */
      { pattern: '\\bnever met\\b[^.]{0,70}\\b(send|transfer|wire|pay|money)\\b', scope: 'any' },
      { pattern: '\\b(met|know) (him|her|them|someone)\\b[^.]{0,24}\\bonline\\b[^.]{0,60}\\b(money|send|transfer)\\b', scope: 'any' },
      { pattern: '\\b(cannot|can.t) access\\b[^.]{0,26}\\b(my )?(account|card|funds)\\b[^.]{0,50}\\b(send|receive|forward|transfer)\\b', scope: 'any' },
      { pattern: '\\b(met|talking|chatting)\\b[^.]{0,26}\\b(online|never met)\\b[^.]{0,40}\\b(send|transfer|wire)\\b', scope: 'any' },
      { pattern: '\\b(my love|darling|honey|sweetheart)\\b[^.]{0,60}\\b(send|transfer|pay|wire)\\b', scope: 'any' },
    ],
    OFF_PRIZE_GIFT: [
      /*
       * "You have won … pay the shipping fee to claim" — cấu trúc THẮNG rồi PHẢI
       * TRẢ. Mẫu cũ đòi (won|prize) đứng gần (fee|pay) trong 40 ký tự; câu thật
       * tách hai vế ra hai câu nên trượt.
       */
      { pattern: '\\b(you have won|congratulations)\\b', scope: 'any' },
      { pattern: '\\b(claim|receive|release)\\b[^.]{0,20}\\b(your )?(prize|reward|winnings|gift)\\b', scope: 'any' },
      { pattern: '\\b(lucky (winner|draw)|giveaway|customer draw)\\b', scope: 'any' },
      { pattern: '\\b(won|winner|prize|reward)\\b[^.]{0,40}\\b(fee|pay|transfer|deposit)\\b', scope: 'any' },
    ],
    MAN_SCARCITY_PRESSURE: [
      { pattern: '\\b(only|last|limited)\\b[^.]{0,26}\\b(spot|slot|place|today|tonight|hours?)\\b', scope: 'any' },
      { pattern: '\\b(reserve|secure|hold)\\b[^.]{0,20}\\b(your )?(spot|slot|place)\\b[^.]{0,20}\\b(today|now|tonight)\\b', scope: 'action' },
    ],
    OFF_ADVANCE_FEE: [
      /*
       * Hai họ dùng chung một cấu trúc: TRẢ TRƯỚC rồi mới được thứ mình muốn.
       *   thuê nhà : "send the deposit today and I will post the keys"
       *   hoàn tiền: "pay the release fee first and the money will be sent"
       */
      { pattern: '\\b(deposit|fee|payment)\\b[^.]{0,40}\\b(before|without)\\b[^.]{0,26}\\b(view|viewing|see|seeing|meet|meeting|inspect|collect)\\b', scope: 'any' },
      { pattern: '\\b(pay|send|transfer)\\b[^.]{0,30}\\b(fee|deposit)\\b[^.]{0,30}\\b(first|upfront|in advance|before)\\b', scope: 'any' },
      { pattern: '\\b(release|processing|clearance|insurance|arrangement|membership) fee\\b', scope: 'any' },
      { pattern: '\\bI (am|will be) abroad\\b[^.]{0,60}\\b(deposit|send|transfer|post)\\b', scope: 'any' },
      /*
       * ⚠️ KHÔNG có `deposit` trần. Cùng bài học với `tạm ứng` bên vi-VN: nó là
       * từ chuẩn của ngân hàng và bệnh viện ("your deposit has been received"),
       * nên phải đi kèm ngữ cảnh trả-trước mới tính.
       */
      { pattern: '\\b(processing|handling|clearance|release|administrative|admin) fee\\b', scope: 'action' },
      { pattern: '\\b(pay|transfer|send)\\b[^.]{0,30}\\b(fee|charge)\\b[^.]{0,30}\\b(first|upfront|in advance|before)\\b', scope: 'action' },
      { pattern: '\\b(pay|transfer|send)\\b[^.]{0,20}\\b(upfront|in advance)\\b', scope: 'action' },
    ],
    OFF_TASK_PREPAY: [
      /*
       * Mẫu cũ đòi chữ "task/mission". Tin thật viết "deposit 200 to activate
       * your account and earn 100 commission every day" — cấu trúc là NỘP TRƯỚC
       * rồi HỨA LỜI, không nhất thiết có chữ "task".
       */
      { pattern: '\\b(deposit|top ?up|pay|put in)\\b[^.]{0,44}\\b(earn|commission|profit|reward|return)\\b', scope: 'any' },
      { pattern: '\\b(earn|make)\\b[^.]{0,20}\\b[\\d][\\d,.]{1,}\\b[^.]{0,24}\\b(a day|per day|daily|every day)\\b', scope: 'any' },
      { pattern: '\\b(work from home|part.?time)\\b[^.]{0,50}\\b(deposit|fee|top ?up|membership)\\b', scope: 'any' },
      { pattern: '\\b(task|order|mission|assignment)s?\\b[^.]{0,40}\\b(top ?up|deposit|prepay|pay in)\\b', scope: 'action' },
      { pattern: '\\b(top ?up|deposit|prepay)\\b[^.]{0,40}\\b(complete|finish|final)\\b[^.]{0,20}\\btask\\b', scope: 'action' },
      { pattern: '\\b(top ?up|deposit)\\b[^.]{0,50}\\bwithdraw\\b[^.]{0,30}\\b(capital|principal|bonus|commission)\\b', scope: 'action' },
    ],
  },

  // Phụ lục C.5 — danh sách tắt VÔ ĐIỀU KIỆN. CỰC HẸP, và phải giữ như vậy.
  // Tiêu chí DUY NHẤT: mỗi cụm phải là cụm CHỈ NGƯỜI DÙNG TỰ NÓI VỀ MÌNH,
  // không phải cụm kẻ lừa đảo dùng được.
  suppressors: {
    FIN_CRYPTO_TRANSFER: ['my own portfolio', 'for myself', 'i decided to invest', 'my own wallet'],
    FIN_GIFT_CARD_PAYMENT: ['as a present', 'for my grandson', 'for my granddaughter', 'birthday present'],
    DEV_REMOTE_CONTROL_APP: ['our it department', 'my company laptop'],
  },

  // Phụ lục C.4 — tắt CÓ ĐIỀU KIỆN. Khác hẳn danh sách trên.
  verifiedChannelSuppressed: ['MAN_KEEP_CALL_ACTIVE'],
  verifiedRelationshipSuppressed: ['ID_FAMILY_IMPERSONATION', 'ID_CONTACT_ACCOUNT_TAKEOVER'],

  institutionTerms: ['irs', 'hmrc', 'ato', 'medicare', 'social security', 'police'],
  paymentTerms: ['venmo', 'zelle', 'paypal', 'cash app', 'wire'],
  credentialTerms: ['otp', 'pin', 'password', 'passcode', 'cvv'],
  deviceTerms: ['anydesk', 'teamviewer', 'screen share', 'accessibility'],
  moneyMoveTerms: ['transfer', 'wire', 'send', 'move funds'],
};
