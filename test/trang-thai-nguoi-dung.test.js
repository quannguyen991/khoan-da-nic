'use strict';
/**
 * VIỆC #2 — TRẠNG THÁI NGƯỜI DÙNG TỰ KHAI ("đã chuyển tiền / đọc mã").
 *
 * Trước 22/9/2026 nhánh RECOVERY của thang can thiệp không chạy tới được qua
 * API: nó cần `caseContext.outcome === 'money_lost'` mà không route nào truyền
 * vào. Bộ ca này đo QUA HTTP (§5.2), không chỉ gọi hàm.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

let server;
let goc;
test.before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server?.close());

const goi = async (duong, body) => {
  const res = await fetch(goc + duong, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const BAC_KE_LAI = 'Tôi lỡ chuyển 5 triệu cho một người lạ qua điện thoại rồi.';
const TIN_LUA_NANG = 'Tôi là công an, bác chuyển tiền sang tài khoản an toàn ngay và đọc mã OTP cho tôi.';
const DUONG = ['/api/analyze', '/api/analyze/so-bo'];

for (const duong of DUONG) {
  test(`${duong} — bác khai đã chuyển ⇒ bộ luật chọn RECOVERY`, async () => {
    const khongKhai = await goi(duong, { vanBan: BAC_KE_LAI });
    const coKhai = await goi(duong, { vanBan: BAC_KE_LAI, trangThaiNguoiDung: 'da_chuyen_hoac_doc_ma' });
    assert.strictEqual(coKhai.status, 200);
    assert.strictEqual(coKhai.body.canThiep, 'RECOVERY',
      `khai đã chuyển mà ra ${coKhai.body.canThiep} — người vừa mất tiền phải được đưa sang luồng phục hồi`);
    assert.notStrictEqual(khongKhai.body.canThiep, 'RECOVERY', 'chưa khai gì mà đã ra RECOVERY');
  });

  test(`${duong} — override VẪN thắng RECOVERY (đang bị tấn công gấp hơn đã mất)`, async () => {
    const r = await goi(duong, { vanBan: TIN_LUA_NANG, trangThaiNguoiDung: 'da_chuyen_hoac_doc_ma' });
    assert.strictEqual(r.body.canThiep, 'PROTECTED_CRITICAL',
      'thứ tự override → RECOVERY là có chủ ý: người vừa mất tiền là mục tiêu số một của kẻ hứa lấy lại tiền');
  });

  test(`${duong} — §4.2: khai trạng thái KHÔNG BAO GIỜ hạ nhãn`, async () => {
    const BAC = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
    /*
     * ⚠️ BA MẪU, KHÔNG PHẢI BỐN. Cả hai đường dùng CHUNG ngăn đếm `phan_tich` của
     * bộ giới hạn tần suất (30 lượt mỗi cửa sổ). Bốn mẫu × 2 đường cộng các ca
     * khác ra đúng 31 lượt — lượt cuối nhận 429 và ca hợp đồng đỏ vì `maLoi`,
     * trông như hợp đồng bị đổi trong khi thật ra là bộ đếm. Đừng nới bộ giới
     * hạn cho vừa test: nó là để kiểm soát chi phí thật.
     */
    for (const vanBan of [BAC_KE_LAI, TIN_LUA_NANG, 'Mai con qua đón mẹ nhé.']) {
      const a = await goi(duong, { vanBan });
      const b = await goi(duong, { vanBan, trangThaiNguoiDung: 'da_chuyen_hoac_doc_ma' });
      assert.ok(BAC[b.body.nhan] >= BAC[a.body.nhan],
        `"${vanBan}": ${a.body.nhan} → ${b.body.nhan}. Một trường tự khai hạ được nhãn là câu thần chú §12 tặng kẻ lừa.`);
    }
  });
}

/*
 * Chủ dự án chốt 22/9/2026: bác tự khai đã mất tiền thì nhãn là CAO — một SÀN
 * trong pipeline, không phải override thứ 11 (§12 khoá số override ở 10).
 */
test('bác khai đã lỡ chuyển ⇒ nhãn CAO, kể cả khi tin nhắn không có dấu hiệu nào', async () => {
  const truoc = await goi('/api/analyze', { vanBan: BAC_KE_LAI });
  const sau = await goi('/api/analyze', { vanBan: BAC_KE_LAI, trangThaiNguoiDung: 'da_chuyen_hoac_doc_ma' });
  assert.strictEqual(truoc.body.nhan, 'CHUA_THAY', 'mốc so sánh đã đổi — lời kể thuần phải ra CHUA_THAY khi chưa khai');
  assert.strictEqual(sau.body.nhan, 'CAO',
    'người vừa mất tiền đọc "Chưa thấy dấu hiệu rủi ro" như một lời trấn an, ngay lúc từng phút gọi ngân hàng đều quý');
});

test('sàn tự khai không phải override thứ 11 — số override vẫn là 10', () => {
  const { CRITICAL_OVERRIDES } = require('../backend/src/analysis/critical-overrides');
  assert.strictEqual(CRITICAL_OVERRIDES.length, 10, '§12 khoá số critical override ở 10');
});

test('chỉ nhận ĐÚNG một giá trị — mọi thứ khác bị bỏ, không lọt caseContext thô', async () => {
  const goc0 = await goi('/api/analyze', { vanBan: BAC_KE_LAI });
  for (const rac of ['money_lost', 'recovery', { outcome: 'money_lost' }, true, 1, 'DA_CHUYEN']) {
    const r = await goi('/api/analyze', { vanBan: BAC_KE_LAI, trangThaiNguoiDung: rac });
    assert.strictEqual(r.body.canThiep, goc0.body.canThiep,
      `giá trị lạ ${JSON.stringify(rac)} vẫn đổi được màn — máy chủ phải nhận đúng một mã`);
  }
  const r = await goi('/api/analyze', { vanBan: BAC_KE_LAI, caseContext: { outcome: 'money_lost' } });
  assert.strictEqual(r.body.canThiep, goc0.body.canThiep, 'caseContext thô từ thân yêu cầu lọt được vào phân tích');
});

test('hợp đồng §HĐ không đổi: vẫn đúng bảy trường trả về', async () => {
  const r = await goi('/api/analyze', { vanBan: BAC_KE_LAI, trangThaiNguoiDung: 'da_chuyen_hoac_doc_ma' });
  assert.deepStrictEqual(Object.keys(r.body).sort(),
    ['aiDaChay', 'canThiep', 'chuaKiem', 'daKiem', 'hoKichBan', 'maLyDo', 'nhan']);
});
