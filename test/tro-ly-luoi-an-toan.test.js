'use strict';
/**
 * TRỢ LÝ "NÓI CHO CHÁU NGHE" — LƯỚI AN TOÀN BẰNG BỘ LUẬT. 24/9/2026.
 *
 * Người dùng thử trên web thật: "ngân hàng bảo chuyển tiền không tài khoản bị khoá"
 * → trợ lý chỉ hỏi lại; câu sau → "máy chủ đang bận" (AI quá 35 giây). Không một
 * lời nhắc dừng lại nào. Nay bộ luật cố định (không cần AI) quyết việc có nút kiểm
 * và câu "khoan" — AI chỉ còn lo phần trò chuyện.
 */
process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const test = require('node:test');
const assert = require('node:assert');

const { traLoiTroLy, catCauCam } = require('../backend/src/tro-ly-noi');
const { analyze } = require('../backend/src/analysis/pipeline');

// Đúng cách máy chủ trao bộ luật cho trợ lý (server.js `kiemLuatChoTroLy`): có dấu hiệu + loại việc, không nhãn.
function kiemLuat(vanBan) {
  const kq = analyze({ vanBan });
  if (kq.nhan !== 'CAO' && kq.nhan !== 'NGHI_NGO') return null;
  const co = (t) => kq.maLyDo.some((m) => m.startsWith(t));
  return { loai: co('FIN_') ? 'FIN' : co('CRED_') ? 'CRED' : co('DEV_') ? 'DEV' : 'KHAC' };
}
const hoi = (o) => traLoiTroLy({ kiemLuat, ...o });

const aiHong = async () => { throw new Error('AI_TIMEOUT'); };
const aiTra = (obj) => async () => JSON.stringify(obj);

const CAU_1 = 'ngân hàng bảo chuyển tiền không tài khoản bị khóa';
const CAU_2 = 'ngân hàng bảo chuyển tiền để được nhận thưởng ô tô 1 tỷ';

test('AI hỏng + câu có dấu hiệu ⇒ KHÔNG còn "máy chủ đang bận": nói "khoan chuyển tiền" và đưa nút kiểm', async () => {
  const kq = await hoi({ loiNoi: CAU_2, goiChatFn: aiHong });
  assert.strictEqual(kq.aiDaChay, false, '§4.3 — AI không chạy thì phải nói là không chạy');
  assert.match(kq.loiDap, /^Bác khoan chuyển tiền đã\./);
  assert.ok(!/máy chủ đang bận/.test(kq.loiDap));
  assert.strictEqual(kq.canKiem, CAU_2);
  assert.strictEqual(catCauCam(kq.loiDap), null, 'câu cố định cũng phải qua hàng rào §11');
});

test('AI hỏng + câu lành ⇒ vẫn nói thật là chưa nghĩ được, không bịa cảnh báo', async () => {
  const kq = await hoi({ loiNoi: 'Con nhắn mẹ tối nay con về muộn nhé', goiChatFn: aiHong });
  assert.match(kq.loiDap, /máy chủ đang bận/);
  assert.strictEqual(kq.canKiem, null);
});

test('AI chỉ HỎI LẠI và quên đưa nút ⇒ bộ luật vẫn đưa nút, và mở đầu bằng câu "khoan"', async () => {
  const kq = await hoi({
    loiNoi: CAU_1,
    goiChatFn: aiTra({ loiDap: 'Bác ơi, ngân hàng gọi điện hay nhắn tin ạ?', canKiem: null }),
  });
  assert.strictEqual(kq.aiDaChay, true);
  assert.strictEqual(kq.canKiem, CAU_1, 'model quên canKiem thì bộ luật phải bù');
  assert.match(kq.loiDap, /^Bác khoan chuyển tiền đã\. Bác ơi, ngân hàng gọi điện hay nhắn tin ạ\?$/);
});

test('xét cả mạch: câu sau được kiểm CÙNG câu trước của bác', async () => {
  const kq = await hoi({
    loiNoi: CAU_2,
    lichSu: [{ vai: 'bac', noiDung: CAU_1 }, { vai: 'chau', noiDung: 'Bác ơi, ngân hàng gọi hay nhắn ạ?' }],
    goiChatFn: aiTra({ loiDap: 'Ai bảo bác chuyển tiền để nhận thưởng ạ?', canKiem: CAU_2 }),
  });
  assert.strictEqual(kq.canKiem, `${CAU_1}. ${CAU_2}`);
});

test('lời đáp đã có "khoan"/"đừng" ở đầu ⇒ không nhắc lần hai', async () => {
  const kq = await hoi({
    loiNoi: CAU_1,
    goiChatFn: aiTra({ loiDap: 'Bác đừng chuyển tiền vội nhé. Ai gọi cho bác ạ?', canKiem: CAU_1 }),
  });
  assert.strictEqual(kq.loiDap, 'Bác đừng chuyển tiền vội nhé. Ai gọi cho bác ạ?');
});

test('câu lành ⇒ không thêm câu "khoan", nút kiểm theo đúng model', async () => {
  const kq = await hoi({
    loiNoi: 'Hôm nay bác đi chợ mua rau',
    goiChatFn: aiTra({ loiDap: 'Dạ, bác đi chợ vui ạ.', canKiem: null }),
  });
  assert.strictEqual(kq.loiDap, 'Dạ, bác đi chợ vui ạ.');
  assert.strictEqual(kq.canKiem, null);
});

test('câu "khoan" theo việc người ta đòi: đòi mã ⇒ nhắc về mã', async () => {
  const kq = await hoi({ loiNoi: 'Có người bảo bác đọc mã OTP vừa gửi về máy cho họ', goiChatFn: aiHong });
  assert.match(kq.loiDap, /^Bác khoan đọc mã hay mật khẩu cho ai đã\./);
});

test('lời dặn / lời cảnh báo ⇒ không kích hoạt lưới an toàn', async () => {
  const kq = await hoi({ loiNoi: 'Ngân hàng không bao giờ yêu cầu khách chuyển tiền qua điện thoại.', goiChatFn: aiHong });
  assert.match(kq.loiDap, /máy chủ đang bận/);
  assert.strictEqual(kq.canKiem, null);
});

test('không có kiemLuat (gọi kiểu cũ) ⇒ hành vi cũ, không lưới an toàn — module không tự chấm', async () => {
  const kq = await traLoiTroLy({ loiNoi: CAU_2, goiChatFn: aiHong });
  assert.match(kq.loiDap, /máy chủ đang bận/);
  assert.strictEqual(kq.canKiem, null);
});

test('máy chủ trao bộ luật cho trợ lý — và route vẫn không trả nhãn', () => {
  const sv = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  assert.match(sv, /traLoiTroLy\(\{ loiNoi, lichSu, lang, kiemLuat: kiemLuatChoTroLy \}\)/);
});
