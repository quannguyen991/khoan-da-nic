'use strict';
/**
 * VỆT BÁO GHI ÂM PHẢI NÓI THẬT.
 *
 * Người dùng báo 20/9/2026: bấm ghi âm mà không biết nó đã chạy chưa. Vệt đỏ
 * "ĐANG GHI ÂM" thêm vào để trả lời đúng câu đó.
 *
 * ⚠️ NHƯNG NGAY LẦN ĐO ĐẦU TIÊN, vệt đó nói dối. Trình duyệt CHẶN micro, màn
 * vẫn hiện "ĐANG GHI ÂM · 00:03" — còn bên dưới lại có "Máy chưa cho Khoan Đã
 * dùng micro". Hai lời khai ngược nhau trên cùng một màn, và lời to hơn là lời
 * sai. Đây là §4.3 lần thứ tư trong cùng sản phẩm: "không nghe được" hiện ra y
 * hệt "đang nghe".
 *
 * `isRecording` là Ý ĐỊNH của bác (đã bấm). `micHong` là KẾT QUẢ của máy. Vệt
 * báo phải đọc KẾT QUẢ trước. Bộ ca này canh đúng thứ tự đó.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const APP = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8');

/**
 * Khối JSX của lời báo trạng thái.
 *
 * ⚠️ 20/9/2026 nó ĐỔI CHỖ: từ một vệt đỏ riêng thành chính TIÊU ĐỀ to nhất màn
 * (dựng lại theo ảnh thiết kế). Ca kiểm bám theo — ràng buộc không đổi, chỉ
 * chỗ thi hành đổi. Bản trước nói trạng thái ở bốn chỗ khác nhau, và bốn chỗ
 * cho một sự thật là bốn chỗ có thể lệch nhau.
 */
function khoiVetBao() {
  const i = APP.indexOf('Cháu đang nghe Bác');
  assert.ok(i > 0, 'không tìm thấy lời báo trạng thái nghe trong App.tsx');
  const dau = APP.lastIndexOf('aria-live', i);
  assert.ok(dau > 0 && i - dau < 1400, 'lời báo phải có aria-live để TalkBack đọc ra lúc trạng thái đổi');
  return APP.slice(dau, i + 400);
}

test('lời báo đọc KẾT QUẢ trước Ý ĐỊNH — micHong xét trước isRecording', () => {
  const khoi = khoiVetBao();
  const iHong = khoi.indexOf('micHong');
  const iGhi = khoi.indexOf('isRecording');
  assert.ok(iHong >= 0, 'lời báo không hề xét tới micHong');
  assert.ok(iGhi >= 0, 'lời báo không hề xét tới isRecording');
  assert.ok(iHong < iGhi,
    'micHong phải được xét TRƯỚC isRecording. Xét sau là hiện "Cháu đang nghe Bác" trên một máy '
    + 'đã chặn micro — lời khai sai, và là lời to nhất trên màn.');
});

test('lời báo có đủ ba trạng thái, không gộp "hỏng" vào "chưa bấm"', () => {
  const khoi = khoiVetBao();
  for (const cau of ['Cháu chưa nghe được', 'Cháu đang nghe Bác', 'Chạm để nói']) {
    assert.ok(khoi.includes(cau), `lời báo thiếu trạng thái "${cau}"`);
  }
});

test('micro bị chặn thì DỪNG đếm giờ, không chỉ hiện một dòng lỗi', () => {
  // Web Speech báo bị chặn bằng ba mã; cả ba đều là "không ghi được".
  for (const ma of ['not-allowed', 'service-not-allowed', 'audio-capture']) {
    assert.ok(APP.includes(`'${ma}'`), `chưa xử lý mã lỗi ${ma} của Web Speech`);
  }
  const i = APP.indexOf("event.error === 'not-allowed' || event.error === 'service-not-allowed'");
  assert.ok(i > 0, 'ba mã lỗi phải được gom vào một nhánh');
  const khoi = APP.slice(i, i + 260);
  assert.match(khoi, /setMicHong\(true\)/, 'phải bật cờ micHong');
  assert.match(khoi, /setIsRecording\(false\)/,
    'phải tắt isRecording — để nguyên là đồng hồ vẫn chạy và màn vẫn khoe "Đang nghe bác nói"');
});

test('mất luồng micro cũng là mất việc ghi, không chỉ mất sóng âm trang trí', () => {
  const i = APP.indexOf("console.warn('Microphone stream notice:'");
  assert.ok(i > 0, 'không tìm thấy chỗ bắt lỗi getUserMedia');
  const khoi = APP.slice(i, i + 400);
  assert.match(khoi, /setMicHong\(true\)/);
  assert.match(khoi, /setIsRecording\(false\)/);
});

test('tiếng bíp chỉ phát khi bác TỰ BẤM, và không được làm hỏng việc ghi âm', () => {
  const i = APP.indexOf('function bipGhiAm');
  assert.ok(i > 0, 'không tìm thấy hàm phát tiếng báo');
  const ham = APP.slice(i, APP.indexOf('\n}', i));
  const soTry = (ham.match(/try\s*\{/g) || []).length;
  const soCatch = (ham.match(/catch/g) || []).length;
  assert.ok(soTry >= 2 && soCatch >= soTry,
    'mỗi đường báo (âm thanh, rung) phải tự nuốt lỗi của nó: trình duyệt chặn âm thanh hay '
    + 'máy không có bộ rung đều KHÔNG được làm hỏng việc ghi âm');

  // Chỉ một chỗ gọi: nhánh bác tự bấm.
  const soGoi = (APP.match(/bipGhiAm\(/g) || []).length - 1;   // trừ chính định nghĩa
  assert.strictEqual(soGoi, 1,
    'chỉ được gọi từ nhánh bác tự bấm. Một tiếng bíp không ai bấm ra là một tiếng động '
    + 'không giải thích được — và màn này hay dùng lúc đang áp điện thoại vào tai.');
});
