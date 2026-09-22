'use strict';
/**
 * MÀN KHẨN CẤP — HAI RÀNG BUỘC ĐO ĐƯỢC BẰNG MÃ NGUỒN.
 *
 * ① §HĐ luật 3 — khối "CHƯA kiểm được" phải CÙNG CỠ CHỮ với nhãn kết quả.
 *
 *    Đo 19/9/2026 trên bản đang chạy: nhãn `text-[25px]`, khối chưa-kiểm-được
 *    `text-[16px]` — nhỏ hơn 36%. Chú thích ngay trên khối đó đã viết "không được
 *    nhỏ hơn" từ đầu; mã thì làm ngược lại, và không test nào bắt được vì
 *    `test/unchecked-not-safe.test.js` chỉ đọc phía máy chủ.
 *
 *    Đây không phải chuyện thẩm mỹ. Khối đó là chỗ DUY NHẤT trên màn nói ra rằng
 *    kết luận có thể sai ("cháu chưa nghe được cuộc gọi"). Người mắt kém đọc được
 *    dòng 25px và không đọc dòng 16px — tức là họ nhận nguyên phần kết luận mà
 *    không nhận phần giới hạn của nó. §4.3 gọi đúng tên lỗi này.
 *
 * ② Người dùng báo 19/9/2026: bấm Khẩn cấp ra "rất rất rất nhiều chữ".
 *    Đo được 839 ký tự và 11–16 đích chạm. Test này canh những thứ đã bỏ đi
 *    KHÔNG được lặng lẽ quay lại trong một lần "thêm cho đủ thông tin" sau này.
 *
 * ⚠️ ĐÂY LÀ TEST ĐỌC MÃ NGUỒN, không phải đo hình học. Nó bắt được đúng cái mà
 * nó đọc: cỡ chữ khai trong class, và sự tồn tại của vài chuỗi. Đo thật trên
 * trình duyệt vẫn phải làm bằng tay — xem `test/font-size-floor.test.js`.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const APP = fs.readFileSync(path.join(GOC, 'src', 'App.tsx'), 'utf8');

/** Lấy khối JSX quanh một mốc chữ, đủ rộng để thấy các class của khối đó. */
function khoiQuanh(moc, truoc = 400, sau = 900) {
  const i = APP.indexOf(moc);
  assert.ok(i > 0, `không tìm thấy mốc "${moc}" trong App.tsx — đổi chữ thì sửa cả test này`);
  return APP.slice(Math.max(0, i - truoc), i + sau);
}

test('§HĐ luật 3 — khối "CHƯA kiểm được" cùng cỡ chữ với nhãn kết quả', () => {
  const nhan = /className="text-\[(\d+)px\] font-black text-white text-center/.exec(APP);
  assert.ok(nhan, 'không đọc được cỡ chữ của nhãn kết quả — nó là mốc so sánh của cả luật này');
  const coNhan = Number(nhan[1]);

  const khoi = khoiQuanh('Những thứ cháu CHƯA kiểm được');
  const coChu = [...khoi.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1]));
  assert.ok(coChu.length >= 2, 'khối chưa-kiểm-được phải khai cỡ chữ tường minh cho cả tiêu đề lẫn từng dòng');

  const nhoHon = coChu.filter((c) => c < coNhan);
  assert.deepStrictEqual(nhoHon, [],
    `nhãn kết quả ${coNhan}px nhưng khối "chưa kiểm được" có chữ ${nhoHon.join(', ')}px. `
    + '§HĐ luật 3: "chuaKiem không rỗng ⇒ frontend BẮT BUỘC hiển thị nó CÙNG CỠ CHỮ với nhan". '
    + 'Nhỏ hơn là biến lời khai thành chú thích.');
});

test('khối "CHƯA kiểm được" KHÔNG nằm dưới nếp gấp "Xem thêm"', () => {
  const MOC_GAP = '{(moThem || !manGapGap) && (<>';
  const iChuaKiem = APP.indexOf('Những thứ cháu CHƯA kiểm được');
  assert.ok(iChuaKiem > 0, 'không tìm thấy khối "chưa kiểm được"');

  // Có NHIỀU nếp gấp (một cho khối thông tin, một cho nhóm nút phụ) — soát tất cả.
  const vung = [];
  for (let i = APP.indexOf(MOC_GAP); i >= 0; i = APP.indexOf(MOC_GAP, i + 1)) {
    const dong = APP.indexOf('</>)}', i);
    assert.ok(dong > i, 'một nếp gấp không có chỗ đóng — đổi cách viết thì sửa cả test này');
    vung.push([i, dong]);
  }
  assert.ok(vung.length >= 1, 'không tìm thấy nếp gấp nào — đổi tên biến thì sửa cả test này');

  const bienNoTrong = vung.some(([a, b]) => iChuaKiem > a && iChuaKiem < b);
  assert.ok(!bienNoTrong,
    'khối "chưa kiểm được" bị nhét vào trong nếp gấp: giấu nó đi là đổi một màn gọn lấy một màn nói thiếu sự thật');
});

test('màn khẩn cấp không dựng lại những đoạn chữ đã bỏ ngày 19/9/2026', () => {
  const daBo = [
    'Chưa làm gì vội. Đếm ngược rồi tính tiếp.',
    'Bác dừng lại bây giờ không có nghĩa là bác chậm hay ngốc',
  ];
  const conLai = daBo.filter((c) => APP.includes(`t('${c}`) || APP.includes(`t("${c}`));
  assert.deepStrictEqual(conLai, [],
    `những câu này đã bỏ khỏi màn khẩn cấp vì trùng ý với thứ ngay cạnh nó: ${conLai.join(' · ')}`);
});

test('nút chính của màn khẩn cấp không hứa "gọi ngay" khi chưa có số người thân', () => {
  // Mốc là lượt GỌI `t(...)` trong JSX, không phải chữ nằm trong khối chú thích.
  const khoi = khoiQuanh("t('GỌI NGAY CHO CON CHÁU')", 300, 300);
  assert.match(khoi, /firstContact\.phone \?/,
    'nhãn nút phải rẽ theo việc có số hay không — hứa "GỌI NGAY" rồi mở ra một biểu mẫu trống là nói dối người đang hoảng');
  assert.ok(APP.includes('Chưa có số người thân — bấm để thêm'),
    'thiếu nhãn cho trường hợp chưa có số người thân');
});

test('nút gọi đứng TRƯỚC nếp gấp "Xem thêm", không phải sau', () => {
  const iNut = APP.indexOf("t('GỌI NGAY CHO CON CHÁU')");
  const iGap = APP.indexOf('onClick={() => setMoThem((v) => !v)}');
  assert.ok(iNut > 0 && iGap > 0, 'không tìm thấy nút chính hoặc nút nếp gấp');
  assert.ok(iNut < iGap,
    'Đo 19/9/2026: khi khối bằng chứng đứng trước, nút "GỌI NGAY CHO CON CHÁU" rơi xuống y=1308 '
    + 'trên màn cao 812 — bác đang hoảng phải cuộn 742px mới thấy việc duy nhất cần làm. '
    + 'Hành động trước, bằng chứng sau.');
});

test('bằng chứng dài của màn gấp nằm dưới nếp gấp, và KHÔNG bị xoá', () => {
  // Cảnh báo chính thức: hiện thẳng ở mức khác, lùi xuống ở màn gấp — hai lượt dùng.
  const dem = (APP.match(/<CanhBaoChinhThuc/g) || []).length;
  assert.strictEqual(dem, 2,
    'phải có đúng HAI lượt dùng <CanhBaoChinhThuc>: một cho màn thường (!manGapGap), '
    + 'một nằm trong nếp gấp của màn gấp. Còn một là ai đó đã xoá mất bằng chứng.');
  assert.match(APP, /\{!manGapGap && \(\s*<CanhBaoChinhThuc/,
    'lượt hiện thẳng phải bị chặn bởi !manGapGap');

  // Lý do: màn gấp ba dòng, phần còn lại xuống nếp gấp — không dòng nào bị vứt.
  assert.match(APP, /const lyDoHien = manGapGap \? lyDo\.slice\(0, 3\) : lyDo\.slice\(0, 8\);/,
    'màn gấp chỉ để ba dòng lý do');
  assert.match(APP, /const lyDoConLai = manGapGap \? lyDo\.slice\(3, 8\) : \[\];/,
    'phần lý do còn lại phải được bày ra ở chỗ khác, không được cắt đi');
});
