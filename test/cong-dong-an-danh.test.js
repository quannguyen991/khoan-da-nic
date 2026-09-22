'use strict';
/**
 * CỘNG ĐỒNG CẢNH GIÁC — hai bất biến, đọc mã nguồn thay vì dò UI.
 *
 * §12 cấm "tự thu thập / scrape danh tính người bị tố lừa đảo. Ra-đa nhận
 * tactic/pattern, không quy kết cá nhân từ một báo cáo." Tính năng này là nơi
 * dễ trượt luật đó nhất trong cả dự án — bài đăng của một người thường có tên,
 * số điện thoại, hay chi tiết đủ để nhận ra ai đó.
 */

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const CD = require(path.join(GOC, 'backend', 'src', 'cong-dong-canh-giac'));
const { HO_KICH_BAN_MA } = require(path.join(GOC, 'backend', 'src', 'analysis', 'pipeline'));

test('bản chờ duyệt KHÔNG có trường nào chứa nội dung gốc', async () => {
  const noiDungBiMat = 'Chị Nguyễn Thị B ở 12 Lê Lợi, số 0912345678, đã chuyển 50 triệu cho tài khoản 9999888877.';
  const ban = await CD.taoBanChoDuyet(noiDungBiMat);

  const json = JSON.stringify(ban);
  assert.ok(!json.includes('Nguyễn Thị B'), 'rò tên người trong bản chờ duyệt');
  assert.ok(!json.includes('0912345678'), 'rò số điện thoại trong bản chờ duyệt');
  assert.ok(!json.includes('9999888877'), 'rò số tài khoản trong bản chờ duyệt');
  assert.ok(!json.includes('Lê Lợi'), 'rò địa chỉ trong bản chờ duyệt');

  // Chỉ được có đúng các trường đã định — thêm một trường mới là phải tự hỏi
  // trường đó có mang nội dung gốc không.
  const truongChoPhep = ['id', 'trangThai', 'luc', 'hoKichBan', 'maLyDo', 'tomTat', 'aiDaChay'];
  const truongLa = Object.keys(ban).filter((k) => !truongChoPhep.includes(k));
  assert.deepStrictEqual(truongLa, [], `bản chờ duyệt có trường lạ chưa được xét privacy: ${truongLa.join(', ')}`);
});

test('nội dung quá ngắn bị từ chối, không tạo bản chờ duyệt rỗng', async () => {
  await assert.rejects(() => CD.taoBanChoDuyet('a'), /NOI_DUNG_QUA_NGAN/);
});

test('bài chỉ hiện công khai SAU KHI có người duyệt bằng đúng token', async () => {
  const ban = await CD.taoBanChoDuyet('Có người gọi xưng công an, bảo tôi chuyển tiền vào tài khoản an toàn ngay.');
  const truoc = CD.layDaDuyet();
  assert.ok(!truoc.some((b) => b.id === ban.id), 'bài chưa duyệt mà đã lọt vào danh sách công khai');

  const saiToken = CD.duyet(ban.id, 'sai-token-chac-chan');
  assert.strictEqual(saiToken, null, 'token sai vẫn duyệt được — cổng duyệt không có tác dụng');

  const truocMoi = process.env.KHOAN_DA_REVIEW_TOKEN;
  process.env.KHOAN_DA_REVIEW_TOKEN = 'token-test-rieng';
  try {
    const dungToken = CD.duyet(ban.id, 'token-test-rieng');
    assert.ok(dungToken, 'token đúng mà vẫn không duyệt được');
    const sau = CD.layDaDuyet();
    assert.ok(sau.some((b) => b.id === ban.id), 'đã duyệt mà vẫn không xuất hiện ở danh sách công khai');
  } finally {
    if (truocMoi === undefined) delete process.env.KHOAN_DA_REVIEW_TOKEN;
    else process.env.KHOAN_DA_REVIEW_TOKEN = truocMoi;
  }
});

/**
 * ⚠️ SỬA 22/9/2026 — canh đúng lỗi vừa tìm thấy: bảng tên kịch bản của tính
 * năng này từng dùng mã `lua_dau_tu`, một mã KHÔNG TỒN TẠI trong
 * `HO_KICH_BAN_MA` mà `pipeline.js` thực sự trả về. Hậu quả im lặng: mọi bài
 * đăng về kịch bản dụ đầu tư rơi vào câu chung chung, và không ai thấy gì bất
 * thường vì câu chung chung vẫn đọc trơn tru — đúng dạng lỗi §4.3.
 *
 * Ca này không đòi TEN_HO phủ hết mọi mã (một vài mã hiếm gặp có thể chưa cần
 * tên riêng), nhưng đòi MỌI khoá đang có trong TEN_HO phải là một mã THẬT.
 */
test('mọi mã kịch bản trong bảng tên của cộng đồng đều là mã thật của pipeline', () => {
  const s = require('fs').readFileSync(
    path.join(GOC, 'backend', 'src', 'cong-dong-canh-giac.js'), 'utf8',
  );
  const i = s.indexOf('const TEN_HO');
  const khoi = s.slice(i, s.indexOf('});', i));
  const maKhaiBao = [...khoi.matchAll(/^\s*([a-z][a-z0-9_]*):/gm)].map((m) => m[1]);

  assert.ok(maKhaiBao.length > 0, 'không đọc được mã nào trong TEN_HO — đổi cách viết thì sửa cả test này');

  const maLa = maKhaiBao.filter((ma) => !HO_KICH_BAN_MA.includes(ma));
  assert.deepStrictEqual(maLa, [],
    `TEN_HO có mã không tồn tại trong HO_KICH_BAN_MA của pipeline: ${maLa.join(', ')}. `
    + 'Bài đăng mang mã đó sẽ luôn rơi vào câu chung chung, im lặng không ai biết.');
});

test('tóm tắt sinh ra không bao giờ hứa "an toàn" hay khẳng định dấu hiệu vắng mặt', async () => {
  /*
   * ⚠️ XÉT CHỮ THẬT SẼ HIỆN RA CHO NGƯỜI DÙNG, KHÔNG XÉT TOÀN VĂN TỆP MÃ NGUỒN.
   * Chú thích kỹ thuật ("bản tóm tắt an toàn" = không rò dữ liệu) không phải
   * chữ §11 canh; chữ đó nói về nội dung, không nói về mã. Xét đúng chuỗi đi
   * ra cho bác đọc: kết quả thật của `taoTomTat()` trên vài kịch bản, cộng các
   * giá trị trong hai bảng tên hiển thị (TEN_HO / TEN_MA).
   */
  const kichBan = [
    'Có người gọi xưng công an, bảo tôi chuyển tiền vào tài khoản an toàn ngay.',
    'Ai đó dụ tôi cài ứng dụng lạ để họ hỗ trợ từ xa.',
    'Một tin nhắn mời đầu tư lợi nhuận cao, không rõ nguồn.',
  ];
  const tomTatThat = [];
  for (const cau of kichBan) {
    const ban = await CD.taoBanChoDuyet(cau);
    tomTatThat.push(ban.tomTat);
  }

  const s = require('fs').readFileSync(
    path.join(GOC, 'backend', 'src', 'cong-dong-canh-giac.js'), 'utf8',
  );
  const iHo = s.indexOf('const TEN_HO');
  const iMa = s.indexOf('const TEN_MA');
  const khoiHo = s.slice(iHo, s.indexOf('});', iHo));
  const khoiMa = s.slice(iMa, s.indexOf('});', iMa));
  const giaTriHien = [...khoiHo.matchAll(/: '([^']*)'/g), ...khoiMa.matchAll(/: '([^']*)'/g)]
    .map((m) => m[1]);

  for (const cau of [...tomTatThat, ...giaTriHien]) {
    assert.ok(!/\ban toàn\b/i.test(cau) || /dụ chuyển vào tài khoản an toàn/i.test(cau),
      `§11 cấm nhãn "an toàn": "${cau}"`);
    assert.ok(!/chưa thấy dấu hiệu|không có dấu hiệu|không hề/i.test(cau),
      `§11 cấm khẳng định một dấu hiệu VẮNG MẶT trong nội dung của người khác: "${cau}"`);
  }
});
