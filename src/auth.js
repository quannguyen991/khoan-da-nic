'use strict';
/**
 * §5.3 — auth / pairing.
 *
 * ⚠️ RÀNG BUỘC LỚN NHẤT: "KHÔNG gate chức năng kiểm tra cơ bản" (§5.3),
 * và §6.9: "KHÔNG bắt đăng nhập để dùng chức năng kiểm tra cơ bản."
 *
 * Người đang bị kẻ lừa đảo thúc trên điện thoại mà gặp màn đăng nhập thì họ
 * đóng app. Đăng nhập CHỈ dành cho tính năng cần quan hệ nhiều thiết bị: vòng
 * tròn gia đình, cảnh báo người thân, đồng bộ quy tắc.
 *
 * §9.8 — mã ghép đôi do CHỦ TÀI KHOẢN sinh, có hạn, dùng một lần.
 */

const crypto = require('node:crypto');

/** Route KHÔNG BAO GIỜ được đòi đăng nhập. Danh sách này chỉ được DÀI RA. */
const KHONG_CAN_DANG_NHAP = Object.freeze([
  '/api/analyze',
  '/api/phan-tich',
  '/api/suc-khoe',
  '/api/safety-card',
  '/transparency',
]);

const HAN_MA_GHEP_MS = 10 * 60 * 1000;   // 10 phút
const DO_DAI_MA = 6;

const canDangNhap = (duong) => !KHONG_CAN_DANG_NHAP.includes(duong);

/**
 * Mã ghép đôi: 6 chữ số, sinh bằng nguồn ngẫu nhiên MẬT MÃ.
 * Math.random() không dùng được ở đây — mã đoán được là ai cũng ghép vào được
 * vòng tròn gia đình của người khác.
 */
function taoMaGhep({ chuTaiKhoanId, bayGio }) {
  const so = crypto.randomInt(0, 10 ** DO_DAI_MA);
  const ma = String(so).padStart(DO_DAI_MA, '0');
  return {
    ma,
    chuTaiKhoanId,
    hetHanLuc: bayGio + HAN_MA_GHEP_MS,
    daDung: false,
  };
}

/**
 * @returns {{hopLe:boolean, lyDo:string|null}}
 * So sánh mã bằng hàm CHỐNG ĐO THỜI GIAN — so bằng `===` là rò rỉ từng ký tự.
 */
function kiemMaGhep(banGhi, maNhap, bayGio) {
  if (!banGhi) return { hopLe: false, lyDo: 'ma_khong_ton_tai' };
  if (banGhi.daDung) return { hopLe: false, lyDo: 'ma_da_dung_roi' };
  if (bayGio > banGhi.hetHanLuc) return { hopLe: false, lyDo: 'ma_het_han' };

  const a = Buffer.from(String(banGhi.ma));
  const b = Buffer.from(String(maNhap ?? ''));
  if (a.length !== b.length) return { hopLe: false, lyDo: 'ma_sai' };
  if (!crypto.timingSafeEqual(a, b)) return { hopLe: false, lyDo: 'ma_sai' };
  return { hopLe: true, lyDo: null };
}

const danhDauDaDung = (banGhi) => ({ ...banGhi, daDung: true });

/** Phiên: token ngẫu nhiên, KHÔNG nhúng thông tin cá nhân vào token. */
function taoPhien({ thanhVienId, bayGio, hanMs = 30 * 24 * 60 * 60 * 1000 }) {
  return {
    token: crypto.randomBytes(32).toString('base64url'),
    thanhVienId,
    hetHanLuc: bayGio + hanMs,
  };
}

const phienConHan = (phien, bayGio) => Boolean(phien) && bayGio <= phien.hetHanLuc;

module.exports = {
  KHONG_CAN_DANG_NHAP, canDangNhap, taoMaGhep, kiemMaGhep, danhDauDaDung,
  taoPhien, phienConHan, HAN_MA_GHEP_MS, DO_DAI_MA,
};
