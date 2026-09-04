'use strict';
/**
 * TẦNG 2 — bốn ràng buộc, mỗi ràng buộc một hàng rào.
 *
 *  1. chỉ NÂNG nhãn, không bao giờ hạ
 *  2. hỏng mạng / quá hạn ⇒ giữ nguyên nhãn tầng 0, KHÔNG báo lỗi cho bác
 *  3. mặc định KHÔNG gửi toàn văn tin nhắn
 *  4. kho không chứa danh tính, và mọi mục phải có nguồn
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/detect');
const {
  taoKhoXacMinh, chayTang2, tinhChinhTang2, dungPayloadTang2, bam, LoiKhoXacMinh,
} = require('../backend/src/detect/tang-2');
const { datLai } = require('../backend/src/detect/bo-luat-store');

const tin = (noiDung, nguoiGui = '0912345678') => ({ nguon: 'sms', nguoiGui, noiDung, thoiDiem: Date.now() });

test.beforeEach(() => datLai());

test('§4.2 — tầng 2 NÂNG nhãn khi tên miền đã bị báo cáo', async () => {
  const kho = taoKhoXacMinh();
  kho.themTenMien('vidu-la.vn', { nguon: 'canh-bao-cong-bo-2026-08', ngayCongBo: '2026-08-20' });

  const kq0 = analyze(tin('Bác xem link https://vidu-la.vn/x'));
  assert.strictEqual(kq0.nhan, 'NGHI_NGO');

  const kq2 = await chayTang2(kq0, async (p) => kho.doiChieu(p));
  assert.strictEqual(kq2.nhan, 'CAO');
  assert.strictEqual(kq2.tang2.daNang, true);
  assert.deepStrictEqual(kq2.tang2.nguon, ['canh-bao-cong-bo-2026-08']);
  assert.ok(kq2.tangDaChay.includes('tang_2'));
});

test('§4.2 — tầng 2 KHÔNG BAO GIỜ hạ nhãn, kể cả khi không tìm thấy gì', async () => {
  const kho = taoKhoXacMinh();
  const kq0 = analyze(tin('Thông báo phạt nguội, nộp tại csgt-tracuu.top'));
  assert.strictEqual(kq0.nhan, 'CAO');

  const kq2 = await chayTang2(kq0, async (p) => kho.doiChieu(p));
  assert.strictEqual(kq2.nhan, 'CAO', 'tầng 2 đã hạ nhãn — không được có đường nào làm thế');
  assert.strictEqual(kq2.tang2.coTrung, false);
});

test('§4.3 — "không trùng" KHÔNG được diễn giải thành "đã kiểm, không thấy gì"', async () => {
  const kho = taoKhoXacMinh();
  const kq0 = analyze(tin('Bác xem link https://chua-ai-bao-cao.vn/x'));
  const kq2 = await chayTang2(kq0, async (p) => kho.doiChieu(p));
  assert.strictEqual(kq2.nhan, kq0.nhan);
  assert.strictEqual(kq2.tang2.coTrung, false);
  // Câu giải thích KHÔNG được đổi thành thứ nghe như bảo đảm.
  assert.strictEqual(kq2.giaiThich, kq0.giaiThich);
});

test('quá hạn 3 giây ⇒ giữ nguyên nhãn tầng 0, không ném lỗi', async () => {
  const kq0 = analyze(tin('Bác xem link https://vidu.vn/x'));
  const kq2 = await chayTang2(kq0, () => new Promise(() => {}), { thoiHan: 60 });
  assert.strictEqual(kq2.nhan, kq0.nhan);
  assert.strictEqual(kq2.tang2.ly, 'QUA_HAN');
});

test('mạng hỏng ⇒ giữ nguyên nhãn tầng 0, không ném lỗi', async () => {
  const kq0 = analyze(tin('Bác xem link https://vidu.vn/x'));
  const kq2 = await chayTang2(kq0, async () => { throw new Error('ECONNREFUSED'); });
  assert.strictEqual(kq2.nhan, kq0.nhan);
  assert.strictEqual(kq2.tang2.ly, 'LOI_MANG');
});

test('không cắm đường gửi ⇒ vẫn trả kết quả, không nổ', async () => {
  const kq0 = analyze(tin('Bác xem link https://vidu.vn/x'));
  const kq2 = await chayTang2(kq0, null);
  assert.strictEqual(kq2.nhan, kq0.nhan);
  assert.strictEqual(kq2.tang2.ly, 'KHONG_CO_DUONG_GUI');
});

test('§6.9 — payload MẶC ĐỊNH không mang toàn văn tin nhắn', async () => {
  const kq = analyze(tin('Bác chuyển 50 triệu vào số tài khoản 19036661234 gấp nhé'));
  kq.__toanVan = kq.thucThe;   // giả lập tầng gọi có giữ toàn văn

  const p = await dungPayloadTang2(kq);
  assert.ok(!('toanVan' in p), 'toàn văn đi lên máy chủ khi chưa ai bật công tắc');
  assert.ok(Array.isArray(p.bamSoTaiKhoan));
  assert.ok(p.bamSoTaiKhoan.every((h) => /^[0-9a-f]{64}$/.test(h)),
    'số tài khoản phải đi ở dạng băm, không phải số thô');

  const chu = JSON.stringify(p);
  assert.ok(!chu.includes('19036661234'), 'số tài khoản thô lọt vào payload');
  assert.ok(!chu.includes('0912345678'), 'số điện thoại lọt vào payload');
});

test('§6.9 — toàn văn chỉ đi khi công tắc được bật rõ ràng', async () => {
  const kq = analyze(tin('nội dung thử'));
  kq.__toanVan = 'nội dung thử';
  const p = await dungPayloadTang2(kq, { guiToanVan: true });
  assert.strictEqual(p.toanVan, 'nội dung thử');
});

test('§11 — kho từ chối mục KHÔNG CÓ NGUỒN', () => {
  const kho = taoKhoXacMinh();
  assert.throws(() => kho.themTenMien('x.vn', {}), (e) => e instanceof LoiKhoXacMinh && e.ma === 'THIEU_NGUON');
});

test('§12 — kho từ chối mọi mục mang danh tính', () => {
  const kho = taoKhoXacMinh();
  for (const truong of ['hoTen', 'soDienThoai', 'soTaiKhoan', 'cccd', 'facebook']) {
    assert.throws(
      () => kho.themTenMien('x.vn', { nguon: 'a', [truong]: 'gì đó' }),
      (e) => e instanceof LoiKhoXacMinh && e.ma.startsWith('TRUONG_DANH_TINH'),
      `kho nhận mục mang trường ${truong}`,
    );
  }
});

test('kho chỉ nhận BĂM số tài khoản, không nhận số', async () => {
  const kho = taoKhoXacMinh();
  assert.throws(() => kho.themBamTaiKhoan('19036661234', { nguon: 'a' }),
    (e) => e.ma === 'BAM_SAI_DINH_DANG');

  const h = await bam('19036661234');
  assert.ok(kho.themBamTaiKhoan(h, { nguon: 'canh-bao-nganh-ngan-hang' }));
  const kq = kho.doiChieu({ bamSoTaiKhoan: [h] });
  assert.strictEqual(kq.coTrung, true);
  assert.ok(!JSON.stringify(kq).includes('19036661234'));
});

test('tinhChinhTang2 giữ nguyên mọi trường khác của kết quả', () => {
  const kq0 = analyze(tin('Bác xem link https://vidu.vn/x'));
  const kq2 = tinhChinhTang2(kq0, { coTrung: true, trung: [{ loai: 'ten_mien', nguon: 'n' }] });
  assert.strictEqual(kq2.diem, kq0.diem);
  assert.deepStrictEqual(kq2.thucThe, kq0.thucThe);
  assert.strictEqual(kq2.phienBanLuat, kq0.phienBanLuat);
  assert.ok(kq2.luatKhopVoi.includes('T2'));
});
