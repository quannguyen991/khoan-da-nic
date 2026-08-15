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
const { scopeCuaTinHieu } = require('./signal-registry');

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

/** Đoạn nào chứa câu trích này? Dùng để áp scope/speech act cho tín hiệu từ AI. */
function doanChuaTrich(quote, ctx) {
  if (typeof quote !== 'string' || !quote.trim()) return null;
  const q = quote.toLowerCase().replace(/\s+/g, ' ').trim();
  const qf = boDau(q);
  return ctx.segments.find((d) => d.normalized.includes(q) || d.folded.includes(qf)) || null;
}

/**
 * ⚠️ LỖI ĐÃ ĐO 15/8/2026 — hàng rào Phụ lục C chỉ bảo vệ direct-precheck,
 * KHÔNG bảo vệ đường AI. Mà AI mới là máy dò chính.
 *
 * Câu "Never share your OTP or verification code with anyone." được bộ luật
 * phân loại đúng là `warning_education`, direct-precheck im lặng — nhưng tín
 * hiệu AI cho ĐÚNG CÂU ĐÓ đi thẳng qua và ghi 25 điểm.
 *
 * Đây đúng dạng lỗi §9.1 mô tả: ĐƯỜNG DỰ PHÒNG AN TOÀN HƠN ĐƯỜNG CHÍNH.
 * Nên scope/speech act phải áp cho MỌI nguồn tín hiệu, không riêng nguồn nào.
 */
function locTheoScopeChiTiet(signals = [], ctx) {
  const giu = [];
  const loai = [];
  for (const s of signals) {
    if (s.source === 'direct' || s.source === 'deterministic') { giu.push(s); continue; }
    if (scopeCuaTinHieu(s.id) !== 'action') { giu.push(s); continue; }  // C.2 — 'any' lấy tất cả đoạn

    // Tín hiệu action-scope chỉ được nhận khi evidence nằm trong đoạn HÀNH ĐỘNG.
    const doan = (s.evidence || []).map((e) => doanChuaTrich(e?.quote, ctx));
    if (doan.some((d) => d?.actionable === true)) { giu.push(s); continue; }

    // Ghi lại VÌ SAO bị loại — không có dòng này thì mọi chẩn đoán sau đều là đoán.
    loai.push({
      id: s.id,
      quote: s.evidence?.[0]?.quote ?? null,
      speechAct: doan.find(Boolean)?.speechAct ?? 'khong_tim_thay_doan',
    });
  }
  return { giu, loai };
}

const locTheoScope = (signals, ctx) => locTheoScopeChiTiet(signals, ctx).giu;

module.exports = {
  validateEvidence, locTheoEvidence, locTheoScope, locTheoScopeChiTiet,
  trichCoThat, doanChuaTrich,
};
