'use strict';
/**
 * XUẤT TOÀN BỘ MÃ BACKEND PHÁT RA, ĐỂ FRONTEND DỰNG CATALOG i18n.
 *
 * Vì sao cần: §HĐ luật 2 nói `maLyDo` là MÃ, frontend tra bảng để ra câu. §4.1
 * nói MỌI chuỗi người dùng đọc — kể cả ARIA label và notification — phải đến từ
 * catalog i18n. Nghĩa là mỗi mã backend phát ra PHẢI có một mục trong catalog.
 *
 * Thiếu một mã thì người dùng nhìn thấy `FIN_ORG_CLAIM_PERSONAL_ACCOUNT` giữa
 * màn hình. Đây là dạng lỗi không test nào của backend bắt được, vì backend làm
 * đúng — nó phát ra mã, đúng như hợp đồng.
 *
 * Chạy:  node scripts/xuat-hop-dong.js            in ra màn hình
 *        node scripts/xuat-hop-dong.js --ghi      ghi public/config/ma-hop-dong.json
 */

const fs = require('node:fs');
const path = require('node:path');

const { RISK_LEVELS, NHAN_HOP_DONG } = require('../src/risk-labels');
const { SIGNAL_IDS, GROUP_IDS } = require('../src/analysis/signal-registry');
const { CRITICAL_OVERRIDES } = require('../src/analysis/critical-overrides');
const { SYNERGIES } = require('../src/analysis/decision-engine');
const { MUC_CAN_THIEP, MO_TA } = require('../src/intervention-ladder');
const { GIOI_HAN } = require('../src/analysis/trust-receipt-v2');
const { HO_KICH_BAN_MA } = require('../src/analysis/pipeline');
const { GIAI_DOAN } = require('../src/journey-engine');
const { TRANG_THAI_GIAO_NHAN, VAI_TRO } = require('../src/trusted-circle');
const { BUOC_CHUNG, THEO_NUOC } = require('../src/analysis/recovery-adapters');
const { CAU_HOI, NHANH_HANH_DONG } = require('../src/bo-hoi-nhanh');
const { MA_BUOC_DA_DUNG } = require('../src/kich-ban-di-tiep');
const { MA_KET_QUA, TU_VUNG_CUM_TU } = require('../src/khoan-proof-ky');
const { MA_CHIEU_KIEM } = require('../src/verified-request');
const V = require('../src/version');

/** §HĐ — bảy trường, không hơn không kém. */
const TRUONG_HOP_DONG = ['nhan', 'maLyDo', 'daKiem', 'chuaKiem', 'hoKichBan', 'aiDaChay', 'canThiep'];

const MA_DA_KIEM = [
  'van_ban', 'anh_ocr', 'url', 'ghi_am',
  'thong_bao_tin_nhan',   // §15.4 — nguồn thứ tư, native Android
  'bo_hoi_nhanh',         // §15.3.3 — bác tự trả lời, offline
  'nguoi_than_xac_nhan',  // §16.3 — nguồn thứ năm, chữ ký Khoan Proof
];

const MA_CHUA_KIEM = [
  'chua_nghe_duoc_cuoc_goi', 'khong_doc_duoc_anh', 'khong_mo_duoc_link',
  'ai_khong_phan_hoi', 'ai_khong_chay', 'khong_nghe_duoc_ghi_am', 'noi_dung_qua_dai',
  /**
   * §4.3 — ba chỗ hỏng của nguồn ghi âm trên máy. BA MÃ RIÊNG, đừng gộp:
   *  · chua_tai_xong_model_nghe  — bác CHƯA CÓ bộ nghe. Bác tự sửa được.
   *  · ghi_am_khong_co_tieng_noi — có ghi, nhưng không có giọng người.
   *  · chi_nghe_duoc_phan_dau    — đoạn ghi dài, mới nghe được phần đầu.
   * Cả ba đều KHÁC "không giải mã được", và viết câu giống nhau cho chúng là
   * bảo bác đi sửa một thứ bác không sửa được.
   */
  'chua_tai_xong_model_nghe', 'ghi_am_khong_co_tieng_noi', 'chi_nghe_duoc_phan_dau',
  /**
   * ⚠️ Nghe RA CHỮ nhưng máy không trả điểm tin cậy. Android không bắt buộc bộ
   * nghe trả `CONFIDENCE_SCORES`, và bản chạy trên máy thường bỏ trống. Câu cho
   * mã này phải nói "chưa đo được", KHÔNG được nói "không nghe được".
   */
  'ghi_am_khong_do_duoc_do_tin_cay',
  // §15.4.1 — bốn chỗ hỏng của nguồn đọc thông báo tin nhắn.
  'chi_doc_duoc_mot_phan_tin', 'thong_bao_khong_co_noi_dung', 'thong_bao_da_bi_xoa',
  /**
   * §16.3 — HAI MÃ NÀY TRÔNG GIỐNG NHAU NHƯNG NGƯỢC NHAU. Frontend đừng gộp:
   *  · chua_lien_lac_duoc_nguoi_than — ĐÃ hỏi mà không ai đáp. Im lặng CÓ nghĩa,
   *    và nó kéo theo sàn NGHI_NGO.
   *  · chua_thay_yeu_cau_da_xac_thuc — CHƯA ai hỏi ai cả. Đây là trạng thái
   *    BÌNH THƯỜNG vì hầu như không ai dùng Khoan Proof. KHÔNG có sàn nào.
   * Viết câu cho hai mã này giống nhau là biến một trạng thái bình thường thành
   * một lời buộc tội.
   */
  'chua_lien_lac_duoc_nguoi_than',
  'chua_thay_yeu_cau_da_xac_thuc',
];

const MA_LOI_HTTP = [
  'INPUT_TOO_LONG', 'FILE_TOO_LARGE', 'THIEU_DAU_VAO',
  'JSON_KHONG_HOP_LE', 'RATE_LIMITED', 'LOI_MAY_CHU',
];

const MA_CANH_BAO_SAFETY_CARD = [
  'chua_co_phep_do_nao', 'so_lieu_do_khi_khong_co_ai', 'khong_co_mau_that',
  'lech_parity_vuot_3_diem', 'vuot_tran_luot_hong',
];

const MA_CANH_BAO_PHUC_HOI = [
  'chua_biet_nguoi_dung_o_nuoc_nao', 'nuoc_chua_duoc_duyet_chi_co_buoc_chung',
  'chua_xac_minh_duoc_so_tong_dai_dung_so_in_sau_the', 'danh_ba_chua_co_muc_nao_duoc_duyet',
];

function dungHopDong() {
  const buocPhucHoi = [...new Set([
    ...BUOC_CHUNG,
    ...Object.values(THEO_NUOC).flatMap((n) => n.buocRieng),
  ])];

  return {
    _doc: 'Mọi mã backend phát ra. Xem _canNhanI18n để biết nhóm nào cần nhãn hiển thị.',
    _sinhBoi: 'node scripts/xuat-hop-dong.js --ghi',

    /**
     * NHÓM NGƯỜI DÙNG ĐỌC — frontend PHẢI có nhãn i18n cho từng mã.
     * Thiếu một mã là người dùng nhìn thấy mã trần giữa màn hình.
     */
    _canNhanI18n: [
      'nhan', 'canThiep', 'maLoiRa', 'maLyDo', 'daKiem', 'chuaKiem',
      'gioiHanPhieuTinCay', 'hoKichBan', 'giaiDoanVuViec', 'vaiTroVongTron',
      'trangThaiGiaoNhan', 'buocPhucHoi', 'canhBaoPhucHoi', 'canhBaoSafetyCard',
      'maLoiHttp', 'cauHoiNhanh', 'nhanhHanhDong',
      'maBuocKichBan', 'ketQuaKhoanProof', 'cumTuKhoanProof',
    ],

    /**
     * NHÓM NỘI BỘ — chỉ để chẩn đoán và đối chiếu phiên bản. KHÔNG hiển thị cho
     * người dùng, nên KHÔNG cần nhãn i18n. `toHopCongHuong` mang dấu `+` trong
     * mã chính vì nó chưa bao giờ là chuỗi người dùng đọc.
     */
    _noiBo: ['riskLabelNoiBo', 'nhomTinHieu', 'criticalOverride', 'toHopCongHuong'],
    phienBan: {
      analysis: V.ANALYSIS_VERSION,
      registry: V.REGISTRY_VERSION,
      rule: V.RULE_VERSION,
      prompt: V.PROMPT_VERSION,
    },

    truongHopDong: TRUONG_HOP_DONG,

    // §4.1 — ENUM. Chữ hiển thị nằm ở catalog frontend, KHÔNG ở backend.
    nhan: Object.values(NHAN_HOP_DONG),
    riskLabelNoiBo: [...RISK_LEVELS],

    canThiep: [...MUC_CAN_THIEP],
    // §4.6 — mỗi mức phải có lối ra, và mã lối ra cũng cần nhãn.
    maLoiRa: [...new Set(MUC_CAN_THIEP.map((m) => MO_TA[m].maLoiRa))],

    // §HĐ luật 2 — maLyDo là MÃ. 58 tín hiệu.
    maLyDo: [...SIGNAL_IDS],
    nhomTinHieu: [...GROUP_IDS],

    daKiem: MA_DA_KIEM,
    chuaKiem: MA_CHUA_KIEM,
    gioiHanPhieuTinCay: [...new Set(Object.values(GIOI_HAN))],

    hoKichBan: [...HO_KICH_BAN_MA],
    criticalOverride: CRITICAL_OVERRIDES.map((o) => o.id),
    toHopCongHuong: SYNERGIES.map((s) => s.id),

    giaiDoanVuViec: [...GIAI_DOAN],
    vaiTroVongTron: [...VAI_TRO],
    trangThaiGiaoNhan: Object.values(TRANG_THAI_GIAO_NHAN),

    buocPhucHoi,
    canhBaoPhucHoi: MA_CANH_BAO_PHUC_HOI,
    canhBaoSafetyCard: MA_CANH_BAO_SAFETY_CARD,
    maLoiHttp: MA_LOI_HTTP,

    // §16.1 — kịch bản đi tiếp. Mỗi mã bước cần một câu "họ THƯỜNG…" (§11:
    // không "họ SẼ", không khẳng định một dấu hiệu VẮNG MẶT).
    maBuocKichBan: [...MA_BUOC_DA_DUNG],

    /**
     * KHOAN PROOF. ⚠️ §11 — câu cho các mã này chỉ được nói AI ĐÃ KÝ, tuyệt đối
     * không nói yêu cầu tốt hay xấu: tài khoản người con vẫn có thể bị chiếm
     * quyền, VÀ dạng lạm dụng tài chính người cao tuổi phổ biến nhất là do người
     * trong nhà gây ra.
     */
    ketQuaKhoanProof: [...new Set([
      ...Object.values(MA_KET_QUA), ...Object.values(MA_CHIEU_KIEM),
    ])],
    // Cụm từ đối chiếu hai máy. LA_TIM → "Lá Tím".
    cumTuKhoanProof: [...TU_VUNG_CUM_TU],

    // §15.3.3 · §15.11.1 — bộ hỏi nhanh. Frontend cần câu chữ cho từng mã.
    cauHoiNhanh: CAU_HOI.map((c) => c.ma),
    nhanhHanhDong: NHANH_HANH_DONG.map((n) => n.ma),
  };
}

if (require.main === module) {
  const hd = dungHopDong();
  const dem = Object.entries(hd)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => [k, v.length]);
  const tong = dem.reduce((s, [, n]) => s + n, 0);

  console.log('\n📋 MÃ BACKEND PHÁT RA — FRONTEND CẦN NHÃN CHO TỪNG MÃ\n');
  for (const [k, n] of dem.sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${k}`);
  }
  console.log(`  ${'───'.padStart(4)}`);
  console.log(`  ${String(tong).padStart(4)}  TỔNG\n`);

  if (process.argv.includes('--ghi')) {
    const p = path.join(__dirname, '..', 'public', 'config', 'ma-hop-dong.json');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(hd, null, 2), 'utf8');
    console.log(`  đã ghi ${p}\n`);
  } else {
    console.log('  Thêm --ghi để xuất public/config/ma-hop-dong.json\n');
  }
}

module.exports = { dungHopDong, TRUONG_HOP_DONG, MA_DA_KIEM, MA_CHUA_KIEM };
