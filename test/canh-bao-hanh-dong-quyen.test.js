'use strict';
/**
 * 27/11/2026 — POST /api/detect/canh-bao/:id/:hanhDong.
 * Hành động phía con cháu (`goi`, `ket-qua`) phải có phiên và đúng quyền như
 * route GET; hành động phía bác (`toi-on`, `bac-goi`, `mo`) vẫn chạy khi chưa
 * đăng nhập.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');
const KP = require('../backend/src/khoan-proof');
const TC = require('../backend/src/trusted-circle');

test('báo nhầm / bấm gọi: chưa đăng nhập 401, người lạ 404, chủ tài khoản ghi được; phía bác vẫn mở', async () => {
  const sv = app.listen(0);
  await new Promise((r) => sv.once('listening', r));
  const goc = `http://127.0.0.1:${sv.address().port}`;
  const goi = async (duong, body, token) => {
    const r = await fetch(goc + duong, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body || {}),
    });
    return { s: r.status, j: await r.json().catch(() => null) };
  };
  try {
    const hauTo = String(Date.now()).slice(-6);
    const chu = await KP.capPhien(`tk_bo_me_quyen_${hauTo}`);
    const la = await KP.capPhien(`tk_nguoi_la_${hauTo}`);

    let vt = TC.taoVongTron(`tk_bo_me_quyen_${hauTo}`);
    vt = TC.themThanhVien(vt, { id: `tk_con_quyen_${hauTo}`, vaiTro: 'nguoi_than_tin_cay', boiAi: `tk_bo_me_quyen_${hauTo}` });
    vt = TC.datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: `tk_con_quyen_${hauTo}` }, `tk_bo_me_quyen_${hauTo}`);
    const cb = await goi('/api/detect/canh-bao', {
      ketQua: { nhan: 'CAO', canThiep: 'PAUSE_60S', maLyDo: ['FIN_SAFE_ACCOUNT'], maGiaiThich: 'R1' },
      vongTron: vt,
      tenNguoiThan: 'Con',
    }, chu.token);
    assert.equal(cb.s, 200);
    const id = cb.j.canhBaoId;
    assert.ok(id);

    for (const hd of ['ket-qua', 'goi']) {
      const body = hd === 'ket-qua' ? { ketQua: 'bao_nham', boi: 'nguoi_than' } : {};
      assert.equal((await goi(`/api/detect/canh-bao/${id}/${hd}`, body)).s, 401, `${hd} không phiên`);
      assert.equal((await goi(`/api/detect/canh-bao/${id}/${hd}`, body, la.token)).s, 404, `${hd} người lạ`);
    }

    const kq = await goi(`/api/detect/canh-bao/${id}/ket-qua`, { ketQua: 'bao_nham', boi: 'nguoi_than' }, chu.token);
    assert.equal(kq.s, 200);

    // Phía bác: không cần đăng nhập.
    assert.equal((await goi(`/api/detect/canh-bao/${id}/toi-on`)).s, 200);
    assert.equal((await goi(`/api/detect/canh-bao/${id}/bac-goi`)).s, 200);
  } finally {
    sv.close();
  }
});
