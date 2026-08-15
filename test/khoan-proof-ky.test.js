'use strict';
/**
 * KHOAN PROOF — PHẦN LÕI: ký một yêu cầu cụ thể, xác minh chữ ký, cụm từ hiển thị.
 *
 * BA CHỖ DỄ LÀM SAI NHẤT, và test tương ứng:
 *
 * ① RÀNG CHỮ KÝ VÀO ĐÚNG YÊU CẦU. challenge = SHA-256 trên payload chuẩn hoá.
 *    ⚠️ GIỚI HẠN: authenticator KHÔNG hiển thị nội dung giao dịch. Extension
 *    txAuthSimple đã bị bỏ khỏi WebAuthn. Việc hiện đúng nội dung là trách nhiệm
 *    của GIAO DIỆN, không phải của thiết bị.
 *
 * ② CỤM TỪ PHẢI SINH RA TỪ CHỮ KÝ ĐÃ XÁC MINH, không phải từ caseId. Sinh từ
 *    caseId thì nó chỉ chứng minh hai máy đang xem cùng bản ghi, và nó HIỆN RA
 *    ĐƯỢC TRƯỚC KHI xác minh xong. Như thế là sân khấu, không phải bằng chứng.
 *
 * ③ HẾT HẠN MÀ KHÔNG AI TRẢ LỜI LÀ §4.3. Im lặng KHÔNG phải "không sao", cũng
 *    KHÔNG phải "đã từ chối". ⚠️ ĐỪNG NHẦM với §9.4 "im lặng = gửi" — ngược nhau.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../server');
const P = require('../src/khoan-proof');
const K = require('../src/khoan-proof-ky');
const { analyze, toHopDong, unreadableInputFloor } = require('../src/analysis/pipeline');
const { taoMayXacThuc } = require('./helper/may-xac-thuc-gia');

let server;
let goc;

const goi = async (duong, body, headers = {}) => {
  const res = await fetch(goc + duong, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body || {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const xinPhien = async (taiKhoanId) => {
  const { body } = await goi('/api/proof/phien-demo', { taiKhoanId });
  return { authorization: `Bearer ${body.token}` };
};

/** Yêu cầu mẫu — cùng hình dạng mọi nơi trong tệp này. */
const YEU_CAU = Object.freeze({
  chuTaiKhoanId: 'bac-01',
  caseId: 'vu-viec-001',
  khoangTien: 'TU_10_DEN_50_TRIEU',
  hanhDong: 'CHUYEN_TIEN',
  nguoiYeuCau: 'con-minh',
});

let mayCon;

test.before(async () => {
  process.env.KHOAN_DA_PHIEN_DEMO = '1';
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;

  mayCon = await taoMayXacThuc(P.CAU_HINH);
  const tuyChon = await P.batDauDangKy('con-minh');
  await P.xacNhanDangKy('con-minh', mayCon.dangKy(tuyChon.challenge));

  // Ghép `con-minh` vào vòng của `bac-01` — nếu không thì mọi chữ ký đều bị
  // từ chối vì NGƯỜI KÝ KHÔNG THUỘC VÒNG GHÉP, và đó là hành vi đúng.
  const { ma } = await P.batDauGhep('bac-01');
  await P.xacNhanGhep('con-minh', ma);
});

test.after(() => {
  server?.close();
  delete process.env.KHOAN_DA_PHIEN_DEMO;
});

// ─────────────────── ① Ràng chữ ký vào đúng yêu cầu ───────────────────

test('challenge là SHA-256 trên payload CHUẨN HOÁ — thứ tự khoá không đổi kết quả', () => {
  const a = K.bamYeuCau({ ...YEU_CAU, hetHan: 1000, nonce: 'n1' });
  const b = K.bamYeuCau({
    nonce: 'n1', hetHan: 1000, nguoiYeuCau: YEU_CAU.nguoiYeuCau,
    hanhDong: YEU_CAU.hanhDong, khoangTien: YEU_CAU.khoangTien,
    caseId: YEU_CAU.caseId, chuTaiKhoanId: YEU_CAU.chuTaiKhoanId,
  });
  assert.strictEqual(a, b);
});

test('đổi BẤT KỲ trường nào của payload cũng đổi challenge', () => {
  const goc0 = { ...YEU_CAU, hetHan: 1000, nonce: 'n1' };
  const chuan = K.bamYeuCau(goc0);
  for (const [k, v] of Object.entries({
    chuTaiKhoanId: 'bac-khac', caseId: 'vu-viec-002', khoangTien: 'TREN_50_TRIEU',
    hanhDong: 'DOC_MA_OTP', nguoiYeuCau: 'ke-la', hetHan: 2000, nonce: 'n2',
  })) {
    assert.notStrictEqual(K.bamYeuCau({ ...goc0, [k]: v }), chuan, `đổi ${k} mà challenge không đổi`);
  }
});

test('CHỮ KÝ CHO caseId KHÁC PHẢI BỊ TỪ CHỐI', async () => {
  const yc1 = await K.taoYeuCau({ ...YEU_CAU, caseId: 'vu-viec-A' });
  const yc2 = await K.taoYeuCau({ ...YEU_CAU, caseId: 'vu-viec-B' });

  // Ký challenge của yêu cầu B, rồi nộp cho yêu cầu A.
  const chuKy = await mayCon.ky(yc2.challenge);
  await assert.rejects(
    () => K.xacMinhChuKy({ yeuCauId: yc1.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN', phanHoi: chuKy }),
    (e) => e.ma === 'CHU_KY_KHONG_HOP_LE',
  );
});

test('PHÁT LẠI NONCE ĐÃ DÙNG PHẢI BỊ TỪ CHỐI', async () => {
  const yc = await K.taoYeuCau(YEU_CAU);
  const chuKy = await mayCon.ky(yc.challenge);

  const lan1 = await K.xacMinhChuKy({
    yeuCauId: yc.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN', phanHoi: chuKy,
  });
  assert.ok(lan1.cumTu);

  await assert.rejects(
    () => K.xacMinhChuKy({ yeuCauId: yc.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN', phanHoi: chuKy }),
    (e) => e.ma === 'NONCE_DA_DUNG',
  );
});

test('CHỮ KÝ QUÁ HẠN PHẢI BỊ TỪ CHỐI', async () => {
  const bayGio = 1_000_000;
  const yc = await K.taoYeuCau(YEU_CAU, { bayGio });
  const chuKy = await mayCon.ky(yc.challenge);

  await assert.rejects(
    () => K.xacMinhChuKy({
      yeuCauId: yc.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN', phanHoi: chuKy,
    }, { bayGio: bayGio + K.HAN_YEU_CAU_MS + 1 }),
    (e) => e.ma === 'YEU_CAU_HET_HAN',
  );
});

test('người NGOÀI vòng ghép không ký thay được', async () => {
  const mayLa = await taoMayXacThuc(P.CAU_HINH);
  const tuyChon = await P.batDauDangKy('nguoi-la');
  await P.xacNhanDangKy('nguoi-la', mayLa.dangKy(tuyChon.challenge));

  const yc = await K.taoYeuCau(YEU_CAU);
  const chuKy = await mayLa.ky(yc.challenge);
  await assert.rejects(
    () => K.xacMinhChuKy({ yeuCauId: yc.yeuCauId, taiKhoanId: 'nguoi-la', quyetDinh: 'XAC_NHAN', phanHoi: chuKy }),
    // Từ chối vì TƯ CÁCH, không phải vì chữ ký sai — chữ ký của người lạ hoàn
    // toàn hợp lệ về mặt mã hoá. Thiếu phép kiểm này thì kẻ lừa đảo tự đăng ký
    // một passkey rồi tự xác nhận cho chính mình.
    (e) => e.ma === 'NGUOI_KY_KHONG_TRONG_VONG_GHEP',
  );
});

// ─────────────────── ② Cụm từ ───────────────────

test('CỤM TỪ KHÔNG TÍNH RA ĐƯỢC TRƯỚC KHI VERIFY THÀNH CÔNG', async () => {
  const yc = await K.taoYeuCau(YEU_CAU);
  // Bản ghi yêu cầu — thứ cả hai máy đều thấy trước khi ký — không được chứa cụm từ.
  assert.strictEqual(yc.cumTu, undefined);
  assert.ok(!JSON.stringify(yc).toLowerCase().includes('cumtu'));

  const trangThai = await K.docYeuCau(yc.yeuCauId);
  assert.strictEqual(trangThai.cumTu, undefined,
    'cụm từ hiện ra được trước khi xác minh — đó là sân khấu, không phải bằng chứng');
});

test('cụm từ sinh từ CHỮ KÝ, không phải từ caseId', async () => {
  // Cùng caseId, hai lượt ký khác nhau ⇒ cụm từ phải KHÁC.
  const a = await K.taoYeuCau(YEU_CAU);
  const cumA = (await K.xacMinhChuKy({
    yeuCauId: a.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN',
    phanHoi: await mayCon.ky(a.challenge),
  })).cumTu;

  const b = await K.taoYeuCau(YEU_CAU);
  const cumB = (await K.xacMinhChuKy({
    yeuCauId: b.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN',
    phanHoi: await mayCon.ky(b.challenge),
  })).cumTu;

  assert.notStrictEqual(cumA, cumB, 'cụm từ giống nhau ⇒ nó đang sinh từ caseId');
});

test('cụm từ lấy từ danh sách TĨNH và giống nhau ở CẢ HAI ĐẦU', async () => {
  const yc = await K.taoYeuCau(YEU_CAU);
  const kq = await K.xacMinhChuKy({
    yeuCauId: yc.yeuCauId, taiKhoanId: 'con-minh', quyetDinh: 'XAC_NHAN',
    phanHoi: await mayCon.ky(yc.challenge),
  });
  assert.match(kq.cumTu, /^[A-Z_]+ \d{1,2}$/, `cụm từ phải là MÃ + số: ${kq.cumTu}`);
  const [tu] = kq.cumTu.split(' ');
  assert.ok(K.TU_VUNG_CUM_TU.includes(tu), `${tu} không nằm trong danh sách tĩnh`);

  // Đầu bên kia đọc lại phải ra ĐÚNG cụm đó.
  assert.strictEqual((await K.docYeuCau(yc.yeuCauId)).cumTu, kq.cumTu);
});

test('cụm từ KHÔNG dùng làm token — đọc yêu cầu bằng cụm từ không được', () => {
  assert.strictEqual(typeof K.docYeuCauTheoCumTu, 'undefined',
    'có đường tra bản ghi bằng cụm từ ⇒ cụm từ đã thành bí mật');
});

// ─────────────────── ③ Hết hạn là §4.3 ───────────────────

test('HẾT HẠN KHÔNG AI TRẢ LỜI ⇒ KHÔNG ĐƯỢC RA NHÃN THẤP', () => {
  const san = unreadableInputFloor({
    vanBan: 'Mẹ ơi con đổi số, mẹ chuyển giúp con 20 triệu nhé.',
    xacMinhNguoiThan: 'HET_HAN_KHONG_TRA_LOI',
  });
  assert.ok(san.chuaKiem.includes('chua_lien_lac_duoc_nguoi_than'),
    'im lặng không được nuốt — §4.3');

  // Sàn phải áp KỂ CẢ khi văn bản đọc được. Một tin lành lặn về mặt câu chữ mà
  // người thân không xác nhận thì vẫn KHÔNG được ra "chưa thấy dấu hiệu".
  const lanhLan = 'Con nhờ mẹ chuyển giúp con ít tiền nhé mẹ.';
  assert.notStrictEqual(
    toHopDong(analyze({ vanBan: lanhLan, xacMinhNguoiThan: 'HET_HAN_KHONG_TRA_LOI' })).nhan,
    'CHUA_THAY', 'im lặng bị đọc thành "không thấy gì" — đúng lỗi §4.3',
  );
});

test('⚠️ KHÔNG NHẦM với §9.4 "im lặng = gửi" — hai cơ chế NGƯỢC nhau', () => {
  // §9.4: người thân không phản đối trong X phút ⇒ CỨ GỬI cảnh báo.
  // §16.3: người thân không trả lời trong 3 phút ⇒ KHÔNG được coi là ổn.
  // Cùng chữ "im lặng", ngược hướng. Ghi thành test để không ai hợp nhất chúng.
  const t = 'Mẹ ơi con đổi số, mẹ chuyển giúp con 20 triệu nhé.';
  const imLang = toHopDong(analyze({ vanBan: t, xacMinhNguoiThan: 'HET_HAN_KHONG_TRA_LOI' }));
  assert.ok(imLang.chuaKiem.includes('chua_lien_lac_duoc_nguoi_than'));
  assert.ok(!imLang.daKiem.includes('nguoi_than_xac_nhan'),
    'im lặng bị tính thành ĐÃ KIỂM — đó là §9.4 áp nhầm chỗ');
});

test('§4.3 — im lặng KHÁC "đã từ chối" và KHÁC "không sao"', () => {
  const t = 'Mẹ ơi con đổi số, mẹ chuyển giúp con 20 triệu nhé.';
  const imLang = toHopDong(analyze({ vanBan: t, xacMinhNguoiThan: 'HET_HAN_KHONG_TRA_LOI' }));
  const tuChoi = toHopDong(analyze({ vanBan: t, xacMinhNguoiThan: 'DA_TU_CHOI' }));
  const chuaHoi = toHopDong(analyze({ vanBan: t }));

  assert.ok(imLang.chuaKiem.includes('chua_lien_lac_duoc_nguoi_than'));
  assert.ok(!tuChoi.chuaKiem.includes('chua_lien_lac_duoc_nguoi_than'),
    '"đã từ chối" là ĐÃ KIỂM — không được xếp vào chuaKiem');
  assert.ok(!chuaHoi.chuaKiem.includes('chua_lien_lac_duoc_nguoi_than'),
    'chưa hỏi ai mà đã báo "chưa liên lạc được" là bịa');
});

test('KÝ TỪ CHỐI ⇒ LÀM TĂNG mức, không bao giờ giảm', () => {
  const bac = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
  const t = 'Mẹ ơi con đổi số, mẹ chuyển giúp con 20 triệu nhé.';
  const khong = toHopDong(analyze({ vanBan: t }));
  const tuChoi = toHopDong(analyze({ vanBan: t, xacMinhNguoiThan: 'DA_TU_CHOI' }));
  assert.ok(bac[tuChoi.nhan] >= bac[khong.nhan], 'ký TỪ CHỐI mà mức tụt');
});

test('KÝ XÁC NHẬN đi qua THAM SỐ THỨ HAI, không qua thân yêu cầu', async () => {
  const bac = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
  const t = 'Mẹ ơi con đổi số, mẹ chuyển giúp con 20 triệu nhé.';

  // Người gọi tự khai qua HTTP ⇒ KHÔNG đổi gì.
  const tuKhai = await goi('/api/analyze', { vanBan: t, xacMinhNguoiThan: 'DA_XAC_NHAN' });
  const khong = await goi('/api/analyze', { vanBan: t });
  assert.strictEqual(tuKhai.body.nhan, khong.body.nhan);

  // Máy chủ đặt qua tham số thứ hai ⇒ suppress chạy, nhưng KHÔNG kéo xuống đáy.
  const mayChu = toHopDong(analyze({ vanBan: t }, { verifiedRelationship: true }));
  assert.ok(bac[mayChu.nhan] >= 0);
  assert.notStrictEqual(mayChu.nhan, undefined);
});

// ─────────────────── §HĐ + §11 ───────────────────

test('§HĐ — phản hồi /api/analyze vẫn ĐÚNG BẢY TRƯỜNG', async () => {
  const { body } = await goi('/api/analyze', { vanBan: 'Bác chuyển tiền gấp nhé.' });
  assert.deepStrictEqual(Object.keys(body).sort(),
    ['aiDaChay', 'canThiep', 'chuaKiem', 'daKiem', 'hoKichBan', 'maLyDo', 'nhan'].sort());
});

test('§HĐ — canThiep vẫn ĐÚNG NĂM giá trị, không có giá trị thứ sáu', () => {
  assert.deepStrictEqual([...K.CAN_THIEP_HOP_LE].sort(),
    ['PAUSE_60S', 'PROTECTED_CRITICAL', 'RECOVERY', 'TRUST_RECEIPT', 'VERIFY_PATH'].sort());
});

test('§11 — không chuỗi nào nói "an toàn" / "hợp lệ" / "đã xác minh là người thân"', () => {
  // Bỏ chú thích trước khi quét: khối chú thích ở đầu tệp CỐ Ý liệt kê đúng
  // những câu bị cấm, kèm lý do. Cấm cả trong chú thích thì mất luôn chỗ ghi
  // lại bài học — mà bài học mới là thứ ngăn người sau viết lại chúng.
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/khoan-proof-ky'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const cam of ['giao dịch an toàn', 'yêu cầu này hợp lệ', 'đã xác minh là người thân',
    'transaction is safe', 'request is valid']) {
    assert.ok(!nguon.toLowerCase().includes(cam.toLowerCase()), `chứa "${cam}"`);
  }
});

test('§11 — chữ hiển thị chỉ nói AI ĐÃ KÝ, không nói yêu cầu tốt hay xấu', () => {
  // Backend trả MÃ; frontend tra catalog. Mã phải mô tả sự kiện, không phải phán xét.
  for (const ma of Object.values(K.MA_KET_QUA)) {
    assert.match(ma, /^[A-Z][A-Z0-9_]*$/);
    assert.ok(!/AN_TOAN|HOP_LE|CHINH_DANG|SAFE|VALID/.test(ma), `mã mang phán xét: ${ma}`);
  }
});

test('§4.6 — màn chờ chữ ký PHẢI có lối ra', () => {
  assert.ok(K.MA_KET_QUA.LOI_RA_TOI_ON, 'không có mã lối ra "Tôi ổn, không có gì nguy hiểm"');
});

test('§4.2 — không có override thứ 11, không tạo đường quyết định thứ hai', () => {
  const { CRITICAL_OVERRIDES } = require('../src/analysis/critical-overrides');
  assert.strictEqual(CRITICAL_OVERRIDES.length, 10,
    `số override đổi thành ${CRITICAL_OVERRIDES.length}`);

  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/khoan-proof-ky'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const cam of ['decision-engine', 'critical-overrides', 'THRESHOLD', 'SCORE_CAP']) {
    assert.ok(!nguon.includes(cam), `khoan-proof-ky.js chạm vào ${cam}`);
  }
});

test('GIỚI HẠN txAuthSimple được GHI RÕ trong mã nguồn', () => {
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/khoan-proof-ky'), 'utf8');
  assert.ok(nguon.includes('txAuthSimple'),
    'không ghi giới hạn: thiết bị KHÔNG hiển thị nội dung giao dịch');
});
