'use strict';
/**
 * SCRIPT DUYỆT SỐ TỔNG ĐÀI NGÂN HÀNG.
 *
 * Một số sai đưa người đang hoảng tới đúng kẻ lừa đảo. Script này là cửa DUY NHẤT
 * để một số điện thoại vào được danh bạ, nên test canh ba thứ:
 *  1. Số chỉ lên đĩa CÙNG LÚC với tên người duyệt.
 *  2. Nguồn phải là trang của chính ngân hàng đó.
 *  3. Gỡ số là số biến mất ngay, và lần gỡ được ghi lại.
 */

const test = require('node:test');
const assert = require('node:assert');

const D = require('../scripts/duyet-so-ngan-hang');
const R = require('../backend/src/analysis/verified-institution-registry');

const CHO = () => ({
  institutions: [],
  _cho_duyet: [{
    id: 'vn-x', countryCode: 'VN', type: 'bank', canonicalName: 'Ngân hàng X', aliases: ['X'],
    officialDomains: ['x.com.vn'], officialPhoneNumbers: [], sourceUrl: 'https://www.x.com.vn/',
    verifiedAt: '', reviewStatus: 'pending', _can_lam: 'tra số',
  }],
});

test('duyệt: số lên đĩa cùng tên người duyệt, mục rời hàng chờ, qua được kiểm tra của sổ', () => {
  const goc = CHO();
  const moi = D.duyetSo(goc, 'vn-x', '1900 1234; (028) 3824 7247', 'Quân', '2026-09-17');
  assert.strictEqual(moi._cho_duyet.length, 0);
  const [m] = moi.institutions;
  assert.deepStrictEqual(m.officialPhoneNumbers, ['1900 1234', '(028) 3824 7247']);
  assert.strictEqual(m.reviewedBy, 'Quân');
  assert.strictEqual(m.reviewStatus, 'approved');
  assert.ok(!('_can_lam' in m));
  assert.ok(R.mucHopLe(m).hopLe);
  assert.strictEqual(goc._cho_duyet.length, 1, 'không sửa tại chỗ dữ liệu gốc');
});

test('duyệt: không tên người duyệt → từ chối; id lạ → từ chối', () => {
  assert.throws(() => D.duyetSo(CHO(), 'vn-x', '1900 1234', '  ', '2026-09-17'), /THIEU_NGUOI_DUYET/);
  assert.throws(() => D.duyetSo(CHO(), 'vn-khong-co', '1900 1234', 'Quân', '2026-09-17'), /KHONG_TIM_THAY_MUC/);
});

test('⚠️ duyệt: số lẫn chữ, quá ngắn, quá dài, hoặc rỗng → từ chối, không để máy đoán', () => {
  for (const so of ['', 'gọi 1900 1234', '12345', '1900 1234 5678 9999', 'abc']) {
    assert.throws(() => D.duyetSo(CHO(), 'vn-x', so, 'Quân', '2026-09-17'), /THIEU_SO|SO_KHONG_HOP_LE/, so);
  }
});

test('⚠️ duyệt: nguồn không phải trang của chính ngân hàng → từ chối', () => {
  for (const u of ['https://baomoi.com/x', 'https://x.com.vn.trang-la.com/', 'http://www.x.com.vn/']) {
    assert.throws(() => D.duyetSo(CHO(), 'vn-x', '1900 1234', 'Quân', '2026-09-17', u), /MUC_KHONG_HOP_LE/, u);
  }
});

test('gỡ: số biến mất NGAY, mục về hàng chờ không mang số, lần gỡ được ghi lại', () => {
  const daDuyet = D.duyetSo(CHO(), 'vn-x', '1900 1234', 'Quân', '2026-09-17');
  const sau = D.goSo(daDuyet, 'vn-x', 'Quân', 'Ngân hàng đổi số', '2026-10-01');
  assert.strictEqual(sau.institutions.length, 0);
  assert.deepStrictEqual(sau._cho_duyet[0].officialPhoneNumbers, []);
  assert.deepStrictEqual(sau._da_go, [{ id: 'vn-x', soDaGo: ['1900 1234'], boi: 'Quân', lyDo: 'Ngân hàng đổi số', luc: '2026-10-01' }]);
  assert.throws(() => D.goSo(daDuyet, 'vn-x', 'Quân', '', '2026-10-01'), /THIEU_LY_DO/);
});
