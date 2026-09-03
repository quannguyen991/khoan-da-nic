'use strict';
/**
 * ⛳ CỔNG NGHIỆM THU TẦNG 0 (§2B.2).
 * "Gọi pipeline bằng node, 6 kịch bản mẫu ra đúng mức."
 *
 * Chạy:  node scripts/nghiem-thu-tang-0.js
 * Thoát mã 1 nếu bất kỳ kịch bản nào lệch — dùng được trong CI.
 */

const { analyze, toHopDong } = require('../backend/src/analysis/pipeline');
const { buildTrustReceipt } = require('../backend/src/analysis/trust-receipt-v2');
const { RISK_LABELS } = require('../backend/src/risk-labels');

const KICH_BAN = [
  {
    ten: 'Giả danh công an, đòi chuyển khoản, hối thúc',
    vanBan: 'Tôi là điều tra viên, bác chuyển tiền ngay, chậm là bị phong toả tài khoản.',
    nhan: 'CAO', canThiep: 'PAUSE_60S',
    vi: 'điểm ≥45 nhưng KHÔNG có override — đây là ca Phụ lục B.4',
  },
  {
    ten: 'Tài khoản an toàn (CO-03)',
    vanBan: 'Bác chuyển hết tiền sang tài khoản an toàn của Bộ Công an để bảo toàn.',
    nhan: 'CAO', canThiep: 'PROTECTED_CRITICAL', override: 'CO-03',
  },
  {
    ten: 'Đòi OTP kèm chuyển khoản (CO-01)',
    vanBan: 'Bác đọc mã OTP vừa nhận cho tôi rồi chuyển 20 triệu vào tài khoản này ngay.',
    nhan: 'CAO', canThiep: 'PROTECTED_CRITICAL', override: 'CO-01',
  },
  {
    ten: 'Trộn Việt–Anh, đòi cài phần mềm điều khiển từ xa (CO-02)',
    vanBan: 'Bác ơi, please install AnyDesk so I can help.',
    nhan: 'CAO', canThiep: 'PROTECTED_CRITICAL', override: 'CO-02',
    vi: 'từng bị xếp tiếng Việt thuần nên pack tiếng Anh không chạy và CO-02 im lặng',
  },
  {
    ten: 'Tin lành của người thân',
    vanBan: 'Chiều nay cháu ghé chơi bác nhé.',
    nhan: 'CHUA_THAY', canThiep: 'TRUST_RECEIPT',
  },
  {
    ten: 'Câu cảnh báo chống lừa đảo — KHÔNG được báo động giả',
    vanBan: 'Công an không bao giờ yêu cầu chuyển tiền qua điện thoại.',
    nhan: 'CHUA_THAY', canThiep: 'TRUST_RECEIPT',
    vi: 'chứa đủ mọi từ khoá của một vụ lừa thật — chỉ cấu trúc câu phân biệt được',
  },
];

let hong = 0;
console.log('\n⛳ NGHIỆM THU TẦNG 0 — 6 kịch bản qua pipeline\n');

for (const kb of KICH_BAN) {
  const env = analyze({ vanBan: kb.vanBan });
  const hd = toHopDong(env);
  const bien = buildTrustReceipt(env);

  const lechNhan = hd.nhan !== kb.nhan;
  const lechMan = hd.canThiep !== kb.canThiep;
  const lechOv = kb.override && !env.overrides.includes(kb.override);
  const dat = !lechNhan && !lechMan && !lechOv;
  if (!dat) hong += 1;

  console.log(`${dat ? '✔' : '✖'} ${kb.ten}`);
  console.log(`   "${kb.vanBan}"`);
  console.log(`   nhãn      ${hd.nhan}${lechNhan ? ` ✖ chờ ${kb.nhan}` : ''}`
    + `  — "${RISK_LABELS[env.riskLabel].vi}"`);
  console.log(`   màn hình  ${hd.canThiep}${lechMan ? ` ✖ chờ ${kb.canThiep}` : ''}`);
  console.log(`   điểm      ${env.score}/69  (gốc ${env.baseScore}`
    + `${env.appliedSynergies.length ? ' + ' + env.appliedSynergies.map((s) => `${s.id} +${s.bonus}`).join(' + ') : ''})`);
  console.log(`   override  ${env.overrides.join(', ') || '—'}${lechOv ? ` ✖ chờ ${kb.override}` : ''}`);
  console.log(`   ngôn ngữ  ${env.language}  · pack ${env.activePacks.join(' + ')}`);
  console.log(`   mã lý do  ${hd.maLyDo.join(' ') || '—'}`);
  console.log(`   đã kiểm   ${hd.daKiem.join(', ') || '—'}   · chưa kiểm ${hd.chuaKiem.join(', ')}`);
  console.log(`   họ kịch bản ${hd.hoKichBan || '—'}  · AI đã chạy: ${hd.aiDaChay}`);
  console.log(`   giới hạn  ${bien.limitations.join(', ')}`);
  if (kb.vi) console.log(`   ↳ ${kb.vi}`);
  console.log();
}

console.log(hong === 0
  ? `✅ 6/6 kịch bản đúng mức. Tầng 0 nghiệm thu ĐẠT.\n`
  : `❌ ${hong}/6 kịch bản lệch. Tầng 0 CHƯA đạt.\n`);
process.exit(hong === 0 ? 0 : 1);
