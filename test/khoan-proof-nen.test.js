'use strict';
/**
 * KHOAN PROOF — PHẦN NỀN: đăng ký passkey và ghép cặp thiết bị.
 *
 * Khi có tin "mẹ ơi con đổi số, chuyển cho con 20 triệu", bác bấm "Xác minh yêu
 * cầu này". Tài khoản người con đã ghép cặp nhận đúng nội dung yêu cầu, xác nhận
 * hoặc từ chối bằng passkey. Tệp này chỉ đo phần ĐĂNG KÝ và GHÉP CẶP.
 *
 * ⚠️ CHỮ KÝ GIẢ LẬP LÀ THỨ TỆ NHẤT CÓ THỂ ĐƯA VÀO SẢN PHẨM NÀY. Nếu WebAuthn
 * không dùng được thì phải BÁO, không phải giả vờ. Nên test ở đây đi qua
 * @simplewebauthn/server thật — không mock lớp xác minh.
 */

const test = require('node:test');
const assert = require('node:assert');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../server');
const { KHONG_CAN_DANG_NHAP, KHONG_CAN_DANG_NHAP_TIEN_TO, canDangNhap } = require('../src/auth');
const P = require('../src/khoan-proof');
const { taoMayXacThuc } = require('./helper/may-xac-thuc-gia');

let server;
let goc;
let PHIEN_BAC;
let PHIEN_CON;

const goi = async (duong, body, headers = {}) => {
  const res = await fetch(goc + duong, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body || {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

/**
 * ⚠️ PHIÊN LÀ TOKEN DO MÁY CHỦ CẤP, KHÔNG PHẢI DANH TÍNH TỰ KHAI.
 *
 * Bài học vừa rút ở test/co-xac-minh-khong-tu-khai.test.js: thứ gì người gọi tự
 * khai được thì kẻ lừa đảo cũng khai được. Nên test này KHÔNG gửi header kiểu
 * `x-tai-khoan: con-minh` — nó xin token qua đường demo (chỉ mở khi có biến môi
 * trường) rồi dùng `authorization: Bearer`.
 */
const xinPhien = async (taiKhoanId) => {
  const { body } = await goi('/api/proof/phien-demo', { taiKhoanId });
  assert.ok(body?.token, `không lấy được phiên cho ${taiKhoanId}: ${JSON.stringify(body)}`);
  return { authorization: `Bearer ${body.token}` };
};

test.before(async () => {
  process.env.KHOAN_DA_PHIEN_DEMO = '1';
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
  PHIEN_BAC = await xinPhien('bac-01');
  PHIEN_CON = await xinPhien('con-minh');
});

test.after(() => {
  server?.close();
  delete process.env.KHOAN_DA_PHIEN_DEMO;
});

// ─────────────────── Ràng buộc cấu hình ───────────────────

test('WebAuthn cấu hình cho localhost — demo chạy hai tab một máy', () => {
  assert.strictEqual(P.CAU_HINH.rpID, 'localhost');
  assert.strictEqual(P.CAU_HINH.origin, 'http://localhost:8089');
  // userVerification bắt buộc, để có sinh trắc học chứ không chỉ "có thiết bị".
  assert.strictEqual(P.CAU_HINH.userVerification, 'required');
});

test('§5.3 — /api/proof/* ĐÒI đăng nhập, /api/analyze thì KHÔNG', () => {
  assert.strictEqual(canDangNhap('/api/proof/dang-ky/bat-dau'), true);
  assert.strictEqual(canDangNhap('/api/proof/ghep/xac-nhan'), true);
  // Và danh sách miễn đăng nhập KHÔNG được ngắn đi.
  assert.ok(KHONG_CAN_DANG_NHAP.includes('/api/analyze'));
  assert.ok(KHONG_CAN_DANG_NHAP.includes('/api/phan-tich'));
  assert.ok(!KHONG_CAN_DANG_NHAP.some((d) => d.startsWith('/api/proof')));
  assert.ok(!KHONG_CAN_DANG_NHAP_TIEN_TO.some((d) => d.startsWith('/api/proof')));
});

test('§12 — Khoan Proof là TUỲ CHỌN, không bật đồng bộ máy chủ mặc định', () => {
  assert.strictEqual(P.MAC_DINH_BAT, false);
});

// ─────────────────── Đăng ký passkey ───────────────────

test('chưa đăng nhập ⇒ mọi endpoint proof trả 401', async () => {
  for (const d of ['/api/proof/dang-ky/bat-dau', '/api/proof/dang-ky/xac-nhan',
    '/api/proof/ghep/bat-dau', '/api/proof/ghep/xac-nhan', '/api/proof/thu-hoi']) {
    const { status } = await goi(d, {});
    assert.strictEqual(status, 401, `${d} không chặn khách chưa đăng nhập`);
  }
});

test('dang-ky/bat-dau trả tuỳ chọn WebAuthn hợp lệ', async () => {
  const { status, body } = await goi('/api/proof/dang-ky/bat-dau', {}, PHIEN_BAC);
  assert.strictEqual(status, 200);
  assert.ok(typeof body.challenge === 'string' && body.challenge.length >= 16);
  assert.strictEqual(body.rp.id, 'localhost');
  assert.strictEqual(body.authenticatorSelection.userVerification, 'required');
  assert.ok(Array.isArray(body.pubKeyCredParams) && body.pubKeyCredParams.length > 0);
});

test('challenge KHÁC NHAU mỗi lượt — dùng lại là phát lại được', async () => {
  const a = await goi('/api/proof/dang-ky/bat-dau', {}, PHIEN_BAC);
  const b = await goi('/api/proof/dang-ky/bat-dau', {}, PHIEN_BAC);
  assert.notStrictEqual(a.body.challenge, b.body.challenge);
});

test('dang-ky/xac-nhan từ chối phản hồi rác — KHÔNG lưu credential giả', async () => {
  await goi('/api/proof/dang-ky/bat-dau', {}, PHIEN_BAC);
  const { status, body } = await goi('/api/proof/dang-ky/xac-nhan',
    { phanHoi: { id: 'rac', rawId: 'rac', response: {}, type: 'public-key' } }, PHIEN_BAC);
  assert.notStrictEqual(status, 200);
  assert.ok(body.maLoi, 'không có mã lỗi thì tầng trên không chẩn đoán được');
});

test('xac-nhan mà chưa bat-dau ⇒ từ chối, không có challenge nào để ràng', async () => {
  const phien = await xinPhien('nguoi-la-chua-bat-dau');
  const { status } = await goi('/api/proof/dang-ky/xac-nhan',
    { phanHoi: { id: 'x', rawId: 'x', response: {}, type: 'public-key' } }, phien);
  assert.notStrictEqual(status, 200);
});

test('token rác / token của người khác không mở được endpoint proof', async () => {
  for (const h of [{ authorization: 'Bearer rac' }, { authorization: 'khong-phai-bearer' },
    { 'x-khoan-da-tai-khoan': 'con-minh' }]) {
    const { status } = await goi('/api/proof/ghep/bat-dau', {}, h);
    assert.strictEqual(status, 401, `mở được bằng ${JSON.stringify(h)}`);
  }
});

test('đường phiên demo ĐÓNG khi không có biến môi trường', async () => {
  delete process.env.KHOAN_DA_PHIEN_DEMO;
  const { status } = await goi('/api/proof/phien-demo', { taiKhoanId: 'ke-la' });
  process.env.KHOAN_DA_PHIEN_DEMO = '1';
  assert.notStrictEqual(status, 200, 'đường demo mở ở cấu hình mặc định — đó là cửa sau');
});

/**
 * ⚠️ CA QUAN TRỌNG NHẤT TỆP NÀY.
 *
 * Các ca trên chỉ ném RÁC vào rồi thấy 400. Nhưng một hàm `verify()` luôn ném
 * lỗi trông y hệt một hàm `verify()` chặt chẽ — ném rác không phân biệt được hai
 * thứ đó. Cùng họ lỗi với §4.3: "không kiểm được" ≠ "đã kiểm, không thấy gì".
 *
 * Nên ở đây dùng một máy xác thực dựng bằng WebCrypto, ký bằng ECDSA P-256 THẬT,
 * và đòi máy chủ CHẤP NHẬN. Thứ được thay thế là phần cứng, không phải phép toán.
 */
test('đường xác minh CHẤP NHẬN chữ ký ES256 đúng — không phải từ chối tất cả', async () => {
  const may = await taoMayXacThuc(P.CAU_HINH);
  const tuyChon = await P.batDauDangKy('bac-that');
  const kq = await P.xacNhanDangKy('bac-that', may.dangKy(tuyChon.challenge));
  assert.strictEqual(kq.daDangKy, true);
});

test('chữ ký đúng nhưng CHALLENGE khác ⇒ từ chối', async () => {
  const may = await taoMayXacThuc(P.CAU_HINH);
  await P.batDauDangKy('bac-lech-thach-do');
  await assert.rejects(
    () => P.xacNhanDangKy('bac-lech-thach-do', may.dangKy('thach-do-khac-hoan-toan')),
    (e) => e.ma === 'CHUNG_THU_KHONG_HOP_LE',
  );
});

/**
 * ⚠️ LỖ ĐÃ ĐO ĐƯỢC 15/8/2026 — SẼ NỔ ĐÚNG LÚC DEMO NẾU KHÔNG CÓ TEST NÀY.
 *
 * Frontend chạy ở `localhost:3000` (Vite) và gọi backend qua proxy. Trình duyệt
 * báo origin là `http://localhost:3000`, còn máy chủ chỉ chờ `:8089` — nên MỌI
 * chữ ký đều bị từ chối, kèm thông báo trông y hệt "người dùng bấm sai".
 */
test('cổng DEV của frontend cũng là origin hợp lệ', async () => {
  assert.ok(P.CAU_HINH.origins.includes('http://localhost:3000'),
    'thiếu origin của Vite — chữ ký từ frontend sẽ bị từ chối hết');

  const may = await taoMayXacThuc({ rpID: 'localhost', origin: 'http://localhost:3000' });
  const tuyChon = await P.batDauDangKy('bac-cong-dev');
  const kq = await P.xacNhanDangKy('bac-cong-dev', may.dangKy(tuyChon.challenge));
  assert.strictEqual(kq.daDangKy, true);
});

test('origin lạ VẪN bị từ chối — nới cổng dev không nới cả thế giới', async () => {
  const may = await taoMayXacThuc({ rpID: 'localhost', origin: 'http://localhost:9999' });
  const tuyChon = await P.batDauDangKy('bac-cong-la');
  await assert.rejects(
    () => P.xacNhanDangKy('bac-cong-la', may.dangKy(tuyChon.challenge)),
    (e) => e.ma === 'CHUNG_THU_KHONG_HOP_LE',
  );
});

test('chữ ký đúng nhưng ORIGIN khác ⇒ từ chối', async () => {
  const may = await taoMayXacThuc({ rpID: 'localhost', origin: 'http://ke-lua-dao.invalid' });
  const tuyChon = await P.batDauDangKy('bac-lech-origin');
  await assert.rejects(
    () => P.xacNhanDangKy('bac-lech-origin', may.dangKy(tuyChon.challenge)),
    (e) => e.ma === 'CHUNG_THU_KHONG_HOP_LE',
  );
});

test('thách đố DÙNG MỘT LẦN — phát lại cùng phản hồi thì hỏng', async () => {
  const may = await taoMayXacThuc(P.CAU_HINH);
  const tuyChon = await P.batDauDangKy('bac-phat-lai');
  const phanHoi = may.dangKy(tuyChon.challenge);

  assert.strictEqual((await P.xacNhanDangKy('bac-phat-lai', phanHoi)).daDangKy, true);
  await assert.rejects(
    () => P.xacNhanDangKy('bac-phat-lai', phanHoi),
    (e) => e.ma === 'CHUA_BAT_DAU_DANG_KY',
  );
});

test('§6.9 — máy chủ KHÔNG có khoá riêng để mà lộ', async () => {
  const may = await taoMayXacThuc(P.CAU_HINH);
  const tuyChon = await P.batDauDangKy('bac-kiem-kho');
  await P.xacNhanDangKy('bac-kiem-kho', may.dangKy(tuyChon.challenge));

  const chuoi = JSON.stringify(await P.docTatCaBanGhi());
  for (const cam of ['privateKey', '"d"', 'BEGIN PRIVATE']) {
    assert.ok(!chuoi.includes(cam), `kho chứa ${cam}`);
  }
});

test('máy xác thực dựng cho test KHÔNG được rò vào sản phẩm', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const goc = path.join(__dirname, '..');
  const quet = (thuMuc) => {
    for (const ten of fs.readdirSync(thuMuc)) {
      const d = path.join(thuMuc, ten);
      if (fs.statSync(d).isDirectory()) { quet(d); continue; }
      if (!ten.endsWith('.js')) continue;
      assert.ok(!fs.readFileSync(d, 'utf8').includes('may-xac-thuc-gia'),
        `${d} require máy xác thực của test`);
    }
  };
  quet(path.join(goc, 'src'));
  assert.ok(!fs.readFileSync(path.join(goc, 'server.js'), 'utf8').includes('may-xac-thuc-gia'));
});

// ─────────────────── Ghép cặp ───────────────────

test('§9.8 — mã ghép do CHỦ TÀI KHOẢN sinh, 6 số, hạn 10 phút, dùng một lần', async () => {
  const { status, body } = await goi('/api/proof/ghep/bat-dau', {}, PHIEN_BAC);
  assert.strictEqual(status, 200);
  assert.match(body.ma, /^\d{6}$/);
  assert.ok(body.hetHanSauGiay > 0 && body.hetHanSauGiay <= 600);
});

test('mã ghép sai ⇒ từ chối', async () => {
  await goi('/api/proof/ghep/bat-dau', {}, PHIEN_BAC);
  const { status } = await goi('/api/proof/ghep/xac-nhan', { ma: '000000' }, PHIEN_CON);
  assert.notStrictEqual(status, 200);
});

test('mã ghép đúng ⇒ ghép được, và DÙNG LẠI thì hỏng', async () => {
  const { body: sinh } = await goi('/api/proof/ghep/bat-dau', {}, PHIEN_BAC);
  const lan1 = await goi('/api/proof/ghep/xac-nhan', { ma: sinh.ma }, PHIEN_CON);
  assert.strictEqual(lan1.status, 200, JSON.stringify(lan1.body));

  const lan2 = await goi('/api/proof/ghep/xac-nhan', { ma: sinh.ma }, PHIEN_CON);
  assert.notStrictEqual(lan2.status, 200, 'mã ghép dùng lại được — phát lại được');
});

test('§9.8 — chủ tài khoản THU HỒI bất cứ lúc nào, KHÔNG cần người con đồng ý', async () => {
  const { body: sinh } = await goi('/api/proof/ghep/bat-dau', {}, PHIEN_BAC);
  await goi('/api/proof/ghep/xac-nhan', { ma: sinh.ma }, PHIEN_CON);

  const thu = await goi('/api/proof/thu-hoi', { thanhVienId: 'con-minh' }, PHIEN_BAC);
  assert.strictEqual(thu.status, 200, JSON.stringify(thu.body));
  assert.strictEqual(thu.body.daThuHoi, true);
});

test('người con KHÔNG thu hồi được quyền của người khác', async () => {
  const thu = await goi('/api/proof/thu-hoi', { thanhVienId: 'bac-01' }, PHIEN_CON);
  assert.notStrictEqual(thu.status, 200);
});

// ─────────────────── §6.9 · TRUONG_CAM ───────────────────

test('§6.9 — không ghi khoá riêng, mã ghép, hay trường cấm vào kho', async () => {
  const { kiemTruongCam } = require('../src/vault-store');
  const { body: sinh } = await goi('/api/proof/ghep/bat-dau', {}, PHIEN_BAC);
  await goi('/api/proof/ghep/xac-nhan', { ma: sinh.ma }, PHIEN_CON);

  for (const ban of await P.docTatCaBanGhi()) {
    assert.strictEqual(kiemTruongCam(ban), null, `bản ghi chứa trường cấm: ${JSON.stringify(ban)}`);
    const chuoi = JSON.stringify(ban);
    assert.ok(!chuoi.includes('privateKey'), 'lưu khoá riêng — passkey không có khoá riêng ở máy chủ');
    assert.ok(!/"ma"\s*:\s*"\d{6}"/.test(chuoi), 'lưu mã ghép dạng thô');
  }
});

test('§6.9 — phản hồi KHÔNG rò khoá công khai hay counter ra ngoài', async () => {
  const { body } = await goi('/api/proof/ghep/bat-dau', {}, PHIEN_BAC);
  const chuoi = JSON.stringify(body);
  for (const cam of ['publicKey', 'credentialID', 'counter']) {
    assert.ok(!chuoi.includes(cam), `phản hồi rò ${cam}`);
  }
});

// ─────────────────── Ranh giới với đường phân tích ───────────────────

/**
 * ⚠️ LỖI CÓ THẬT, TÌM RA 15/8/2026 — GHI LẠI ĐỂ KHÔNG QUAY LẠI.
 *
 * Mọi route từng dùng CHUNG một bộ đếm tần suất 30 lượt/phút. Một lượt ghép cặp
 * Khoan Proof tốn 7–8 lượt gọi, nên chỉ vài lượt thử là `/api/analyze` trả 429.
 * Tức là tính năng phụ chặn được đường phân tích — đúng thứ §6.10 nói KHÔNG.
 *
 * Test này bơm cho cạn ngăn `proof` rồi đòi ngăn `phan_tich` còn nguyên.
 */
test('§6.10 — hoạt động Khoan Proof KHÔNG được ăn ngân sách của /api/analyze', async () => {
  // Bơm cho CẠN ngăn `proof`. Không dùng xinPhien() vì chính nó cũng tiêu ngăn
  // này — và nếu ngăn đã cạn từ các ca trước thì vòng lặp dưới đây kết thúc ngay.
  let canRoi = null;
  for (let i = 0; i < 60 && !canRoi; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const r = await goi('/api/proof/ghep/bat-dau', {}, { authorization: 'Bearer rac' });
    if (r.status === 429) canRoi = r;
  }
  assert.ok(canRoi, 'không bơm cạn được ngăn proof — test chưa đo được gì');

  const { status } = await goi('/api/analyze', { vanBan: 'Bác chuyển tiền gấp giúp cháu nhé.' });
  assert.strictEqual(status, 200, 'ngăn proof cạn đã kéo theo /api/analyze');
});

test('§5.3 — /api/analyze VẪN chạy khi chưa đăng nhập, chưa ghép cặp', async () => {
  const { status, body } = await goi('/api/analyze',
    { vanBan: 'Mẹ ơi con đổi số, mẹ chuyển tiền gấp cho con nhé.' });
  assert.strictEqual(status, 200);
  assert.ok(['CAO', 'NGHI_NGO', 'CHUA_THAY'].includes(body.nhan));
});

test('§4.2 — Khoan Proof KHÔNG được đụng vào đường phân tích', () => {
  const nguon = require('node:fs').readFileSync(require.resolve('../src/khoan-proof'), 'utf8');
  for (const cam of ['decision-engine', 'signal-registry', 'directPrecheck', 'quyetDinh']) {
    assert.ok(!nguon.includes(cam), `khoan-proof.js chạm vào ${cam}`);
  }
});
