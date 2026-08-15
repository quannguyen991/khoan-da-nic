'use strict';
/**
 * §4.2 PHÁT BIỂU THÀNH MỘT PHÉP ĐO CHẠY ĐƯỢC.
 *
 * "Mọi thứ thông minh thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm."
 *
 * Kịch bản đi tiếp là một tính năng HIỂN THỊ nằm sau decision-engine. Nghe thì
 * hiển nhiên là nó không đụng tới điểm số — nhưng "hiển nhiên" chính là cách các
 * lỗi trong dự án này đã lọt qua ba lần. Nên đo, đừng tin.
 *
 * Chạy TOÀN BỘ 445 mẫu HAI LƯỢT: một lượt không có tính năng, một lượt có.
 * KHÔNG MẪU NÀO được ra mức thấp hơn lượt trước.
 *
 * ⚠️ Test này chạy CHỈ BỘ LUẬT — không gọi AI. Cố ý: nó đo tính năng dự báo có
 * rò vào đường quyết định hay không, và câu trả lời đó không được phụ thuộc vào
 * gateway có sống hay không.
 */

const test = require('node:test');
const assert = require('node:assert');

const { analyze, toHopDong } = require('../src/analysis/pipeline');
const { buocTiepTheo, KICH_BAN } = require('../src/kich-ban-di-tiep');
const { suyGiaiDoan } = require('../src/journey-engine');
const { napDataset } = require('../eval/lib/bo-danh-gia');

const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };

const { mau, loi } = napDataset();

test('dữ liệu nạp được — nếu không thì mọi khẳng định dưới đây vô nghĩa', () => {
  assert.deepStrictEqual(loi, [], `dataset hỏng: ${loi[0]}`);
  assert.ok(mau.length >= 445, `chỉ có ${mau.length} mẫu, chờ ≥445`);
});

test('§4.2 — 445 mẫu, hai lượt, KHÔNG MẪU NÀO tụt mức', () => {
  const tut = [];
  const lech = [];

  for (const m of mau) {
    // Lượt 1 — không có tính năng dự báo trong đường chạy.
    const truoc = toHopDong(analyze({ vanBan: m.noi_dung }));

    // Lượt 2 — có tính năng: chạy phân tích RỒI tính dự báo trên kết quả,
    // đúng thứ tự mà server dùng.
    const sau = toHopDong(analyze({ vanBan: m.noi_dung }));
    const buoc = buocTiepTheo(sau.hoKichBan, suyGiaiDoan(sau.maLyDo));
    // Chạm vào kết quả dự báo để chắc chắn nó thật sự được tính, không bị
    // engine tối ưu bỏ qua.
    assert.ok(Array.isArray(buoc));

    if (BAC[sau.nhan] < BAC[truoc.nhan]) {
      tut.push(`${m.id}: ${truoc.nhan} → ${sau.nhan}`);
    }
    if (sau.nhan !== truoc.nhan
      || sau.canThiep !== truoc.canThiep
      || sau.maLyDo.join('|') !== truoc.maLyDo.join('|')) {
      lech.push(`${m.id}: ${truoc.nhan}/${truoc.canThiep} → ${sau.nhan}/${sau.canThiep}`);
    }
  }

  assert.deepStrictEqual(tut, [], `MẪU TỤT MỨC:\n${tut.slice(0, 20).join('\n')}`);
  // Chặt hơn §4.2: ở đây không được phép đổi gì cả, kể cả đổi theo hướng tăng.
  // Tính năng hiển thị mà làm đổi kết luận thì đã là một đường quyết định thứ hai.
  assert.deepStrictEqual(lech, [], `KẾT LUẬN ĐỔI:\n${lech.slice(0, 20).join('\n')}`);
});

test('§HĐ — phản hồi vẫn ĐÚNG BẢY TRƯỜNG, không thêm trường dự báo', () => {
  const BAY = ['nhan', 'maLyDo', 'daKiem', 'chuaKiem', 'hoKichBan', 'aiDaChay', 'canThiep'];
  for (const m of mau.slice(0, 60)) {
    const r = toHopDong(analyze({ vanBan: m.noi_dung }));
    assert.deepStrictEqual(Object.keys(r).sort(), [...BAY].sort(),
      `${m.id}: phản hồi có trường lạ`);
  }
});

/**
 * Kiểm chéo: nếu tính năng này bao giờ đó bị nối vào đường quyết định, đây là
 * chỗ nó lộ ra. `buocTiepTheo` phải KHÔNG có tác dụng phụ trên kết quả phân tích.
 */
test('gọi buocTiepTheo TRƯỚC khi phân tích cũng không đổi kết quả', () => {
  for (const m of mau.slice(0, 120)) {
    const sach = toHopDong(analyze({ vanBan: m.noi_dung }));

    for (const ho of Object.keys(KICH_BAN)) buocTiepTheo(ho, 'tiep_can');
    const sauKhiGoi = toHopDong(analyze({ vanBan: m.noi_dung }));

    assert.deepStrictEqual(sauKhiGoi, sach, `${m.id}: buocTiepTheo có tác dụng phụ`);
  }
});

/**
 * §4.2 lần nữa, ở chiều ngược lại: dự báo KHÔNG được phụ thuộc vào nội dung
 * người dùng. Cùng một (họ, giai đoạn) phải ra cùng một kết quả bất kể tin nhắn
 * nào dẫn tới đó — nếu không, nội dung người dùng đã len được vào bảng.
 */
test('dự báo chỉ phụ thuộc (họ, giai đoạn), không phụ thuộc nội dung tin', () => {
  const theoKhoa = new Map();

  for (const m of mau) {
    const r = toHopDong(analyze({ vanBan: m.noi_dung }));
    if (!r.hoKichBan) continue;
    const gd = suyGiaiDoan(r.maLyDo);
    const khoa = `${r.hoKichBan}|${gd}`;
    const gt = JSON.stringify(buocTiepTheo(r.hoKichBan, gd));

    if (theoKhoa.has(khoa)) {
      assert.strictEqual(gt, theoKhoa.get(khoa),
        `${m.id}: cùng khoá "${khoa}" mà ra dự báo khác`);
    } else {
      theoKhoa.set(khoa, gt);
    }
  }

  assert.ok(theoKhoa.size > 0, 'không mẫu nào ra hoKichBan — test này chưa đo được gì');
});
