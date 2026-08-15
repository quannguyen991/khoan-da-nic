'use strict';
/**
 * §7.0 — ĐƯỜNG TEXT. Gateway openai-compatible.
 * Endpoint: POST ${LLM_API_BASE}/chat/completions
 *
 * ⚠️ Nếu gateway đổi hình dạng response, CHỈ SỬA BÊN TRONG FILE NÀY — không đổi
 * route ứng dụng hay hợp đồng domain.
 *
 * ⚠️ §6.7: "Nhà cung cấp hết tiền hỏng GIỐNG HỆT hỏng do mã." Gateway từng trả
 * HTTP 402 "Insufficient balance" và mất gần một ngày mới nhìn ra vì lỗi bị vứt
 * mất nguyên nhân gốc. Nên mọi lỗi ở đây mang theo `cause` / `providerStatus` /
 * `providerMessage` — CHỈ VÀO LOG, câu người dùng thấy vẫn sạch.
 *
 * ⚠️ §6.9: KHÔNG log prompt/response ở production.
 */

/**
 * ĐO 15/8/2026, 9 lượt trên `aws/claude-sonnet-5-medium` qua vertex-key.com,
 * dùng đúng lời nhắc trích tín hiệu thật. 9/9 lượt đều về:
 *   5,6 · 5,7 · 5,9 · 6,0 · 6,5 · 8,3 · 17,5 · 19,7 · 27,2 giây
 * Trung vị 6,5s nhưng phân bố LƯỠNG CỰC, đuôi tới 27,2s.
 *
 * ⚠️ Đừng chốt ngưỡng theo trung vị. Ngưỡng 20s (chốt vội trên 3 mẫu đầu) cắt oan
 * 2/9 lượt — tức ~22% số lượt bị đẩy xuống chế độ suy giảm DÙ AI VẪN ĐANG TRẢ LỜI.
 * 35s phủ hết dải đã đo với biên ~28%.
 *
 * Chờ lâu không phải vấn đề với ca nguy hiểm: §6.10 cho bộ luật chạy trước, ca có
 * critical override trả về dưới 1 giây và KHÔNG chạm tới tầng này.
 *
 * ══════════ CẬP NHẬT 16/8/2026 — ĐỔI GATEWAY, SỐ TRÊN KHÔNG CÒN ĐÚNG ══════════
 *
 * Sang `codex.hungnguyen.codes`, tên model là `claude-sonnet-5` TRẦN — gateway
 * này không có biến thể `-low/-medium/-high`, và mặc định bật suy luận sâu.
 * Đo lại trên đúng lời nhắc đó: 25,6 · 26,3 · 31,6 · 35,0(timeout) · 35,0(timeout).
 * Chậm gấp năm, và 2/5 lượt bị chính trần 35s cắt.
 *
 * ⚠️ NGUYÊN NHÂN KHÔNG PHẢI "GATEWAY CHẬM". Đo tách bạch:
 *     lời nhắc 8 chữ, 8 lượt          1,9–4,4s   → gateway nhanh
 *     3.378 token vào, đầu ra ngắn      2,2s     → đầu vào dài KHÔNG tốn kém
 *     471 token ra                      5,1s     → 92 tok/s, throughput tốt
 *     lời nhắc trích tín hiệu thật     23–32s    → 2.703 token ra, nội dung ~400
 * Tức là ~4/5 token sinh ra là TOKEN SUY LUẬN. 2.700 ÷ 90 tok/s ≈ 30 giây.
 *
 * Vá bằng `reasoning_effort: 'low'` (xem `layCauHinh`), không phải bằng cách hạ
 * trần timeout — trần 12s làm hỏng 100% lượt gọi.
 *
 * ⚠️ GIỮ TRẦN 35s. Với mức `low` thì lượt gọi về trong ~7s nên trần rộng không
 * tốn gì; và nó vẫn đỡ được lúc gateway tắc.
 */
const TIMEOUT_MAC_DINH = 35_000;

class LoiNhaCungCap extends Error {
  constructor(ma, { cause, providerStatus, providerMessage } = {}) {
    super(ma);
    this.name = 'LoiNhaCungCap';
    this.ma = ma;
    this.cause = cause;
    this.providerStatus = providerStatus;
    this.providerMessage = providerMessage;
  }
}

/**
 * Dấu hiệu gateway trả THÔNG BÁO DỊCH VỤ thay vì nội dung trả lời.
 * Cố ý bắt cả tiếng Anh lẫn tiếng Trung — gateway này trả tiếng Trung.
 */
const MAU_THONG_BAO_DICH_VU = [
  /\[?key expired\]?/i,
  /密钥已过期|额度耗尽|请新购/,
  /quota (exhausted|exceeded)/i,
  /insufficient (balance|credit|quota)/i,
  /(credit|subscription).{0,20}(expired|exhausted)/i,
];

const laThongBaoDichVu = (s) => typeof s === 'string'
  && s.length < 600                      // thông báo dịch vụ luôn ngắn
  && MAU_THONG_BAO_DICH_VU.some((re) => re.test(s));

function layCauHinh(env = process.env) {
  const base = env.LLM_API_BASE || env.LLM_BASE_URL;
  const key = env.LLM_API_KEY;
  return {
    base,
    key,
    model: env.RISK_LLM_MODEL || env.CHAT_MODEL || env.LLM_MODEL,
    /**
     * ⚠️ MỨC SUY LUẬN — ĐO 16/8/2026, ĐÂY LÀ NGUỒN CỦA 30 GIÂY CHỜ.
     *
     * Gateway `codex.hungnguyen.codes` mặc định bật suy luận sâu. Đo trên đúng
     * lời nhắc trích tín hiệu, 3 lượt:
     *   mặc định            23,5s · 1796 token ra · nội dung 1510 ký tự
     *   reasoning_effort low 6,7s ·  427 token ra · nội dung 1079 ký tự
     * Tức là ~4/5 số token sinh ra là TOKEN SUY LUẬN, không phải câu trả lời.
     * `reasoning_effort:'none'` và `thinking:{type:'disabled'}` bị gateway BỎ
     * QUA (vẫn ~30s) — chỉ `low` có tác dụng.
     *
     * VÌ SAO HẠ MỨC LÀ ĐÚNG CHỨ KHÔNG PHẢI ĐÁNH ĐỔI: §4.2 nói tầng AI CHỈ BẬT
     * CỜ, bộ luật mới quyết mức. Trích tín hiệu là việc PHÂN LOẠI có bằng chứng
     * — nó không cần 2.700 token suy luận, và mỗi giây suy luận là một giây
     * người đang bị thúc trên điện thoại phải chờ.
     *
     * ⚠️ Đổi giá trị này là ĐỔI PHÉP ĐO. Khoá đệm của bộ đánh giá có mang nó
     * (eval/lib/bo-nho-dem.js) — trộn hai mức là công bố số của cấu hình này
     * bằng kết quả của cấu hình kia.
     */
    mucSuyLuan: env.LLM_REASONING_EFFORT || 'low',
    timeout: Number(env.LLM_TIMEOUT_MS) || TIMEOUT_MAC_DINH,
    daCauHinh: Boolean(base && key),
  };
}

/** @returns {string} nội dung thô của lượt trả lời. Ném LoiNhaCungCap nếu hỏng. */
async function goiChat(messages, opts = {}) {
  const cauHinh = layCauHinh(opts.env);
  if (!cauHinh.daCauHinh) throw new LoiNhaCungCap('AI_NOT_CONFIGURED');

  const huy = new AbortController();
  const dongHo = setTimeout(() => huy.abort(), cauHinh.timeout);

  let res;
  try {
    res = await fetch(`${cauHinh.base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cauHinh.key}`,
      },
      body: JSON.stringify({
        model: cauHinh.model,
        messages,
        temperature: 0,
        max_tokens: opts.maxTokens || 1500,
        // `tat` = không gửi tham số, để gateway tự quyết như trước.
        ...(cauHinh.mucSuyLuan && cauHinh.mucSuyLuan !== 'tat'
          ? { reasoning_effort: cauHinh.mucSuyLuan } : {}),
      }),
      signal: huy.signal,
    });
  } catch (e) {
    throw new LoiNhaCungCap(e.name === 'AbortError' ? 'AI_TIMEOUT' : 'AI_NETWORK', { cause: e });
  } finally {
    clearTimeout(dongHo);
  }

  if (!res.ok) {
    // Giữ nguyên nhân gốc: 402 "Insufficient balance" phải đọc ra được ở log.
    const chiTiet = await res.text().catch(() => '');
    throw new LoiNhaCungCap('AI_PROVIDER_ERROR', {
      providerStatus: res.status,
      providerMessage: chiTiet.slice(0, 300),
    });
  }

  const data = await res.json().catch((e) => {
    throw new LoiNhaCungCap('AI_SCHEMA_INVALID', { cause: e });
  });

  const noiDung = data?.choices?.[0]?.message?.content;
  if (typeof noiDung !== 'string') {
    throw new LoiNhaCungCap('AI_SCHEMA_INVALID', {
      providerMessage: 'choices[0].message.content không phải chuỗi',
    });
  }

  /**
   * ⚠️ §6.7 LẦN THỨ BA, CẢI TRANG KIỂU MỚI.
   *
   * Gateway hết hạn khoá trả về HTTP 200 kèm một câu THÔNG BÁO DỊCH VỤ nằm đúng
   * chỗ của nội dung trả lời:
   *   "[Key Expired] 密钥已过期 / 额度耗尽，请新购后重新运行一次配置命令…"
   *
   * Không có mã lỗi nào. Tầng trên đọc thành AI_SCHEMA_INVALID và trông y hệt
   * lỗi định dạng của model — đúng cái bẫy §6.7 mô tả: "nhà cung cấp hết tiền
   * hỏng GIỐNG HỆT hỏng do mã".
   *
   * Nên nhận diện nó thành mã RIÊNG. Sai một chẩn đoán ở đây là mất hàng giờ đi
   * sửa lời nhắc trong khi thứ hỏng là cái ví.
   */
  if (laThongBaoDichVu(noiDung)) {
    throw new LoiNhaCungCap('AI_KEY_EXPIRED', {
      providerStatus: res.status,
      providerMessage: noiDung.slice(0, 200),
    });
  }
  return noiDung;
}

module.exports = {
  goiChat, layCauHinh, LoiNhaCungCap, TIMEOUT_MAC_DINH,
  laThongBaoDichVu, MAU_THONG_BAO_DICH_VU,
};
