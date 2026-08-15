'use strict';
/**
 * §2B.2 hạng mục 25 — ĐẨY THÔNG BÁO TỚI NGƯỜI THÂN.
 *
 * ⚠️ §9.4 — TRẠNG THÁI GIAO NHẬN KHÔNG ĐƯỢC NÓI QUÁ:
 *   "Đã đẩy cảnh báo đi"     endpoint trả thành công — KHÔNG đồng nghĩa người
 *                            thân đã thấy
 *   "Hương đã mở lúc 14:08"  có sự kiện mở — ghi audit được
 *   "Hương đã đọc và hiểu"   KHÔNG CÓ BẰNG CHỨNG — KHÔNG BAO GIỜ hiển thị
 *
 * ⚠️ §6.7 — `PUSH_DELIVERY_UNKNOWN` là một TRẠNG THÁI HỢP LỆ, không phải lỗi cần
 * giấu. Gửi lỗi / máy offline / quyền bị tắt đều ra
 * "Không xác nhận được cảnh báo đã tới máy người thân".
 *
 * ⚠️ §11 — "đã đọc và hiểu" cho notification là câu bị cấm.
 *
 * ⚠️ HAI HÌNH DẠNG ĐĂNG KÝ, KHÔNG ÉP CÁI NÀY QUA KHUÔN CÁI KIA.
 *   `web`    trình duyệt · Web Push + VAPID · `{endpoint, keys:{p256dh, auth}}`
 *   `native` bản APK      · FCM            · `{loai:'native', token}`
 *
 *   Bản APK dựng bằng Capacitor chạy trong Android System WebView, mà WebView
 *   KHÔNG có Web Push. Plugin thông báo native đưa về MỘT CHUỖI TOKEN FCM. Ép
 *   token đó qua khuôn Web Push thì `chuanHoaDangKy` ném lỗi, `guiCanhBao` biến
 *   nó thành `PUSH_DELIVERY_UNKNOWN`, và cảnh báo cho người thân IM LẶNG KHÔNG
 *   TỚI — log máy chủ vẫn sạch. Hàng rào: `test/push-trong-apk.test.js`.
 *
 * TRẠNG THÁI HIỆN TẠI: chưa cấu hình khoá VAPID, chưa cấu hình FCM, chưa cắm
 * nhà cung cấp nào. Module dựng đủ đường đi và ĐIỂM CẮM cho cả hai loại, nhưng
 * hàm gửi thật trả `CHUA_CAU_HINH_PUSH` — nói thật, không giả lập thành công.
 */

const { LoiQuyen } = require('./trusted-circle');

const TRANG_THAI_GUI = Object.freeze({
  chua_cau_hinh: 'CHUA_CAU_HINH_PUSH',
  da_day_di: 'DA_DAY_DI',
  khong_xac_nhan_duoc: 'PUSH_DELIVERY_UNKNOWN',
  het_han_dang_ky: 'DANG_KY_HET_HAN',
});

/** Hai đường đi của thông báo. Thiếu `loai` ⇒ mặc định là `web` (tương thích ngược). */
const LOAI_DANG_KY = Object.freeze({ web: 'web', native: 'native' });

/** FCM nói token đã chết bằng những chữ này, không phải bằng mã HTTP. */
const TOKEN_DA_CHET = Object.freeze(['UNREGISTERED', 'NOT_FOUND', 'INVALID_ARGUMENT']);

/**
 * §6.9 — `chiTiet` đi vào log KHÔNG được mang theo token hay endpoint dạng thô.
 * Lỗi của nhà cung cấp rất hay nhét nguyên đăng ký vào câu thông báo.
 */
function boChe(chiTiet, ...biMat) {
  let s = typeof chiTiet === 'string' ? chiTiet : String(chiTiet ?? '');
  for (const b of biMat) {
    if (typeof b === 'string' && b.length >= 8) s = s.split(b).join('[đã che]');
  }
  return s;
}

/** Đăng ký push của một thành viên. KHÔNG chứa nội dung, không chứa danh tính. */
function chuanHoaDangKy(dk) {
  if (!dk || typeof dk !== 'object') throw new LoiQuyen('DANG_KY_KHONG_HOP_LE');
  const { endpoint, keys } = dk;
  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint)) {
    throw new LoiQuyen('ENDPOINT_PHAI_LA_HTTPS');
  }
  if (!keys || typeof keys.p256dh !== 'string' || typeof keys.auth !== 'string') {
    throw new LoiQuyen('THIEU_KHOA_DANG_KY');
  }
  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

/**
 * Đăng ký của bản APK. Token FCM là một chuỗi mờ — KHÔNG phải URL, nên đừng
 * kiểm nó bằng khuôn của Web Push.
 * §6.9 — giữ đúng `loai` và `token`, bỏ mọi trường khác kể cả tên và số điện thoại.
 */
function chuanHoaDangKyNative(dk) {
  if (!dk || typeof dk !== 'object') throw new LoiQuyen('DANG_KY_KHONG_HOP_LE');
  const { token } = dk;
  if (typeof token !== 'string' || token.trim() === '') {
    throw new LoiQuyen('THIEU_TOKEN_NATIVE');
  }
  return { loai: LOAI_DANG_KY.native, token: token.trim() };
}

function layCauHinhVapid(env = process.env) {
  const congKhai = env.VAPID_PUBLIC_KEY;
  const riengTu = env.VAPID_PRIVATE_KEY;
  const lienHe = env.VAPID_SUBJECT;
  return { congKhai, riengTu, lienHe, daCauHinh: Boolean(congKhai && riengTu && lienHe) };
}

/** Cấu hình FCM cho đường APK. Đường này KHÔNG dùng VAPID. */
function layCauHinhFcm(env = process.env) {
  const khoaMayChu = env.FCM_SERVER_KEY;
  return { khoaMayChu, daCauHinh: Boolean(khoaMayChu) };
}

/** Nhà cung cấp nào cũng chỉ có ba kết cục. Gom lại để hai đường không lệch nhau. */
function docKetQua(kq, biMat) {
  if (kq?.status === 404 || kq?.status === 410) {
    return { trangThai: TRANG_THAI_GUI.het_han_dang_ky, chiTiet: String(kq.status) };
  }
  if (typeof kq?.loi === 'string' && TOKEN_DA_CHET.includes(kq.loi)) {
    return { trangThai: TRANG_THAI_GUI.het_han_dang_ky, chiTiet: kq.loi };
  }
  if (kq?.ok) return { trangThai: TRANG_THAI_GUI.da_day_di, chiTiet: null };
  return {
    trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc,
    chiTiet: boChe(String(kq?.loi ?? kq?.status ?? 'khong_ro'), biMat),
  };
}

/**
 * @param {object} opts.guiThat  điểm cắm nhà cung cấp push. Không có thì KHÔNG
 *                               giả lập thành công.
 * @returns {Promise<{trangThai:string, chiTiet:string|null}>}
 */
async function guiCanhBao({ dangKy, payload, env, guiThat, guiThatNative } = {}) {
  // ⚠️ Rẽ nhánh TRƯỚC khi chuẩn hoá. Token FCM không đi lọt khuôn Web Push, và
  // nếu để nó rơi vào nhánh dưới thì lỗi trông y hệt "đăng ký hỏng" — đó chính
  // là cách bản APK hỏng im lặng.
  if (dangKy?.loai === LOAI_DANG_KY.native) {
    return guiCanhBaoNative({ dangKy, payload, env, guiThatNative });
  }

  const vapid = layCauHinhVapid(env);
  if (!vapid.daCauHinh || typeof guiThat !== 'function') {
    // §9.4 — KHÔNG giả vờ đã gửi. Người dùng phải biết cảnh báo chưa đi.
    return { trangThai: TRANG_THAI_GUI.chua_cau_hinh, chiTiet: null };
  }

  let dk;
  try { dk = chuanHoaDangKy(dangKy); } catch (e) {
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: e.ma };
  }

  try {
    const kq = await guiThat({ dangKy: dk, payload, vapid });
    return docKetQua(kq, dk.endpoint);
  } catch (e) {
    // §6.7 — giữ nguyên nhân gốc cho log, câu người dùng thấy vẫn sạch.
    // §6.9 — nhưng che endpoint: lỗi nhà cung cấp hay nhét nguyên đăng ký vào.
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: boChe(e.message, dk.endpoint) };
  }
}

/** Đường APK — FCM. Mọi bảo đảm §9.4 / §6.9 giống hệt đường web. */
async function guiCanhBaoNative({ dangKy, payload, env, guiThatNative } = {}) {
  const fcm = layCauHinhFcm(env);
  if (!fcm.daCauHinh || typeof guiThatNative !== 'function') {
    return { trangThai: TRANG_THAI_GUI.chua_cau_hinh, chiTiet: null };
  }

  let dk;
  try { dk = chuanHoaDangKyNative(dangKy); } catch (e) {
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: e.ma };
  }

  try {
    const kq = await guiThatNative({ dangKy: dk, payload, fcm });
    return docKetQua(kq, dk.token);
  } catch (e) {
    return { trangThai: TRANG_THAI_GUI.khong_xac_nhan_duoc, chiTiet: boChe(e.message, dk.token) };
  }
}

/**
 * §9.4 — chuyển trạng thái kỹ thuật thành MÃ NGƯỜI DÙNG ĐỌC.
 * ⚠️ Chỉ có BA đích đến. Không có đích nào tên "đã đọc" hay "đã hiểu".
 */
function maHienThi(trangThai, coSuKienMo = false) {
  if (coSuKienMo) return 'nguoi_than_da_mo_canh_bao';
  if (trangThai === TRANG_THAI_GUI.da_day_di) return 'da_day_canh_bao_di';
  return 'khong_xac_nhan_duoc_canh_bao_da_toi_may_nguoi_than';
}

module.exports = {
  guiCanhBao, chuanHoaDangKy, layCauHinhVapid, maHienThi, TRANG_THAI_GUI,
  chuanHoaDangKyNative, layCauHinhFcm, LOAI_DANG_KY,
};
