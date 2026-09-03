/**
 * HÀNG RÀO CHO TIN LỪA ĐẢO LẤY TỪ BÁO.
 *
 * ⚠️ KHÔNG TEST NÀO Ở ĐÂY GỌI RA MẠNG. Bài test phụ thuộc mạng là bài test đỏ
 * ngẫu nhiên lúc 2 giờ sáng, rồi bị ai đó tắt đi. Phần lấy tin dùng chuỗi RSS
 * dựng sẵn; phần gọi mạng đã dò tay ngày 16/8/2026 và ghi kết quả vào `NGUON`.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { bocRss, LA_TIN_LUA_DAO, NGUON } = require('../backend/src/tin-lua-dao');
const { boDau } = require('../backend/src/analysis/context-builder');

const rss = (items) => `<?xml version="1.0"?><rss><channel>${items}</channel></rss>`;
const item = (o = {}) => `<item>
  <title>${o.title ?? 'Bắt nhóm lừa đảo chiếm đoạt tiền tỷ'}</title>
  <link>${o.link ?? 'https://vnexpress.net/bai-viet-123.html'}</link>
  <description><![CDATA[${o.desc ?? '<a href="x"><img src="y"></a></br>Tóm tắt bài.'}]]></description>
  <pubDate>${o.date ?? 'Sat, 15 Aug 2026 19:55:47 +0700'}</pubDate>
</item>`;

// ══════════ §11 — không cảnh báo nào thiếu nguồn ══════════

test('§11 — tin thiếu đường dẫn bị LOẠI, không hiện nửa vời', () => {
  const r = bocRss(rss(item({ link: '' }) + item({ link: 'khong-phai-url' })), 'VnExpress');
  assert.deepStrictEqual(r, [], 'tin không có link vẫn lọt qua');
});

test('§11 — tin thiếu tiêu đề bị LOẠI', () => {
  assert.deepStrictEqual(bocRss(rss(item({ title: '' })), 'VnExpress'), []);
});

test('§11 — mỗi tin mang tên báo và đường dẫn gốc', () => {
  const [t] = bocRss(rss(item()), 'Tuổi Trẻ');
  assert.strictEqual(t.nguon, 'Tuổi Trẻ');
  assert.match(t.lienKet, /^https:\/\//);
});

// ══════════ An toàn khi dựng ══════════

/**
 * ⚠️ HTML CỦA BÁO KHÔNG ĐƯỢC ĐI TIẾP.
 * `<description>` chứa thẻ `<a>` và `<img>` trỏ ra máy chủ lạ. Đưa thẳng vào
 * giao diện là mở đường chèn mã, và phá luôn CSP `img-src 'self'`.
 */
test('gỡ sạch thẻ HTML khỏi tóm tắt', () => {
  const [t] = bocRss(rss(item({ desc: '<a href="http://xau"><img src="http://xau/x.png"></a>Nội dung thật' })), 'X');
  assert.ok(!/[<>]/.test(t.tomTat), `còn thẻ: ${t.tomTat}`);
  assert.match(t.tomTat, /Nội dung thật/);
});

test('không chèn được thẻ script qua tiêu đề', () => {
  const [t] = bocRss(rss(item({ title: 'Tin &lt;script&gt;alert(1)&lt;/script&gt; lừa đảo' })), 'X');
  // Thực thể được giải ra CHỮ, và chữ đó đi vào React như văn bản — không phải HTML.
  assert.strictEqual(t.tieuDe, 'Tin <script>alert(1)</script> lừa đảo');
});

/**
 * ⚠️ GIẢI THỰC THỂ MỘT LƯỢT, KHÔNG GIẢI LẶP.
 * Giải lặp cho tới khi hết thì `&amp;lt;` — một dấu `<` người ta cố ý viết ra —
 * sẽ thành `<` thật, và mở lại đúng cái cửa việc gỡ thẻ sinh ra để đóng.
 */
test('không giải thực thể nhiều vòng', () => {
  const [t] = bocRss(rss(item({ title: 'a &amp;lt;b&amp;gt; c' })), 'X');
  assert.strictEqual(t.tieuDe, 'a &lt;b&gt; c');
});

// ══════════ Thực thể tiếng Việt ══════════

/**
 * Đo 16/8/2026: Thanh Niên gửi chữ có dấu dưới dạng TÊN thực thể — 143 lần
 * `&agrave;`, 132 lần `&aacute;`, 75 lần `&ocirc;`. Không giải thì tiêu đề hiện
 * nguyên văn "C&ocirc;ng an C&agrave; Mau" trên màn hình của bác.
 */
test('giải được tên thực thể tiếng Việt', () => {
  const [t] = bocRss(rss(item({ title: 'C&ocirc;ng an C&agrave; Mau b&aacute;o c&aacute;o' })), 'Thanh Niên');
  assert.strictEqual(t.tieuDe, 'Công an Cà Mau báo cáo');
});

test('giải được thực thể số, cả thập phân lẫn thập lục', () => {
  const [t] = bocRss(rss(item({ title: '&#7871;&#x1ED9; l&#7915;a &#273;&#7843;o' })), 'X');
  assert.strictEqual(t.tieuDe, 'ếộ lừa đảo');
});

test('tên thực thể lạ thì GIỮ NGUYÊN, không nuốt mất chữ', () => {
  const [t] = bocRss(rss(item({ title: 'gi&khongbiet; lừa đảo' })), 'X');
  assert.match(t.tieuDe, /&khongbiet;/);
});

// ══════════ Bộ lọc ══════════

const trung = (s) => LA_TIN_LUA_DAO.test(boDau(s.toLowerCase()));

test('bắt được tin lừa đảo thật', () => {
  for (const s of [
    'Bắt nhóm lừa đảo chiếm đoạt tiền tỷ',
    'Giả danh công an yêu cầu chuyển khoản',
    'Chiêu trò lừa hợp đồng kỳ nghỉ',
    'Cảnh báo mạo danh ngân hàng xin mã OTP',
    'Sập bẫy việc nhẹ lương cao',
  ]) assert.ok(trung(s), `bỏ sót: ${s}`);
});

/**
 * ⚠️ CA NÀY LÀ MỘT LỖI ĐÃ ĐO ĐƯỢC, KHÔNG PHẢI GIẢ ĐỊNH.
 *
 * Cụm `nhan qua` từng nằm trong bộ lọc. Bỏ dấu xong, tiêu đề "Ba công an hiến
 * máu cứu phạm NHÂN QUA nguy kịch" chứa đúng chuỗi đó — một tin hiến máu lọt
 * thẳng vào danh sách cảnh báo lừa đảo của bác.
 *
 * Bỏ dấu làm ranh giới ngữ nghĩa biến mất. Cụm hai âm tiết quá phổ biến là bẫy.
 */
test('không nhận nhầm tin thường thành tin lừa đảo', () => {
  for (const s of [
    'Ba công an hiến máu cứu phạm nhân qua nguy kịch',
    'Trụ sở Công an tỉnh cũ thành trường nội trú gần 900 học sinh',
    'Khởi tố tài xế gây tai nạn liên hoàn',
    'Hội nghị tổng kết công tác năm của ngành',
  ]) assert.ok(!trung(s), `nhận nhầm: ${s}`);
});

// ══════════ Danh sách nguồn ══════════

/**
 * ⚠️ ĐỪNG ĐỂ MỘT NGUỒN CHẾT NẰM LẠI TRONG DANH SÁCH.
 * cand.com.vn trả 302 và không theo được (dò 16/8/2026) — để lại thì tưởng
 * đang có 6 nguồn trong khi thực tế chỉ 5, và không ai biết vì lỗi bị nuốt.
 */
test('mọi nguồn đều có tên hiển thị và địa chỉ https', () => {
  assert.ok(NGUON.length >= 3, 'ít hơn 3 nguồn thì mất một tờ báo là mất nửa danh sách');
  for (const n of NGUON) {
    assert.ok(n.ten && n.ten.trim(), `nguồn thiếu tên hiển thị: ${JSON.stringify(n)}`);
    assert.match(n.rss, /^https:\/\//, `${n.ten} không dùng https`);
  }
  const ten = NGUON.map((n) => n.ten);
  assert.strictEqual(new Set(ten).size, ten.length, 'có nguồn trùng tên');
});
