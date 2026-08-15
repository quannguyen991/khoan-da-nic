'use strict';
/**
 * §2B.2 bước 11 — EVIDENCE PHẢI KHỚP BẢN GỐC.
 *
 * §6.4 / 18.9: evidence phải trích được ĐÚNG CHUỖI CON trên normalized text của
 * NGÔN NGỮ GỐC. KHÔNG dịch evidence trước khi validate — tiếng Anh phải khớp bản
 * tiếng Anh gốc, tiếng Việt khớp bản tiếng Việt gốc.
 *
 * Model trả một "câu trích" đã diễn giải lại mà không tồn tại trong nguồn thì
 * LOẠI TÍN HIỆU ĐÓ. Bản dịch chỉ được hiển thị như phụ chú, gắn nhãn
 * "Translated explanation", và KHÔNG thay thế evidence gốc.
 */

const { boDau } = require('./context-builder');

/**
 * Offset do gateway trả về hay lệch; thứ kiểm được là CHUỖI CON có thật hay không.
 * Nên ở đây chỉ kiểm sự tồn tại, không kiểm offset.
 */
function trichCoThat(quote, ctx) {
  if (typeof quote !== 'string' || !quote.trim()) return false;
  const q = quote.toLowerCase().replace(/\s+/g, ' ').trim();
  if (ctx.normalized.includes(q)) return true;
  // §6.13 — tiếng Việt không dấu cũng là bản gốc hợp lệ.
  return ctx.folded.includes(boDau(q));
}

/**
 * @param {object} signal  tín hiệu đã normalize
 * @param {object} ctx     kết quả buildContext() của NGÔN NGỮ GỐC
 */
function validateEvidence(signal, ctx) {
  // §6.4 — direct detector tự sinh evidence từ chính bản gốc, không qua tầng này.
  if (signal?.source === 'direct') return true;
  if (!signal || !Array.isArray(signal.evidence) || signal.evidence.length === 0) return false;
  return signal.evidence.some((e) => trichCoThat(e?.quote, ctx));
}

const locTheoEvidence = (signals = [], ctx) => signals.filter((s) => validateEvidence(s, ctx));

module.exports = { validateEvidence, locTheoEvidence, trichCoThat };
