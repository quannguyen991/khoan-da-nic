'use strict';
/**
 * HÀNG RÀO NỐI BACKEND VỚI CATALOG i18n CỦA FRONTEND.
 *
 * §HĐ luật 2 — `maLyDo` là MÃ, frontend tra bảng để ra câu.
 * §4.1 — MỌI chuỗi người dùng đọc, kể cả ARIA label và notification, phải đến
 * từ catalog i18n, không mã cứng.
 *
 * Nghĩa là mỗi mã backend phát ra PHẢI có một mục trong catalog. Thiếu một mã
 * thì người dùng nhìn thấy `FIN_ORG_CLAIM_PERSONAL_ACCOUNT` giữa màn hình.
 *
 * ⚠️ Đây là dạng lỗi KHÔNG test backend nào bắt được, vì backend làm ĐÚNG — nó
 * phát ra mã, đúng như hợp đồng. Lỗi nằm ở khoảng trống giữa hai nửa.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { dungHopDong, TRUONG_HOP_DONG } = require('../scripts/xuat-hop-dong');
const { analyze, toHopDong } = require('../src/analysis/pipeline');

const hd = dungHopDong();
const GOC = path.join(__dirname, '..');
const DUONG_XUAT = path.join(GOC, 'public', 'config', 'ma-hop-dong.json');

/** Mã NGƯỜI DÙNG ĐỌC — nhóm duy nhất cần nhãn i18n và cần định dạng chặt. */
const maCanNhan = () => hd._canNhanI18n.flatMap((k) => hd[k]);
/** Mọi mã, kể cả nội bộ — dùng cho các luật §4.1/§11 áp cho tất cả. */
const moiMa = () => [...maCanNhan(), ...hd._noiBo.flatMap((k) => hd[k])];

test('Tệp mã hợp đồng đã xuất và KHỚP với code hiện tại', () => {
  assert.ok(fs.existsSync(DUONG_XUAT),
    'chạy `node scripts/xuat-hop-dong.js --ghi` rồi commit tệp đó');
  const daXuat = JSON.parse(fs.readFileSync(DUONG_XUAT, 'utf8'));
  assert.deepStrictEqual(daXuat.maLyDo, hd.maLyDo,
    'tệp đã xuất lệch với registry — xuất lại sau khi đổi tín hiệu');
  assert.deepStrictEqual(daXuat.canThiep, hd.canThiep);
  assert.deepStrictEqual(daXuat.criticalOverride, hd.criticalOverride);
  assert.deepStrictEqual(daXuat.phienBan, hd.phienBan,
    'phiên bản lệch — đổi luật thì phải xuất lại mã hợp đồng');
});

test('§HĐ — đúng bảy trường hợp đồng, không hơn không kém', () => {
  assert.strictEqual(TRUONG_HOP_DONG.length, 7);
  const thuc = Object.keys(toHopDong(analyze({ vanBan: 'Xin chào bác.' })));
  assert.deepStrictEqual(thuc.sort(), [...TRUONG_HOP_DONG].sort());
});

test('Mã người dùng đọc đều là MÃ máy đọc được, không phải câu tiếng Việt', () => {
  for (const ma of maCanNhan()) {
    assert.strictEqual(typeof ma, 'string');
    assert.ok(!/[À-ỹ]/.test(ma), `mã chứa dấu tiếng Việt: ${ma}`);
    assert.ok(!/\s/.test(ma), `mã chứa khoảng trắng: ${ma}`);
    assert.match(ma, /^[A-Za-z][A-Za-z0-9_-]*$/, `mã sai định dạng: ${ma}`);
  }
});

test('Không mã nào trùng nhau TRONG CÙNG một nhóm', () => {
  for (const [nhom, ds] of Object.entries(hd)) {
    if (!Array.isArray(ds)) continue;
    assert.strictEqual(new Set(ds).size, ds.length, `nhóm ${nhom} có mã trùng`);
  }
});

/**
 * ⚠️ PHÂN BIỆT HAI LOẠI MÃ, vì trộn chúng làm test vô dụng:
 *  - `maLyDo` là TÊN THỦ ĐOẠN của kẻ lừa đảo. `FIN_SAFE_ACCOUNT` và
 *    `OFF_INVESTMENT_GUARANTEE` mang chữ "safe"/"guarantee" chính vì đó là lời
 *    KẺ LỪA ĐẢO hứa. Cấm chúng là cấm gọi tên thủ đoạn.
 *  - mã THÔNG ĐIỆP (bước phục hồi, cảnh báo, nhãn) là lời KHOAN ĐÃ nói với
 *    người dùng. §11 áp vào đây.
 */
const maThongDiep = () => [
  ...hd.nhan, ...hd.canThiep, ...hd.maLoiRa, ...hd.daKiem, ...hd.chuaKiem,
  ...hd.gioiHanPhieuTinCay, ...hd.trangThaiGiaoNhan, ...hd.buocPhucHoi,
  ...hd.canhBaoPhucHoi, ...hd.canhBaoSafetyCard,
];

test('§4.1 — KHÔNG mã THÔNG ĐIỆP nào chứa "an toàn" / "safe"', () => {
  for (const ma of maThongDiep()) {
    const t = ma.toLowerCase();
    assert.ok(!/an_toan|antoan|\bsafe\b/.test(t), `mã thông điệp vi phạm §4.1: ${ma}`);
  }
});

test('§4.1 — chữ "safe" chỉ được xuất hiện ở TÊN THỦ ĐOẠN, không ở nhãn', () => {
  const coSafe = hd.maLyDo.filter((m) => /safe/i.test(m));
  assert.deepStrictEqual(coSafe, ['FIN_SAFE_ACCOUNT'],
    'thêm tín hiệu mang chữ "safe" thì phải cân nhắc lại — dễ bị đọc nhầm thành nhãn');
});

test('§11 — KHÔNG mã THÔNG ĐIỆP nào hứa lấy lại được tiền', () => {
  for (const ma of maThongDiep()) {
    const t = ma.toLowerCase();
    for (const cam of ['lay_lai_duoc', 'dam_bao_hoan', 'guarantee', 'chac_chan_thu_hoi', 'hoan_tien_100']) {
      assert.ok(!t.includes(cam), `mã thông điệp vi phạm §11: ${ma}`);
    }
  }
});

test('§11 — tên thủ đoạn ĐƯỢC PHÉP mang chữ hứa hẹn, vì đó là lời KẺ LỪA ĐẢO', () => {
  // Ca này giữ lại để lần sau ai đó "dọn" tên tín hiệu thì thấy vì sao không nên.
  assert.ok(hd.maLyDo.includes('OFF_INVESTMENT_GUARANTEE'));
  assert.ok(hd.maLyDo.includes('FIN_SAFE_ACCOUNT'));
});

test('§11 — KHÔNG có trạng thái "đã đọc và hiểu"', () => {
  for (const ma of hd.trangThaiGiaoNhan) {
    assert.ok(!/da_doc_va_hieu|da_hieu|understood/.test(ma.toLowerCase()), ma);
  }
});

test('Mọi mã canThiep pipeline sinh ra đều nằm trong hợp đồng', () => {
  const mau = [
    'Xin chào bác.',
    'Bác chuyển hết tiền sang tài khoản an toàn.',
    'Tôi là điều tra viên, bác chuyển tiền ngay, chậm là bị phong toả tài khoản.',
    'Công an không bao giờ yêu cầu chuyển tiền.',
  ];
  for (const v of mau) {
    const e = analyze({ vanBan: v });
    assert.ok(hd.canThiep.includes(e.canThiep), `canThiep lạ: ${e.canThiep}`);
    assert.ok(hd.nhan.includes(e.nhan), `nhan lạ: ${e.nhan}`);
    for (const m of e.maLyDo) assert.ok(hd.maLyDo.includes(m), `maLyDo lạ: ${m}`);
    for (const m of e.chuaKiem) assert.ok(hd.chuaKiem.includes(m), `chuaKiem lạ: ${m}`);
    for (const m of e.daKiem) assert.ok(hd.daKiem.includes(m), `daKiem lạ: ${m}`);
    if (e.hoKichBan) assert.ok(hd.hoKichBan.includes(e.hoKichBan), `hoKichBan lạ: ${e.hoKichBan}`);
  }
});

test('Nếu catalog i18n đã tồn tại thì phải phủ HẾT mã', () => {
  // Chưa có catalog thì bỏ qua — nhưng có rồi mà thiếu mã là ĐỎ.
  const ungVien = ['src/i18n/locales/ui-vi-VN.json', 'src/i18n/locales/ui-en-US.json'];
  for (const rel of ungVien) {
    const p = path.join(GOC, rel);
    if (!fs.existsSync(p)) continue;
    const cat = JSON.parse(fs.readFileSync(p, 'utf8'));
    const thieu = maCanNhan().filter((m) => !(m in cat));
    assert.deepStrictEqual(thieu, [],
      `${rel} thiếu nhãn cho ${thieu.length} mã: ${thieu.slice(0, 8).join(', ')}`);
  }
});
