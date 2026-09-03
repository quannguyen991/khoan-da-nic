'use strict';
/**
 * KẾT QUẢ SƠ BỘ KHÔNG BAO GIỜ ĐƯỢC CAO HƠN KẾT QUẢ CUỐI.
 *
 * ══════════ VÌ SAO TÍNH CHẤT NÀY LÀ ĐIỀU KIỆN CẦN ══════════
 *
 * Gateway mất 25,6–35s một lượt (đo 15/8/2026, trung vị 31,6s). Nửa phút nhìn
 * màn chờ là đánh đổi sai với người đang bị thúc trên điện thoại — §6.10.
 *
 * Nên giao diện hiện kết quả TẦNG LUẬT ngay, rồi thay bằng kết quả đầy đủ khi
 * AI về. Điều đó CHỈ an toàn nếu mức sơ bộ không bao giờ cao hơn mức cuối:
 *
 *   sơ bộ CAO → cuối NGHI_NGO   = app vừa báo động rồi tự rút lại. Người dùng
 *                                 học được rằng cảnh báo của app không đáng tin,
 *                                 và lần sau họ bỏ qua đúng cái cảnh báo thật.
 *   sơ bộ CHUA_THAY → cuối CAO  = chấp nhận được. Nhãn đi LÊN, và giao diện cố
 *                                 ý KHÔNG hiện nhãn trấn an sớm (chỉ hiện nhãn
 *                                 sớm khi nó đã là CAO).
 *
 * §4.2 bảo đảm chiều này: "Lớp AI trả tín hiệu present | unknown. Không có
 * absent." và "Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác, không
 * bao giờ giảm." Tín hiệu chỉ được THÊM, nên điểm chỉ tăng.
 *
 * ⚠️ Nhưng "bảo đảm bởi thiết kế" là thứ đã sai ba lần trong dự án này. Đo.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze, toHopDong } = require('../backend/src/analysis/pipeline');
const { napDataset } = require('../eval/lib/bo-danh-gia');
const { SIGNAL_IDS } = require('../backend/src/analysis/signal-registry');

const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
const { mau } = napDataset();

/**
 * Dựng tín hiệu LLM giả cho một mẫu: lấy vài tín hiệu bất kỳ và trích một chuỗi
 * CÓ THẬT trong văn bản, để chúng qua được hàng rào evidence.
 *
 * ⚠️ Không gọi AI thật. Test này đo TÍNH CHẤT của bộ luật, và tính chất đó
 * không được phụ thuộc vào gateway có sống hay không.
 */
function tinHieuGia(vanBan, ids) {
  const quote = vanBan.slice(0, Math.min(28, vanBan.length));
  return ids.map((id) => ({
    id, state: 'present', confidence: 0.95,
    evidence: [{ quote, start: 0, end: quote.length, sourceId: 'van_ban' }],
  }));
}

test('445 mẫu — thêm BẤT KỲ tín hiệu AI nào cũng không làm TỤT mức', () => {
  // Ba bộ tín hiệu khác hẳn nhau về nhóm và trọng số.
  const BO = [
    ['MAN_URGENCY', 'MAN_SECRECY'],
    ['FIN_SAFE_ACCOUNT', 'ID_AUTHORITY_IMPERSONATION', 'CRED_OTP_SHARE'],
    ['OFF_PRIZE_GIFT', 'WEB_SHORTENER_REDIRECT', 'CASE_REPEATED_CONTACT', 'FIN_NEW_RECIPIENT'],
  ];

  const tut = [];
  for (const m of mau) {
    const soBo = toHopDong(analyze({ vanBan: m.noi_dung }));
    for (const ids of BO) {
      const day = toHopDong(analyze({
        vanBan: m.noi_dung,
        llmSignals: tinHieuGia(m.noi_dung, ids),
      }));
      if (BAC[day.nhan] < BAC[soBo.nhan]) {
        tut.push(`${m.id}: sơ bộ ${soBo.nhan} → cuối ${day.nhan} (thêm ${ids.join(',')})`);
      }
    }
  }

  assert.deepStrictEqual(tut, [],
    `SƠ BỘ CAO HƠN CUỐI — app sẽ báo động rồi tự rút lại:\n  ${tut.slice(0, 15).join('\n  ')}`);
});

test('quét TỪNG tín hiệu một trên một lát mẫu — không tín hiệu nào làm tụt mức', () => {
  const latCat = mau.filter((_, i) => i % 9 === 0);   // ~55 mẫu, đủ rộng mà vẫn nhanh
  const tut = [];

  for (const m of latCat) {
    const soBo = toHopDong(analyze({ vanBan: m.noi_dung }));
    for (const id of SIGNAL_IDS) {
      const day = toHopDong(analyze({
        vanBan: m.noi_dung, llmSignals: tinHieuGia(m.noi_dung, [id]),
      }));
      if (BAC[day.nhan] < BAC[soBo.nhan]) tut.push(`${m.id} + ${id}: ${soBo.nhan} → ${day.nhan}`);
    }
  }

  assert.deepStrictEqual(tut, [], `tín hiệu làm TỤT mức:\n  ${tut.slice(0, 15).join('\n  ')}`);
});

/**
 * `aiDaChay` phải nói THẬT ở kết quả sơ bộ. §HĐ buộc frontend hiện dòng "lượt
 * này không có AI đọc" khi nó là `false` — nếu ở đây trả `true` thì dòng đó
 * biến mất và người dùng tưởng AI đã đọc.
 */
test('kết quả sơ bộ luôn khai aiDaChay = false', () => {
  for (const m of mau.slice(0, 80)) {
    const r = toHopDong(analyze({ vanBan: m.noi_dung }));
    assert.strictEqual(r.aiDaChay, false, `${m.id}: sơ bộ khai có AI`);
  }
});

test('§HĐ — sơ bộ trả ĐÚNG BẢY TRƯỜNG, cùng hình dạng với kết quả cuối', () => {
  const BAY = ['nhan', 'maLyDo', 'daKiem', 'chuaKiem', 'hoKichBan', 'aiDaChay', 'canThiep'];
  for (const m of mau.slice(0, 40)) {
    const r = toHopDong(analyze({ vanBan: m.noi_dung }));
    assert.deepStrictEqual(Object.keys(r).sort(), [...BAY].sort(), `${m.id}`);
  }
});

/**
 * ⚠️ `chuaKiem` của kết quả sơ bộ PHẢI mang mã nói rằng AI chưa chạy.
 * Thiếu nó thì màn sơ bộ trông y hệt màn cuối, và người dùng đọc một kết quả
 * nửa vời thành kết quả đầy đủ. Đây là §4.3 áp cho đúng chỗ này.
 */
test('§4.3 — sơ bộ nói ra rằng AI chưa đọc', () => {
  for (const m of mau.slice(0, 40)) {
    const r = toHopDong(analyze({ vanBan: m.noi_dung }));
    assert.ok(r.chuaKiem.length > 0, `${m.id}: sơ bộ không khai gì là chưa kiểm được`);
  }
});
