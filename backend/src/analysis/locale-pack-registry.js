'use strict';
/**
 * §5.3 — map locale → pack; fallback en-US; KHÔNG đổi scoring.
 *
 * Registry này chỉ TRA CỨU. Nó không được đụng vào trọng số, ngưỡng hay
 * ngữ nghĩa critical override — đó là việc của decision-engine (§6.14 parity:
 * KHÔNG tạo "English Rule Engine" và "Vietnamese Rule Engine").
 */

const PACKS = {
  'en-US': require('./locale-packs/en-US'),
  'vi-VN': require('./locale-packs/vi-VN'),
};

const MAP_NGON_NGU = { en: 'en-US', vi: 'vi-VN' };

const layPack = (ten) => PACKS[ten] || null;

/** Fallback en-US theo §5.3. Ngôn ngữ lạ vẫn phải chạy được, không im lặng. */
const packTheoNgonNgu = (lang) => PACKS[MAP_NGON_NGU[lang]] || PACKS['en-US'];

const danhSachPack = () => Object.keys(PACKS);

module.exports = { layPack, packTheoNgonNgu, danhSachPack, PACKS };
