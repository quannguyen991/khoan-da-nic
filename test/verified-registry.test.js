'use strict';
/**
 * §2B.5 — "Một số sai đẩy nạn nhân tới ĐÚNG KẺ LỪA ĐẢO — đây là kịch bản hỏng
 * tệ nhất." Tệp này chặn mọi đường dẫn tới kịch bản đó.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const R = require('../backend/src/analysis/verified-institution-registry');

const ghi = (o) => {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kd-reg-')), 'd.json');
  fs.writeFileSync(p, JSON.stringify(o));
  return p;
};

const MUC_TOT = {
  id: 'vn-x', countryCode: 'VN', type: 'bank', canonicalName: 'Ngân hàng X',
  aliases: ['X'], officialDomains: ['x.com.vn'], officialPhoneNumbers: ['1900 1234'],
  sourceUrl: 'https://x.com.vn/lien-he', verifiedAt: '2026-08-15', reviewStatus: 'approved',
};

test('§2B.5 — mục đã duyệt, đủ trường thì được trả ra', () => {
  const d = R.layDanhBa(ghi({ institutions: [MUC_TOT] }));
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].id, 'vn-x');
});

test('§2B.5 — mục CHƯA DUYỆT tuyệt đối không được trả ra', () => {
  for (const tt of ['pending', 'rejected', 'draft', '']) {
    const d = R.layDanhBa(ghi({ institutions: [{ ...MUC_TOT, reviewStatus: tt }] }));
    assert.strictEqual(d.length, 0, `reviewStatus="${tt}" lọt qua`);
  }
});

test('§2B.5 — mục KHÔNG CÓ NGUỒN bị loại: số không nguồn thì không dùng được', () => {
  assert.strictEqual(R.layDanhBa(ghi({ institutions: [{ ...MUC_TOT, sourceUrl: '' }] })).length, 0);
  assert.strictEqual(R.layDanhBa(ghi({ institutions: [{ ...MUC_TOT, sourceUrl: 'hỏi bạn tôi' }] })).length, 0);
});

test('§2B.5 — mục không có ngày xác minh bị loại', () => {
  assert.strictEqual(R.layDanhBa(ghi({ institutions: [{ ...MUC_TOT, verifiedAt: '' }] })).length, 0);
  assert.strictEqual(R.layDanhBa(ghi({ institutions: [{ ...MUC_TOT, verifiedAt: 'hôm nọ' }] })).length, 0);
});

test('§2B.5 — thiếu bất kỳ trường bắt buộc nào là bị loại', () => {
  for (const t of R.TRUONG_BAT_BUOC) {
    const m = { ...MUC_TOT }; delete m[t];
    assert.strictEqual(R.layDanhBa(ghi({ institutions: [m] })).length, 0, `thiếu ${t} vẫn lọt`);
  }
});

test('§2B.5 — tệp hỏng / không có ⇒ sổ RỖNG, KHÔNG bịa mục nào để lấp', () => {
  assert.deepStrictEqual(R.layDanhBa('/khong-he-ton-tai-98765.json'), []);
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'kd-')), 'x.json');
  fs.writeFileSync(p, '{hỏng');
  assert.deepStrictEqual(R.layDanhBa(p), []);
});

test('§2B.5 — AI KHÔNG ĐƯỢC TỰ TẠO MỤC NÀO', () => {
  assert.throws(() => R.themMucTuAi({ id: 'gia' }), /§2B\.5/);
});

test('§6.11 — nhận đúng số đã xác minh, bỏ qua khác biệt định dạng', () => {
  const p = ghi({ institutions: [MUC_TOT] });
  assert.ok(R.laSoDaXacMinh('1900 1234', p));
  assert.ok(R.laSoDaXacMinh('19001234', p));
  assert.ok(R.laSoDaXacMinh('1900-1234', p));
  assert.ok(!R.laSoDaXacMinh('1900 9999', p), 'số lạ KHÔNG được coi là đã xác minh');
  assert.ok(!R.laSoDaXacMinh('', p));
  assert.ok(!R.laSoDaXacMinh(null, p));
});

test('§6.11 — sổ rỗng thì KHÔNG số nào là "đã xác minh"', () => {
  assert.ok(!R.laSoDaXacMinh('1900 1234', '/khong-ton-tai-1.json'));
});

test('§2B.5 — tra theo nước không được rơi về nước khác', () => {
  const p = ghi({ institutions: [MUC_TOT] });
  assert.strictEqual(R.theoNuoc('VN', p).length, 1);
  assert.strictEqual(R.theoNuoc('US', p).length, 0, 'không có thì trả rỗng, đừng đưa số nước khác');
});

test('§2B.5 — trạng thái nói THẬT là danh bạ có dùng được không', () => {
  const rong = R.trangThaiDanhBa('/khong-ton-tai-2.json');
  assert.strictEqual(rong.dungDuoc, false);
  assert.strictEqual(rong.soMucDaDuyet, 0);

  const co = R.trangThaiDanhBa(ghi({ institutions: [MUC_TOT] }));
  assert.strictEqual(co.dungDuoc, true);

  // Mục bị loại phải nêu TÊN và LÝ DO, không im lặng nuốt.
  const loai = R.trangThaiDanhBa(ghi({ institutions: [{ ...MUC_TOT, sourceUrl: '' }] }));
  assert.strictEqual(loai.soMucBiLoai, 1);
  assert.match(loai.lyDoLoai[0].lyDo, /sourceUrl/);
});

test('§2B.5 — tệp danh bạ thật hiện KHÔNG chứa số nào chưa xác minh', () => {
  const tho = JSON.parse(fs.readFileSync(R.DUONG_MAC_DINH, 'utf8'));
  for (const m of tho.institutions || []) {
    assert.strictEqual(m.reviewStatus, 'approved');
    assert.ok(m.sourceUrl && m.verifiedAt, `${m.id} thiếu nguồn hoặc ngày`);
  }
  // Mục chờ duyệt KHÔNG được mang số điện thoại — số chưa xác minh không nằm trên đĩa.
  for (const m of tho._cho_duyet || []) {
    assert.deepStrictEqual(m.officialPhoneNumbers, [],
      `${m.id} có số điện thoại nhưng chưa được duyệt`);
  }
});
