'use strict';
/**
 * CẦU NỐI GỬI PUSH THẬT (WEB PUSH + FCM NATIVE) CHO CẢNH BÁO HAI PHÍA.
 *
 * - Dùng chung thực thể kho duy nhất (`KP.khoChung()`) và bảng thiết bị đã đăng ký
 *   của người thân (`gia_dinh_nhan`).
 * - Tuân thủ nghiêm ngặt §9.4 và §11:
 *   · Chưa có máy đăng ký hoặc chưa cấu hình VAPID/FCM ⇒ trả `endpointOk: false` trung thực.
 *   · Đẩy thành công tới dịch vụ Push ⇒ trả `endpointOk: true` (chỉ có nghĩa `da_day_di`,
 *     KHÔNG BAO GIỜ có nghĩa người thân đã đọc).
 *   · Tự dọn các subscription hết hạn (`DANG_KY_HET_HAN`).
 */

const { guiCanhBao, TRANG_THAI_GUI } = require('./push');

const BANG_NHAN = 'push_nhan_canh_bao';

const TONG_QUAT_THONG_BAO = Object.freeze({
  vi: {
    caoTieuDe: 'Khoan Đã · Cảnh báo nguy hiểm cao',
    caoNoiDung: '{ten} vừa nhận một nội dung có dấu hiệu rủi ro cao. Hãy gọi kiểm tra ngay.',
    nghiNgoTieuDe: 'Khoan Đã · Cần theo dõi',
    nghiNgoNoiDung: '{ten} vừa gặp một tình huống nghi ngờ cần lưu ý.',
  },
  en: {
    caoTieuDe: 'Khoan Đã · High-risk alert',
    caoNoiDung: '{ten} just encountered high-risk scam indicators. Call to check right away.',
    nghiNgoTieuDe: 'Khoan Đã · Needs attention',
    nghiNgoNoiDung: '{ten} just encountered a suspicious request.',
  },
});

function soanThongBaoHaiPhia(payloadNguoiThan, lang = 'vi') {
  const b = lang === 'en' ? TONG_QUAT_THONG_BAO.en : TONG_QUAT_THONG_BAO.vi;
  const ten = payloadNguoiThan?.tenNguoiCaoTuoi || (lang === 'en' ? 'Your family member' : 'Người thân');
  const laCao = payloadNguoiThan?.nhan === 'CAO';
  const id = payloadNguoiThan?.canhBaoId || 'moi';
  return {
    tieuDe: laCao ? b.caoTieuDe : b.nghiNgoTieuDe,
    noiDung: (laCao ? b.caoNoiDung : b.nghiNgoNoiDung).replace('{ten}', ten),
    khan: laCao,
    ma: `hai-phia-${id}`,
    duong: `/?view=guardian&canhBao=${encodeURIComponent(id)}`,
    lang: lang === 'en' ? 'en' : 'vi',
  };
}

async function guiPushHaiPhia({
  kho,
  nguoiNhanId,
  payloadNguoiThan,
  guiThat,
  guiThatNative,
  env = process.env,
}) {
  if (!kho || !nguoiNhanId) {
    return { endpointOk: false, ma: 'CHUA_CAU_HINH_PUSH' };
  }
  const banGhi = await kho.doc(BANG_NHAN, nguoiNhanId);
  const ds = Array.isArray(banGhi?.ds) ? banGhi.ds : [];
  if (ds.length === 0) {
    return { endpointOk: false, ma: 'CHUA_CAU_HINH_PUSH' };
  }

  let daDayItNhatMotMay = false;
  let maCuoi = 'PUSH_DELIVERY_UNKNOWN';
  const conSong = [];

  for (const may of ds) {
    const lang = may?.lang === 'en' ? 'en' : 'vi';
    const r = await guiCanhBao({
      dangKy: may?.dangKy,
      payload: soanThongBaoHaiPhia(payloadNguoiThan, lang),
      env,
      guiThat,
      guiThatNative,
    });
    if (r.trangThai !== TRANG_THAI_GUI.het_han_dang_ky) {
      conSong.push(may);
    }
    if (r.trangThai === TRANG_THAI_GUI.da_day_di) {
      daDayItNhatMotMay = true;
    } else if (r.trangThai) {
      maCuoi = r.trangThai;
    }
  }

  if (conSong.length !== ds.length) {
    await kho.luu(BANG_NHAN, nguoiNhanId, { ds: conSong }).catch(() => {});
  }

  return daDayItNhatMotMay
    ? { endpointOk: true, ma: TRANG_THAI_GUI.da_day_di }
    : { endpointOk: false, ma: maCuoi };
}

module.exports = { guiPushHaiPhia, soanThongBaoHaiPhia };
