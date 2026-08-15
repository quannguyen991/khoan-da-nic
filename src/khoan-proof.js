'use strict';
/**
 * KHOAN PROOF — PHẦN NỀN: đăng ký passkey và ghép cặp thiết bị.
 *
 * Khi có tin "mẹ ơi con đổi số, chuyển cho con 20 triệu", bác bấm "Xác minh yêu
 * cầu này". Tài khoản người con đã ghép cặp nhận đúng nội dung yêu cầu, xác nhận
 * hoặc từ chối bằng passkey (Windows Hello / vân tay / Face ID). Tệp này làm
 * phần ĐĂNG KÝ và GHÉP CẶP; phần ký một yêu cầu cụ thể nằm ở bước sau.
 *
 * ─── BA RÀNG BUỘC KHÔNG ĐƯỢC QUÊN ───
 *
 * ① WEBAUTHN ĐÒI SECURE CONTEXT.
 *    http://localhost:8089   → CHẠY ĐƯỢC (localhost là secure context)
 *    http://192.168.x.x:8089 → KHÔNG. credentials.create() ném lỗi.
 *    Demo chạy HAI TAB TRÊN MỘT MÁY qua localhost. Không dựng HTTPS, không dựng
 *    tunnel — hết giờ và chết khi rút mạng.
 *
 * ② KHÔNG GIẢ LẬP CHỮ KÝ. Nếu WebAuthn không dùng được thì BÁO, đừng giả vờ.
 *    Chữ ký giả lập là thứ tệ nhất có thể đưa vào sản phẩm này: nó biến một
 *    bằng chứng thành một sân khấu, và người dùng thì tin sân khấu.
 *
 * ③ §12 — KHOAN PROOF LÀ TUỲ CHỌN. Mặc định app vẫn là localStorage, không bật
 *    đồng bộ máy chủ. Chỉ chạy khi người dùng chủ động ghép cặp.
 *
 * ⚠️ §5.3 — tệp này KHÔNG được đụng vào đường phân tích rủi ro. Rút mạng, chưa
 * đăng nhập, chưa ghép cặp — /api/analyze VẪN phải chạy bằng tầng luật.
 * Hàng rào: test/khoan-proof-nen.test.js quét mã nguồn tệp này.
 *
 * ⚠️ §6.9 — KHÔNG ghi khoá riêng (passkey không đưa khoá riêng ra khỏi thiết bị,
 * nên máy chủ không có gì để ghi), KHÔNG ghi mã ghép dạng thô, KHÔNG ghi bất kỳ
 * trường nào trong TRUONG_CAM.
 */

const crypto = require('node:crypto');
const {
  generateRegistrationOptions, verifyRegistrationResponse,
} = require('@simplewebauthn/server');

const { moKho } = require('./vault-store');
const { taoMaGhep, kiemMaGhep, taoPhien, phienConHan } = require('./auth');

/**
 * ⚠️ `origin` và `rpID` phải khớp ĐÚNG thứ trình duyệt thấy trên thanh địa chỉ.
 * Lệch một chữ là `verifyRegistrationResponse` từ chối, và thông báo lỗi của nó
 * không nói ra chỗ lệch — mất hàng giờ mò.
 */
const CAU_HINH = Object.freeze({
  rpID: process.env.KHOAN_DA_RP_ID || 'localhost',
  rpName: 'Khoan Đã',
  origin: process.env.KHOAN_DA_ORIGIN || 'http://localhost:8089',
  userVerification: 'required',   // bắt buộc, để có sinh trắc học
});

/** §12 — không bật đồng bộ máy chủ mặc định. */
const MAC_DINH_BAT = false;

const BANG = Object.freeze({
  CHUNG_THU: 'proof_chung_thu',     // credential đã đăng ký, theo tài khoản
  THACH_DO: 'proof_thach_do',       // challenge đang chờ, theo tài khoản
  MA_GHEP: 'proof_ma_ghep',         // mã ghép đang mở, theo mã đã băm
  GHEP: 'proof_ghep',               // cặp đã ghép, theo chủ tài khoản
  PHIEN: 'proof_phien',             // token phiên
});

const HAN_THACH_DO_MS = 5 * 60 * 1000;

let khoDangCho = null;
const layKho = async () => {
  if (!khoDangCho) khoDangCho = moKho();
  return khoDangCho;
};

class LoiProof extends Error {
  constructor(ma, { http = 400, chiTiet } = {}) {
    super(ma);
    this.name = 'LoiProof';
    this.ma = ma;
    this.http = http;
    this.chiTiet = chiTiet;
  }
}

/** Băm mã ghép trước khi lưu — §6.9: kho không giữ bí mật dạng đọc được. */
const bam = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

// ─────────────────── Phiên ───────────────────

/**
 * ⚠️ DANH TÍNH LÀ TOKEN DO MÁY CHỦ CẤP, KHÔNG PHẢI THỨ NGƯỜI GỌI TỰ KHAI.
 *
 * Cùng bài học với hai lá cờ `verifiedChannel`/`verifiedRelationship`: thứ gì
 * người gọi tự khai được thì kẻ lừa đảo cũng khai được. Nên KHÔNG có header
 * kiểu `x-tai-khoan: <id>` nào ở đây.
 *
 * ⚠️ ĐÂY CHƯA PHẢI HỆ ĐĂNG NHẬP ĐẦY ĐỦ. Chưa có mật khẩu, chưa có email, chưa
 * có khôi phục tài khoản. `capPhienDemo()` là đường cấp token cho DEMO và chỉ mở
 * khi có biến môi trường `KHOAN_DA_PHIEN_DEMO=1` — mặc định ĐÓNG. Đừng gọi nó
 * là đăng nhập trên slide.
 */
async function capPhienDemo(taiKhoanId, { bayGio = Date.now(), env = process.env } = {}) {
  if (env.KHOAN_DA_PHIEN_DEMO !== '1') {
    throw new LoiProof('DUONG_DEMO_DANG_DONG', { http: 404 });
  }
  if (typeof taiKhoanId !== 'string' || !taiKhoanId.trim()) {
    throw new LoiProof('THIEU_TAI_KHOAN', { http: 400 });
  }
  const phien = taoPhien({ thanhVienId: taiKhoanId.trim(), bayGio });
  const kho = await layKho();
  await kho.luu(BANG.PHIEN, phien.token, {
    thanhVienId: phien.thanhVienId, hetHanLuc: phien.hetHanLuc,
  });
  return { token: phien.token, hetHanLuc: phien.hetHanLuc };
}

/** @returns {string|null} taiKhoanId, hoặc null nếu token sai / hết hạn. */
async function docPhien(header, { bayGio = Date.now() } = {}) {
  if (typeof header !== 'string') return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!m) return null;
  const kho = await layKho();
  const phien = await kho.doc(BANG.PHIEN, m[1]);
  if (!phienConHan(phien, bayGio)) return null;
  return phien.thanhVienId;
}

// ─────────────────── Đăng ký passkey ───────────────────

async function batDauDangKy(taiKhoanId, { bayGio = Date.now() } = {}) {
  const kho = await layKho();
  const daCo = await kho.doc(BANG.CHUNG_THU, taiKhoanId);

  const tuyChon = await generateRegistrationOptions({
    rpName: CAU_HINH.rpName,
    rpID: CAU_HINH.rpID,
    // ⚠️ userID là Uint8Array ở @simplewebauthn/server v13, KHÔNG phải chuỗi.
    userID: new TextEncoder().encode(taiKhoanId),
    userName: taiKhoanId,
    attestationType: 'none',   // không thu thập thông tin nhà sản xuất thiết bị
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: CAU_HINH.userVerification,
    },
    // Đã đăng ký rồi thì đừng cho đăng ký chồng lên cùng một thiết bị.
    excludeCredentials: daCo ? [{ id: daCo.credentialID }] : [],
  });

  await kho.luu(BANG.THACH_DO, taiKhoanId, {
    challenge: tuyChon.challenge,
    hetHanLuc: bayGio + HAN_THACH_DO_MS,
    loai: 'dang_ky',
  });

  return tuyChon;
}

async function xacNhanDangKy(taiKhoanId, phanHoi, { bayGio = Date.now() } = {}) {
  const kho = await layKho();
  const cho = await kho.doc(BANG.THACH_DO, taiKhoanId);

  // §4.3 — "không có thách đố" KHÁC "thách đố sai". Cả hai đều từ chối, nhưng
  // mã lỗi phải nói ra cái nào, nếu không thì không chẩn đoán được.
  if (!cho || cho.loai !== 'dang_ky') throw new LoiProof('CHUA_BAT_DAU_DANG_KY', { http: 400 });
  if (bayGio > cho.hetHanLuc) throw new LoiProof('THACH_DO_HET_HAN', { http: 400 });

  let kq;
  try {
    kq = await verifyRegistrationResponse({
      response: phanHoi,
      expectedChallenge: cho.challenge,
      expectedOrigin: CAU_HINH.origin,
      expectedRPID: CAU_HINH.rpID,
      requireUserVerification: CAU_HINH.userVerification === 'required',
    });
  } catch (e) {
    // ⚠️ KHÔNG nuốt nguyên nhân. §6.7: nhà cung cấp hết tiền hỏng giống hệt hỏng
    // do mã — ở đây cũng vậy, "origin lệch" hỏng giống hệt "chữ ký sai".
    throw new LoiProof('CHUNG_THU_KHONG_HOP_LE', { http: 400, chiTiet: e.message });
  }

  if (!kq.verified || !kq.registrationInfo) {
    throw new LoiProof('CHUNG_THU_KHONG_HOP_LE', { http: 400 });
  }

  // Thách đố dùng một lần — giữ lại là mở đường phát lại.
  await kho.xoa(BANG.THACH_DO, taiKhoanId);

  const { credential } = kq.registrationInfo;
  await kho.luu(BANG.CHUNG_THU, taiKhoanId, {
    taiKhoanId,
    credentialID: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: credential.transports || [],
    taoLuc: bayGio,
  });

  // ⚠️ KHÔNG trả credentialID / publicKey / counter ra ngoài. Người dùng không
  // cần chúng, và mỗi thứ rò ra là một thứ kẻ tấn công dùng để dò.
  return { daDangKy: true };
}

// ─────────────────── Ghép cặp ───────────────────

/**
 * §9.8 — mã ghép do CHỦ TÀI KHOẢN sinh, 6 số, hạn 10 phút, dùng một lần.
 * Mã sinh bằng `crypto.randomInt` (trong src/auth.js) — `Math.random()` không
 * dùng được ở đây: mã đoán được là ai cũng ghép vào vòng tròn nhà người khác.
 */
async function batDauGhep(chuTaiKhoanId, { bayGio = Date.now() } = {}) {
  const banGhi = taoMaGhep({ chuTaiKhoanId, bayGio });
  const kho = await layKho();

  // Lưu theo MÃ ĐÃ BĂM. Kho không bao giờ giữ mã dạng đọc được (§6.9).
  await kho.luu(BANG.MA_GHEP, bam(banGhi.ma), {
    chuTaiKhoanId,
    maBam: bam(banGhi.ma),
    hetHanLuc: banGhi.hetHanLuc,
    daDung: false,
  });

  return {
    ma: banGhi.ma,   // CHỈ trả về lượt này, cho chính chủ tài khoản. Không lưu.
    hetHanSauGiay: Math.round((banGhi.hetHanLuc - bayGio) / 1000),
  };
}

async function xacNhanGhep(nguoiConId, maNhap, { bayGio = Date.now() } = {}) {
  if (typeof maNhap !== 'string' || !/^\d{6}$/.test(maNhap)) {
    throw new LoiProof('MA_GHEP_SAI_DINH_DANG', { http: 400 });
  }
  const kho = await layKho();
  const banGhi = await kho.doc(BANG.MA_GHEP, bam(maNhap));

  // So bằng hàm CHỐNG ĐO THỜI GIAN, và so trên bản băm — cùng độ dài nên
  // `timingSafeEqual` không rơi vào nhánh lệch độ dài.
  const kq = kiemMaGhep(banGhi && { ...banGhi, ma: banGhi.maBam }, bam(maNhap), bayGio);
  if (!kq.hopLe) throw new LoiProof(kq.lyDo.toUpperCase(), { http: 400 });

  if (banGhi.chuTaiKhoanId === nguoiConId) {
    throw new LoiProof('KHONG_GHEP_VOI_CHINH_MINH', { http: 400 });
  }

  // Tiêu thụ mã TRƯỚC khi ghi cặp: nếu ghi cặp hỏng thì mã cũng đã cháy, an toàn
  // hơn là để mã sống sót sau một lượt gọi nửa vời.
  await kho.luu(BANG.MA_GHEP, banGhi.maBam, { ...banGhi, daDung: true });

  const cu = (await kho.doc(BANG.GHEP, banGhi.chuTaiKhoanId)) || { thanhVien: [] };
  const thanhVien = cu.thanhVien.filter((t) => t.thanhVienId !== nguoiConId);
  thanhVien.push({ thanhVienId: nguoiConId, ghepLuc: bayGio });
  await kho.luu(BANG.GHEP, banGhi.chuTaiKhoanId, {
    chuTaiKhoanId: banGhi.chuTaiKhoanId, thanhVien,
  });

  return { daGhep: true, chuTaiKhoanId: banGhi.chuTaiKhoanId };
}

/**
 * §9.8 — CHỦ TÀI KHOẢN thu hồi quyền bất cứ lúc nào, KHÔNG cần người con đồng ý.
 * Người con không thu hồi thay ai được: chỉ chủ tài khoản gọi được đường này.
 */
async function thuHoiGhep(chuTaiKhoanId, thanhVienId) {
  const kho = await layKho();
  const cu = await kho.doc(BANG.GHEP, chuTaiKhoanId);
  if (!cu) throw new LoiProof('KHONG_CO_CAP_NAO_DE_THU_HOI', { http: 404 });

  const conLai = cu.thanhVien.filter((t) => t.thanhVienId !== thanhVienId);
  if (conLai.length === cu.thanhVien.length) {
    throw new LoiProof('THANH_VIEN_KHONG_TRONG_VONG_TRON', { http: 404 });
  }
  await kho.luu(BANG.GHEP, chuTaiKhoanId, { ...cu, thanhVien: conLai });
  return { daThuHoi: true };
}

/** Ai đang ở trong vòng ghép của chủ tài khoản này. Dùng ở bước ký yêu cầu. */
async function danhSachDaGhep(chuTaiKhoanId) {
  const kho = await layKho();
  const ban = await kho.doc(BANG.GHEP, chuTaiKhoanId);
  return ban ? ban.thanhVien.map((t) => t.thanhVienId) : [];
}

/** Chỉ dùng cho TEST hàng rào §6.9 — trả về mọi bản ghi Khoan Proof đã lưu. */
async function docTatCaBanGhi() {
  const kho = await layKho();
  if (typeof kho.liet !== 'function') return [];
  const ra = [];
  for (const ten of Object.values(BANG)) ra.push(...await kho.liet(ten));
  return ra;
}

module.exports = {
  CAU_HINH, MAC_DINH_BAT, BANG, LoiProof,
  capPhienDemo, docPhien,
  batDauDangKy, xacNhanDangKy,
  batDauGhep, xacNhanGhep, thuHoiGhep, danhSachDaGhep,
  docTatCaBanGhi,
};
