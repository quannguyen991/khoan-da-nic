'use strict';
/**
 * §5.3 / §11 — DỮ LIỆU CHO /transparency. TÁCH MỤC TIÊU KHỎI ĐÃ ĐO.
 *
 * Đây là bề mặt trung thực của sản phẩm. Hai lỗi §11 cấm tuyệt đối, và cả hai
 * đều rất dễ phạm ở đúng chỗ này:
 *   - "gán số liệu eval cho MODEL CHƯA HỀ ĐƯỢC GỌI. Model đang cấu hình cho máy
 *      chủ là chuyện khác với model đã tạo ra con số."
 *   - "gọi bản dựng là ĐÃ ĐO khi mới chỉ là MỤC TIÊU."
 *
 * ⚠️ §11: "Xoá eval/results/latest.json thì trang tự chuyển toàn bộ về
 * 'Target — not yet measured' — ĐÓ LÀ HÀNH VI ĐÚNG." Đừng vá cho nó hiện số cũ.
 */

const fs = require('node:fs');
const path = require('node:path');

const V = require('./version');
const { SIGNAL_IDS } = require('./analysis/signal-registry');
const { CRITICAL_OVERRIDES } = require('./analysis/critical-overrides');
const { SYNERGIES, SCORE_CAP, THRESHOLD_SUSPICIOUS, THRESHOLD_HIGH } = require('./analysis/decision-engine');

/**
 * ⚠️ TÌM `eval/results/` THEO NHIỀU ỨNG VIÊN, ĐỪNG ĐOÁN MỘT ĐƯỜNG.
 *
 * Một đường dẫn tương đối ở đây phải đúng trong HAI ngữ cảnh khác nhau, và
 * không đường nào đúng được cả hai:
 *   · chạy thẳng từ nguồn → `__dirname` là `backend/src`
 *   · chạy bản đóng gói   → `__dirname` là `dist` (npm start dùng dist/server.cjs)
 *
 * ĐO ĐƯỢC 6/9/2026 trên cây web: nó khai `'..', 'eval'`, tức
 * `backend/eval/results/` — một thư mục KHÔNG TỒN TẠI. Chạy backend trực tiếp
 * thì `dungSafetyCard()` trả `daDo: false` và trang minh bạch hiện "chưa đo"
 * cho toàn bộ, dù eval đã chạy xong. Nó vẫn ra số trên máy chủ, nhưng là do MAY:
 * từ `dist` thì `'..', 'eval'` tình cờ trúng `<gốc>/eval`.
 *
 * Một đường dẫn chỉ đúng sau khi đóng gói là một đường dẫn đang chờ hỏng.
 *
 * Không ứng viên nào có thật thì trang tự chuyển hết về "mục tiêu — chưa đo".
 * Đó vẫn là hành vi đúng của §11, không phải lỗi.
 */
function timEval(ten) {
  const ungVien = [
    path.join(__dirname, '..', '..', 'eval', 'results', ten),   // backend/src → gốc
    path.join(__dirname, '..', 'eval', 'results', ten),         // dist → gốc
    path.join(process.cwd(), 'eval', 'results', ten),           // chạy từ gốc
  ];
  return ungVien.find((d) => { try { return fs.existsSync(d); } catch { return false; } })
    || ungVien[0];
}

const DUONG_KET_QUA = timEval('latest.json');

/**
 * Kết quả của TẦNG QUÉT TIN NHẮN ĐẾN — `eval/do-tang-quet.js` ghi ra.
 *
 * Đây là nửa thứ hai của sản phẩm, và trước 6/9/2026 trang này không nhắc tới
 * nó một chữ nào: `khoanbench` chỉ đo đường "bác dán nội dung", còn 21 luật của
 * luồng "tự quét tin đến" không có con số nào được công bố. Im lặng về một nửa
 * sản phẩm cũng là một dạng nói không đủ sự thật.
 */
const DUONG_TANG_QUET = timEval('tang-quet.json');

function docTangQuet(duong = DUONG_TANG_QUET) {
  try {
    if (!fs.existsSync(duong)) return null;
    const b = JSON.parse(fs.readFileSync(duong, 'utf8'));
    if (!b?.metadata?.commitSha || !b?.chiSo) return null;
    return b;
  } catch { return null; }
}

/** MỤC TIÊU — lấy từ §2B.6 và §6.14. Đây KHÔNG phải số đã đo. */
const MUC_TIEU = Object.freeze([
  { ma: 'dangerous_recall_vi', nguong: 0.95, huong: 'min', nguon: '§2B.6' },
  { ma: 'dangerous_recall_en', nguong: 0.95, huong: 'min', nguon: '§2B.6' },
  { ma: 'dangerous_recall_mixed', nguong: 0.93, huong: 'min', nguon: '§6.14' },
  { ma: 'high_risk_fp', nguong: 0.03, huong: 'max', nguon: '§2B.6' },
  { ma: 'fp_lat_chua_thay', nguong: 0.0, huong: 'max', nguon: '§2B.6' },
  { ma: 'lech_parity_vi_en', nguong: 0.03, huong: 'max', nguon: '§6.14' },
]);

/** Sự thật về KIẾN TRÚC — luôn đúng, không phụ thuộc có chạy eval hay chưa. */
function suThatKienTruc() {
  return {
    soTinHieu: SIGNAL_IDS.length,
    soCriticalOverride: CRITICAL_OVERRIDES.length,
    soToHopCongHuong: SYNERGIES.length,
    thangDiem: `0–${SCORE_CAP}`,
    nguong: `${THRESHOLD_SUSPICIOUS}/${THRESHOLD_HIGH}`,
    analysisVersion: V.ANALYSIS_VERSION,
    registryVersion: V.REGISTRY_VERSION,
    ruleVersion: V.RULE_VERSION,
    // Luận điểm trung tâm: AI trích tín hiệu, LUẬT CỨNG quyết định mức.
    aiQuyetDinhMuc: false,
  };
}

function docKetQua(duong = DUONG_KET_QUA) {
  try {
    if (!fs.existsSync(duong)) return null;
    const bao = JSON.parse(fs.readFileSync(duong, 'utf8'));
    // §2B.6 — thiếu metadata thì số liệu KHÔNG DÙNG ĐƯỢC. Coi như chưa đo.
    if (!bao?.metadata?.commitSha || !bao?.metadata?.datasetVersion) return null;
    return bao;
  } catch { return null; }
}

const lay = (bao, ma) => {
  const p = bao.parity || {};
  const c = bao.chiSo || {};
  switch (ma) {
    case 'dangerous_recall_vi': return p.theoNgonNgu?.vi?.dangerousRecall;
    case 'dangerous_recall_en': return p.theoNgonNgu?.en?.dangerousRecall;
    case 'dangerous_recall_mixed': return p.theoNgonNgu?.mixed?.dangerousRecall;
    case 'high_risk_fp': return c.highRiskFP;
    case 'fp_lat_chua_thay': return c.fpTrenLatChat;
    case 'lech_parity_vi_en': return p.lechRecall;
    default: return undefined;
  }
};

/**
 * @returns {{daDo:boolean, chiSo:Array, nguonDo:object|null, kienTruc:object, canhBao:string[]}}
 */
function dungSafetyCard(duong = DUONG_KET_QUA, duongTangQuet = DUONG_TANG_QUET) {
  const bao = docKetQua(duong);
  const tangQuet = docTangQuet(duongTangQuet);
  const kienTruc = suThatKienTruc();
  const canhBao = [];

  const chiSo = MUC_TIEU.map((m) => {
    const v = bao ? lay(bao, m.ma) : undefined;
    const daDo = v !== undefined && v !== null;
    return {
      ma: m.ma,
      mucTieu: m.nguong,
      huong: m.huong,
      nguonMucTieu: m.nguon,
      daDo,
      giaTri: daDo ? v : null,
      // §11 — chưa đo thì nói "mục tiêu, chưa đo", KHÔNG in số mục tiêu như kết quả.
      trangThai: daDo
        ? ((m.huong === 'min' ? v >= m.nguong : v <= m.nguong) ? 'dat' : 'chua_dat')
        : 'muc_tieu_chua_do',
    };
  });

  if (!bao) {
    canhBao.push('chua_co_phep_do_nao');
  } else {
    // §11 — model đang cấu hình ≠ model đã tạo ra con số.
    if (!bao.metadata.aiDaChay) canhBao.push('so_lieu_do_khi_khong_co_ai');
    if (bao.mauThat && !bao.mauThat.coMauThat) canhBao.push('khong_co_mau_that');
    // §6.14 — vượt khoảng chênh thì phải công bố và cấm nói "equivalent performance".
    const lech = bao.parity?.lechRecall;
    if (typeof lech === 'number' && lech > 0.03) canhBao.push('lech_parity_vuot_3_diem');
    if (bao.tranHong?.vuotTran) canhBao.push('vuot_tran_luot_hong');
  }

  return {
    daDo: Boolean(bao),
    chiSo,
    kienTruc,
    canhBao,
    tangQuet,
    nguonDo: bao
      ? {
        commitSha: bao.metadata.commitSha,
        datasetVersion: bao.metadata.datasetVersion,
        datasetSize: bao.metadata.datasetSize,
        // §11 — chưa gọi AI thì trường này RỖNG, không điền model đang cấu hình.
        model: bao.metadata.aiDaChay ? bao.metadata.model : null,
        cheDo: bao.metadata.cheDo,
        confusion: bao.chiSo?.confusion || null,
      }
      : null,
  };
}

module.exports = { dungSafetyCard, docKetQua, suThatKienTruc, MUC_TIEU, DUONG_KET_QUA };
