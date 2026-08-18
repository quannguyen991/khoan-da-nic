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
    DEV_ACCESSIBILITY_PERMISSION: [
      { pattern: '\\baccessibility (service|permission|setting)\\b', scope: 'action' },
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
