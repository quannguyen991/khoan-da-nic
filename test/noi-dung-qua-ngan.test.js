'use strict';
/**
 * §4.3 — SÀN "NỘI DUNG QUÁ NGẮN". Hàng rào cho luật ở cuối `analyze()`.
 *
 * VÌ SAO CÓ TỆP NÀY (2/9/2026):
 * Luật này thêm ngày 20/8/2026 và **chưa từng có test nào canh**. Nó trôi thành
 * bắn vào MỌI tin ngắn, kể cả tin sạch hoàn toàn — "Xin chào bác." bị khai là
 * "chưa kiểm được". §HĐ luật 3 buộc câu đó hiện to bằng nhãn, nên một lỗi im
 * lặng ở backend thành một dòng chữ to sai sự thật trên màn hình người dùng.
 *
 * Không ai phát hiện suốt hai tuần vì bộ test lúc đó trỏ vào bản `src/analysis`
 * cũ, nơi luật này chưa tồn tại.
 *
 * HAI HƯỚNG SAI, TEST PHẢI CANH CẢ HAI:
 *  · khai thiếu → "police told me bank 50$" ra "Chưa thấy dấu hiệu rủi ro",
 *    người dùng đọc thành "cháu đã xem và thấy ổn". Đây là lỗi §4.3 gốc.
 *  · khai thừa  → tin ngắn sạch bị dán nhãn chưa kiểm được. Đây là lỗi §4.3
 *    lộn ngược: khai sai về chính việc mình vừa làm, và làm nhiễu cỡ lớn.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/analysis/pipeline');

const co = (e) => e.chuaKiem.includes('noi_dung_qua_ngan');

// ─────────── PHẢI KHAI: ngắn, chưa kết luận được, NHƯNG có tín hiệu ───────────

test('§4.3 — mẩu chữ ngắn có tín hiệu nhưng chưa đủ kết luận ⇒ PHẢI khai', () => {
  // Ca đo được 20/8/2026, đúng năm chữ. Bắt được một tín hiệu giả danh (10
  // điểm, dưới ngưỡng 20) nên nhãn vẫn là "chưa thấy dấu hiệu" — đúng lúc mâu
  // thuẫn nhất giữa "có thấy gì đó" và "nhãn nói không có gì".
  const e = analyze({ vanBan: 'police told me bank 50$' });
  assert.strictEqual(e.nhan, 'CHUA_THAY');
  assert.ok(e.maLyDo.length > 0, 'ca này phải bắt được ít nhất một tín hiệu');
  assert.ok(co(e), `năm chữ mà không khai gì: ${JSON.stringify(e.chuaKiem)}`);
});

// ─────────── KHÔNG ĐƯỢC KHAI: ngắn nhưng thật sự không có gì ───────────

test('§4.3 — tin ngắn SẠCH thì KHÔNG được khai "chưa kiểm được"', () => {
  for (const v of ['Xin chào bác.', 'Bác ơi cháu về rồi.', 'Vâng ạ.', 'Con chào mẹ.']) {
    const e = analyze({ vanBan: v, llmSignals: [] });
    assert.deepStrictEqual(e.maLyDo, [], `"${v}" không nên có tín hiệu nào`);
    assert.ok(
      !co(e),
      `"${v}" bị khai chưa kiểm được, trong khi đã kiểm và thật sự không có gì.\n`
      + '  §HĐ luật 3 buộc câu này hiện cùng cỡ chữ với nhãn — khai thừa là nhiễu cỡ lớn.',
    );
  }
});

// ─────────── KHÔNG ĐƯỢC KHAI: đã đủ để ra mức thì đừng tự phủ nhận ───────────

test('§4.3 — ngắn mà đã đủ ra NGHI_NGO/CAO thì KHÔNG khai quá ngắn', () => {
  // Nói "quá ngắn để kiểm" ngay sau khi vừa kết luận là tự phủ nhận chính mình.
  const e = analyze({ vanBan: 'chuyển tiền tài khoản an toàn ngay' });
  assert.notStrictEqual(e.nhan, 'CHUA_THAY', 'ca này phải ra mức');
  assert.ok(!co(e), 'đã kết luận được rồi thì không được nói là quá ngắn');
});

test('§4.3 — văn bản rỗng KHÔNG rơi vào luật này (đã có sàn riêng)', () => {
  const e = analyze({ vanBan: '   ' });
  assert.ok(!co(e), 'chuỗi rỗng có sàn riêng, không phải "quá ngắn"');
});

// ─────────── §HĐ — mã phải nằm trong hợp đồng và có câu hiển thị ───────────

test('§HĐ — noi_dung_qua_ngan nằm trong hợp đồng và có câu tiếng Việt lẫn Anh', () => {
  const { MA_CHUA_KIEM } = require('../scripts/xuat-hop-dong');
  assert.ok(
    MA_CHUA_KIEM.includes('noi_dung_qua_ngan'),
    'backend phát ra một mã mà hợp đồng không khai — §HĐ sinh ra để chặn đúng việc này',
  );

  const catalog = require('node:fs')
    .readFileSync(require('node:path').join(__dirname, '..', 'src', 'catalog.ts'), 'utf8');
  assert.ok(
    /noi_dung_qua_ngan:\s*c\(/.test(catalog),
    'mã không có câu hiển thị thì người dùng thấy mã thô',
  );
});
