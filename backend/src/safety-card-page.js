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
 *
 * ══════════ HAI THỨ THÊM NGÀY 6/9/2026 ══════════
 *
 * 1. TIẾNG ANH. Trang này là artifact chứng minh sự nghiêm túc của dự án, và
 *    trước hôm nay nó chỉ có tiếng Việt — trong khi mọi cuộc thi đều đọc bằng
 *    tiếng Anh. Giao diện app đã đủ 748/748 khoá tiếng Anh từ lâu; đúng cái
 *    trang quan trọng nhất thì chưa. `?lang=en` nay đổi ngôn ngữ thật.
 *
 * 2. TẦNG QUÉT TIN NHẮN ĐẾN. `khoanbench` không hề chạm `backend/src/detect/`,
 *    nên nửa sản phẩm đó chưa từng có con số nào ở đây. Im lặng về một nửa cũng
 *    là nói không đủ sự thật.
 *
 * ⚠️ MỌI CHUỖI NGƯỜI ĐỌC PHẢI NẰM TRONG `CHU`. Nhét thẳng tiếng Việt vào HTML
 * là cách chắc chắn nhất để bản tiếng Anh lệch dần rồi không ai nhận ra.
 */

const { dungSafetyCard } = require('./safety-card');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const pt = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`);

const CHU = {
  vi: {
    tieuDe: 'Khoan Đã — Chúng tôi đo được gì',
    h1: 'Khoan Đã — chúng tôi đo được gì, và chưa đo được gì',
    moDau: 'Trang này tách <strong>mục tiêu</strong> khỏi <strong>số đã đo</strong>. '
      + 'Chỗ nào chưa chạy phép đo, chúng tôi ghi thẳng là chưa đo — không điền con số '
      + 'mục tiêu vào cho đẹp.',
    canDocTruoc: 'Cần đọc trước:',
    hKetQua: 'Kết quả — đường “bác dán nội dung vào ô kiểm tra”',
    thChiSo: 'Chỉ số',
    thMucTieu: 'Mục tiêu',
    thDaDo: 'Đã đo',
    thNguon: 'Nguồn',
    chuaDo: 'Mục tiêu — chưa đo',
    dat: '✔ đạt',
    chuaDat: '✖ chưa đạt',

    hTangQuet: 'Kết quả — đường “tự quét tin nhắn đến”',
    tangQuetMoDau: 'Đây là nửa thứ hai của sản phẩm: máy đọc thông báo tin nhắn đến và '
      + 'tự cảnh báo, bác không phải bấm gì. Nó chạy bằng luật cứng, <strong>không gọi AI '
      + 'và không cần mạng</strong>. Hai bảng dưới đây đo cùng một bộ luật trên hai bộ mẫu '
      + 'khác nhau, và khoảng cách giữa chúng mới là điều đáng đọc.',
    thBoMau: 'Bộ mẫu',
    tangQuetNho: 'Bộ mẫu dùng để chỉnh luật',
    tangQuetLon: 'Bộ 571 mẫu, không có người gửi',
    mBatDuoc: 'Bắt được ca nguy hiểm',
    mPrecision: 'Trong số bị chấm “Nguy hiểm cao”, bao nhiêu phần đúng là nguy hiểm',
    mBaoDo: 'Tin lành bị chấm “Nguy hiểm cao”',
    mVuotTran: 'Tin lành vượt trần đã khai',
    tangQuetCanhBao: 'Ba điều phải đọc cùng hai con số trên, không được tách ra:',
    tqC1: '<strong>100% ở bảng bên trái là đo lại chính bài đã học thuộc.</strong> '
      + 'Các luật được chỉnh trên đúng 86 mẫu ấy. Đừng trích con số đó ra ngoài.',
    tqC2: '<strong>Bảng bên phải là một cái SÀN, không phải hiệu năng thật.</strong> '
      + 'Bộ 571 mẫu không có trường người gửi, nên ba luật mạnh nhất — số di động xưng danh '
      + 'tổ chức, link từ người lạ, người lạ đòi tiền — không bao giờ nổ được ở đó. '
      + 'Tin nhắn ngoài đời luôn có người gửi.',
    tqC3: '<strong>Bộ 571 mẫu cũng không phải bộ giữ riêng sạch.</strong> Mười luật gần '
      + 'đây được dựng sau khi xem họ nào trượt trên chính nó. Không mẫu nào bị khớp riêng, '
      + 'nhưng hướng thiết kế thì có nhìn vào đây.',

    hQuyetDinh: 'Cách hệ thống quyết định',
    quyetDinh: 'AI chỉ đọc nội dung và <strong>bật cờ tín hiệu</strong>. Mức rủi ro cuối cùng '
      + 'do một bộ luật cố định quyết định — AI không có đường nào tự đặt mức.',
    dSoTinHieu: 'Số tín hiệu',
    dCritical: 'Quy tắc khẩn cấp',
    dCongHuong: 'Tổ hợp cộng hưởng',
    dThangDiem: 'Thang điểm',
    dNguong: 'ngưỡng',
    dPhienBan: 'Phiên bản bộ luật',

    hNguonDo: 'Phép đo này lấy từ đâu',
    dCommit: 'Commit',
    dBoDuLieu: 'Bộ dữ liệu',
    dMau: 'mẫu',
    dCheDo: 'Chế độ',
    dModel: 'Model',
    khongGoiAi: 'không có — lượt đo này không gọi AI',
    chuaCoPhepDo: 'Chưa có phép đo nào được ghi lại. Khi <code>eval/results/latest.json</code> '
      + 'không tồn tại, trang này hiển thị toàn bộ là “mục tiêu — chưa đo”. Đó là hành vi '
      + 'đúng, không phải lỗi.',
    wcag: 'Mục tiêu của sản phẩm là WCAG 2.2 AA. Chúng tôi chưa chạy đủ kiểm tra tự động '
      + 'và thủ công để tuyên bố đã tuân thủ.',
    doiNgonNgu: 'English',
    doiNgonNguHref: '/transparency?lang=en',
  },

  en: {
    tieuDe: 'Khoan Đã — What we have measured',
    h1: 'Khoan Đã — what we have measured, and what we have not',
    moDau: 'This page keeps <strong>targets</strong> separate from <strong>measured '
      + 'results</strong>. Where no measurement has been run, we say so — we do not print '
      + 'the target as if it were a result.',
    canDocTruoc: 'Read this first:',
    hKetQua: 'Results — the “paste something and check it” path',
    thChiSo: 'Metric',
    thMucTieu: 'Target',
    thDaDo: 'Measured',
    thNguon: 'Source',
    chuaDo: 'Target — not yet measured',
    dat: '✔ met',
    chuaDat: '✖ not met',

    hTangQuet: 'Results — the “scan incoming messages” path',
    tangQuetMoDau: 'This is the other half of the product: the phone reads incoming message '
      + 'notifications and warns on its own, with nothing for the user to press. It runs on '
      + 'fixed rules, <strong>calls no AI and needs no network</strong>. The two tables below '
      + 'measure the same rules against two different sample sets, and the gap between them '
      + 'is the part worth reading.',
    thBoMau: 'Sample set',
    tangQuetNho: 'The set the rules were tuned on',
    tangQuetLon: '571 samples, no sender field',
    mBatDuoc: 'Dangerous messages caught',
    mPrecision: 'Of those labelled “High risk”, how many really were',
    mBaoDo: 'Safe messages labelled “High risk”',
    mVuotTran: 'Safe messages above their declared ceiling',
    tangQuetCanhBao: 'Three things that must be read alongside those numbers, never separated from them:',
    tqC1: '<strong>The 100% on the left is the model re-sitting the exam it studied.</strong> '
      + 'The rules were tuned on those exact 86 samples. Do not quote that number on its own.',
    tqC2: '<strong>The right-hand table is a FLOOR, not real-world performance.</strong> '
      + 'The 571-sample set has no sender field, so the three strongest rules — a mobile number '
      + 'claiming to be an institution, a link from an unknown sender, a stranger asking for money '
      + '— can never fire there. Real messages always have a sender.',
    tqC3: '<strong>The 571-sample set is not a clean hold-out either.</strong> Ten of the recent '
      + 'rules were written after looking at which scam families failed on it. No individual sample '
      + 'was fitted, but the design direction did look at this data.',

    hQuyetDinh: 'How the system decides',
    quyetDinh: 'The AI only reads the content and <strong>raises signal flags</strong>. The final '
      + 'risk level is decided by a fixed rule engine — the AI has no path to set a level itself.',
    dSoTinHieu: 'Signals',
    dCritical: 'Critical overrides',
    dCongHuong: 'Synergy combinations',
    dThangDiem: 'Score range',
    dNguong: 'thresholds',
    dPhienBan: 'Rule engine version',

    hNguonDo: 'Where this measurement came from',
    dCommit: 'Commit',
    dBoDuLieu: 'Dataset',
    dMau: 'samples',
    dCheDo: 'Mode',
    dModel: 'Model',
    khongGoiAi: 'none — this run did not call any AI',
    chuaCoPhepDo: 'No measurement has been recorded. When <code>eval/results/latest.json</code> '
      + 'does not exist, this page shows everything as “target — not yet measured”. That is the '
      + 'correct behaviour, not a bug.',
    wcag: 'The product targets WCAG 2.2 AA. We have not run enough automated and manual checks '
      + 'to claim compliance.',
    doiNgonNgu: 'Tiếng Việt',
    doiNgonNguHref: '/transparency',
  },
};

const TEN_CHI_SO = {
  vi: {
    dangerous_recall_vi: 'Bắt được ca nguy hiểm — tiếng Việt',
    dangerous_recall_en: 'Bắt được ca nguy hiểm — tiếng Anh',
    dangerous_recall_mixed: 'Bắt được ca nguy hiểm — trộn hai thứ tiếng',
    high_risk_fp: 'Báo động đỏ nhầm trên tin lành',
    fp_lat_chua_thay: 'Báo nhầm trên lát tin lành chặt nhất',
    lech_parity_vi_en: 'Khoảng chênh Việt ↔ Anh',
  },
  en: {
    dangerous_recall_vi: 'Dangerous messages caught — Vietnamese',
    dangerous_recall_en: 'Dangerous messages caught — English',
    dangerous_recall_mixed: 'Dangerous messages caught — mixed languages',
    high_risk_fp: 'Safe messages wrongly labelled high risk',
    fp_lat_chua_thay: 'False alarms on the strictest safe slice',
    lech_parity_vi_en: 'Gap between Vietnamese and English',
  },
};

const TEN_CANH_BAO = {
  vi: {
    chua_co_phep_do_nao: 'Chưa có phép đo nào. Mọi con số dưới đây là MỤC TIÊU, không phải kết quả.',
    so_lieu_do_khi_khong_co_ai: 'Số liệu này đo khi KHÔNG có tầng AI chạy. Nó là sàn của bộ luật, không phải hiệu năng đầy đủ.',
    khong_co_mau_that: 'Bộ dữ liệu KHÔNG có mẫu thật nào. Mọi con số đo trên mẫu tự soạn.',
    lech_parity_vuot_3_diem: 'Khoảng chênh giữa hai ngôn ngữ vượt 3 điểm phần trăm. Không được mô tả hai ngôn ngữ là tương đương.',
    vuot_tran_luot_hong: 'Phép đo này vượt trần lượt hỏng. Không dùng được.',
  },
  en: {
    chua_co_phep_do_nao: 'No measurement has been run. Every number below is a TARGET, not a result.',
    so_lieu_do_khi_khong_co_ai: 'These numbers were measured with the AI layer switched off. They are the rule engine’s floor, not full performance.',
    khong_co_mau_that: 'The dataset contains NO real-world samples. Every number is measured on samples we wrote ourselves.',
    lech_parity_vuot_3_diem: 'The gap between the two languages exceeds 3 percentage points. The two languages must not be described as equivalent.',
    vuot_tran_luot_hong: 'This run exceeded the failed-call ceiling. It is not usable.',
  },
};

/** Bảng bốn dòng cho một bộ mẫu của tầng quét. */
function bangTangQuet(t, k, soMau) {
  if (!k) return '';
  const dong = [
    [t.mBatDuoc, k.batDuoc],
    [t.mPrecision, k.precisionCao],
    [t.mBaoDo, k.baoDoNhamTrenTinLanh],
    [t.mVuotTran, k.vuotTranTinLanh],
  ].map(([nhan, v]) => `<tr><th scope="row">${esc(nhan)}</th><td><strong>${esc(pt(v))}</strong></td></tr>`).join('\n');
  return `<table>
<thead><tr><th>${esc(t.thBoMau)}</th><th>${esc(soMau)}</th></tr></thead>
<tbody>
${dong}
</tbody>
</table>`;
}

function khoiTangQuet(t, tq) {
  if (!tq) return '';
  const nho = tq.chiSo;
  const lon = tq.boLon;
  const nhanNho = `${t.tangQuetNho} · ${nho.soMau.tong}`;
  const nhanLon = lon ? `${t.tangQuetLon} · ${lon.soMau.tong}` : '';
  return `
<h2>${esc(t.hTangQuet)}</h2>
<p>${t.tangQuetMoDau}</p>
${bangTangQuet(t, nho, nhanNho)}
${lon ? bangTangQuet(t, lon, nhanLon) : ''}
<section class="canh-bao"><strong>${esc(t.tangQuetCanhBao)}</strong>
<ul>
<li>${t.tqC1}</li>
<li>${t.tqC2}</li>
<li>${t.tqC3}</li>
</ul></section>`;
}

function dungTrang(the = dungSafetyCard(), ngonNgu = 'vi') {
  const ng = ngonNgu === 'en' ? 'en' : 'vi';
  const t = CHU[ng];
  const tenChiSo = TEN_CHI_SO[ng];
  const tenCanhBao = TEN_CANH_BAO[ng];

  const hang = the.chiSo.map((c) => {
    const nhan = tenChiSo[c.ma] || c.ma;
    const huong = c.huong === 'min' ? '≥' : '≤';
    const doi = `${huong} ${pt(c.mucTieu)}`;
    if (!c.daDo) {
      return `<tr class="chua-do"><th scope="row">${esc(nhan)}</th>`
        + `<td>${esc(doi)}</td><td class="nhan-chua-do">${esc(t.chuaDo)}</td>`
        + `<td>${esc(c.nguonMucTieu)}</td></tr>`;
    }
    const dat = c.trangThai === 'dat';
    return `<tr class="${dat ? 'dat' : 'chua-dat'}"><th scope="row">${esc(nhan)}</th>`
      + `<td>${esc(doi)}</td><td><strong>${esc(pt(c.giaTri))}</strong> ${dat ? esc(t.dat) : esc(t.chuaDat)}</td>`
      + `<td>${esc(c.nguonMucTieu)}</td></tr>`;
  }).join('\n');

  const canhBao = the.canhBao.map((m) => `<li>${esc(tenCanhBao[m] || m)}</li>`).join('\n');

  const k = the.kienTruc;
  const n = the.nguonDo;

  return `<!doctype html>
<html lang="${ng}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.tieuDe)}</title>
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
  .doi-ngon-ngu { display:inline-block; margin-bottom:1rem; color:var(--mo); }
</style>
</head>
<body>
<main>
<a class="doi-ngon-ngu" href="${esc(t.doiNgonNguHref)}">${esc(t.doiNgonNgu)}</a>

<h1>${esc(t.h1)}</h1>

<p>${t.moDau}</p>

${the.canhBao.length ? `<section class="canh-bao"><strong>${esc(t.canDocTruoc)}</strong>
<ul>
${canhBao}
</ul></section>` : ''}

<h2>${esc(t.hKetQua)}</h2>
<table>
<thead><tr><th>${esc(t.thChiSo)}</th><th>${esc(t.thMucTieu)}</th><th>${esc(t.thDaDo)}</th><th>${esc(t.thNguon)}</th></tr></thead>
<tbody>
${hang}
</tbody>
</table>
${khoiTangQuet(t, the.tangQuet)}

<h2>${esc(t.hQuyetDinh)}</h2>
<p>${t.quyetDinh}</p>
<dl>
  <dt>${esc(t.dSoTinHieu)}</dt><dd>${k.soTinHieu}</dd>
  <dt>${esc(t.dCritical)}</dt><dd>${k.soCriticalOverride}</dd>
  <dt>${esc(t.dCongHuong)}</dt><dd>${k.soToHopCongHuong}</dd>
  <dt>${esc(t.dThangDiem)}</dt><dd>${esc(k.thangDiem)}, ${esc(t.dNguong)} ${esc(k.nguong)}</dd>
  <dt>${esc(t.dPhienBan)}</dt><dd><code>${esc(k.ruleVersion)}</code></dd>
</dl>

<h2>${esc(t.hNguonDo)}</h2>
${n ? `<dl>
  <dt>${esc(t.dCommit)}</dt><dd><code>${esc(n.commitSha)}</code></dd>
  <dt>${esc(t.dBoDuLieu)}</dt><dd><code>${esc(n.datasetVersion)}</code> · ${n.datasetSize} ${esc(t.dMau)}</dd>
  <dt>${esc(t.dCheDo)}</dt><dd>${esc(n.cheDo)}</dd>
  <dt>${esc(t.dModel)}</dt><dd>${n.model ? `<code>${esc(n.model)}</code>` : esc(t.khongGoiAi)}</dd>
</dl>` : `<p class="ghi-chu">${t.chuaCoPhepDo}</p>`}

<p class="ghi-chu">${esc(t.wcag)}</p>
</main>
</body>
</html>`;
}

module.exports = { dungTrang };
