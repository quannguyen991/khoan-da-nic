'use strict';
/**
 * RA-ĐA NHÀ MÌNH — gom lịch sử của chính máy này, và gói chia sẻ sạch.
 *
 * ⚠️ KHÔNG PHẢI hệ Ra-đa thủ đoạn ở backend (§5.3, `intel-store.js`) — hệ đó có
 * test riêng ở `test/ra-da-thu-doan.test.js`.
 *
 * ⚠️ ĐÂY LÀ TÍNH NĂNG DỄ GÂY HẠI NHẤT TRONG CẢ SẢN PHẨM, nên test ở đây gắt
 * hơn mọi nơi khác.
 *
 * §12 cấm thu thập hoặc quy kết cá nhân: ra-đa nhận THỦ ĐOẠN, không nhận người.
 * Một bản chia sẻ lọt ra số điện thoại là một lời tố cáo công khai nhắm vào một
 * số máy — mà số đó có thể là số bị giả mạo của một người hoàn toàn vô can.
 *
 * Vì vậy gói chia sẻ chỉ được chứa: MÃ (chữ in hoa và gạch dưới), TÊN HỌ KỊCH
 * BẢN (chữ thường và gạch dưới), và SỐ ĐẾM. Bất cứ thứ gì khác — chữ tự do, số
 * điện thoại, đường dẫn, email — phải bị chặn, và có hàm kiểm riêng để chặn.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'ra-da-nha-minh.cjs');
const NGUON = path.join(GOC, 'src', 'lib', 'ra-da-nha-minh.ts');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(path.dirname(TEP_GOI), { recursive: true });
  esbuild.buildSync({
    entryPoints: [NGUON],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: TEP_GOI,
    absWorkingDir: GOC,
    logLevel: 'silent',
  });
  return require(TEP_GOI);
}

const R = goi();
const NGAY = 24 * 60 * 60 * 1000;
const BAY_GIO = Date.parse('2026-09-16T00:00:00.000Z');

const ban = (ngayTruoc, ho, maLyDo, risk = 'CAO') => ({
  id: Math.random(),
  risk,
  date: new Date(BAY_GIO - ngayTruoc * NGAY).toISOString(),
  data: { nhan: risk, hoKichBan: ho, maLyDo, chuaKiem: [] },
});

const LICH_SU = [
  ban(1, 'gia_danh_cong_an', ['ID_AUTHORITY_IMPERSONATION', 'FIN_SAFE_ACCOUNT']),
  ban(3, 'gia_danh_cong_an', ['ID_AUTHORITY_IMPERSONATION', 'MAN_SECRECY']),
  ban(5, 'gia_danh_ngan_hang', ['CRED_OTP_SHARE']),
  ban(40, 'gia_danh_giao_hang', ['FIN_TRANSFER_REQUEST']),   // ngoài cửa sổ 30 ngày
];

test('gom đúng số lần theo họ kịch bản, trong cửa sổ thời gian', () => {
  const tt = R.tomTat(LICH_SU, BAY_GIO, 30);
  const ho = Object.fromEntries(tt.theoHo.map((h) => [h.ho, h.soLan]));
  assert.equal(ho.gia_danh_cong_an, 2);
  assert.equal(ho.gia_danh_ngan_hang, 1);
  assert.equal(ho.gia_danh_giao_hang, undefined, 'bản ghi 40 ngày trước phải nằm ngoài cửa sổ');
});

test('xếp họ gặp nhiều nhất lên đầu — ra-đa để nhìn một cái là thấy', () => {
  const tt = R.tomTat(LICH_SU, BAY_GIO, 30);
  assert.equal(tt.theoHo[0].ho, 'gia_danh_cong_an');
});

test('lịch sử rỗng thì ra bản tóm tắt rỗng hợp lệ, KHÔNG ném', () => {
  const tt = R.tomTat([], BAY_GIO, 30);
  assert.deepEqual(tt.theoHo, []);
  assert.equal(tt.tongLuot, 0);
});

test('⚠️ gói chia sẻ CHỈ có mã, họ và số đếm — không gì khác', () => {
  const goi_ = R.dungGoiChiaSe(R.tomTat(LICH_SU, BAY_GIO, 30), BAY_GIO);
  const chuoi = JSON.stringify(goi_);
  assert.ok(!/nguoiGui|sender|phone|dienThoai/i.test(chuoi), 'không được có trường người gửi');
  assert.equal(R.kiemTraAnToanChiaSe(goi_).ok, true);
});

test('⚠️ nội dung bẩn trong lịch sử KHÔNG lọt được vào gói chia sẻ', () => {
  const ban_ = ban(1, 'gia_danh_ngan_hang', ['CRED_OTP_SHARE']);
  // Lịch sử thật có thể mang theo đủ thứ: nội dung gốc, số máy, đường dẫn.
  ban_.data.noiDungGoc = 'Bac chuyen vao 0912345678 va bam https://xyz.tk/abc';
  ban_.title = 'Tin từ 0912345678';
  const goi_ = R.dungGoiChiaSe(R.tomTat([ban_], BAY_GIO, 30), BAY_GIO);
  const chuoi = JSON.stringify(goi_);
  assert.ok(!chuoi.includes('0912345678'), 'số điện thoại không được lọt ra');
  assert.ok(!chuoi.includes('xyz.tk'), 'đường dẫn không được lọt ra');
  assert.equal(R.kiemTraAnToanChiaSe(goi_).ok, true);
});

test('⚠️ hàm kiểm CHẶN gói có số điện thoại, đường dẫn, hay chữ tự do', () => {
  const xau = [
    { ho: [{ ho: 'gia_danh_cong_an', soLan: 1 }], dauHieu: [], tuan: '2026-W38', ghiChu: 'goi tu 0912345678' },
    { ho: [{ ho: 'http://xyz.tk', soLan: 1 }], dauHieu: [], tuan: '2026-W38' },
    { ho: [{ ho: 'gia_danh_cong_an', soLan: 1 }], dauHieu: [{ ma: 'ai đó tên Hùng', soLan: 1 }], tuan: '2026-W38' },
  ];
  for (const g of xau) {
    const kq = R.kiemTraAnToanChiaSe(g);
    assert.equal(kq.ok, false, `phải chặn: ${JSON.stringify(g)}`);
    assert.ok(kq.viPham.length > 0, 'phải nói rõ vi phạm ở đâu');
  }
});

test('⚠️ hàm kiểm chặn cả khi số đếm bị nhét chuỗi lạ', () => {
  const g = { ho: [{ ho: 'gia_danh_cong_an', soLan: '12 trieu dong' }], dauHieu: [], tuan: '2026-W38' };
  assert.equal(R.kiemTraAnToanChiaSe(g).ok, false);
});

test('mốc thời gian trong gói chỉ tới TUẦN, không tới giờ', () => {
  // Giờ chính xác của một lượt kiểm là dữ liệu về sinh hoạt của một người cụ
  // thể. Tuần là đủ để thấy xu hướng thủ đoạn.
  const goi_ = R.dungGoiChiaSe(R.tomTat(LICH_SU, BAY_GIO, 30), BAY_GIO);
  assert.match(goi_.tuan, /^\d{4}-W\d{2}$/);
  // JSON nào cũng có dấu hai chấm; thứ phải vắng mặt là MỐC GIỜ và mốc ngày đầy đủ.
  const chuoiGoi = JSON.stringify(goi_);
  assert.ok(!/\d{1,2}:\d{2}/.test(chuoiGoi), 'không được có mốc giờ');
  assert.ok(!/\d{4}-\d{2}-\d{2}/.test(chuoiGoi), 'không được có ngày chính xác');
});

test('§12 — mã KHÔNG tự gửi gói đi đâu, và không có địa chỉ máy chủ nào', () => {
  const s = fs.readFileSync(NGUON, 'utf8');
  const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const cam of ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'https://', 'api.']) {
    assert.ok(!ma.includes(cam), `ra-đa không được tự gửi đi: \`${cam}\``);
  }
});

test('§12 — mã KHÔNG có khái niệm "người bị tố"', () => {
  const s = fs.readFileSync(NGUON, 'utf8');
  const ma = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const cam of ['nguoiGui', 'keLuaDao', 'toCao', 'blacklist', 'danhSachDen']) {
    assert.ok(!ma.includes(cam), `ra-đa nhận thủ đoạn, không nhận người: \`${cam}\``);
  }
});

test('⚠️ HỒI QUY 16/9/2026 — bản ghi cũ lưu `date` dạng chữ hiển thị vẫn phải đếm được', () => {
  // App lưu "12:55 16-09", không phải ISO. `Date.parse` trả NaN, và trước khi
  // sửa thì MỌI bản ghi bị lọc sạch: ra-đa báo "chưa có lượt kiểm nào" trong khi
  // máy đang có ba lượt. Không lỗi nào hiện ra — đúng dạng hỏng im lặng.
  const d = new Date(BAY_GIO - 2 * NGAY);
  const hai = (n) => String(n).padStart(2, '0');
  const banCu = {
    id: 1,
    risk: 'CAO',
    date: `${hai(d.getHours())}:${hai(d.getMinutes())} ${hai(d.getDate())}-${hai(d.getMonth() + 1)}`,
    data: { nhan: 'CAO', hoKichBan: 'gia_danh_cong_an', maLyDo: ['MAN_SECRECY'] },
  };
  const tt = R.tomTat([banCu], BAY_GIO, 30);
  assert.equal(tt.tongLuot, 1, 'bản ghi cũ KHÔNG được biến mất');
  assert.equal(tt.theoHo[0].ho, 'gia_danh_cong_an');
});

test('bản ghi mới có trường `luc` thì đọc thẳng, không phải đoán từ chữ', () => {
  const banMoi = {
    id: 2,
    risk: 'CAO',
    date: 'chữ gì cũng được',
    luc: BAY_GIO - NGAY,
    data: { nhan: 'CAO', hoKichBan: 'gia_danh_ngan_hang', maLyDo: ['CRED_OTP_SHARE'] },
  };
  assert.equal(R.tomTat([banMoi], BAY_GIO, 30).tongLuot, 1);
});
