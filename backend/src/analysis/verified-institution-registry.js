'use strict';
/**
 * §2B.5 · §6.11 — SỔ ĐĂNG KÝ TỔ CHỨC ĐÃ XÁC MINH.
 *
 * ⚠️ ĐÂY LÀ MODULE NGUY HIỂM NHẤT TRONG BACKEND.
 * §2B.5: "Một số sai đẩy nạn nhân tới ĐÚNG KẺ LỪA ĐẢO — đây là kịch bản hỏng tệ
 * nhất." Một hotline bịa còn tệ hơn không có hotline nào.
 *
 * Ba luật, không được nới:
 *  1. **AI KHÔNG ĐƯỢC TỰ TẠO MỤC NÀO** (§2B.5). Mọi mục phải do người duyệt.
 *  2. **KHÔNG lấy số từ nội dung người dùng gửi lên** (§2B.5). Kẻ lừa đảo gửi số
 *     của chính nó vào rồi app hiển thị lại như "tổng đài chính thức" là xong.
 *  3. Mục chưa duyệt thì **KHÔNG ĐƯỢC TRẢ RA** như đã xác minh. Thà không có số
 *     còn hơn có số sai.
 *
 * §6.11: xác minh độc lập — KHÔNG gọi lại số vừa gọi, KHÔNG bấm link vừa nhận.
 */

const fs = require('node:fs');
const path = require('node:path');

const DUONG_MAC_DINH = path.join(__dirname, '..', '..', '..', 'public', 'config', 'support-directory.json');

const TRUONG_BAT_BUOC = [
  'id', 'countryCode', 'type', 'canonicalName',
  'officialDomains', 'officialPhoneNumbers', 'sourceUrl', 'verifiedAt', 'reviewStatus',
];

const TRANG_THAI_DUOC_HIEN = new Set(['approved']);

/** Một mục chỉ hợp lệ khi ĐỦ trường VÀ có nguồn VÀ có ngày xác minh. */
function mucHopLe(m) {
  const thieu = TRUONG_BAT_BUOC.filter((t) => m?.[t] === undefined || m[t] === null);
  if (thieu.length) return { hopLe: false, lyDo: `thiếu ${thieu.join(',')}` };
  if (!Array.isArray(m.officialPhoneNumbers) || !Array.isArray(m.officialDomains)) {
    return { hopLe: false, lyDo: 'officialPhoneNumbers/officialDomains phải là mảng' };
  }
  if (typeof m.sourceUrl !== 'string' || !/^https?:\/\//.test(m.sourceUrl)) {
    return { hopLe: false, lyDo: 'sourceUrl phải là URL http(s) — số không nguồn thì không dùng được' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.verifiedAt)) {
    return { hopLe: false, lyDo: 'verifiedAt phải dạng YYYY-MM-DD' };
  }
  return { hopLe: true, lyDo: null };
}

function nap(duong = DUONG_MAC_DINH) {
  let tho;
  try {
    tho = JSON.parse(fs.readFileSync(duong, 'utf8'));
  } catch {
    // Không có tệp / tệp hỏng ⇒ sổ RỖNG. KHÔNG bịa mục nào để lấp chỗ trống.
    return { muc: [], loai: [], ghiChu: 'khong_doc_duoc_tep' };
  }
  const vao = Array.isArray(tho?.institutions) ? tho.institutions : [];
  const muc = [];
  const loai = [];
  for (const m of vao) {
    const kt = mucHopLe(m);
    if (!kt.hopLe) { loai.push({ id: m?.id ?? '(không có id)', lyDo: kt.lyDo }); continue; }
    if (!TRANG_THAI_DUOC_HIEN.has(m.reviewStatus)) {
      loai.push({ id: m.id, lyDo: `reviewStatus="${m.reviewStatus}" chưa được duyệt` });
      continue;
    }
    muc.push(Object.freeze({ ...m, aliases: m.aliases || [] }));
  }
  return { muc, loai, ghiChu: null };
}

/**
 * @returns {Array} CHỈ các mục đã duyệt. Rỗng là câu trả lời hợp lệ và trung thực.
 */
const layDanhBa = (duong) => nap(duong).muc;

/** Tra theo mã nước; không có thì trả rỗng, KHÔNG rơi về nước khác. */
const theoNuoc = (countryCode, duong) => layDanhBa(duong)
  .filter((m) => m.countryCode === countryCode);

/**
 * §6.11 — số này CÓ nằm trong sổ đã xác minh không?
 * Dùng để phân biệt "người dùng TỰ GỌI tới số đã xác minh" (C.4 cho phép tắt
 * MAN_KEEP_CALL_ACTIVE) với "một cuộc gọi ĐẾN" (không được tắt).
 */
function laSoDaXacMinh(soDienThoai, duong) {
  if (typeof soDienThoai !== 'string') return false;
  const chuan = soDienThoai.replace(/[^\d+]/g, '');
  if (!chuan) return false;
  return layDanhBa(duong).some((m) => m.officialPhoneNumbers
    .some((s) => String(s).replace(/[^\d+]/g, '') === chuan));
}

/**
 * ⚠️ §2B.5 — AI KHÔNG ĐƯỢC TỰ TẠO MỤC NÀO.
 * Hàm này tồn tại để TỪ CHỐI, và để chỗ từ chối có tên gọi rõ ràng trong code.
 */
function themMucTuAi() {
  throw new Error(
    '§2B.5: AI không được tự tạo mục nào trong Verified Institution Registry. '
    + 'Mục mới phải do người duyệt, kèm sourceUrl và verifiedAt.',
  );
}

/** Trạng thái để /transparency và UI nói THẬT về việc danh bạ có dùng được không. */
function trangThaiDanhBa(duong) {
  const { muc, loai, ghiChu } = nap(duong);
  return {
    soMucDaDuyet: muc.length,
    soMucBiLoai: loai.length,
    lyDoLoai: loai,
    // Rỗng ⇒ UI phải nói "chưa có số nào được xác minh", KHÔNG hiện danh sách trống
    // như thể đã tra xong.
    dungDuoc: muc.length > 0,
    ghiChu,
  };
}

module.exports = {
  layDanhBa, theoNuoc, laSoDaXacMinh, trangThaiDanhBa,
  mucHopLe, themMucTuAi, TRUONG_BAT_BUOC, DUONG_MAC_DINH,
};
