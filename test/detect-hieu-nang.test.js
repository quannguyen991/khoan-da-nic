'use strict';
/**
 * NGÂN SÁCH ĐỘ TRỄ — tầng 0 + tầng 1 phải xong dưới 200ms cho tin 500 ký tự.
 *
 * VÌ SAO ĐO: cả kiến trúc dựa trên một lời hứa — TẦNG 0 PHÁT CẢNH BÁO MỘT MÌNH,
 * không chờ mạng, không chờ mô hình. Lời hứa đó chỉ đúng nếu tầng 0 thật sự
 * nhanh. Một lần thêm "cho chắc" vào đường khớp mẫu là đủ để biến nó thành thứ
 * phải chờ — và lúc đó không ai nhận ra, vì kết quả vẫn đúng.
 *
 * ⚠️ ĐO TRÊN MÁY DỰNG, KHÔNG PHẢI TRÊN ĐIỆN THOẠI CỦA BÁC. Máy Android giá rẻ
 * chậm hơn nhiều lần. Ngân sách 200ms ở đây là mức TRẦN CỦA MÃ, không phải lời
 * hứa về trải nghiệm thật — muốn nói về máy thật thì phải đo trên máy thật.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/detect');
const { datLai } = require('../backend/src/detect/bo-luat-store');

const NGAN_SACH_MS = 200;

/** Tin 500 ký tự, có đủ thứ nặng: link, số, dấu tiếng Việt, chữ bị che. */
function tinDai() {
  const goc = 'Thông báo từ cơ quan chức năng: xe của bác có vi phạm giao thông '
    + 'chưa nộp phạt nguội. Bác truy cập https://csgt-tracuu[.]top/nopphat để tra '
    + 'cứu và chuyển 2.500.000đ vào số tài khoản 19036661234 trong vòng 24h, nếu '
    + 'không sẽ bị cưỡng chế. Bác giữ bí mật, không nói với ai. Mã xác thực sẽ '
    + 'gửi về máy, bác đọc lại cho cán bộ. ';
  return goc.padEnd(500, 'x').slice(0, 500);
}

test('analyze() tầng 0+1 xong dưới 200ms cho tin 500 ký tự', () => {
  datLai();
  const tin = { nguon: 'sms', nguoiGui: '0912345678', noiDung: tinDai(), thoiDiem: Date.now() };

  analyze(tin);   // lượt làm nóng: nạp locale pack, biên dịch regex

  const lan = [];
  for (let i = 0; i < 20; i += 1) lan.push(analyze(tin).doTre);
  lan.sort((a, b) => a - b);

  const trungVi = lan[Math.floor(lan.length / 2)];
  const xauNhat = lan[lan.length - 1];
  // eslint-disable-next-line no-console
  console.log(`   độ trễ tầng 0+1: trung vị ${trungVi}ms · xấu nhất ${xauNhat}ms · ngân sách ${NGAN_SACH_MS}ms`);

  assert.ok(xauNhat < NGAN_SACH_MS, `lượt chậm nhất ${xauNhat}ms vượt ngân sách ${NGAN_SACH_MS}ms`);
});

test('analyze() KHÔNG phải hàm async — không có chỗ nào nhét lời gọi mạng vào', () => {
  /*
   * Ràng buộc kiến trúc, không phải chuyện phong cách: một `analyze` async là
   * cánh cửa mở sẵn để ai đó `await fetch(...)` giữa đường phát hiện, rồi cảnh
   * báo im lặng không tới khi máy mất sóng. Tầng 2 mới là chỗ có mạng.
   */
  const kq = analyze({ nguon: 'sms', nguoiGui: 'X', noiDung: 'thử' });
  assert.ok(!(kq instanceof Promise), 'analyze() trả về Promise — tầng 0 đã bị biến thành bất đồng bộ');
  assert.strictEqual(typeof kq.nhan, 'string');
});

test('tin rất dài không làm nổ bộ nhớ hay treo', () => {
  datLai();
  const dai = 'phạt nguội csgt-x.top chuyển tiền gấp '.repeat(500);   // ~19k ký tự
  const t0 = Date.now();
  const kq = analyze({ nguon: 'sms', nguoiGui: '0912345678', noiDung: dai });
  const het = Date.now() - t0;
  assert.strictEqual(kq.nhan, 'CAO');
  assert.ok(het < 3000, `tin 19k ký tự mất ${het}ms — quá lâu cho một luồng nền`);
});
