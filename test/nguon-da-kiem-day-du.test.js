'use strict';
/**
 * §4.3 Ở CHIỀU NGƯỢC LẠI — Phiếu tin cậy khai THIẾU thứ nó đã kiểm.
 *
 * `buildTrustReceipt` lọc `daKiem` theo bảng `NGUON`. Mã nào không có trong bảng
 * bị vứt IM LẶNG. Đã xảy ra với ba mã: ghi_am, thong_bao_tin_nhan, bo_hoi_nhanh.
 *
 * Chiều sai này an toàn hơn §4.3 (khai ÍT hơn thực tế, không phải nhiều hơn),
 * nhưng nó vẫn khiến Phiếu nói sai về thứ nó đã làm — và nguồn đầu vào mới nào
 * cũng sẽ rơi vào đúng cái hố này nếu không có hàng rào.
 */

const test = require('node:test');
const assert = require('node:assert');

const { buildTrustReceipt, NGUON } = require('../backend/src/analysis/trust-receipt-v2');
const { MA_DA_KIEM } = require('../scripts/xuat-hop-dong');

test('mọi mã daKiem của hợp đồng đều có trong bảng NGUON', () => {
  const thieu = MA_DA_KIEM.filter((ma) => !NGUON[ma]);
  assert.deepStrictEqual(thieu, [],
    `Phiếu tin cậy sẽ vứt im lặng các mã: ${thieu.join(', ')}`);
});

test('bảng NGUON không chứa mã lạ ngoài hợp đồng', () => {
  const la = Object.keys(NGUON).filter((ma) => !MA_DA_KIEM.includes(ma));
  assert.deepStrictEqual(la, [], `NGUON có mã không nằm trong hợp đồng: ${la.join(', ')}`);
});

test('ghi_am đi qua được Phiếu tin cậy, không bị nuốt', () => {
  const phieu = buildTrustReceipt({
    nhan: 'CHUA_THAY',
    maLyDo: [],
    daKiem: ['van_ban', 'ghi_am'],
    chuaKiem: ['chua_nghe_duoc_cuoc_goi'],
    aiDaChay: true,
    overrides: [],
  });
  assert.ok(phieu.daKiem.includes('ghi_am'),
    'đã nghe được đoạn ghi âm mà Phiếu không khai là nói thiếu');
});

test('ba mã hỏng của ghi âm đều có giới hạn hiển thị ở Phiếu', () => {
  const { GIOI_HAN } = require('../backend/src/analysis/trust-receipt-v2');
  for (const ma of ['chua_tai_xong_model_nghe', 'ghi_am_khong_co_tieng_noi',
    'chi_nghe_duoc_phan_dau', 'khong_nghe_duoc_ghi_am']) {
    assert.ok(GIOI_HAN[ma], `mã ${ma} không có giới hạn ⇒ Phiếu sẽ im lặng về nó`);
  }
});

test('ba mã hỏng của ghi âm KHÔNG gộp chung một giới hạn', () => {
  const { GIOI_HAN } = require('../backend/src/analysis/trust-receipt-v2');
  // "chưa tải bộ nghe" và "không giải mã được" là hai việc khác nhau, và một
  // trong hai thì bác tự sửa được. Gộp lại là nói sai (§4.3).
  assert.notStrictEqual(GIOI_HAN.chua_tai_xong_model_nghe,
    GIOI_HAN.khong_nghe_duoc_ghi_am);
  assert.notStrictEqual(GIOI_HAN.ghi_am_khong_co_tieng_noi,
    GIOI_HAN.khong_nghe_duoc_ghi_am);
});

/**
 * ⚠️ MỘT MÃ CỐ Ý KHÔNG CÓ GIỚI HẠN, và đây là chỗ dễ "sửa nhầm cho xanh".
 *
 * §16.3: `chua_thay_yeu_cau_da_xac_thuc` nghĩa là CHƯA AI HỎI AI CẢ — trạng thái
 * BÌNH THƯỜNG, vì hầu như không ai dùng Khoan Proof. Cho nó một dòng "chưa kiểm
 * được" hiện trên Phiếu là biến một trạng thái bình thường thành lời buộc tội,
 * đúng thứ §16.3 dặn đừng làm.
 *
 * Nó KHÁC `chua_lien_lac_duoc_nguoi_than` — mã đó là ĐÃ hỏi mà không ai đáp, im
 * lặng CÓ nghĩa, và nó kéo theo sàn NGHI_NGO. Mã đó phải có giới hạn.
 *
 * Danh sách này chỉ được NHỎ ĐI. Thêm mã vào đây là đang xin phép im lặng.
 */
const CO_Y_KHONG_CO_GIOI_HAN = ['chua_thay_yeu_cau_da_xac_thuc'];

test('mọi mã chuaKiem của hợp đồng đều có giới hạn ở Phiếu', () => {
  const { GIOI_HAN } = require('../backend/src/analysis/trust-receipt-v2');
  const { MA_CHUA_KIEM } = require('../scripts/xuat-hop-dong');
  const thieu = MA_CHUA_KIEM
    .filter((ma) => !CO_Y_KHONG_CO_GIOI_HAN.includes(ma))
    .filter((ma) => !GIOI_HAN[ma]);
  assert.deepStrictEqual(thieu, [],
    `Phiếu sẽ im lặng về các lý do chưa kiểm được: ${thieu.join(', ')}`);
});

test('mã cố ý không có giới hạn thì phải THẬT SỰ không có', () => {
  const { GIOI_HAN } = require('../backend/src/analysis/trust-receipt-v2');
  for (const ma of CO_Y_KHONG_CO_GIOI_HAN) {
    assert.ok(!GIOI_HAN[ma],
      `${ma} có giới hạn rồi ⇒ gỡ nó khỏi danh sách miễn trừ, đừng để hai nguồn sự thật`);
  }
});
