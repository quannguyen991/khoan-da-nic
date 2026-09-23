'use strict';
/**
 * ══════════ ĐỌC TO BẰNG GIỌNG VIỆT TỪ MÁY CHỦ — thêm 23/9/2026 ══════════
 *
 * Người dùng: "phát tiếng ra thì phải lấy tiếng Việt, giọng Việt".
 *
 * Đo cùng ngày trên máy Windows của người dùng: trình duyệt chỉ có ba giọng
 * (Microsoft David / Mark / Zira — cả ba tiếng Anh). Chrome máy tính không kèm
 * giọng Google tiếng Việt. Nghĩa là nút "Đọc to" ở đó KHÔNG BAO GIỜ đọc được
 * tiếng Việt — mà máy chấm thi của hội đồng rất có thể cũng như vậy.
 *
 * Đường này là DỰ PHÒNG, không phải đường chính: máy có giọng Việt thì đọc bằng
 * máy (không mạng, không chờ). Chỉ khi máy không có mới gọi tới đây.
 *
 * ⚠️ KHÔNG BAO GIỜ ĐỌC CHỮ VIỆT BẰNG GIỌNG ANH. Giọng Anh đọc chữ Việt ra một
 * tràng vô nghĩa, bác tưởng app hỏng. Không có giọng Việt thì trả mã lỗi có
 * tên để màn hình nói ra (§4.3), không âm thầm đọc sai giọng.
 *
 * ⚠️ §6.9 — KHÔNG GHI LOG CHỮ, KHÔNG LƯU XUỐNG ĐĨA. Bộ nhớ đệm chỉ nằm trong RAM
 * để câu lặp lại (câu lệnh màn khẩn cấp, câu kết quả) không phải gọi lại. Chữ
 * đem đọc là câu app tự soạn hoặc lời đáp máy chủ đã có sẵn — nhưng nó vẫn đi
 * sang Google, nên `/api/suc-khoe` báo `giongDocMayChu` để nói thật điều đó.
 */

const GOC = 'https://generativelanguage.googleapis.com/v1beta';
const TOI_DA_KY_TU = 700;
const HAN_MS = 25_000;
const DEM_TOI_DA = 150;
const MODEL_DU_PHONG = 'gemini-2.5-flash-preview-tts';

class LoiDocTo extends Error {
  constructor(ma, status = 500) {
    super(ma);
    this.ma = ma;
    this.status = status;
  }
}

/** Chỉ nhận hai ngôn ngữ app có. Chữ rỗng hay quá dài thì từ chối có tên. */
function chuanHoaYeuCau(body) {
  const chu = typeof body?.chu === 'string' ? body.chu.replace(/\s+/g, ' ').trim() : '';
  if (!chu) throw new LoiDocTo('KHONG_CO_CHU', 400);
  if (chu.length > TOI_DA_KY_TU) throw new LoiDocTo('QUA_DAI', 413);
  const ngonNgu = body?.ngonNgu === 'en-US' ? 'en-US' : 'vi-VN';
  return { chu, ngonNgu };
}

/** PCM 16-bit mono → tệp WAV mà thẻ <audio> nào cũng phát được. */
function bocWav(pcm, tanSo = 24_000) {
  const dau = Buffer.alloc(44);
  dau.write('RIFF', 0);
  dau.writeUInt32LE(36 + pcm.length, 4);
  dau.write('WAVE', 8);
  dau.write('fmt ', 12);
  dau.writeUInt32LE(16, 16);        // cỡ khối fmt
  dau.writeUInt16LE(1, 20);         // PCM
  dau.writeUInt16LE(1, 22);         // một kênh
  dau.writeUInt32LE(tanSo, 24);
  dau.writeUInt32LE(tanSo * 2, 28); // byte mỗi giây
  dau.writeUInt16LE(2, 32);         // byte mỗi mẫu
  dau.writeUInt16LE(16, 34);        // bit mỗi mẫu
  dau.write('data', 36);
  dau.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([dau, pcm]);
}

/**
 * ⚠️ TÊN MODEL ĐỌC GIỌNG ĐỔI THEO ĐỢT PHÁT HÀNH CỦA GOOGLE. Ghi cứng một tên là
 * hẹn ngày nó chết im lặng. Nên hỏi danh sách model một lần, lấy model có "tts";
 * đặt `TTS_MODEL` thì dùng đúng tên đó.
 */
let modelDaTim = null;
function timModel(env, goi) {
  if (env.TTS_MODEL) return Promise.resolve(env.TTS_MODEL);
  if (!modelDaTim) {
    modelDaTim = (async () => {
      const r = await goi(`${GOC}/models?pageSize=1000`, { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } });
      if (!r.ok) throw new Error(`models ${r.status}`);
      const j = await r.json();
      const ten = (j.models || [])
        .filter((m) => /tts/i.test(m.name || '') && (m.supportedGenerationMethods || []).includes('generateContent'))
        .map((m) => String(m.name).replace(/^models\//, ''));
      return ten.find((t) => /flash/i.test(t) && !/preview/i.test(t))
        || ten.find((t) => /flash/i.test(t))
        || ten[0]
        || MODEL_DU_PHONG;
    })().catch(() => {
      modelDaTim = null;           // lần sau hỏi lại, đừng kẹt mãi ở tên dự phòng
      return MODEL_DU_PHONG;
    });
  }
  return modelDaTim;
}

const dem = new Map();

/**
 * Trả về Buffer WAV. Ném `LoiDocTo` với mã có tên khi không đọc được.
 * `goi` tiêm được để test không ra mạng.
 */
async function docToMayChu({ chu, ngonNgu }, { env = process.env, goi = fetch } = {}) {
  if (!env.GEMINI_API_KEY) throw new LoiDocTo('MAY_CHU_CHUA_CO_GIONG', 503);

  const khoa = `${ngonNgu}|${chu}`;
  if (dem.has(khoa)) return dem.get(khoa);

  const model = await timModel(env, goi);
  const giong = env.TTS_GIONG || 'Kore';

  const gui = async (coMaNgonNgu) => {
    const ctl = new AbortController();
    const hen = setTimeout(() => ctl.abort(), HAN_MS);
    try {
      return await goi(`${GOC}/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: chu }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: giong } },
              // Khai rõ tiếng Việt để model không đoán sang giọng khác.
              ...(coMaNgonNgu ? { languageCode: ngonNgu } : {}),
            },
          },
        }),
      });
    } finally {
      clearTimeout(hen);
    }
  };

  let r;
  try {
    r = await gui(true);
    // Bản API cũ không biết `languageCode` và trả 400 — thử lại một lần không có nó.
    if (r.status === 400) r = await gui(false);
  } catch {
    throw new LoiDocTo('MAY_CHU_DOC_HONG', 502);
  }
  if (!r.ok) throw new LoiDocTo('MAY_CHU_DOC_HONG', 502);

  const j = await r.json().catch(() => null);
  const phan = j?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data);
  if (!phan) throw new LoiDocTo('MAY_CHU_DOC_HONG', 502);

  const tanSo = Number((/rate=(\d+)/.exec(phan.inlineData.mimeType || '') || [])[1]) || 24_000;
  const wav = bocWav(Buffer.from(phan.inlineData.data, 'base64'), tanSo);

  if (dem.size >= DEM_TOI_DA) dem.delete(dem.keys().next().value);
  dem.set(khoa, wav);
  return wav;
}

module.exports = { docToMayChu, chuanHoaYeuCau, bocWav, LoiDocTo, TOI_DA_KY_TU };
