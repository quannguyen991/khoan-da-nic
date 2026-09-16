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
  REGISTRY_VERSION: '1.0.0',   // 58 tín hiệu, Phụ lục A
  RULE_VERSION: '1.3.0',       // cap nhóm + 18 cộng hưởng + 20/45/69, Phụ lục B
                               // 1.1.0 (15/8/2026): thêm offer+transfer,
                               // advancefee+transfer, orgclaim+transfer
                               // 1.2.0 (2/9/2026): thêm credential+manipulation
                               //   — vùng chết "đòi mã + gây áp lực" kẹt ở 44 điểm
                               // 1.3.0 (2/9/2026): thêm extortion+transfer,
                               //   keepcall+fear+transfer, secrecy+isolation+transfer,
                               //   brandmismatch+pressure; coverstory+transfer 10->12
  PROMPT_VERSION: '1.1.0',     // lời nhắc trong llm-extractor.js
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
