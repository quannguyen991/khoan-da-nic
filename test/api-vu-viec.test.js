'use strict';
/**
 * §6.11 · §9.4 — ĐO QUA HTTP THẬT.
 * §5.2: "Mọi thay đổi hành vi phải đo QUA HTTP chứ không chỉ gọi hàm."
 *
 * Ràng buộc nặng nhất ở tầng này là §6.9: máy chủ KHÔNG lưu và KHÔNG trả lại
 * nội dung thô. Sự kiện vụ việc chỉ mang THỰC THỂ ĐÃ TRÍCH.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../server');

let server; let goc;

test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server?.close());

const post = async (duong, body) => {
  const res = await fetch(goc + duong, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const get = async (duong) => {
  const res = await fetch(goc + duong);
  return { status: res.status, body: await res.json().catch(() => null) };
};

const T0 = 1_760_000_000_000;
const TIN = 'Tôi là công an, gọi từ 0912345678. Bác chuyển 20 triệu ngay.';

// ═══════════ §6.11 — bộ nhớ vụ việc ═══════════

test('§6.11 — trả THỰC THỂ ĐÃ TRÍCH, KHÔNG trả lại nội dung thô', async () => {
  const { status, body } = await post('/api/vu-viec/ung-vien', { vanBan: TIN, kenh: 'goi_dien', thoiDiem: T0 });
  assert.strictEqual(status, 200);
  const chu = JSON.stringify(body);
  assert.ok(!chu.includes('Bác chuyển 20 triệu'), 'nội dung thô bị trả lại');
  assert.ok(body.suKien.thucThe.dienThoai.includes('0912345678'));
  assert.ok(body.suKien.thucThe.toChuc.includes('cong_an'));
});

test('§6.11 — KHÔNG TỰ GỘP: trả câu hỏi để người dùng quyết', async () => {
  const hoSo = [{
    id: 'hs-1', capNhatLuc: T0, dong: false,
    suKien: [{ kenh: 'goi_dien', giaiDoan: 'tao_long_tin' }],
    thucThe: { dienThoai: ['0912345678'], soTaiKhoan: [], tenMien: [], app: [], toChuc: ['cong_an'] },
  }];
  const { body } = await post('/api/vu-viec/ung-vien',
    { vanBan: TIN, kenh: 'zalo', thoiDiem: T0 + 86400000, hoSoDangMo: hoSo });
  assert.strictEqual(body.cauHoiGop.canHoi, true);
  assert.strictEqual(body.cauHoiGop.hoSoUngVien, 'hs-1');
  assert.ok(body.cauHoiGop.viSao.length > 0, 'phải nói vì sao nghi là cùng vụ');
});

test('A.8 — CHƯA xác nhận gộp thì route /gop từ chối', async () => {
  const { status, body } = await post('/api/vu-viec/gop', { vanBan: TIN, hoSo: {} });
  assert.strictEqual(status, 400);
  assert.strictEqual(body.maLoi, 'CHUA_XAC_NHAN_GOP');
});

test('A.8 — ĐÃ xác nhận gộp thì tín hiệu CASE_* đi qua ĐÚNG bộ luật', async () => {
  const hoSo = {
    id: 'hs-1',
    suKien: [{ kenh: 'goi_dien', giaiDoan: 'tao_long_tin' }, { kenh: 'goi_dien', giaiDoan: 'gay_ap_luc' }],
  };
  const { status, body } = await post('/api/vu-viec/gop',
    { vanBan: TIN, kenh: 'zalo', hoSo, daXacNhanGop: true, thoiDiem: T0 });
  assert.strictEqual(status, 200);
  assert.ok(body.tinHieuVuViec.includes('CASE_MULTI_CHANNEL_ESCALATION'));
  assert.ok(['CAO', 'NGHI_NGO', 'CHUA_THAY'].includes(body.nhan));
});

test('§6.11 — ba lớp hiển thị đều là MÃ, không phải câu tiếng Việt', async () => {
  const { body } = await post('/api/vu-viec/ung-vien', { vanBan: TIN, thoiDiem: T0 });
  const bl = body.baLop;
  for (const x of [...bl.bietChac, ...bl.nghiNgo, ...bl.canXacMinhThem]) {
    assert.ok(!/[À-ỹ]/.test(x), `phải là mã: ${x}`);
  }
});

// ═══════════ §2B.5 — kế hoạch phục hồi ═══════════

test('§2B.5 — kế hoạch phục hồi KHÔNG cần đăng nhập', async () => {
  const { status, body } = await get('/api/ke-hoach-phuc-hoi?nuoc=VN');
  assert.strictEqual(status, 200);
  assert.ok(body.buoc.length > 0);
  assert.strictEqual(body.buoc[0], 'ngung_moi_lien_lac_voi_ben_kia');
});

test('§2B.5 — KHÔNG bịa hotline: danh sách rỗng và có cảnh báo', async () => {
  const { body } = await get('/api/ke-hoach-phuc-hoi?nuoc=VN');
  assert.deepStrictEqual(body.hotline, []);
  assert.ok(body.canhBao.includes('chua_xac_minh_duoc_so_tong_dai_dung_so_in_sau_the'));
});

test('§2B.5 — nước lạ rơi về bước chung, có cảnh báo', async () => {
  const { body } = await get('/api/ke-hoach-phuc-hoi?nuoc=ZZ');
  assert.strictEqual(body.daDuyet, false);
  assert.ok(body.canhBao.includes('nuoc_chua_duoc_duyet_chi_co_buoc_chung'));
});

// ═══════════ §4.2 — Ra-đa không đụng vào mức ═══════════

test('§4.2 — Ra-đa tự khai không ảnh hưởng mức', async () => {
  const { body } = await post('/api/ra-da', { vanBan: TIN });
  assert.strictEqual(body.anhHuongMuc, false);
});

// ═══════════ §9.4 — cảnh báo người thân ═══════════

const vongTron = () => {
  let vt = TC.taoVongTron('bac');
  vt = TC.themThanhVien(vt, { id: 'con', vaiTro: 'nguoi_than_tin_cay', boiAi: 'bac' });
  return TC.datQuyTac(vt, { nguongTien: 5e6, nguoiNhanCanhBaoId: 'con' }, 'bac');
};
const TC = require('../src/trusted-circle');

test('§9.4 — KHÔNG auto-alert ở mức thấp', async () => {
  const { body } = await post('/api/canh-bao-nguoi-than',
    { vongTron: vongTron(), vanBan: 'Chiều nay cháu ghé chơi bác nhé.' });
  assert.strictEqual(body.daGui, false);
  assert.strictEqual(body.lyDo, 'muc_qua_thap');
});

test('§9.4 — "đừng nhắn lần này" huỷ MỘT lần gửi', async () => {
  const { body } = await post('/api/canh-bao-nguoi-than',
    { vongTron: vongTron(), vanBan: TIN, huyLanNay: true });
  assert.strictEqual(body.daGui, false);
  assert.strictEqual(body.lyDo, 'nguoi_dung_huy_lan_nay');
});

test('§9.4 — chưa có hạ tầng push thì NÓI THẬT, không giả vờ thành công', async () => {
  const { body } = await post('/api/canh-bao-nguoi-than',
    { vongTron: vongTron(), vanBan: 'Bác chuyển hết tiền sang tài khoản an toàn ngay.', soTien: 37_500_000 });
  assert.strictEqual(body.daGui, true);
  assert.strictEqual(body.trangThai, 'khong_xac_nhan_duoc_canh_bao_da_toi_may_nguoi_than');
});

test('§9.8.4 + §6.9 — payload gửi đi KHÔNG mang số tiền chính xác và nội dung thô', async () => {
  const { body } = await post('/api/canh-bao-nguoi-than',
    { vongTron: vongTron(), vanBan: TIN, soTien: 37_500_000 });
  const chu = JSON.stringify(body.payload);
  assert.ok(!chu.includes('37500000'), 'số tiền chính xác rò ra ngoài máy');
  assert.ok(!chu.includes('0912345678'), 'số điện thoại rò ra ngoài máy');
  assert.ok(!chu.includes('công an'), 'nội dung thô rò ra ngoài máy');
  assert.strictEqual(body.payload.khoangTien, 'tu_20_den_100_trieu');
});

test('§11 — không endpoint nào trả trạng thái "đã đọc và hiểu"', async () => {
  const { body } = await post('/api/canh-bao-nguoi-than',
    { vongTron: vongTron(), vanBan: 'Bác chuyển hết tiền sang tài khoản an toàn ngay.' });
  assert.ok(!/da_doc_va_hieu|understood/.test(JSON.stringify(body)));
});
