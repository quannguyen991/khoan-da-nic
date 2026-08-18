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

/**
 * ─────────── BA ĐƯỜNG CHẠY AI, XẾP THEO THỨ TỰ ƯU TIÊN ───────────
 *
 * ① CỤC BỘ (`LLM_CUC_BO=1`) — mô hình chạy ngay trên máy người dùng qua một máy
 *    chủ nói giao thức OpenAI (Ollama, llama.cpp, LM Studio, OpenVINO Model
 *    Server). Đây là đường ĐƯỢC ƯU TIÊN, vì ba lý do đo được:
 *
 *      · Riêng tư: nội dung tin nhắn KHÔNG rời khỏi máy. Mọi đường khác đều
 *        phải gửi nguyên văn tin nhắn của bác sang một công ty thứ ba.
 *      · Năng lượng: không đánh thức một trung tâm dữ liệu cho mỗi lượt kiểm.
 *      · Mất mạng vẫn chạy: §4.3 — "không kiểm được" là một trạng thái phải
 *        tránh, không phải chỉ để khai báo.
 *
 *    ⚠️ ĐƯỜNG CỤC BỘ KHÔNG CẦN KHOÁ. Ollama không đòi `Authorization`, và ép nó
 *    phải có khoá (như điều kiện `daCauHinh` cũ) là khoá luôn cả đường này —
 *    máy chủ sẽ báo `AI_NOT_CONFIGURED` trong khi mô hình đang chạy ngay bên
 *    cạnh. Nên `daCauHinh` xét base + (khoá HOẶC cục bộ).
 *
 *    ⚠️ KHÔNG GỬI `reasoning_effort` cho đường cục bộ. Mô hình nhỏ chạy tại chỗ
 *    không hiểu tham số này; gửi thừa thì một số máy chủ trả 400 và cả lượt gọi
 *    hỏng vì một trường không ai cần.
 *
 * ② GEMINI (`GEMINI_API_KEY`) — cửa hậu cho bản dựng trên AI Studio.
 * ③ GATEWAY (`LLM_API_BASE` + `LLM_API_KEY`) — đường mặc định.
 *
 * `noiChay` được trả ra để `/api/suc-khoe` nói THẬT với người dùng nội dung của
 * họ có rời khỏi máy hay không. §11: không khai "chạy trên máy" khi đang gọi ra
 * ngoài, và ngược lại.
 */
const CUC_BO_MAC_DINH = 'http://127.0.0.1:11434/v1';
const MODEL_CUC_BO_MAC_DINH = 'qwen2.5:3b-instruct-q4_K_M';

function layCauHinh(env = process.env) {
  let base = env.LLM_API_BASE || env.LLM_BASE_URL;
  let key = env.LLM_API_KEY;
  let model = env.RISK_LLM_MODEL || env.CHAT_MODEL || env.LLM_MODEL;
  let mucSuyLuan = env.LLM_REASONING_EFFORT || 'low';
  let noiChay = 'gateway';

  if (env.LLM_CUC_BO === '1') {
    base = env.LLM_CUC_BO_BASE || CUC_BO_MAC_DINH;
    key = env.LLM_CUC_BO_KEY || 'khong-can-khoa';
    model = env.LLM_CUC_BO_MODEL || MODEL_CUC_BO_MAC_DINH;
    mucSuyLuan = undefined;
    /**
     * ⚠️ HAI CÂU CHUYỆN KHÁC NHAU, ĐỪNG GỘP — §11.
     *
     *   `tren_may_nguoi_dung` — người dùng chạy CẢ app lẫn mô hình trên chính
     *      máy của họ. Lúc đó "nội dung không rời khỏi máy" là ĐÚNG.
     *
     *   `tren_may_chu_tu_van_hanh` — mô hình chạy cùng máy với MÁY CHỦ, nhưng
     *      người dùng truy cập từ điện thoại qua mạng. Nội dung VẪN rời khỏi máy
     *      của họ — chỉ là không đi sang một công ty thứ ba.
     *
     * Cùng một cấu hình `LLM_CUC_BO=1`, hai sự thật khác nhau, và máy chủ KHÔNG
     * TỰ BIẾT mình đang ở tình huống nào. Nói bừa "không rời khỏi máy" khi đang
     * host cho người khác là lời khai SAI về đúng thứ người dùng dựa vào để
     * quyết định có gõ số tài khoản vào hay không.
     *
     * Mặc định là `tren_may_chu_tu_van_hanh` — giả định AN TOÀN HƠN. Chỉ khi
     * người triển khai khai rõ `LLM_CHAY_TREN_MAY_NGUOI_DUNG=1` thì mới nói câu
     * mạnh hơn.
     */
    noiChay = env.LLM_CHAY_TREN_MAY_NGUOI_DUNG === '1'
      ? 'tren_may_nguoi_dung'
      : 'tren_may_chu_tu_van_hanh';
  } else if (!key && env.GEMINI_API_KEY) {
    base = 'https://generativelanguage.googleapis.com/v1beta/openai';
    key = env.GEMINI_API_KEY;
    model = model || 'gemini-2.5-flash';
    mucSuyLuan = undefined;
    noiChay = 'gemini';
  }

  /**
   * ⚠️⚠️ MÔ HÌNH CÓ NHÌN ĐƯỢC ẢNH KHÔNG — HỎI TRƯỚC KHI GỬI, ĐỪNG GỬI RỒI ĐOÁN.
   *
   * `llm-extractor.js` gửi ảnh dạng `image_url`. Mô hình CHỈ ĐỌC CHỮ
   * (`qwen2.5:7b`, `llama3.1:8b`…) nhận khối đó rồi lặng lẽ bỏ qua phần ảnh —
   * không báo lỗi, không nói gì. Nhưng `unreadableInputFloor()` thấy có trường
   * `anh` nên vẫn khai `daKiem: ['anh_ocr']`, tức MÀN HÌNH NÓI "đã đọc chữ trong
   * ảnh" về một tấm ảnh chưa ai nhìn.
   *
   * Đó đúng là dạng lỗi §4.3, và nó nguy hiểm hơn bình thường vì chỉ xuất hiện
   * khi đổi sang mô hình cục bộ — mọi test chạy bằng văn bản đều xanh.
   *
   * Nên mặc định của đường cục bộ là KHÔNG có thị giác. Muốn bật thì phải khai
   * rõ `LLM_CUC_BO_CO_THI_GIAC=1`, và chỉ khai khi mô hình thật sự là bản vision
   * (`qwen2.5vl`, `gemma3`, `llama3.2-vision`, `minicpm-v`…).
   *
   * Gateway và Gemini đều dùng mô hình đa phương thức nên mặc định là có.
   */
  const coThiGiac = noiChay === 'gateway' || noiChay === 'gemini'
    ? env.LLM_KHONG_CO_THI_GIAC !== '1'
    : env.LLM_CUC_BO_CO_THI_GIAC === '1';

  return {
    base,
    key,
    model: model || 'claude-sonnet-5',
    mucSuyLuan,
    noiChay,
    coThiGiac,
    laCucBo: noiChay === 'tren_may_nguoi_dung' || noiChay === 'tren_may_chu_tu_van_hanh',
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
