'use strict';
/**
 * ĐỌC TO PHẢI LÀ GIỌNG VIỆT — thêm 23/9/2026.
 *
 * Người dùng: "phát tiếng ra thì phải lấy tiếng Việt, giọng Việt". Đo cùng ngày:
 * trình duyệt trên máy Windows của người dùng chỉ có ba giọng tiếng Anh, nên nút
 * "Đọc to" không bao giờ nói được tiếng Việt ở đó; và bản APK thiếu khai báo
 * TTS_SERVICE nên Android 11+ không cho app thấy bộ đọc nào.
 *
 * Ba điều canh ở đây:
 *   ① không bao giờ chọn giọng ngôn ngữ khác cho chữ Việt;
 *   ② máy không có giọng Việt thì nhờ máy chủ đọc, không im, không đọc sai giọng;
 *   ③ máy chủ không đọc được thì trả mã có tên (§4.3), không trả âm thanh rỗng.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const GOC = path.join(__dirname, '..');
const { docToMayChu, chuanHoaYeuCau, LoiDocTo, TOI_DA_KY_TU } = require('../backend/src/doc-to-may-chu');

/** Trả lời giả của Gemini: 0,1 giây PCM im lặng. */
function traLoiAm() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: Buffer.alloc(4800).toString('base64') } }] } }],
    }),
  };
}

// ── Máy chủ ────────────────────────────────────────────────────────────────

test('không đặt TTS_MODEL thì tự tìm model có "tts" trong danh sách của Google', async () => {
  const daGoi = [];
  const goi = async (url) => {
    daGoi.push(url);
    if (url.includes('/models?')) {
      return { ok: true, json: async () => ({ models: [
        { name: 'models/gemini-3.6-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-9-flash-tts', supportedGenerationMethods: ['generateContent'] },
      ] }) };
    }
    return traLoiAm();
  };
  await docToMayChu({ chu: 'Câu thử tìm model.', ngonNgu: 'vi-VN' }, { env: { GEMINI_API_KEY: 'k' }, goi });
  assert.ok(daGoi.some((u) => u.includes('/models/gemini-9-flash-tts:generateContent')), daGoi.join('\n'));
});

test('ra tệp WAV thật, và khai rõ tiếng Việt cho model', async () => {
  let than = null;
  const goi = async (url, o) => { than = JSON.parse(o.body); return traLoiAm(); };
  const wav = await docToMayChu({ chu: 'Bác đừng chuyển tiền.', ngonNgu: 'vi-VN' },
    { env: { GEMINI_API_KEY: 'k', TTS_MODEL: 'm-tts' }, goi });
  assert.strictEqual(wav.subarray(0, 4).toString(), 'RIFF');
  assert.strictEqual(wav.subarray(8, 12).toString(), 'WAVE');
  assert.strictEqual(wav.readUInt32LE(24), 24000, 'tần số lấy mẫu phải theo mimeType');
  assert.strictEqual(than.generationConfig.speechConfig.languageCode, 'vi-VN');
  assert.deepStrictEqual(than.generationConfig.responseModalities, ['AUDIO']);
  assert.strictEqual(than.contents[0].parts[0].text, 'Bác đừng chuyển tiền.');
});

test('API không biết languageCode (400) thì thử lại một lần không có nó', async () => {
  const cacThan = [];
  const goi = async (url, o) => {
    cacThan.push(JSON.parse(o.body));
    return cacThan.length === 1 ? { ok: false, status: 400, json: async () => ({}) } : traLoiAm();
  };
  const wav = await docToMayChu({ chu: 'Câu thử 400.', ngonNgu: 'vi-VN' }, { env: { GEMINI_API_KEY: 'k', TTS_MODEL: 'm' }, goi });
  assert.strictEqual(wav.subarray(0, 4).toString(), 'RIFF');
  assert.strictEqual(cacThan.length, 2);
  assert.ok(!('languageCode' in cacThan[1].generationConfig.speechConfig));
});

test('câu lặp lại lấy từ bộ nhớ đệm, không gọi Google lần hai', async () => {
  let dem = 0;
  const goi = async () => { dem += 1; return traLoiAm(); };
  const o = { env: { GEMINI_API_KEY: 'k', TTS_MODEL: 'm' }, goi };
  await docToMayChu({ chu: 'Câu lặp.', ngonNgu: 'vi-VN' }, o);
  await docToMayChu({ chu: 'Câu lặp.', ngonNgu: 'vi-VN' }, o);
  assert.strictEqual(dem, 1);
});

test('§4.3 — không đọc được thì ném mã có tên, không trả âm thanh rỗng', async () => {
  await assert.rejects(docToMayChu({ chu: 'x', ngonNgu: 'vi-VN' }, { env: {}, goi: async () => traLoiAm() }),
    (e) => e instanceof LoiDocTo && e.ma === 'MAY_CHU_CHUA_CO_GIONG' && e.status === 503);
  await assert.rejects(docToMayChu({ chu: 'Câu hỏng.', ngonNgu: 'vi-VN' },
    { env: { GEMINI_API_KEY: 'k', TTS_MODEL: 'm' }, goi: async () => ({ ok: true, status: 200, json: async () => ({ candidates: [] }) }) }),
  (e) => e.ma === 'MAY_CHU_DOC_HONG');
  await assert.rejects(docToMayChu({ chu: 'Câu mạng hỏng.', ngonNgu: 'vi-VN' },
    { env: { GEMINI_API_KEY: 'k', TTS_MODEL: 'm' }, goi: async () => { throw new Error('mat mang'); } }),
  (e) => e.ma === 'MAY_CHU_DOC_HONG');
});

test('chỉ nhận hai ngôn ngữ; chữ rỗng hay quá dài bị từ chối có tên', () => {
  assert.deepStrictEqual(chuanHoaYeuCau({ chu: '  a   b ', ngonNgu: 'fr-FR' }), { chu: 'a b', ngonNgu: 'vi-VN' });
  assert.strictEqual(chuanHoaYeuCau({ chu: 'a', ngonNgu: 'en-US' }).ngonNgu, 'en-US');
  assert.throws(() => chuanHoaYeuCau({ chu: '   ' }), (e) => e.ma === 'KHONG_CO_CHU' && e.status === 400);
  assert.throws(() => chuanHoaYeuCau({ chu: 'a'.repeat(TOI_DA_KY_TU + 1) }), (e) => e.ma === 'QUA_DAI');
});

test('§6.9 — mô-đun không ghi log chữ đem đọc', () => {
  const nguon = fs.readFileSync(path.join(GOC, 'backend', 'src', 'doc-to-may-chu.js'), 'utf8');
  assert.ok(!/console\.(log|info|warn|error)/.test(nguon), 'không được ghi log trong đường đọc to');
});

test('HTTP: thiếu khoá thì 503 kèm mã; chữ rỗng thì 400; /api/suc-khoe báo giongDocMayChu', async () => {
  const cu = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const { app } = require('../backend/server');
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  try {
    const goi = (body) => fetch(`${goc}/api/doc-to`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const a = await goi({ chu: 'Bác đừng chuyển tiền.' });
    assert.strictEqual(a.status, 503);
    assert.strictEqual((await a.json()).ma, 'MAY_CHU_CHUA_CO_GIONG');
    const b = await goi({ chu: '' });
    assert.strictEqual(b.status, 400);
    const sk = await (await fetch(`${goc}/api/suc-khoe`)).json();
    assert.strictEqual(sk.giongDocMayChu, false);
  } finally {
    sv.close();
    if (cu !== undefined) process.env.GEMINI_API_KEY = cu;
  }
});

// ── Giao diện ──────────────────────────────────────────────────────────────

function napNative() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const ra = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'native-doc-to.cjs');
  fs.mkdirSync(path.dirname(ra), { recursive: true });
  esbuild.buildSync({ entryPoints: [path.join(GOC, 'src', 'native.ts')], bundle: true, format: 'cjs', platform: 'node', outfile: ra, absWorkingDir: GOC, logLevel: 'silent' });
  return require(ra);
}

test('① chọn giọng: KHÔNG BAO GIỜ lấy giọng Anh cho chữ Việt', () => {
  const { chonGiong } = napNative();
  const anh = [{ name: 'Microsoft David - English (United States)', lang: 'en-US' }, { name: 'Microsoft Zira', lang: 'en-US' }];
  assert.strictEqual(chonGiong(anh, 'vi-VN'), null, 'máy chỉ có giọng Anh thì phải trả null để nhờ máy chủ');
});

test('① chọn giọng: nhận cả "vi_VN" gạch dưới, và ưu tiên giọng tự nhiên', () => {
  const { chonGiong } = napNative();
  assert.strictEqual(chonGiong([{ name: 'Vietnamese', lang: 'vi_VN' }], 'vi-VN').name, 'Vietnamese');
  const ds = [
    { name: 'Microsoft An - Vietnamese', lang: 'vi-VN' },
    { name: 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)', lang: 'vi-VN' },
    { name: 'Google US English', lang: 'en-US' },
  ];
  assert.match(chonGiong(ds, 'vi-VN').name, /HoaiMy/);
});

test('② máy không có giọng Việt thì nhờ máy chủ đọc — không trả lỗi ngay, không đọc giọng mặc định', () => {
  const nguon = fs.readFileSync(path.join(GOC, 'src', 'native.ts'), 'utf8');
  const i = nguon.indexOf('export async function docTo(');
  const than = nguon.slice(i, nguon.indexOf('export async function dungDocTo', i));
  assert.match(than, /if \(!giong\) return docBangMayChu\(chu, ngonNgu\);/);
  assert.match(than, /MAY_CHUA_CO_GIONG' \|\| ma === 'MAY_KHONG_CO_BO_DOC'\) return docBangMayChu/,
    'APK thiếu giọng Việt cũng phải nhờ máy chủ');
  assert.ok(!/return \{ ok: false, ma: 'MAY_CHUA_CO_GIONG' \};\s*\n\s*if \(giong\)/.test(than), 'còn đường cũ trả lỗi ngay');
  // Bấm dừng phải tắt được cả tiếng do máy chủ đọc hộ.
  const dung = nguon.slice(nguon.indexOf('export async function dungDocTo'));
  assert.match(dung.slice(0, 200), /dungAmMayChu\(\);/);
});

test('APK: khai TTS_SERVICE để Android 11+ thấy bộ đọc, và thử bộ đọc Google khi mặc định thiếu tiếng Việt', () => {
  const mf = fs.readFileSync(path.join(GOC, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
  assert.match(mf, /<action android:name="android\.intent\.action\.TTS_SERVICE" \/>/);
  const java = fs.readFileSync(path.join(GOC, 'android', 'app', 'src', 'main', 'java', 'vn', 'khoanda', 'app', 'DocVanBan.java'), 'utf8');
  assert.match(java, /"com\.google\.android\.tts"/);
  assert.match(java, /if \(coBoDocGoogle\(\)\) \{ khoiTao\(ctx, BO_DOC_GOOGLE/);
});
