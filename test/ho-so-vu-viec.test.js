'use strict';
/**
 * HỒ SƠ VỤ VIỆC — tệp bác cầm tới ngân hàng và công an.
 *
 * VÌ SAO CẦN: hôm nay sản phẩm dừng ở câu "gọi ngân hàng bằng số đúng". Nhưng
 * người vừa mất tiền, đang hoảng, gọi tổng đài và không nhớ nổi mình chuyển lúc
 * mấy giờ, bao nhiêu, vào đâu. Tổng đài hỏi đúng những câu đó.
 *
 * ⚠️ HAI RÀNG BUỘC SỐNG CÒN:
 *
 * 1. KHÔNG TỰ ĐIỀN. Số tiền, tên ngân hàng, mã giao dịch — app không biết và
 *    không được đoán. Chỗ nào bác chưa khai thì hồ sơ ghi "chưa khai", không
 *    ghi 0, không để trống cho người đọc tự suy. Một hồ sơ điền hộ là một hồ sơ
 *    sai đưa cho công an.
 *
 * 2. KHÔNG CHỨA NỘI DUNG TIN NHẮN. Hồ sơ đi ra khỏi máy — sang email, sang máy
 *    in, sang tay người lạ ở quầy. Nội dung bác kiểm có thể rất riêng tư (§6.9,
 *    và cùng lý do bảng của người con không hiện nội dung).
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'ho-so.cjs');
const NGUON = path.join(GOC, 'src', 'lib', 'ho-so-vu-viec.ts');

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

const H = goi();

const LICH_SU = [
  {
    id: 1,
    title: 'Tin nhắn ngân hàng',
    type: 'sms',
    risk: 'CAO',
    date: '2026-09-14T09:12:00.000Z',
    data: {
      nhan: 'CAO',
      maLyDo: ['CRED_OTP_SHARE', 'ID_BANK_IMPERSONATION'],
      chuaKiem: ['khong_mo_duoc_link'],
      noiDungGoc: 'BAC DOC GIUP MA OTP 889231 DE HUY GIAO DICH',
    },
  },
  {
    id: 2,
    title: 'Cuộc gọi lạ',
    type: 'call',
    risk: 'NGHI_NGO',
    date: '2026-09-14T10:30:00.000Z',
    data: { nhan: 'NGHI_NGO', maLyDo: ['MAN_URGENCY'], chuaKiem: [] },
  },
];

test('hồ sơ gom đúng số mốc, theo thứ tự thời gian', () => {
  const hs = H.dungHoSo(LICH_SU, {}, Date.parse('2026-09-16T00:00:00.000Z'));
  assert.equal(hs.moc.length, 2);
  assert.ok(hs.moc[0].luc <= hs.moc[1].luc, 'mốc phải xếp theo thời gian');
});

test('⚠️ KHÔNG chứa nội dung tin nhắn, dù lịch sử có lưu', () => {
  const hs = H.dungHoSo(LICH_SU, {}, Date.now());
  const chuoi = JSON.stringify(hs);
  assert.ok(!chuoi.includes('889231'), 'mã OTP trong nội dung gốc không được lọt vào hồ sơ');
  assert.ok(!chuoi.includes('BAC DOC GIUP'), 'nội dung tin nhắn không được lọt vào hồ sơ');
});

test('⚠️ KHÔNG tự điền: chưa khai thì ghi rõ là chưa khai, không ghi 0', () => {
  const hs = H.dungHoSo(LICH_SU, {}, Date.now());
  assert.equal(hs.khai.soTien, null);
  assert.equal(hs.khai.nganHang, null);

  const van = H.xuatVanBan(hs, 'vi');
  assert.ok(van.includes('chưa khai'), 'văn bản phải nói rõ chỗ nào chưa có');
  assert.ok(!/Số tiền:\s*0/.test(van), 'không được biến "chưa khai" thành số 0');
});

test('có khai thì hồ sơ dùng đúng cái bác khai, không sửa', () => {
  const hs = H.dungHoSo(LICH_SU, {
    soTien: 50_000_000, nganHang: 'Ngân hàng X', maGiaoDich: 'FT2609',
  }, Date.now());
  const van = H.xuatVanBan(hs, 'vi');
  assert.ok(van.includes('50.000.000') || van.includes('50000000'));
  assert.ok(van.includes('Ngân hàng X'));
  assert.ok(van.includes('FT2609'));
});

test('lịch sử rỗng vẫn ra một hồ sơ hợp lệ, nói rõ là chưa có mốc nào', () => {
  const hs = H.dungHoSo([], {}, Date.now());
  const van = H.xuatVanBan(hs, 'vi');
  assert.equal(hs.moc.length, 0);
  assert.ok(van.length > 50, 'vẫn phải ra một văn bản đọc được');
  assert.ok(/chưa có lượt kiểm nào/i.test(van));
});

test('§4.3 — văn bản nêu cả những thứ CHƯA KIỂM ĐƯỢC', () => {
  const hs = H.dungHoSo(LICH_SU, {}, Date.now());
  const van = H.xuatVanBan(hs, 'vi');
  assert.ok(/chưa kiểm được/i.test(van), 'phần này không được lặng lẽ biến mất');
});

test('§4.1 + §11 — văn bản KHÔNG nói "an toàn" và KHÔNG hứa lấy lại tiền', () => {
  const hs = H.dungHoSo(LICH_SU, { soTien: 1000 }, Date.now());
  for (const lang of ['vi', 'en']) {
    const van = H.xuatVanBan(hs, lang);
    assert.ok(!/\ban toàn\b/i.test(van), 'không được có chữ "an toàn"');
    assert.ok(!/\bsafe\b/i.test(van), 'không được có chữ "safe"');
    assert.ok(!/lấy lại được tiền|get your money back|guarantee/i.test(van),
      'không được hứa lấy lại tiền');
  }
});

test('văn bản nói rõ đây là công cụ hỗ trợ, không thay công an và ngân hàng', () => {
  const van = H.xuatVanBan(H.dungHoSo(LICH_SU, {}, Date.now()), 'vi');
  assert.ok(/công cụ hỗ trợ/i.test(van));
});

test('có bản tiếng Anh, và nó KHÔNG phải bản tiếng Việt', () => {
  const hs = H.dungHoSo(LICH_SU, {}, Date.now());
  const vi = H.xuatVanBan(hs, 'vi');
  const en = H.xuatVanBan(hs, 'en');
  assert.notEqual(vi, en);
  assert.ok(/INCIDENT FILE/i.test(en));
});

test('mốc thời gian ghi rõ là LÚC BẤM KIỂM TRONG ỨNG DỤNG, không phải lúc bị lừa', () => {
  // App chỉ biết lúc bác bấm kiểm. Để người đọc hiểu đó là thời điểm vụ việc
  // xảy ra là khai một thứ máy không biết.
  const van = H.xuatVanBan(H.dungHoSo(LICH_SU, {}, Date.now()), 'vi');
  assert.ok(/lúc bấm kiểm/i.test(van));
});

test('dữ liệu lịch sử hỏng thì bỏ qua bản ghi đó, KHÔNG ném', () => {
  const ban = [null, { risk: 'CAO' }, 'không phải bản ghi', ...LICH_SU];
  const hs = H.dungHoSo(ban, {}, Date.now());
  assert.ok(hs.moc.length >= 2);
});

test('⚠️ HỒI QUY 16/9/2026 — mốc dạng chữ hiển thị vẫn ra giờ thật, không ra dấu gạch', () => {
  // Trước khi sửa, `Date.parse("12:55 16-09")` trả NaN → mốc thành 0 → hồ sơ in
  // dấu "—" ở chỗ đáng lẽ là giờ. Một hồ sơ đưa cho ngân hàng mà cột thời gian
  // toàn dấu gạch thì không dùng được vào việc gì.
  const d = new Date();
  const hai = (n) => String(n).padStart(2, '0');
  const banCu = {
    id: 9,
    risk: 'CAO',
    date: `${hai(d.getHours())}:${hai(d.getMinutes())} ${hai(d.getDate())}-${hai(d.getMonth() + 1)}`,
    data: { nhan: 'CAO', maLyDo: ['CRED_OTP_SHARE'], chuaKiem: [] },
  };
  const hs = H.dungHoSo([banCu], {}, Date.now());
  assert.ok(hs.moc[0].luc > 0, 'phải đọc được mốc thật từ chuỗi cũ');
  const van = H.xuatVanBan(hs, 'vi');
  assert.ok(!/^\s+— Nguy hiểm cao$/m.test(van), 'không được in dấu gạch thay cho giờ');
});
