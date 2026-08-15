'use strict';
/**
 * KHOAN PROOF — PHẦN LÕI: ký MỘT YÊU CẦU CỤ THỂ, xác minh chữ ký, sinh cụm từ.
 *
 * LUỒNG:
 *   1. Bác bấm "Xác minh yêu cầu này" trên một kết quả phân tích.
 *   2. Máy chủ tạo bản ghi yêu cầu, ràng buộc: caseId · khoảng số tiền · hành
 *      động được yêu cầu · người yêu cầu · hạn 3 phút · nonce chống phát lại.
 *   3. Tab người con nhận, HIỆN ĐÚNG NỘI DUNG ĐÓ, ký bằng passkey — xác nhận
 *      hoặc từ chối, cả hai đều được ký.
 *   4. Máy chủ xác minh chữ ký, tiêu thụ nonce.
 *   5. Cả hai máy hiện CÙNG một cụm từ.
 *
 * ══════════════ BA CHỖ DỄ LÀM SAI NHẤT ══════════════
 *
 * ① RÀNG CHỮ KÝ VÀO ĐÚNG YÊU CẦU.
 *    challenge = SHA-256 trên payload CHUẨN HOÁ. Chữ ký WebAuthn phủ
 *    authenticatorData và SHA-256(clientDataJSON), mà clientDataJSON chứa
 *    challenge — nên chữ ký ràng được vào payload.
 *
 *    ⚠️⚠️ GIỚI HẠN PHẢI BIẾT: AUTHENTICATOR **KHÔNG** HIỂN THỊ NỘI DUNG GIAO DỊCH.
 *    Extension `txAuthSimple` đã bị BỎ khỏi WebAuthn. Windows Hello chỉ hỏi
 *    "có phải bạn không?", nó KHÔNG hỏi "bạn có đồng ý chuyển 20 triệu không?".
 *    Việc hiện đúng nội dung là trách nhiệm của GIAO DIỆN APP, không phải của
 *    thiết bị. Đừng viết chữ nào ngụ ý thiết bị đã xác nhận nội dung — người
 *    dùng sẽ tin, và niềm tin đó không có gì đỡ.
 *
 * ② CỤM TỪ SINH RA TỪ CHỮ KÝ ĐÃ XÁC MINH, KHÔNG PHẢI TỪ caseId.
 *    HMAC(khoá máy chủ, chữ ký đã verify) → tra vào danh sách từ TĨNH.
 *    Sinh từ caseId thì nó chỉ chứng minh hai máy đang xem cùng bản ghi — không
 *    chứng minh gì về chữ ký, và nó HIỆN RA ĐƯỢC TRƯỚC KHI xác minh xong. Như
 *    thế là sân khấu, không phải bằng chứng.
 *    Cụm từ là thứ ĐỂ HIỆN, không phải bí mật. KHÔNG dùng nó làm token.
 *
 * ③ HẾT HẠN MÀ KHÔNG AI TRẢ LỜI — ĐÂY LÀ §4.3.
 *    Im lặng KHÔNG phải "không sao", cũng KHÔNG phải "đã từ chối".
 *    ⚠️ ĐỪNG NHẦM với §9.4 "im lặng = gửi". Hai cơ chế NGƯỢC nhau: §9.4 nói
 *    người thân không phản đối thì CỨ GỬI cảnh báo; §16.3 nói người thân không
 *    trả lời thì KHÔNG được coi là ổn.
 *
 * ══════════════ CHỮ HIỂN THỊ — §11 ══════════════
 *    ✅ "Yêu cầu đã được ký bởi tài khoản của Minh"
 *    ❌ "Giao dịch an toàn" · ❌ "Yêu cầu này hợp lệ" · ❌ "Đã xác minh là người thân"
 *
 *    Lý do: tài khoản hoặc thiết bị của Minh vẫn có thể bị chiếm quyền. VÀ dạng
 *    lạm dụng tài chính người cao tuổi phổ biến nhất là do NGƯỜI TRONG NHÀ gây
 *    ra — nên chữ ký hợp lệ KHÔNG chứng minh yêu cầu là chính đáng. App chỉ được
 *    nói AI ĐÃ KÝ, không được nói yêu cầu đó tốt hay xấu.
 *
 * ⚠️ Tệp này KHÔNG chạm decision-engine. Kết quả ký đi vào đường quyết định qua
 * ĐÚNG một cửa: `analyze()` trong pipeline.js. Không tạo đường quyết định thứ
 * hai, không thêm override thứ 11.
 */

const crypto = require('node:crypto');
const {
  generateAuthenticationOptions, verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const {
  CAU_HINH, LoiProof, BANG: BANG_NEN, danhSachDaGhep, layKho,
} = require('./khoan-proof');

/** §16.3 — hạn 3 phút. Đủ để người con cầm máy lên, không đủ để quên. */
const HAN_YEU_CAU_MS = 3 * 60 * 1000;

const BANG = Object.freeze({
  YEU_CAU: 'proof_yeu_cau',
  NONCE: 'proof_nonce',
});

/** §HĐ — canThiep vẫn ĐÚNG NĂM giá trị. Không có giá trị thứ sáu. */
const CAN_THIEP_HOP_LE = Object.freeze([
  'TRUST_RECEIPT', 'VERIFY_PATH', 'PAUSE_60S', 'PROTECTED_CRITICAL', 'RECOVERY',
]);

/**
 * MÃ KẾT QUẢ — frontend tra catalog để ra chữ. §HĐ luật 2.
 * ⚠️ Mã mô tả SỰ KIỆN, không mang phán xét. Không có mã nào tên *_AN_TOAN,
 * *_HOP_LE, *_CHINH_DANG — vì app không biết những điều đó và không được nói.
 */
const MA_KET_QUA = Object.freeze({
  DA_KY_XAC_NHAN: 'YEU_CAU_DA_DUOC_KY_BOI_TAI_KHOAN',
  DA_KY_TU_CHOI: 'TAI_KHOAN_DA_KY_TU_CHOI_YEU_CAU',
  DANG_CHO_KY: 'DANG_CHO_TAI_KHOAN_KIA_KY',
  HET_HAN_KHONG_TRA_LOI: 'CHUA_LIEN_LAC_DUOC_NGUOI_THAN',
  /** §4.6 — màn chờ chữ ký PHẢI có lối ra. */
  LOI_RA_TOI_ON: 'TOI_ON_KHONG_CO_GI_NGUY_HIEM',
});

/**
 * TỪ VỰNG CỤM TỪ — danh sách TĨNH, không sinh động.
 * Chọn từ NGẮN, DỄ ĐỌC QUA ĐIỆN THOẠI, không đồng âm với nhau khi nghe. Đây là
 * thứ hai người sẽ đọc cho nhau nghe trong lúc một bên đang hoảng.
 *
 * ⚠️ Là MÃ, không phải chữ hiển thị. Frontend tra catalog ra "Lá Tím", "Núi Xanh".
 */
const TU_VUNG_CUM_TU = Object.freeze([
  'LA_TIM', 'NUI_XANH', 'SONG_HONG', 'MUA_HA', 'TRE_LANG',
  'CAU_VONG', 'BIEN_LAN', 'DEN_LONG', 'GIENG_KHOI', 'CANH_DIEU',
  'HOA_SEN', 'MAI_NGOI', 'CHIM_SE', 'BEN_DO', 'GIO_MUA',
  'TRANG_RAM',
]);
const SO_CUM_TU = 48;   // "LA_TIM 47" — số 1..48

/**
 * Khoá HMAC của MÁY CHỦ. Không phải bí mật sống-chết (cụm từ vốn để hiện ra),
 * nhưng phải ổn định trong một phiên chạy để hai đầu ra cùng kết quả.
 */
const KHOA_CUM_TU = process.env.KHOAN_DA_KHOA_CUM_TU
  || crypto.randomBytes(32).toString('base64url');

// ⚠️ DÙNG CHUNG KHO VỚI khoan-proof.js — KHÔNG gọi moKho() lần nữa ở đây.
// Mở kho thứ hai là chứng thư nằm một nơi, đường tra nằm nơi khác, và mọi chữ
// ký đúng đều bị trả về CHUA_DANG_KY_PASSKEY. Đã đo được, xem chú thích bên đó.

/**
 * PAYLOAD CHUẨN HOÁ — thứ tự khoá CỐ ĐỊNH.
 * `JSON.stringify` giữ thứ tự chèn, nên hai bên dựng object khác thứ tự sẽ ra
 * hai chuỗi khác nhau và chữ ký trượt. Liệt kê tường minh, đừng dựa vào may rủi.
 */
function chuanHoaPayload(y) {
  return JSON.stringify([
    // ⚠️ CHỦ TÀI KHOẢN NẰM TRONG PAYLOAD ĐƯỢC KÝ. Thiếu nó thì một chữ ký đúng
    // cho vòng nhà này dùng lại được ở vòng nhà khác — cùng caseId, cùng số
    // tiền, khác gia đình. Ràng vào chữ ký, không chỉ kiểm ở tầng route.
    ['chuTaiKhoanId', String(y.chuTaiKhoanId ?? '')],
    ['caseId', String(y.caseId ?? '')],
    ['khoangTien', String(y.khoangTien ?? '')],
    ['hanhDong', String(y.hanhDong ?? '')],
    ['nguoiYeuCau', String(y.nguoiYeuCau ?? '')],
    ['hetHan', Number(y.hetHan ?? 0)],
    ['nonce', String(y.nonce ?? '')],
  ]);
}

/** challenge = SHA-256(payload chuẩn hoá), base64url — đúng dạng WebAuthn cần. */
const bamYeuCau = (y) => crypto.createHash('sha256')
  .update(chuanHoaPayload(y)).digest('base64url');

/**
 * ② CỤM TỪ SINH TỪ CHỮ KÝ ĐÃ XÁC MINH.
 * Tham số là chuỗi chữ ký — hàm này chỉ được gọi SAU khi verify trả về true.
 */
function cumTuTuChuKy(chuKyDaXacMinh) {
  const h = crypto.createHmac('sha256', KHOA_CUM_TU).update(String(chuKyDaXacMinh)).digest();
  const tu = TU_VUNG_CUM_TU[h[0] % TU_VUNG_CUM_TU.length];
  const so = (h[1] % SO_CUM_TU) + 1;
  return `${tu} ${so}`;
}

// ─────────────────── Tạo yêu cầu ───────────────────

async function taoYeuCau(yeuCau = {}, { bayGio = Date.now() } = {}) {
  for (const truong of ['chuTaiKhoanId', 'caseId', 'khoangTien', 'hanhDong', 'nguoiYeuCau']) {
    if (typeof yeuCau[truong] !== 'string' || !yeuCau[truong].trim()) {
      throw new LoiProof('THIEU_TRUONG_YEU_CAU', { http: 400, chiTiet: truong });
    }
  }

  const nonce = crypto.randomBytes(24).toString('base64url');
  const hetHan = bayGio + HAN_YEU_CAU_MS;
  const payload = {
    chuTaiKhoanId: yeuCau.chuTaiKhoanId,
    caseId: yeuCau.caseId,
    khoangTien: yeuCau.khoangTien,   // KHOẢNG, không phải số chính xác (§6.9)
    hanhDong: yeuCau.hanhDong,
    nguoiYeuCau: yeuCau.nguoiYeuCau,
    hetHan,
    nonce,
  };
  const challenge = bamYeuCau(payload);
  const yeuCauId = crypto.randomBytes(16).toString('base64url');

  const tuyChon = await generateAuthenticationOptions({
    rpID: CAU_HINH.rpID,
    challenge,   // ⚠️ CHÍNH LÀ bản băm payload — đây là chỗ ràng buộc xảy ra
    userVerification: CAU_HINH.userVerification,
  });

  const kho = await layKho();
  await kho.luu(BANG.YEU_CAU, yeuCauId, {
    yeuCauId, ...payload, challenge, trangThai: MA_KET_QUA.DANG_CHO_KY, taoLuc: bayGio,
  });

  // ⚠️ KHÔNG trả `cumTu` ở đây, và bản ghi cũng chưa có. Cụm từ chỉ tồn tại SAU
  // khi verify thành công — nếu nó tính ra được lúc này thì nó là sân khấu.
  return { yeuCauId, challenge, hetHan, tuyChon, ...payload };
}

/** Trạng thái yêu cầu, cho cả hai đầu hỏi. Không có gì bí mật ở đây. */
async function docYeuCau(yeuCauId, { bayGio = Date.now() } = {}) {
  const kho = await layKho();
  const ban = await kho.doc(BANG.YEU_CAU, yeuCauId);
  if (!ban) throw new LoiProof('KHONG_CO_YEU_CAU', { http: 404 });

  /**
   * ③ §4.3 — HẾT HẠN MÀ KHÔNG AI TRẢ LỜI.
   * Trạng thái này KHÔNG phải "đã từ chối" và KHÔNG phải "không sao". Nó là
   * "chưa liên lạc được" — một thứ CHƯA KIỂM ĐƯỢC.
   */
  const trangThai = ban.trangThai === MA_KET_QUA.DANG_CHO_KY && bayGio > ban.hetHan
    ? MA_KET_QUA.HET_HAN_KHONG_TRA_LOI : ban.trangThai;

  return {
    yeuCauId: ban.yeuCauId,
    chuTaiKhoanId: ban.chuTaiKhoanId,
    caseId: ban.caseId,
    khoangTien: ban.khoangTien,
    hanhDong: ban.hanhDong,
    nguoiYeuCau: ban.nguoiYeuCau,
    hetHan: ban.hetHan,
    trangThai,
    // Chỉ có sau khi verify. `undefined` trước đó — không phải chuỗi rỗng.
    ...(ban.cumTu ? { cumTu: ban.cumTu } : {}),
  };
}

// ─────────────────── Xác minh chữ ký ───────────────────

/**
 * @param {object} p { yeuCauId, taiKhoanId, quyetDinh: 'XAC_NHAN'|'TU_CHOI', phanHoi }
 * @returns {{maKetQua:string, cumTu:string, quyetDinh:string}}
 */
async function xacMinhChuKy(p, { bayGio = Date.now() } = {}) {
  if (!['XAC_NHAN', 'TU_CHOI'].includes(p.quyetDinh)) {
    throw new LoiProof('QUYET_DINH_KHONG_HOP_LE', { http: 400 });
  }

  const kho = await layKho();
  const ban = await kho.doc(BANG.YEU_CAU, p.yeuCauId);
  if (!ban) throw new LoiProof('KHONG_CO_YEU_CAU', { http: 404 });

  // Hạn kiểm TRƯỚC chữ ký: một chữ ký đúng cho một yêu cầu đã chết vẫn là chết.
  if (bayGio > ban.hetHan) throw new LoiProof('YEU_CAU_HET_HAN', { http: 400 });

  // Nonce dùng một lần. Kiểm TRƯỚC verify để phát lại không tốn phép mã hoá.
  if (await kho.doc(BANG.NONCE, ban.nonce)) {
    throw new LoiProof('NONCE_DA_DUNG', { http: 409 });
  }

  /**
   * ⚠️ NGƯỜI KÝ PHẢI Ở TRONG VÒNG GHÉP CỦA CHỦ TÀI KHOẢN.
   *
   * Lỗ đã đo được khi thiếu phép kiểm này: BẤT KỲ AI có passkey đã đăng ký cũng
   * ký hợp lệ cho yêu cầu của người khác. Chữ ký đúng, verify trả về true, và
   * máy chủ đặt `verifiedRelationship = true` cho một người hoàn toàn xa lạ —
   * tức là kẻ lừa đảo tự đăng ký một passkey rồi tự xác nhận cho chính mình.
   *
   * Kiểm TRƯỚC khi verify: không có tư cách thì không cần tốn phép mã hoá.
   */
  if (!await duocPhepKy(ban.chuTaiKhoanId, p.taiKhoanId)) {
    throw new LoiProof('NGUOI_KY_KHONG_TRONG_VONG_GHEP', { http: 403 });
  }

  const chungThu = await kho.doc(BANG_NEN.CHUNG_THU, p.taiKhoanId);
  if (!chungThu) throw new LoiProof('CHUA_DANG_KY_PASSKEY', { http: 400 });

  let kq;
  try {
    kq = await verifyAuthenticationResponse({
      response: p.phanHoi,
      expectedChallenge: ban.challenge,   // ⚠️ băm của ĐÚNG yêu cầu này
      expectedOrigin: [...CAU_HINH.origins],
      expectedRPID: CAU_HINH.rpID,
      requireUserVerification: CAU_HINH.userVerification === 'required',
      credential: {
        id: chungThu.credentialID,
        publicKey: Buffer.from(chungThu.publicKey, 'base64url'),
        counter: chungThu.counter,
        transports: chungThu.transports,
      },
    });
  } catch (e) {
    throw new LoiProof('CHU_KY_KHONG_HOP_LE', { http: 400, chiTiet: e.message });
  }
  if (!kq.verified) throw new LoiProof('CHU_KY_KHONG_HOP_LE', { http: 400 });

  // Tiêu thụ nonce NGAY sau khi verify — trước cả khi ghi kết quả.
  await kho.luu(BANG.NONCE, ban.nonce, { daDung: true, luc: bayGio });
  await kho.luu(BANG_NEN.CHUNG_THU, p.taiKhoanId, {
    ...chungThu, counter: kq.authenticationInfo.newCounter,
  });

  // ② Cụm từ sinh TỪ CHỮ KÝ ĐÃ XÁC MINH — không phải từ caseId, không phải từ
  //    yeuCauId. Tới dòng này thì chữ ký mới chắc chắn đúng.
  const cumTu = cumTuTuChuKy(p.phanHoi?.response?.signature);

  const maKetQua = p.quyetDinh === 'XAC_NHAN'
    ? MA_KET_QUA.DA_KY_XAC_NHAN : MA_KET_QUA.DA_KY_TU_CHOI;

  await kho.luu(BANG.YEU_CAU, ban.yeuCauId, {
    ...ban, trangThai: maKetQua, cumTu, kyBoi: p.taiKhoanId, kyLuc: bayGio,
  });

  return { maKetQua, cumTu, quyetDinh: p.quyetDinh, kyBoi: p.taiKhoanId };
}

/**
 * NỐI VÀO BỘ LUẬT — MỘT CỬA DUY NHẤT.
 *
 * Đọc trạng thái đã ký của một vụ việc rồi trả về thứ `analyze()` cần. Ba nhánh:
 *   · XÁC NHẬN ⇒ MÁY CHỦ (không phải client) đặt verifiedRelationship = true.
 *     Đây chính là chỗ đã chừa sẵn khi vá lỗ lá cờ tự khai.
 *   · TỪ CHỐI  ⇒ tín hiệu LÀM TĂNG mức. Người được nêu tên nói "tôi không gửi"
 *     thì đây đúng là giả danh người thân — dùng ID_FAMILY_IMPERSONATION, một
 *     tín hiệu ĐÃ CÓ trong Phụ lục A. §12 cấm thêm tín hiệu mới, và ở đây cũng
 *     không cần thêm.
 *   · HẾT HẠN ⇒ sàn NGHI_NGO, xử ở `unreadableInputFloor()`.
 *
 * @returns {{nguCanhTinCay:object, dauVao:object}} hai thứ truyền cho analyze()
 */
function nguCanhTuTrangThai(trangThai) {
  if (trangThai === MA_KET_QUA.DA_KY_XAC_NHAN) {
    return { nguCanhTinCay: { verifiedRelationship: true }, dauVao: { xacMinhNguoiThan: 'DA_XAC_NHAN' } };
  }
  if (trangThai === MA_KET_QUA.DA_KY_TU_CHOI) {
    return { nguCanhTinCay: {}, dauVao: { xacMinhNguoiThan: 'DA_TU_CHOI' } };
  }
  if (trangThai === MA_KET_QUA.HET_HAN_KHONG_TRA_LOI) {
    return { nguCanhTinCay: {}, dauVao: { xacMinhNguoiThan: 'HET_HAN_KHONG_TRA_LOI' } };
  }
  return { nguCanhTinCay: {}, dauVao: {} };
}

/** Ai được phép ký cho yêu cầu của chủ tài khoản này. Dùng ở tầng route. */
async function duocPhepKy(chuTaiKhoanId, taiKhoanId) {
  return (await danhSachDaGhep(chuTaiKhoanId)).includes(taiKhoanId);
}

module.exports = {
  HAN_YEU_CAU_MS, BANG, MA_KET_QUA, CAN_THIEP_HOP_LE, TU_VUNG_CUM_TU, SO_CUM_TU,
  bamYeuCau, chuanHoaPayload, cumTuTuChuKy,
  taoYeuCau, docYeuCau, xacMinhChuKy, nguCanhTuTrangThai, duocPhepKy,
};
