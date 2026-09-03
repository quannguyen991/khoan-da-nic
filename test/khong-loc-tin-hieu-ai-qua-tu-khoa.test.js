'use strict';
/**
 * §4.2 · §12 — TÍN HIỆU AI KHÔNG ĐƯỢC LỌC QUA DANH SÁCH TỪ KHOÁ.
 *
 * VÌ SAO CÓ TỆP NÀY (2/9/2026):
 * `pipeline.js` từng chạy `locTheoDauHieu(scope.giu, …)` — tín hiệu do model
 * trích bị VỨT nếu câu trích dẫn không chứa một cue có sẵn trong locale pack.
 *
 * ĐO trên 497 mẫu, cùng đệm AI, chỉ khác dòng đó:
 *          recall vi   recall en   recall trộn
 *   có lọc     32,9%       36,4%        28,6%
 *   bỏ lọc     75,3%       87,9%        94,3%
 *   66 tin nguy hiểm bị chấm "Chưa thấy dấu hiệu rủi ro" — so với 8.
 *
 * Cổng đó ép cả tầng AI về đúng năng lực của một danh sách từ khoá cố định: kẻ
 * lừa đảo chỉ cần diễn đạt khác cue là tín hiệu biến mất. Đó là một ĐƯỜNG HẠ MỨC
 * VÔ ĐIỀU KIỆN — §12 gọi là "câu thần chú tặng cho kẻ lừa đảo" — và §4.2 nói mọi
 * thứ thêm vào chỉ được LÀM TĂNG cảnh giác.
 *
 * Tệp này KHÔNG cấm hàm `locTheoDauHieu` tồn tại (nó vẫn dùng được để chẩn đoán).
 * Nó cấm hàm đó nằm trên ĐƯỜNG QUYẾT ĐỊNH.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
// Sau khi gộp 2/9/2026 chỉ còn MỘT bản pipeline. Xem bo-luat-khong-duoc-lech.
const PIPELINE = [path.join(GOC, 'backend', 'src', 'analysis', 'pipeline.js')];

/** Bỏ chú thích để khỏi bắt nhầm chính đoạn giải thích ở trên. */
function boChuThich(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

for (const p of PIPELINE) {
  if (!fs.existsSync(p)) continue;
  const ten = path.relative(GOC, p).replace(/\\/g, '/');

  test(`§4.2 — ${ten} KHÔNG gọi locTheoDauHieu trên đường quyết định`, () => {
    const ma = boChuThich(fs.readFileSync(p, 'utf8'));
    assert.ok(
      !/locTheoDauHieu\s*\(/.test(ma),
      'Cổng cue đã quay lại đường quyết định.\n'
      + '  Đo 2/9/2026: nó kéo recall tiếng Việt từ 75,3% xuống 32,9%,\n'
      + '  và biến 66 tin nguy hiểm thành "Chưa thấy dấu hiệu rủi ro".\n'
      + '  Chống trích dẫn bịa đã có locTheoEvidence + locTheoScopeChiTiet.',
    );
  });

  test(`§6.1 — ${ten} VẪN giữ hai bộ lọc chống trích dẫn bịa`, () => {
    // Bỏ cổng cue KHÔNG được kéo theo việc bỏ luôn phép kiểm trích dẫn.
    const ma = boChuThich(fs.readFileSync(p, 'utf8'));
    assert.ok(/locTheoEvidence\s*\(/.test(ma), 'mất locTheoEvidence — trích dẫn bịa sẽ lọt');
    assert.ok(/locTheoScopeChiTiet\s*\(/.test(ma), 'mất locTheoScopeChiTiet — phạm vi/speech act không còn được xét');
  });
}

test('§4.2 — biến môi trường KHÔNG được là thứ duy nhất giữ recall', () => {
  // Nếu ai đó khôi phục cổng cue rồi dựa vào KHOAN_DA_BANG_CHUNG_PHAI_KHOP_MAU=0
  // để bù, thì quên đặt biến lúc đóng APK là recall tụt một nửa mà không ai biết.
  // Bộ luật phải đúng khi KHÔNG có biến nào được đặt.
  assert.strictEqual(
    process.env.KHOAN_DA_BANG_CHUNG_PHAI_KHOP_MAU, undefined,
    'test này phải chạy khi biến CHƯA được đặt, để chứng minh mặc định đã đúng',
  );
});
