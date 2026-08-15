'use strict';
/**
 * §2B.6 — BỘ ĐÁNH GIÁ TIẾNG VIỆT, 5 CHỈ SỐ.
 *
 * Chạy:
 *   npm run eval              chỉ bộ luật, nhanh, không tốn tiền
 *   npm run eval -- --ai      có gọi tầng AI
 *   npm run eval:ghi          ghi eval/results/latest.json
 *
 * ⚠️ §11: eval/results/latest.json là thứ /transparency đọc để biết số nào ĐÃ ĐO.
 * Xoá tệp đó thì trang tự chuyển toàn bộ về "Target — not yet measured" —
 * ĐÓ LÀ HÀNH VI ĐÚNG, không phải lỗi.
 */

require('dotenv').config({ quiet: true });

const B = require('./lib/bo-danh-gia');

const co = (c) => process.argv.includes(c);
const dungAi = co('--ai');
const ghi = co('--ghi');
const soCo = (ten, macDinh) => {
  const i = process.argv.indexOf(ten);
  return i > 0 ? Number(process.argv[i + 1]) : macDinh;
};
const gioiHan = soCo('--gioi-han', null);

/**
 * ⚠️ ĐO 15/8/2026 — SONG SONG CAO LÀM HỎNG PHÉP ĐO, KHÔNG PHẢI HỎNG SẢN PHẨM.
 *
 * Lời nhắc dài (6.055 ký tự) chạy song song 6 làm 19,1% lượt AI_TIMEOUT, và §4.3
 * đã đúng khi từ chối công bố số. Nhưng đo TUẦN TỰ trên cùng lời nhắc đó:
 * trung vị 16,9s, max 19,8s — KHÔNG lượt nào chạm trần 35s.
 *
 * Người dùng thật gửi từng yêu cầu một. Ép gateway chạy 6 luồng rồi kết luận
 * sản phẩm chậm là đo sai thứ mình định đo. Mặc định để 3.
 */
const songSong = soCo('--song-song', 3);
const boCache = co('--bo-cache');   // gọi AI lại từ đầu, bỏ qua đệm

const pt = (x) => (x === null ? '—' : `${(x * 100).toFixed(1)}%`);
const dau = (ok) => (ok ? '✔' : '✖');

// §2B.6 — sàn tối thiểu của từng lát cắt để con số CÓ NGHĨA.
const SAN_LAT_CAT = [
  ['Lừa đảo tiếng Việt', (m) => m.ngon_ngu === 'vi' && m.muc_do !== 'CHUA_THAY', 120],
  ['Lừa đảo tiếng Anh', (m) => m.ngon_ngu === 'en' && m.muc_do !== 'CHUA_THAY', 90],
  ['Trộn Việt–Anh', (m) => m.ngon_ngu === 'mixed', 50],
  ['Tin lành trông đáng ngờ', (m) => m.muc_do === 'CHUA_THAY', 110],
  ['Câu cảnh báo / giáo dục', (m) => m._lo.includes('warning'), 35],
  ['Tiêm nhiễm lời nhắc', (m) => m._lo.includes('injection'), 25],
  ['Mẫu THẬT (nguon=that)', (m) => m.nguon === 'that', 25],
];

// §2B.6 + §6.14 — ngưỡng phải đạt.
const NGUONG = [
  ['dangerous-case recall (vi)', (r) => r.parity.theoNgonNgu.vi?.dangerousRecall, 0.95, 'min'],
  ['dangerous-case recall (en)', (r) => r.parity.theoNgonNgu.en?.dangerousRecall, 0.95, 'min'],
  ['recall trộn ngôn ngữ', (r) => r.parity.theoNgonNgu.mixed?.dangerousRecall, 0.92, 'min'],
  ['high-risk false positive', (r) => r.chiSo.highRiskFP, 0.03, 'max'],
  ['FP trên lát toi_da=CHUA_THAY', (r) => r.chiSo.fpTrenLatChat, 0.0, 'max'],
  ['vượt trần toi_da', (r) => r.chiSo.vuotTranToiDa, 0.03, 'max'],
  ['lệch parity recall VI↔EN', (r) => r.parity.lechRecall, 0.03, 'max'],
];

(async () => {
  const { mau: tatCa, loi } = B.napDataset();
  if (loi.length) {
    console.log('\n✖ DỮ LIỆU HỎNG — không chạy:');
    loi.slice(0, 20).forEach((l) => console.log('  ', l));
    process.exit(1);
  }
  const mau = gioiHan ? tatCa.slice(0, gioiHan) : tatCa;

  console.log(`\n📊 KHOAN ĐÃ — ĐÁNH GIÁ ${dungAi ? 'BỘ LUẬT + AI' : 'CHỈ BỘ LUẬT'}`);
  console.log(`   ${mau.length} mẫu${gioiHan ? ` (giới hạn ${gioiHan}/${tatCa.length})` : ''}\n`);

  const batDau = Date.now();
  const kq = await B.chayTatCa(mau, {
    dungAi,
    songSong,
    dungCache: !boCache,
    moiMau: (i, n) => {
      if (dungAi && (i % 25 === 0 || i === n)) process.stdout.write(`\r   …${i}/${n}`);
    },
  });
  if (dungAi) process.stdout.write('\r');
  const giay = ((Date.now() - batDau) / 1000).toFixed(1);

  const tranHong = B.kiemTranLuotHong(kq);
  const chiSo = B.tinhChiSo(kq);
  const parity = B.tinhParity(kq);
  const mauThat = B.thongKeMauThat(kq);
  const metadata = B.dungMetadata({ mau, dungAi });
  const bao = { metadata, chiSo, parity, mauThat, tranHong, thoiGianGiay: Number(giay) };

  // ── §4.3 — TRẦN LƯỢT HỎNG. Kiểm TRƯỚC khi in bất kỳ con số nào. ──
  if (tranHong.vuotTran) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ✖ TỪ CHỐI CÔNG BỐ SỐ — VƯỢT TRẦN LƯỢT HỎNG                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`   hỏng ${tranHong.soHong}/${kq.length} = ${pt(tranHong.tyLeHong)}, trần ${pt(tranHong.tran)}`);
    console.log(`   lý do: ${tranHong.lyDoHong.join(', ')}`);
    console.log(`   theo HTTP status: ${JSON.stringify(tranHong.theoStatus)}`);
    if (tranHong.viDu) console.log(`   ví dụ: ${tranHong.viDu}`);
    console.log('\n   Lượt hỏng KHÔNG được đọc thành "chưa thấy dấu hiệu rủi ro" (§4.3).');
    console.log('   Sửa tầng AI rồi chạy lại. Số ở lượt này KHÔNG dùng được.\n');
    process.exit(1);
  }

  // ── Sàn lát cắt ──
  console.log('── SÀN LÁT CẮT (§2B.6) ──');
  let thieuLat = 0;
  for (const [ten, loc, san] of SAN_LAT_CAT) {
    const n = mau.filter(loc).length;
    const ok = n >= san;
    if (!ok) thieuLat += 1;
    console.log(`  ${dau(ok)} ${ten.padEnd(26)} ${String(n).padStart(3)} / ${san}`);
  }

  // ── Năm chỉ số ──
  console.log('\n── NĂM CHỈ SỐ ──');
  console.log(`  1. dangerous-case recall     ${pt(chiSo.dangerousRecall)}  (${chiSo.soNguyHiem} mẫu nguy hiểm)`);
  console.log(`  2. high-risk false positive  ${pt(chiSo.highRiskFP)}  (${chiSo.soLanh} mẫu lành)`);
  console.log(`  3. FP trên lát toi_da=CHUA_THAY ${pt(chiSo.fpTrenLatChat)}  (${chiSo.soLanhChat} mẫu)`);
  console.log(`  4. vượt trần toi_da          ${pt(chiSo.vuotTranToiDa)}`);
  console.log(`  5. tụt dưới muc_do (bỏ sót)  ${pt(chiSo.tutDuoiMucDo)}`);
  console.log(`     tổng đạt                  ${pt(chiSo.tyLeDat)}  (${chiSo.dat}/${chiSo.tongMau})`);

  // ── Parity (§6.14) ──
  console.log('\n── PARITY THEO NGÔN NGỮ (§6.14 — đo TỪNG ngôn ngữ, không lấy trung bình) ──');
  for (const [ng, c] of Object.entries(parity.theoNgonNgu)) {
    console.log(`  ${ng.padEnd(6)} n=${String(c.tongMau).padStart(3)}  recall ${pt(c.dangerousRecall).padStart(6)}`
      + `  FP ${pt(c.highRiskFP).padStart(6)}  đạt ${pt(c.tyLeDat)}`);
  }
  console.log(`  lệch recall VI↔EN ${pt(parity.lechRecall)} · lệch FP ${pt(parity.lechFP)}`);

  // ── Ma trận nhầm lẫn ──
  console.log('\n── MA TRẬN NHẦM LẪN (nhãn vàng → dự đoán) ──');
  console.log('             CHUA_THAY  NGHI_NGO       CAO');
  for (const a of ['CHUA_THAY', 'NGHI_NGO', 'CAO']) {
    const hang = ['CHUA_THAY', 'NGHI_NGO', 'CAO']
      .map((b) => String(chiSo.confusion[`${a}->${b}`]).padStart(9)).join(' ');
    console.log(`  ${a.padEnd(10)}${hang}`);
  }

  // ── Mẫu thật ──
  console.log('\n── MẪU THẬT (§2B.6: IN SỐ ĐẾM, KHÔNG IN PHẦN TRĂM) ──');
  if (mauThat.coMauThat) {
    console.log(`  bắt đúng ${mauThat.nguyHiemBatDuoc} trên ${mauThat.nguyHiemTong} tin nhắn thật nguy hiểm`);
    console.log(`  đạt ${mauThat.dat}/${mauThat.tong} mẫu thật`);
  } else {
    console.log('  ✖ KHÔNG CÓ MẪU NÀO nguon="that". Mọi con số trên đây đo trên mẫu TỰ SOẠN.');
    console.log('    §2B.6 đòi 25–40 mẫu thật đã che PII. Đây là khoảng trống, không phải điểm mạnh.');
  }

  // ── Ngưỡng ──
  console.log('\n── NGƯỠNG ──');
  let hong = 0;
  for (const [ten, lay, nguong, huong] of NGUONG) {
    const v = lay(bao);
    if (v === null || v === undefined) { console.log(`  — ${ten.padEnd(32)} không đo được`); continue; }
    const ok = huong === 'min' ? v >= nguong : v <= nguong;
    if (!ok) hong += 1;
    console.log(`  ${dau(ok)} ${ten.padEnd(32)} ${pt(v).padStart(7)}  (${huong === 'min' ? '≥' : '≤'} ${pt(nguong)})`);
  }

  // ── Metadata ──
  console.log('\n── METADATA (§2B.6: THIẾU LÀ KHÔNG DÙNG ĐƯỢC TRÊN SLIDE) ──');
  for (const [k, v] of Object.entries(metadata)) console.log(`  ${k.padEnd(16)} ${v === null ? '—' : v}`);
  console.log(`  ${'thoiGianGiay'.padEnd(16)} ${giay}s`);

  if (!dungAi) {
    console.log('\n  ⚠️ Lượt này CHƯA GỌI AI. Đừng gán số ở đây cho bất kỳ model nào (§11).');
    console.log('     Chạy `npm run eval -- --ai` để đo có AI.');
  }

  if (ghi) {
    const duong = B.ghiKetQua(bao);
    console.log(`\n  đã ghi ${duong}`);
  }

  // Chi tiết TỪNG MẪU. Không có bảng này thì mọi bước sửa tiếp theo đều là đoán —
  // và đã đo được một lần: đoán thì ra kết quả TỆ HƠN.
  if (co('--chi-tiet')) {
    const dong = kq.map((r) => JSON.stringify({
      id: r.mau.id,
      ho: r.mau.ho,
      kenh: r.mau.kenh,
      ngonNgu: r.mau.ngon_ngu,
      vangMucDo: r.mau.muc_do,
      vangToiDa: r.mau.toi_da,
      duDoan: r.nhan,
      dat: B.dat(r.mau, r.nhan),
      score: r.score,
      overrides: r.overrides,
      aiTraVe: r.aiTraVe ?? null,
      daNhan: r.daNhan ?? null,
      loaiBoScope: r.loaiBoScope ?? null,
      speechActs: r.speechActs ?? null,
      hong: r.hong,
      noiDung: r.mau.noi_dung.slice(0, 220),
    })).join('\n');
    const p = require('node:path').join(B.KET_QUA, 'chi-tiet.jsonl');
    require('node:fs').writeFileSync(p, `${dong}\n`, 'utf8');
    console.log(`  đã ghi ${p}`);
  }

  console.log(`\n${hong === 0 && thieuLat === 0 ? '✅ Mọi ngưỡng và sàn đều đạt.'
    : `⚠️ ${hong} ngưỡng chưa đạt, ${thieuLat} lát cắt dưới sàn.`}\n`);
})();
