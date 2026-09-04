'use strict';
/**
 * ĐƯỜNG HTTP CỦA PHÁT HIỆN THỤ ĐỘNG — đo QUA HTTP, không chỉ gọi hàm.
 *
 * §5.2: "Mọi thay đổi hành vi phải đo ở CẢ HAI, và đo QUA HTTP chứ không chỉ
 * gọi hàm." Bài học đắt nhất của repo này (§4.2 trong `bo-luat-khong-duoc-lech`)
 * là một bản mã được đo kỹ trong khi bản đang ship là bản khác.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

const TRUONG_HOP_DONG = ['nhan', 'maLyDo', 'daKiem', 'chuaKiem', 'hoKichBan', 'aiDaChay', 'canThiep'];

let server;
let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server?.close());

const goi = async (duong, body, method = 'POST') => {
  const res = await fetch(goc + duong, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('POST /api/detect — tin giả danh cơ quan ra CAO', async () => {
  const { status, body } = await goi('/api/detect', {
    nguon: 'sms', nguoiGui: '0912345678',
    noiDung: 'Thông báo phạt nguội, nộp tại csgt-tracuu.top trước 24h.',
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(body.nhan, 'CAO');
  assert.ok(body.luatKhopVoi.includes('R1'));
  assert.ok(typeof body.giaiThich === 'string' && body.giaiThich.length > 10);
  assert.ok(typeof body.doTre === 'number');
});

test('POST /api/detect — §6.9 không trả về số người gửi nguyên vẹn', async () => {
  const { body } = await goi('/api/detect', {
    nguon: 'sms', nguoiGui: '0912345678', noiDung: 'Bác xem link https://vidu.vn/a',
  });
  assert.notStrictEqual(body.nguoiGui, '0912345678');
});

test('POST /api/detect — thiếu nội dung ⇒ 400, không phải "chưa thấy dấu hiệu"', async () => {
  const { status, body } = await goi('/api/detect', { nguon: 'sms' });
  assert.strictEqual(status, 400);
  assert.strictEqual(body.maLoi, 'THIEU_NOI_DUNG');
});

test('POST /api/detect — nội dung quá dài ⇒ 413', async () => {
  const { status } = await goi('/api/detect', { noiDung: 'x'.repeat(5001) });
  assert.strictEqual(status, 413);
});

test('§HĐ — /api/detect KHÔNG làm đổi hình dạng của /api/analyze', async () => {
  // Hai luồng, một bộ luật. Thêm luồng mới không được phép nới hợp đồng cũ.
  const { body } = await goi('/api/analyze', { vanBan: 'Chiều nay cháu ghé chơi bác nhé.' });
  assert.deepStrictEqual(Object.keys(body).sort(), [...TRUONG_HOP_DONG].sort());
});

test('GET /api/detect/bo-luat — trả bộ luật có phiên bản, nạp lại được', async () => {
  const { status, body } = await goi('/api/detect/bo-luat', null, 'GET');
  assert.strictEqual(status, 200);
  assert.match(body.phienBan, /^\d{4}\.\d{2}\.\d{2}\+\d+$/);
  assert.ok(body.maoDanh.cum.length > 10);
  assert.ok(body.allowlist.tenMien.includes('csgt.vn'));

  // Hình dạng phải nạp lại được bằng chính `capNhatTuXa` — nếu không thì đường
  // cập nhật từ xa gãy đúng lúc cần nó nhất.
  const { chuanHoaGoi } = require('../backend/src/detect/bo-luat-store');
  assert.ok(chuanHoaGoi(body).maoDanh.length > 10);
});

test('POST /api/detect/verify — không trùng thì KHÔNG hạ nhãn (§4.3)', async () => {
  const { status, body } = await goi('/api/detect/verify', {
    tenMien: ['chua-ai-bao-cao.vn'], bamSoTaiKhoan: [], nhanTang0: 'CAO',
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(body.coTrung, false);
  assert.strictEqual(body.nhanSauTang2, 'CAO');
});

test('POST /api/detect/ung-dung — app cài ngoài cửa hàng ⇒ CAO + PROTECTED_CRITICAL', async () => {
  const { body } = await goi('/api/detect/ung-dung', {
    goi: 'com.la.hoang', tenHienThi: 'Dịch Vụ Công', installer: null, thoiDiem: Date.now(),
  });
  assert.strictEqual(body.nhan, 'CAO');
  assert.strictEqual(body.canThiep, 'PROTECTED_CRITICAL');
});

test('POST /api/detect/canh-bao — chưa cấu hình push thì NÓI THẬT, không giả vờ thành công', async () => {
  const { taoVongTron, themThanhVien, datQuyTac } = require('../backend/src/trusted-circle');
  let vt = taoVongTron('bac-nam');
  vt = themThanhVien(vt, { id: 'chi-huong', vaiTro: 'nguoi_than_tin_cay', boiAi: 'bac-nam' });
  vt = datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: 'chi-huong' }, 'bac-nam');

  const { body: kq } = await goi('/api/detect', {
    nguon: 'sms', nguoiGui: '0912345678',
    noiDung: 'Thông báo phạt nguội, nộp tại csgt-tracuu.top trước 24h.',
  });
  const { status, body } = await goi('/api/detect/canh-bao', {
    ketQua: kq, vongTron: vt, tenNguoiThan: 'chị Hương',
  });

  assert.strictEqual(status, 200);
  assert.strictEqual(body.phat, true);
  assert.strictEqual(body.nguoiCaoTuoi.dong3, 'chua_gui_duoc_cho_nguoi_than');

  // Ghi hành vi trên đúng cảnh báo đó.
  const mo = await goi(`/api/detect/canh-bao/${body.canhBaoId}/mo`, {});
  assert.strictEqual(mo.body.nguoiThanDaMo, true);
  const toiOn = await goi(`/api/detect/canh-bao/${body.canhBaoId}/toi-on`, {});
  assert.strictEqual(toiOn.body.nguoiCaoTuoiBamToiOn, true);
  assert.strictEqual(toiOn.body.nhan, kq.nhan, 'bấm "Tôi ổn" đã hạ nhãn của bản ghi');
});

test('POST /api/detect/canh-bao — thiếu vòng tròn ⇒ 400', async () => {
  const { status } = await goi('/api/detect/canh-bao', { ketQua: { nhan: 'CAO' } });
  assert.strictEqual(status, 400);
});

test('POST /api/dien-tap/phat — không có phiếu đồng ý thì KHÔNG phát', async () => {
  const { body } = await goi('/api/dien-tap/phat', { nguoiId: 'bac-nam', phieuDongY: null });
  assert.strictEqual(body.phat, false);
  assert.strictEqual(body.ly, 'chua_dong_y_dien_tap');
});

test('POST /api/dien-tap/phat — có phiếu đồng ý thì phát, tin mang cờ laDienTap', async () => {
  const { body } = await goi('/api/dien-tap/phat', {
    nguoiId: `bac-${Date.now()}`,
    phieuDongY: { dongYDienTap: true, baoTruocLuc: 1, daTat: false },
  });
  assert.strictEqual(body.phat, true);
  assert.strictEqual(body.tin.laDienTap, true);
  assert.ok(body.tin.link.startsWith('/dien-tap/'));
});

test('GET trang giải thích diễn tập — KHÔNG có ô nhập liệu nào', async () => {
  const { status, body } = await goi('/api/dien-tap/kich-ban/DT-03/giai-thich', null, 'GET');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.coONhap, false);
  assert.deepStrictEqual(body.maCau, [
    'day_la_bai_dien_tap', 'tin_that_cung_trong_y_nhu_vay', 'dau_hieu_nhan_biet',
  ]);
});

test('GET /api/bao-cao-tuan — máy chủ KHÔNG tự khai quyền vẫn còn hiệu lực (§4.3)', async () => {
  const { status, body } = await goi('/api/bao-cao-tuan', null, 'GET');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.heThong.quyenDocThongBao, 'khong_do_duoc');
  assert.strictEqual(body.heThong.chayNen, 'khong_do_duoc');
  assert.ok(typeof body.soLuotQuet === 'number');
  assert.ok(body.maCauChinh);
});

test('GET /api/bao-cao-tuan?tanSuat=tat — người thân tắt được', async () => {
  const { body } = await goi('/api/bao-cao-tuan?tanSuat=tat', null, 'GET');
  assert.strictEqual(body.gui, false);
  assert.strictEqual(body.lyDo, 'nguoi_than_da_tat');
});
