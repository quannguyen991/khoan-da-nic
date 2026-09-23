'use strict';
/**
 * "CHƯA TẢI ĐƯỢC" KHÁC "CHƯA NỐI" (§4.3) — lỗi đo được 23/9/2026 trên trình duyệt.
 *
 * Máy chủ trả 429 cho `/api/proof/ghep` (ngăn `doc` 30 lượt/phút THEO IP, hai máy
 * trong một nhà đi chung IP). Màn Guardian nuốt lỗi nhưng trạng thái ban đầu là
 * "không có máy" ⇒ vẽ "Chưa nối máy nào", băng "chế độ xem thử" và ô mời nối lại.
 *
 * Hai nửa của bản sửa, hai test:
 *  1. Máy chủ: đọc của gia đình đếm THEO TÀI KHOẢN (sau `canPhien`) — cạn ngăn IP
 *     không kéo theo gia đình (§6.10), nhưng một token vẫn có trần.
 *  2. Giao diện: tải hỏng nói "chưa tải được", KHÔNG mời nối lại, và tự thử lại.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

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

test('máy chủ: cạn ngăn `doc` theo IP KHÔNG kéo theo đường đọc của gia đình; nhưng một tài khoản vẫn có trần', async () => {
  const { sv, goi } = await moMayChu();
  try {
    const so = `098${String(Date.now()).slice(-7)}`;
    const tk = (await goi('POST', '/api/tai-khoan/dang-ky', { soDienThoai: so, matKhau: 'mat-khau-con', ten: 'Minh thử' })).j.token;

    // Bơm cạn ngăn `doc` của IP này bằng một đường đọc công khai.
    let can = false;
    for (let i = 0; i < 80 && !can; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      if ((await goi('GET', '/api/tin-lua-dao')).s === 429) can = true;
    }
    assert.ok(can, 'không bơm cạn được ngăn doc — test chưa đo được gì');

    // Cùng IP, nhưng đường của gia đình vẫn trả lời.
    for (const duong of ['/api/proof/ghep', '/api/gia-dinh/quy-tac-bao', '/api/gia-dinh/nhip-bao-ve/bo-me', '/api/chia-khoa/dang-cho', '/api/tai-khoan/toi']) {
      // eslint-disable-next-line no-await-in-loop
      const r = await goi('GET', duong, null, tk);
      assert.notStrictEqual(r.s, 429, `${duong} bị ngăn IP chặn — §6.10`);
    }

    // Trần theo tài khoản vẫn còn: một token gọi dồn quá trần thì bị chặn.
    let bi429 = false;
    for (let i = 0; i < 200 && !bi429; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      if ((await goi('GET', '/api/proof/ghep', null, tk)).s === 429) bi429 = true;
    }
    assert.ok(bi429, 'đường của gia đình phải có trần theo tài khoản');
  } finally { sv.close(); }
});

test('máy chủ: bộ đếm theo tài khoản đứng SAU canPhien ở mọi đường đọc của gia đình', () => {
  const S = fs.readFileSync(path.join(__dirname, '..', 'backend', 'server.js'), 'utf8');
  for (const duong of [
    '/api/tai-khoan/toi', '/api/proof/ghep', '/api/gia-dinh/nhip-bao-ve/bo-me', '/api/gia-dinh/quy-tac-bao',
    '/api/gia-dinh/tinh-trang-bao', '/api/gia-dinh/su-kien/:id', '/api/gia-dinh/chia-khoa',
    '/api/chia-khoa/dang-cho', '/api/chia-khoa/yeu-cau/:id/tuy-chon', '/api/proof/yeu-cau/:yeuCauId',
  ]) {
    assert.ok(S.includes(`app.get('${duong}', canPhien, chanGiaDinh,`), `${duong}: phải là canPhien rồi mới chanGiaDinh`);
  }
});

test('giao diện: tải hỏng nói "chưa tải được", không mời nối lại, không bật "xem thử", và tự thử lại', () => {
  const G = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Guardian.tsx'), 'utf8');
  assert.match(G, /useState<'dang_tai' \| 'loi' \| 'xong'>\(coPhien \? 'dang_tai' : 'xong'\)/);
  // Lỗi tải ⇒ trạng thái 'loi' và hẹn thử lại, giãn dần.
  const i = G.indexOf('const tai = () => {');
  const khoi = G.slice(i, i + 700);
  assert.match(khoi, /setTaiGhep\('loi'\);/);
  assert.match(khoi, /hen = window\.setTimeout\(tai, Math\.min\(60_000, 15_000 \* lan\)\);/);
  // "Chưa nối" CHỈ khi đã tải xong.
  assert.match(G, /taiGhep === 'xong' \? tr\("Chưa nối"\)/);
  assert.match(G, /taiGhep === 'xong' \? tr\('Chưa nối máy nào'\)/);
  // Băng "xem thử" và ô nối bằng mã: chỉ khi đã tải xong mà chưa nối thật.
  assert.ok(G.includes("{!laThat && taiGhep === 'xong' && (\n      <div"), 'băng xem thử phải chờ tải xong');
  assert.ok(G.includes("{!laThat && taiGhep === 'xong' && (\n        <form onSubmit={noiBangMa}"), 'ô nối bằng mã phải chờ tải xong');
  assert.match(G, /tr\('Chưa tải được trạng thái nối với máy bố mẹ — đang thử lại\.'\)/);
  const i18n = fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n.ts'), 'utf8');
  for (const k of ['Chưa tải được trạng thái nối với máy bố mẹ — đang thử lại.', 'Chưa tải được', 'Đang tải…']) {
    assert.ok(i18n.split(JSON.stringify(k) + ':').length - 1 >= 2, `thiếu catalog: ${k}`);
  }
});
