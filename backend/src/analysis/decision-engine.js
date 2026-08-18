'use strict';
/**
 * §4.2 — BỘ LUẬT DUY NHẤT. AI chỉ bật cờ, file này mới quyết định.
 * Phụ lục B — cap nhóm, dedup, 10 tổ hợp cộng hưởng.
 *
 * HÀM THUẦN. Không mạng, không DB, không LLM, không đồng hồ.
 * KHÔNG import provider SDK (§5.4).
 *
 * ⚠️ TUYỆT ĐỐI không hạ ngưỡng 45 và không đụng cap 69 (Phụ lục B.4).
 */

const { SIGNALS, GROUPS, GROUP_IDS, laTinHieu } = require('./signal-registry');

// §6.2 — hằng số khoá. Đổi ba số này phải hỏi người dùng trước (§12).
const SCORE_CAP = 69;
const THRESHOLD_SUSPICIOUS = 20;
const THRESHOLD_HIGH = 45;

const co = (tap, id) => tap.has(id);
const coTienTo = (tap, tienTo) => [...tap].some((id) => id.startsWith(tienTo));
const coMotTrong = (tap, ids) => ids.some((id) => tap.has(id));

/** Vế "yêu cầu chuyển tiền" dùng chung cho nhiều tổ hợp. */
const FIN_CHUYEN_MANH = [
  'FIN_TRANSFER_REQUEST', 'FIN_CRYPTO_TRANSFER', 'FIN_CASH_COURIER',
  'FIN_PRECIOUS_METAL_PURCHASE', 'FIN_SAFE_ACCOUNT',
];

/**
 * Phụ lục B.2 — bảng tổ hợp cộng hưởng. Mỗi bonus chỉ áp dụng MỘT lần.
 * 10 tổ hợp gốc + 3 tổ hợp thêm 15/8/2026 (xem ghi chú ở cuối mảng).
 */
const SYNERGIES = Object.freeze([
  {
    id: 'secrecy+fear+transfer', bonus: 15,
    khop: (s) => co(s, 'MAN_SECRECY') && co(s, 'MAN_FEAR_THREAT') && co(s, 'FIN_TRANSFER_REQUEST'),
  },
  {
    id: 'recoverysupport+recoveryfee', bonus: 15,
    khop: (s) => co(s, 'ID_RECOVERY_SUPPORT_IMPERSONATION') && co(s, 'FIN_RECOVERY_FEE'),
  },
  {
    id: 'devicetakeover+banklogin', bonus: 15,
    khop: (s) => (co(s, 'DEV_REMOTE_CONTROL_APP') || co(s, 'DEV_ACCESSIBILITY_PERMISSION'))
      && co(s, 'CRED_BANK_LOGIN'),
  },
  {
    // B.3 — LÀ 14, KHÔNG PHẢI 10. +10 làm kịch bản trung tâm dừng ở 41, dưới ngưỡng 45.
    id: 'identity+transfer', bonus: 14,
    khop: (s) => coTienTo(s, 'ID_') && coMotTrong(s, FIN_CHUYEN_MANH),
  },
  {
    // B.3 — bảng 8.11 THIẾU tổ hợp này. Họ "bank + đòi mã" từng dừng ở 41–44.
    id: 'identity+credential', bonus: 10,
    khop: (s) => coTienTo(s, 'ID_') && coTienTo(s, 'CRED_'),
  },
  {
    // B.3 — bảng 8.11 THIẾU tổ hợp này. Họ "tech support + đòi thiết bị" từng dừng ở 41–44.
    id: 'identity+device', bonus: 10,
    khop: (s) => coTienTo(s, 'ID_') && coTienTo(s, 'DEV_'),
  },
  {
    id: 'brandmismatch+credential', bonus: 10,
    khop: (s) => co(s, 'WEB_BRAND_DOMAIN_MISMATCH') && coTienTo(s, 'CRED_'),
  },
  {
    id: 'family+urgency+transfer', bonus: 10,
    khop: (s) => co(s, 'ID_FAMILY_IMPERSONATION') && co(s, 'MAN_URGENCY') && co(s, 'FIN_TRANSFER_REQUEST'),
  },
  {
    id: 'coverstory+transfer', bonus: 10,
    khop: (s) => co(s, 'MAN_COVER_STORY') && co(s, 'FIN_TRANSFER_REQUEST'),
  },
  {
    id: 'stageescalation+action', bonus: 8,
    khop: (s) => co(s, 'CASE_STAGE_ESCALATION')
      && (coTienTo(s, 'CRED_') || coTienTo(s, 'FIN_') || coTienTo(s, 'DEV_')),
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BA TỔ HỢP THÊM 15/8/2026 — người dùng duyệt sau khi xem số đo.
  //
  // VÌ SAO: sáu trong mười tổ hợp gốc đòi có `ID_*`. Nên mọi kịch bản KHÔNG AI
  // GIẢ DANH AI đều không có đường nào chạm ngưỡng 45 — mà đó lại là những thủ
  // đoạn phổ biến nhất: đầu tư lãi cao, việc nhẹ lương cao, trúng thưởng, phí
  // ứng trước.
  //
  // ĐO TRÊN 445 MẪU (dataset b78ac195237f, claude-sonnet-5):
  //   nhóm bắt đúng : 93/117 mẫu CÓ tín hiệu ID_*  (79%)
  //   nhóm kẹt      :  7/75  mẫu có ID_*           (9%)
  //   68/75 mẫu kẹt KHÔNG có tín hiệu danh tính nào.
  //
  // Ví dụ thật đang bị chấm dưới ngưỡng, tất cả đều trích tín hiệu ĐÚNG:
  //   "Sàn cam kết lãi 20%/tháng, chú nạp 30 triệu vào TK…"        43 điểm
  //   "Task cuối nạp 1.200.000đ, xong trả cả vốn lẫn thưởng"       26 điểm
  //   "Chuyển trước 250.000đ phí vận chuyển để nhận quà 20 triệu"  26 điểm
  //
  // TÁC DỤNG ĐO ĐƯỢC (mô phỏng trên chính 445 mẫu đã chạy):
  //   offer+transfer       +21 mẫu bắt đúng ·  0 báo đỏ oan thêm
  //   advancefee+transfer  +11 mẫu           ·  0 báo đỏ oan thêm
  //   orgclaim+transfer     +1 mẫu           ·  0 báo đỏ oan thêm
  //   cả ba                +24 mẫu (51,6% → 62,9%) · 0 báo đỏ oan thêm
  //
  // Không báo động giả nào thêm, cùng lý do B.3 đã ghi cho identity+transfer:
  // tổ hợp chỉ nổ khi một LỜI CHÀO MỜI đi cùng một YÊU CẦU CHUYỂN TIỀN. Tin
  // nhắn lành của người thân không hứa lãi 20%/tháng rồi bảo nạp tiền.
  //
  // ⚠️ GHI NHẬN MỘT LO NGẠI THIẾT KẾ: `advancefee+transfer` là TẬP CON của
  // `offer+transfer` (OFF_ADVANCE_FEE cũng là OFF_*), nên hai bonus cùng nổ
  // trên một bằng chứng. Đo được là không sinh báo động giả, và cap 69 chặn
  // cộng dồn vô hạn — nhưng đây là chỗ nên xem lại nếu sau này chỉnh trọng số.
  //
  // ⚠️ NGƯỠNG 20/45 VÀ CAP 69 KHÔNG BỊ ĐỤNG TỚI. Chỉ bảng cộng hưởng đổi.
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'offer+transfer', bonus: 14,
    khop: (s) => coTienTo(s, 'OFF_') && coMotTrong(s, FIN_CHUYEN_MANH),
  },
  {
    id: 'advancefee+transfer', bonus: 14,
    khop: (s) => co(s, 'OFF_ADVANCE_FEE') && coMotTrong(s, FIN_CHUYEN_MANH),
  },
  {
    id: 'orgclaim+transfer', bonus: 14,
    khop: (s) => co(s, 'FIN_ORG_CLAIM_PERSONAL_ACCOUNT') && coMotTrong(s, FIN_CHUYEN_MANH),
  },
]);

/**
 * Phụ lục B.1 — điểm của một nhóm.
 * Vì sao phải có cap: một yêu cầu credential duy nhất khớp bốn tín hiệu cùng lúc
 * là 92 điểm cho MỘT câu — thang điểm mất hết ý nghĩa.
 */
function diemNhom(group, trongSo) {
  if (trongSo.length === 0) return 0;
  const { cap, mode, plus } = GROUPS[group];
  const giam = [...trongSo].sort((a, b) => b - a);
  let diem;
  switch (mode) {
    case 'max':
      diem = giam[0];
      break;
    case 'top2':
      diem = giam[0] + (giam[1] || 0);
      break;
    case 'max-plus':
      // max + tối đa `plus` điểm cho MỘT tín hiệu phụ, tối đa một lần.
      diem = giam[0] + (giam.length > 1 ? Math.min(plus, giam[1]) : 0);
      break;
    default:
      throw new Error(`Cách lấy điểm lạ: ${mode}`);
  }
  return Math.min(diem, cap);
}

/**
 * @param {Array<{id:string,state:string}>} tinHieu  tín hiệu ĐÃ được chấp nhận
 * @returns {{score:number, riskLabel:string, groupScores:object,
 *            appliedSynergies:Array, maLyDo:string[], baseScore:number}}
 */
function decide(tinHieu = []) {
  // Dedup theo canonical SIGNAL_ID — không cộng điểm hai lần (§6.1 bước 1b).
  const nhan = new Set();
  for (const s of tinHieu) {
    if (!s || s.state !== 'present') continue;
    if (!laTinHieu(s.id)) continue;      // tín hiệu lạ: bỏ qua, không làm sập
    nhan.add(s.id);
  }

  const theoNhom = {};
  for (const g of GROUP_IDS) theoNhom[g] = [];
  for (const id of nhan) theoNhom[SIGNALS[id].group].push(SIGNALS[id].weight);

  const groupScores = {};
  let baseScore = 0;
  for (const g of GROUP_IDS) {
    groupScores[g] = diemNhom(g, theoNhom[g]);
    baseScore += groupScores[g];
  }

  const appliedSynergies = SYNERGIES
    .filter((s) => s.khop(nhan))
    .map((s) => ({ id: s.id, bonus: s.bonus }));
  const congHuong = appliedSynergies.reduce((t, s) => t + s.bonus, 0);

  // Điểm KHÔNG BAO GIỜ vượt 69. Đừng tạo dải "70–100".
  const score = Math.min(baseScore + congHuong, SCORE_CAP);

  let riskLabel = 'NO_SIGNS_FOUND';
  if (score >= THRESHOLD_HIGH) riskLabel = 'HIGH';
  else if (score >= THRESHOLD_SUSPICIOUS) riskLabel = 'SUSPICIOUS';

  // maLyDo là MÃ, không phải câu. Sắp theo trọng số giảm dần cho ổn định.
  const maLyDo = [...nhan].sort(
    (a, b) => SIGNALS[b].weight - SIGNALS[a].weight || a.localeCompare(b),
  );

  return { score, baseScore, riskLabel, groupScores, appliedSynergies, maLyDo };
}

module.exports = {
  decide, diemNhom, SYNERGIES,
  SCORE_CAP, THRESHOLD_SUSPICIOUS, THRESHOLD_HIGH,
};
