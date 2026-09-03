'use strict';
/**
 * §6.4 — SOI ĐẦU RA THÔ CỦA NHÀ CUNG CẤP.
 *
 * "Đổi nhà cung cấp thì phải soi ĐẦU RA THÔ ít nhất một lượt. `npm test` xanh
 * KHÔNG phát hiện được lỗi này."
 *
 * Tầng AI đã từng chết im lặng: model trả sai hình dạng → tầng vệ sinh vứt sạch
 * → 5/5 lượt ra `signals: []` trong khi bench vẫn in bảng "AI + deterministic".
 * Script này in RA ĐÚNG THỨ GATEWAY TRẢ VỀ, trước mọi tầng xử lý.
 *
 * Chạy:  node scripts/soi-dau-ra-tho.js
 */

require('dotenv').config();

const { goiChat, layCauHinh } = require('../backend/src/ai/fable-client');
const {
  dungLoiNhac, parseJsonLoose, validateExtraction,
} = require('../backend/src/analysis/llm-extractor');
const { analyze } = require('../backend/src/analysis/pipeline');

// Mẫu tự soạn, KHÔNG phải nội dung thật của người dùng.
const MAU = 'Tôi là cán bộ công an. Tài khoản của bác liên quan vụ án rửa tiền. '
  + 'Bác chuyển toàn bộ tiền sang tài khoản an toàn ngay, và đừng nói với ai.';

(async () => {
  const c = layCauHinh();
  console.log('\n── CẤU HÌNH ──');
  console.log('base    ', c.base || '(chưa đặt)');
  console.log('model   ', c.model || '(chưa đặt)');
  console.log('khoá    ', c.key ? `đã đặt (${c.key.length} ký tự)` : '(chưa đặt)');
  console.log('timeout ', c.timeout, 'ms');

  if (!c.daCauHinh) {
    console.log('\n✖ Chưa cấu hình AI. Bộ luật vẫn chạy, nhưng đây là chế độ suy giảm.');
    process.exit(1);
  }

  const { messages } = dungLoiNhac(MAU);
  console.log('\n── GỌI GATEWAY ──');
  const batDau = Date.now();
  let tho;
  try {
    tho = await goiChat(messages);
  } catch (e) {
    console.log(`✖ ${e.ma}`);
    console.log('  providerStatus ', e.providerStatus ?? '—');
    console.log('  providerMessage', e.providerMessage ?? '—');
    console.log('  cause          ', e.cause?.message ?? '—');
    console.log('\n⚠️ Nhà cung cấp hết tiền hỏng GIỐNG HỆT hỏng do mã (§6.7).');
    console.log('   Kiểm providerStatus trước khi đi sửa mã.');
    process.exit(1);
  }
  const doTre = Date.now() - batDau;

  console.log(`✔ trả lời sau ${doTre}ms\n`);
  console.log('── ĐẦU RA THÔ, NGUYÊN VĂN, CHƯA QUA TẦNG NÀO ──');
  console.log(tho);

  console.log('\n── SAU parseJsonLoose ──');
  const doc = parseJsonLoose(tho);
  console.log(doc ? JSON.stringify(doc, null, 2) : '✖ KHÔNG ĐỌC ĐƯỢC JSON');

  console.log('\n── SAU validateExtraction ──');
  const kq = validateExtraction(doc || {});
  console.log('nhận  :', kq.signals.map((s) => `${s.id}(${s.state},${s.confidence})`).join(' ') || '—');
  console.log('loại  :', kq.rejected.map((r) => `${r.id || ''}:${r.lyDo}`).join(' ') || '—');

  if (kq.signals.length === 0) {
    console.log('\n⚠️ AI trả 0 tín hiệu. ĐÂY LÀ TRIỆU CHỨNG CỦA SỰ CỐ ĐÃ TỪNG XẢY RA.');
    console.log('   So hình dạng ở "ĐẦU RA THÔ" với lược đồ §6.4 trước khi tin con số nào.');
  }

  console.log('\n── PIPELINE ĐẦY ĐỦ (bộ luật quyết định, không phải AI) ──');
  const env = analyze({ vanBan: MAU, llmSignals: kq.signals });
  console.log('nhãn     ', env.nhan, `(${env.score}/69)`);
  console.log('màn hình ', env.canThiep);
  console.log('override ', env.overrides.join(', ') || '—');
  console.log('mã lý do ', env.maLyDo.join(' '));
  console.log('AI đã chạy', env.aiDaChay);

  const chiLuat = analyze({ vanBan: MAU });
  console.log('\nĐối chiếu — CHỈ bộ luật, không AI:', chiLuat.nhan, `(${chiLuat.score}/69)`);
  console.log(env.score >= chiLuat.score
    ? '✔ AI chỉ làm TĂNG cảnh giác, đúng §4.2.'
    : '✖ AI làm TỤT điểm — vi phạm §4.2.');
  console.log();
})();
