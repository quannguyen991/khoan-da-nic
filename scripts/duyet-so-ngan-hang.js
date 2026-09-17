'use strict';
/**
 * DUYỆT SỐ TỔNG ĐÀI NGÂN HÀNG — người thật tra, người thật đứng tên.
 *
 *   node scripts/duyet-so-ngan-hang.js --liet-ke
 *   node scripts/duyet-so-ngan-hang.js <id> "<số 1>; <số 2>" "<tên người duyệt>" [sourceUrl]
 *   node scripts/duyet-so-ngan-hang.js --go <id> "<tên người gỡ>" "<lý do>"
 *
 * ⚠️ ĐÂY LÀ CHỖ NGUY HIỂM NHẤT CỦA CẢ SẢN PHẨM. Một số sai đưa người đang hoảng
 * tới ĐÚNG kẻ lừa đảo. Duyệt nghĩa là: tôi đã mở `sourceUrl`, đó là trang của chính
 * ngân hàng, và số tôi gõ vào đây trùng từng chữ số với số trên trang.
 *
 * ⚠️ SỐ DO NGƯỜI DUYỆT GÕ VÀO, KHÔNG LẤY TỪ ĐÂU KHÁC. Mục chờ duyệt trong tệp
 * không mang số điện thoại nào (test chặn) — số chỉ xuất hiện trên đĩa cùng lúc
 * với tên người đứng ra xác nhận nó.
 *
 * Người dùng chốt ngày 17/9/2026: số tổng đài ngân hàng CHỈ để sẵn trong app để
 * bác tự bấm — không mở app ngân hàng, không tự gọi.
 */

const fs = require('fs');
const path = require('path');
const { mucHopLe, DUONG_MAC_DINH } = require('../backend/src/analysis/verified-institution-registry');

class LoiDuyetSo extends Error {
  constructor(ma, chiTiet) { super(chiTiet ? `${ma}: ${chiTiet}` : ma); this.ma = ma; }
}

const chuoiCoChu = (x) => (typeof x === 'string' ? x.trim() : '');

/**
 * Tách danh sách số người duyệt gõ vào. Chỉ nhận chữ số, dấu cách, ngoặc, chấm,
 * gạch và dấu + đầu số. Có chữ lẫn vào là từ chối — "1900 1234 (miễn phí)" phải
 * gõ lại cho sạch, đừng để máy đoán phần nào là số.
 */
function tachSo(chuoiSo) {
  const ds = chuoiCoChu(chuoiSo).split(/[;,\n]/).map((x) => x.trim()).filter(Boolean);
  if (ds.length === 0) throw new LoiDuyetSo('THIEU_SO');
  for (const so of ds) {
    if (!/^\+?[\d\s().-]{6,20}$/.test(so)) throw new LoiDuyetSo('SO_KHONG_HOP_LE', so);
    const chiSo = so.replace(/\D/g, '');
    if (chiSo.length < 6 || chiSo.length > 12) throw new LoiDuyetSo('SO_KHONG_HOP_LE', so);
  }
  return ds;
}

/** Duyệt một ngân hàng. Trả về dữ liệu MỚI, không sửa tại chỗ. */
function duyetSo(duLieu, id, chuoiSo, ten, ngay, sourceUrl) {
  const nguoi = chuoiCoChu(ten);
  if (!nguoi) throw new LoiDuyetSo('THIEU_NGUOI_DUYET');
  const cho = Array.isArray(duLieu._cho_duyet) ? duLieu._cho_duyet : [];
  const daCo = Array.isArray(duLieu.institutions) ? duLieu.institutions : [];
  const goc = cho.find((m) => m.id === id) || daCo.find((m) => m.id === id);
  if (!goc) throw new LoiDuyetSo('KHONG_TIM_THAY_MUC', id);

  // eslint-disable-next-line no-unused-vars
  const { _can_lam, ...sach } = goc;
  const muc = {
    ...sach,
    officialPhoneNumbers: tachSo(chuoiSo),
    sourceUrl: chuoiCoChu(sourceUrl) || goc.sourceUrl,
    verifiedAt: ngay,
    reviewStatus: 'approved',
    reviewedBy: nguoi,
  };
  const kt = mucHopLe(muc);
  if (!kt.hopLe) throw new LoiDuyetSo('MUC_KHONG_HOP_LE', kt.lyDo);

  return {
    ...duLieu,
    institutions: [...daCo.filter((m) => m.id !== id), muc],
    _cho_duyet: cho.filter((m) => m.id !== id),
  };
}

/**
 * Gỡ một số đã duyệt — khi ngân hàng đổi số, hoặc có người báo số sai. Mục quay
 * về hàng chờ và MẤT SỐ ngay, để không có khoảnh khắc nào số nghi sai còn hiện.
 */
function goSo(duLieu, id, ten, lyDo, ngay) {
  const nguoi = chuoiCoChu(ten);
  if (!nguoi) throw new LoiDuyetSo('THIEU_NGUOI_DUYET');
  const vi = chuoiCoChu(lyDo);
  if (!vi) throw new LoiDuyetSo('THIEU_LY_DO');
  const daCo = Array.isArray(duLieu.institutions) ? duLieu.institutions : [];
  const muc = daCo.find((m) => m.id === id);
  if (!muc) throw new LoiDuyetSo('KHONG_TIM_THAY_MUC', id);

  const veCho = {
    ...muc, officialPhoneNumbers: [], verifiedAt: '', reviewStatus: 'pending', reviewedBy: '',
  };
  const nhatKy = Array.isArray(duLieu._da_go) ? duLieu._da_go : [];
  return {
    ...duLieu,
    institutions: daCo.filter((m) => m.id !== id),
    _cho_duyet: [...(Array.isArray(duLieu._cho_duyet) ? duLieu._cho_duyet : []), veCho],
    _da_go: [...nhatKy, { id, soDaGo: muc.officialPhoneNumbers, boi: nguoi, lyDo: vi, luc: ngay }],
  };
}

function lietKe(duLieu) {
  for (const m of duLieu.institutions || []) {
    console.log(`\n✔ ${m.id} — ${m.canonicalName}`);
    console.log(`  Số     : ${m.officialPhoneNumbers.join(' · ')}`);
    console.log(`  Nguồn  : ${m.sourceUrl}`);
    console.log(`  Duyệt  : ${m.reviewedBy}, ngày ${m.verifiedAt}`);
  }
  for (const m of duLieu._cho_duyet || []) {
    console.log(`\n… ${m.id} — ${m.canonicalName} (CHỜ DUYỆT, chưa hiện trong app)`);
    if (m.sourceUrl) console.log(`  Tra số ở: ${m.sourceUrl}`);
  }
  console.log(`\n${(duLieu.institutions || []).length} đã duyệt · ${(duLieu._cho_duyet || []).length} chờ duyệt\n`);
}

function chay(argv) {
  const duLieu = JSON.parse(fs.readFileSync(DUONG_MAC_DINH, 'utf8'));
  const ghi = (d) => fs.writeFileSync(DUONG_MAC_DINH, `${JSON.stringify(d, null, 2)}\n`, 'utf8');
  const homNay = new Date().toISOString().slice(0, 10);

  if (argv.length === 0 || argv[0] === '--liet-ke') { lietKe(duLieu); return; }
  if (argv[0] === '--go') {
    const [, id, ten, lyDo] = argv;
    ghi(goSo(duLieu, id, ten, lyDo, homNay));
    console.log(`Đã gỡ số của "${id}". Mục quay về hàng chờ duyệt.`);
    return;
  }
  const [id, chuoiSo, ten, sourceUrl] = argv;
  ghi(duyetSo(duLieu, id, chuoiSo, ten, homNay, sourceUrl));
  console.log(`Đã duyệt "${id}" — người duyệt: ${chuoiCoChu(ten)}, ngày ${homNay}.`);
}

if (require.main === module) {
  try {
    chay(process.argv.slice(2));
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
}

module.exports = { duyetSo, goSo, tachSo, LoiDuyetSo, DUONG_TEP: path.resolve(DUONG_MAC_DINH) };
