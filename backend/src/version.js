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
  PROMPT_VERSION: '1.0.0',     // lời nhắc trong llm-extractor.js
};
