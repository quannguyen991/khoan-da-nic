'use strict';
/**
 * Phiên bản của từng tầng, để mọi con số eval truy ngược được về đúng bản đã đo.
 *
 * §2B.6: "Report phải in: commit SHA · analysis_version · model · prompt ·
 * registry · rule · dataset version · confusion matrix. THIẾU METADATA THÌ SỐ
 * LIỆU KHÔNG ĐƯỢC DÙNG TRÊN SLIDE."
 *
 * Đổi trọng số / cue bank / ngưỡng ⇒ TĂNG version tương ứng trong cùng commit.
 */
module.exports = {
  ANALYSIS_VERSION: '1.0.0',
  REGISTRY_VERSION: '1.2.0',   // 58 tín hiệu Phụ lục A + MAN_ANALYZER_INJECTION (5/9)
                               // 1.1.0 (24/9/2026): 63 — thêm FIN_MISTAKEN_TRANSFER_REDIRECT,
                               //   FIN_ACCOUNT_OPENING_FOR_OTHERS, CRED_ID_BIOMETRIC_DOCS,
                               //   DEV_SIM_SWAP_ESIM (người dùng duyệt)
                               // 1.2.0 (24/9/2026): 64 — thêm MAN_HEALTH_MIRACLE_CLAIM
  RULE_VERSION: '1.6.0',       // cap nhóm + 26 cộng hưởng + 1 suy ra + 20/45/69, Phụ lục B
                               // 1.6.0 (25/9/2026): CO-01 mở rộng — đòi ĐƯA mã/PIN/thẻ
                               //   cho người khác tự nó là chốt chặn (vẫn 10 chốt chặn);
                               //   4 tổ hợp injection+action, qr+pressure, credential+offer,
                               //   mistakenredirect+transfer; thẻ quà tặng vào FIN_CHUYEN_MANH;
                               //   khung thông báo và cụm tắt (suppressors) có lối thoát khi
                               //   có lệnh trực tiếp phía sau.
                               // 1.4.0 (24/9/2026): thêm task-or-investment+transfer,
                               //   withdrawfee+offer, thirdpartyemergency+transfer,
                               //   fear+isolation+transfer; suy ra prize+advancefee→transfer.
                               //   Cùng commit: khung cảnh báo "không yêu cầu", gỡ che ký tự,
                               //   scope khong_canh_bao, "nếu không" không phải phủ định.
                               // 1.5.0 (24/9/2026): khung tường thuật ("đối tượng", "chiếm đoạt",
                               //   viết tắt tên "bà L."), "tại cổng" ≠ "tải", kênh tinHieuVuViec
                               //   (bộ nhớ vụ việc nối vào giao diện).
                               // 1.1.0 (15/8/2026): thêm offer+transfer,
                               // advancefee+transfer, orgclaim+transfer
                               // 1.2.0 (2/9/2026): thêm credential+manipulation
                               //   — vùng chết "đòi mã + gây áp lực" kẹt ở 44 điểm
                               // 1.3.0 (2/9/2026): thêm extortion+transfer,
                               //   keepcall+fear+transfer, secrecy+isolation+transfer,
                               //   brandmismatch+pressure; coverstory+transfer 10->12
  PROMPT_VERSION: '1.4.0',     // lời nhắc trong llm-extractor.js
                               // 1.4.0 (25/9/2026): CRED_OTP_SHARE — tin CHỨA mã do
                               //   ngân hàng gửi không phải lời ĐÒI mã.
                               // 1.2.0 (24/9/2026): mô tả 4 tín hiệu mới; viết lại
                               //   DEV_INSTALL_APK_UNKNOWN — "cài ứng dụng tôi gửi" /
                               //   "app VNeID, EVN theo link" AI cũng từng bỏ qua.
                               // 1.3.0 (24/9/2026): mô tả MAN_HEALTH_MIRACLE_CLAIM.
                               // 1.1.0 (4/9/2026): viết lại 3 mô tả tín hiệu bị
                               //   bỏ sót nhiều nhất. Đo trên 112 mẫu nguy hiểm
                               //   trượt của lượt 3/9, chạy lại bằng
                               //   deepseek-v4-pro-0813: nó bật thêm
                               //   MAN_COVER_STORY 9 lần (cứu 6),
                               //   FIN_TRANSFER_REQUEST 7 (cứu 6),
                               //   OFF_ADVANCE_FEE 5 (cứu 5 — chuyển 100%).
                               //   Ba mô tả đó là chỗ hụt:
                               //   · OFF_ADVANCE_FEE nói 'nhận được KHOẢN LỚN HƠN',
                               //     nên lừa phí giao hàng (nộp 86k để nhận KIỆN
                               //     HÀNG) nằm ngoài định nghĩa — model làm đúng
                               //     mô tả nên không bật cờ.
                               //   · FIN_TRANSFER_REQUEST đòi 'NGAY LÚC NÀY',
                               //     một điều kiện không thuộc bản chất tín hiệu.
                               //   · MAN_COVER_STORY quá trừu tượng để áp được.
                               // ⚠️ Nâng số này làm TOÀN BỘ eval/cache vô hiệu.
                               //   Đó là chủ ý: lời nhắc khác là cấu hình khác.
};
