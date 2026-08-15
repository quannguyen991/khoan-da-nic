'use strict';
/**
 * §2B.2 hạng mục 25 — lưu trữ + ghép đôi + đẩy thông báo.
 *
 * §9.4 — trạng thái giao nhận KHÔNG ĐƯỢC NÓI QUÁ.
 * §6.9 — tầng máy chủ KHÔNG lưu nội dung thô.
 * §5.3 — auth KHÔNG gate chức năng kiểm tra cơ bản.
 */

const test = require('node:test');
const assert = require('node:assert');

const P = require('../src/push');
const V = require('../src/vault-store');
const A = require('../src/auth');

// ═══════════ §9.4 — không nói quá ═══════════

test('§9.4 — chưa cấu hình VAPID thì NÓI THẬT, không giả lập thành công', async () => {
  const kq = await P.guiCanhBao({ dangKy: {}, payload: {}, env: {} });
  assert.strictEqual(kq.trangThai, 'CHUA_CAU_HINH_PUSH');
});

test('§9.4 — có VAPID nhưng nhà cung cấp lỗi ⇒ KHÔNG xác nhận được', async () => {
  const env = { VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:x@y.z' };
  const kq = await P.guiCanhBao({
    dangKy: { endpoint: 'https://push.example.com/x', keys: { p256dh: 'p', auth: 'a' } },
    payload: {}, env, guiThat: async () => { throw new Error('mạng hỏng'); },
  });
  assert.strictEqual(kq.trangThai, 'PUSH_DELIVERY_UNKNOWN');
  assert.strictEqual(kq.chiTiet, 'mạng hỏng', '§6.7 — giữ nguyên nhân gốc cho log');
});

test('§9.4 — gửi thành công CHỈ nghĩa là "đã đẩy đi"', async () => {
  const env = { VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:x@y.z' };
  const kq = await P.guiCanhBao({
    dangKy: { endpoint: 'https://push.example.com/x', keys: { p256dh: 'p', auth: 'a' } },
    payload: {}, env, guiThat: async () => ({ ok: true, status: 201 }),
  });
  assert.strictEqual(P.maHienThi(kq.trangThai), 'da_day_canh_bao_di');
});

test('§11 — KHÔNG có đích đến nào tên "đã đọc" hay "đã hiểu"', () => {
  const dich = [
    P.maHienThi('DA_DAY_DI'), P.maHienThi('PUSH_DELIVERY_UNKNOWN'),
    P.maHienThi('CHUA_CAU_HINH_PUSH'), P.maHienThi('DA_DAY_DI', true),
  ];
  assert.strictEqual(new Set(dich).size, 3, 'chỉ được có BA đích đến');
  for (const d of dich) {
    assert.ok(!/da_doc|da_hieu|understood|read/.test(d), `đích vi phạm §11: ${d}`);
  }
});

test('§9.4 — 410 nghĩa là đăng ký đã chết, không phải đã gửi được', async () => {
  const env = { VAPID_PUBLIC_KEY: 'a', VAPID_PRIVATE_KEY: 'b', VAPID_SUBJECT: 'mailto:x@y.z' };
  const kq = await P.guiCanhBao({
    dangKy: { endpoint: 'https://push.example.com/x', keys: { p256dh: 'p', auth: 'a' } },
    payload: {}, env, guiThat: async () => ({ ok: false, status: 410 }),
  });
  assert.strictEqual(kq.trangThai, 'DANG_KY_HET_HAN');
});

test('§6.8 — endpoint push PHẢI là https', () => {
  assert.throws(() => P.chuanHoaDangKy({ endpoint: 'http://x/y', keys: { p256dh: 'p', auth: 'a' } }),
    /ENDPOINT_PHAI_LA_HTTPS/);
});

test('§6.9 — đăng ký chuẩn hoá chỉ giữ endpoint và khoá, bỏ mọi trường thừa', () => {
  const dk = P.chuanHoaDangKy({
    endpoint: 'https://push.example.com/x', keys: { p256dh: 'p', auth: 'a' },
    hoTen: 'Nguyễn Văn A', soDienThoai: '0912345678',
  });
  assert.deepStrictEqual(Object.keys(dk).sort(), ['endpoint', 'keys']);
  assert.ok(!JSON.stringify(dk).includes('0912345678'));
});

// ═══════════ §6.9 — kho từ chối nội dung thô ═══════════

test('§6.9 — kho NÉM LỖI khi nhận nội dung thô, không lọc bỏ rồi nhận', async () => {
  const kho = await V.moKho({ env: {} });
  for (const truong of ['noiDung', 'vanBan', 'otp', 'soTaiKhoan', 'evidence']) {
    await assert.rejects(() => kho.luu('vuViec', 'x', { [truong]: 'gì đó' }),
      /TRUONG_BI_CAM_O_TANG_MAY_CHU/, `trường ${truong} lọt vào kho`);
  }
});

test('§6.9 — nội dung thô LỒNG SÂU cũng bị chặn', async () => {
  const kho = await V.moKho({ env: {} });
  await assert.rejects(
    () => kho.luu('vuViec', 'x', { suKien: [{ chiTiet: { vanBan: 'tin nhắn lừa đảo' } }] }),
    /TRUONG_BI_CAM_O_TANG_MAY_CHU/,
  );
});

test('§6.9 — dữ liệu hợp lệ vẫn lưu được bình thường', async () => {
  const kho = await V.moKho({ env: {} });
  await kho.luu('vuViec', 'hs-1', { giaiDoan: 'gay_ap_luc', khoangTien: 'tu_5_den_20_trieu' });
  assert.strictEqual((await kho.doc('vuViec', 'hs-1')).giaiDoan, 'gay_ap_luc');
});

test('§9.8.3 — nhật ký audit chỉ ghi thêm, kho KHÔNG có hàm xoá audit', async () => {
  const kho = await V.moKho({ env: {} });
  await kho.themAudit({ ai: 'con', luc: 1 });
  await kho.themAudit({ ai: 'con', luc: 2 });
  assert.strictEqual((await kho.docAudit()).length, 2);
  assert.ok(!('xoaAudit' in kho) && !('clearAudit' in kho));
});

test('§6.7 — không có DATABASE_URL thì dùng bộ nhớ tạm, và NÓI RA loại kho', async () => {
  const kho = await V.moKho({ env: {} });
  assert.strictEqual(kho.loai, 'bo_nho_tam');
});

// ═══════════ §5.3 — auth không chặn chức năng cơ bản ═══════════

test('§5.3 — route kiểm tra cơ bản KHÔNG BAO GIỜ đòi đăng nhập', () => {
  for (const d of ['/api/analyze', '/api/phan-tich', '/api/suc-khoe', '/transparency']) {
    assert.strictEqual(A.canDangNhap(d), false, `${d} đang đòi đăng nhập`);
  }
});

test('§9.8 — mã ghép đôi dùng nguồn ngẫu nhiên MẬT MÃ, không phải Math.random', () => {
  // ⚠️ Phải BỎ CHÚ THÍCH trước khi quét: auth.js có dòng giải thích vì sao KHÔNG
  // dùng Math.random, và quét thô sẽ bắt đúng lời giải thích đó.
  const nguon = require('node:fs').readFileSync(require.resolve('../src/auth'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  assert.ok(!nguon.includes('Math.random'),
    'mã đoán được là ai cũng ghép vào vòng tròn gia đình của người khác');
  assert.ok(nguon.includes('randomInt'));
});

test('§9.8 — mã ghép đôi hết hạn, dùng một lần, so sánh chống đo thời gian', () => {
  const T = 1_760_000_000_000;
  const ban = A.taoMaGhep({ chuTaiKhoanId: 'bac', bayGio: T });
  assert.match(ban.ma, /^\d{6}$/);

  assert.strictEqual(A.kiemMaGhep(ban, ban.ma, T).hopLe, true);
  assert.strictEqual(A.kiemMaGhep(ban, '000000', T).hopLe === false, true);
  assert.strictEqual(A.kiemMaGhep(ban, ban.ma, T + A.HAN_MA_GHEP_MS + 1).lyDo, 'ma_het_han');
  assert.strictEqual(A.kiemMaGhep(A.danhDauDaDung(ban), ban.ma, T).lyDo, 'ma_da_dung_roi');

  const nguon = require('node:fs').readFileSync(require.resolve('../src/auth'), 'utf8');
  assert.ok(nguon.includes('timingSafeEqual'), 'so mã bằng === là rò rỉ từng ký tự');
});

test('Token phiên KHÔNG nhúng thông tin cá nhân', () => {
  const p = A.taoPhien({ thanhVienId: 'bac', bayGio: 1 });
  assert.ok(!p.token.includes('bac'));
  assert.ok(p.token.length >= 40);
});
