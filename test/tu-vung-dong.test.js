'use strict';
/**
 * Luồng từ vựng động: ứng viên → AI duyệt trước → NGƯỜI duyệt → nạp (3/10/2026).
 *
 * Những thứ test này canh, theo thứ tự nguy hiểm:
 *   · AI KHÔNG BAO GIỜ đưa được ứng viên tới `da_nap` — kể cả khi nó "đòi".
 *   · Mẫu nạp chỉ CỘNG THÊM; không tín hiệu lạ, không tắt/hạ gì, mẫu gốc nguyên vẹn.
 *   · Cụm phủ định / giọng cảnh báo / nằm trong tin lành bị chặn ở cửa.
 *   · Không có nguồn thì không có ứng viên (§11); AI bịa cụm không có trong trích dẫn thì bị loại.
 *   · AI chết ≠ AI duyệt xong (§4.3).
 *   · Cổng quản trị đóng khi chưa đặt token.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const TV = require('../backend/src/tu-vung-dong');
const { taoBoNhoTam } = require('../backend/src/vault-store');
const registry = require('../backend/src/analysis/locale-pack-registry');
const { buildContext } = require('../backend/src/analysis/context-builder');
const { directPrecheck } = require('../backend/src/analysis/direct-precheck');

const NGUON = { ten: 'Báo thử', url: 'https://example.vn/bai-viet' };
const CUM = 'cục thuế điện tử mở rộng';        // cụm giả, không có trong bất kỳ mẫu nào
const TRICH = 'Chiêu giả danh cục thuế điện tử mở rộng gửi link độc hại';

const ai = (quyetDinh, lyDo = 'thử') => async () => ({ noiDung: JSON.stringify({ quyet_dinh: quyetDinh, ly_do: lyDo }) });
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

test.afterEach(() => registry.datTuVungDong('vi-VN', {}));

test('cửa cứng: phủ định, giọng cảnh báo, quá ngắn, một từ, ký tự lạ đều bị chặn', () => {
  const bi = (c, ma) => assert.strictEqual(TV.kiemCum(c).ma, ma, c);
  bi('đừng tải app này', 'CUM_GIONG_CANH_BAO_HOAC_PHU_DINH');
  bi('không bấm vào đường link', 'CUM_GIONG_CANH_BAO_HOAC_PHU_DINH');
  bi('cảnh báo lừa đảo mới', 'CUM_GIONG_CANH_BAO_HOAC_PHU_DINH');
  bi('đừng tải trên CH Play vì bản đó cũ', 'CUM_GIONG_CANH_BAO_HOAC_PHU_DINH');   // bài học §12
  bi('khong bam vao duong link', 'CUM_GIONG_CANH_BAO_HOAC_PHU_DINH');
  bi('abc xyz', 'CUM_DO_DAI_KHONG_HOP_LE');
  bi('chuyenkhoanngaylapt', 'CUM_CHI_MOT_TU');
  bi('thử <script>alert(1)</script>', 'CUM_CO_KY_TU_LA');
  assert.strictEqual(TV.kiemCum(CUM).ok, true);
});

test('cụm nằm trong một tin lành của bộ mẫu thì bị chặn (luật ④)', () => {
  const tinLanh = TV.docTinLanh();
  assert.ok(tinLanh.length >= 50, 'phải có bộ tin lành để thử');
  // Lấy 3 từ liền nhau từ chính một tin lành: chắc chắn là cụm có trong tin lành.
  const mau = tinLanh.find((m) => m.gap.split(' ').length >= 6);
  const ba = mau.gap.split(' ').slice(1, 4).join(' ');
  const r = TV.kiemCum(ba);
  assert.strictEqual(r.ok, false);
  assert.ok(['CUM_NAM_TRONG_TIN_LANH', 'CUM_GIONG_CANH_BAO_HOAC_PHU_DINH', 'CUM_DO_DAI_KHONG_HOP_LE'].includes(r.ma), r.ma);
});

test('đề xuất: tín hiệu ngoài danh sách, thiếu nguồn, nguồn http, cụm không có trong trích dẫn đều bị loại', async () => {
  const kho = taoBoNhoTam();
  for (const lac of ['FIN_TRANSFER_REQUEST', 'CRED_OTP_SHARE', 'MAN_URGENCY', 'RISK_SCORE', 'ID_KHONG_CO']) {
    assert.strictEqual((await TV.deXuat(kho, { cum: CUM, tinHieu: lac, nguon: NGUON, trichBao: TRICH })).loi, 'TIN_HIEU_KHONG_DUOC_PHEP', lac);
  }
  assert.strictEqual((await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: null, trichBao: TRICH })).loi, 'THIEU_NGUON');
  assert.strictEqual((await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: { ten: 'x', url: 'http://khong-bao-mat.vn/a' }, trichBao: TRICH })).loi, 'THIEU_NGUON');
  assert.strictEqual((await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: { ten: 'Báo', url: 'https://bocongan.gov.vn@evil.com/a' }, trichBao: TRICH })).loi, 'THIEU_NGUON');
  assert.strictEqual((await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: 'một tiêu đề hoàn toàn khác' })).loi, 'CUM_KHONG_NAM_TRONG_TRICH_DAN');
  // Luồng tự thu thập BẮT BUỘC có trích dẫn.
  assert.strictEqual((await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, tu: 'thu_thap' })).loi, 'THIEU_TRICH_DAN');
  assert.strictEqual((await kho.liet(TV.BANG)).length, 0, 'ứng viên hỏng không được lọt vào kho');
});

test('đề xuất hợp lệ vào cho_ai, trùng thì không tạo thêm', async () => {
  const kho = taoBoNhoTam();
  const r = await TV.deXuat(kho, { cum: CUM.toUpperCase(), tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  assert.strictEqual(r.ungVien.trangThai, 'cho_ai');
  assert.strictEqual(r.ungVien.cum, CUM, 'cụm được chuẩn hoá chữ thường');
  const lai = await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  assert.strictEqual(lai.trung, true);
  assert.strictEqual((await kho.liet(TV.BANG)).length, 1);
});

test('AI duyệt trước: nen_xem → cho_duyet, bo → ai_loai; AI KHÔNG BAO GIỜ tới da_nap', async () => {
  const kho = taoBoNhoTam();
  const { ungVien } = await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  const ket = await TV.aiDuyetTruoc(kho, ungVien.id, { goiChat: ai('nen_xem', 'đặc trưng'), parseJson: parse });
  assert.strictEqual(ket.trangThai, 'cho_duyet');
  assert.strictEqual(ket.ai.daChay, true);
  assert.strictEqual(registry.soMucDong('vi-VN'), 0, 'AI nói "nên xem" mà chưa ai duyệt thì gói vẫn y nguyên');

  const kho2 = taoBoNhoTam();
  const b = await TV.deXuat(kho2, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  assert.strictEqual((await TV.aiDuyetTruoc(kho2, b.ungVien.id, { goiChat: ai('bo'), parseJson: parse })).trangThai, 'ai_loai');

  // AI "đòi" tự nạp: trả thêm trường trangThai / quyet_dinh lạ ⇒ bị bỏ qua / coi là rác.
  const kho3 = taoBoNhoTam();
  const c = await TV.deXuat(kho3, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  const doi = async () => ({ noiDung: JSON.stringify({ quyet_dinh: 'da_nap', trangThai: 'da_nap', ly_do: 'rất chắc' }) });
  const r = await TV.aiDuyetTruoc(kho3, c.ungVien.id, { goiChat: doi, parseJson: parse });
  assert.strictEqual(r.trangThai, 'cho_ai');
  assert.strictEqual(r.ai.daChay, false);
  assert.strictEqual(registry.soMucDong('vi-VN'), 0);
});

test('§4.3 — AI chết hoặc trả rác thì ứng viên vẫn cho_ai và nói rõ chưa qua AI', async () => {
  const kho = taoBoNhoTam();
  const { ungVien } = await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  const chet = async () => { const e = new Error('x'); e.ma = 'AI_NETWORK'; throw e; };
  const r = await TV.aiDuyetTruoc(kho, ungVien.id, { goiChat: chet, parseJson: parse });
  assert.strictEqual(r.trangThai, 'cho_ai');
  assert.strictEqual(r.ai.daChay, false);
  assert.strictEqual(r.ai.loi, 'AI_NETWORK');
  const rac = await TV.aiDuyetTruoc(kho, ungVien.id, { goiChat: async () => ({ noiDung: 'tôi nghĩ ổn' }), parseJson: parse });
  assert.strictEqual(rac.trangThai, 'cho_ai');
});

test('duyệt: chỉ từ cho_duyet / cho_ai; sau duyệt gói được CỘNG THÊM, mẫu gốc nguyên vẹn', async () => {
  const kho = taoBoNhoTam();
  const goc = registry.PACKS['vi-VN'].directPatterns.ID_AUTHORITY_IMPERSONATION.map((m) => m.pattern);
  const { ungVien } = await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  const tin = 'Thông báo từ cục thuế điện tử mở rộng: hồ sơ của bạn có vấn đề, vui lòng xử lý.';
  const truoc = directPrecheck(buildContext(tin)).map((x) => x.id);

  await TV.duyet(kho, ungVien.id, 'thử');
  assert.strictEqual(registry.soMucDong('vi-VN'), 1);
  const pack = registry.layPack('vi-VN');
  const sau = pack.directPatterns.ID_AUTHORITY_IMPERSONATION;
  assert.deepStrictEqual(sau.slice(0, goc.length).map((m) => m.pattern), goc, 'mẫu gốc phải đứng nguyên, đúng thứ tự');
  assert.strictEqual(sau.length, goc.length + 1);
  assert.strictEqual(sau.at(-1).nguon, 'tu_vung_dong');
  assert.deepStrictEqual(pack.suppressors, registry.PACKS['vi-VN'].suppressors, 'không đụng suppressors');
  assert.deepStrictEqual(Object.keys(pack.directPatterns), Object.keys(registry.PACKS['vi-VN'].directPatterns), 'không thêm tín hiệu lạ');

  const sauChay = directPrecheck(buildContext(tin)).map((x) => x.id);
  assert.ok(!truoc.includes('ID_AUTHORITY_IMPERSONATION'), 'điều kiện đầu: chưa bắt được');
  assert.ok(sauChay.includes('ID_AUTHORITY_IMPERSONATION'), 'sau khi nạp thì phải bắt được');
  // Mọi tín hiệu trước đó vẫn còn: chỉ tăng.
  for (const id of truoc) assert.ok(sauChay.includes(id), `${id} biến mất sau khi nạp`);

  await TV.go(kho, ungVien.id);
  assert.strictEqual(registry.soMucDong('vi-VN'), 0, 'gỡ là về đúng gói gốc');
  assert.strictEqual(registry.layPack('vi-VN'), registry.PACKS['vi-VN'], 'không còn mục nào ⇒ trả đúng đối tượng gốc');
});

test('duyệt hai lần / duyệt cụm đã loại / duyệt id lạ đều bị từ chối', async () => {
  const kho = taoBoNhoTam();
  const { ungVien } = await TV.deXuat(kho, { cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION', nguon: NGUON, trichBao: TRICH });
  await TV.tuChoi(kho, ungVien.id);
  await assert.rejects(() => TV.duyet(kho, ungVien.id), /TRANG_THAI_KHONG_DUYET_DUOC/);
  await assert.rejects(() => TV.duyet(kho, 'khong-co'), /KHONG_THAY_UNG_VIEN/);
});

test('hàng rào lúc nạp: kho bị sửa tay thành tín hiệu lạ / cụm phủ định thì KHÔNG vào gói', async () => {
  const kho = taoBoNhoTam();
  await kho.luu(TV.BANG, 'a', { id: 'a', trangThai: 'da_nap', cum: CUM, tinHieu: 'FIN_TRANSFER_REQUEST' });
  await kho.luu(TV.BANG, 'b', { id: 'b', trangThai: 'da_nap', cum: 'đừng tải app này', tinHieu: 'DEV_INSTALL_APK_UNKNOWN' });
  await kho.luu(TV.BANG, 'c', { id: 'c', trangThai: 'da_nap', cum: CUM, tinHieu: 'ID_AUTHORITY_IMPERSONATION' });
  assert.strictEqual(await TV.napLai(kho), 1, 'chỉ mục hợp lệ được nạp');
});

test('mẫu sinh ra là chuỗi nguyên văn đã thoát ký tự, không phải biểu thức rộng', () => {
  const m = TV.mauTuCum('a.b* (x)');
  assert.ok(!/[^\\]\*|[^\\]\(/.test(m.replace(/\\\\/g, '')), m);
  assert.doesNotThrow(() => new RegExp(m));
  assert.ok(!/\.\*|\.\+/.test(m));
});

test('thu thập: AI bịa cụm không có trong bài thì bị loại; chỉ cụm có trong tiêu đề mới thành ứng viên', async () => {
  const kho = taoBoNhoTam();
  const layTin = async () => ({ tin: [{ tieuDe: TRICH, tomTat: '', lienKet: 'https://example.vn/a', nguon: 'Báo thử' }] });
  const goiChat = async (msgs) => {
    if (/Bạn duyệt trước/.test(msgs[0].content)) return { noiDung: JSON.stringify({ quyet_dinh: 'nen_xem', ly_do: 'ok' }) };
    return { noiDung: JSON.stringify({ ung_vien: [
      { stt: 1, cum: CUM, tin_hieu: 'ID_AUTHORITY_IMPERSONATION' },
      { stt: 1, cum: 'cụm do ai bịa ra', tin_hieu: 'ID_AUTHORITY_IMPERSONATION' },
      { stt: 9, cum: CUM, tin_hieu: 'ID_AUTHORITY_IMPERSONATION' },
      { stt: 1, cum: 'chuyển tiền ngay lập tức', tin_hieu: 'FIN_TRANSFER_REQUEST' },
    ] }) };
  };
  const kq = await TV.thuThap(kho, { layTin, goiChat, parseJson: parse });
  assert.strictEqual(kq.daChay, true);
  assert.strictEqual(kq.ungVien, 1);
  const ds = await TV.liet(kho);
  assert.strictEqual(ds.length, 1);
  assert.strictEqual(ds[0].trangThai, 'cho_duyet', 'qua AI nhưng CHƯA ai duyệt');
  assert.strictEqual(ds[0].nguon.url, 'https://example.vn/a');
  assert.strictEqual(registry.soMucDong('vi-VN'), 0);
  // Lần sau không đọc lại bài đã xử lý.
  assert.strictEqual((await TV.thuThap(kho, { layTin, goiChat, parseJson: parse })).tinMoi, 0);
});

test('thu thập: AI chết thì KHÔNG đánh dấu bài đã đọc (lần sau thử lại) và không ném', async () => {
  const kho = taoBoNhoTam();
  const layTin = async () => ({ tin: [{ tieuDe: TRICH, tomTat: '', lienKet: 'https://example.vn/a', nguon: 'Báo' }] });
  const chet = async () => { throw new Error('mạng'); };
  const kq = await TV.thuThap(kho, { layTin, goiChat: chet, parseJson: parse });
  assert.strictEqual(kq.daChay, false);
  assert.ok(kq.loi);
  assert.strictEqual((await TV.thuThap(kho, { layTin, goiChat: ai('nen_xem'), parseJson: parse })).tinMoi, 1, 'bài vẫn còn là bài mới');
});

test('thu thập không ném khi lấy tin hỏng', async () => {
  const kq = await TV.thuThap(taoBoNhoTam(), { layTin: async () => { throw new Error('mất mạng'); }, goiChat: ai('bo'), parseJson: parse });
  assert.strictEqual(kq.daChay, false);
  assert.ok(kq.loi);
});

test('danh sách tín hiệu cho phép: đều là tín hiệu dương CÓ trong gói, không nằm trong suppressors, không phải CRED_OTP/FIN_TRANSFER', () => {
  const pack = registry.PACKS['vi-VN'];
  for (const id of TV.TIN_HIEU_CHO_PHEP) {
    assert.ok(pack.directPatterns[id], `${id} không có trong gói`);
    assert.ok(!pack.suppressors[id], `${id} có suppressors — không nạp động vào đó`);
  }
});

test('cổng quản trị: đóng khi chưa đặt token, không có mật khẩu mặc định', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  assert.match(src, /if \(!that \|\| typeof gui !== 'string'\) return false;/);
  assert.match(src, /crypto\.timingSafeEqual\(a, b\)/);
  const mat = [...src.matchAll(/app\.(get|post)\(['`]\/api\/admin\/tu-vung[^,]*,\s*([^)]*)\)/g)];
  assert.ok(mat.length >= 5, 'phải có các route quản trị');
  for (const m of mat) assert.match(m[2], /canTokenQuanTri/, `route thiếu cổng token: ${m[0].slice(0, 60)}`);
});

test('hẹn giờ không chạy trong test và có thể tắt bằng biến môi trường', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  assert.match(src, /process\.env\.NODE_TEST_CONTEXT \|\| process\.env\.KHOAN_DA_TU_VUNG_TU_THU_THAP === '0'/);
});
