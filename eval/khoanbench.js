'use strict';
/**
 * §2B.6 — BỘ ĐÁNH GIÁ QUỐC TẾ. Cặp với eval/run.js.
 * §6.14 — CỔNG PARITY: đo, không đoán.
 *
 * ⚠️ §6.14: "Ngưỡng chỉ đo được thứ nó nhìn vào. Mọi chỉ số của 18.17 từng đo
 * trên bộ tiếng Anh, nên TIẾNG VIỆT TỤT 15,6 ĐIỂM MÀ MƯỜI NGƯỠNG VẪN XANH — và
 * tiếng Việt mới là ngôn ngữ của người dùng thật."
 * Nên tệp này KHÔNG BAO GIỜ in một con số tổng mà không kèm bảng theo ngôn ngữ.
 *
 * Chạy:  npm run eval:quocte        ·  npm run eval:quocte:ghi
 */

require('dotenv').config({ quiet: true });

const B = require('./lib/bo-danh-gia');
const { buildContext } = require('../backend/src/analysis/context-builder');
const { trichCoThat } = require('../backend/src/analysis/evidence-validator');

const co = (c) => process.argv.includes(c);
const soCo = (t, m) => { const i = process.argv.indexOf(t); return i > 0 ? Number(process.argv[i + 1]) : m; };
const dungAi = co('--ai');
const ghi = co('--ghi');
const songSong = soCo('--song-song', 5);
const gioiHan = soCo('--gioi-han', null);

const pt = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)}%`);
const dau = (ok) => (ok ? '✔' : '✖');

/** §6.14 — cổng parity. Mỗi cổng ghi rõ đo ở ĐÂU, vì đó là chỗ bản trước sai. */
const CONG_PARITY = [
  { ten: 'dangerous recall — vi', lay: (r) => r.parity.theoNgonNgu.vi?.dangerousRecall, nguong: 0.95, huong: 'min' },
  { ten: 'dangerous recall — en', lay: (r) => r.parity.theoNgonNgu.en?.dangerousRecall, nguong: 0.95, huong: 'min' },
  { ten: 'dangerous recall — mixed', lay: (r) => r.parity.theoNgonNgu.mixed?.dangerousRecall, nguong: 0.93, huong: 'min' },
  { ten: 'high-risk FP — vi (mục tiêu)', lay: (r) => r.parity.theoNgonNgu.vi?.highRiskFP, nguong: 0.08, huong: 'max' },
  { ten: 'high-risk FP — vi (trần cứng)', lay: (r) => r.parity.theoNgonNgu.vi?.highRiskFP, nguong: 0.10, huong: 'max' },
  { ten: 'high-risk FP — en (mục tiêu)', lay: (r) => r.parity.theoNgonNgu.en?.highRiskFP, nguong: 0.08, huong: 'max' },
  { ten: 'high-risk FP — en (trần cứng)', lay: (r) => r.parity.theoNgonNgu.en?.highRiskFP, nguong: 0.10, huong: 'max' },
  { ten: 'lệch recall VI↔EN', lay: (r) => r.parity.lechRecall, nguong: 0.03, huong: 'max' },
  { ten: 'lệch high-risk FP VI↔EN', lay: (r) => r.parity.lechFP, nguong: 0.03, huong: 'max' },
  { ten: 'evidence span validity', lay: (r) => r.evidence.tyLeHopLe, nguong: 0.99, huong: 'min' },
];

/** §6.14 — evidence span validity đo trên 4 lát: vi có dấu · vi không dấu · en · mixed. */
function doEvidence(kq) {
  let tong = 0; let hopLe = 0;
  const theoLat = {};
  for (const r of kq) {
    const lat = r.mau.ngon_ngu;
    theoLat[lat] = theoLat[lat] || { tong: 0, hopLe: 0 };
    const ctx = buildContext(r.mau.noi_dung);
    for (const s of r.signals || []) {
      for (const e of s.evidence || []) {
        tong += 1; theoLat[lat].tong += 1;
        if (trichCoThat(e.quote, ctx)) { hopLe += 1; theoLat[lat].hopLe += 1; }
      }
    }
  }
  const tyLe = (a, b) => (b === 0 ? null : a / b);
  return {
    tong,
    hopLe,
    tyLeHopLe: tyLe(hopLe, tong),
    theoLat: Object.fromEntries(Object.entries(theoLat)
      .map(([k, v]) => [k, { ...v, tyLe: tyLe(v.hopLe, v.tong) }])),
  };
}

(async () => {
  const { mau: tatCa, loi } = B.napDataset();
  if (loi.length) { console.log('\n✖ DỮ LIỆU HỎNG:'); loi.slice(0, 20).forEach((l) => console.log('  ', l)); process.exit(1); }
  const mau = gioiHan ? tatCa.slice(0, gioiHan) : tatCa;

  console.log(`\n🌍 KHOANBENCH — ĐÁNH GIÁ QUỐC TẾ ${dungAi ? 'BỘ LUẬT + AI' : 'CHỈ BỘ LUẬT'}`);
  console.log(`   ${mau.length} mẫu\n`);

  const kq = await B.chayTatCa(mau, {
    dungAi,
    songSong,
    moiMau: (i, n) => { if (dungAi && (i % 25 === 0 || i === n)) process.stdout.write(`\r   …${i}/${n}`); },
  });
  if (dungAi) process.stdout.write('\r');

  const tranHong = B.kiemTranLuotHong(kq);
  if (tranHong.vuotTran) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✖ TỪ CHỐI CÔNG BỐ SỐ — VƯỢT TRẦN LƯỢT HỎNG (§4.3)           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`   hỏng ${tranHong.soHong}/${kq.length} = ${pt(tranHong.tyLeHong)}, trần ${pt(tranHong.tran)}`);
    console.log(`   theo HTTP status: ${JSON.stringify(tranHong.theoStatus)}`);
    if (tranHong.viDu) console.log(`   ví dụ: ${tranHong.viDu}`);
    process.exit(1);
  }

  const bao = {
    metadata: B.dungMetadata({ mau, dungAi }),
    chiSo: B.tinhChiSo(kq),
    parity: B.tinhParity(kq),
    mauThat: B.thongKeMauThat(kq),
    evidence: doEvidence(kq),
    tranHong,
  };

  // ⚠️ BẢNG THEO NGÔN NGỮ IN TRƯỚC. Con số tổng in sau, và luôn kèm cảnh báo.
  console.log('── THEO TỪNG NGÔN NGỮ (§6.14 — bảng này in TRƯỚC mọi con số tổng) ──');
  console.log('  lát     n   recall      FP   đạt');
  for (const [ng, c] of Object.entries(bao.parity.theoNgonNgu)) {
    console.log(`  ${ng.padEnd(6)}${String(c.tongMau).padStart(4)}`
      + `  ${pt(c.dangerousRecall).padStart(7)} ${pt(c.highRiskFP).padStart(7)} ${pt(c.tyLeDat).padStart(6)}`);
  }
  console.log(`\n  ⚠️ Tổng gộp ${pt(bao.chiSo.tyLeDat)} — ĐỪNG TIN con số này một mình.`);
  console.log('     Bản trước có tiếng Việt tụt 15,6 điểm mà mười ngưỡng vẫn xanh.');

  console.log('\n── EVIDENCE SPAN VALIDITY (§6.14) ──');
  console.log(`  tổng ${bao.evidence.hopLe}/${bao.evidence.tong} = ${pt(bao.evidence.tyLeHopLe)}`);
  for (const [lat, v] of Object.entries(bao.evidence.theoLat)) {
    console.log(`  ${lat.padEnd(6)} ${v.hopLe}/${v.tong} = ${pt(v.tyLe)}`);
  }

  console.log('\n── CỔNG PARITY ──');
  let hong = 0;
  for (const c of CONG_PARITY) {
    const v = c.lay(bao);
    if (v === null || v === undefined) { console.log(`  — ${c.ten.padEnd(30)} không đo được`); continue; }
    const ok = c.huong === 'min' ? v >= c.nguong : v <= c.nguong;
    if (!ok) hong += 1;
    console.log(`  ${dau(ok)} ${c.ten.padEnd(30)} ${pt(v).padStart(7)}  (${c.huong === 'min' ? '≥' : '≤'} ${pt(c.nguong)})`);
  }

  // §6.14 — vượt khoảng chênh thì PHẢI công bố, và cấm dùng chữ "equivalent performance".
  const lech = bao.parity.lechRecall;
  if (lech !== null && lech > 0.03) {
    console.log('\n  ⚠️ KHOẢNG CHÊNH PARITY VƯỢT 3 ĐIỂM PHẦN TRĂM.');
    console.log(`     Safety Card PHẢI công bố khoảng chênh ${pt(lech)}`);
    console.log('     và KHÔNG được dùng từ "equivalent performance" (§6.14).');
  }

  console.log('\n── MẪU THẬT (in SỐ ĐẾM) ──');
  console.log(bao.mauThat.coMauThat
    ? `  bắt đúng ${bao.mauThat.nguyHiemBatDuoc}/${bao.mauThat.nguyHiemTong} tin nhắn thật nguy hiểm`
    : '  ✖ KHÔNG có mẫu nguon="that". Mọi số trên đây đo trên mẫu TỰ SOẠN.');

  console.log('\n── METADATA ──');
  for (const [k, v] of Object.entries(bao.metadata)) console.log(`  ${k.padEnd(16)} ${v === null ? '—' : v}`);

  if (ghi) console.log(`\n  đã ghi ${B.ghiKetQua(bao, 'khoanbench.json')}`);
  console.log(`\n${hong === 0 ? '✅ Mọi cổng parity đạt.' : `⚠️ ${hong} cổng parity chưa đạt.`}\n`);
})();
