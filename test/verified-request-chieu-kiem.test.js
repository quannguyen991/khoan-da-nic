'use strict';
/**
 * VERIFIED REQUEST — CHIỀU KIỂM.
 *
 * Khi bác nhận tin đòi tiền, app tra xem CÓ yêu cầu đã ký tương ứng từ người
 * trong vòng tròn gia đình hay không. Không có ⇒ nói ra là chưa tìm thấy.
 *
 * ⚠️⚠️ GIỚI HẠN LỚN NHẤT, VÀ LÀ LÝ DO TỆP TEST NÀY TỒN TẠI:
 *
 * Ở ĐỜI THẬT, "KHÔNG TÌM THẤY YÊU CẦU ĐÃ KÝ" LÀ TRẠNG THÁI BÌNH THƯỜNG. Hầu như
 * không ai dùng tính năng này, nên nó sẽ bật cả với các yêu cầu THẬT — con gái
 * nhắn xin tiền thật cũng không có chữ ký nào. Đây KHÔNG phải tín hiệu lừa đảo.
 * Nó là một lý do để DỪNG LẠI, không phải một kết luận.
 *
 * Vì vậy:
 *   · KHÔNG đẩy "không tìm thấy" thành tín hiệu làm tăng điểm.
 *   · Nó thuộc `chuaKiem`, KHÔNG thuộc `maLyDo`.
 *   · §11: không kết luận lừa đảo, không quy kết cá nhân.
 *   · Câu chữ tuyệt đối không được thành "Minh không hề gửi yêu cầu này" — app
 *     không biết điều đó. Chỉ biết là mình CHƯA THẤY.
 *
 * CHỈ LÀM CHIỀU KIỂM. Màn cho người con TẠO yêu cầu đã ký chưa dựng ở đây.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const P = require('../src/khoan-proof');
const KY = require('../src/khoan-proof-ky');
const VR = require('../src/verified-request');
const { analyze, toHopDong } = require('../src/analysis/pipeline');
const { taoMayXacThuc } = require('./helper/may-xac-thuc-gia');

const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
const TIN = 'Mẹ ơi con đổi số mới, mẹ chuyển giúp con 20 triệu vào tài khoản này nhé.';

let mayCon;

test.before(async () => {
  mayCon = await taoMayXacThuc(P.CAU_HINH);
  const tuyChon = await P.batDauDangKy('con-minh-vr');
  await P.xacNhanDangKy('con-minh-vr', mayCon.dangKy(tuyChon.challenge));
  const { ma } = await P.batDauGhep('bac-vr');
  await P.xacNhanGhep('con-minh-vr', ma);
});

// ─────────────────── Ca bắt buộc ───────────────────

test('KHÔNG TÌM THẤY ⇒ MỨC RỦI RO KHÔNG ĐỔI so với khi không chạy phép kiểm', async () => {
  const khongChay = toHopDong(analyze({ vanBan: TIN }));

  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-vr', caseId: 'vu-viec-chua-co' });
  assert.strictEqual(kq.timThay, false);

  const coChay = toHopDong(analyze({ vanBan: TIN, ...VR.dauVaoTuKetQua(kq) }));

  assert.strictEqual(coChay.nhan, khongChay.nhan,
    `phép kiểm đã đổi nhãn: ${khongChay.nhan} → ${coChay.nhan}`);
  assert.deepStrictEqual([...coChay.maLyDo].sort(), [...khongChay.maLyDo].sort(),
    '"không tìm thấy" đã len vào maLyDo — nó không phải một lý do rủi ro');
});

test('"không tìm thấy" thuộc chuaKiem, KHÔNG thuộc maLyDo', async () => {
  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-vr', caseId: 'vu-viec-trong' });
  const r = toHopDong(analyze({ vanBan: TIN, ...VR.dauVaoTuKetQua(kq) }));

  assert.ok(r.chuaKiem.includes('chua_thay_yeu_cau_da_xac_thuc'));
  assert.ok(!r.maLyDo.includes('chua_thay_yeu_cau_da_xac_thuc'));
  assert.ok(!r.maLyDo.some((m) => /YEU_CAU|VERIFIED|PROOF/.test(m)),
    'phép kiểm đã sinh ra một mã lý do — §4.2 nói nó chỉ được hiển thị');
});

test('§4.2 — quét nhiều tin: phép kiểm KHÔNG làm đổi mức, cả tăng lẫn giảm', async () => {
  const tin = [
    TIN,
    'Bác chuyển 50 triệu sang tài khoản an toàn của Bộ Công an ngay.',
    'Chào bác, mai cháu qua chơi nhé.',
    'Con gái nhờ mẹ chuyển tiền gấp, số tài khoản mới nhé mẹ.',
    'Never share your OTP with anyone.',
  ];
  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-vr', caseId: 'khong-co' });

  for (const t of tin) {
    const khong = toHopDong(analyze({ vanBan: t }));
    const co = toHopDong(analyze({ vanBan: t, ...VR.dauVaoTuKetQua(kq) }));
    assert.strictEqual(co.nhan, khong.nhan, `đổi mức: ${t.slice(0, 40)}`);
    assert.ok(BAC[co.nhan] === BAC[khong.nhan]);
  }
});

// ─────────────────── Chiều kiểm khi CÓ chữ ký ───────────────────

test('CÓ chữ ký xác nhận ⇒ tìm thấy, và nói rõ AI đã ký', async () => {
  const yc = await KY.taoYeuCau({
    chuTaiKhoanId: 'bac-vr', caseId: 'vu-viec-co-ky',
    khoangTien: 'TU_10_DEN_50_TRIEU', hanhDong: 'CHUYEN_TIEN', nguoiYeuCau: 'con-minh-vr',
  });
  await KY.xacMinhChuKy({
    yeuCauId: yc.yeuCauId, taiKhoanId: 'con-minh-vr', quyetDinh: 'XAC_NHAN',
    phanHoi: await mayCon.ky(yc.challenge),
  });

  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-vr', caseId: 'vu-viec-co-ky' });
  assert.strictEqual(kq.timThay, true);
  assert.strictEqual(kq.kyBoi, 'con-minh-vr');
  assert.strictEqual(kq.maKetQua, KY.MA_KET_QUA.DA_KY_XAC_NHAN);
  assert.ok(kq.cumTu, 'tìm thấy chữ ký mà không có cụm từ để đối chiếu hai đầu');
});

test('CÓ chữ ký TỪ CHỐI ⇒ tìm thấy, và LÀM TĂNG mức', async () => {
  const yc = await KY.taoYeuCau({
    chuTaiKhoanId: 'bac-vr', caseId: 'vu-viec-tu-choi',
    khoangTien: 'TU_10_DEN_50_TRIEU', hanhDong: 'CHUYEN_TIEN', nguoiYeuCau: 'con-minh-vr',
  });
  await KY.xacMinhChuKy({
    yeuCauId: yc.yeuCauId, taiKhoanId: 'con-minh-vr', quyetDinh: 'TU_CHOI',
    phanHoi: await mayCon.ky(yc.challenge),
  });

  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-vr', caseId: 'vu-viec-tu-choi' });
  assert.strictEqual(kq.timThay, true);
  assert.strictEqual(kq.maKetQua, KY.MA_KET_QUA.DA_KY_TU_CHOI);

  const khong = toHopDong(analyze({ vanBan: TIN }));
  const co = toHopDong(analyze({ vanBan: TIN, ...VR.dauVaoTuKetQua(kq) }));
  assert.ok(BAC[co.nhan] >= BAC[khong.nhan], 'ký TỪ CHỐI mà mức tụt');
});

test('chỉ tra trong vòng tròn CỦA CHÍNH MÌNH — không thấy chữ ký nhà khác', async () => {
  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-nha-khac', caseId: 'vu-viec-co-ky' });
  assert.strictEqual(kq.timThay, false,
    'tra được chữ ký của nhà người khác — rò dữ liệu giữa các gia đình');
});

// ─────────────────── §11 · §6.8 ───────────────────

test('§11 — mã trả về KHÔNG khẳng định người thân KHÔNG gửi', () => {
  for (const ma of Object.values(VR.MA_CHIEU_KIEM)) {
    assert.match(ma, /^[a-z][a-z0-9_]*$|^[A-Z][A-Z0-9_]*$/);
    // "MINH_KHONG_GUI" là đúng dạng câu §11 cấm — app không biết điều đó.
    assert.ok(!/KHONG_GUI|KHONG_HE|DA_PHU_NHAN|NOT_SENT|DENIED_SENDING/i.test(ma),
      `mã khẳng định điều app không biết: ${ma}`);
  }
});

test('§11 — không chuỗi nào trong mã nguồn nói người thân không gửi', () => {
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/verified-request'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const cam of ['không hề gửi', 'không gửi yêu cầu này', 'did not send', 'never sent']) {
    assert.ok(!nguon.toLowerCase().includes(cam), `chứa "${cam}"`);
  }
});

test('§HĐ — phản hồi vẫn ĐÚNG BẢY TRƯỜNG', async () => {
  const kq = await VR.traYeuCauDaKy({ chuTaiKhoanId: 'bac-vr', caseId: 'x' });
  const r = toHopDong(analyze({ vanBan: TIN, ...VR.dauVaoTuKetQua(kq) }));
  assert.deepStrictEqual(Object.keys(r).sort(),
    ['aiDaChay', 'canThiep', 'chuaKiem', 'daKiem', 'hoKichBan', 'maLyDo', 'nhan'].sort());
});

test('GIỚI HẠN "không tìm thấy là bình thường" được GHI RÕ trong mã nguồn', () => {
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/verified-request'), 'utf8');
  assert.ok(/hầu như không ai dùng|trạng thái BÌNH THƯỜNG|bình thường/i.test(nguon),
    'không ghi giới hạn: "không tìm thấy" sẽ bật cả với yêu cầu THẬT');
});

test('§4.2 — verified-request KHÔNG chạm decision-engine', () => {
  const nguon = require('node:fs')
    .readFileSync(require.resolve('../src/verified-request'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const cam of ['decision-engine', 'critical-overrides', 'signal-registry']) {
    assert.ok(!nguon.includes(cam), `chạm vào ${cam}`);
  }
});
