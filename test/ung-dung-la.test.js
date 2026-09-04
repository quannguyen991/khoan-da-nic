'use strict';
/**
 * ỨNG DỤNG LẠ VỪA ĐƯỢC CÀI — tín hiệu mạnh nhất trong tất cả.
 *
 * Hai hàng rào quan trọng nhất ở đây:
 *  · `com.android.packageinstaller` KHÔNG được coi là cửa hàng chính thức
 *  · module KHÔNG có đường nào để gỡ app hay khoá máy (§12)
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  phanTichCaiDat, nguonCaiDat, laKhoChinhThuc, taoDanhSachTrang, chiTietChoNguoiThan,
  TRINH_CAI_HE_THONG, CUA_SO_THIET_LAP_MS,
} = require('../backend/src/detect/ung-dung-la');
const { phatCanhBao, taoKhoCanhBao } = require('../backend/src/canh-bao-hai-phia');
const { taoVongTron, themThanhVien, datQuyTac } = require('../backend/src/trusted-circle');

const suKien = (them = {}) => ({
  goi: 'com.la.hoang', tenHienThi: 'Dịch Vụ Công', installer: null,
  thoiDiem: 1_757_000_000_000, laCapNhat: false, ...them,
});

test('cài từ nguồn KHÔNG phải cửa hàng chính thức ⇒ CAO ngay lập tức', () => {
  const kq = phanTichCaiDat(suKien());
  assert.strictEqual(kq.nhan, 'CAO');
  assert.strictEqual(kq.canThiep, 'PROTECTED_CRITICAL');
  assert.ok(kq.overrides.includes('CO-02'));
  assert.strictEqual(kq.ungDung.nguonCaiDat, 'khong_ro_nguon');
});

test('cài từ Google Play ⇒ không báo', () => {
  const kq = phanTichCaiDat(suKien({ installer: 'com.android.vending' }));
  assert.strictEqual(kq.nhan, 'CHUA_THAY');
  assert.strictEqual(kq.ungDung.nguonCaiDat, 'cua_hang_chinh_thuc');
});

test('trình cài đặt của HỆ ĐIỀU HÀNH KHÔNG phải cửa hàng chính thức', () => {
  /*
   * Bẫy dễ mắc nhất của cả tệp: `com.android.packageinstaller` trông như một
   * gói hệ thống đáng tin, nhưng nó chính là thứ chạy khi bác mở một tệp .apk
   * tải tay. Coi nó là "chính thức" là để lọt đúng ca nguy hiểm nhất.
   */
  for (const goi of TRINH_CAI_HE_THONG) {
    assert.strictEqual(laKhoChinhThuc(goi), false, `${goi} bị coi là cửa hàng chính thức`);
    assert.strictEqual(nguonCaiDat(goi), 'trinh_cai_he_thong');
    assert.strictEqual(phanTichCaiDat(suKien({ installer: goi })).nhan, 'CAO');
  }
});

test('một app khác đứng ra cài app này ⇒ vẫn CAO', () => {
  const kq = phanTichCaiDat(suKien({ installer: 'com.mot.app.la' }));
  assert.strictEqual(kq.ungDung.nguonCaiDat, 'ung_dung_khac');
  assert.strictEqual(kq.nhan, 'CAO');
});

test('bản CẬP NHẬT của app cũ KHÔNG bị báo', () => {
  // Android bắn sự kiện cho cả cài mới lẫn cập nhật. Báo động mỗi lần một app
  // tự cập nhật là báo động mỗi ngày, và rồi bác tắt hết thông báo.
  const kq = phanTichCaiDat(suKien({ laCapNhat: true }));
  assert.strictEqual(kq.nhan, 'CHUA_THAY');
});

test('§4.3 — không đọc được tên gói thì KHÔNG kết luận là sạch', () => {
  const kq = phanTichCaiDat(suKien({ goi: '' }));
  assert.notStrictEqual(kq.nhan, 'CHUA_THAY');
  assert.ok(kq.chuaKiem.includes('khong_doc_duoc_ten_ung_dung'));
});

// ── DANH SÁCH TRẮNG ───────────────────────────────────────────────────
test('danh sách trắng cho app người thân cài lúc thiết lập', () => {
  const ds = taoDanhSachTrang();
  const luc = 1_757_000_000_000;
  const ra = ds.them('com.benh.vien', { themBoi: 'chi-huong', themLuc: luc, moThietLapLuc: luc });
  assert.strictEqual(ra.nhan, true);

  const kq = phanTichCaiDat(suKien({ goi: 'com.benh.vien' }), { danhSachTrang: ds });
  assert.strictEqual(kq.nhan, 'CHUA_THAY');
  assert.strictEqual(kq.ungDung.trongDanhSachTrang, true);
});

test('danh sách trắng KHÔNG nhận mục ngoài cửa sổ thiết lập', () => {
  /*
   * Nếu thêm được bất cứ lúc nào thì bước đầu tiên của kẻ lừa đảo là bảo bác
   * thêm app của chúng vào danh sách trắng.
   */
  const ds = taoDanhSachTrang();
  const luc = 1_757_000_000_000;
  const ra = ds.them('com.ke.gian', {
    themBoi: 'chi-huong', themLuc: luc + CUA_SO_THIET_LAP_MS + 1, moThietLapLuc: luc,
  });
  assert.strictEqual(ra.nhan, false);
  assert.strictEqual(ra.ly, 'ngoai_cua_so_thiet_lap');
  assert.strictEqual(ds.co('com.ke.gian'), false);
});

test('danh sách trắng đòi biết AI thêm', () => {
  const ds = taoDanhSachTrang();
  assert.strictEqual(ds.them('x', { themLuc: 1, moThietLapLuc: 1 }).ly, 'thieu_nguoi_them');
});

// ── HAI PHÍA ──────────────────────────────────────────────────────────
test('kết quả cắm thẳng được vào luồng cảnh báo hai phía', async () => {
  let vt = taoVongTron('bac-nam');
  vt = themThanhVien(vt, { id: 'chi-huong', vaiTro: 'nguoi_than_tin_cay', boiAi: 'bac-nam' });
  vt = datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: 'chi-huong' }, 'bac-nam');

  const kq = phanTichCaiDat(suKien());
  const kho = taoKhoCanhBao();
  let payload = null;
  const ra = await phatCanhBao({
    kq, vongTron: vt, kho,
    guiPush: async (p) => { payload = p; return { endpointOk: true }; },
    tenNguoiThan: 'chị Hương',
  });

  assert.strictEqual(ra.phat, true);
  assert.strictEqual(ra.nguoiCaoTuoi.kieu, 'toan_man_hinh');
  assert.strictEqual(ra.nguoiCaoTuoi.maLoiRa, 'toi_on_khong_co_gi_nguy_hiem');
  assert.strictEqual(payload.doChuong, true, 'app lạ phải đổ chuông cho người thân');
});

test('phía người thân nhận đủ tên gói, tên hiển thị, nguồn cài, thời điểm', () => {
  const ct = chiTietChoNguoiThan(phanTichCaiDat(suKien()));
  assert.strictEqual(ct.goi, 'com.la.hoang');
  assert.strictEqual(ct.tenHienThi, 'Dịch Vụ Công');
  assert.strictEqual(ct.nguonCaiDat, 'khong_ro_nguon');
  assert.strictEqual(ct.thoiDiem, 1_757_000_000_000);
  assert.deepStrictEqual(ct.hanhDong, ['goi_ngay']);
});

test('§12 — KHÔNG có đường nào gỡ app hay khoá máy', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const nguon = fs.readFileSync(
    path.join(__dirname, '..', 'backend', 'src', 'detect', 'ung-dung-la.js'), 'utf8',
  );
  for (const cam of ['uninstall', 'goUngDung', 'khoaMay', 'lockDevice', 'deletePackage']) {
    // Bình luận được phép nhắc tên để giải thích vì sao chúng không tồn tại;
    // chỉ chuỗi và tên hàm mới bị cấm.
    const laTenHam = new RegExp(`(function\\s+${cam}|${cam}\\s*[:(=])`);
    assert.ok(!laTenHam.test(nguon), `module có đường tự làm thay người dùng: ${cam}`);
  }
  const ct = chiTietChoNguoiThan(phanTichCaiDat(suKien()));
  assert.ok(!ct.hanhDong.includes('go_ung_dung'));
});

test('§11 — câu cảnh báo không trách móc bác', () => {
  const kq = phanTichCaiDat(suKien());
  for (const re of [/sao bác/i, /bác đã sai/i, /bác không nên/i, /lỗi của bác/i]) {
    assert.ok(!re.test(kq.giaiThich), `câu cảnh báo trách móc: ${kq.giaiThich}`);
  }
  assert.ok(kq.giaiThich.includes('gọi cho người nhà'), kq.giaiThich);
});
