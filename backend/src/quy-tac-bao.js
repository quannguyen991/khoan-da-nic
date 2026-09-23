'use strict';
/**
 * QUY TẮC "BÁO CHO CON" — do CHÍNH bố mẹ bật trên máy mình (Phần 2 "Cầu dao gia
 * đình", 23/9/2026).
 *
 * ⚠️ §12 — "Tự bật auto-alert thay chủ tài khoản" bị cấm. Nên:
 *   · mặc định TẮT cả hai;
 *   · chỉ phiên của chủ tài khoản đọc/đặt được (route lấy id từ phiên, không từ thân);
 *   · chỉ nhận đúng true/false — không có giá trị thứ ba kiểu "mặc định bật".
 *
 * Phần 3 đọc quy tắc này trước khi gửi bất kỳ thông báo nào cho con.
 */
const BANG = 'quy_tac_bao';
/*
 * Công tắc thứ ba (23/9/2026): cho con xem máy này còn được bảo vệ không — xem
 * `nhip-bao-ve.js`. Cũng mặc định TẮT, cũng chỉ chủ tài khoản bật được.
 */
const MAC_DINH = Object.freeze({ baoKhiCao: false, baoKhiOtpTrongCuocGoi: false, choConXemBaoVe: false });

class LoiQuyTac extends Error {
  constructor(ma) { super(ma); this.name = 'LoiQuyTac'; this.ma = ma; }
}

function chuanHoa(vao) {
  if (!vao || typeof vao !== 'object') throw new LoiQuyTac('QUY_TAC_KHONG_HOP_LE');
  const ra = {};
  for (const k of Object.keys(MAC_DINH)) {
    if (vao[k] === undefined) continue;
    if (typeof vao[k] !== 'boolean') throw new LoiQuyTac('QUY_TAC_KHONG_HOP_LE');
    ra[k] = vao[k];
  }
  return ra;
}

async function docQuyTac(kho, taiKhoanId) {
  const ban = await kho.doc(BANG, taiKhoanId);
  return {
    baoKhiCao: ban?.baoKhiCao === true,
    baoKhiOtpTrongCuocGoi: ban?.baoKhiOtpTrongCuocGoi === true,
    choConXemBaoVe: ban?.choConXemBaoVe === true,
  };
}

async function datQuyTac(kho, taiKhoanId, vao, bayGio = Date.now()) {
  const moi = { ...(await docQuyTac(kho, taiKhoanId)), ...chuanHoa(vao) };
  await kho.luu(BANG, taiKhoanId, { ...moi, capNhatLuc: bayGio });
  return moi;
}

module.exports = { BANG, MAC_DINH, LoiQuyTac, docQuyTac, datQuyTac };
