'use strict';
/**
 * DIỄN TẬP — hàng rào cho bốn ràng buộc đạo đức.
 *
 * Test quan trọng nhất của tệp này là "không kịch bản nào gây hoảng sợ". Nó
 * quét CHÍNH thư viện kịch bản chứ không kiểm mẫu, vì kịch bản mới sẽ được thêm
 * bởi người không đọc lại khối ghi chú ở đầu `dien-tap.js`.
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  KICH_BAN, HO_KICH_BAN, HO_BI_CAM, DIEM_HANH_VI,
  taoKhoDienTap, kiemDongY, chonKichBan, toiKy, phatBai, ghiHanhVi,
  chiSoCanhGiac, hanhViChinh, doTrePhanUng, xuHuong, manGiaiThich, baoCaoChoNguoiThan,
  CHU_KY_MAC_DINH_NGAY, CHU_KY_TOI_THIEU_NGAY, LoiDienTap,
} = require('../backend/src/dien-tap');

const NGAY = 86_400_000;
const DONG_Y = { dongYDienTap: true, baoTruocLuc: 1_000, daTat: false };

// ── RÀNG BUỘC 1: ĐỒNG Ý ───────────────────────────────────────────────
test('không có phiếu đồng ý ⇒ KHÔNG phát bài nào', () => {
  const kho = taoKhoDienTap();
  assert.strictEqual(phatBai({ nguoiId: 'a', phieuDongY: null, kho }).ly, 'chua_dong_y_dien_tap');
  assert.strictEqual(phatBai({ nguoiId: 'a', phieuDongY: { dongYDienTap: false }, kho }).ly, 'chua_dong_y_dien_tap');
  assert.strictEqual(kho.tatCa().length, 0, 'đã ghi lượt dù chưa ai đồng ý');
});

test('chưa báo trước ⇒ không phát, dù đã có cờ đồng ý', () => {
  assert.strictEqual(kiemDongY({ dongYDienTap: true }).ly, 'chua_bao_truoc');
});

test('tắt bất cứ lúc nào ⇒ có hiệu lực ngay lượt kế', () => {
  const kho = taoKhoDienTap();
  assert.strictEqual(phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, bayGio: 1 }).phat, true);
  const sauKhiTat = phatBai({
    nguoiId: 'a', phieuDongY: { ...DONG_Y, daTat: true }, kho, bayGio: 100 * NGAY,
  });
  assert.strictEqual(sauKhiTat.phat, false);
  assert.strictEqual(sauKhiTat.ly, 'nguoi_dung_da_tat');
});

// ── RÀNG BUỘC 2: KHÔNG GÂY HOẢNG SỢ ───────────────────────────────────
test('KHÔNG kịch bản nào dùng nội dung gây hoảng sợ', () => {
  /*
   * Quét chính thư viện. Những họ NGUY HIỂM NHẤT ngoài đời lại là những họ
   * KHÔNG ĐƯỢC diễn tập — một bài tập gây hoảng sợ thật cho người 70 tuổi có
   * thể gây hại thật, và không con số nào đáng đổi lấy điều đó.
   */
  const CAM = [
    /tai nạn/i, /cấp cứu/i, /nhập viện/i, /bệnh viện/i, /nguy kịch/i, /qua đời/i,
    /bị bắt/i, /tạm giam/i, /khởi tố/i, /lệnh bắt/i, /công an/i, /toà án/i, /tòa án/i,
    /viện kiểm sát/i, /rửa tiền/i, /ma tuý/i, /ma túy/i, /con (?:bác|ông|bà) (?:bị|gặp)/i,
    /đe doạ/i, /đe dọa/i, /tống tiền/i,
  ];
  for (const kb of KICH_BAN) {
    for (const re of CAM) {
      assert.ok(!re.test(kb.noiDung), `${kb.ma} dùng nội dung gây hoảng sợ (${re}): "${kb.noiDung}"`);
    }
    assert.ok(HO_KICH_BAN.includes(kb.ho), `${kb.ma} dùng họ chưa khai: ${kb.ho}`);
    assert.ok(!HO_BI_CAM.includes(kb.ho), `${kb.ma} dùng họ BỊ CẤM: ${kb.ho}`);
  }
});

test('phatBai từ chối kịch bản thuộc họ bị cấm, kể cả khi gọi đích danh', () => {
  const kho = taoKhoDienTap();
  assert.throws(
    () => phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, kichBanMa: 'KHONG_TON_TAI' }),
    (e) => e instanceof LoiDienTap,
  );
});

// ── RÀNG BUỘC 3: KHÔNG CHÊ TRÁCH ──────────────────────────────────────
test('§11 — không chuỗi nào trong module mang chữ chê trách', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const nguon = fs.readFileSync(path.join(__dirname, '..', 'backend', 'src', 'dien-tap.js'), 'utf8');
  // Chỉ soi các chuỗi trong dấu nháy đơn — phần bình luận có quyền nhắc tới
  // chính những chữ này để giải thích vì sao chúng bị cấm.
  const chuoi = nguon.match(/'[^']*'/g) || [];
  for (const s of chuoi) {
    for (const cam of ['that_bai', 'sai_roi', 'bi_lua', 'truot', 'dat_hay', 'diem_kem']) {
      assert.ok(!s.includes(cam), `chuỗi mang chữ chê trách: ${s}`);
    }
  }
});

test('màn giải thích nói ĐÚNG thứ tự: là diễn tập → gỡ tội → dấu hiệu → khen', () => {
  const m = manGiaiThich('DT-03');
  assert.deepStrictEqual(m.maCau, [
    'day_la_bai_dien_tap', 'tin_that_cung_trong_y_nhu_vay', 'dau_hieu_nhan_biet',
  ]);
  assert.strictEqual(m.maKhen, 'cam_on_bac_da_tham_gia');
  assert.ok(m.dauHieu.length > 0);
});

test('báo cáo cho người thân KHÔNG chấm đạt/trượt', () => {
  const bc = baoCaoChoNguoiThan({
    kichBanMa: 'DT-03', ho: 'phat_nguoi', doKho: 2, guiLuc: 0, daBamLink: true, bamLinkLuc: 500,
  });
  for (const cam of ['datHay', 'truot', 'ketQuaThi', 'diemSo']) {
    assert.ok(!(cam in bc), `báo cáo có trường chấm điểm: ${cam}`);
  }
  assert.strictEqual(bc.hanhVi, 'bam_link');
  assert.ok(bc.goiYNoiChuyen && bc.goiYNoiChuyen.length > 10, 'thiếu câu gợi ý nói chuyện');
});

// ── RÀNG BUỘC 4: KHÔNG ĐÒI NHẬP GÌ THẬT ───────────────────────────────
test('trang diễn tập KHÔNG có ô nhập liệu nào', () => {
  for (const kb of KICH_BAN) {
    assert.ok(!('oNhap' in kb), `${kb.ma} khai ô nhập liệu`);
    assert.strictEqual(manGiaiThich(kb.ma).coONhap, false);
  }
});

test('link diễn tập là đường dẫn NỘI BỘ, không phải tên miền ngoài', () => {
  for (const kb of KICH_BAN) {
    assert.ok(kb.link.startsWith('/dien-tap/'), `${kb.ma} trỏ ra ngoài: ${kb.link}`);
    assert.ok(!/https?:/i.test(kb.link), `${kb.ma} dùng URL tuyệt đối`);
  }
});

test('tin diễn tập LUÔN mang cờ laDienTap', () => {
  const kho = taoKhoDienTap();
  const ra = phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, bayGio: 1 });
  assert.strictEqual(ra.tin.laDienTap, true);
  assert.ok(ra.tin.noiDung.includes('/dien-tap/'));
});

// ── TẦN SUẤT VÀ ĐỘ KHÓ ────────────────────────────────────────────────
test('tần suất mặc định 1 bài / 2 tuần', () => {
  assert.strictEqual(CHU_KY_MAC_DINH_NGAY, 14);
  const lichSu = [{ guiLuc: 0 }];
  assert.strictEqual(toiKy(lichSu, 13 * NGAY), false);
  assert.strictEqual(toiKy(lichSu, 14 * NGAY), true);
});

test('người thân chỉnh được tần suất, nhưng có sàn 7 ngày', () => {
  const kho = taoKhoDienTap();
  phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, bayGio: 0 });
  // Xin 1 ngày/lần — bị kéo về sàn 7 ngày, nên ngày thứ 3 vẫn chưa tới kỳ.
  const ra = phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, bayGio: 3 * NGAY, chuKyNgay: 1 });
  assert.strictEqual(ra.ly, 'chua_toi_ky');
  assert.strictEqual(CHU_KY_TOI_THIEU_NGAY, 7);
});

test('bắt đầu từ bậc dễ nhất', () => {
  assert.strictEqual(chonKichBan([]).doKho, 1);
});

test('chỉ tăng bậc sau HAI lượt xử lý đúng ở bậc hiện tại', () => {
  const bac1 = KICH_BAN.filter((k) => k.doKho === 1);
  const mot = [{ kichBanMa: bac1[0].ma, daGoiNguoiThan: true }];
  assert.strictEqual(chonKichBan(mot).doKho, 1, 'tăng bậc quá sớm');

  const hai = [...mot, { kichBanMa: bac1[1].ma, daBaoLaLuaDao: true }];
  assert.strictEqual(chonKichBan(hai).doKho, 2);
});

test('KHÔNG tăng bậc sau một lượt mắc bẫy', () => {
  const bac1 = KICH_BAN.filter((k) => k.doKho === 1);
  const lichSu = bac1.map((k) => ({ kichBanMa: k.ma, daBamLink: true }));
  assert.strictEqual(chonKichBan(lichSu).doKho, 1);
});

// ── ĐO LƯỜNG ──────────────────────────────────────────────────────────
test('ghi đủ năm thứ: gửi, mở, bấm link, gọi người thân, bao lâu sau', () => {
  const kho = taoKhoDienTap();
  const { luot } = phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, bayGio: 1_000 });
  ghiHanhVi(kho, luot.id, 'da_mo', 4_000);
  ghiHanhVi(kho, luot.id, 'da_goi_nguoi_than', 9_000);
  const l = kho.lay(luot.id);
  assert.strictEqual(l.daMo, true);
  assert.strictEqual(l.daGoiNguoiThan, true);
  assert.strictEqual(doTrePhanUng(l), 3_000);
});

test('ghiHanhVi từ chối hành vi lạ', () => {
  const kho = taoKhoDienTap();
  const { luot } = phatBai({ nguoiId: 'a', phieuDongY: DONG_Y, kho, bayGio: 1 });
  assert.throws(() => ghiHanhVi(kho, luot.id, 'da_hieu_va_doc'), (e) => e instanceof LoiDienTap);
});

test('gọi người thân là hành vi được chấm cao nhất', () => {
  const d = DIEM_HANH_VI;
  assert.ok(d.goi_nguoi_than > d.bao_la_lua_dao);
  assert.ok(d.bao_la_lua_dao > d.mo_khong_bam);
  assert.ok(d.mo_khong_bam > d.khong_phan_ung, '"không phản ứng" phải dưới "mở mà không bấm" — §4.3');
  assert.ok(d.khong_phan_ung > d.bam_link);
  assert.ok(d.bam_link > 0, 'mắc bẫy KHÔNG được chấm 0 — bác vẫn tham gia bài tập');
});

test('bấm link RỒI gọi người thân vẫn được chấm là gọi người thân', () => {
  assert.strictEqual(hanhViChinh({ daBamLink: true, daGoiNguoiThan: true, daMo: true }), 'goi_nguoi_than');
});

test('chỉ số cảnh giác: 0 lượt ⇒ null, không phải 0', () => {
  assert.strictEqual(chiSoCanhGiac([]), null);
});

test('chỉ số cảnh giác tăng khi hành vi tốt lên', () => {
  const xau = [{ daBamLink: true }, { daBamLink: true }];
  const tot = [{ daGoiNguoiThan: true }, { daGoiNguoiThan: true }];
  assert.ok(chiSoCanhGiac(tot) > chiSoCanhGiac(xau));
  assert.strictEqual(chiSoCanhGiac(tot), 100);
  assert.strictEqual(chiSoCanhGiac(xau), 5);
});

test('xu hướng theo tuần — tuần không có bài ⇒ chiSo null, không phải 0', () => {
  const den = 10 * 7 * NGAY;
  const ds = [
    { guiLuc: den - 1 * NGAY, daGoiNguoiThan: true },
    { guiLuc: den - 8 * NGAY, daBamLink: true },
  ];
  const xh = xuHuong(ds, { soTuan: 4, den });
  assert.strictEqual(xh.length, 4);
  assert.strictEqual(xh[3].chiSo, 100);          // tuần gần nhất
  assert.strictEqual(xh[2].chiSo, 5);            // tuần trước đó
  assert.strictEqual(xh[1].chiSo, null, 'tuần trống bị vẽ thành cú tụt không có thật');
  assert.strictEqual(xh[1].soBai, 0);
});

test('mỗi kịch bản có đủ dấu hiệu nhận biết và câu gợi ý nói chuyện', () => {
  for (const kb of KICH_BAN) {
    assert.ok(kb.dauHieu.length >= 2, `${kb.ma} có ít hơn hai dấu hiệu`);
    assert.ok(kb.goiYNoiChuyen.length > 20, `${kb.ma} thiếu câu gợi ý nói chuyện`);
    assert.ok(kb.noiDung.includes('{link}'), `${kb.ma} không có chỗ chèn link`);
  }
});
