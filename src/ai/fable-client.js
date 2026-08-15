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

function layCauHinh(env = process.env) {
  const base = env.LLM_API_BASE || env.LLM_BASE_URL;
  const key = env.LLM_API_KEY;
  return {
    base,
    key,
    model: env.RISK_LLM_MODEL || env.CHAT_MODEL || env.LLM_MODEL,
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
  return noiDung;
}

module.exports = { goiChat, layCauHinh, LoiNhaCungCap, TIMEOUT_MAC_DINH };
