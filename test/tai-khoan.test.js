/**
 * HÀNG RÀO TÀI KHOẢN.
 *
 * Bộ này canh ba thứ, theo thứ tự quan trọng:
 *   ① mật khẩu KHÔNG BAO GIỜ ra khỏi máy chủ dưới dạng đọc được
 *   ② đăng nhập sai KHÔNG tiết lộ số nào đã đăng ký (§11)
 *   ③ dữ liệu SỐNG QUA lần khởi động lại — cái sai gốc mà người dùng thấy
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { moKho } = require('../src/vault-store');
const {
  dangKy, dangNhap, layHoSo, suaHoSo, doiMatKhau, chuanHoaSo, LoiTaiKhoan,
} = require('../src/tai-khoan');

const tepTam = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kd-')), 'kho.sqlite');
const moTam = () => moKho({ env: { SQLITE_PATH: tepTam() } });

const AI = { ten: 'Nguyễn Văn An', soDienThoai: '0912345678', matKhau: 'baccuachau' };

// ══════════ Mật khẩu ══════════

/**
 * ⚠️ CA QUAN TRỌNG NHẤT CỦA TỆP NÀY.
 * `vault-store.js` có `matKhau`/`password` trong `TRUONG_CAM` và NÉM LỖI khi
 * gặp. Test này chứng minh hàng rào đó còn sống — nếu ai đó gỡ nó ra, hoặc đổi
 * tên trường lưu thành `matKhau`, test đỏ ngay.
 */
test('kho TỪ CHỐI lưu mật khẩu thô — hàng rào §6.9 còn sống', async () => {
  const kho = await moTam();
  await assert.rejects(
    () => kho.luu('tai_khoan', 'x', { id: 'x', matKhau: 'bimat123' }),
    (e) => e.ma === 'TRUONG_BI_CAM_O_TANG_MAY_CHU',
  );
  await kho.dong();
});

test('không lưu mật khẩu ở dạng đọc được, ở bất cứ đâu trong kho', async () => {
  const kho = await moTam();
  await dangKy(kho, AI);

  const tatCa = JSON.stringify([
    ...(await kho.liet('tai_khoan')),
    ...(await kho.liet('tai_khoan_theo_so')),
    ...(await kho.docAudit()),
  ]);
  assert.ok(!tatCa.includes(AI.matKhau), 'mật khẩu nằm nguyên văn trong kho');
  await kho.dong();
});

test('hồ sơ trả ra ngoài KHÔNG mang bam/muoi', async () => {
  const kho = await moTam();
  const hs = await dangKy(kho, AI);
  assert.ok(!('bam' in hs) && !('muoi' in hs), `rò trường bí mật: ${JSON.stringify(hs)}`);
  await kho.dong();
});

// ══════════ §11 — không tiết lộ số nào đã đăng ký ══════════

test('§11 — sai số và sai mật khẩu trả về CÙNG một mã lỗi', async () => {
  const kho = await moTam();
  await dangKy(kho, AI);

  const loi = async (p) => {
    try { await dangNhap(kho, p); return null; } catch (e) { return e.ma; }
  };
  const chuaDangKy = await loi({ soDienThoai: '0900000000', matKhau: 'gicungduoc' });
  const saiMatKhau = await loi({ soDienThoai: AI.soDienThoai, matKhau: 'saibet' });

  assert.strictEqual(chuaDangKy, 'SAI_SO_HOAC_MAT_KHAU');
  assert.strictEqual(saiMatKhau, 'SAI_SO_HOAC_MAT_KHAU');
  await kho.dong();
});

/**
 * ⚠️ THỜI GIAN PHẢN HỒI CŨNG LÀ MỘT CÂU TRẢ LỜI.
 * Thoát sớm khi không tìm thấy tài khoản thì lượt đó về sau ~0ms, còn lượt sai
 * mật khẩu mất cả trăm ms vì phải băm. Chênh lệch ấy tự nó nói số nào đã đăng
 * ký. Nên hàm đăng nhập LUÔN chạy hết một lượt băm.
 */
test('§11 — thời gian phản hồi không tiết lộ số đã đăng ký', async () => {
  const kho = await moTam();
  await dangKy(kho, AI);

  const do_ = async (p) => {
    const t = process.hrtime.bigint();
    try { await dangNhap(kho, p); } catch { /* mong đợi */ }
    return Number(process.hrtime.bigint() - t) / 1e6;
  };
  // Lượt đầu tốn thêm cho việc nạp module — bỏ đi.
  await do_({ soDienThoai: AI.soDienThoai, matKhau: 'x' });

  const khong = await do_({ soDienThoai: '0900000000', matKhau: 'x' });
  const co = await do_({ soDienThoai: AI.soDienThoai, matKhau: 'x' });

  const tiLe = Math.max(khong, co) / Math.max(1e-3, Math.min(khong, co));
  assert.ok(tiLe < 5, `chênh lệch thời gian quá lớn (${khong.toFixed(1)}ms vs ${co.toFixed(1)}ms)`);
  await kho.dong();
});

// ══════════ Dữ liệu thật, sống qua khởi động lại ══════════

/**
 * ⚠️ ĐÂY LÀ CÁI SAI GỐC NGƯỜI DÙNG THẤY: "dữ liệu vẫn y hệt dữ liệu giả".
 * `DATABASE_URL` không đặt ⇒ kho từng rơi về `Map` trong RAM: nhận mọi lệnh
 * ghi, báo thành công, rồi mất sạch khi khởi động lại.
 */
test('tài khoản sống qua lần khởi động lại máy chủ', async () => {
  const tep = tepTam();

  const kho1 = await moKho({ env: { SQLITE_PATH: tep } });
  assert.strictEqual(kho1.loai, 'sqlite', `kho không phải sqlite mà là ${kho1.loai}`);
  const hs = await dangKy(kho1, AI);
  await kho1.dong();

  // Máy chủ khởi động lại.
  const kho2 = await moKho({ env: { SQLITE_PATH: tep } });
  const doc = await layHoSo(kho2, hs.id);
  assert.deepStrictEqual(doc, hs, 'tài khoản biến mất sau khi khởi động lại');

  // Và đăng nhập được bằng đúng mật khẩu cũ.
  assert.strictEqual((await dangNhap(kho2, AI)).id, hs.id);
  await kho2.dong();
});

test('không có DATABASE_URL thì vẫn là kho bền, không phải bộ nhớ tạm', async () => {
  const kho = await moKho({ env: { SQLITE_PATH: tepTam() } });
  assert.notStrictEqual(kho.loai, 'bo_nho_tam',
    'rơi về bộ nhớ tạm — dữ liệu sẽ mất im lặng mỗi lần khởi động lại');
  await kho.dong();
});

// ══════════ Kiểm đầu vào ══════════

test('số điện thoại chuẩn hoá về một dạng duy nhất', () => {
  for (const s of ['0912345678', '+84912345678', '84912345678', '091 234 5678', '091-234-5678']) {
    assert.strictEqual(chuanHoaSo(s), '0912345678', `hỏng với: ${s}`);
  }
});

test('không đăng ký trùng số', async () => {
  const kho = await moTam();
  await dangKy(kho, AI);
  await assert.rejects(() => dangKy(kho, AI), (e) => e.ma === 'SO_DA_DUOC_DANG_KY');
  await kho.dong();
});

test('từ chối mật khẩu quá ngắn', async () => {
  const kho = await moTam();
  await assert.rejects(
    () => dangKy(kho, { ...AI, matKhau: '123' }),
    (e) => e.ma === 'MAT_KHAU_QUA_NGAN',
  );
  await kho.dong();
});

/**
 * ⚠️ SỬA HỒ SƠ CHỈ NHẬN ĐÚNG TRƯỜNG ĐƯỢC LIỆT KÊ.
 * Trộn cả object vào bản ghi là mở đường cho ai đó tự ghi đè `bam` — tức tự
 * đặt lại mật khẩu của chính mình mà không cần biết mật khẩu cũ.
 */
test('sửa hồ sơ không ghi đè được bam, muoi hay id', async () => {
  const kho = await moTam();
  const hs = await dangKy(kho, AI);

  await suaHoSo(kho, hs.id, {
    ten: 'Tên mới', bam: 'bam-cua-ke-tan-cong', muoi: 'x', id: 'khac', vai: 'nguoi_than',
  });

  const b = await kho.doc('tai_khoan', hs.id);
  assert.strictEqual(b.ten, 'Tên mới');
  assert.strictEqual(b.vai, 'nguoi_than');
  assert.notStrictEqual(b.bam, 'bam-cua-ke-tan-cong', 'ghi đè được bam — tự đặt lại mật khẩu');
  assert.strictEqual(b.id, hs.id, 'ghi đè được id');
  // Và mật khẩu cũ vẫn dùng được.
  assert.strictEqual((await dangNhap(kho, AI)).id, hs.id);
  await kho.dong();
});

test('đổi mật khẩu ĐÒI mật khẩu cũ', async () => {
  const kho = await moTam();
  const hs = await dangKy(kho, AI);

  await assert.rejects(
    () => doiMatKhau(kho, hs.id, { matKhauCu: 'saibet', matKhauMoi: 'matkhaumoi' }),
    (e) => e.ma === 'SAI_MAT_KHAU_CU',
  );

  await doiMatKhau(kho, hs.id, { matKhauCu: AI.matKhau, matKhauMoi: 'matkhaumoi' });
  await assert.rejects(() => dangNhap(kho, AI), (e) => e.ma === 'SAI_SO_HOAC_MAT_KHAU');
  assert.strictEqual((await dangNhap(kho, { ...AI, matKhau: 'matkhaumoi' })).id, hs.id);
  await kho.dong();
});

// ══════════ §5.3 — tài khoản không gác đường kiểm tra ══════════

test('§5.3 — /api/analyze không nằm sau đăng nhập', () => {
  const { KHONG_CAN_DANG_NHAP } = require('../src/auth');
  assert.ok(KHONG_CAN_DANG_NHAP.includes('/api/analyze'),
    'đường kiểm tin nhắn bị gác sau đăng nhập — người đang bị thúc sẽ đóng app');
});

// ══════════ Bộ test không được chạm vào kho thật ══════════

/**
 * ⚠️ BẪY ĐÃ DẪM PHẢI 16/8/2026 — ĐỌC TRƯỚC KHI SỬA `moKho`.
 *
 * `khoan-proof.js` gọi `moKho()` KHÔNG THAM SỐ. Sau khi SQLite thành mặc định,
 * lời gọi đó mở đúng tệp `.du-lieu/khoan-da.sqlite` — kho THẬT. Hai hậu quả:
 *
 *   ① bộ test ghi bản ghi lẫn vào tài khoản thật của người dùng
 *   ② các tệp test chạy song song dùng chung một tệp, nên trạng thái rò từ tệp
 *      này sang tệp kia: `PHÁT LẠI NONCE ĐÃ DÙNG` XANH khi chạy riêng và ĐỎ khi
 *      chạy cả bộ. Kiểu lỗi này rất dễ bị "sửa" bằng cách tắt bài test đi.
 *
 * `NODE_TEST_CONTEXT` do chính Node đặt, không phải quy ước tự nhớ.
 */
test('moKho() trong tiến trình test KHÔNG mở kho thật', async () => {
  assert.ok(process.env.NODE_TEST_CONTEXT,
    'Node không đặt NODE_TEST_CONTEXT — hàng rào này mất tác dụng, tìm dấu hiệu khác');

  const kho = await moKho();          // đúng cách `khoan-proof.js` gọi
  assert.strictEqual(kho.loai, 'bo_nho_tam',
    `test đang mở kho ${kho.loai} — sẽ ghi vào dữ liệu thật của người dùng`);
  assert.ok(!kho.duongDan, `test trỏ vào tệp thật: ${kho.duongDan}`);
});

/** Khai `env` rỗng tường minh nghĩa là "kho sạch, tách biệt", không phải kho thật. */
test('moKho({env:{}}) cho kho tạm, không phải tệp thật', async () => {
  const kho = await moKho({ env: {} });
  assert.strictEqual(kho.loai, 'bo_nho_tam');
});

/**
 * ⚠️ HÀNG RÀO TRƯỜNG CẤM PHẢI CÒN SỐNG TRÊN MỌI NHÁNH.
 * Hai nhánh `return` sớm ở trên là hai lối có thể trả về kho KHÔNG bọc hàng
 * rào — lúc đó nội dung thô lọt vào máy chủ mà không ai biết.
 */
test('mọi nhánh của moKho đều bọc hàng rào trường cấm', async () => {
  for (const env of [undefined, {}, { SQLITE_PATH: tepTam() }]) {
    const kho = await moKho(env ? { env } : undefined);
    await assert.rejects(
      () => kho.luu('x', 'y', { noiDung: 'tin nhắn thô của người dùng' }),
      (e) => e.ma === 'TRUONG_BI_CAM_O_TANG_MAY_CHU',
      `hàng rào chết với env=${JSON.stringify(env)}`,
    );
    await kho.dong();
  }
});
