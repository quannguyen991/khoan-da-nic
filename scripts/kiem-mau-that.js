#!/usr/bin/env node
'use strict';
/**
 * Kiểm mẫu thật trước khi commit.
 *
 *   node scripts/kiem-mau-that.js                 kiểm mọi tệp trong eval/mau-that/
 *   node scripts/kiem-mau-that.js duong/tep.jsonl kiểm một tệp (ví dụ bản nháp ngoài repo)
 *
 * LỖI (thoát mã 1): còn SĐT / số tài khoản / CCCD / email / liên kết bấm được,
 * thiếu người duyệt, ngày nhận, hoặc sự đồng ý của người nhận tin.
 * CẢNH BÁO: có thể còn họ tên thật — người duyệt tự nhìn lại.
 *
 * Bộ đo chạy đúng luật này ở napDataset(), nên mẫu chưa đạt sẽ làm
 * `npm run eval` từ chối chạy — không commit được một mẫu lộ danh tính rồi
 * mới phát hiện.
 */

const fs = require('node:fs');
const path = require('node:path');
const { kiemMauThat } = require('../eval/lib/mau-that');

const THU_MUC = path.join(__dirname, '..', 'eval', 'mau-that');
const BAC = ['CHUA_THAY', 'NGHI_NGO', 'CAO'];
const TRUONG = ['id', 'ho', 'kenh', 'ngon_ngu', 'noi_dung', 'muc_do', 'toi_da', 'nguon'];

const dsTep = process.argv[2]
  ? [path.resolve(process.argv[2])]
  : (fs.existsSync(THU_MUC) ? fs.readdirSync(THU_MUC).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(THU_MUC, f)) : []);

if (dsTep.length === 0) {
  console.log('\nChưa có tệp .jsonl nào trong eval/mau-that/. Xem eval/mau-that/README.md.\n');
  process.exit(0);
}

let soLoi = 0;
let soCanhBao = 0;
let soMau = 0;
const daCo = new Set();

for (const tep of dsTep) {
  const ten = path.basename(tep);
  fs.readFileSync(tep, 'utf8').split(/\r?\n/).forEach((d, i) => {
    if (!d.trim()) return;
    const cho = `${ten}:${i + 1}`;
    let o;
    try { o = JSON.parse(d); } catch { console.log(`✖ ${cho} JSON hỏng`); soLoi += 1; return; }
    soMau += 1;
    const loi = [];
    const thieu = TRUONG.filter((t) => o[t] === undefined);
    if (thieu.length) loi.push(`thiếu ${thieu.join(', ')}`);
    if (o.nguon !== 'that') loi.push('"nguon" phải là "that" — mẫu tự soạn để ở eval/dataset/');
    if (!BAC.includes(o.muc_do) || !BAC.includes(o.toi_da)) loi.push('muc_do / toi_da phải là CHUA_THAY | NGHI_NGO | CAO');
    else if (BAC.indexOf(o.toi_da) < BAC.indexOf(o.muc_do)) loi.push('toi_da thấp hơn muc_do');
    if (daCo.has(o.id)) loi.push(`trùng id ${o.id}`);
    daCo.add(o.id);

    const k = kiemMauThat(o);
    loi.push(...k.loi);
    for (const l of loi) console.log(`✖ ${cho} ${o.id || ''} — ${l}`);
    for (const c of k.canhBao) console.log(`⚠ ${cho} ${o.id || ''} — ${c}`);
    soLoi += loi.length;
    soCanhBao += k.canhBao.length;
  });
}

console.log(`\n${soMau} mẫu · ${soLoi} lỗi · ${soCanhBao} cảnh báo`);
if (soLoi > 0) {
  console.log('Sửa hết lỗi rồi mới commit. Bộ đo sẽ từ chối chạy khi còn lỗi.\n');
  process.exit(1);
}
console.log(soCanhBao > 0 ? 'Không có lỗi. Người duyệt đọc lại các cảnh báo trên.\n' : 'Đạt.\n');
