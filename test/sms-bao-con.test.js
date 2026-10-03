'use strict';
/**
 * NHẮN SMS CHO CON KHI THÔNG BÁO ĐẨY KHÔNG TỚI ĐƯỢC (3/10/2026) — phương án B.
 *
 * Máy bố mẹ (CHỈ Android) tự nhắn SMS tới số người thân đã lưu. Test canh:
 *  · §12 — cần CẢ HAI công tắc (mức + "nhắn SMS cho con"), mặc định TẮT; thiếu bản sao quy tắc ⇒ không gửi;
 *  · không nhắn thêm khi đã có máy con được đẩy tới; nhắn khi máy chủ không với tới;
 *  · §6.9 — tin chỉ có TÊN và MỨC, không nội dung tin;
 *  · §11 — "máy đã gửi" ≠ "con đã đọc"; không "an toàn";
 *  · tốn tiền ⇒ trần 5 tin/giờ, gộp cùng loại, lỗi cũng tính (không vòng lặp tốn tiền);
 *  · quyền: có SEND_SMS, KHÔNG có READ_SMS / RECEIVE_SMS; chính sách khai báo đúng.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const doc = (...p) => fs.readFileSync(path.join(GOC, ...p), 'utf8');
const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*\/\/.*$/gm, '');

function goi(ten, nguon) {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  const tep = path.join(GOC, 'node_modules', '.goi-test-vong-tron', `${ten}.cjs`);
  fs.mkdirSync(path.dirname(tep), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, ...nguon)], bundle: true, format: 'cjs', platform: 'node',
    outfile: tep, absWorkingDir: GOC, logLevel: 'silent',
  });
  return require(tep);
}

// Kho giả cho localStorage (nhật ký, bản sao quy tắc).
const kho = {};
globalThis.localStorage = {
  getItem: (k) => (k in kho ? kho[k] : null),
  setItem: (k, v) => { kho[k] = String(v); },
  removeItem: (k) => { delete kho[k]; },
};
const S = goi('sms-bao-con', ['src', 'lib', 'sms-bao-con.ts']);
const D = goi('quy-tac-bao-dem', ['src', 'lib', 'quy-tac-bao-dem.ts']);

const BAT_HET = { baoKhiCao: true, baoKhiNghiNgo: true, baoKhiChuaKiem: true, baoKhiOtpTrongCuocGoi: true, baoQuaSms: true, choConXemBaoVe: false };
const phanHoi = (...trangThai) => ({ gui: true, suKienId: 'x', ketQua: trangThai.map((t, i) => ({ ten: `T${i}`, trangThai: t })) });
const LIEN_HE = [{ ten: 'Minh', dienThoai: '0912 345 678' }, { ten: 'Hoa', phone: '+84 987 654 321' }, { ten: 'Trùng', dienThoai: '0912345678' }];

test('§12 — cần CẢ HAI công tắc; thiếu bản sao quy tắc thì KHÔNG gửi', () => {
  const can = (quyTac, ph = null, loai = 'ket_qua_kiem') => S.canGuiSms({ loaiSuKien: loai, quyTac, phanHoi: ph });
  assert.strictEqual(can(BAT_HET), true);
  assert.strictEqual(can(null), false, 'không có bản sao ⇒ không biết bác đã bật chưa ⇒ không gửi');
  assert.strictEqual(can({ ...BAT_HET, baoQuaSms: false }), false, 'chưa cho phép đường SMS');
  assert.strictEqual(can({ ...BAT_HET, baoKhiCao: false }), false, 'mức CAO chưa bật báo');
  // Mỗi mức đúng một công tắc, không công tắc nào "bật hộ" mức khác.
  for (const [loai, khoa] of [['ket_qua_nghi_ngo', 'baoKhiNghiNgo'], ['chua_kiem_duoc', 'baoKhiChuaKiem'], ['otp_trong_cuoc_goi', 'baoKhiOtpTrongCuocGoi'], ['cai_app_trong_cuoc_goi', 'baoKhiOtpTrongCuocGoi'], ['tien_ra_trong_cuoc_goi', 'baoKhiOtpTrongCuocGoi']]) {
    assert.strictEqual(can(BAT_HET, null, loai), true, loai);
    assert.strictEqual(can({ ...BAT_HET, [khoa]: false }, null, loai), false, `${loai} khi tắt ${khoa}`);
  }
});

test('khi nào nhắn: không tới được máy chủ ⇒ nhắn; máy chủ đẩy được ⇒ thôi; máy chủ quyết không báo ⇒ thôi', () => {
  const can = (ph) => S.canGuiSms({ loaiSuKien: 'ket_qua_kiem', quyTac: BAT_HET, phanHoi: ph });
  assert.strictEqual(can(null), true, 'mất mạng / máy chủ ngủ');
  assert.strictEqual(can(phanHoi('DA_DAY_DI')), false, 'đã có máy con nhận được thông báo đẩy');
  assert.strictEqual(can(phanHoi('CHUA_BAT_NHAN', 'DA_DAY_DI')), false, 'một người nhận được là đủ');
  assert.strictEqual(can(phanHoi('CHUA_BAT_NHAN')), true, 'con chưa bật nhận');
  assert.strictEqual(can(phanHoi('DANG_KY_HET_HAN')), true);
  assert.strictEqual(can(phanHoi('CHUA_CAU_HINH_PUSH')), true);
  assert.strictEqual(can(phanHoi('PUSH_DELIVERY_UNKNOWN')), true, 'không xác nhận được ⇒ coi là chưa tới');
  assert.strictEqual(can({ gui: true, suKienId: 'x', ketQua: [] }), true, 'chưa nối với ai');
  assert.strictEqual(can({ gui: false, lyDo: 'CHUA_BAT_QUY_TAC' }), false, 'máy chủ nói quy tắc tắt ⇒ máy chủ thắng bản sao');
  assert.strictEqual(can({ gui: false, lyDo: 'DA_GOP' }), false, 'đã gộp ⇒ không nhắn đôi');
});

test('số điện thoại: làm sạch, bỏ trùng, tối đa hai người, giữ đúng thứ tự', () => {
  assert.strictEqual(S.sachSo('0912 345-678'), '0912345678');
  assert.strictEqual(S.sachSo('+84 987.654.321'), '+84987654321');
  assert.strictEqual(S.sachSo('12345'), '', 'quá ngắn không phải số thật');
  assert.strictEqual(S.sachSo('1'.repeat(20)), '', 'quá dài');
  assert.strictEqual(S.sachSo(null), '');
  assert.deepStrictEqual(S.chonNguoiNhan(LIEN_HE), [
    { ten: 'Minh', so: '0912345678' },
    { ten: 'Hoa', so: '+84987654321' },
  ]);
  assert.deepStrictEqual(S.chonNguoiNhan([{ ten: 'x', dienThoai: '' }]), []);
});

test('§6.9/§11 — tin chỉ có TÊN và MỨC; mọi loại, cả hai ngôn ngữ; thương hiệu đúng chính tả', () => {
  const loai = ['ket_qua_kiem', 'ket_qua_nghi_ngo', 'chua_kiem_duoc', 'otp_trong_cuoc_goi', 'cai_app_trong_cuoc_goi', 'tien_ra_trong_cuoc_goi'];
  for (const l of loai) {
    for (const lang of ['vi', 'en']) {
      const t = S.soanSms(l, 'Bác Lan', lang);
      assert.ok(t.includes('Bác Lan'), `${l}/${lang} thiếu tên`);
      assert.ok(!/\{[a-z]+\}/.test(t), `${l}/${lang} còn chỗ trống`);
      assert.ok(t.length <= 140, `${l}/${lang} dài ${t.length} ký tự — quá 2 phần SMS Unicode`);
      assert.ok(!/đã đọc|đã thấy|an toàn|\bsafe\b|lừa đảo là|tội phạm/i.test(t), `§11: ${t}`);
      if (l !== 'chua_kiem_duoc') assert.match(t, /KHOAN ĐÃ/, 'mức gấp phải ghi cảnh báo gấp, thương hiệu đúng dấu');
    }
  }
  assert.ok(!/gọi ngay|CẢNH BÁO GẤP/i.test(S.soanSms('chua_kiem_duoc', 'Bác Lan', 'vi')), 'tin đơn giản không dùng giọng báo động');
  assert.match(S.soanSms('ket_qua_nghi_ngo', 'Bác Lan', 'vi'), /CẢNH BÁO GẤP/);
  assert.match(S.soanSms('ket_qua_kiem', '', 'vi'), /Bố\/mẹ/, 'không có tên thì vẫn nói được');
});

test('trần: gộp cùng loại 2 phút, tối đa 5 tin mỗi giờ', () => {
  const T = 10_000_000;
  assert.strictEqual(S.dungTran([], 'ket_qua_kiem', T), null);
  assert.strictEqual(S.dungTran([{ loai: 'ket_qua_kiem', luc: T - 60_000 }], 'ket_qua_kiem', T), 'gop');
  assert.strictEqual(S.dungTran([{ loai: 'ket_qua_kiem', luc: T - 60_000 }], 'chua_kiem_duoc', T), null, 'loại khác không bị gộp');
  assert.strictEqual(S.dungTran([{ loai: 'ket_qua_kiem', luc: T - 3 * 60_000 }], 'ket_qua_kiem', T), null);
  const nam = Array.from({ length: 5 }, (_, i) => ({ loai: `l${i}`, luc: T - (10 + i) * 60_000 }));
  assert.strictEqual(S.dungTran(nam, 'ket_qua_nghi_ngo', T), 'gio');
  const cu = nam.map((d) => ({ ...d, luc: T - 2 * 60 * 60_000 }));
  assert.strictEqual(S.dungTran(cu, 'ket_qua_nghi_ngo', T), null, 'quá một giờ thì không tính');
});

async function chay(o = {}) {
  const gui = [];
  const ghi = [];
  const kq = await S.nhanSmsDuPhong({
    loaiSuKien: 'ket_qua_kiem', tenBoMe: 'Bác Lan', lang: 'vi', lienHe: LIEN_HE, quyTac: BAT_HET, phanHoi: null,
    guiSms: async (so, nd) => { gui.push({ so, nd }); return o.kq ?? 'da_gui'; },
    nhatKy: o.nhatKy ?? [], ghiNhatKy: (d) => ghi.push(d), bayGio: 5_000_000, ...o.vao,
  });
  return { kq, gui, ghi };
}

test('nhắn thật: máy chủ không tới được ⇒ nhắn tối đa hai số, ghi nhật ký, báo "máy đã gửi"', async () => {
  const { kq, gui, ghi } = await chay();
  assert.deepStrictEqual(gui.map((g) => g.so), ['0912345678', '+84987654321']);
  assert.ok(gui.every((g) => g.nd.includes('Bác Lan') && /KHOAN ĐÃ/.test(g.nd)));
  assert.deepStrictEqual(ghi, [{ loai: 'ket_qua_kiem', luc: 5_000_000 }]);
  assert.strictEqual(kq.trangThai, 'da_gui');
  const cau = S.cauTrangThaiSms(kq, 'vi');
  assert.match(cau, /Máy đã gửi SMS tới Minh · Hoa/);
  assert.ok(!/đã đọc|đã nhận|an toàn/i.test(cau), '§11: "đã gửi" khác "con đã đọc"');
});

test('không nhắn khi không cần / không số / chạm trần; không phải APK thì im lặng', async () => {
  assert.deepStrictEqual((await chay({ vao: { quyTac: null } })).kq, { trangThai: 'khong_can' });
  assert.deepStrictEqual((await chay({ vao: { phanHoi: phanHoi('DA_DAY_DI') } })).kq, { trangThai: 'khong_can' });
  const khongSo = await chay({ vao: { lienHe: [{ ten: 'Minh', dienThoai: '' }] } });
  assert.deepStrictEqual(khongSo.kq, { trangThai: 'khong_co_so' });
  assert.match(S.cauTrangThaiSms(khongSo.kq, 'vi'), /Chưa có số của con/);
  const gop = await chay({ nhatKy: [{ loai: 'ket_qua_kiem', luc: 5_000_000 - 30_000 }] });
  assert.deepStrictEqual(gop.kq, { trangThai: 'dung_tran', lyDo: 'gop' });
  assert.strictEqual(gop.gui.length, 0);
  assert.strictEqual(S.cauTrangThaiSms(gop.kq, 'vi'), null, 'trần là chuyện nội bộ, không làm bác hoảng');
  const web = await chay({ kq: 'khong_phai_apk' });
  assert.deepStrictEqual(web.kq, { trangThai: 'khong_phai_apk' });
  assert.strictEqual(S.cauTrangThaiSms(web.kq, 'vi'), null, 'bản web: không hiện dòng nào');
  assert.strictEqual(web.ghi.length, 0, 'không phải APK thì không ghi nhật ký');
});

test('§4.3 — lời thật khi lỗi: không có quyền / lỗi gửi / không xác nhận; lỗi CŨNG tính vào trần', async () => {
  for (const [kq, mau] of [['khong_co_quyen', /máy chưa cho phép gửi tin nhắn/], ['loi_gui', /Chưa nhắn được SMS tới/], ['khong_xac_nhan', /Chưa xác nhận được SMS/]]) {
    const r = await chay({ kq });
    assert.match(S.cauTrangThaiSms(r.kq, 'vi'), mau, kq);
    assert.strictEqual(r.ghi.length, 1, `${kq}: lỗi lặp lại không được thành vòng lặp tốn tiền`);
  }
  // Hai người, một ổn một lỗi ⇒ nói là lỗi, không giấu.
  let dem = 0;
  const hon = await S.nhanSmsDuPhong({
    loaiSuKien: 'ket_qua_kiem', tenBoMe: 'Lan', lang: 'vi', lienHe: LIEN_HE, quyTac: BAT_HET, phanHoi: null,
    guiSms: async () => ((dem += 1) === 1 ? 'da_gui' : 'loi_gui'), nhatKy: [], ghiNhatKy: () => {}, bayGio: 1,
  });
  assert.strictEqual(hon.trangThai, 'hon_hop');
  assert.match(S.cauTrangThaiSms(hon, 'vi'), /Chưa nhắn được SMS tới/);
  // Cầu nối ném lỗi cũng không làm sập.
  const nem = await S.nhanSmsDuPhong({
    loaiSuKien: 'ket_qua_kiem', tenBoMe: 'Lan', lang: 'vi', lienHe: LIEN_HE.slice(0, 1), quyTac: BAT_HET, phanHoi: null,
    guiSms: async () => { throw new Error('boom'); }, nhatKy: [], ghiNhatKy: () => {}, bayGio: 1,
  });
  assert.strictEqual(nem.trangThai, 'loi_gui');
});

test('bản sao quy tắc: chỉ `true` thật mới là bật; hỏng ⇒ null; không giữ gì ngoài cờ', () => {
  for (const k of Object.keys(kho)) delete kho[k];
  assert.strictEqual(D.docQuyTacDem(), null);
  D.ghiQuyTacDem({ baoKhiCao: 'true', baoQuaSms: 1, baoKhiNghiNgo: true, tenBoMe: 'Lan', soDienThoai: '0912345678' });
  const dem = D.docQuyTacDem();
  assert.strictEqual(dem.baoKhiCao, false, 'chuỗi "true" không phải bật');
  assert.strictEqual(dem.baoQuaSms, false);
  assert.strictEqual(dem.baoKhiNghiNgo, true);
  assert.ok(!JSON.stringify(kho).match(/Lan|0912345678/), 'bản sao không được giữ tên hay số');
  kho.khoan_da_quy_tac_bao_dem = '{hỏng';
  assert.strictEqual(D.docQuyTacDem(), null);
});

test('bản sao quy tắc chỉ được ghi từ phản hồi của máy chủ', () => {
  const tk = doc('src', 'tai-khoan.ts');
  const dem = doc('src', 'lib', 'quy-tac-bao-dem.ts');
  assert.match(tk, /const q = quyTacTu\(await goi\('\/api\/gia-dinh\/quy-tac-bao', \{\}, true\)\);\s*ghiQuyTacDem\(q\);/);
  assert.match(tk, /const moi = quyTacTu\(await goi\('\/api\/gia-dinh\/quy-tac-bao', \{ method: 'PUT'[\s\S]*?\}, true\)\);\s*ghiQuyTacDem\(moi\);/);
  assert.strictEqual((boChuThich(doc('src', 'App.tsx')).match(/ghiQuyTacDem/g) || []).length, 0, 'App không được tự ghi bản sao');
  assert.strictEqual((boChuThich(doc('src', 'components', 'ConCaiGiup.tsx')).match(/ghiQuyTacDem/g) || []).length, 0);
  assert.ok(!/fetch\(|sendBeacon|XMLHttpRequest/.test(boChuThich(dem)));
  assert.ok(!/fetch\(|sendBeacon|XMLHttpRequest/.test(boChuThich(doc('src', 'lib', 'sms-bao-con.ts'))), 'lib SMS không có đường ra mạng');
});

test('ánh xạ loại → công tắc ở máy bố mẹ KHỚP máy chủ (không lệch một phía)', () => {
  const BDG = require('../backend/src/bao-dong-gia-dinh');
  assert.deepStrictEqual(S.QUY_TAC_THEO_LOAI, { ...BDG.QUY_TAC_THEO_LOAI });
});

test('máy chủ: baoQuaSms mặc định TẮT, chỉ nhận true/false, và máy chủ KHÔNG gửi SMS', () => {
  const QT = require('../backend/src/quy-tac-bao');
  assert.strictEqual(QT.MAC_DINH.baoQuaSms, false);
  const nguon = boChuThich(doc('backend', 'src', 'quy-tac-bao.js')) + boChuThich(doc('backend', 'src', 'bao-dong-gia-dinh.js'));
  assert.ok(!/twilio|esms|sendSms|guiSms|sms\.send/i.test(nguon), 'phương án B: máy chủ không gửi SMS và không giữ số của con');
});

test('App: SMS dự phòng chạy ở CẢ nhánh thành công lẫn nhánh lỗi; có dòng trạng thái ở cả hai bố cục', () => {
  const app = boChuThich(doc('src', 'App.tsx'));
  assert.match(app, /\.then\(\(kq\) => \{ suKienBaoDongRef\.current = kq\.suKienId \?\? null; setBaoDong\(kq\); nhanSms\(kq\); \}\)/);
  assert.match(app, /\.catch\(\(\) => \{ nhanSms\(null\);/);
  assert.match(app, /quyTac: docQuyTacDem\(\),/);
  assert.strictEqual((app.match(/\{cauSms && \(/g) || []).length, 2, 'dòng trạng thái SMS phải có ở màn gấp và màn thường');
  // Cùng các chốt chặn với thông báo đẩy: diễn tập / mất mạng / chưa đăng nhập không nhắn.
  const i = app.indexOf('const nhanSms = (phanHoi');
  const truoc = app.slice(app.lastIndexOf('useEffect(() => {', i), i);
  assert.match(truoc, /laDienTap \|\| khongGoiDuoc \|\| !docPhienTaiKhoan\(\)\) return;/);
});

test('Android: có SEND_SMS và telephony không bắt buộc; KHÔNG có READ_SMS / RECEIVE_SMS; quyền xin lúc chạy', () => {
  const man = doc('android', 'app', 'src', 'main', 'AndroidManifest.xml');
  const khaiBao = [...boChuThich(man).matchAll(/<uses-permission android:name="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(khaiBao.includes('android.permission.SEND_SMS'));
  for (const cam of ['READ_SMS', 'RECEIVE_SMS', 'RECEIVE_MMS', 'RECEIVE_WAP_PUSH', 'READ_CALL_LOG', 'READ_CONTACTS']) {
    assert.ok(!khaiBao.includes(`android.permission.${cam}`), `không được khai ${cam}`);
  }
  assert.match(man, /<uses-feature android:name="android\.hardware\.telephony" android:required="false" \/>/);

  const java = doc('android', 'app', 'src', 'main', 'java', 'vn', 'khoanda', 'app', 'KhoanDaPlugin.java');
  assert.match(java, /@Permission\(alias = "guiSms", strings = \{ Manifest\.permission\.SEND_SMS \}\)/);
  assert.match(java, /public void guiSms\(final PluginCall call\)/);
  assert.match(java, /getPermissionState\("guiSms"\) != PermissionState\.GRANTED/, 'thiếu quyền thì trả khong_co_quyen, không ném');
  assert.match(java, /"khong_xac_nhan"/, 'hết hạn chờ phải nói là chưa xác nhận');
  assert.match(java, /RECEIVER_NOT_EXPORTED/, 'Android 13+ đòi cờ này cho receiver động');
  assert.ok(!/RECEIVE_SMS|READ_SMS|content:\/\/sms/.test(boChuThich(java)), 'cầu nối chỉ GỬI, không đọc');
  // Lớp Java không soạn câu (§11): nội dung đến từ tầng web.
  const phanSms = java.slice(java.indexOf('public void guiSms('));
  assert.ok(!/[ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/i.test(phanSms.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), 'không mã cứng chữ Việt trong phần gửi SMS');
});

test('chính sách khai báo đúng: SEND_SMS là gửi-không-đọc; trang riêng tư không còn câu "không xin quyền SMS" chung chung', () => {
  const cs = doc('PERMISSIONS-AND-POLICY.md');
  assert.match(cs, /\| \*\*4c\*\* \| `SEND_SMS` \|/);
  assert.match(cs, /send only, never read/);
  assert.match(cs, /`READ_SMS`.*stay refused/);
  const html = doc('public', 'chinh-sach-rieng-tu.html');
  assert.match(html, /<td>Gửi SMS<\/td>/);
  assert.match(html, /<td>Sending SMS<\/td>/);
  assert.match(html, /chỉ gửi, không đọc/);
  assert.match(html, /only sends, it never reads/);
  assert.doesNotMatch(html, /does <strong>not<\/strong> request SMS, call-log or contacts permissions/, 'câu cũ nói quá: ứng dụng nay có xin SEND_SMS');
  assert.match(html, /request permission to <strong>read<\/strong> SMS/);
});

test('màn bật SMS: chỉ APK, xin quyền NGAY LÚC bấm, từ chối thì KHÔNG lưu "bật" (§4.3)', () => {
  const m = boChuThich(doc('src', 'components', 'ConCaiGiup.tsx'));
  const i = m.indexOf('const doiSms = async');
  assert.ok(i > 0);
  const than = m.slice(i, m.indexOf('};', i));
  assert.ok(than.indexOf('xinQuyenGuiSms()') < than.indexOf('luuQuyTac('), 'phải xin quyền TRƯỚC khi lưu');
  assert.match(than, /!== true\) \{ setLoiSms\(t\('[^']*'\)\); return; \}/, 'từ chối ⇒ dừng, không lưu');
  assert.match(m, /\{dangChayApk && \(\s*<label[\s\S]*?baoQuaSms/, 'công tắc SMS chỉ hiện trên APK');
  assert.match(m, /baoQuaSms: false, baoKhiNghiNgo: false/, 'mặc định TẮT');
});
