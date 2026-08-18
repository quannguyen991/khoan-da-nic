'use strict';
/**
 * §5.3 — MÁY DÒ ĐIỂM MÙ. Nguồn C của Ra-đa thủ đoạn.
 *
 * Hai nguồn kia nói về thứ KẺ LỪA ĐẢO đang làm. Nguồn này nói về thứ CHÍNH
 * CHÚNG TA đang không nhìn thấy — họ kịch bản mà bộ luật bỏ sót nhiều nhất, đo
 * từ chính bộ đánh giá.
 *
 * ⚠️ §11 — cảnh báo phải CÓ NGUỒN. Nguồn của mục điểm mù là một phép đo có thật:
 * commit SHA, phiên bản dataset, số mẫu. Không có phép đo thì KHÔNG có điểm mù
 * để công bố — chứ không phải suy đoán ra một cái.
 *
 * ⚠️ Điểm mù là thông tin cho ĐỘI PHÁT TRIỂN, không phải cảnh báo cho người dùng.
 * Nói với bác "chúng tôi hay bỏ sót kịch bản đầu tư" không giúp được gì cho bác;
 * nó chỉ làm bác mất lòng tin. Mục điểm mù đi vào `/transparency`, không đi vào
 * màn kết quả.
 */

const fs = require('node:fs');
const path = require('node:path');

const DUONG_CHI_TIET = path.join(__dirname, '..', 'eval', 'results', 'chi-tiet.jsonl');

/** Dưới ngưỡng này thì họ kịch bản được coi là điểm mù. */
const NGUONG_RECALL = 0.6;
/** Ít hơn ngần này mẫu thì con số không đủ nghĩa để gọi là điểm mù. */
const SO_MAU_TOI_THIEU = 4;

function docChiTiet(duong = DUONG_CHI_TIET) {
  try {
    return fs.readFileSync(duong, 'utf8').split('\n').filter(Boolean).map((d) => JSON.parse(d));
  } catch { return null; }
}

/**
 * @returns {{coPhepDo:boolean, diemMu:Array, lyDo:string|null}}
 * Không có phép đo ⇒ KHÔNG bịa điểm mù. Trả rỗng và nói rõ vì sao.
 */
function doDiemMu(duong = DUONG_CHI_TIET) {
  const dong = docChiTiet(duong);
  if (!dong || dong.length === 0) {
    return { coPhepDo: false, diemMu: [], lyDo: 'chua_co_phep_do_nao' };
  }

  const theoHo = new Map();
  for (const r of dong) {
    if (r.vangMucDo !== 'CAO') continue;   // điểm mù đo trên ca NGUY HIỂM
    if (r.hong) continue;                  // §4.3 — lượt hỏng không tính vào phép đo
    const g = theoHo.get(r.ho) || { ho: r.ho, tong: 0, batDuoc: 0, diem: [] };
    g.tong += 1;
    if (r.duDoan === 'CAO') g.batDuoc += 1;
    g.diem.push(r.score);
    theoHo.set(r.ho, g);
  }

  const diemMu = [...theoHo.values()]
    .filter((g) => g.tong >= SO_MAU_TOI_THIEU)
    .map((g) => ({
      maThuDoan: g.ho,
      soMau: g.tong,
      batDuoc: g.batDuoc,
      recall: g.batDuoc / g.tong,
      diemTrungBinh: Math.round(g.diem.reduce((s, x) => s + x, 0) / g.diem.length),
      // Khoảng cách tới ngưỡng CAO — cho biết thiếu bao nhiêu điểm, không phải
      // "cần thêm cue" hay "cần sửa trọng số". Chẩn đoán là việc của con người.
      thieuBaoNhieuDiem: Math.max(0, 45 - Math.round(g.diem.reduce((s, x) => s + x, 0) / g.diem.length)),
    }))
    .filter((g) => g.recall < NGUONG_RECALL)
    .sort((a, b) => a.recall - b.recall || b.soMau - a.soMau);

  return { coPhepDo: true, diemMu, lyDo: null };
}

/**
 * Chuyển điểm mù thành mục Ra-đa nguồn C.
 * ⚠️ Mục sinh ra ở trạng thái CHỜ DUYỆT như mọi nguồn khác — máy đo không được
 * tự công bố kết quả của chính mình.
 */
function dungMucRaDa({ metadata } = {}, duong = DUONG_CHI_TIET) {
  const { coPhepDo, diemMu, lyDo } = doDiemMu(duong);
  if (!coPhepDo) return { coPhepDo: false, muc: [], lyDo };

  return {
    coPhepDo: true,
    lyDo: null,
    muc: diemMu.map((d) => ({
      maThuDoan: `diem_mu_${d.maThuDoan}`,
      nguon: 'c_diem_mu_do_duoc',
      // §11 — nguồn của mục này là một PHÉP ĐO CÓ THẬT, truy ngược được.
      phepDo: {
        commitSha: metadata?.commitSha ?? null,
        datasetVersion: metadata?.datasetVersion ?? null,
        soMau: d.soMau,
        recall: Number(d.recall.toFixed(3)),
        diemTrungBinh: d.diemTrungBinh,
        thieuBaoNhieuDiem: d.thieuBaoNhieuDiem,
      },
      // Điểm mù dành cho ĐỘI PHÁT TRIỂN, không hiện ở màn kết quả của người dùng.
      chiHienO: 'transparency',
    })),
  };
}

module.exports = {
  doDiemMu, dungMucRaDa, docChiTiet, NGUONG_RECALL, SO_MAU_TOI_THIEU, DUONG_CHI_TIET,
};
