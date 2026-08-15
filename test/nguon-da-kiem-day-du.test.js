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

const { buildTrustReceipt, NGUON } = require('../src/analysis/trust-receipt-v2');
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
