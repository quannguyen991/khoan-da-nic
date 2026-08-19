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
      { pattern: '(send|give|read|share|provide|tell|text)\\b(\\s+(me|us|him|her))?\\b[^.]{0,32}\\b(otp|one[- ]time (code|password)|verification code|security code|six[- ]digit code)', scope: 'action' },
      { pattern: '\\b(otp|verification code)\\b[^.]{0,24}\\b(you just received|we (just )?sent)', scope: 'action' },
    ],
    CRED_PASSWORD_PIN: [
      { pattern: '(send|give|tell|share|provide|confirm)\\b[^.]{0,26}\\b(password|pin|passcode)\\b', scope: 'action' },
    ],
    CRED_CARD_SECRET: [
      { pattern: '\\b(cvv|cvc|card number|expiry date)\\b', scope: 'action' },
    ],
    CRED_BANK_LOGIN: [
      // "log into" — nhánh `in` khớp trước rồi `\b` trượt vì sau `in` là `t`.
      // Phải để nhánh DÀI trước nhánh ngắn.
      { pattern: 'log ?(into|onto|in|on)\\b[^.]{0,30}\\b(bank|banking|account)\\b', scope: 'action' },
      { pattern: '\\b(your )?(bank|banking) (login|credentials|username)\\b', scope: 'action' },
    ],
    FIN_TRANSFER_REQUEST: [
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
      { pattern: '\\b(safe|secure|protected|holding) (account|wallet)\\b', scope: 'action' },
    ],
    FIN_CRYPTO_TRANSFER: [
      { pattern: '\\b(bitcoin|btc|crypto|cryptocurrency|ethereum|usdt)\\b', scope: 'action' },
    ],
    FIN_RECOVERY_FEE: [
      { pattern: '\\b(unlock|release|processing|clearance|admin|activation) fee\\b', scope: 'action' },
      { pattern: '\\bfee\\b[^.]{0,34}\\b(refund|recover|get your money back|released)', scope: 'action' },
    ],
    FIN_GIFT_CARD_PAYMENT: [
      { pattern: '\\bgift ?cards?\\b', scope: 'action' },
    ],
    FIN_PRECIOUS_METAL_PURCHASE: [
      { pattern: '\\b(gold|silver) (bars?|bullion|coins?)\\b', scope: 'action' },
    ],
    FIN_CASH_COURIER: [
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
    ],
    ID_TAX_BENEFIT_IMPERSONATION: [
      { pattern: '\\b(irs|hmrc|ato)\\b', scope: 'any' },
      { pattern: '\\btax (office|department|debt|bureau)\\b', scope: 'any' },
    ],
    ID_TECH_SUPPORT_IMPERSONATION: [
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
      { pattern: '\\bmy (daughter|son|mum|mom|dad|father|mother)\\b[^.]{0,20}\\b(asked|needs|wants|said)\\b', scope: 'any' },
      { pattern: '\\b(it is|this is) (me|your) (son|daughter|mum|mom|dad)\\b', scope: 'any' },
    ],
    MAN_SECRECY: [
      { pattern: '\\bdo not (tell|mention|discuss|inform)\\b', scope: 'action' },
      { pattern: '\\bkeep (this|it|the matter)\\b[^.]{0,16}\\b(confidential|secret|between us|to yourself)\\b', scope: 'action' },
      { pattern: '\\btell (no one|nobody)\\b', scope: 'action' },
    ],
    MAN_FEAR_THREAT: [
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
      { pattern: '\\b(do not|don.t)\\b[^.]{0,16}\\b(call|text|contact|ask)\\b[^.]{0,20}\\b(back|anyone|dad|mum|mom|your)\\b', scope: 'action' },
      { pattern: '\\bcome alone\\b', scope: 'action' },
    ],
    ID_UTILITY_IMPERSONATION: [
      { pattern: '\\b(electricity|power|water) (company|department|board)\\b[^.]{0,40}\\b(overdue|unpaid|cut off|disconnect)', scope: 'any' },
      { pattern: '\\b(cut off|disconnect)\\b[^.]{0,24}\\b(power|electricity|water)\\b', scope: 'any' },
    ],
    ID_DELIVERY_IMPERSONATION: [
      { pattern: '\\b(parcel|package|shipment)\\b[^.]{0,36}\\b(held|on hold|customs|detained|stuck)\\b', scope: 'any' },
    ],
    ID_EMPLOYER_JOB_IMPERSONATION: [
      { pattern: '\\b(recruiting|hiring|looking for)\\b[^.]{0,40}\\b(part.?time|work from home|collaborators?|helpers?)\\b', scope: 'any' },
    ],
    OFF_ROMANCE_EMERGENCY: [
      { pattern: '\\b(met|talking|chatting)\\b[^.]{0,26}\\b(online|never met)\\b[^.]{0,40}\\b(send|transfer|wire)\\b', scope: 'any' },
      { pattern: '\\b(my love|darling|honey|sweetheart)\\b[^.]{0,60}\\b(send|transfer|pay|wire)\\b', scope: 'any' },
    ],
    OFF_PRIZE_GIFT: [
      { pattern: '\\b(won|winner|prize|reward)\\b[^.]{0,40}\\b(fee|pay|transfer|deposit)\\b', scope: 'any' },
    ],
    MAN_SCARCITY_PRESSURE: [
      { pattern: '\\b(only|last|limited)\\b[^.]{0,26}\\b(spot|slot|place|today|tonight|hours?)\\b', scope: 'any' },
      { pattern: '\\b(reserve|secure|hold)\\b[^.]{0,20}\\b(your )?(spot|slot|place)\\b[^.]{0,20}\\b(today|now|tonight)\\b', scope: 'action' },
    ],
    OFF_ADVANCE_FEE: [
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
