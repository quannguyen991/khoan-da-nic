'use strict';
/**
 * SINH MẪU TIẾNG VIỆT KHÔNG DẤU TỪ MẪU ĐÃ CÓ.
 *
 * §2B.6 có tiền lệ đúng cho cách làm này:
 *   "Nhiễu OCR — KHÔNG SOẠN MẪU RIÊNG. Lấy 10 mẫu đã có, làm hỏng chữ BẰNG HÀM
 *    (l→1, i→1, bỏ dấu) rồi chạy lại."
 *
 * Nên đây là biến đổi CƠ HỌC, không phải "diễn giải lại câu cũ" mà §2B.6 cấm.
 *
 * ⚠️ MẪU DẪN XUẤT LÀ BẢN SAO GẦN CỦA MẪU GỐC. Đếm chúng vào số tổng là đếm cùng
 * một tin nhắn hai lần, và làm mọi chỉ số lệch theo hướng không ai kiểm được.
 * Nên mỗi mẫu mang `dan_xuat_tu` trỏ về mẫu gốc, và bộ đánh giá LOẠI chúng khỏi
 * số tổng, chỉ báo riêng thành một lát cắt.
 *
 * Chạy:  node scripts/sinh-mau-khong-dau.js         xem trước
 *        node scripts/sinh-mau-khong-dau.js --ghi   ghi eval/dataset/10-vi-khong-dau.jsonl
 */

const fs = require('node:fs');
const path = require('node:path');

const { boDau } = require('../backend/src/analysis/context-builder');
const { napDataset } = require('../eval/lib/bo-danh-gia');

const SO_MAU = 40;
const DUONG_RA = path.join(__dirname, '..', 'eval', 'dataset', '10-vi-khong-dau.jsonl');

/**
 * Chọn TRẢI ĐỀU theo họ kịch bản, không lấy random.
 * §2B.6: "Chia theo HỌ KỊCH BẢN, không random-split paraphrase — rò rỉ giữa
 * train và test." Lấy dồn vào vài họ thì lát cắt chỉ đo được vài thủ đoạn.
 */
function chonTraiDeu(mau, soLuong) {
  const theoHo = new Map();
  for (const m of mau) {
    if (!theoHo.has(m.ho)) theoHo.set(m.ho, []);
    theoHo.get(m.ho).push(m);
  }
  // Sắp theo tên họ để kết quả TÁI LẬP ĐƯỢC — không phụ thuộc thứ tự đọc thư mục.
  const ho = [...theoHo.keys()].sort();
  for (const h of ho) theoHo.get(h).sort((a, b) => a.id.localeCompare(b.id));

  const ra = [];
  let vong = 0;
  while (ra.length < soLuong) {
    let themDuocGiKhong = false;
    for (const h of ho) {
      const ds = theoHo.get(h);
      if (vong >= ds.length) continue;
      ra.push(ds[vong]);
      themDuocGiKhong = true;
      if (ra.length >= soLuong) break;
    }
    if (!themDuocGiKhong) break;   // hết mẫu trước khi đủ số lượng
    vong += 1;
  }
  return ra;
}

function sinh() {
  const { mau, loi } = napDataset();
  if (loi.length) throw new Error(`dữ liệu hỏng: ${loi[0]}`);

  // Chỉ lấy mẫu tiếng Việt CÓ DẤU — mẫu vốn đã không dấu thì bỏ dấu là vô nghĩa.
  const ungVien = mau.filter((m) => m.ngon_ngu === 'vi'
    && boDau(m.noi_dung) !== m.noi_dung
    && !m.dan_xuat_tu);

  const chon = chonTraiDeu(ungVien, SO_MAU);

  return chon.map((m) => ({
    id: `${m.id}-kd`,
    ho: m.ho,
    kenh: m.kenh,
    ngon_ngu: m.ngon_ngu,
    noi_dung: boDau(m.noi_dung),
    muc_do: m.muc_do,
    toi_da: m.toi_da,
    nguon: m.nguon,
    ghi_chu: `dẫn xuất cơ học từ ${m.id}: bỏ dấu tiếng Việt`,
    // ⚠️ Trường này là thứ giữ cho số liệu trung thực. Bộ đánh giá đọc nó để
    // LOẠI mẫu dẫn xuất khỏi mọi chỉ số tổng.
    dan_xuat_tu: m.id,
    phep_bien_doi: 'bo_dau',
  }));
}

if (require.main === module) {
  const ra = sinh();
  const theoHo = {};
  const theoMuc = {};
  for (const m of ra) {
    theoHo[m.ho] = (theoHo[m.ho] || 0) + 1;
    theoMuc[m.muc_do] = (theoMuc[m.muc_do] || 0) + 1;
  }

  console.log(`\n📄 SINH ${ra.length} MẪU TIẾNG VIỆT KHÔNG DẤU\n`);
  console.log(`  họ kịch bản phủ được: ${Object.keys(theoHo).length}`);
  console.log(`  theo mức: ${Object.entries(theoMuc).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  console.log('\n  ba mẫu đầu:');
  for (const m of ra.slice(0, 3)) {
    console.log(`    ${m.id.padEnd(20)} ${m.muc_do.padEnd(10)} ${m.noi_dung.slice(0, 60)}`);
  }

  if (process.argv.includes('--ghi')) {
    fs.writeFileSync(DUONG_RA, `${ra.map((m) => JSON.stringify(m)).join('\n')}\n`, 'utf8');
    console.log(`\n  đã ghi ${DUONG_RA}\n`);
  } else {
    console.log('\n  Thêm --ghi để ghi tệp\n');
  }
}

module.exports = { sinh, chonTraiDeu, SO_MAU };
