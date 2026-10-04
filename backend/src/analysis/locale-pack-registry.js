'use strict';
/**
 * §5.3 — map locale → pack; fallback en-US; KHÔNG đổi scoring.
 *
 * Registry này chỉ TRA CỨU. Nó không được đụng vào trọng số, ngưỡng hay
 * ngữ nghĩa critical override — đó là việc của decision-engine (§6.14 parity:
 * KHÔNG tạo "English Rule Engine" và "Vietnamese Rule Engine").
 *
 * ══ TỪ VỰNG ĐỘNG (3/10/2026) — xem `../tu-vung-dong.js` ══
 * Mẫu do NGƯỜI đã duyệt được CỘNG THÊM vào cuối `directPatterns` của một tín hiệu đã có.
 * Chỉ cộng, không bớt: mẫu gốc đứng trước, không thay, không xoá, không đụng
 * `suppressors`. Chưa có mục nào ⇒ trả đúng đối tượng gốc (cùng tham chiếu).
 */

const PACKS = {
  'en-US': require('./locale-packs/en-US'),
  'vi-VN': require('./locale-packs/vi-VN'),
};

const MAP_NGON_NGU = { en: 'en-US', vi: 'vi-VN' };

/** { 'vi-VN': { TIN_HIEU: [{pattern, scope, ...}] } } — chỉ đặt qua `datTuVungDong`. */
let dong = {};
const dem = new Map();   // ten → gói đã hợp (xoá mỗi lần đặt lại)

function datTuVungDong(ten, theoTinHieu) {
  if (!PACKS[ten]) return;
  const goc = PACKS[ten].directPatterns || {};
  const sach = {};
  for (const [id, ds] of Object.entries(theoTinHieu || {})) {
    if (!Array.isArray(goc[id]) || !ds.length) continue;      // chỉ tín hiệu ĐÃ CÓ trong gói gốc
    sach[id] = ds.map((m) => ({ pattern: m.pattern, scope: m.scope || 'khong_canh_bao', nguon: 'tu_vung_dong', idUngVien: m.idUngVien }));
  }
  dong = { ...dong, [ten]: sach };
  dem.clear();
}

const soMucDong = (ten) => Object.values(dong[ten] || {}).reduce((n, a) => n + a.length, 0);

function hop(ten) {
  const goc = PACKS[ten];
  if (!goc) return null;
  const them = dong[ten];
  if (!them || !Object.keys(them).length) return goc;
  if (dem.has(ten)) return dem.get(ten);
  const directPatterns = { ...goc.directPatterns };
  for (const [id, ds] of Object.entries(them)) directPatterns[id] = [...goc.directPatterns[id], ...ds];
  const ra = { ...goc, directPatterns };
  dem.set(ten, ra);
  return ra;
}

const layPack = (ten) => hop(ten);

/** Fallback en-US theo §5.3. Ngôn ngữ lạ vẫn phải chạy được, không im lặng. */
const packTheoNgonNgu = (lang) => hop(MAP_NGON_NGU[lang]) || hop('en-US');

const danhSachPack = () => Object.keys(PACKS);

module.exports = { layPack, packTheoNgonNgu, danhSachPack, PACKS, datTuVungDong, soMucDong };
