'use strict';
/**
 * §4.2 PHÁT BIỂU THÀNH MỘT PHÉP ĐO CHẠY ĐƯỢC, cho nguồn ghi âm.
 *
 * "Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm."
 *
 * Bốn trường ghi âm đến TỪ THÂN YÊU CẦU, tức người gọi bịa được. Nếu bịa được
 * một tổ hợp làm TỤT mức thì đó là câu thần chú tặng cho kẻ lừa đảo — cùng bài
 * học với "please hold" và "ch play" (§12).
 *
 * Chạy TOÀN BỘ 445 mẫu, mỗi mẫu nhiều lượt: một lượt không có trường ghi âm,
 * rồi từng tổ hợp ghi âm. KHÔNG LƯỢT NÀO được thấp hơn lượt gốc.
 *
 * ⚠️ CHỈ BỘ LUẬT — không gọi AI. Cố ý: câu trả lời "có đường hạ mức không" không
 * được phụ thuộc vào gateway sống hay chết.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');
const { napDataset } = require('../eval/lib/bo-danh-gia');

const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };

/** Mọi tổ hợp người gọi có thể bịa, kể cả tổ hợp "trông đẹp nhất". */
const TO_HOP = [
  { ten: 'nghe tốt hoàn toàn', o: { ghiAm: true, ghiAmConfidence: 1 } },
  { ten: 'hỏng hoàn toàn', o: { ghiAm: true, ghiAmFailed: true } },
  { ten: 'hụt một đoạn', o: { ghiAm: true, ghiAmConfidence: 0.3 } },
  { ten: 'chưa tải model', o: { ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'CHUA_TAI_MODEL' } },
  { ten: 'không tiếng người', o: { ghiAm: true, ghiAmFailed: true, ghiAmMaLoi: 'KHONG_CO_TIENG_NOI' } },
  { ten: 'bị cắt', o: { ghiAm: true, ghiAmConfidence: 0.9, ghiAmMaLoi: 'BI_CAT' } },
  { ten: 'confidence rác', o: { ghiAm: true, ghiAmConfidence: 'cao' } },
  { ten: 'mã lỗi lạ', o: { ghiAm: true, ghiAmMaLoi: 'KHONG_TON_TAI' } },
];

const { mau, loi } = napDataset();

test('dữ liệu nạp được — nếu không thì mọi khẳng định dưới đây vô nghĩa', () => {
  assert.deepStrictEqual(loi, [], `dataset hỏng: ${loi[0]}`);
  assert.ok(mau.length >= 445, `chỉ có ${mau.length} mẫu, chờ ≥445`);
});

test('§4.2 — không tổ hợp ghi âm nào kéo tụt mức của 445 mẫu', () => {
  const tut = [];
  for (const m of mau) {
    const goc = analyze({ vanBan: m.vanBan });
    for (const { ten, o } of TO_HOP) {
      const sau = analyze({ vanBan: m.vanBan, ...o });
      if (BAC[sau.nhan] < BAC[goc.nhan]) {
        tut.push(`${m.id || '?'} · ${ten}: ${goc.nhan} → ${sau.nhan}`);
      }
    }
  }
  assert.deepStrictEqual(tut, [],
    `${tut.length} lượt tụt mức vì trường ghi âm:\n${tut.slice(0, 10).join('\n')}`);
});

test('§HĐ luật 2 — mọi mã chuaKiem sinh ra vẫn là MÃ, không phải câu', () => {
  for (const { o } of TO_HOP) {
    const kq = analyze({ vanBan: 'Bác chuyển tiền sang tài khoản an toàn ngay.', ...o });
    for (const ma of kq.chuaKiem) {
      assert.match(ma, /^[a-z][a-z0-9_]+$/, `chuaKiem phải là MÃ, gặp "${ma}"`);
    }
  }
});

/**
 * ⚠️ CA NÀY LÀ LÝ DO CẢ TỆP TỒN TẠI.
 *
 * Kẻ lừa đảo không gửi tin nhắn cho backend — nó dụ người dùng bấm nút. Nhưng
 * bản APK gửi bốn trường này lên, và một bản dựng bị sửa (hoặc một lượt gọi
 * curl) bịa được mọi giá trị. Tổ hợp "nghe tốt hoàn toàn, không lỗi gì" là tổ
 * hợp TRÔNG SẠCH NHẤT — nếu có đường hạ mức thì nó nằm ở đây.
 */
test('§4.2 — tổ hợp "sạch nhất" không làm dịu đi một kịch bản giả danh công an', () => {
  const doc = 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an ngay, '
    + 'không được nói với ai, đọc mã OTP vừa gửi cho tôi.';
  const goc = analyze({ vanBan: doc });
  const sach = analyze({ vanBan: doc, ghiAm: true, ghiAmConfidence: 1, ghiAmFailed: false });
  assert.ok(BAC[sach.nhan] >= BAC[goc.nhan], `${goc.nhan} → ${sach.nhan}`);
  assert.strictEqual(sach.nhan, 'CAO');
});
