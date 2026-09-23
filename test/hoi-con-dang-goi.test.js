'use strict';
/**
 * "CÓ PHẢI CON ĐANG GỌI KHÔNG?" (23/9/2026) — bản gia đình của "Revolut có đang gọi bạn?".
 * Có người gọi xưng là con (giọng có thể giả bằng AI) ⇒ bác hỏi qua KÊNH KHÁC,
 * con trả lời Có/Không trên máy con. Test qua HTTP thật, bộ gửi push GIẢ.
 */
const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
process.env.VAPID_PUBLIC_KEY = 'BTEST_cong_khai';
process.env.VAPID_PRIVATE_KEY = 'test_rieng_tu';
process.env.VAPID_SUBJECT = 'https://khoan-da.test';

const { app } = require('../backend/server');

const luotGui = [];
app.set('guiPushThay', async ({ dangKy, payload }) => { luotGui.push({ endpoint: dangKy.endpoint, payload }); return { ok: true, status: 201 }; });
app.set('henGioThay', () => 0);

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

async function giaDinh(goi) {
  const me = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('091'), matKhau: 'mat-khau-me', ten: 'Bác Lan thử' });
  const con = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('098'), matKhau: 'mat-khau-con', ten: 'Minh thử' });
  const la = await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: soMoi('093'), matKhau: 'mat-khau-la', ten: 'Người lạ' });
  const ma = await goi('POST', '/api/proof/ghep/bat-dau', {}, me.j.token);
  await goi('POST', '/api/proof/ghep/xac-nhan', { ma: ma.j.ma }, con.j.token);
  return { me: me.j.token, con: con.j.token, la: la.j.token };
}

test('trọn luồng: bác hỏi → máy con được báo → con bấm "Không phải con" → màn bác thấy đúng câu trả lời', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const { me, con, la } = await giaDinh(goi);
    await goi('POST', '/api/gia-dinh/nhan-canh-bao', { dangKy: { endpoint: 'https://push.test/con-hoi', keys: { p256dh: 'a', auth: 'b' } }, lang: 'vi' }, con);

    luotGui.length = 0;
    const hoi = await goi('POST', '/api/gia-dinh/hoi-con', {}, me);
    assert.strictEqual(hoi.s, 200, JSON.stringify(hoi.j));
    assert.strictEqual(luotGui.length, 1, 'máy con phải được báo — KHÔNG cần quy tắc báo, vì chính bác bấm');
    assert.match(luotGui[0].payload.duong, /view=guardian&hoiGoi=/);
    assert.match(luotGui[0].payload.noiDung, /Có phải con đang gọi không\?/);
    assert.deepStrictEqual(hoi.j.guiToi.map((g) => g.ten), ['Minh thử']);

    // Máy con thấy câu hỏi đang chờ; người ngoài vòng không thấy, không trả lời được.
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/hoi-con/dang-cho', null, con)).j.hoi.map((h) => h.tenBoMe), ['Bác Lan thử']);
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/hoi-con/dang-cho', null, la)).j.hoi, []);
    assert.strictEqual((await goi('POST', `/api/gia-dinh/hoi-con/${hoi.j.hoiId}/tra-loi`, { traLoi: 'CO' }, la)).s, 403);
    assert.strictEqual((await goi('GET', `/api/gia-dinh/hoi-con/${hoi.j.hoiId}`, null, la)).s, 403);

    // Chưa ai trả lời: KHÔNG có câu trả lời nào được bịa ra.
    assert.deepStrictEqual((await goi('GET', `/api/gia-dinh/hoi-con/${hoi.j.hoiId}`, null, me)).j.traLoi, []);

    assert.strictEqual((await goi('POST', `/api/gia-dinh/hoi-con/${hoi.j.hoiId}/tra-loi`, { traLoi: 'an_toan' }, con)).s, 400, 'chỉ CO / KHONG');
    assert.strictEqual((await goi('POST', `/api/gia-dinh/hoi-con/${hoi.j.hoiId}/tra-loi`, { traLoi: 'KHONG' }, con)).s, 200);

    const kq = (await goi('GET', `/api/gia-dinh/hoi-con/${hoi.j.hoiId}`, null, me)).j;
    assert.deepStrictEqual(kq.traLoi.map((x) => [x.ten, x.traLoi]), [['Minh thử', 'KHONG']]);
    assert.strictEqual(kq.conHan, true);
    assert.deepStrictEqual((await goi('GET', '/api/gia-dinh/hoi-con/dang-cho', null, con)).j.hoi, [], 'đã trả lời thì không còn chờ');
  } finally { sv.close(); }
});

test('con chưa bật nhận cảnh báo ⇒ máy bác được nói THẬT là chưa gửi tới được, không giả vờ đã hỏi', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const { me } = await giaDinh(goi);
    luotGui.length = 0;
    const hoi = await goi('POST', '/api/gia-dinh/hoi-con', {}, me);
    assert.strictEqual(luotGui.length, 0);
    assert.deepStrictEqual(hoi.j.guiToi.map((g) => [g.ten, g.trangThai]), [['Minh thử', 'CHUA_BAT_NHAN']]);
  } finally { sv.close(); }
});

test('hết 5 phút ⇒ không trả lời được nữa, và máy bác thấy "hết hạn", không thấy "không sao"', async () => {
  const BDG = require('../backend/src/bao-dong-gia-dinh');
  let gio = 1_000_000;
  const kho = { doc: async () => null, luu: async () => {} };
  const lop = BDG.taoBaoDong({
    kho, khoSuKien: BDG.taoKhoSuKien(),
    capGhep: async () => ({ thanhVien: [{ id: 'con' }] }),
    layHoSo: async (_k, id) => ({ ten: id }),
    bayGio: () => gio,
  });
  const { hoiId } = await lop.hoiCon('me');
  gio += BDG.HAN_HOI_MS + 1;
  await assert.rejects(lop.traLoiHoi('con', hoiId, 'CO'), /CAU_HOI_DA_HET_HAN/);
  const kq = await lop.docHoi('me', hoiId);
  assert.strictEqual(kq.conHan, false);
  assert.deepStrictEqual(kq.traLoi, []);
  assert.deepStrictEqual((await lop.hoiDangCho('con')).hoi, []);
});

test('giao diện: mọi chuỗi có ở cả hai catalog, không "an toàn", hết hạn/không tới được ⇒ gọi lại số đã lưu', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const doc = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  const boChuThich = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  const i18n = doc('src/i18n.ts');
  const thieu = [];
  for (const p of ['src/components/HoiCon.tsx', 'src/components/TraLoiHoiCon.tsx']) {
    const s = boChuThich(doc(p));
    for (const m of s.matchAll(/(?<![\w.])t\('([^']+)'\)/g)) {
      assert.ok(!/an toàn|không sao/i.test(m[1]), `${p}: "${m[1]}" — §4.3/§11`);
      if (i18n.split(JSON.stringify(m[1]) + ':').length - 1 < 2) thieu.push(`${p}: ${m[1]}`);
    }
  }
  assert.deepStrictEqual(thieu, []);

  const hoi = boChuThich(doc('src/components/HoiCon.tsx'));
  const nhanhHet = hoi.slice(hoi.indexOf('if (khongToiAi || hetGio)'), hoi.indexOf('const phut'));
  assert.match(nhanhHet, /Bác cúp máy, gọi lại số của con đã lưu\./);
  assert.match(nhanhHet, /\{nutGoiLai\}/, 'chưa hỏi được thì đưa ngay nút gọi lại số đã lưu');

  assert.match(doc('src/components/HoiNhanh.tsx'), /<HoiCon t=\{t\} familyMembers=\{familyMembers\} \/>/);
  assert.match(doc('src/components/Guardian.tsx'), /<TraLoiHoiCon /);
});
