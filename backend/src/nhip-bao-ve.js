'use strict';
/**
 * ══════ "MÁY BỐ MẸ CÒN ĐƯỢC BẢO VỆ KHÔNG?" — nhịp báo về (23/9/2026) ══════
 *
 * Lỗi âm thầm cần chặn: hãng máy (Xiaomi, Oppo…) giết dịch vụ nền, hoặc bác lỡ tắt
 * một quyền — phần tự bật ngừng chạy mà cả nhà vẫn tưởng đang chạy. Đó đúng là
 * §4.3: "không kiểm được" trông y hệt "đã kiểm, không thấy gì".
 *
 * Máy bố mẹ báo về trạng thái BẬT/TẮT của ba quyền, lúc mở app và từ dịch vụ nền
 * mỗi 6 giờ. Máy con thấy "báo về lúc 9:12" hoặc "2 ngày chưa báo về".
 *
 * ⚠️ §12 — ĐÂY LÀ LUỒNG DỮ LIỆU MỚI, NGƯỜI DÙNG ĐÃ QUYẾT 23/9/2026, và:
 *   · MẶC ĐỊNH TẮT: chỉ nhận khi chính bác bật `choConXemBaoVe` (quy tắc báo);
 *   · bác tắt ⇒ XOÁ bản đã lưu, không giữ lại;
 *   · chỉ lưu BẢN MỚI NHẤT, không lưu lịch sử;
 *   · chỉ MÃ và bool — KHÔNG nội dung tin, KHÔNG vị trí, KHÔNG pin, KHÔNG danh sách app.
 * ⚠️ §4.3 — máy chủ không bao giờ tự suy "đang được bảo vệ". Nó trả nguyên bản ghi
 *   và mốc giờ; giao diện của con nói "báo về lúc…" hoặc "N ngày chưa báo về".
 */
const QT = require('./quy-tac-bao');

const BANG = 'nhip_bao_ve';
const NGUON = Object.freeze(['mo_app', 'dich_vu_nen']);
const QUYEN = Object.freeze(['docThongBao', 'theoDoiCuocGoi', 'hienTrenApp']);

class LoiNhip extends Error {
  constructor(ma, http = 400) { super(ma); this.name = 'LoiNhip'; this.ma = ma; this.http = http; }
}

/** Nhận ĐÚNG hình dạng này, không thêm trường nào — thêm được là rò được. */
function chuanHoa(vao) {
  if (!vao || typeof vao !== 'object' || Array.isArray(vao)) throw new LoiNhip('NHIP_KHONG_HOP_LE');
  for (const k of Object.keys(vao)) if (!['nguon', 'laApk', 'quyen'].includes(k)) throw new LoiNhip('NHIP_KHONG_HOP_LE');
  if (!NGUON.includes(vao.nguon) || typeof vao.laApk !== 'boolean') throw new LoiNhip('NHIP_KHONG_HOP_LE');
  const q = vao.quyen;
  if (!q || typeof q !== 'object' || Array.isArray(q)) throw new LoiNhip('NHIP_KHONG_HOP_LE');
  const quyen = {};
  for (const k of Object.keys(q)) {
    if (!QUYEN.includes(k)) throw new LoiNhip('NHIP_KHONG_HOP_LE');
    if (q[k] !== true && q[k] !== false && q[k] !== null) throw new LoiNhip('NHIP_KHONG_HOP_LE');
    quyen[k] = q[k];
  }
  for (const k of QUYEN) if (!(k in quyen)) quyen[k] = null;
  return { nguon: vao.nguon, laApk: vao.laApk, quyen };
}

async function xoaNhip(kho, taiKhoanId) {
  if (typeof kho.xoa === 'function') await kho.xoa(BANG, taiKhoanId);
  else await kho.luu(BANG, taiKhoanId, null);
}

/** Máy bố mẹ báo về. Chưa bật cho con xem ⇒ không lưu gì, và xoá bản cũ nếu còn. */
async function ghiNhip(kho, taiKhoanId, vao, bayGio = Date.now()) {
  const qt = await QT.docQuyTac(kho, taiKhoanId);
  if (!qt.choConXemBaoVe) {
    await xoaNhip(kho, taiKhoanId);
    return { ghi: false, lyDo: 'CHUA_BAT' };
  }
  const nhip = chuanHoa(vao);
  await kho.luu(BANG, taiKhoanId, { ...nhip, luc: bayGio });
  return { ghi: true };
}

/** Máy con: trạng thái của từng bố mẹ đã ghép với mình. */
async function docNhipBoMe(kho, conId, { capGhep, layHoSo }) {
  const { chuTaiKhoan } = await capGhep(conId);
  const ra = [];
  for (const bm of chuTaiKhoan) {
    const tenBoMe = (await layHoSo(kho, bm.id))?.ten || '';
    const qt = await QT.docQuyTac(kho, bm.id);
    if (!qt.choConXemBaoVe) { ra.push({ tenBoMe, choXem: false, nhip: null }); continue; }
    const ban = await kho.doc(BANG, bm.id);
    ra.push({
      tenBoMe,
      choXem: true,
      nhip: ban && ban.luc ? { luc: ban.luc, nguon: ban.nguon, laApk: ban.laApk, quyen: ban.quyen } : null,
    });
  }
  return { boMe: ra };
}

module.exports = { BANG, NGUON, QUYEN, LoiNhip, chuanHoa, ghiNhip, xoaNhip, docNhipBoMe };
