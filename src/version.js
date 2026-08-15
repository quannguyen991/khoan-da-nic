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
  RULE_VERSION: '1.0.0',       // cap nhóm + 10 cộng hưởng + 20/45/69, Phụ lục B
  PROMPT_VERSION: '1.0.0',     // lời nhắc trong llm-extractor.js
};
