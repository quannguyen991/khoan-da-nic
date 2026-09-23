'use strict';
/**
 * ═════ CHÌA KHOÁ THỨ HAI — Phần 5 "Cầu dao gia đình", 23/9/2026 ═════
 *
 * Singapore đã làm thật: UOB LockAway, OCBC Money Lock, DBS digiVault cho khoá một
 * phần tiền tiết kiệm; muốn mở phải ra quầy. Việt Nam chưa có. Khoan Đã đề xuất
 * phiên bản gia đình: khoản chuyển LỚN tới người nhận MỚI từ tài khoản người cao
 * tuổi cần CON xác nhận — ký bằng passkey qua Khoan Proof (đã có ở máy chủ).
 *
 * ⚠️ §12 — KHÔNG HỨA CHẶN GIAO DỊCH. Khoan Đã không nối với ngân hàng thật nào.
 *   "Ngân hàng" dùng đường này trong app là MÀN MÔ PHỎNG, ghi rõ chữ đó. Đây là
 *   đề xuất hợp tác, không phải một tính năng ngân hàng.
 * ⚠️ §6.9 — CHỈ KHOẢNG TIỀN, KHÔNG SỐ CHÍNH XÁC; không tên, không số tài khoản
 *   người nhận. Mọi trường là MÃ trong danh sách cố định.
 * ⚠️ §11 — chữ ký chỉ nói AI ĐÃ KÝ, không nói khoản chuyển an toàn: tài khoản con
 *   có thể bị chiếm, và lạm dụng tài chính người già hay đến từ người trong nhà.
 * ⚠️ Bật/tắt và ngưỡng do CHÍNH bố mẹ đặt (phiên của họ), mặc định TẮT.
 */
const crypto = require('node:crypto');
const { generateAuthenticationOptions } = require('@simplewebauthn/server');
const KP = require('./khoan-proof');
const KY = require('./khoan-proof-ky');

const BANG = 'chia_khoa_thu_hai';
const TIEN_TO_VU = 'chia_khoa_';
const NGUONG_HOP_LE = Object.freeze([5, 10, 20, 50]);          // triệu đồng
const MAC_DINH = Object.freeze({ bat: false, nguong: 10 });

/** Khoảng tiền (triệu đồng): [cận dưới, cận trên). Máy gửi MÃ khoảng, không gửi số. */
const KHOANG_TIEN = Object.freeze({
  duoi_5: [0, 5], '5_10': [5, 10], '10_20': [10, 20], '20_50': [20, 50], tren_50: [50, Infinity],
});
const HANH_DONG = Object.freeze(['chuyen_khoan', 'rut_tien']);
const NGUOI_YEU_CAU = Object.freeze(['nguoi_la', 'nguoi_quen', 'khong_ro']);

class LoiChiaKhoa extends Error {
  constructor(ma, http = 400) { super(ma); this.name = 'LoiChiaKhoa'; this.ma = ma; this.http = http; }
}

/** Mã khoảng tiền cho một số tiền (triệu). Dùng ở màn mô phỏng — số không rời máy. */
function khoangTuSo(trieu) {
  const n = Number(trieu);
  if (!Number.isFinite(n) || n < 0) return null;
  for (const [ma, [duoi, tren]] of Object.entries(KHOANG_TIEN)) if (n >= duoi && n < tren) return ma;
  return null;
}

async function docCaiDat(kho, taiKhoanId) {
  const b = await kho.doc(BANG, taiKhoanId);
  return {
    bat: b?.bat === true,
    nguong: NGUONG_HOP_LE.includes(b?.nguong) ? b.nguong : MAC_DINH.nguong,
  };
}

async function datCaiDat(kho, taiKhoanId, vao, bayGio = Date.now()) {
  if (!vao || typeof vao !== 'object') throw new LoiChiaKhoa('CAI_DAT_KHONG_HOP_LE');
  const cu = await docCaiDat(kho, taiKhoanId);
  const moi = { ...cu };
  if (vao.bat !== undefined) {
    if (typeof vao.bat !== 'boolean') throw new LoiChiaKhoa('CAI_DAT_KHONG_HOP_LE');
    moi.bat = vao.bat;
  }
  if (vao.nguong !== undefined) {
    if (!NGUONG_HOP_LE.includes(vao.nguong)) throw new LoiChiaKhoa('NGUONG_KHONG_HOP_LE');
    moi.nguong = vao.nguong;
  }
  await kho.luu(BANG, taiKhoanId, { ...moi, capNhatLuc: bayGio });
  return moi;
}

/** Hàm thuần: khoản này có cần con xác nhận không. */
function canXacNhan(caiDat, { khoangTien, nguoiNhanMoi }) {
  const k = KHOANG_TIEN[khoangTien];
  if (!k) throw new LoiChiaKhoa('KHOANG_TIEN_KHONG_HOP_LE');
  return Boolean(caiDat.bat && nguoiNhanMoi === true && k[0] >= caiDat.nguong);
}

/** Bố mẹ nhờ con xác nhận. Tạo yêu cầu Khoan Proof (hạn 3 phút, nonce một lần). */
async function taoYeuCau(boMeId, vao) {
  const { khoangTien, hanhDong, nguoiYeuCau } = vao || {};
  if (!KHOANG_TIEN[khoangTien]) throw new LoiChiaKhoa('KHOANG_TIEN_KHONG_HOP_LE');
  if (!HANH_DONG.includes(hanhDong)) throw new LoiChiaKhoa('HANH_DONG_KHONG_HOP_LE');
  if (!NGUOI_YEU_CAU.includes(nguoiYeuCau)) throw new LoiChiaKhoa('NGUOI_YEU_CAU_KHONG_HOP_LE');
  if ((await KP.danhSachDaGhep(boMeId)).length === 0) throw new LoiChiaKhoa('CHUA_NOI_VOI_AI');
  const y = await KY.taoYeuCau({
    chuTaiKhoanId: boMeId,
    caseId: TIEN_TO_VU + crypto.randomBytes(9).toString('base64url'),
    khoangTien, hanhDong, nguoiYeuCau,
  });
  return { yeuCauId: y.yeuCauId, hetHan: y.hetHan, khoangTien, hanhDong, nguoiYeuCau };
}

/** Máy CON: các yêu cầu đang chờ từ những bố mẹ đã ghép với mình. */
async function dangCho(kho, taiKhoanId, layHoSo, bayGio = Date.now()) {
  const { chuTaiKhoan } = await KP.capGhepCuaToi(taiKhoanId);
  const boMe = new Set(chuTaiKhoan.map((x) => x.id));
  if (boMe.size === 0 || typeof kho.liet !== 'function') return { yeuCau: [] };
  const ra = [];
  for (const b of await kho.liet(KY.BANG.YEU_CAU)) {
    if (!boMe.has(b.chuTaiKhoanId) || !String(b.caseId).startsWith(TIEN_TO_VU)) continue;
    if (b.trangThai !== KY.MA_KET_QUA.DANG_CHO_KY || bayGio > b.hetHan) continue;
    ra.push({
      yeuCauId: b.yeuCauId,
      tenBoMe: (await layHoSo(kho, b.chuTaiKhoanId))?.ten || '',
      khoangTien: b.khoangTien, hanhDong: b.hanhDong, nguoiYeuCau: b.nguoiYeuCau, hetHan: b.hetHan,
    });
  }
  return { yeuCau: ra };
}

/**
 * Máy CON: "đề bài" để passkey ký cho ĐÚNG yêu cầu này.
 * ⚠️ Đề bài là chuỗi đã lưu trong yêu cầu (bản băm payload, đã mã hoá đúng như
 * trình duyệt nhận) — xem sửa 23/9 trong `khoan-proof-ky.js`.
 * Chưa có passkey ⇒ `{ canDangKy: true }` để giao diện mời tạo trước.
 */
async function tuyChonKy(kho, yeuCauId, taiKhoanId, bayGio = Date.now()) {
  const ban = await kho.doc(KY.BANG.YEU_CAU, yeuCauId);
  if (!ban) throw new LoiChiaKhoa('KHONG_CO_YEU_CAU', 404);
  if (!(await KP.danhSachDaGhep(ban.chuTaiKhoanId)).includes(taiKhoanId)) {
    throw new LoiChiaKhoa('NGUOI_KY_KHONG_TRONG_VONG_GHEP', 403);
  }
  if (bayGio > ban.hetHan) throw new LoiChiaKhoa('YEU_CAU_HET_HAN');
  const chungThu = await kho.doc(KP.BANG.CHUNG_THU, taiKhoanId);
  if (!chungThu) return { canDangKy: true };
  const tuyChon = await generateAuthenticationOptions({
    rpID: KP.CAU_HINH.rpID,
    userVerification: KP.CAU_HINH.userVerification,
    allowCredentials: [{ id: chungThu.credentialID, transports: chungThu.transports }],
  });
  // Ghi đè đề bài bằng ĐÚNG chuỗi đã lưu — không để thư viện sinh đề bài ngẫu nhiên.
  return { canDangKy: false, tuyChon: { ...tuyChon, challenge: ban.challenge } };
}

module.exports = {
  BANG, MAC_DINH, NGUONG_HOP_LE, KHOANG_TIEN, HANH_DONG, NGUOI_YEU_CAU, LoiChiaKhoa,
  khoangTuSo, docCaiDat, datCaiDat, canXacNhan, taoYeuCau, dangCho, tuyChonKy,
};
