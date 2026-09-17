'use strict';
/**
 * DUYỆT CẢNH BÁO CHÍNH THỨC — người thật đọc, người thật chịu trách nhiệm.
 *
 *   node scripts/duyet-canh-bao.js --liet-ke
 *   node scripts/duyet-canh-bao.js <id> "<tên người duyệt>"
 *   node scripts/duyet-canh-bao.js --tu-choi <id> "<tên người từ chối>" "<lý do>"
 *
 * ⚠️ VÌ SAO KHÔNG CÓ TRANG QUẢN TRỊ. Việc duyệt ghi thẳng vào tệp JSON trong mã
 * nguồn, nên lịch sử git trả lời được "ai duyệt, lúc nào, duyệt gì" mà không
 * cần đăng nhập, không cần cơ sở dữ liệu, và không mở thêm chỗ nào để bị tấn
 * công.
 *
 * ⚠️ ĐỌC TRANG GỐC TRƯỚC KHI DUYỆT. Duyệt nghĩa là: tôi đã mở đường dẫn, trang
 * đó là của cơ quan nhà nước, và tóm tắt nói đúng điều trang đó nói.
 *
 * Từ chối thì BỎ mục khỏi danh sách phát hành, và ghi lại vào `daTuChoi` ai từ
 * chối, vì sao — để lần sau không ai thêm lại đúng trang đó mà không biết.
 */

const fs = require('fs');
const path = require('path');
const { kiemMuc } = require('../backend/src/intel-store');

const TEP = path.join(__dirname, '..', 'backend', 'data', 'canh-bao-chinh-thuc.json');

class LoiDuyet extends Error {
  constructor(ma) { super(ma); this.ma = ma; }
}

const chuoiCoChu = (x) => (typeof x === 'string' ? x.trim() : '');
const dsCanhBao = (duLieu) => (Array.isArray(duLieu && duLieu.canhBao) ? duLieu.canhBao : []);

/** Ghi người duyệt vào đúng một mục. Trả về dữ liệu MỚI, không sửa tại chỗ. */
function duyetMuc(duLieu, id, ten, ngay) {
  const nguoi = chuoiCoChu(ten);
  if (!nguoi) throw new LoiDuyet('THIEU_NGUOI_DUYET');
  const ds = dsCanhBao(duLieu);
  const muc = ds.find((m) => m.id === id);
  if (!muc) throw new LoiDuyet('KHONG_TIM_THAY_MUC');

  // Duyệt là đứng tên chịu trách nhiệm — mục phải hợp lệ trước khi có tên ai trên nó.
  // eslint-disable-next-line no-unused-vars
  const { duyet, ...kiem } = muc;
  kiemMuc(kiem);

  return {
    ...duLieu,
    canhBao: ds.map((m) => (m.id === id ? { ...m, duyet: { boi: nguoi, luc: ngay } } : m)),
  };
}

/** Bỏ một mục khỏi danh sách phát hành và ghi lại lần từ chối. Trả về dữ liệu MỚI. */
function tuChoiMuc(duLieu, id, ten, lyDo, ngay) {
  const nguoi = chuoiCoChu(ten);
  if (!nguoi) throw new LoiDuyet('THIEU_NGUOI_DUYET');
  const vi = chuoiCoChu(lyDo);
  if (!vi) throw new LoiDuyet('THIEU_LY_DO');
  const ds = dsCanhBao(duLieu);
  const muc = ds.find((m) => m.id === id);
  if (!muc) throw new LoiDuyet('KHONG_TIM_THAY_MUC');

  const daTuChoi = Array.isArray(duLieu.daTuChoi) ? duLieu.daTuChoi : [];
  return {
    ...duLieu,
    canhBao: ds.filter((m) => m.id !== id),
    daTuChoi: [...daTuChoi, { id, sourceUrl: muc.sourceUrl ?? null, boi: nguoi, lyDo: vi, luc: ngay }],
  };
}

function lietKe(duLieu) {
  const ds = dsCanhBao(duLieu);
  for (const m of ds) {
    const trangThai = m.duyet && chuoiCoChu(m.duyet.boi)
      ? `ĐÃ DUYỆT bởi ${m.duyet.boi} ngày ${m.duyet.luc}`
      : 'CHỜ DUYỆT — chưa hiện trong ứng dụng';
    console.log(`\n■ ${m.id}`);
    console.log(`  ${trangThai}`);
    console.log(`  Cơ quan : ${m.coQuan}`);
    console.log(`  Ngày    : ${m.ngayCongBo}`);
    console.log(`  Tóm tắt : ${m.tomTat}`);
    console.log(`  English : ${m.tomTatEn}`);
    console.log(`  Nguồn   : ${m.sourceUrl}`);
  }
  const cho = ds.filter((m) => !(m.duyet && chuoiCoChu(m.duyet.boi))).length;
  const tuChoi = Array.isArray(duLieu.daTuChoi) ? duLieu.daTuChoi.length : 0;
  console.log(`\n${ds.length} cảnh báo · ${cho} đang chờ duyệt · ${tuChoi} đã từ chối\n`);
}

function chay(argv) {
  const duLieu = JSON.parse(fs.readFileSync(TEP, 'utf8'));
  const ghi = (d) => fs.writeFileSync(TEP, `${JSON.stringify(d, null, 2)}\n`, 'utf8');
  const homNay = new Date().toISOString().slice(0, 10);

  if (argv[0] === '--liet-ke' || argv.length === 0) {
    lietKe(duLieu);
    return;
  }
  if (argv[0] === '--tu-choi') {
    const [, id, ten, lyDo] = argv;
    ghi(tuChoiMuc(duLieu, id, ten, lyDo, homNay));
    console.log(`Đã từ chối "${id}" — người từ chối: ${chuoiCoChu(ten)}. Lý do đã ghi vào daTuChoi.`);
    return;
  }
  const [id, ten] = argv;
  ghi(duyetMuc(duLieu, id, ten, homNay));
  console.log(`Đã duyệt "${id}" — người duyệt: ${chuoiCoChu(ten)}, ngày ${homNay}.`);
  console.log('Cảnh báo chỉ hiện trong ứng dụng sau khi commit và triển khai lại.');
}

if (require.main === module) {
  try {
    chay(process.argv.slice(2));
  } catch (e) {
    console.error(`✖ ${e.ma || e.message}`);
    process.exit(1);
  }
}

module.exports = { duyetMuc, tuChoiMuc, LoiDuyet };
