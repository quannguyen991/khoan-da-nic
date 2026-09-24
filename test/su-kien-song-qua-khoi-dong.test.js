'use strict';
/**
 * SỰ KIỆN GUARDIAN SỐNG QUA LẦN KHỞI ĐỘNG LẠI — sửa 24/9/2026.
 *
 * Bản trước giữ báo động / câu hỏi "hỏi con" / hẹn giờ leo thang trong RAM: mỗi
 * lần deploy hay Render đánh thức máy chủ là mất hết. Test dựng HAI lõi báo động
 * trên CÙNG một kho — lõi thứ hai là "máy chủ sau khi khởi động lại".
 */
const test = require('node:test');
const assert = require('node:assert');

const BDG = require('../backend/src/bao-dong-gia-dinh');
const QT = require('../backend/src/quy-tac-bao');

function khoGia() {
  const bang = new Map();
  const b = (ten) => { if (!bang.has(ten)) bang.set(ten, new Map()); return bang.get(ten); };
  return {
    async doc(ten, khoa) { const v = b(ten).get(khoa); return v === undefined ? null : JSON.parse(JSON.stringify(v)); },
    async luu(ten, khoa, v) { b(ten).set(khoa, JSON.parse(JSON.stringify(v))); return v; },
    async xoa(ten, khoa) { return b(ten).delete(khoa); },
    async liet(ten) { return [...b(ten).values()].map((v) => JSON.parse(JSON.stringify(v))); },
  };
}

const ENV = { VAPID_PUBLIC_KEY: 'BTEST_cong_khai', VAPID_PRIVATE_KEY: 'test_rieng_tu', VAPID_SUBJECT: 'https://khoan-da.test' };

async function dung({ kho, gio, luotGui, hen }) {
  return BDG.taoBaoDong({
    kho,
    khoSuKien: BDG.taoKhoSuKien({ kho }),
    capGhep: async () => ({ thanhVien: [{ id: 'con' }] }),
    layHoSo: async (_k, id) => ({ ten: id === 'me' ? 'Bác Lan' : 'Minh' }),
    env: ENV,
    guiThat: async ({ payload }) => { luotGui.push(payload); return { ok: true, status: 201 }; },
    henGio: (fn, ms) => { hen.push({ fn, ms }); return 0; },
    bayGio: () => gio.v,
  });
}

async function chuanBi() {
  const kho = khoGia();
  await QT.datQuyTac(kho, 'me', { baoKhiCao: true, baoKhiOtpTrongCuocGoi: false, choConXemBaoVe: false });
  await BDG.dangKyNhan(kho, 'con', { endpoint: 'https://push.test/may-con', keys: { p256dh: 'p', auth: 'a' } }, 'vi');
  return { kho, gio: { v: 1_000_000 }, luotGui: [], hen: [] };
}

test('báo động còn đọc được SAU khởi động lại; con xác nhận "đã gọi" cũng được ghi', async () => {
  const c = await chuanBi();
  const truoc = await dung(c);
  const bd = await truoc.baoDong('me', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  assert.ok(bd.gui && bd.suKienId);

  const sau = await dung(c);                                   // "khởi động lại"
  const ev = await sau.docSuKien('con', bd.suKienId);
  assert.strictEqual(ev.nhan, 'CAO', 'sự kiện mất sau khởi động lại');
  await sau.conDaGoi('con', bd.suKienId);
  const lai = await dung(c);
  assert.strictEqual((await lai.docSuKien('me', bd.suKienId)).conDaGoi, true, '"con đã gọi" không được ghi xuống kho');
});

test('gộp 30 giây vẫn đúng qua khởi động lại — con không bị báo đôi', async () => {
  const c = await chuanBi();
  const bd = await (await dung(c)).baoDong('me', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  c.gio.v += 10_000;
  const lan2 = await (await dung(c)).baoDong('me', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  assert.strictEqual(lan2.lyDo, 'DA_GOP');
  assert.strictEqual(lan2.suKienId, bd.suKienId);
});

test('câu hỏi "có phải con đang gọi?" và câu trả lời sống qua khởi động lại', async () => {
  const c = await chuanBi();
  const { hoiId } = await (await dung(c)).hoiCon('me');
  const sau = await dung(c);
  assert.deepStrictEqual((await sau.hoiDangCho('con')).hoi.map((h) => h.hoiId), [hoiId]);
  await sau.traLoiHoi('con', hoiId, 'KHONG');
  const kq = await (await dung(c)).docHoi('me', hoiId);
  assert.deepStrictEqual(kq.traLoi.map((x) => x.traLoi), ['KHONG'], 'câu trả lời của con mất');
});

test('khởi động lại: hẹn lại leo thang đúng phần thời gian còn lại, leo thang gửi đúng một lần', async () => {
  const c = await chuanBi();
  const bd = await (await dung(c)).baoDong('me', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  const hen0 = c.hen.length;
  c.gio.v += 20_000;                                           // khởi động lại ở giây 20
  const sau = await dung(c);
  assert.strictEqual(await sau.khoiPhucHenGio(), 1);
  const moi = c.hen.slice(hen0);
  assert.strictEqual(moi.length, 1);
  assert.strictEqual(moi[0].ms, 40_000, 'phải hẹn phần CÒN LẠI của 60 giây');

  const guiTruoc = c.luotGui.length;
  await moi[0].fn();                                           // hẹn giờ khôi phục nổ
  await c.hen[0].fn();                                         // hẹn giờ gốc (nếu còn sống) cũng nổ
  assert.strictEqual(c.luotGui.length - guiTruoc, 1, 'con bị báo leo thang hai lần');
  assert.strictEqual((await sau.docSuKien('me', bd.suKienId)).id, bd.suKienId);
});

test('khởi động lại: đã quá 60 giây ⇒ leo thang ngay; quá 10 phút ⇒ bỏ qua; đã có người phản ứng ⇒ bỏ qua', async () => {
  const c = await chuanBi();
  await (await dung(c)).baoDong('me', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  c.gio.v += 3 * 60_000;
  let hen0 = c.hen.length;
  assert.strictEqual(await (await dung(c)).khoiPhucHenGio(), 1);
  assert.strictEqual(c.hen[hen0].ms, 0, 'quá 60 giây thì leo thang ngay');

  c.gio.v += 20 * 60_000;                                      // báo động giờ đã 23 phút tuổi
  hen0 = c.hen.length;
  assert.strictEqual(await (await dung(c)).khoiPhucHenGio(), 0, 'báo động quá cũ không được nhắc lại');

  const c2 = await chuanBi();
  const bd2 = await (await dung(c2)).baoDong('me', { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  await (await dung(c2)).conDaGoi('con', bd2.suKienId);
  c2.gio.v += 20_000;
  assert.strictEqual(await (await dung(c2)).khoiPhucHenGio(), 0, 'con đã gọi rồi mà vẫn hẹn leo thang');
});

test('không truyền kho ⇒ vẫn chạy trong bộ nhớ (test đơn vị cũ)', async () => {
  const k = BDG.taoKhoSuKien();
  await k.tao({ id: 'a', boMeId: 'me', loaiSuKien: 'ket_qua_kiem', luc: 1 });
  assert.strictEqual((await k.lay('a')).id, 'a');
  assert.strictEqual((await k.liet()).length, 1);
});
