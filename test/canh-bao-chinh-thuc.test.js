'use strict';
/**
 * CẢNH BÁO CHÍNH THỨC TRONG RA-ĐA — nguồn, cổng duyệt, và dữ liệu thật.
 *
 * Công an các cấp đăng cảnh báo về từng thủ đoạn lên trang của họ. Ra-đa đưa
 * đúng cảnh báo đó tới người đang gặp đúng thủ đoạn ấy.
 *
 * ⚠️ BA CHỖ DỄ HỎNG NHẤT, TEST Ở ĐÂY CANH CẢ BA:
 *
 * 1. NỚI BỘ CHẶN SỐ DÀI. Trang Bộ Công an có mã bài 10 chữ số trong đường dẫn,
 *    nên phải miễn quét cho `sourceUrl`. Miễn rộng hơn thế một chút là số điện
 *    thoại lọt được vào kho qua trường tóm tắt.
 *
 * 2. NẠP THẲNG TRẠNG THÁI ĐÃ DUYỆT. Tệp dữ liệu ghi ai đã duyệt, nhưng lúc nạp
 *    mục vẫn phải đi qua `kho.duyet()` — không có đường nào nhập thẳng `da_duyet`.
 *
 * 3. LỘ TÊN NGƯỜI DUYỆT RA NGƯỜI DÙNG. Tên người duyệt là để truy trách nhiệm
 *    nội bộ, không phải để hiện trên màn hình của người đang bị lừa.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const S = require('../backend/src/intel-store');
const R = require('../backend/src/intel-radar');
const { SIGNAL_IDS } = require('../backend/src/analysis/signal-registry');
const DU_LIEU = require('../backend/data/canh-bao-chinh-thuc.json');
const DUYET = require('../scripts/duyet-canh-bao');

const GOC = path.join(__dirname, '..');

const mau = (them = {}) => ({
  id: 'thu-nghiem-a',
  maThuDoan: 'gia_danh_cong_an',
  nguon: S.NGUON.A_CHINH_THUC,
  coQuan: 'Công an tỉnh Thử',
  ngayCongBo: '2025-07-05',
  tomTat: 'Kẻ gian giả danh công an gọi điện, đòi đọc mã OTP để xác minh.',
  sourceUrl: 'https://bocongan.gov.vn/bai-viet/canh-bao-thu-nghiem-1786691661',
  tinHieuLienQuan: ['ID_AUTHORITY_IMPERSONATION'],
  ...them,
});

// ═══════════ 1 — sourceUrl: gắt, và chỉ nó được miễn quét số dài ═══════════

test('đường dẫn .gov.vn có mã bài 10 chữ số được nhận', () => {
  const kho = S.taoKho();
  assert.doesNotThrow(() => kho.them(mau()));
});

test('⚠️ số dài nằm ở TÓM TẮT vẫn bị chặn — miễn quét chỉ dành cho sourceUrl', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ tomTat: 'Liên hệ 0912345678 để được hỗ trợ.' })),
    /MUC_CHUA_CHUOI_SO_DAI/);
});

test('⚠️ số điện thoại nhét vào CHÍNH sourceUrl cũng bị chặn', () => {
  // Mã bài của Bộ Công an bắt đầu bằng 1 (dạng mốc thời gian). Số di động Việt
  // Nam là 10 chữ số bắt đầu bằng 0 — khác hình dạng, nên chặn riêng được.
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ sourceUrl: 'https://congan.abc.gov.vn/lien-he-0912345678' })),
    /SOURCE_URL_CHUA_SO_DIEN_THOAI/);
});

test('không phải tên miền .gov.vn thì bị từ chối — kể cả báo chí', () => {
  const kho = S.taoKho();
  for (const u of [
    'https://vnexpress.net/canh-bao-lua-dao',
    'https://evilgov.vn/canh-bao',
    'https://gov.vn.evil.com/canh-bao',
    'https://bocongan.gov.vn.evil.com/canh-bao',
  ]) {
    assert.throws(() => kho.them(mau({ sourceUrl: u })), /NGUON_A_KHONG_PHAI_GOV_VN/, u);
  }
});

test('http (không mã hoá) bị từ chối', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ sourceUrl: 'http://bocongan.gov.vn/bai-viet/x' })),
    /SOURCE_URL_PHAI_HTTPS/);
});

test('đường dẫn kèm tên đăng nhập bị từ chối (https://x.gov.vn@trang-la)', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ sourceUrl: 'https://bocongan.gov.vn@evil.com/x' })));
});

test('tóm tắt quá 160 ký tự bị từ chối — không dán nguyên bài báo vào kho', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ tomTat: 'a'.repeat(161) })), /TOM_TAT_QUA_DAI/);
  assert.doesNotThrow(() => kho.them(mau({ id: 'vua-du', tomTat: 'a'.repeat(160) })));
});

test('ngày công bố sai định dạng bị từ chối', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ ngayCongBo: '05/07/2025' })), /NGAY_CONG_BO_KHONG_HOP_LE/);
});

// ═══════════ 2 — khoá theo id, không đè nhau ═══════════

test('hai tỉnh cùng cảnh báo một thủ đoạn thì GIỮ CẢ HAI, không đè nhau', () => {
  const kho = S.taoKho();
  kho.them(mau({ id: 'tinh-a' }));
  kho.them(mau({ id: 'tinh-b', coQuan: 'Công an tỉnh B' }));
  assert.strictEqual(kho.layTatCa().length, 2);
});

test('id sai định dạng bị từ chối', () => {
  const kho = S.taoKho();
  assert.throws(() => kho.them(mau({ id: 'Có Dấu Và Khoảng Trắng' })), /ID_KHONG_HOP_LE/);
});

// ═══════════ 3 — nạp tệp: vẫn đi qua cổng duyệt ═══════════

test('⚠️ mục chưa ghi người duyệt thì nạp vào ở CHỜ DUYỆT, không tới người dùng', () => {
  const kho = S.taoKho();
  const kq = S.napTuDuLieu(kho, { canhBao: [mau()] });
  assert.strictEqual(kq.nap, 1);
  assert.strictEqual(kq.daDuyet, 0);
  assert.deepStrictEqual(kho.layDaDuyet(), []);
});

test('⚠️ tự khai trangThai "da_duyet" trong tệp KHÔNG có tác dụng', () => {
  const kho = S.taoKho();
  S.napTuDuLieu(kho, { canhBao: [{ ...mau(), trangThai: 'da_duyet', duyetBoi: 'ai-do' }] });
  assert.deepStrictEqual(kho.layDaDuyet(), []);
});

test('mục có người duyệt thì đi qua kho.duyet() và ghi đúng tên', () => {
  const kho = S.taoKho();
  const kq = S.napTuDuLieu(kho, { canhBao: [{ ...mau(), duyet: { boi: 'Quân', luc: '2026-09-17' } }] });
  assert.strictEqual(kq.daDuyet, 1);
  const [m] = kho.layDaDuyet();
  assert.strictEqual(m.trangThai, 'da_duyet');
  assert.strictEqual(m.duyetBoi, 'Quân');
});

test('tên người duyệt rỗng thì KHÔNG tính là đã duyệt', () => {
  const kho = S.taoKho();
  S.napTuDuLieu(kho, { canhBao: [{ ...mau(), duyet: { boi: '   ', luc: '2026-09-17' } }] });
  assert.deepStrictEqual(kho.layDaDuyet(), []);
});

test('một mục hỏng KHÔNG làm hỏng cả tệp — mục khác vẫn nạp, lỗi được kể ra', () => {
  const kho = S.taoKho();
  const kq = S.napTuDuLieu(kho, { canhBao: [mau({ sourceUrl: 'https://vnexpress.net/x' }), mau({ id: 'tot' })] });
  assert.strictEqual(kq.nap, 1);
  assert.strictEqual(kq.loi.length, 1);
  assert.strictEqual(kq.loi[0].ma, 'NGUON_A_KHONG_PHAI_GOV_VN');
});

test('dữ liệu rỗng hoặc hỏng hoàn toàn thì trả về không mục, KHÔNG ném', () => {
  for (const hong of [null, undefined, {}, { canhBao: 'khong phai mang' }]) {
    assert.doesNotThrow(() => S.napTuDuLieu(S.taoKho(), hong));
  }
});

// ═══════════ 4 — Ra-đa trả cảnh báo để hiển thị ═══════════

function khoDaDuyet(ds) {
  const kho = S.taoKho();
  S.napTuDuLieu(kho, { canhBao: ds.map((m) => ({ ...m, duyet: { boi: 'nguoi-duyet', luc: '2026-09-17' } })) });
  return kho;
}

test('⚠️ cảnh báo trả ra CHỈ có trường hiển thị — không lộ tên người duyệt', () => {
  const kho = khoDaDuyet([mau()]);
  const kq = R.traNguCanh(kho, { hoKichBan: 'gia_danh_cong_an', maLyDo: [] });
  assert.strictEqual(kq.canhBao.length, 1);
  assert.deepStrictEqual(Object.keys(kq.canhBao[0]).sort(),
    ['coQuan', 'id', 'ngayCongBo', 'sourceUrl', 'tomTat', 'tomTatEn'].sort());
  assert.ok(!JSON.stringify(kq).includes('nguoi-duyet'), 'tên người duyệt không được ra ngoài');
});

test('cảnh báo CHƯA duyệt không bao giờ được trả ra', () => {
  const kho = S.taoKho();
  kho.them(mau());
  const kq = R.traNguCanh(kho, { hoKichBan: 'gia_danh_cong_an', maLyDo: ['ID_AUTHORITY_IMPERSONATION'] });
  assert.deepStrictEqual(kq.canhBao, []);
});

test('tối đa HAI cảnh báo; khớp dấu hiệu xếp trước, rồi tới mới nhất', () => {
  const kho = khoDaDuyet([
    mau({ id: 'cu-khop-ho', ngayCongBo: '2024-01-01', tinHieuLienQuan: [] }),
    mau({ id: 'moi-khop-ho', ngayCongBo: '2025-12-01', tinHieuLienQuan: [] }),
    mau({ id: 'cu-khop-dau-hieu', ngayCongBo: '2023-01-01', tinHieuLienQuan: ['CRED_OTP_SHARE'] }),
  ]);
  const kq = R.traNguCanh(kho, { hoKichBan: 'gia_danh_cong_an', maLyDo: ['CRED_OTP_SHARE'] });
  assert.deepStrictEqual(kq.canhBao.map((c) => c.id), ['cu-khop-dau-hieu', 'moi-khop-ho']);
});

test('⚠️ trùng NHIỀU dấu hiệu xếp trên trùng họ + một dấu hiệu', () => {
  // Tin "tôi bên công an kinh tế, hỗ trợ lấy lại tiền, bác nộp phí hồ sơ" ra họ
  // `gia_danh_cong_an`, vì dấu hiệu giả danh công an đứng đầu bảng họ. Chỉ hỏi
  // "có trùng dấu hiệu không" thì cảnh báo công an chung chung thắng, và cảnh
  // báo lấy lại tiền — đúng cái cần đọc — rơi khỏi hai chỗ hiển thị.
  const kho = khoDaDuyet([
    mau({ id: 'cong-an-chung', ngayCongBo: '2025-12-01', tinHieuLienQuan: ['ID_AUTHORITY_IMPERSONATION'] }),
    mau({
      id: 'lay-lai-tien-cu', maThuDoan: 'gia_danh_ho_tro_lay_lai_tien', ngayCongBo: '2024-01-01',
      tinHieuLienQuan: ['FIN_RECOVERY_FEE', 'ID_RECOVERY_SUPPORT_IMPERSONATION'],
    }),
    mau({
      id: 'lay-lai-tien-moi-mot-dau-hieu', maThuDoan: 'gia_danh_ho_tro_lay_lai_tien', ngayCongBo: '2026-01-01',
      tinHieuLienQuan: ['FIN_RECOVERY_FEE'],
    }),
  ]);
  const kq = R.traNguCanh(kho, {
    hoKichBan: 'gia_danh_cong_an',
    maLyDo: ['ID_AUTHORITY_IMPERSONATION', 'FIN_RECOVERY_FEE', 'ID_RECOVERY_SUPPORT_IMPERSONATION'],
  });
  assert.deepStrictEqual(kq.canhBao.map((c) => c.id), ['lay-lai-tien-cu', 'cong-an-chung']);
});

test('§4.2 — trả cảnh báo vẫn tự khai là KHÔNG ảnh hưởng mức', () => {
  const kho = khoDaDuyet([mau()]);
  assert.strictEqual(R.traNguCanh(kho, { hoKichBan: 'gia_danh_cong_an' }).anhHuongMuc, false);
});

// ═══════════ 5 — /api/ra-da nhận MÃ, không nhận nội dung ═══════════

test('⚠️ đầu vào chỉ lấy mã; nội dung tin nhắn gửi kèm bị bỏ, không đi tiếp', () => {
  const vao = R.docMaRaDa({
    hoKichBan: 'gia_danh_cong_an',
    maLyDo: ['CRED_OTP_SHARE'],
    vanBan: 'Bác đọc giúp cháu mã 889231',
  });
  assert.strictEqual(vao.ok, true);
  assert.ok(!('vanBan' in vao), 'nội dung tin nhắn không được đi tiếp');
  assert.ok(!JSON.stringify(vao).includes('889231'));
});

test('chỉ có nội dung, không có mã nào → từ chối', () => {
  assert.strictEqual(R.docMaRaDa({ vanBan: 'Tin nhắn bất kỳ' }).ok, false);
  assert.strictEqual(R.docMaRaDa(null).ok, false);
});

test('mã sai định dạng bị lọc bỏ, không đi vào đối chiếu', () => {
  const vao = R.docMaRaDa({ hoKichBan: 'Giả Danh <script>', maLyDo: ['CRED_OTP_SHARE', 'DROP TABLE', 42] });
  assert.strictEqual(vao.hoKichBan, null);
  assert.deepStrictEqual(vao.maLyDo, ['CRED_OTP_SHARE']);
});

// ═══════════ 6 — dữ liệu thật trong tệp ═══════════

test('tệp dữ liệu: mọi mục qua được kiểm tra của kho, id không trùng', () => {
  const ds = DU_LIEU.canhBao;
  assert.ok(Array.isArray(ds) && ds.length >= 6, 'phải có ít nhất 6 cảnh báo');
  const id = new Set();
  for (const raw of ds) {
    const { duyet, ...m } = raw;
    assert.doesNotThrow(() => S.kiemMuc(m), `mục ${m.id} không hợp lệ`);
    assert.ok(!id.has(m.id), `id trùng: ${m.id}`);
    id.add(m.id);
  }
});

test('tệp dữ liệu: nạp qua đúng đường máy chủ dùng mà KHÔNG có lỗi nào', () => {
  // Máy chủ nuốt lỗi từng mục để không sập — nên lỗi phải bị bắt ở đây, không
  // thì một đường dẫn gõ sai làm cảnh báo biến mất trong im lặng.
  const kho = S.taoKho();
  const kq = S.napTuDuLieu(kho, DU_LIEU);
  assert.deepStrictEqual(kq.loi, []);
  assert.strictEqual(kq.nap, DU_LIEU.canhBao.length);
  const coNguoiDuyet = DU_LIEU.canhBao.filter((m) => m.duyet && m.duyet.boi && m.duyet.boi.trim()).length;
  assert.strictEqual(kho.layDaDuyet().length, coNguoiDuyet, 'chỉ mục có tên người duyệt mới tới người dùng');
});

test('tệp dữ liệu: mã thủ đoạn là HỌ KỊCH BẢN có thật — không thì không bao giờ khớp họ', () => {
  const { HO_KICH_BAN_MA } = require('../backend/src/analysis/pipeline');
  for (const m of DU_LIEU.canhBao) {
    assert.ok(HO_KICH_BAN_MA.includes(m.maThuDoan), `${m.id}: họ ${m.maThuDoan} không có trong pipeline`);
  }
});

test('tệp dữ liệu: mã dấu hiệu liên quan đều CÓ THẬT trong bộ đăng ký tín hiệu', () => {
  const coThat = new Set(SIGNAL_IDS);
  for (const m of DU_LIEU.canhBao) {
    for (const t of m.tinHieuLienQuan ?? []) {
      assert.ok(coThat.has(t), `${m.id}: mã ${t} không có trong signal-registry`);
    }
  }
});

test('tệp dữ liệu: ngày công bố không ở tương lai, đều có cơ quan và tóm tắt hai ngôn ngữ', () => {
  const homNay = new Date().toISOString().slice(0, 10);
  for (const m of DU_LIEU.canhBao) {
    assert.ok(m.ngayCongBo <= homNay, `${m.id}: ngày công bố ở tương lai`);
    assert.ok(m.coQuan && m.coQuan.trim(), `${m.id}: thiếu cơ quan`);
    assert.ok(m.tomTat && m.tomTatEn, `${m.id}: thiếu tóm tắt tiếng Việt hoặc tiếng Anh`);
  }
});

test('tệp dữ liệu: mục nào đã duyệt thì phải ghi tên người duyệt và ngày duyệt', () => {
  for (const m of DU_LIEU.canhBao) {
    if (m.duyet == null) continue;
    assert.ok(typeof m.duyet.boi === 'string' && m.duyet.boi.trim(), `${m.id}: duyệt mà không có tên`);
    assert.match(m.duyet.luc, /^\d{4}-\d{2}-\d{2}$/, `${m.id}: ngày duyệt sai định dạng`);
  }
});

// ═══════════ 7 — script duyệt ═══════════

test('script duyệt: ghi tên người duyệt vào đúng mục, không đụng mục khác', () => {
  const duLieu = { canhBao: [mau({ id: 'muc-a' }), mau({ id: 'muc-b' })] };
  const moi = DUYET.duyetMuc(duLieu, 'muc-a', 'Quân', '2026-09-17');
  assert.deepStrictEqual(moi.canhBao.find((m) => m.id === 'muc-a').duyet, { boi: 'Quân', luc: '2026-09-17' });
  assert.strictEqual(moi.canhBao.find((m) => m.id === 'muc-b').duyet, undefined);
  assert.strictEqual(duLieu.canhBao[0].duyet, undefined, 'không sửa tại chỗ dữ liệu gốc');
});

test('script duyệt: không có tên thì từ chối, id lạ thì từ chối', () => {
  const duLieu = { canhBao: [mau({ id: 'muc-a' })] };
  assert.throws(() => DUYET.duyetMuc(duLieu, 'muc-a', '', '2026-09-17'), /THIEU_NGUOI_DUYET/);
  assert.throws(() => DUYET.duyetMuc(duLieu, 'khong-co', 'Quân', '2026-09-17'), /KHONG_TIM_THAY_MUC/);
});

test('⚠️ script duyệt: mục không qua được kiểm tra của kho thì KHÔNG ai đứng tên duyệt được', () => {
  // Duyệt là đứng tên chịu trách nhiệm. Một mục trỏ sang báo chí hay chứa số
  // điện thoại không được mang tên người duyệt, kể cả khi máy chủ sẽ loại nó.
  const duLieu = { canhBao: [mau({ id: 'muc-bao-chi', sourceUrl: 'https://vnexpress.net/canh-bao' })] };
  assert.throws(() => DUYET.duyetMuc(duLieu, 'muc-bao-chi', 'Quân', '2026-09-17'), /NGUON_A_KHONG_PHAI_GOV_VN/);
});

test('script từ chối: bỏ mục khỏi danh sách phát hành, và ghi lại ai từ chối, vì sao', () => {
  const duLieu = { canhBao: [mau({ id: 'muc-a' }), mau({ id: 'muc-b' })] };
  const moi = DUYET.tuChoiMuc(duLieu, 'muc-a', 'Quân', 'Trùng nội dung với cảnh báo của Bộ', '2026-09-17');
  assert.deepStrictEqual(moi.canhBao.map((m) => m.id), ['muc-b']);
  assert.deepStrictEqual(moi.daTuChoi, [{
    id: 'muc-a', sourceUrl: mau().sourceUrl, boi: 'Quân', lyDo: 'Trùng nội dung với cảnh báo của Bộ', luc: '2026-09-17',
  }]);
  assert.strictEqual(duLieu.canhBao.length, 2, 'không sửa tại chỗ dữ liệu gốc');

  // Mục bị từ chối không còn đường nào về tới người dùng.
  const kho = S.taoKho();
  S.napTuDuLieu(kho, { ...moi, canhBao: moi.canhBao.map((m) => ({ ...m, duyet: { boi: 'Quân', luc: '2026-09-17' } })) });
  assert.ok(!kho.layDaDuyet().some((m) => m.id === 'muc-a'));
});

test('script từ chối: không có tên hoặc không có lý do thì từ chối thao tác', () => {
  const duLieu = { canhBao: [mau({ id: 'muc-a' })] };
  assert.throws(() => DUYET.tuChoiMuc(duLieu, 'muc-a', ' ', 'lý do', '2026-09-17'), /THIEU_NGUOI_DUYET/);
  assert.throws(() => DUYET.tuChoiMuc(duLieu, 'muc-a', 'Quân', '', '2026-09-17'), /THIEU_LY_DO/);
  assert.throws(() => DUYET.tuChoiMuc(duLieu, 'khong-co', 'Quân', 'lý do', '2026-09-17'), /KHONG_TIM_THAY_MUC/);
});

// ═══════════ 8 — giao diện ═══════════

test('giao diện: liên kết mở tab mới với noopener, và tự kiểm lại tên miền .gov.vn', () => {
  const s = fs.readFileSync(path.join(GOC, 'src', 'components', 'CanhBaoChinhThuc.tsx'), 'utf8');
  assert.ok(/rel="noopener noreferrer"/.test(s), 'thiếu rel="noopener noreferrer"');
  assert.ok(s.includes(".gov.vn"), 'giao diện phải tự kiểm tên miền, không tin mù dữ liệu máy chủ');
  assert.ok(s.includes('CAO') && s.includes('NGHI_NGO'), 'phải chặn hiển thị ở mức thấp nhất');
});
