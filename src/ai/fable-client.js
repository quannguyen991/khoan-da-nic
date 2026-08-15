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

const TIMEOUT_MAC_DINH = 30_000;

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
