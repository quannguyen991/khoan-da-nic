'use strict';
/**
 * CẢNH BÁO HAI PHÍA — hàng rào cho bốn thứ dễ vỡ nhất:
 *
 *  1. hai phía được kích hoạt trong CÙNG một lượt (người thân không chờ bác bấm)
 *  2. màn người cao tuổi có ĐÚNG HAI NÚT, và luôn có lối ra (§4.6)
 *  3. push KHÔNG mang nội dung tin nhắn (§6.9)
 *  4. không nói quá về giao nhận (§9.4, §11)
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze } = require('../backend/src/detect');
const { datLai } = require('../backend/src/detect/bo-luat-store');
const {
  taoKhoCanhBao, phatCanhBao, manNguoiCaoTuoi, pushNguoiThan,
  ghiNhanMo, ghiNhanBamGoi, ghiNhanToiOn, danhDauKetQua, canDuongDuPhong, tongHop,
  HANH_DONG_NGUOI_CAO_TUOI, HANH_DONG_KHI_CHUA_CO_QUY_TAC, HAN_XAC_NHAN_MS,
} = require('../backend/src/canh-bao-hai-phia');
const { taoVongTron, themThanhVien, datQuyTac } = require('../backend/src/trusted-circle');

const CHU = 'bac-nam';
const CON = 'chi-huong';

function vongTronCoQuyTac() {
  let vt = taoVongTron(CHU);
  vt = themThanhVien(vt, { id: CON, vaiTro: 'nguoi_than_tin_cay', boiAi: CHU });
  return datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: CON }, CHU);
}

const tinCao = () => analyze({
  nguon: 'sms', nguoiGui: '0912345678',
  noiDung: 'Thông báo phạt nguội, nộp tại csgt-tracuu.top trước 24h.',
  thoiDiem: 1_757_000_000_000,
});

test.beforeEach(() => datLai());

test('CAO — hai phía cùng được kích hoạt trong MỘT lượt', async () => {
  const kho = taoKhoCanhBao();
  const daGui = [];
  const ra = await phatCanhBao({
    kq: tinCao(),
    vongTron: vongTronCoQuyTac(),
    kho,
    guiPush: async (p, ai) => { daGui.push({ p, ai }); return { endpointOk: true }; },
    tenNguoiCaoTuoi: 'bác Nam',
    tenNguoiThan: 'chị Hương',
    thoiDiem: 1_757_000_000_000,
  });

  assert.strictEqual(ra.phat, true);
  assert.ok(ra.nguoiCaoTuoi, 'thiếu màn người cao tuổi');
  assert.ok(ra.nguoiThan, 'thiếu payload người thân');
  assert.strictEqual(daGui.length, 1, 'push cho người thân không được gửi');
  assert.strictEqual(daGui[0].ai, CON);

  // Cùng một sự kiện, cùng một mã.
  assert.strictEqual(daGui[0].p.canhBaoId, ra.canhBaoId);
  assert.strictEqual(daGui[0].p.thoiDiem, ra.nguoiThan.thoiDiem);
});

test('người thân KHÔNG phải chờ người cao tuổi bấm gì', async () => {
  /*
   * Ràng buộc quan trọng nhất của cả tính năng: người đang bị dồn ép là người
   * ít có khả năng bấm nút nhất. `phatCanhBao` không nhận tham số nào kiểu
   * "bác đã xác nhận" — và đó là chủ đích.
   */
  const kho = taoKhoCanhBao();
  let daGui = false;
  await phatCanhBao({
    kq: tinCao(), vongTron: vongTronCoQuyTac(), kho,
    guiPush: async () => { daGui = true; return { endpointOk: true }; },
  });
  assert.strictEqual(daGui, true);
});

test('nhãn CAO ⇒ đổ chuông; NGHI_NGO ⇒ push im, gom vào báo cáo ngày', () => {
  const cao = pushNguoiThan({ nhan: 'CAO', canThiep: 'PAUSE_60S', maGiaiThich: 'R1' },
    { canhBaoId: 'x', thoiDiem: 1 });
  assert.strictEqual(cao.doChuong, true);
  assert.strictEqual(cao.tuyChonHienThi.requireInteraction, true);
  assert.strictEqual(cao.tuyChonHienThi.silent, false);
  assert.ok(Array.isArray(cao.tuyChonHienThi.vibrate));
  assert.strictEqual(cao.gomVaoBaoCaoNgay, false);

  const nghi = pushNguoiThan({ nhan: 'NGHI_NGO', canThiep: 'VERIFY_PATH', maGiaiThich: 'R10' },
    { canhBaoId: 'y', thoiDiem: 1 });
  assert.strictEqual(nghi.doChuong, false);
  assert.strictEqual(nghi.tuyChonHienThi.requireInteraction, false);
  assert.strictEqual(nghi.gomVaoBaoCaoNgay, true);
});

test('§6.9 — push KHÔNG mang nội dung tin nhắn, số tài khoản hay số điện thoại', async () => {
  const kq = analyze({
    nguon: 'sms', nguoiGui: '0912345678',
    noiDung: 'Bác chuyển gấp 15 triệu vào số tài khoản 19036661234, đừng nói với ai.',
  });
  const kho = taoKhoCanhBao();
  let payload = null;
  await phatCanhBao({
    kq, vongTron: vongTronCoQuyTac(), kho,
    guiPush: async (p) => { payload = p; return { endpointOk: true }; },
    noiDung: 'Bác chuyển gấp 15 triệu vào số tài khoản 19036661234, đừng nói với ai.',
  });

  const chu = JSON.stringify(payload);
  assert.ok(!chu.includes('19036661234'), 'số tài khoản lọt vào push');
  assert.ok(!chu.includes('0912345678'), 'số điện thoại lọt vào push');
  assert.ok(!chu.includes('chuyển gấp'), 'nội dung tin nhắn lọt vào push');
});

test('§6.9 — nội dung chỉ được LƯU khi công tắc chia sẻ bật; mặc định TẮT', async () => {
  const kho = taoKhoCanhBao();
  const noiDung = 'nội dung riêng tư của bác';

  await phatCanhBao({ kq: tinCao(), vongTron: vongTronCoQuyTac(), kho, guiPush: async () => ({ endpointOk: true }), noiDung });
  assert.strictEqual(kho.tatCa()[0].noiDung, null, 'nội dung bị lưu khi chưa ai bật công tắc');

  const ra = await phatCanhBao({
    kq: tinCao(), vongTron: vongTronCoQuyTac(), kho,
    guiPush: async () => ({ endpointOk: true }), noiDung, chiaSeNoiDung: true,
  });
  assert.strictEqual(kho.lay(ra.canhBaoId).noiDung, noiDung);
});

test('màn người cao tuổi có ĐÚNG HAI NÚT', () => {
  const m = manNguoiCaoTuoi(tinCao(), { tenNguoiThan: 'chị Hương', trangThai: 'da_day_canh_bao_di' });
  assert.strictEqual(m.kieu, 'toan_man_hinh');
  assert.deepStrictEqual(m.hanhDong, HANH_DONG_NGUOI_CAO_TUOI);
  assert.strictEqual(m.hanhDong.length, 2);
  // Không có nút nào trong ba nút bị cấm.
  for (const cam of ['bo_qua_vinh_vien', 'tim_hieu_them', 'menu']) {
    assert.ok(!m.hanhDong.includes(cam), `màn khẩn cấp có nút bị cấm: ${cam}`);
  }
});

test('§4.6 — LUÔN có lối ra, kể cả ở PROTECTED_CRITICAL', () => {
  const kq = analyze({
    nguon: 'sms', nguoiGui: '0912345678',
    noiDung: 'Bác tải app tại https://dichvu-vn.top/app.apk nhé',
  });
  assert.strictEqual(kq.canThiep, 'PROTECTED_CRITICAL');
  const m = manNguoiCaoTuoi(kq, { tenNguoiThan: 'chị Hương' });
  assert.strictEqual(m.maLoiRa, 'toi_on_khong_co_gi_nguy_hiem');
});

test('§HĐ luật 3 — chuaKiem đi cùng ra tới màn khẩn cấp', () => {
  const kq = analyze({ nguon: 'thong_bao', nguoiGui: 'X', noiDung: '' });
  const m = manNguoiCaoTuoi(kq, {});
  assert.ok(m.chuaKiem.includes('thong_bao_khong_co_noi_dung'));
});

test('§9.4 — dòng thứ ba nói ĐÚNG thứ hệ thống biết, theo từng trạng thái', async () => {
  const kho = taoKhoCanhBao();

  const ok = await phatCanhBao({
    kq: tinCao(), vongTron: vongTronCoQuyTac(), kho,
    guiPush: async () => ({ endpointOk: true }),
  });
  assert.strictEqual(ok.nguoiCaoTuoi.dong3, 'da_gui_canh_bao_cho_nguoi_than');

  const hong = await phatCanhBao({
    kq: tinCao(), vongTron: vongTronCoQuyTac(), kho,
    guiPush: async () => ({ endpointOk: false, ma: 'CHUA_CAU_HINH_PUSH' }),
  });
  assert.strictEqual(hong.nguoiCaoTuoi.dong3, 'chua_gui_duoc_cho_nguoi_than');
  assert.strictEqual(kho.lay(hong.canhBaoId).nguoiThanDaDay, false);
});

test('§11 — không mã nào nói người thân "đã đọc và hiểu"', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const nguon = fs.readFileSync(
    path.join(__dirname, '..', 'backend', 'src', 'canh-bao-hai-phia.js'), 'utf8',
  );
  for (const cam of ['da_doc_va_hieu', 'daDocVaHieu', 'nguoi_than_da_biet']) {
    assert.ok(!nguon.includes(`'${cam}'`), `mã có trạng thái bị cấm: ${cam}`);
  }
});

test('§12 — chưa có quy tắc gia đình thì KHÔNG tự gửi, nhưng vẫn hiện cho bác', async () => {
  const kho = taoKhoCanhBao();
  let daGui = false;
  const ra = await phatCanhBao({
    kq: tinCao(),
    vongTron: taoVongTron(CHU),      // chưa đặt quy tắc
    kho,
    guiPush: async () => { daGui = true; return { endpointOk: true }; },
  });

  assert.strictEqual(daGui, false, 'tự gửi thay chủ tài khoản — vi phạm §12');
  assert.strictEqual(ra.phat, true, 'phía người cao tuổi bị im lặng bỏ qua');
  assert.strictEqual(ra.lyKhongGuiNguoiThan, 'chua_co_quy_tac');
  assert.deepStrictEqual(ra.nguoiCaoTuoi.hanhDong, HANH_DONG_KHI_CHUA_CO_QUY_TAC);
  assert.strictEqual(ra.nguoiCaoTuoi.dong3, 'chua_co_quy_tac_gia_dinh');
});

test('nhãn CHUA_THAY không phát cảnh báo', async () => {
  const kq = analyze({ nguon: 'sms', nguoiGui: 'Vietcombank', noiDung: 'Ma OTP cua quy khach la 482913.' });
  const ra = await phatCanhBao({ kq, vongTron: vongTronCoQuyTac(), kho: taoKhoCanhBao(), guiPush: async () => ({ endpointOk: true }) });
  assert.strictEqual(ra.phat, false);
  assert.strictEqual(ra.ly, 'nhan_chua_thay');
});

test('bảng canh_bao ghi đủ thứ cần để chứng minh và để hiệu chỉnh', async () => {
  const kho = taoKhoCanhBao();
  const ra = await phatCanhBao({
    kq: tinCao(), vongTron: vongTronCoQuyTac(), kho,
    guiPush: async () => ({ endpointOk: true }),
  });
  const g = kho.lay(ra.canhBaoId);

  for (const truong of ['nhan', 'luatKhopVoi', 'nguoiCaoTuoiDaHien', 'nguoiThanDaDay',
    'nguoiThanDaMo', 'nguoiThanDaBamGoi', 'ketQua', 'phienBanLuat']) {
    assert.ok(truong in g, `bảng canh_bao thiếu trường: ${truong}`);
  }
  assert.strictEqual(g.ketQua, 'chua_ro');

  ghiNhanMo(kho, ra.canhBaoId, 1000);
  ghiNhanBamGoi(kho, ra.canhBaoId, 1200);
  danhDauKetQua(kho, ra.canhBaoId, 'bao_nham', CON);
  const sau = kho.lay(ra.canhBaoId);
  assert.strictEqual(sau.nguoiThanDaMo, true);
  assert.strictEqual(sau.nguoiThanDaBamGoi, true);
  assert.strictEqual(sau.ketQua, 'bao_nham');
  assert.strictEqual(sau.trangThaiGiaoNhan, 'nguoi_than_da_mo_canh_bao');
});

test('§4.6 — bấm "Tôi ổn" được ghi lại mà KHÔNG hạ nhãn của bản ghi', async () => {
  const kho = taoKhoCanhBao();
  const ra = await phatCanhBao({ kq: tinCao(), vongTron: vongTronCoQuyTac(), kho, guiPush: async () => ({ endpointOk: true }) });
  const truoc = kho.lay(ra.canhBaoId).nhan;
  ghiNhanToiOn(kho, ra.canhBaoId, 5000);
  const sau = kho.lay(ra.canhBaoId);
  assert.strictEqual(sau.nguoiCaoTuoiBamToiOn, true);
  assert.strictEqual(sau.nhan, truoc, 'nút "Tôi ổn" đã hạ nhãn — mất chính dữ liệu cần đo');
});

test('danhDauKetQua từ chối giá trị lạ', () => {
  const kho = taoKhoCanhBao();
  kho.them({ id: 'x', ketQua: 'chua_ro' });
  assert.throws(() => danhDauKetQua(kho, 'x', 'an_toan'));
});

test('đường dự phòng 60 giây — chỉ ĐỀ NGHỊ, và cấm tự gọi thay người dùng', () => {
  const goc = { id: 'x', nhan: 'CAO', thoiDiem: 0, nguoiThanDaDay: true, nguoiThanDaMo: false };

  assert.strictEqual(canDuongDuPhong(goc, HAN_XAC_NHAN_MS - 1).can, false);
  const kq = canDuongDuPhong(goc, HAN_XAC_NHAN_MS + 1);
  assert.strictEqual(kq.can, true);
  assert.ok(kq.deNghi.includes('sms_du_phong'));
  assert.ok(kq.daCam.includes('tu_dong_goi_thay_nguoi_dung'), '§12 — không được tự gọi thay người dùng');

  assert.strictEqual(canDuongDuPhong({ ...goc, nguoiThanDaMo: true }, HAN_XAC_NHAN_MS + 1).can, false);
  assert.strictEqual(canDuongDuPhong({ ...goc, nhan: 'NGHI_NGO' }, HAN_XAC_NHAN_MS + 1).can, false);
});

test('tongHop đếm thuần, không suy diễn', () => {
  const d = tongHop([
    { nhan: 'CAO', nguoiThanDaDay: true, nguoiThanDaMo: true, nguoiThanDaBamGoi: true, ketQua: 'that' },
    { nhan: 'NGHI_NGO', nguoiThanDaDay: false, ketQua: 'chua_ro' },
    { nhan: 'CAO', nguoiThanDaDay: true, ketQua: 'bao_nham', nguoiCaoTuoiBamToiOn: true },
  ]);
  assert.deepStrictEqual(d, {
    tong: 3, cao: 2, nghiNgo: 1, daDay: 2, daMo: 1, daBamGoi: 1,
    baoNham: 1, that: 1, chuaRo: 1, toiOn: 1,
  });
});

test('§12 — module KHÔNG tự gửi vị trí, không tự khoá máy, không tự gọi', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const nguon = fs.readFileSync(
    path.join(__dirname, '..', 'backend', 'src', 'canh-bao-hai-phia.js'), 'utf8',
  );
  for (const cam of ['geolocation', 'getCurrentPosition', 'lockDevice', 'tel:', 'placeCall']) {
    assert.ok(!nguon.includes(cam), `module tự làm thay người dùng: ${cam}`);
  }
});
