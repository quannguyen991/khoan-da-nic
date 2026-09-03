'use strict';
/**
 * §15.9 + §15.16 — TEST BẮT BUỘC CHO TRUY CẬP NHANH LÚC ĐANG BỊ GỌI.
 *
 * ⚠️ §15.8 — toàn bộ §15 là KÊNH ĐẦU VÀO MỚI, không phải mức can thiệp mới.
 * Nếu một ca ở đây đòi thêm `canThiep` thứ sáu hay override thứ 11 thì ca đó
 * sai, không phải bộ luật sai.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { analyze, toHopDong, unreadableInputFloor } = require('../backend/src/analysis/pipeline');
const Q = require('../backend/src/bo-hoi-nhanh');
const { MUC_CAN_THIEP } = require('../backend/src/intervention-ladder');
const { CRITICAL_OVERRIDES } = require('../backend/src/analysis/critical-overrides');
const { layDanhBa } = require('../backend/src/analysis/verified-institution-registry');

// ═══════════ §15.9.1 — trả lời hết bằng KHÔNG ═══════════

test('§15.9.1 — trả lời HẾT bằng KHÔNG: daKiem KHÔNG chứa nghe_cuoc_goi', () => {
  const traLoi = Object.fromEntries(Q.CAU_HOI.map((c) => [c.ma, false]));
  const kq = analyze({ traLoiBoHoiNhanh: traLoi });
  assert.ok(!kq.daKiem.includes('nghe_cuoc_goi'));
  assert.ok(!kq.daKiem.some((d) => d.includes('cuoc_goi')));
});

test('§15.9.1 — chuaKiem VẪN chứa chua_nghe_duoc_cuoc_goi, không có ngoại lệ', () => {
  // §15.8: "không có ngoại lệ, KỂ CẢ khi bác trả lời hết bảng hỏi".
  for (const dapAn of [true, false]) {
    const traLoi = Object.fromEntries(Q.CAU_HOI.map((c) => [c.ma, dapAn]));
    const kq = analyze({ traLoiBoHoiNhanh: traLoi });
    assert.ok(kq.chuaKiem.includes('chua_nghe_duoc_cuoc_goi'),
      `trả lời toàn ${dapAn} mà mất dòng "chưa nghe được cuộc gọi"`);
  }
});

test('§4.2 — trả lời KHÔNG không bao giờ TRỪ điểm', () => {
  const co = analyze({ traLoiBoHoiNhanh: { ho_bao_chuyen_tien_hoac_rut_tien: true } });
  const coVaKhong = analyze({
    traLoiBoHoiNhanh: { ho_bao_chuyen_tien_hoac_rut_tien: true, ho_bao_dung_cup_may: false },
  });
  assert.ok(coVaKhong.score >= co.score, 'trả lời KHÔNG làm tụt điểm');
});

// ═══════════ §15.8 — không đổi hợp đồng ═══════════

test('§15.8 — canThiep vẫn ĐÚNG NĂM giá trị, KHÔNG có LIVE_CALL', () => {
  assert.strictEqual(MUC_CAN_THIEP.length, 5);
  assert.ok(!MUC_CAN_THIEP.includes('LIVE_CALL'));
});

test('§15.3.3 — KHÔNG thêm override thứ 11: bộ luật cũ đã bắt trọn', () => {
  assert.strictEqual(CRITICAL_OVERRIDES.length, 10);
  const ca = [
    [{ ho_xin_ma_trong_tin_nhan: true, ho_bao_chuyen_tien_hoac_rut_tien: true }, 'CO-01'],
    [{ ho_bao_cai_ung_dung_hoac_bam_link: true }, 'CO-02'],
    [{ ho_nhac_tai_khoan_an_toan: true }, 'CO-03'],
    [{ ho_bao_dung_noi_voi_ai: true, ho_noi_sap_bi_bat_hoac_phat: true, ho_bao_chuyen_tien_hoac_rut_tien: true }, 'CO-05'],
  ];
  for (const [traLoi, ov] of ca) {
    const kq = analyze({ traLoiBoHoiNhanh: traLoi });
    assert.ok(kq.overrides.includes(ov), `bộ hỏi nhanh không ra ${ov}`);
    assert.strictEqual(kq.canThiep, 'PROTECTED_CRITICAL');
  }
});

test('§15.8 — đường bộ hỏi nhanh chạy OFFLINE, aiDaChay luôn false', () => {
  const kq = analyze({ traLoiBoHoiNhanh: { ho_nhac_tai_khoan_an_toan: true } });
  assert.strictEqual(kq.aiDaChay, false);
});

test('§15.8 — trả về ĐÚNG bảy trường hợp đồng, không thêm trường nào', () => {
  const hd = toHopDong(analyze({ traLoiBoHoiNhanh: { ho_bao_dung_cup_may: true } }));
  assert.strictEqual(Object.keys(hd).length, 7);
});

// ═══════════ §15.13 — câu về ngân hàng ═══════════

test('§15.13 — câu "nói gì với ngân hàng" ở VỊ TRÍ THỨ HAI, không phải cuối', () => {
  assert.strictEqual(Q.CAU_HOI[1].ma, 'co_ai_dan_noi_gi_voi_ngan_hang',
    'không có giao dịch tử tế nào cần nói dối ngân hàng — câu này phải sớm');
});

test('§15.3.3 — câu về ngân hàng ghi chú vào hồ sơ vụ việc', () => {
  assert.deepStrictEqual(Q.ghiChuVuViec({ co_ai_dan_noi_gi_voi_ngan_hang: true }),
    ['co_ai_dan_noi_gi_voi_ngan_hang']);
  assert.deepStrictEqual(Q.ghiChuVuViec({ co_ai_dan_noi_gi_voi_ngan_hang: false }), []);
});

// ═══════════ §15.9.12 — nhánh "không rõ" ═══════════

test('§15.9.12 — nhánh "không rõ" KHÔNG dẫn tới TRUST_RECEIPT một mình', () => {
  const n = Q.chonNhanh('khong_ro');
  assert.deepStrictEqual(n.tinHieu, [], 'nhánh này không tự sinh tín hiệu');
  assert.strictEqual(n.sangBoHoiDayDu, true);
  assert.strictEqual(n.hoiTiep.length, Q.CAU_HOI.length,
    'người không diễn đạt được là người CẦN GIÚP NHẤT — phải đi hết bộ hỏi');
});

test('§15.11.1 — nhánh "gửi giấy tờ" cũng sang bộ hỏi đầy đủ', () => {
  const n = Q.chonNhanh('gui_giay_to');
  assert.deepStrictEqual(n.tinHieu, []);
  assert.strictEqual(n.sangBoHoiDayDu, true);
});

test('§15.11.1 — ba nhánh có tín hiệu bật đúng mã', () => {
  assert.deepStrictEqual(Q.chonNhanh('chuyen_tien').tinHieu, ['FIN_TRANSFER_REQUEST']);
  assert.deepStrictEqual(Q.chonNhanh('doi_otp').tinHieu, ['CRED_OTP_SHARE']);
  assert.deepStrictEqual(Q.chonNhanh('cai_ung_dung').tinHieu, ['DEV_INSTALL_APK_UNKNOWN']);
});

test('§15.11.1 — nhánh rút gọn hỏi ÍT hơn bộ đầy đủ', () => {
  for (const ma of ['chuyen_tien', 'doi_otp', 'cai_ung_dung']) {
    assert.ok(Q.chonNhanh(ma).hoiTiep.length < Q.CAU_HOI.length, ma);
  }
});

// ═══════════ §15.9.2 — nguồn đầu vào thứ tư ═══════════

test('§15.9.2 · §4.3 — thông báo bị cắt / rỗng / đã xoá KHÔNG ra nhãn thấp', () => {
  const ca = [
    ['thongBaoBiCat', 'chi_doc_duoc_mot_phan_tin'],
    ['thongBaoKhongCoNoiDung', 'thong_bao_khong_co_noi_dung'],
    ['thongBaoDaBiXoa', 'thong_bao_da_bi_xoa'],
  ];
  for (const [co, ma] of ca) {
    const san = unreadableInputFloor({ thongBao: 'x', [co]: true });
    assert.ok(san.chuaKiem.includes(ma), `thiếu mã ${ma}`);
    assert.ok(!san.daKiem.includes('thong_bao_tin_nhan'));

    const kq = analyze({ thongBao: 'x', [co]: true });
    assert.notStrictEqual(kq.nhan, 'CHUA_THAY',
      'không đọc được ≠ đọc rồi không thấy gì');
  }
});

test('§15.4.1 — thông báo đọc được thì mới vào daKiem', () => {
  const san = unreadableInputFloor({ thongBao: 'x' });
  assert.deepStrictEqual(san.daKiem, ['thong_bao_tin_nhan']);
  assert.deepStrictEqual(san.chuaKiem, []);
});

// ═══════════ §15.9.3 · §15.6.1 — những câu không được viết ═══════════

const TU_CAM = [
  'bao_ve_cuoc_goi', 'da_chan', 'da_xac_minh', 'an_toan',
  'call_protected', 'blocked', 'verified', 'safe',
];

/**
 * ⚠️ QUY TAC PHAN BIET — toi da nham cho nay BA LAN trong mot buoi.
 *
 * §15.6.1 cam nhung cau KHOAN DA NOI VE KET QUA: "dang bao ve cuoc goi",
 * "so nay da xac minh", "da chan cuoc goi lua dao", "an toan".
 *
 * No KHONG cam viec GOI TEN THU DOAN. Ba ma duoi day trich chinh loi ke lua dao
 * hoac ten thu doan, va cam chung la cam san pham mo ta duoc thu no dang chong:
 *   FIN_SAFE_ACCOUNT             ten thu doan "tai khoan an toan" gia
 *   OFF_INVESTMENT_GUARANTEE     loi ke lua dao cam ket loi nhuan
 *   ho_nhac_tai_khoan_an_toan    cau hoi: "Ho nhac 'tai khoan an toan'?"
 *
 * Tieu chi: ma la LOI KHOAN DA NOI VOI NGUOI DUNG thi ap luat; ma la TEN/TRICH
 * DAN THU DOAN thi khong.
 */
const MIEN_VI_LA_TEN_THU_DOAN = new Set([
  'FIN_SAFE_ACCOUNT', 'OFF_INVESTMENT_GUARANTEE', 'ho_nhac_tai_khoan_an_toan',
  /**
   * LAN THU TU, 15/8/2026 — va lan nay o mot nhom ma hoan toan moi.
   *
   * `maBuocKichBan` (§16.1) mo ta BUOC KE TIEP CUA KE LUA DAO. Ma nay la buoc
   * "ho se bao bac chuyen sang mot 'tai khoan an toan'" — dung mot trong nhung
   * cau kinh dien nhat cua kich ban gia danh cong an.
   *
   * Cam no la cam san pham GOI TEN duoc thu no dang chong. Cung tieu chi voi ba
   * ma tren: ma la LOI KHOAN DA NOI VOI NGUOI DUNG thi ap luat; ma la TEN/TRICH
   * DAN THU DOAN thi khong.
   *
   * ⚠️ Nhung KHONG mien ca nhom `maBuocKichBan`. Mot ma buoc van co the bi viet
   * thanh loi Khoan Da noi ("DA_CHAN_BUOC_NAY"), va luc do phai do. Test ngay
   * duoi doi ma mien phai co THAT trong MA_BUOC_DA_DUNG — khong phai mot chuoi
   * ai do go vao day cho xanh test.
   */
  'DOI_CHUYEN_SANG_TAI_KHOAN_AN_TOAN',
]);

test('§15.9.3 — không MÃ nào chứa "bảo vệ cuộc gọi" / "đã chặn" / "đã xác minh" / "an toàn"', () => {
  const hd = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'src', 'config', 'ma-hop-dong.json'), 'utf8'));
  const maNguoiDoc = hd._canNhanI18n.flatMap((k) => hd[k]);
  for (const ma of maNguoiDoc) {
    const t = ma.toLowerCase();
    if (MIEN_VI_LA_TEN_THU_DOAN.has(ma)) continue;
    for (const cam of TU_CAM) {
      assert.ok(!t.includes(cam), `mã vi phạm §15.6.1: ${ma} (chứa "${cam}")`);
    }
  }
});

test('Danh sách miễn CHỈ gồm tên thủ đoạn, không có mã thông điệp nào', () => {
  // Chan viec ai do nem mot ma thong diep vao danh sach mien de lam xanh test.
  const { MA_BUOC_DA_DUNG } = require('../backend/src/kich-ban-di-tiep');
  for (const ma of MIEN_VI_LA_TEN_THU_DOAN) {
    const laTinHieu = /^(FIN_|OFF_|CRED_|DEV_|MAN_|ID_|WEB_|CASE_)/.test(ma);
    const laCauHoi = ma.startsWith('ho_');
    // ⚠️ Doi ma buoc phai CO THAT trong bang kich ban, khong phai mot chuoi go
    // vao danh sach mien cho xanh test.
    const laBuocKichBan = MA_BUOC_DA_DUNG.includes(ma);
    assert.ok(laTinHieu || laCauHoi || laBuocKichBan,
      `${ma} khong phai ten thu doan, cau hoi trich dan, hay buoc kich ban`);
  }
});

test('§15.6.1 — KHÔNG có ba mức xám/vàng/đỏ: chỉ đúng ba nhãn rủi ro', () => {
  const { RISK_LEVELS } = require('../backend/src/risk-labels');
  assert.strictEqual(RISK_LEVELS.length, 3);
  // "Có ba mức tức là có mức nhẹ nhất, và mức nhẹ nhất LUÔN bị đọc thành an toàn."
  assert.ok(!RISK_LEVELS.some((r) => /SAFE|OK|GREEN|NORMAL/i.test(r)));
});

// ═══════════ §15.9.10 — thẻ giả danh tổ chức ═══════════

test('§15.9.10 — thẻ giả danh KHÔNG render khi chưa có mục nào approved', () => {
  // §15.6.2: hôm nay support-directory.json có institutions rỗng.
  assert.deepStrictEqual(layDanhBa(), [],
    'nếu sổ đã có mục approved thì cập nhật ca này, đừng nới nó ra');
});

// ═══════════ §15.16.16 — mã tham chiếu giả ═══════════

test('§15.16.16 — KHÔNG tệp nào trong repo chứa mã tham chiếu giả 【n†Lx-Ly】', () => {
  // §11 cấm "cảnh báo không có nguồn". Các mã đó là tham chiếu nội bộ của một
  // công cụ nghiên cứu, không phải nguồn tra được.
  const goc = path.join(__dirname, '..');
  const boQua = new Set(['node_modules', '.git', 'eval', 'dist', 'output']);
  const re = /【\d+†L\d+-L\d+】/;
  const viPham = [];
  const quet = (d) => {
    for (const ten of fs.readdirSync(d)) {
      if (boQua.has(ten)) continue;
      const p = path.join(d, ten);
      const st = fs.statSync(p);
      if (st.isDirectory()) { quet(p); continue; }
      if (!/\.(js|json|md|css|html)$/.test(ten)) continue;
      if (ten === 'truy-cap-nhanh.test.js') continue;   // chính tệp này mang mẫu
      if (re.test(fs.readFileSync(p, 'utf8'))) viPham.push(path.relative(goc, p));
    }
  };
  quet(goc);
  assert.deepStrictEqual(viPham, []);
});
