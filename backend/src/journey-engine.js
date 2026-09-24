'use strict';
/**
 * §6.11 — BỘ NHỚ VỤ VIỆC. §2B.2 bước 20 — hành trình 8 giai đoạn.
 *
 * Ba ràng buộc §6.11, không được nới:
 *  1. "Ghép vào hồ sơ đang mở nếu trùng ÍT NHẤT MỘT thực thể trong cửa sổ 14 ngày.
 *     Đây là hàm so khớp XÁC ĐỊNH, có unit test, KHÔNG DO AI QUYẾT ĐỊNH."
 *  2. "HỎI LẠI NGƯỜI DÙNG TRƯỚC KHI GỘP."
 *  3. "Tín hiệu nhóm CASE_* CHỈ được tính SAU KHI người dùng xác nhận gộp."
 *     (Phụ lục A.8 nhắc lại y hệt.)
 *
 * Hàm thuần: thời điểm truyền vào qua tham số `bayGio`, không đọc đồng hồ hệ thống.
 * Đọc đồng hồ bên trong sẽ làm hàm không test được và không tái lập được.
 */

const { trichThucThe, thucTheTrung } = require('./analysis/entity-extractor');

const CUA_SO_GOP_MS = 14 * 24 * 60 * 60 * 1000;   // §6.11 — 14 ngày

/** §2B.2 bước 20 — tám giai đoạn của một vụ việc. */
const GIAI_DOAN = Object.freeze([
  'tiep_can',        // kẻ lừa đảo chạm lần đầu
  'tao_long_tin',    // tự xưng danh tính, dựng câu chuyện
  'gay_ap_luc',      // doạ, thúc thời gian
  'co_lap',          // đòi giữ bí mật, tách khỏi gia đình
  'doi_hanh_dong',   // đòi chuyển tiền / mã / thiết bị
  'da_thuc_hien',    // nạn nhân đã làm theo
  'moc_them',        // quay lại đòi tiếp, hoặc giả danh hỗ trợ lấy lại tiền
  'phuc_hoi',        // đang xử lý hậu quả
]);

/** Ánh xạ TĨNH tín hiệu → giai đoạn. Không suy đoán, không AI. */
const TIN_HIEU_GIAI_DOAN = [
  ['phuc_hoi', ['FIN_RECOVERY_FEE', 'ID_RECOVERY_SUPPORT_IMPERSONATION']],
  ['doi_hanh_dong', ['FIN_TRANSFER_REQUEST', 'FIN_SAFE_ACCOUNT', 'CRED_OTP_SHARE',
    'CRED_BANK_LOGIN', 'DEV_REMOTE_CONTROL_APP', 'DEV_INSTALL_APK_UNKNOWN',
    'DEV_SCREEN_SHARE_BANKING', 'FIN_CASH_COURIER', 'FIN_GIFT_CARD_PAYMENT']],
  ['co_lap', ['MAN_SECRECY', 'MAN_ISOLATION']],
  ['gay_ap_luc', ['MAN_FEAR_THREAT', 'MAN_URGENCY', 'MAN_EXTORTION_MEDIA_THREAT']],
  ['tao_long_tin', ['ID_AUTHORITY_IMPERSONATION', 'ID_BANK_IMPERSONATION',
    'ID_FAMILY_IMPERSONATION', 'ID_TECH_SUPPORT_IMPERSONATION',
    'ID_TAX_BENEFIT_IMPERSONATION', 'ID_KHOAN_DA_IMPERSONATION', 'MAN_COVER_STORY']],
];

function suyGiaiDoan(maLyDo = [], { daMatTien = false } = {}) {
  if (daMatTien) return 'phuc_hoi';
  const tap = new Set(maLyDo);
  for (const [gd, ids] of TIN_HIEU_GIAI_DOAN) {
    if (ids.some((id) => tap.has(id))) return gd;
  }
  return 'tiep_can';
}

/**
 * §6.11 — TÌM hồ sơ có thể gộp. KHÔNG tự gộp.
 * @returns {{hoSo:object, thucTheTrung:Array}|null} — null nghĩa là không có ứng viên.
 */
function timHoSoCoTheGop(suKienMoi, hoSoDangMo = [], bayGio) {
  const tMoi = typeof bayGio === 'number' ? bayGio : suKienMoi.thoiDiem;
  let totNhat = null;

  for (const hs of hoSoDangMo) {
    if (hs.dong) continue;
    const capNhat = hs.capNhatLuc ?? 0;
    if (tMoi - capNhat > CUA_SO_GOP_MS) continue;   // ngoài cửa sổ 14 ngày
    const trung = thucTheTrung(suKienMoi.thucThe, hs.thucThe || {});
    if (trung.length === 0) continue;              // §6.11 — cần ÍT NHẤT MỘT thực thể
    if (!totNhat || trung.length > totNhat.thucTheTrung.length) {
      totNhat = { hoSo: hs, thucTheTrung: trung };
    }
  }
  return totNhat;
}

/**
 * §6.11 — hỏi lại người dùng trước khi gộp.
 * @returns {{canHoi:boolean, maCauHoi:string|null, hoSoUngVien:string|null, viSao:Array}}
 */
function dungCauHoiGop(ungVien) {
  if (!ungVien) return { canHoi: false, maCauHoi: null, hoSoUngVien: null, viSao: [] };
  return {
    canHoi: true,
    maCauHoi: 'co_lien_quan_den_vu_truoc_khong',   // frontend tra catalog i18n
    hoSoUngVien: ungVien.hoSo.id,
    viSao: ungVien.thucTheTrung,
  };
}

/**
 * ⚠️ Phụ lục A.8 + §6.11 — CASE_* CHỈ được tính SAU KHI người dùng xác nhận gộp.
 * Sinh tín hiệu trước khi có xác nhận là tự cộng điểm cho một liên hệ mà người
 * dùng chưa hề công nhận.
 *
 * @param {object} hoSo      hồ sơ ĐÃ được người dùng xác nhận gộp
 * @param {object} suKienMoi sự kiện đang xét
 */
function tinHieuCase(hoSo, suKienMoi, { daXacNhanGop } = {}) {
  if (!daXacNhanGop) return [];
  if (!hoSo || !Array.isArray(hoSo.suKien) || hoSo.suKien.length === 0) return [];

  const ra = [];
  const them = (id, quote) => ra.push({
    id, state: 'present', source: 'deterministic-context', confidence: 1.0,
    evidence: [{ quote, start: 0, end: String(quote).length, sourceId: 'ho_so_vu_viec' }],
  });

  const kenhCu = new Set(hoSo.suKien.map((s) => s.kenh).filter(Boolean));
  if (suKienMoi.kenh && kenhCu.size > 0 && !kenhCu.has(suKienMoi.kenh)) {
    them('CASE_MULTI_CHANNEL_ESCALATION',
      `${[...kenhCu].join(',')} → ${suKienMoi.kenh}`);
  }

  const bacCu = Math.max(...hoSo.suKien.map((s) => GIAI_DOAN.indexOf(s.giaiDoan)).filter((i) => i >= 0), -1);
  const bacMoi = GIAI_DOAN.indexOf(suKienMoi.giaiDoan);
  if (bacMoi > bacCu && bacCu >= 0) {
    them('CASE_STAGE_ESCALATION', `${GIAI_DOAN[bacCu]} → ${GIAI_DOAN[bacMoi]}`);
  }

  if (hoSo.suKien.length >= 2) {
    them('CASE_REPEATED_CONTACT', `${hoSo.suKien.length + 1} lần liên hệ`);
  }

  return ra;
}

/**
 * ══════ MANG THEO DẤU HIỆU CỦA CÁC TIN TRƯỚC — thêm 24/9/2026 ══════
 *
 * CASE_* chỉ nói "vụ này đang leo thang" — tối đa 12 điểm, cộng tổ hợp 8. Không
 * đủ cho đúng ca mà bộ nhớ vụ việc sinh ra để bắt:
 *   hôm qua  "Tôi là công an, bác liên quan vụ án rửa tiền"   → ID + doạ, 22 điểm
 *   hôm nay  "Bác chuyển 50 triệu vào tài khoản này"          → 14 điểm, CHƯA THẤY
 * Tách riêng từng tin thì không tin nào đủ; gộp lại là kịch bản giả danh công an
 * trọn vẹn. Nên khi người dùng ĐÃ XÁC NHẬN hai tin là một vụ, dấu hiệu của các tin
 * trước được xét cùng tin này — đi qua ĐÚNG bộ luật, không cộng điểm riêng.
 *
 * ⚠️ CHỈ MÃ, KHÔNG NỘI DUNG (§6.9). Hồ sơ nằm trên máy người dùng; máy chủ chỉ
 * thấy mã tín hiệu và thực thể đã trích, không lưu lại.
 * ⚠️ KHÔNG mang theo CASE_* của tin trước — chúng được tính lại cho tin này.
 */
function tinHieuMangTheo(hoSo, maHienTai = [], { daXacNhanGop } = {}) {
  if (!daXacNhanGop) return [];
  const ma = new Set(maHienTai);
  for (const s of (hoSo?.suKien || [])) for (const m of (s.maLyDo || [])) ma.add(m);
  return [...ma]
    .filter((m) => typeof m === 'string' && !m.startsWith('CASE_'))
    .map((m) => ({
      id: m, state: 'present', source: 'case_memory', confidence: 1.0,
      evidence: [{ quote: `tin_truoc:${m}`, start: 0, end: 0, sourceId: 'ho_so_vu_viec' }],
    }));
}

/**
 * Hồ sơ do MÁY NGƯỜI DÙNG gửi lên — không tin, lọc lại. Chỉ giữ trường cần cho
 * phép so khớp và giai đoạn; mã lạ bị bỏ; giới hạn kích thước để một hồ sơ phình
 * to không thành đường làm chậm máy chủ.
 */
function locHoSo(hoSo, laMaHopLe = () => true) {
  if (!hoSo || typeof hoSo !== 'object') return null;
  const suKien = (Array.isArray(hoSo.suKien) ? hoSo.suKien : []).slice(-30).map((s) => ({
    thoiDiem: Number.isFinite(s?.thoiDiem) ? s.thoiDiem : 0,
    kenh: typeof s?.kenh === 'string' ? s.kenh.slice(0, 20) : null,
    giaiDoan: GIAI_DOAN.includes(s?.giaiDoan) ? s.giaiDoan : 'tiep_can',
    maLyDo: (Array.isArray(s?.maLyDo) ? s.maLyDo : []).filter((m) => typeof m === 'string' && laMaHopLe(m)).slice(0, 40),
  }));
  return {
    id: typeof hoSo.id === 'string' ? hoSo.id.slice(0, 64) : null,
    capNhatLuc: Number.isFinite(hoSo.capNhatLuc) ? hoSo.capNhatLuc : 0,
    thucThe: hoSo.thucThe && typeof hoSo.thucThe === 'object' ? hoSo.thucThe : {},
    dong: hoSo.dong === true,
    suKien,
  };
}

/** Sự kiện mới từ một lượt phân tích. `thoiDiem` truyền vào, không tự đọc đồng hồ. */
function taoSuKien({ vanBan, envelope, kenh = null, thoiDiem, daMatTien = false }) {
  return {
    thoiDiem,
    kenh,
    thucThe: trichThucThe(vanBan),
    nhan: envelope?.nhan ?? null,
    maLyDo: envelope?.maLyDo ?? [],
    giaiDoan: suyGiaiDoan(envelope?.maLyDo ?? [], { daMatTien }),
  };
}

/**
 * §6.11 — hiển thị rõ BA LỚP: biết chắc · nghi ngờ · cần xác minh thêm.
 * Trả về MÃ, frontend tra catalog.
 */
function baLop(hoSo, envelope) {
  return {
    bietChac: [
      ...(hoSo?.suKien?.length ? [`so_lan_lien_he:${hoSo.suKien.length}`] : []),
      ...(envelope?.daKiem || []).map((n) => `da_doc_duoc:${n}`),
      ...(envelope?.overrides || []).map((o) => `quy_tac_khan_cap:${o}`),
    ],
    nghiNgo: (envelope?.maLyDo || []).map((m) => `dau_hieu:${m}`),
    canXacMinhThem: (envelope?.chuaKiem || []).map((m) => `chua_kiem:${m}`),
  };
}

module.exports = {
  GIAI_DOAN, CUA_SO_GOP_MS,
  suyGiaiDoan, timHoSoCoTheGop, dungCauHoiGop, tinHieuCase, taoSuKien, baLop,
  tinHieuMangTheo, locHoSo,
};
