'use strict';
/**
 * §4.3 — HÀNG RÀO CHO CHÍNH BỘ ĐÁNH GIÁ.
 *
 * "Ảnh không đọc được vì AI chết, tên miền không phân giải được, BỘ EVAL HỎNG
 * 89,5% LƯỢT GỌI — cả ba đều hiện ra 'Chưa thấy dấu hiệu rủi ro'."
 *
 * Một bộ eval hỏng gần chín phần mười lượt gọi mà vẫn in bảng số đẹp là chuyện
 * ĐÃ XẢY RA. Tệp này chặn nó tái diễn.
 */

const test = require('node:test');
const assert = require('node:assert');

const B = require('../eval/lib/bo-danh-gia');

const gia = (n, hong) => Array.from({ length: n }, (_, i) => ({
  mau: { id: `m${i}`, muc_do: 'CAO', toi_da: 'CAO', ngon_ngu: 'vi', nguon: 'tai_dung', _lo: 'x' },
  nhan: 'CAO', hong: i < hong, loiAi: i < hong ? 'AI_TIMEOUT' : null,
}));

// ─────────── §4.3 — trần lượt hỏng ───────────

test('§4.3 — trần lượt hỏng là 10%', () => {
  assert.strictEqual(B.TRAN_LUOT_HONG, 0.10);
});

test('§4.3 — hỏng 89,5% lượt thì VƯỢT TRẦN, không được công bố số', () => {
  const kt = B.kiemTranLuotHong(gia(200, 179));
  assert.ok(kt.vuotTran, 'đây đúng tỷ lệ của sự cố đã xảy ra');
  assert.ok(kt.tyLeHong > 0.89);
});

test('§4.3 — hỏng vừa đúng 10% thì CHƯA vượt trần', () => {
  assert.ok(!B.kiemTranLuotHong(gia(100, 10)).vuotTran);
  assert.ok(B.kiemTranLuotHong(gia(100, 11)).vuotTran);
});

test('§4.3 — không hỏng lượt nào thì tỷ lệ 0, không phải null', () => {
  const kt = B.kiemTranLuotHong(gia(50, 0));
  assert.strictEqual(kt.tyLeHong, 0);
  assert.ok(!kt.vuotTran);
});

test('§4.3 — báo cáo phải nói RÕ lý do hỏng, không nuốt', () => {
  assert.deepStrictEqual(B.kiemTranLuotHong(gia(10, 5)).lyDoHong, ['AI_TIMEOUT']);
});

// ─────────── §2B.6 — luật chấm điểm ───────────

test('§2B.6 — toi_da là mức CAO NHẤT CÒN CHẤP NHẬN, muc_do là sàn', () => {
  const lanh = { muc_do: 'CHUA_THAY', toi_da: 'NGHI_NGO' };
  assert.ok(B.dat(lanh, 'CHUA_THAY'));
  assert.ok(B.dat(lanh, 'NGHI_NGO'), 'NGHI_NGO vẫn trong ngưỡng chấp nhận');
  assert.ok(!B.dat(lanh, 'CAO'), 'báo đỏ mẫu lành là trượt');

  const scam = { muc_do: 'CAO', toi_da: 'CAO' };
  assert.ok(B.dat(scam, 'CAO'));
  assert.ok(!B.dat(scam, 'NGHI_NGO'), 'bỏ sót mẫu nguy hiểm là trượt');
  assert.ok(!B.dat(scam, 'CHUA_THAY'));
});

test('§2B.6 — lát cắt toi_da=CHUA_THAY không cho phép bất kỳ mức nào cao hơn', () => {
  const chat = { muc_do: 'CHUA_THAY', toi_da: 'CHUA_THAY' };
  assert.ok(B.dat(chat, 'CHUA_THAY'));
  assert.ok(!B.dat(chat, 'NGHI_NGO'));
});

// ─────────── §2B.6 — dữ liệu ───────────

test('§2B.6 — dataset thật nạp được, đủ 9 trường, không mẫu nào hỏng', () => {
  const { mau, loi } = B.napDataset();
  assert.deepStrictEqual(loi, [], 'mẫu hỏng phải được nêu tên, không im lặng bỏ qua');
  assert.ok(mau.length >= 400, `chỉ nạp được ${mau.length} mẫu`);
  for (const m of mau.slice(0, 50)) {
    for (const t of ['id', 'ho', 'kenh', 'ngon_ngu', 'noi_dung', 'muc_do', 'toi_da', 'nguon']) {
      assert.ok(m[t] !== undefined, `${m.id} thiếu ${t}`);
    }
  }
});

test('§2B.6 — vân tay dataset đổi khi nội dung đổi', () => {
  const a = [{ id: '1', noi_dung: 'x' }, { id: '2', noi_dung: 'y' }];
  const b = [{ id: '1', noi_dung: 'x' }, { id: '2', noi_dung: 'z' }];
  assert.strictEqual(B.vanTayDataset(a), B.vanTayDataset([...a].reverse()), 'không phụ thuộc thứ tự');
  assert.notStrictEqual(B.vanTayDataset(a), B.vanTayDataset(b));
});

// ─────────── §11 — metadata ───────────

test('§11 — KHÔNG gán số liệu cho model chưa hề được gọi', () => {
  const m = B.dungMetadata({ mau: [{ id: '1', noi_dung: 'x' }], dungAi: false });
  assert.strictEqual(m.aiDaChay, false);
  assert.strictEqual(m.model, null, 'chưa gọi AI thì trường model phải RỖNG');
  assert.strictEqual(m.apiBase, null);
  assert.strictEqual(m.cheDo, 'chi_bo_luat');
});

test('§2B.6 — metadata có đủ mọi trường bắt buộc cho slide', () => {
  const m = B.dungMetadata({ mau: [{ id: '1', noi_dung: 'x' }], dungAi: false });
  for (const t of ['commitSha', 'analysisVersion', 'registryVersion', 'ruleVersion',
    'promptVersion', 'datasetVersion', 'datasetSize', 'cheDo']) {
    assert.ok(t in m, `thiếu ${t} thì số liệu không được dùng trên slide`);
  }
});

// ─────────── §2B.6 — mẫu thật in số đếm ───────────

test('§2B.6 — mẫu thật in SỐ ĐẾM, và nói thẳng khi không có mẫu nào', () => {
  const khong = B.thongKeMauThat(gia(10, 0));
  assert.strictEqual(khong.coMauThat, false);
  assert.strictEqual(khong.tong, 0);

  const co = B.thongKeMauThat([
    { mau: { muc_do: 'CAO', toi_da: 'CAO', nguon: 'that' }, nhan: 'CAO' },
    { mau: { muc_do: 'CAO', toi_da: 'CAO', nguon: 'that' }, nhan: 'NGHI_NGO' },
    { mau: { muc_do: 'CAO', toi_da: 'CAO', nguon: 'tai_dung' }, nhan: 'CAO' },
  ]);
  assert.strictEqual(co.tong, 2, 'chỉ đếm nguon="that"');
  assert.strictEqual(co.nguyHiemBatDuoc, 1);
  assert.strictEqual(co.nguyHiemTong, 2);
});

// ─────────── §6.14 — parity đo TỪNG ngôn ngữ ───────────

test('§6.14 — parity tính riêng từng ngôn ngữ, không lấy trung bình', () => {
  const kq = [
    { mau: { muc_do: 'CAO', toi_da: 'CAO', ngon_ngu: 'vi', nguon: 'tai_dung' }, nhan: 'CAO' },
    { mau: { muc_do: 'CAO', toi_da: 'CAO', ngon_ngu: 'vi', nguon: 'tai_dung' }, nhan: 'CAO' },
    { mau: { muc_do: 'CAO', toi_da: 'CAO', ngon_ngu: 'en', nguon: 'tai_dung' }, nhan: 'CHUA_THAY' },
    { mau: { muc_do: 'CAO', toi_da: 'CAO', ngon_ngu: 'en', nguon: 'tai_dung' }, nhan: 'CHUA_THAY' },
  ];
  const p = B.tinhParity(kq);
  assert.strictEqual(p.theoNgonNgu.vi.dangerousRecall, 1);
  assert.strictEqual(p.theoNgonNgu.en.dangerousRecall, 0);
  assert.strictEqual(p.lechRecall, 1,
    'trung bình 50% sẽ che mất việc tiếng Anh trượt sạch');
});

// ─────────── §11 — xoá latest.json là hành vi ĐÚNG ───────────

test('§11 — /transparency chỉ đọc được số ĐÃ ĐO từ latest.json', () => {
  const fs = require('node:fs');
  const p = require('node:path').join(B.KET_QUA, 'latest.json');
  if (!fs.existsSync(p)) return;   // chưa chạy eval — đúng trạng thái "chưa đo"
  const bao = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.ok(bao.metadata, 'báo cáo không có metadata thì không dùng được');
  assert.ok(bao.metadata.commitSha, 'thiếu commit SHA');
  assert.ok(bao.metadata.datasetVersion, 'thiếu dataset version');
  if (bao.metadata.aiDaChay) assert.ok(bao.metadata.model, 'đã chạy AI thì phải ghi tên model');
  else assert.strictEqual(bao.metadata.model, null, 'chưa chạy AI thì model phải rỗng');
});
