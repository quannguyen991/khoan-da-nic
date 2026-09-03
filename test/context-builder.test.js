'use strict';
// Phụ lục C — speech act, phủ định, scope.
// C.3 là BỐN BẪY ĐÃ CẮN. Bốn ca đó là bắt buộc, không được bỏ.

const test = require('node:test');
const assert = require('node:assert');

const {
  buildContext,
  detectLanguage,
  SPEECH_ACTS,
  NON_ACTIONABLE_ACTS,
  segmentsForScope,
} = require('../backend/src/analysis/context-builder');

const actsCua = (t) => buildContext(t).segments.map((s) => s.speechAct);
const doanHanhDong = (t) => buildContext(t).segments.filter((s) => s.actionable);

// ─────────────── C.2 — danh sách CHẶN, không phải danh sách cho phép ───────────────

test('C.2 — đúng bảy speech act', () => {
  assert.deepStrictEqual(SPEECH_ACTS, [
    'request_command', 'notification', 'warning_education',
    'quoted_report', 'past_event', 'self_directed', 'unknown',
  ]);
});

test('C.2 — "unknown" KHÔNG nằm trong danh sách không-hành-động', () => {
  assert.ok(!NON_ACTIONABLE_ACTS.has('unknown'),
    'unknown bị loại là tái phạm lỗi §4.3: không nhận ra ≠ đã kiểm và không thấy');
  assert.strictEqual(NON_ACTIONABLE_ACTS.size, 5);
  for (const act of ['warning_education', 'notification', 'past_event', 'self_directed', 'quoted_report']) {
    assert.ok(NON_ACTIONABLE_ACTS.has(act), act);
  }
});

test('C.2 — scope "any" và "context" lấy TẤT CẢ đoạn, kể cả không-hành-động', () => {
  const ctx = buildContext('Never share your OTP. Send $500 now.');
  assert.strictEqual(segmentsForScope(ctx, 'any').length, ctx.segments.length);
  assert.strictEqual(segmentsForScope(ctx, 'context').length, ctx.segments.length);
  assert.ok(segmentsForScope(ctx, 'action').length < ctx.segments.length);
});

// ─────────────── C.3 — BỐN BẪY BẮT BUỘC ───────────────

test('C.3 bẫy 1 — câu TƯỜNG THUẬT mang danh tính và sức ép KHÔNG được bị loại', () => {
  // Bản đầu gán cả ba câu này là unknown rồi vứt → 10 điểm, "Chưa thấy dấu hiệu rủi ro"
  // cho đúng kịch bản nguy hiểm nhất trong bộ dữ liệu.
  const cau = [
    'This is Officer Daniels from the police.',
    'Your account is linked to money laundering.',
    'You will be arrested today unless you move your funds.',
  ];
  for (const c of cau) {
    const doan = doanHanhDong(c);
    assert.strictEqual(doan.length, 1, `bị loại oan: "${c}"`);
  }
});

test('C.3 bẫy 2 — lời đòi tiền viết dạng TƯỜNG THUẬT không được rơi ra ngoài', () => {
  const t = 'There is a small unlock fee before your refund can be processed.';
  assert.strictEqual(doanHanhDong(t).length, 1,
    'không có mệnh lệnh nào, nhưng đây vẫn là lời đòi tiền');
});

test('C.3 bẫy 3 — mệnh lệnh phủ định ở mệnh đề PHỤ không quyết định cả câu', () => {
  const t = 'Please transfer the money now and do not tell Mum.';
  const acts = actsCua(t);
  assert.ok(!acts.includes('warning_education'),
    'tin nhắn lừa đảo đủ cả hai vế bị coi là bài giáo dục chống lừa đảo');
  assert.strictEqual(doanHanhDong(t).length, acts.length);
});

test('C.3 bẫy 4 — động từ quá khứ ngôi thứ nhất GIỮA câu là mệnh đề phụ', () => {
  const t = 'Please send the money to the account I gave you.';
  const acts = actsCua(t);
  assert.ok(!acts.includes('past_event'),
    '"…to the account I gave you" không được biến cả câu thành past_event');
  assert.strictEqual(doanHanhDong(t).length, 1);
});

// ─────────────── C.3 — giữ ranh giới câu ───────────────

test('C.3 — KHÔNG bỏ dấu câu: phủ định không được trượt sang câu bên cạnh', () => {
  const ctx = buildContext('Never share your OTP. Send $500 now.');
  assert.strictEqual(ctx.segments.length, 2, 'gộp làm một là mất cảnh báo HOẶC mất yêu cầu');
  assert.strictEqual(ctx.segments[0].speechAct, 'warning_education');
  assert.strictEqual(ctx.segments[1].speechAct, 'request_command');
  assert.ok(/[.]/.test(ctx.normalized), 'dấu câu phải còn trong bản chuẩn hoá');
});

test('C.3 — case-fold để khớp nhưng GIỮ NGUYÊN chuỗi gốc', () => {
  const goc = 'Send Me The OTP NOW.';
  const ctx = buildContext(goc);
  assert.strictEqual(ctx.original, goc);
  assert.strictEqual(ctx.normalized, ctx.normalized.toLowerCase());
});

test('§6.1 — offset của đoạn trỏ đúng vào chuỗi GỐC', () => {
  const goc = 'Never share your OTP. Send $500 now.';
  const ctx = buildContext(goc);
  for (const s of ctx.segments) {
    assert.strictEqual(goc.slice(s.start, s.end), s.text, 'bản đồ offset sai');
  }
});

// ─────────────── §6.13 — chuẩn hoá ───────────────

test('§6.13 — contraction chuẩn hoá trước khi khớp ngữ cảnh', () => {
  const ctx = buildContext("Don't share your OTP. He can't call you.");
  assert.ok(ctx.normalized.includes('do not'));
  assert.ok(ctx.normalized.includes('cannot'));
});

test('§6.13 — tiếng Việt có bản bỏ dấu để so với danh sách C.5', () => {
  const ctx = buildContext('Quý khách đã chuyển 5.000.000đ.');
  assert.ok(ctx.folded.includes('da chuyen'), 'thiếu bản không dấu');
});

test('C.6.3 — nhiễu OCR phải chạy CẢ HAI bảng ánh xạ', () => {
  // "1nsta11" cần 1→l, "s1x-d1g1t" cần 1→i. Không có ánh xạ đúng duy nhất.
  const a = buildContext('1nsta11 this app');
  const b = buildContext('s1x-d1g1t code');
  assert.ok(a.ocrVariants.some((v) => v.includes('install')), 'thiếu biến thể 1→l');
  assert.ok(b.ocrVariants.some((v) => v.includes('six-digit')), 'thiếu biến thể 1→i');
});

// ─────────────── §6.13 / C.6.3 — ngưỡng mixed là 1/1 ───────────────

test('§6.13 — ngưỡng mixed là 1/1, chạy thừa một pack rẻ hơn bỏ sót', () => {
  assert.strictEqual(detectLanguage('Xin chào bác, khỏe không ạ?'), 'vi');
  assert.strictEqual(detectLanguage('Please install AnyDesk so I can help.'), 'en');
  assert.strictEqual(
    detectLanguage('Bác ơi, please install AnyDesk so I can help.'),
    'mixed',
    'từng bị xếp tiếng Việt thuần nên pack tiếng Anh không chạy và CO-02 im lặng',
  );
  assert.strictEqual(detectLanguage(''), 'unknown');
});

test('§6.1 — mixed nạp CẢ HAI locale pack', () => {
  const ctx = buildContext('Bác ơi, please install AnyDesk so I can help.');
  assert.deepStrictEqual(ctx.activePacks.sort(), ['en-US', 'vi-VN']);
});

// ─────────────── B.4 — direction unknown chấm như sender_to_user ───────────────

test('B.4 — direction "unknown" KHÔNG được chấm 0 điểm', () => {
  const ctx = buildContext('Chuyển ngay 20 triệu vào tài khoản này.');
  for (const s of ctx.segments) {
    assert.notStrictEqual(s.direction, undefined);
    assert.ok(s.actionable, 'direction chưa rõ vẫn phải được phân tích');
  }
});

test('Đầu vào rỗng / chỉ khoảng trắng không tạo đoạn giả', () => {
  assert.strictEqual(buildContext('').segments.length, 0);
  assert.strictEqual(buildContext('   \n  ').segments.length, 0);
});

test('Hàm thuần: không mạng, không AI, không đồng hồ — gọi hai lần ra y hệt', () => {
  const t = 'This is Officer Daniels. Please move your funds now.';
  assert.deepStrictEqual(buildContext(t), buildContext(t));
});
