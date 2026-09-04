'use strict';
/**
 * BỘ LUẬT CẬP NHẬT TỪ XA — hàng rào cho ba ràng buộc của `bo-luat-store.js`.
 *
 * Ràng buộc nguy hiểm nhất là số 3: hợp nhất CHỈ ĐƯỢC THÊM. Nếu một bản luật
 * tải về được phép XOÁ cụm khỏi `maoDanh`, thì một tệp cấu hình gõ nhầm — hoặc
 * một máy chủ bị chiếm — tắt được cả bộ phát hiện, im lặng, trên mọi máy.
 *
 * Đây đúng bài học §12 đã ghi cho "please hold" và "ch play": bất kỳ đường nào
 * hạ mức vô điều kiện đều là một câu thần chú tặng cho kẻ lừa đảo.
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  boLuat, capNhatTuXa, datLai, nhatKyHopNhat, soSanhPhienBan, MAC_DINH,
} = require('../backend/src/detect/bo-luat-store');
const { analyze } = require('../backend/src/detect');

test.beforeEach(() => datLai());

test('bản đóng gói sẵn luôn có mặt — chạy được ngay lần đầu, không cần mạng', () => {
  const l = boLuat();
  assert.ok(l.maoDanh.length > 10);
  assert.ok(l.allowlistTenMien.includes('csgt.vn'));
  assert.ok(l.phienBan.match(/^\d{4}\.\d{2}\.\d{2}\+\d+$/));
});

test('bản mới hơn được nhận và có tác dụng ngay', () => {
  const truoc = analyze({ nguon: 'sms', nguoiGui: '0912345678', noiDung: 'Thông báo chieu tro moi tại lua-dao-moi.vn' });
  assert.ok(!truoc.luatKhopVoi.includes('R1'));

  const kq = capNhatTuXa({
    phienBan: '2099.01.01+1',
    nguon: 'may-chu-thu',
    maoDanh: { cum: ['chieu tro moi'] },
  });
  assert.strictEqual(kq.nhan, true);

  const sau = analyze({ nguon: 'sms', nguoiGui: '0912345678', noiDung: 'Thông báo chieu tro moi tại lua-dao-moi.vn' });
  assert.ok(sau.luatKhopVoi.includes('R1'), 'cụm mới tải về không có tác dụng');
});

test('bản CŨ HƠN bị từ chối', () => {
  const kq = capNhatTuXa({ phienBan: '2000.01.01+1', maoDanh: { cum: ['x'] } });
  assert.strictEqual(kq.nhan, false);
  assert.strictEqual(kq.ly, 'KHONG_MOI_HON');
});

test('phiên bản sai định dạng bị từ chối', () => {
  assert.strictEqual(capNhatTuXa({ phienBan: 'moi-nhat' }).ly, 'PHIEN_BAN_SAI_DINH_DANG');
  assert.strictEqual(capNhatTuXa({ phienBan: '2099-01-01' }).ly, 'PHIEN_BAN_SAI_DINH_DANG');
  assert.strictEqual(capNhatTuXa(null).ly, 'GOI_KHONG_HOP_LE');
});

test('so sánh phiên bản dùng SỐ cho phần sau dấu cộng', () => {
  // "+10" > "+9" theo số, nhưng "<" theo từ điển. So chuỗi thuần là sai.
  assert.ok(soSanhPhienBan('2026.09.04+10', '2026.09.04+9') > 0);
  assert.ok(soSanhPhienBan('2026.09.05+1', '2026.09.04+99') > 0);
  assert.strictEqual(soSanhPhienBan('2026.09.04+1', '2026.09.04+1'), 0);
});

test('§4.2 — BẢN TỪ XA KHÔNG XOÁ ĐƯỢC CỤM NÀO. Hợp nhất là PHÉP HỢP.', () => {
  const truoc = boLuat();
  const soCumTruoc = truoc.maoDanh.length;

  // Bản "độc hại": khai maoDanh chỉ còn một cụm vô hại.
  capNhatTuXa({ phienBan: '2099.01.01+1', nguon: 'may-chu-bi-chiem', maoDanh: { cum: ['abc'] } });

  const sau = boLuat();
  assert.ok(sau.maoDanh.length >= soCumTruoc + 1, 'cụm cũ đã bị xoá — hợp nhất không còn là phép hợp');
  for (const cum of truoc.maoDanh) {
    assert.ok(sau.maoDanh.includes(cum), `cụm "${cum}" đã biến mất sau khi cập nhật`);
  }

  // Và bộ phát hiện vẫn bắt được tin cũ.
  const kq = analyze({ nguon: 'sms', nguoiGui: '0912345678', noiDung: 'Thông báo phạt nguội tại csgt-x.top' });
  assert.strictEqual(kq.nhan, 'CAO');
});

test('§4.2 — bản từ xa không xoá được đuôi miền rủi ro hay danh sách rút gọn', () => {
  const truoc = boLuat();
  capNhatTuXa({
    phienBan: '2099.01.01+1',
    duoiMienRuiRo: { duoi: ['abcxyz'] },
    rutGon: { tenMien: ['khong-ton-tai.vn'] },
  });
  const sau = boLuat();
  for (const d of truoc.duoiMienRuiRo) assert.ok(sau.duoiMienRuiRo.includes(d), `mất đuôi ${d}`);
  for (const r of truoc.rutGon) assert.ok(sau.rutGon.includes(r), `mất rút gọn ${r}`);
});

test('allowlist ĐƯỢC PHÉP nới rộng — và việc đó được ghi lại để kiểm toán', () => {
  /*
   * Đây là ngoại lệ DUY NHẤT theo hướng hạ cảnh giác, và nó có lý do: khi ngân
   * hàng đổi tên miền, đó là cách duy nhất sửa một báo động giả mà không phải
   * cập nhật app. Bù lại, mọi lần nới đều để dấu vết.
   */
  capNhatTuXa({
    phienBan: '2099.01.01+1',
    nguon: 'may-chu-that',
    allowlist: { tenMien: ['ngan-hang-moi.com.vn'] },
  });
  assert.ok(boLuat().allowlistTenMien.includes('ngan-hang-moi.com.vn'));

  const nk = nhatKyHopNhat();
  assert.strictEqual(nk.length, 1);
  assert.strictEqual(nk[0].nguon, 'may-chu-that');
  assert.deepStrictEqual(nk[0].themVao.allowlistTenMien, ['ngan-hang-moi.com.vn']);
});

test('datLai() đưa về đúng bản đóng gói sẵn', () => {
  capNhatTuXa({ phienBan: '2099.01.01+1', maoDanh: { cum: ['xyz'] } });
  assert.ok(boLuat().maoDanh.includes('xyz'));
  datLai();
  assert.ok(!boLuat().maoDanh.includes('xyz'));
  assert.strictEqual(boLuat().phienBan, MAC_DINH.phienBan);
});

test('gói luật đóng sẵn KHÔNG chứa cụm nào hạ mức vô điều kiện', () => {
  /*
   * §12 — "Thêm cụm từ nào hạ mức vô điều kiện" là điều cấm. Bộ luật này chỉ có
   * các danh sách LÀM TĂNG cảnh giác cộng hai danh sách allowlist. Nếu ai đó
   * thêm một khoá kiểu `suppressors` / `tatVoDieuKien` vào JSON, test này đỏ.
   */
  const KHOA_CAM = ['suppressors', 'tatVoDieuKien', 'boQua', 'whitelist', 'hạMức', 'haMuc'];
  const chu = JSON.stringify(MAC_DINH);
  for (const k of KHOA_CAM) {
    assert.ok(!chu.includes(`"${k}"`), `bộ luật có khoá hạ mức vô điều kiện: ${k}`);
  }
});
