'use strict';
/**
 * BÁO CHO CON Ở BA MỨC (3/10/2026) — nguy hiểm cao, có dấu hiệu đáng ngờ, chưa kiểm được.
 *
 * Trước hôm nay máy chủ chỉ báo khi kết quả là CAO (hoặc máy tự bật trong cuộc gọi).
 * Chủ dự án muốn con cũng được báo khi: Nghi ngờ ("có dấu hiệu") và khi Khoan Đã
 * "chưa kiểm được" một thứ bác gửi.
 *
 * Giữ nguyên các ràng buộc cũ:
 *  · §12 — MỖI mức là một công tắc riêng do CHÍNH bố mẹ bật, mặc định TẮT.
 *  · §6.9 — chỉ MÃ đi qua, không nội dung tin.
 *  · §11 — không "an toàn", không "đã thấy", không buộc tội ai.
 *  · "Chưa kiểm được" là TIN NHẮN ĐƠN GIẢN (không khẩn, không leo thang); hai mức còn lại
 *    là "CẢNH BÁO GẤP".
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
process.env.VAPID_PUBLIC_KEY = 'BTEST_cong_khai';
process.env.VAPID_PRIVATE_KEY = 'test_rieng_tu';
process.env.VAPID_SUBJECT = 'https://khoan-da.test';

const { app } = require('../backend/server');
const BDG = require('../backend/src/bao-dong-gia-dinh');
const QT = require('../backend/src/quy-tac-bao');

const luotGui = [];
let henDaBat = [];
app.set('guiPushThay', async ({ dangKy, payload }) => { luotGui.push({ endpoint: dangKy.endpoint, payload }); return { ok: true, status: 201 }; });
app.set('henGioThay', (fn) => { henDaBat.push(fn); return 0; });

async function moMayChu() {
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (method, duong, body, token) => {
    const r = await fetch(goc + duong, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  return { sv, goi };
}
let dem = 0;
const soMoi = (dau) => `${dau}${String(Date.now() + (dem += 1)).slice(-7)}`;
const DK_GIA = { endpoint: 'https://push.test/may-con-nhieu-muc', keys: { p256dh: 'p256dh-gia', auth: 'auth-gia' } };

async function dungNha(goi) {
  const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-me', ten: 'Bác Lan thử' });
  const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-con', ten: 'Minh thử' });
  const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
  await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
  await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: DK_GIA, lang: 'vi' }, con.j.token);
  return { me: me.j.token, con: con.j.token };
}

const bao = (goi, loaiSuKien, nhan, token, them = {}) =>
  goi('POST', '/api/gia-dinh/bao-dong', { loaiSuKien, nhan, ...them }, token);

test('§12 — hai công tắc mới mặc định TẮT; chỉ nhận true/false; tắt thì máy chủ im', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    const mac = await goi('GET', '/api/gia-dinh/quy-tac-bao', null, n.me);
    assert.strictEqual(mac.j.baoKhiNghiNgo, false);
    assert.strictEqual(mac.j.baoKhiChuaKiem, false);
    assert.strictEqual((await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiNghiNgo: 'co' }, n.me)).s, 400);
    assert.strictEqual((await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiChuaKiem: 1 }, n.me)).s, 400);

    luotGui.length = 0;
    // Bật mức CAO không kéo theo hai mức kia.
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true }, n.me);
    const a = await bao(goi, 'ket_qua_nghi_ngo', 'NGHI_NGO', n.me);
    assert.deepStrictEqual(a.j, { gui: false, lyDo: 'CHUA_BAT_QUY_TAC' });
    const b = await bao(goi, 'chua_kiem_duoc', undefined, n.me);
    assert.deepStrictEqual(b.j, { gui: false, lyDo: 'CHUA_BAT_QUY_TAC' });
    assert.strictEqual(luotGui.length, 0, '§12 — chưa bật thì KHÔNG gửi, dù ở mức gì');
  } finally { sv.close(); }
});

test('có dấu hiệu (Nghi ngờ): CẢNH BÁO GẤP tới máy con, khẩn, không leo thang tự động', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiNghiNgo: true }, n.me);
    luotGui.length = 0; henDaBat = [];
    const r = await bao(goi, 'ket_qua_nghi_ngo', 'NGHI_NGO', n.me, { hoKichBan: 'gia_danh_ngan_hang', vanBan: 'SỐ_TK_0123456789_BÍ_MẬT' });
    assert.strictEqual(r.s, 200);
    assert.strictEqual(r.j.gui, true);
    assert.strictEqual(luotGui.length, 1);
    const p = luotGui[0].payload;
    assert.strictEqual(p.khan, true);
    assert.match(`${p.tieuDe} ${p.noiDung}`, /[Cc]ảnh báo gấp|CẢNH BÁO GẤP/);
    assert.match(p.noiDung, /Bác Lan thử/);
    assert.ok(!JSON.stringify(p).includes('0123456789'), '§6.9 — nội dung tin không đi theo');
    assert.ok(!/đã thấy|đã đọc|an toàn|lừa đảo là|tội phạm/i.test(JSON.stringify(p)), '§11');
    assert.strictEqual(henDaBat.length, 0, 'mức Nghi ngờ không tự leo thang lần hai (tránh dội thông báo)');
  } finally { sv.close(); }
});

test('chưa kiểm được: TIN NHẮN ĐƠN GIẢN — không khẩn, không "gọi ngay", không leo thang', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiChuaKiem: true }, n.me);
    luotGui.length = 0; henDaBat = [];
    const r = await bao(goi, 'chua_kiem_duoc', undefined, n.me);
    assert.strictEqual(r.j.gui, true);
    const p = luotGui[0].payload;
    assert.strictEqual(p.khan, false, 'tin đơn giản không được kêu như báo động');
    assert.ok(!/cảnh báo gấp|gọi ngay|nguy hiểm/i.test(`${p.tieuDe} ${p.noiDung}`), 'không dùng giọng báo động cho việc chưa kiểm được');
    assert.match(p.noiDung, /chưa kiểm được/i);
    assert.ok(!/đã thấy|đã đọc|an toàn/i.test(JSON.stringify(p)), '§11');
    assert.strictEqual(henDaBat.length, 0);
  } finally { sv.close(); }
});

test('mức CAO cũng ghi "cảnh báo gấp" và vẫn leo thang sau 60 giây', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true }, n.me);
    luotGui.length = 0; henDaBat = [];
    await bao(goi, 'ket_qua_kiem', 'CAO', n.me);
    const p = luotGui[0].payload;
    assert.strictEqual(p.khan, true);
    assert.match(`${p.tieuDe} ${p.noiDung}`, /[Cc]ảnh báo gấp|CẢNH BÁO GẤP/);
    assert.strictEqual(henDaBat.length, 1, 'CAO vẫn hẹn leo thang');
  } finally { sv.close(); }
});

test('gộp 30 giây theo (bố mẹ, loại): Nghi ngờ không nuốt mất một báo CAO ngay sau đó', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true, baoKhiNghiNgo: true }, n.me);
    luotGui.length = 0;
    assert.strictEqual((await bao(goi, 'ket_qua_nghi_ngo', 'NGHI_NGO', n.me)).j.gui, true);
    const lai = await bao(goi, 'ket_qua_nghi_ngo', 'NGHI_NGO', n.me);
    assert.strictEqual(lai.j.lyDo, 'DA_GOP');
    const cao = await bao(goi, 'ket_qua_kiem', 'CAO', n.me);
    assert.strictEqual(cao.j.gui, true, 'báo CAO không được bị gộp vào báo Nghi ngờ trước đó');
    assert.strictEqual(luotGui.length, 2);
  } finally { sv.close(); }
});

test('nhãn phải khớp loại: "ket_qua_kiem" vẫn chỉ nhận CAO; "ket_qua_nghi_ngo" chỉ nhận NGHI_NGO', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const n = await dungNha(goi);
    await goi('PUT', '/api/gia-dinh/quy-tac-bao', { baoKhiCao: true, baoKhiNghiNgo: true }, n.me);
    luotGui.length = 0;
    assert.strictEqual((await bao(goi, 'ket_qua_kiem', 'NGHI_NGO', n.me)).j.gui, false);
    assert.strictEqual((await bao(goi, 'ket_qua_nghi_ngo', 'CAO', n.me)).j.gui, false);
    assert.strictEqual((await bao(goi, 'ket_qua_nghi_ngo', 'CHUA_THAY', n.me)).j.gui, false);
    assert.strictEqual((await bao(goi, 'ket_qua_nghi_ngo', undefined, n.me)).j.gui, false);
    assert.strictEqual(luotGui.length, 0);
  } finally { sv.close(); }
});

test('ngôn ngữ người nhận: máy con tiếng Anh nhận bản tiếng Anh, đủ cho cả hai loại mới', () => {
  assert.ok(BDG.LOAI_SU_KIEN.includes('ket_qua_nghi_ngo') && BDG.LOAI_SU_KIEN.includes('chua_kiem_duoc'));
  for (const lang of ['vi', 'en']) {
    for (const loai of ['ket_qua_nghi_ngo', 'chua_kiem_duoc']) {
      const p = BDG.soanCanhBao({ tenBoMe: 'Lan', loaiSuKien: loai, hoKichBan: null, lang, suKienId: 'x' });
      assert.ok(p.tieuDe && p.noiDung, `${lang}/${loai} thiếu chữ`);
      assert.ok(!/\{[a-z]+\}/.test(`${p.tieuDe}${p.noiDung}`), `${lang}/${loai} còn chỗ trống chưa điền`);
    }
  }
  const en = BDG.soanCanhBao({ tenBoMe: 'Lan', loaiSuKien: 'ket_qua_nghi_ngo', hoKichBan: null, lang: 'en', suKienId: 'x' });
  assert.match(`${en.tieuDe} ${en.noiDung}`, /urgent/i);
});

test('quy tắc: ba mức là ba công tắc riêng, mặc định TẮT (đọc thẳng từ module)', async () => {
  assert.deepStrictEqual(QT.MAC_DINH, {
    baoKhiCao: false, baoKhiNghiNgo: false, baoKhiChuaKiem: false, baoKhiOtpTrongCuocGoi: false, baoQuaSms: false, choConXemBaoVe: false,
  });
});

test('máy bố mẹ: chọn loại báo theo kết quả; mã "chưa kiểm được" chỉ gồm thứ THẬT SỰ không đọc được', () => {
  const esbuild = require('esbuild');
  const GOC = path.join(__dirname, '..');
  const tep = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'loai-bao-con.cjs');
  fs.mkdirSync(path.dirname(tep), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'lib', 'loai-bao-con.ts')], bundle: true, format: 'cjs', platform: 'node',
    outfile: tep, absWorkingDir: GOC, logLevel: 'silent',
  });
  const { chonLoaiBaoCon } = require(tep);
  const chon = (nhan, chuaKiem = [], lyDoTuBat = null, maLyDo = ['FIN_TRANSFER_REQUEST']) =>
    chonLoaiBaoCon({ nhan, chuaKiem, lyDoTuBat, maLyDo });

  assert.deepStrictEqual(chon('CAO'), { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  assert.deepStrictEqual(chon('NGHI_NGO'), { loaiSuKien: 'ket_qua_nghi_ngo', nhan: 'NGHI_NGO' });
  assert.deepStrictEqual(chon('CHUA_THAY', ['khong_doc_duoc_anh']), { loaiSuKien: 'chua_kiem_duoc' });
  assert.deepStrictEqual(chon('CHUA_THAY', ['khong_mo_duoc_link']), { loaiSuKien: 'chua_kiem_duoc' });
  // Máy tự bật trong cuộc gọi: giữ nguyên như trước.
  assert.deepStrictEqual(chon(undefined, [], 'otp_trong_cuoc_goi'), { loaiSuKien: 'otp_trong_cuoc_goi' });

  // CHƯA THẤY + không có gì chưa kiểm ⇒ không báo (không dội con bằng tin lành).
  assert.strictEqual(chon('CHUA_THAY', []), null);
  // Dòng nhắc cố định ở MỌI lượt có cuộc gọi dính vào không phải "chưa kiểm được một thứ bác gửi".
  assert.strictEqual(chon('CHUA_THAY', ['chua_nghe_duoc_cuoc_goi']), null);
  assert.strictEqual(chon('CHUA_THAY', ['chua_xem_duoc_trang_thai_may']), null);
  assert.strictEqual(chon('CHUA_THAY', ['ai_khong_chay']), null, 'AI tắt là chuyện hệ thống, không phải bác gửi thứ không đọc được');
  // Bác tự bấm "Dừng 60 giây" không có nhãn.
  assert.strictEqual(chon(undefined, []), null);
  // CAO luôn thắng "chưa kiểm được"; NGHI_NGO THẬT (có mã lý do) cũng thắng.
  assert.deepStrictEqual(chon('CAO', ['khong_doc_duoc_anh']), { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  assert.deepStrictEqual(chon('NGHI_NGO', ['khong_doc_duoc_anh']), { loaiSuKien: 'ket_qua_nghi_ngo', nhan: 'NGHI_NGO' });

  // ⚠️ Sàn §4.3 NÂNG nhãn lên NGHI_NGO khi ảnh/ghi âm/nội dung không đọc được: maLyDo RỖNG.
  // Đó là "chưa kiểm được" (tin đơn giản), KHÔNG phải "đáng ngờ" (cảnh báo gấp).
  for (const ma of ['khong_doc_duoc_anh', 'noi_dung_qua_dai', 'khong_nghe_duoc_ghi_am', 'chi_nghe_duoc_phan_dau']) {
    assert.deepStrictEqual(chon('NGHI_NGO', [ma], null, []), { loaiSuKien: 'chua_kiem_duoc' }, ma);
  }
  // NGHI_NGO không mã lý do và cũng không có thứ không-đọc-được ⇒ vẫn là cảnh báo gấp (thà dư hơn thiếu).
  assert.deepStrictEqual(chon('NGHI_NGO', [], null, []), { loaiSuKien: 'ket_qua_nghi_ngo', nhan: 'NGHI_NGO' });
});

test('thẻ phía con: "chưa kiểm được" là thẻ xám hỏi thăm; Nghi ngờ và CAO vẫn là thẻ đỏ khẩn', () => {
  const esbuild = require('esbuild');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const GOC = path.join(__dirname, '..');
  const tep = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'the-canh-bao-con.cjs');
  fs.mkdirSync(path.dirname(tep), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'components', 'TheCanhBaoCon.tsx')], bundle: true, format: 'cjs', platform: 'node',
    outfile: tep, absWorkingDir: GOC, logLevel: 'silent', jsx: 'automatic', external: ['react', 'react-dom', 'lucide-react'],
  });
  const { TheCanhBaoCon } = require(tep);
  const ve = (loaiSuKien) => renderToStaticMarkup(React.createElement(TheCanhBaoCon, {
    t: (s) => s, lang: 'vi', tenBoMe: 'Bác Lan', loaiSuKien, hanhDong: [], soBoMe: '0900000000', onGoiNgay: () => {},
  }));

  const don = ve('chua_kiem_duoc');
  assert.match(don, /role="status"/);
  assert.match(don, /bg-slate-800/);
  assert.doesNotMatch(don, /bg-red-700|role="alert"/, 'tin đơn giản không được dựng như báo động');
  assert.match(don, /Bác Lan vừa nhờ kiểm một thứ/);
  assert.match(don, /chưa kiểm được một thứ/);
  assert.match(don, /Gọi hỏi thăm/);
  assert.doesNotMatch(don, /Gọi ngay|đang cần anh\/chị/);

  for (const loai of ['ket_qua_nghi_ngo', 'ket_qua_kiem']) {
    const gap = ve(loai);
    assert.match(gap, /role="alert"/, loai);
    assert.match(gap, /bg-red-700/, loai);
    assert.match(gap, /Bác Lan đang cần anh\/chị/, loai);
    assert.match(gap, /Gọi ngay/, loai);
  }
  assert.match(ve('ket_qua_nghi_ngo'), /dấu hiệu đáng ngờ/);
  assert.doesNotMatch(ve('ket_qua_nghi_ngo'), /nguy hiểm cao/, 'mức giữa không được nói là nguy hiểm cao');
  // Ba câu để nói với bố mẹ có đủ cho cả hai loại mới và không trấn an suông về thứ chưa kiểm.
  assert.match(don, /Chưa chắc có chuyện gì/);
  assert.doesNotMatch(don, /không sao đâu/);
});

test('đầu-cuối với bộ luật THẬT: ảnh hỏng/quá dài/ghi âm hụt ⇒ tin đơn giản; nghi ngờ thật ⇒ cảnh báo gấp', () => {
  const esbuild = require('esbuild');
  const GOC = path.join(__dirname, '..');
  const tep = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'loai-bao-con.cjs');
  fs.mkdirSync(path.dirname(tep), { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'lib', 'loai-bao-con.ts')], bundle: true, format: 'cjs', platform: 'node',
    outfile: tep, absWorkingDir: GOC, logLevel: 'silent',
  });
  const { chonLoaiBaoCon } = require(tep);
  const { analyze } = require('../backend/src/analysis/pipeline');
  const loai = (vao) => {
    const r = analyze(vao);
    return { nhan: r.nhan, ra: chonLoaiBaoCon({ nhan: r.nhan, maLyDo: r.maLyDo, chuaKiem: r.chuaKiem, lyDoTuBat: null }) };
  };

  for (const vao of [
    { ocrFailed: true },
    { vanBan: 'a '.repeat(6000) },
    { ghiAm: true, vanBan: 'xin chào', ghiAmConfidence: 0.1 },
  ]) {
    const { nhan, ra } = loai(vao);
    assert.strictEqual(nhan, 'NGHI_NGO', 'sàn §4.3 nâng nhãn lên Nghi ngờ');
    assert.deepStrictEqual(ra, { loaiSuKien: 'chua_kiem_duoc' }, 'nhưng với con đó chỉ là "chưa kiểm được"');
  }
  const that = loai({ vanBan: 'Mua thẻ quà tặng gửi mã cho tôi gấp' });
  assert.strictEqual(that.nhan, 'NGHI_NGO');
  assert.deepStrictEqual(that.ra, { loaiSuKien: 'ket_qua_nghi_ngo', nhan: 'NGHI_NGO' });
  // Ảnh hỏng NHƯNG chữ kèm theo đã đủ nguy hiểm ⇒ CAO, không bị nuốt thành "chưa kiểm được".
  const cao = loai({ ocrFailed: true, vanBan: 'Công an yêu cầu bác chuyển tiền vào tài khoản an toàn' });
  assert.deepStrictEqual(cao.ra, { loaiSuKien: 'ket_qua_kiem', nhan: 'CAO' });
  // Tin lành, không có gì chưa kiểm ⇒ không báo.
  assert.strictEqual(loai({ vanBan: 'Mẹ ơi chiều con qua đón mẹ nhé' }).ra, null);
});
