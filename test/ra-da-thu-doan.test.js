'use strict';
/**
 * §12 — "Ra-đa nhận TACTIC / PATTERN, không quy kết cá nhân từ một báo cáo."
 * §11 — "số lượt báo cáo cộng đồng GIẢ, cảnh báo KHÔNG CÓ NGUỒN" — cấm.
 *
 * Ra-đa là bề mặt duy nhất của sản phẩm nhận dữ liệu từ NGOÀI vào. Nếu nó đụng
 * được vào mức rủi ro thì một mục dữ liệu bị đầu độc sẽ đổi được kết luận.
 */

const test = require('node:test');
const assert = require('node:assert');

const S = require('../backend/src/intel-store');
const R = require('../backend/src/intel-radar');
const B = require('../backend/src/blind-spot');
const { analyze } = require('../backend/src/analysis/pipeline');

const MUC_TOT = {
  maThuDoan: 'gia_danh_cong_an',
  nguon: S.NGUON.A_CHINH_THUC,
  sourceUrl: 'https://congan.gov.vn/canh-bao',
  tinHieuLienQuan: ['ID_AUTHORITY_IMPERSONATION'],
};

// ═══════════ §12 — KHÔNG NHẬN DANH TÍNH ═══════════

test('§12 — mục mang trường danh tính bị NÉM LỖI, không phải lọc bỏ rồi nhận', () => {
  for (const truong of ['soDienThoai', 'hoTen', 'soTaiKhoan', 'email', 'nguoiBiTo']) {
    const kho = S.taoKho();
    assert.throws(() => kho.them({ ...MUC_TOT, [truong]: 'x' }),
      /MUC_CHUA_DANH_TINH/, `trường ${truong} lọt vào kho`);
  }
});

test('§12 — danh tính LỒNG SÂU trong object con cũng bị chặn', () => {
  const kho = S.taoKho();
  assert.throws(
    () => kho.them({ ...MUC_TOT, chiTiet: { boSung: { hoTen: 'Nguyễn Văn A' } } }),
    /MUC_CHUA_DANH_TINH/,
  );
});

test('§12 — chuỗi giống số điện thoại / số tài khoản bị chặn dù nằm ở trường tên gì', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them({ ...MUC_TOT, ghiChu: 'liên hệ 0912345678' }),
    /MUC_CHUA_CHUOI_SO_DAI/);
  assert.throws(() => kho.them({ ...MUC_TOT, moTa: 'STK 1902345678901' }),
    /MUC_CHUA_CHUOI_SO_DAI/);
});

test('§12 — MỘT báo cáo KHÔNG đủ để thành một mục Ra-đa', () => {
  const kho = S.taoKho();
  const mucB = { maThuDoan: 'lua_dau_tu', nguon: S.NGUON.B_TONG_HOP };
  assert.throws(() => kho.them({ ...mucB, soBaoCao: 1 }), /CHUA_DU_SO_BAO_CAO/);
  assert.throws(() => kho.them({ ...mucB, soBaoCao: 2 }), /CHUA_DU_SO_BAO_CAO/);
  assert.doesNotThrow(() => kho.them({ ...mucB, soBaoCao: S.NGUONG_BAO_CAO_TOI_THIEU }));
});

// ═══════════ §11 — CẢNH BÁO PHẢI CÓ NGUỒN ═══════════

test('§11 — nguồn chính thức KHÔNG CÓ sourceUrl thì bị từ chối', () => {
  const kho = S.taoKho();
  const { sourceUrl, ...khongNguon } = MUC_TOT;
  assert.throws(() => kho.them(khongNguon), /NGUON_A_THIEU_SOURCE_URL/);
  assert.throws(() => kho.them({ ...MUC_TOT, sourceUrl: 'nghe nói vậy' }),
    /NGUON_A_THIEU_SOURCE_URL/);
});

test('§11 — số lượt báo cáo KHÔNG được tự sinh ra', () => {
  const kho = S.taoKho();
  const mucB = { maThuDoan: 'lua_viec_lam', nguon: S.NGUON.B_TONG_HOP };
  assert.throws(() => kho.them(mucB), /NGUON_B_THIEU_SO_BAO_CAO/);
  assert.throws(() => kho.them({ ...mucB, soBaoCao: 'nhiều' }), /NGUON_B_THIEU_SO_BAO_CAO/);
});

// ═══════════ CỔNG DUYỆT ═══════════

test('Mọi mục vào kho đều ở CHỜ DUYỆT, không có đường nhập thẳng đã duyệt', () => {
  const kho = S.taoKho();
  const m = kho.them({ ...MUC_TOT, trangThai: 'da_duyet' });
  assert.strictEqual(m.trangThai, 'cho_duyet', 'kẻ gọi tự khai da_duyet mà lọt');
  assert.deepStrictEqual(kho.layDaDuyet(), []);
});

test('Duyệt PHẢI ghi tên người duyệt', () => {
  const kho = S.taoKho();
  kho.them(MUC_TOT);
  assert.throws(() => kho.duyet(MUC_TOT.maThuDoan), /THIEU_NGUOI_DUYET/);
  assert.throws(() => kho.duyet(MUC_TOT.maThuDoan, ''), /THIEU_NGUOI_DUYET/);
  const m = kho.duyet(MUC_TOT.maThuDoan, 'nguoi_duyet_a');
  assert.strictEqual(m.trangThai, 'da_duyet');
  assert.strictEqual(m.duyetBoi, 'nguoi_duyet_a');
});

test('CHỈ mục đã duyệt mới ra được tới người dùng', () => {
  const kho = S.taoKho();
  kho.them(MUC_TOT);
  kho.them({ maThuDoan: 'lua_dau_tu', nguon: S.NGUON.B_TONG_HOP, soBaoCao: 5 });
  assert.strictEqual(kho.layDaDuyet().length, 0);
  kho.duyet('gia_danh_cong_an', 'nguoi_duyet_a');
  assert.strictEqual(kho.layDaDuyet().length, 1);
});

// ═══════════ §4.2 — RA-ĐA KHÔNG ĐỤNG VÀO MỨC ═══════════

test('§4.2 — Ra-đa trả NGỮ CẢNH, và tự khai là không ảnh hưởng mức', () => {
  const kho = R.taoKho();
  kho.them(MUC_TOT);
  kho.duyet('gia_danh_cong_an', 'nguoi_duyet_a');
  const env = analyze({ vanBan: 'Tôi là cán bộ công an, bác chuyển tiền ngay.' });
  const nc = R.traNguCanh(kho, env);
  assert.ok(nc.maThuDoanTrung.includes('gia_danh_cong_an'));
  assert.strictEqual(nc.anhHuongMuc, false);
});

test('§4.2 — pipeline ra CÙNG MỘT MỨC dù có Ra-đa hay không', () => {
  // Ra-đa không phải tham số của analyze(). Ca này chốt điều đó lại: nếu ai đó
  // thêm được intel vào đường chấm điểm thì test này phải đỏ.
  const vanBan = 'Tôi là cán bộ công an, bác chuyển tiền ngay.';
  const a = analyze({ vanBan });
  const b = analyze({ vanBan, intel: [{ maThuDoan: 'x', trongSo: 99 }] });
  assert.ok(R.raDaKhongDoiMuc(a, b), 'dữ liệu intel đổi được mức — vi phạm §4.2');
});

test('§4.2 — decision-engine KHÔNG import gì từ tầng intel', () => {
  const nguon = require('node:fs').readFileSync(
    require.resolve('../backend/src/analysis/decision-engine'), 'utf8');
  assert.ok(!nguon.includes('intel'), 'bộ luật không được biết tới Ra-đa');
});

// ═══════════ NGUỒN C — ĐIỂM MÙ ═══════════

test('§11 — không có phép đo thì KHÔNG bịa điểm mù', () => {
  const kq = B.doDiemMu('/khong-he-ton-tai-99.jsonl');
  assert.strictEqual(kq.coPhepDo, false);
  assert.deepStrictEqual(kq.diemMu, []);
  assert.strictEqual(kq.lyDo, 'chua_co_phep_do_nao');
});

test('Điểm mù đo từ phép đo THẬT, và mang theo nguồn truy ngược được', () => {
  const kq = B.dungMucRaDa({ metadata: { commitSha: 'abc123', datasetVersion: 'ff00' } });
  if (!kq.coPhepDo) return;   // chưa chạy eval — trạng thái hợp lệ
  for (const m of kq.muc) {
    assert.strictEqual(m.nguon, 'c_diem_mu_do_duoc');
    assert.strictEqual(m.phepDo.commitSha, 'abc123');
    assert.ok(Number.isInteger(m.phepDo.soMau) && m.phepDo.soMau >= B.SO_MAU_TOI_THIEU);
    assert.ok(m.phepDo.recall < B.NGUONG_RECALL);
  }
});

test('Điểm mù CHỈ hiện ở /transparency, không hiện ở màn kết quả người dùng', () => {
  // Nói với bác "chúng tôi hay bỏ sót kịch bản đầu tư" không giúp gì cho bác.
  const kq = B.dungMucRaDa({ metadata: {} });
  for (const m of kq.muc) assert.strictEqual(m.chiHienO, 'transparency');
});

test('§4.3 — lượt AI hỏng KHÔNG được tính vào phép đo điểm mù', () => {
  const nguon = require('node:fs').readFileSync(require.resolve('../backend/src/blind-spot'), 'utf8');
  assert.match(nguon, /r\.hong/, 'phải loại lượt hỏng trước khi tính recall');
});
