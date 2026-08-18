'use strict';
/**
 * §5.3 — dựng HTML cho /transparency, KHÔNG CẦN JavaScript.
 *
 * Trang này phải đọc được cả khi JS tắt, cả khi offline, cả khi chưa từng chạy
 * eval. Nó là bề mặt trung thực — nếu nó cần JS mới hiện được sự thật thì nó
 * không phải bề mặt trung thực.
 *
 * §11: chưa đo thì nói "mục tiêu — chưa đo", tuyệt đối KHÔNG in số mục tiêu như
 * thể đó là kết quả.
 */

const { dungSafetyCard } = require('./safety-card');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pt = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`);

const TEN_CHI_SO = {
  dangerous_recall_vi: 'Bắt được ca nguy hiểm — tiếng Việt',
  dangerous_recall_en: 'Bắt được ca nguy hiểm — tiếng Anh',
  dangerous_recall_mixed: 'Bắt được ca nguy hiểm — trộn hai thứ tiếng',
  high_risk_fp: 'Báo động đỏ nhầm trên tin lành',
  fp_lat_chua_thay: 'Báo nhầm trên lát tin lành chặt nhất',
  lech_parity_vi_en: 'Khoảng chênh Việt ↔ Anh',
};

const TEN_CANH_BAO = {
  chua_co_phep_do_nao: 'Chưa có phép đo nào. Mọi con số dưới đây là MỤC TIÊU, không phải kết quả.',
  so_lieu_do_khi_khong_co_ai: 'Số liệu này đo khi KHÔNG có tầng AI chạy. Nó là sàn của bộ luật, không phải hiệu năng đầy đủ.',
  khong_co_mau_that: 'Bộ dữ liệu KHÔNG có mẫu thật nào. Mọi con số đo trên mẫu tự soạn.',
  lech_parity_vuot_3_diem: 'Khoảng chênh giữa hai ngôn ngữ vượt 3 điểm phần trăm. Không được mô tả hai ngôn ngữ là tương đương.',
  vuot_tran_luot_hong: 'Phép đo này vượt trần lượt hỏng. Không dùng được.',
};

function dungTrang(the = dungSafetyCard()) {
  const hang = the.chiSo.map((c) => {
    const nhan = TEN_CHI_SO[c.ma] || c.ma;
    const huong = c.huong === 'min' ? '≥' : '≤';
    const doi = `${huong} ${pt(c.mucTieu)}`;
    if (!c.daDo) {
      return `<tr class="chua-do"><th scope="row">${esc(nhan)}</th>`
        + `<td>${esc(doi)}</td><td class="nhan-chua-do">Mục tiêu — chưa đo</td>`
        + `<td>${esc(c.nguonMucTieu)}</td></tr>`;
    }
    const dat = c.trangThai === 'dat';
    return `<tr class="${dat ? 'dat' : 'chua-dat'}"><th scope="row">${esc(nhan)}</th>`
      + `<td>${esc(doi)}</td><td><strong>${esc(pt(c.giaTri))}</strong> ${dat ? '✔ đạt' : '✖ chưa đạt'}</td>`
      + `<td>${esc(c.nguonMucTieu)}</td></tr>`;
  }).join('\n');

  const canhBao = the.canhBao.map((m) => `<li>${esc(TEN_CANH_BAO[m] || m)}</li>`).join('\n');

  const k = the.kienTruc;
  const n = the.nguonDo;

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Khoan Đã — Chúng tôi đo được gì</title>
<style>
  :root { --nen:#fff; --chu:#16181d; --mo:#4a4f5a; --vien:#d6d9e0;
          --dat:#0b6b3a; --chua:#8a1c1c; --cho:#6b5300; }
  @media (prefers-color-scheme: dark) { :root {
    --nen:#14161a; --chu:#f2f3f5; --mo:#b9bec9; --vien:#333944;
    --dat:#63d19a; --chua:#ff9a9a; --cho:#e8c766; } }
  body { margin:0; padding:1.5rem; background:var(--nen); color:var(--chu);
         font:17px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:60rem; margin:0 auto; }
  h1 { font-size:1.6rem; line-height:1.3; }
  h2 { font-size:1.2rem; margin-top:2rem; }
  p, li { max-width:44rem; }
  table { width:100%; border-collapse:collapse; margin:1rem 0; }
  th, td { text-align:left; padding:.6rem .5rem; border-bottom:1px solid var(--vien);
           vertical-align:top; }
  thead th { font-size:.9rem; color:var(--mo); }
  .nhan-chua-do { color:var(--cho); }
  tr.dat td strong { color:var(--dat); }
  tr.chua-dat td strong { color:var(--chua); }
  .canh-bao { border:2px solid var(--cho); border-radius:.5rem; padding:.8rem 1rem; }
  .canh-bao ul { margin:.4rem 0 0; padding-left:1.2rem; }
  dl { display:grid; grid-template-columns:auto 1fr; gap:.3rem 1rem; }
  dt { color:var(--mo); }
  code { font-size:.95em; }
  .ghi-chu { color:var(--mo); font-size:.95rem; }
</style>
</head>
<body>
<main>
<h1>Khoan Đã — chúng tôi đo được gì, và chưa đo được gì</h1>

<p>Trang này tách <strong>mục tiêu</strong> khỏi <strong>số đã đo</strong>.
Chỗ nào chưa chạy phép đo, chúng tôi ghi thẳng là chưa đo — không điền con số
mục tiêu vào cho đẹp.</p>

${the.canhBao.length ? `<section class="canh-bao"><strong>Cần đọc trước:</strong>
<ul>
${canhBao}
</ul></section>` : ''}

<h2>Kết quả</h2>
<table>
<thead><tr><th>Chỉ số</th><th>Mục tiêu</th><th>Đã đo</th><th>Nguồn</th></tr></thead>
<tbody>
${hang}
</tbody>
</table>

<h2>Cách hệ thống quyết định</h2>
<p>AI chỉ đọc nội dung và <strong>bật cờ tín hiệu</strong>. Mức rủi ro cuối cùng
do một bộ luật cố định quyết định — AI không có đường nào tự đặt mức.</p>
<dl>
  <dt>Số tín hiệu</dt><dd>${k.soTinHieu}</dd>
  <dt>Quy tắc khẩn cấp</dt><dd>${k.soCriticalOverride}</dd>
  <dt>Tổ hợp cộng hưởng</dt><dd>${k.soToHopCongHuong}</dd>
  <dt>Thang điểm</dt><dd>${esc(k.thangDiem)}, ngưỡng ${esc(k.nguong)}</dd>
  <dt>Phiên bản bộ luật</dt><dd><code>${esc(k.ruleVersion)}</code></dd>
</dl>

<h2>Phép đo này lấy từ đâu</h2>
${n ? `<dl>
  <dt>Commit</dt><dd><code>${esc(n.commitSha)}</code></dd>
  <dt>Bộ dữ liệu</dt><dd><code>${esc(n.datasetVersion)}</code> · ${n.datasetSize} mẫu</dd>
  <dt>Chế độ</dt><dd>${esc(n.cheDo)}</dd>
  <dt>Model</dt><dd>${n.model ? `<code>${esc(n.model)}</code>` : 'không có — lượt đo này không gọi AI'}</dd>
</dl>` : `<p class="ghi-chu">Chưa có phép đo nào được ghi lại. Khi
<code>eval/results/latest.json</code> không tồn tại, trang này hiển thị toàn bộ
là “mục tiêu — chưa đo”. Đó là hành vi đúng, không phải lỗi.</p>`}

<p class="ghi-chu">Mục tiêu của sản phẩm là WCAG 2.2 AA. Chúng tôi chưa chạy đủ
kiểm tra tự động và thủ công để tuyên bố đã tuân thủ.</p>
</main>
</body>
</html>`;
}

module.exports = { dungTrang };
