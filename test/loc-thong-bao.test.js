'use strict';
/**
 * LỌC ỒN VÀ CHỐNG TRÙNG — phần logic thuần của lớp Android.
 *
 * Hai thứ dễ vỡ nhất:
 *  · chống trùng KHÔNG được lấy tên gói làm một phần của khoá (cả điểm của nó
 *    là cùng một tin đến qua hai gói khác nhau)
 *  · "bỏ qua vì ồn" phải KHÁC "bỏ qua vì không đọc được" (§4.3)
 */

const test = require('node:test');
const assert = require('node:assert');

const {
  locThongBao, taoBoChongTrung, khoaTrung, nguonTuGoi,
  suKienMatCanh, khoangMuTuSuKien, LY_BO_QUA, LOAI_MAT_CANH, CUA_SO_TRUNG_MS,
} = require('../backend/src/detect/loc-thong-bao');
const { dungBaoCaoTuan, TUAN_MS } = require('../backend/src/bao-cao-tuan');

const tb = (them = {}) => ({
  goi: 'com.zing.zalo', tieuDe: '0912345678', noiDung: 'Bác chuyển tiền giúp cháu',
  thoiDiem: 1_757_000_000_000, ...them,
});

// ── LỌC ỒN ────────────────────────────────────────────────────────────
test('nhận thông báo của app nhắn tin', () => {
  const r = locThongBao(tb());
  assert.strictEqual(r.nhan, true);
  assert.strictEqual(r.tin.nguon, 'zalo');
});

test('nhận thông báo của app ngân hàng', () => {
  assert.strictEqual(locThongBao(tb({ goi: 'com.VCB' })).nhan, true);
});

test('bỏ qua app nhạc, game, hệ thống', () => {
  for (const goi of ['com.spotify.music', 'com.mot.game', 'com.android.systemui']) {
    const r = locThongBao(tb({ goi }));
    assert.strictEqual(r.nhan, false, `nhận nhầm ${goi}`);
    assert.strictEqual(r.ly, LY_BO_QUA.on_app_khong_lien_quan);
    assert.strictEqual(r.phaiKhai, false);
  }
});

test('bỏ qua thông báo của CHÍNH Khoan Đã — nếu không là vòng lặp', () => {
  const r = locThongBao(tb({ goi: 'vn.khoanda.app' }));
  assert.strictEqual(r.nhan, false);
  assert.strictEqual(r.ly, LY_BO_QUA.on_chinh_khoan_da);
});

test('bỏ qua theo hạng mục: trình phát nhạc, tải xuống, dẫn đường', () => {
  for (const hangMuc of ['transport', 'progress', 'navigation']) {
    assert.strictEqual(locThongBao(tb({ hangMuc })).nhan, false, hangMuc);
  }
});

test('§4.3 — thông báo RỖNG phải được KHAI, không im lặng bỏ qua', () => {
  /*
   * Ta BIẾT có một tin (app nhắn tin vừa bắn thông báo) và ta KHÔNG đọc được
   * nó. Im lặng bỏ qua là biến "chưa đọc được" thành "không có gì".
   */
  const r = locThongBao(tb({ noiDung: '   ' }));
  assert.strictEqual(r.nhan, false);
  assert.strictEqual(r.ly, LY_BO_QUA.khong_co_noi_dung);
  assert.strictEqual(r.phaiKhai, true, 'thông báo rỗng bị xếp cùng loại với tiếng ồn');
});

test('lý do bỏ qua vì ồn thì KHÔNG phải khai', () => {
  assert.strictEqual(locThongBao(tb({ goi: 'com.spotify.music' })).phaiKhai, false);
});

test('gói → mã nguồn đúng', () => {
  assert.strictEqual(nguonTuGoi('com.zing.zalo'), 'zalo');
  assert.strictEqual(nguonTuGoi('com.facebook.orca'), 'messenger');
  assert.strictEqual(nguonTuGoi('com.android.mms'), 'sms');
  assert.strictEqual(nguonTuGoi('com.VCB'), 'thong_bao');
});

// ── CHỐNG TRÙNG ───────────────────────────────────────────────────────
test('cùng một tin bắn qua HAI gói khác nhau ⇒ chỉ phân tích một lần', () => {
  /*
   * Ca thật: Zalo bắn thông báo, rồi app SMS của máy bắn lại cùng nội dung
   * cách vài giây. Khoá chống trùng KHÔNG được chứa tên gói.
   */
  const bct = taoBoChongTrung();
  const noiDung = 'Bác chuyển gấp 15 triệu vào số tài khoản 19036661234';

  const mot = locThongBao(tb({ goi: 'com.zing.zalo', noiDung }), { boChongTrung: bct });
  const hai = locThongBao(tb({ goi: 'com.android.mms', noiDung, thoiDiem: 1_757_000_003_000 }),
    { boChongTrung: bct, bayGio: 1_757_000_003_000 });

  assert.strictEqual(mot.nhan, true);
  assert.strictEqual(hai.nhan, false);
  assert.strictEqual(hai.ly, LY_BO_QUA.trung_tin_da_xu_ly);
});

test('khoá chống trùng KHÔNG chứa tên gói', () => {
  // Nếu ai đó nhét gói vào khoá, test trên vẫn có thể xanh nhờ trùng khớp khác;
  // test này ghim thẳng bất biến.
  assert.strictEqual(khoaTrung('0912345678', 'xin chào'), khoaTrung('+84912345678', 'Xin  chào'));
});

test('ngoài cửa sổ 15 giây thì KHÔNG còn là trùng', () => {
  const bct = taoBoChongTrung();
  const t0 = 1_000_000;
  locThongBao(tb({ thoiDiem: t0 }), { boChongTrung: bct, bayGio: t0 });
  const sau = locThongBao(tb({ thoiDiem: t0 + CUA_SO_TRUNG_MS + 1 }),
    { boChongTrung: bct, bayGio: t0 + CUA_SO_TRUNG_MS + 1 });
  assert.strictEqual(sau.nhan, true, 'tin gửi lại sau 15 giây bị nuốt mất');
});

test('bộ chống trùng tự dọn, không phình theo thời gian', () => {
  const bct = taoBoChongTrung(1000);
  for (let i = 0; i < 100; i += 1) bct.daThay(`09${i}`, `tin ${i}`, 0);
  assert.strictEqual(bct.coBaoNhieu(), 100);
  bct.daThay('khac', 'tin khac', 5000);
  assert.strictEqual(bct.coBaoNhieu(), 1, 'mục hết hạn không được dọn');
});

test('§6.9 — bộ chống trùng KHÔNG giữ nguyên văn tin nhắn', () => {
  const k = khoaTrung('0912345678', 'Bác chuyển 15 triệu vào 19036661234');
  assert.ok(!k.includes('19036661234'));
  assert.ok(!k.includes('chuyển'));
});

// ── MẤT KHẢ NĂNG CANH ─────────────────────────────────────────────────
test('mất quyền ⇒ báo cho NGƯỜI THÂN, không báo cho người cao tuổi', () => {
  /*
   * Bác không sửa được: đường vào nằm sâu trong Cài đặt hệ thống, và trên máy
   * Xiaomi/Oppo/Vivo còn phải qua bộ quản lý pin riêng của hãng. Báo cho bác
   * chỉ tạo lo lắng không giải quyết được.
   */
  const s = suKienMatCanh({ loai: LOAI_MAT_CANH.quyen_bi_thu_hoi, tu: 1000 });
  assert.deepStrictEqual(s.baoCho, ['nguoi_than']);
  assert.deepStrictEqual(s.khongBaoCho, ['nguoi_cao_tuoi']);
});

test('loại mất canh lạ bị từ chối', () => {
  assert.throws(() => suKienMatCanh({ loai: 'khong_sao_dau', tu: 0 }));
});

test('§4.3 — mất canh biến thành khoảng mù, và chặn câu "tuần này không có gì đáng ngại"', () => {
  const den = 1_757_000_000_000;
  const suKien = [suKienMatCanh({
    loai: LOAI_MAT_CANH.service_bi_kill, tu: den - 3 * 86_400_000, den: null, hangMay: 'Xiaomi',
  })];
  const khoangMu = khoangMuTuSuKien(suKien, den);
  assert.strictEqual(khoangMu.length, 1);

  const bc = dungBaoCaoTuan({
    tu: den - TUAN_MS, den, soLuotQuet: 10, khoangMu,
    trangThaiHeThong: { quyenDocThongBao: true, chayNen: true },
  });
  assert.strictEqual(bc.maCauChinh, 'tuan_nay_co_khoang_khong_canh_duoc');
  assert.ok(bc.khoangKhongCanhDuoc[0].ly.includes('service_bi_he_thong_kill'));
});

// ── NỐI VỚI BỘ PHÁT HIỆN ──────────────────────────────────────────────
test('tin đã lọc cắm thẳng được vào detect.analyze()', () => {
  const { analyze } = require('../backend/src/detect');
  const r = locThongBao(tb({
    noiDung: 'Thông báo phạt nguội, nộp tại csgt-tracuu.top trước 24h.',
  }));
  assert.strictEqual(r.nhan, true);
  const kq = analyze(r.tin);
  assert.strictEqual(kq.nhan, 'CAO');
  assert.strictEqual(kq.nguon, 'zalo');
});
