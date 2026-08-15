'use strict';
/**
 * DÒ MỘT ROUTER XEM CÓ ĐƯỜNG PHIÊN ÂM KHÔNG.
 *
 * ⚠️ VÌ SAO PHẢI DÒ BA TẦNG CHỨ KHÔNG CHỈ ĐỌC `/models`:
 *
 * ① Danh sách `/models` HAY THIẾU. `codex.hungnguyen.codes` không liệt kê model
 *    phiên âm nào, nhưng `/audio/transcriptions` vẫn sống — chỉ là khoá không có
 *    kênh. Đọc danh sách rồi kết luận là bỏ sót.
 *
 * ② HTTP 200 KHÔNG CÓ NGHĨA LÀ MODEL NGHE ĐƯỢC. Đo 16/8/2026: gateway trả 200
 *    cho lượt gọi có kèm âm thanh, rồi ÂM THẦM VỨT phần âm thanh. Chính model
 *    nói "tôi không nhận được tệp âm thanh nào". Tin mã trạng thái là dựng cả
 *    một tính năng lên trên đường ống rỗng.
 *    Nên tầng ③ HỎI THẲNG MODEL xem nó có nghe thấy không.
 *
 * ③ Mỗi nhà cung cấp một hình dạng khác nhau: `input_audio` (OpenAI),
 *    `audio_url`, `audio` (DashScope). Thử cả ba rồi đọc THÔNG BÁO LỖI — lỗi
 *    "sai hình dạng" khác hẳn lỗi "không hỗ trợ audio", và nó nói cho ta biết
 *    có đáng thử tiếp không.
 *
 * Chạy:
 *   node scripts/do-router-nghe-duoc.js <base-url> <khoá>
 *   node scripts/do-router-nghe-duoc.js            (dò router trong .env)
 */

require('dotenv').config({ quiet: true });

/** Tên model phiên âm hay gặp, gom từ OpenAI · Qwen/DashScope · Groq · Azure. */
const TEN_ASR = [
  'whisper-1', 'whisper-large-v3', 'whisper-large-v3-turbo',
  'gpt-4o-transcribe', 'gpt-4o-mini-transcribe',
  'qwen3-asr-flash', 'qwen-audio-asr', 'qwen2-audio-instruct',
  'paraformer-v2', 'paraformer-realtime-v2', 'sensevoice-v1',
  'distil-whisper-large-v3-en', 'scribe_v1',
];

const LA_ASR = /whisper|audio|speech|transcri|\basr\b|voice|omni|paraformer|sensevoice|scribe/i;

/** WAV 16kHz mono, 1 giây tiếng bíp 440Hz. Đủ để biết model có nhận được sóng không. */
function wavBip() {
  const n = 16000;
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i += 1) {
    data.writeInt16LE(Math.round(6000 * Math.sin((2 * Math.PI * 440 * i) / 16000)), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(16000, 24); h.writeUInt32LE(32000, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const cat = (s, n = 110) => String(s).replace(/\s+/g, ' ').slice(0, n);

async function layJson(url, opts) {
  const r = await fetch(url, opts);
  const t = await r.text();
  try { return { status: r.status, body: JSON.parse(t) }; } catch { return { status: r.status, text: t }; }
}

async function doRouter(base, khoa) {
  const H = { authorization: `Bearer ${khoa}` };
  console.log(`\n══════ ${base}`);

  // ─── Tầng 0: khoá còn sống không? ───
  let models = [];
  try {
    const { status, body, text } = await layJson(`${base}/models`, { headers: H });
    if (status === 401 || status === 403) {
      console.log(`  ✖ khoá không dùng được (HTTP ${status}) — dừng`);
      return { base, song: false };
    }
    models = (body?.data || body?.models || []).map((m) => m.id || m.name || m);
    if (!models.length) console.log(`  ⚠ /models không trả danh sách: HTTP ${status} ${cat(text || JSON.stringify(body))}`);
    else console.log(`  ${models.length} model`);
  } catch (e) {
    console.log(`  ✖ không kết nối được: ${e.message}`);
    return { base, song: false };
  }

  // ─── Tầng 1: có tên nào trông như model nghe được không? ───
  const nghiNgo = models.filter((m) => LA_ASR.test(m));
  console.log(`  ① tên trông như phiên âm : ${nghiNgo.length ? nghiNgo.join(', ') : 'không có'}`);

  // ─── Tầng 2: endpoint phiên âm ───
  const wav = wavBip();
  const thu = [...new Set([...nghiNgo, ...TEN_ASR])];
  let duocEndpoint = null;
  for (const m of thu) {
    const fd = new FormData();
    fd.append('file', new Blob([wav], { type: 'audio/wav' }), 'a.wav');
    fd.append('model', m);
    fd.append('language', 'vi');
    try {
      const r = await fetch(`${base}/audio/transcriptions`, { method: 'POST', headers: H, body: fd });
      if (r.status === 200) { duocEndpoint = m; console.log(`  ② /audio/transcriptions: ✔ ${m}`); break; }
      if (r.status === 404) { console.log('  ② /audio/transcriptions: không có endpoint'); break; }
    } catch { /* thử tên tiếp theo */ }
  }
  if (!duocEndpoint) console.log(`  ② /audio/transcriptions: endpoint có nhưng KHÔNG model nào chạy (thử ${thu.length} tên)`);

  /**
   * ─── Tầng 3: HỎI THẲNG MODEL ───
   * ⚠️ Đây là tầng quan trọng nhất. Gateway có thể trả 200 rồi vứt âm thanh.
   * Chỉ có model tự nói mới phân biệt được "đã nghe" với "đã bị vứt".
   */
  const b64 = wav.toString('base64');
  const hoi = 'Bạn có NGHE được âm thanh đính kèm không? '
    + 'Có thì tả trong một câu. Không nhận được thì trả lời đúng chữ: KHONG.';
  const hinhDang = [
    ['input_audio', [{ type: 'text', text: hoi }, { type: 'input_audio', input_audio: { data: b64, format: 'wav' } }]],
    ['input_audio+dataURI', [{ type: 'text', text: hoi }, { type: 'input_audio', input_audio: { data: `data:audio/wav;base64,${b64}`, format: 'wav' } }]],
    ['audio_url', [{ type: 'text', text: hoi }, { type: 'audio_url', audio_url: { url: `data:audio/wav;base64,${b64}` } }]],
  ];

  const ungVien = models.filter((m) => /omni|audio|4o|gpt-5|qwen|gemini|sonnet|glm/i.test(m)).slice(0, 3);
  let nghe = false;
  for (const m of ungVien) {
    for (const [tenHd, content] of hinhDang) {
      try {
        const { body } = await layJson(`${base}/chat/completions`, {
          method: 'POST',
          headers: { ...H, 'content-type': 'application/json' },
          body: JSON.stringify({ model: m, max_tokens: 120, messages: [{ role: 'user', content }] }),
        });
        const noiDung = body?.choices?.[0]?.message?.content;
        if (body?.error) { console.log(`  ③ ${m} / ${tenHd}: lỗi — ${cat(body.error.message || body.error)}`); continue; }
        // ⚠️ Model nói "KHONG" nghĩa là gateway đã vứt âm thanh, DÙ HTTP 200.
        const coNghe = noiDung && !/^\s*khong\b/i.test(noiDung) && !/không nhận được|không nghe|no audio|cannot hear/i.test(noiDung);
        console.log(`  ③ ${m} / ${tenHd}: ${coNghe ? '✔ CÓ NGHE' : '✖ không nghe'} — ${cat(noiDung, 80)}`);
        if (coNghe) { nghe = true; break; }
      } catch (e) { console.log(`  ③ ${m} / ${tenHd}: ${e.message}`); }
    }
    if (nghe) break;
  }

  const dungDuoc = Boolean(duocEndpoint) || nghe;
  console.log(`  ⇒ ${dungDuoc ? '✔ DÙNG ĐƯỢC cho ghi âm' : '✖ không có đường phiên âm'}`);
  return { base, song: true, endpoint: duocEndpoint, nghe, dungDuoc };
}

if (require.main === module) {
  const [base, khoa] = process.argv.slice(2);
  const ds = base
    ? [[base.replace(/\/$/, ''), khoa]]
    : [[process.env.LLM_API_BASE, process.env.LLM_API_KEY]];

  (async () => {
    const ra = [];
    for (const [b, k] of ds) {
      if (!b || !k) { console.log('thiếu base URL hoặc khoá'); continue; }
      ra.push(await doRouter(b, k));
    }
    const ok = ra.filter((x) => x.dungDuoc);
    console.log(`\n═══ ${ok.length}/${ra.length} router có đường phiên âm ═══`);
    if (!ok.length) {
      console.log('Không router nào nghe được ⇒ tính năng ghi âm chưa có đường phía máy chủ.');
      console.log('Đừng dựng giao diện ghi âm lên trên đường ống rỗng — xem §11.');
    }
  })();
}

module.exports = { doRouter, TEN_ASR, LA_ASR };
