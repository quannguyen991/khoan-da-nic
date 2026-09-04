'use strict';
/**
 * ⚠️ HÀNG RÀO CHO LỖI ĐÃ ĐO 4/9/2026 — DẠNG §4.3, LẦN THỨ SÁU.
 *
 * Đường AI gửi thân yêu cầu KHÔNG có trường `stream`. Chuẩn OpenAI nói mặc định
 * là `false`, nên trước giờ không sao. Nhưng một gateway openai-compatible
 * (`localhost:20128`, 142 model) đọc "không có trường" thành "cứ stream đi", và
 * trả `content-type: text/event-stream` cho MỌI model. `res.json()` trong
 * `goiMotDuong` ném lỗi ⇒ `AI_SCHEMA_INVALID` ⇒ `aiDaChay: false` ⇒ 100% lượt
 * rơi về tầng luật.
 *
 * ⚠️ VÌ SAO PHẢI CÓ TEST CHỨ KHÔNG CHỈ SỬA MỘT DÒNG: lỗi này TỰ CHE. Ca giả
 * danh công an vẫn ra `CAO` — tầng luật tự bắt được — nên màn hình trông y hệt
 * lúc chạy đúng. Đo được cùng ngày, cùng model `kr/claude-sonnet-4.5`:
 *
 *   không gửi `stream`   AI_SCHEMA_INVALID   0 tín hiệu   nhan=CAO  ← trông vẫn ĐÚNG
 *   `stream: false`      aiDaChay: true      7 tín hiệu   nhan=CAO
 *
 * Chỗ chết người nằm ở 127/217 mẫu CAO tiếng Việt trong `eval/dataset` mà tầng
 * luật một mình BỎ SÓT: với `stream` thiếu, tất cả im lặng ra "Chưa thấy dấu
 * hiệu rủi ro". Không có test này thì một lần refactor thân yêu cầu là mất sạch
 * đường AI mà không một test nào đỏ.
 */

const test = require('node:test');
const assert = require('node:assert');

const { goiMotDuong, layCauHinh } = require('../backend/src/ai/fable-client');

const ENV_GATEWAY = {
  LLM_API_BASE: 'https://vi-du.test/v1',
  LLM_API_KEY: 'khoa-gia-cho-test',
  RISK_LLM_MODEL: 'mot-model-nao-do',
};

/** Bắt lấy thân yêu cầu rồi trả về một phản hồi JSON hợp lệ tối thiểu. */
function fetchGia(thu) {
  return async (url, opts) => {
    thu.url = url;
    thu.than = JSON.parse(opts.body);
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"signals":[]}' } }] }),
      text: async () => '',
    };
  };
}

test('§7.0 — thân yêu cầu PHẢI khai `stream: false` tường minh', async () => {
  const goc = globalThis.fetch;
  const thu = {};
  globalThis.fetch = fetchGia(thu);
  try {
    await goiMotDuong([{ role: 'user', content: 'xin chào' }], layCauHinh(ENV_GATEWAY), {});
  } finally {
    globalThis.fetch = goc;
  }

  assert.ok('stream' in thu.than,
    'thiếu trường `stream` — gateway có quyền tự chọn stream, và `res.json()` sẽ ném lỗi');
  assert.strictEqual(thu.than.stream, false,
    'đường rủi ro đọc `choices[0].message.content` một lần, không đọc được SSE');
});

test('§7.0 — khai `stream: false` cho MỌI đường, kể cả cục bộ và Gemini', async () => {
  const CAC_ENV = [
    ['gateway', ENV_GATEWAY],
    ['cục bộ', { LLM_CUC_BO: '1', LLM_CUC_BO_BASE: 'http://127.0.0.1:11434/v1' }],
    ['gemini', { GEMINI_API_KEY: 'khoa-gia-cho-test' }],
  ];

  for (const [ten, env] of CAC_ENV) {
    const goc = globalThis.fetch;
    const thu = {};
    globalThis.fetch = fetchGia(thu);
    try {
      await goiMotDuong([{ role: 'user', content: 'xin chào' }], layCauHinh(env), {});
    } finally {
      globalThis.fetch = goc;
    }
    assert.strictEqual(thu.than.stream, false,
      `đường "${ten}" không khai \`stream: false\` — một máy chủ mặc định stream sẽ làm hỏng cả đường`);
  }
});

/**
 * ⚠️ Ca ngược lại: nếu ai đó gỡ `stream: false` đi thì thân SSE phải thành lỗi
 * CHẨN ĐOÁN ĐƯỢC, không được lẳng lặng thành "không có tín hiệu nào".
 */
test('§6.7 — thân SSE phải ném AI_SCHEMA_INVALID, không trả rỗng im lặng', async () => {
  const goc = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('Unexpected token d in JSON at position 0'); },
    text: async () => 'data: {"choices":[{"delta":{"content":"x"}}]}\n\n',
  });
  try {
    await assert.rejects(
      () => goiMotDuong([{ role: 'user', content: 'xin chào' }], layCauHinh(ENV_GATEWAY), {}),
      (e) => e.ma === 'AI_SCHEMA_INVALID',
      'thân không đọc được phải mang mã lỗi riêng — §6.7: lỗi vứt mất nguyên nhân là sự cố không chẩn đoán được',
    );
  } finally {
    globalThis.fetch = goc;
  }
});
