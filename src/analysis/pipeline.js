'use strict';
/**
 * §6.1 — THỨ TỰ PIPELINE, KHÔNG ĐƯỢC ĐẢO.
 * §4.3 — SÀN ĐẦU VÀO KHÔNG ĐỌC ĐƯỢC: unreadableInputFloor().
 * §HĐ  — hợp đồng backend ↔ frontend: toHopDong().
 *
 * §4.2: AI chỉ bật cờ. File này KHÔNG quyết định mức — decision-engine mới quyết.
 * §5.4: file này không import provider SDK.
 */

const { buildContext } = require('./context-builder');
const { directPrecheck } = require('./direct-precheck');
const { decide } = require('./decision-engine');
const { evaluateOverrides } = require('./critical-overrides');
const { locTheoEvidence, locTheoScopeChiTiet } = require('./evidence-validator');
const { phanTichUrl, trichUrl } = require('./url-analyzer');
const { laTinHieu } = require('./signal-registry');
const { nhanHopDong } = require('../risk-labels');
const { chonMuc } = require('../intervention-ladder');

const GIOI_HAN_VAN_BAN = 5000;      // §6.10
const NGUONG_CHAP_NHAN_LLM = 0.72;  // §6.4 — 0.55–0.71 → unknown; < 0.55 → drop
const NGUONG_OCR = 0.5;

/**
 * §4.3 — "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ".
 *
 * Ảnh không đọc được vì AI chết, tên miền không phân giải được, bộ eval hỏng —
 * cả ba đều từng hiện ra "Chưa thấy dấu hiệu rủi ro". Sàn này chặn điều đó.
 *
 * ⚠️ THÊM NGUỒN ĐẦU VÀO MỚI NÀO (video, ghi âm, tệp khác) THÌ THÊM CA VÀO ĐÂY.
 */
function unreadableInputFloor(input = {}) {
  const daKiem = [];
  const chuaKiem = [];

  if (typeof input.vanBan === 'string' && input.vanBan.trim()) {
    if (input.vanBan.length > GIOI_HAN_VAN_BAN) chuaKiem.push('noi_dung_qua_dai');
    else daKiem.push('van_ban');
  }

  if (input.anh) {
    const hong = input.ocrFailed === true
      || (typeof input.ocrConfidence === 'number' && input.ocrConfidence < NGUONG_OCR);
    if (hong) chuaKiem.push('khong_doc_duoc_anh');
    else daKiem.push('anh_ocr');
  }

  if (input.ghiAm) {
    if (input.ghiAmFailed === true) chuaKiem.push('khong_nghe_duoc_ghi_am');
    else daKiem.push('ghi_am');
  }

  if (Array.isArray(input.urlUnresolved) && input.urlUnresolved.length > 0) {
    chuaKiem.push('khong_mo_duoc_link');
  } else if (Array.isArray(input.url) && input.url.length > 0) {
    daKiem.push('url');
  }

  if (input.aiError) chuaKiem.push('ai_khong_phan_hoi');

  return { daKiem, chuaKiem };
}

/**
 * §6.4 — chỉ nhận `present` khi confidence ≥ 0.72 VÀ evidence hợp lệ.
 * Lược đồ CẤM `riskScore` / `riskLabel` / `critical` / `interventionLevel` / `safe`
 * — ở đây chúng bị BỎ QUA hoàn toàn, model không có đường nào tự quyết mức.
 */
function nhanTinHieuLLM(llmSignals = []) {
  const ra = [];
  for (const s of llmSignals) {
    if (!s || !laTinHieu(s.id)) continue;
    if (!Array.isArray(s.evidence) || s.evidence.length === 0) continue;
    const c = typeof s.confidence === 'number' ? s.confidence : 0;
    if (c < 0.55) continue;                              // drop
    const state = (s.state === 'present' && c >= NGUONG_CHAP_NHAN_LLM)
      ? 'present' : 'unknown';                           // 0.55–0.71 → unknown
    ra.push({
      id: s.id,
      state,
      source: 'llm',
      confidence: c,
      evidence: s.evidence.slice(0, 3),
    });
  }
  return ra;
}

/** §6.1 bước 8 — merge theo ID, direct thắng, provenance giữ nguyên. */
function ghepTinHieu(direct, llm) {
  const theoId = new Map();
  for (const s of llm) theoId.set(s.id, s);
  for (const s of direct) theoId.set(s.id, s);   // direct ghi đè: confidence 1.0
  return [...theoId.values()];
}

/** Bảng TĨNH: tín hiệu danh tính → họ kịch bản, để tra mẫu "Nói gì với bố mẹ". */
const HO_KICH_BAN = [
  ['ID_AUTHORITY_IMPERSONATION', 'gia_danh_cong_an'],
  ['ID_TAX_BENEFIT_IMPERSONATION', 'gia_danh_co_quan_thue'],
  ['ID_BANK_IMPERSONATION', 'gia_danh_ngan_hang'],
  ['ID_TECH_SUPPORT_IMPERSONATION', 'gia_danh_ho_tro_ky_thuat'],
  ['ID_RECOVERY_SUPPORT_IMPERSONATION', 'gia_danh_ho_tro_lay_lai_tien'],
  ['ID_FAMILY_IMPERSONATION', 'gia_danh_nguoi_than'],
  ['ID_FAMILY_EMERGENCY_THIRD_PARTY', 'bao_tin_nguoi_than_gap_nan'],
  ['ID_CONTACT_ACCOUNT_TAKEOVER', 'tai_khoan_nguoi_than_bi_chiem'],
  ['ID_DELIVERY_IMPERSONATION', 'gia_danh_giao_hang'],
  ['ID_UTILITY_IMPERSONATION', 'gia_danh_dich_vu_thiet_yeu'],
  ['ID_EMPLOYER_JOB_IMPERSONATION', 'gia_danh_tuyen_dung'],
  ['FIN_RECOVERY_FEE', 'lua_lay_lai_tien'],
  ['DEV_REMOTE_CONTROL_APP', 'chiem_quyen_thiet_bi'],
  ['DEV_INSTALL_APK_UNKNOWN', 'chiem_quyen_thiet_bi'],
  ['DEV_SCREEN_SHARE_BANKING', 'chiem_quyen_thiet_bi'],
  ['OFF_INVESTMENT_GUARANTEE', 'du_dau_tu_loi_nhuan_cao'],
  ['OFF_ROMANCE_EMERGENCY', 'lua_tinh_cam'],
];

function chonHoKichBan(ids) {
  const tap = new Set(ids);
  for (const [id, ho] of HO_KICH_BAN) if (tap.has(id)) return ho;
  return null;
}

/**
 * §HĐ luật 4 — canThiep quyết định MÀN HÌNH, nhan quyết định NHÃN.
 * Không suy cái này từ cái kia.
 *
 * §6.2 — PROTECTED_CRITICAL CHỈ đến từ critical override, không bao giờ từ điểm số.
 */
const chonCanThiep = chonMuc;   // một nguồn sự thật duy nhất: intervention-ladder

function analyze(input = {}) {
  const quaDai = typeof input.vanBan === 'string' && input.vanBan.length > GIOI_HAN_VAN_BAN;
  const vanBan = quaDai ? '' : (input.vanBan || '');

  // §6.1 bước 3 — có URL thì phân tích DETERMINISTIC. KHÔNG tự mở link.
  const urlList = trichUrl(vanBan);
  const san = unreadableInputFloor({ ...input, url: urlList });

  const ctx = buildContext(vanBan, { sourceId: 'van_ban' });
  const direct = directPrecheck(ctx, {
    verifiedChannel: input.verifiedChannel === true,
    verifiedRelationship: input.verifiedRelationship === true,
  });
  const web = phanTichUrl(vanBan);

  const aiDaChay = Array.isArray(input.llmSignals) && input.llmSignals.length > 0 && !input.aiError;
  // §6.1 bước 7 — validate evidence TRƯỚC khi merge. Trích bịa thì loại tín hiệu.
  // Hai hàng rào, cùng thứ tự §6.1 bước 7: evidence phải có thật, RỒI scope/
  // speech act phải cho phép. Bỏ hàng rào thứ hai là để AI đi vòng qua Phụ lục C.
  const sauEvidence = aiDaChay ? locTheoEvidence(nhanTinHieuLLM(input.llmSignals), ctx) : [];
  const scope = locTheoScopeChiTiet(sauEvidence, ctx);
  const llm = scope.giu;

  const signals = ghepTinHieu([...direct, ...web], llm);
  const nhanDuoc = signals.filter((s) => s.state === 'present').map((s) => s.id);

  const kq = decide(signals);
  const overrides = evaluateOverrides(nhanDuoc, {
    caseContext: input.caseContext,
    recoveryContext: input.recoveryContext,
  });

  // §4.3 — sàn: KHÔNG nguồn nào đọc được thì nhãn KHÔNG được là "chưa thấy".
  // Sàn chỉ LÀM TĂNG cảnh giác, không bao giờ giảm (§4.2).
  let riskLabel = kq.riskLabel;
  if (overrides.length > 0) riskLabel = 'HIGH';
  else if (san.daKiem.length === 0 && riskLabel === 'NO_SIGNS_FOUND') riskLabel = 'SUSPICIOUS';

  const chuaKiem = [...san.chuaKiem];
  // Mọi lượt chỉ có văn bản đều chưa nghe được cuộc gọi — nói ra, đừng im lặng.
  if (!chuaKiem.includes('chua_nghe_duoc_cuoc_goi')) chuaKiem.push('chua_nghe_duoc_cuoc_goi');

  const envelope = {
    nhan: nhanHopDong(riskLabel),
    maLyDo: kq.maLyDo,
    daKiem: san.daKiem,
    chuaKiem,
    hoKichBan: chonHoKichBan(nhanDuoc),
    aiDaChay,
    canThiep: chonCanThiep({ score: kq.score, overrides, caseContext: input.caseContext }),

    // ── Nội bộ: KHÔNG thuộc §HĐ. Server phải gọi toHopDong() trước khi trả ra. ──
    riskLabel,
    score: kq.score,
    baseScore: kq.baseScore,
    groupScores: kq.groupScores,
    appliedSynergies: kq.appliedSynergies,
    overrides,
    signals,
    language: ctx.language,
    activePacks: ctx.activePacks,
    // Chẩn đoán: tín hiệu AI bị hàng rào scope loại, kèm speech act của đoạn.
    loaiBoScope: scope.loai,
    speechActs: ctx.segments.map((d) => d.speechAct),
  };
  if (quaDai) envelope.loi = 'INPUT_TOO_LONG';
  return envelope;
}

/** §HĐ — ĐÚNG bảy trường. Không tự thêm, không tự đổi tên, không tự đổi kiểu. */
function toHopDong(envelope) {
  return {
    nhan: envelope.nhan,
    maLyDo: envelope.maLyDo,
    daKiem: envelope.daKiem,
    chuaKiem: envelope.chuaKiem,
    hoKichBan: envelope.hoKichBan,
    aiDaChay: envelope.aiDaChay,
    canThiep: envelope.canThiep,
  };
}

module.exports = {
  analyze, toHopDong, chonCanThiep, unreadableInputFloor,
  nhanTinHieuLLM, chonHoKichBan,
};
