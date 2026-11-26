'use strict';
/**
 * KIỂM ĐỊNH KIẾN TRÚC NÂNG CẤP TOÀN HỆ THỐNG:
 * 1. Hợp nhất `url-analyzer.js` + `vietqr-analyzer.js` vào `pipeline.js` qua HTTP `/api/analyze`.
 * 2. Bền vững hóa `khoCanhBao` xuống `vault-store` (chống đoán ID, không lưu `noiDung`, cô lập báo cáo tuần).
 * 3. Nối Push thật (`push-hai-phia.js`) cho `/api/detect/canh-bao` khi thiết bị người thân đã đăng ký.
 * 4. Fuzz-test 3.000 biến thể ngôn ngữ trong RAM (không làm phồng `eval/dataset/`).
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');
const { analyze } = require('../backend/src/analysis/pipeline');
const { taoKhoCanhBao, phatCanhBao } = require('../backend/src/canh-bao-hai-phia');
const { moKho } = require('../backend/src/vault-store');
const KP = require('../backend/src/khoan-proof');
const BDG = require('../backend/src/bao-dong-gia-dinh');
const TC = require('../backend/src/trusted-circle');
const { taoBoBienTheFuzz3000 } = require('../scripts/tao-bo-mau-3000');
const { khuPiiVanBan, kiemDinhBanGhiMauThat, chuanHoaDongMauThat } = require('../scripts/khu-pii-mau-that');

let server;
let goc;

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  app.set('guiPushThay', undefined);
  server?.close();
});

async function goiJson(duong, body, headers = {}) {
  const res = await fetch(`${goc}${duong}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, body: await res.json() };
}

describe('1. Lõi Phân tích Hợp nhất (`/api/analyze` bắt URL trần, IP trần, Levenshtein, link lồng & VietQR)', () => {
  it('bắt tên miền trần nhái chính tả Levenshtein (`vietconbank.com.vn`) không cần `http://`', async () => {
    const { status, body } = await goiJson('/api/analyze', {
      vanBan: 'Tài khoản sắp khóa, quý khách truy cập vietconbank.com.vn/xac-minh nhập mật khẩu ngay.',
    });
    assert.equal(status, 200);
    assert.ok(body.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'));
    assert.ok(body.daKiem.includes('url'));
    assert.equal(body.nhan, 'CAO');
  });

  it('bắt địa chỉ IP trần có đường dẫn và link lồng trong tham số redirect', async () => {
    const ipRes = await goiJson('/api/analyze', {
      vanBan: 'Đăng nhập xác minh tài khoản tại 103.145.88.21/nganhang trong 15 phút.',
    });
    assert.ok(ipRes.body.maLyDo.includes('WEB_PUNYCODE_IP_LITERAL'));

    const redirectRes = await goiJson('/api/analyze', {
      vanBan: 'Bấm https://trang-tin.vn/go?url=https%3A%2F%2Fvneid-capnhat.top%2Fapp.apk để cập nhật.',
    });
    assert.ok(redirectRes.body.maLyDo.includes('WEB_NONOFFICIAL_APP_SOURCE'));

    // Bắt tên miền nhái thương hiệu ghép dấu gạch nối (`paypa1-security.top`) và động từ `nạp trước`
    const hyphenTypo = await goiJson('/api/analyze', {
      vanBan: 'Security Alert: Log in at paypa1-security.top and enter your password and 6-digit OTP code within 15 minutes.',
    });
    assert.equal(hyphenTypo.body.nhan, 'CAO');
    assert.ok(hyphenTypo.body.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'));

    const napTruoc = await goiJson('/api/analyze', {
      vanBan: 'Tuyển cộng tác viên chốt đơn tại nhà. Chị nạp trước 1.200.000đ làm nhiệm vụ đầu tiên sẽ được hoàn gốc ngay.',
    });
    assert.equal(napTruoc.body.nhan, 'CAO');
    assert.ok(napTruoc.body.maLyDo.includes('FIN_TRANSFER_REQUEST'));

    // Bắt URL đã làm mờ (`hxxps://dichvucong[.]cc/vn`) từ tin báo chí / threat intel
    const defanged = await goiJson('/api/analyze', {
      vanBan: 'Thong bao: Quy khach con khoan phat giao thong chua thanh toan. Truy cap hxxps://dichvucong[.]cc/vn de kiem tra.',
    });
    assert.ok(defanged.body.maLyDo.includes('WEB_BRAND_DOMAIN_MISMATCH'));
  });

  it('bắt chuỗi VietQR EMVCo gài nội dung "tạm giữ" và khai `khong_mo_duoc_link` khi sai CRC Tag 63', async () => {
    const qrSaiCrcVaTamGiu =
      '00020101021238570010A00000072701270006970436011300110012345675408150000005802VN62180814tam giu ho so 63040000';
    const { body } = await goiJson('/api/analyze', { vanBan: qrSaiCrcVaTamGiu });
    assert.equal(body.nhan, 'CAO');
    assert.ok(body.maLyDo.includes('FIN_SAFE_ACCOUNT'));
    assert.ok(body.maLyDo.includes('WEB_QR_TO_LOGIN_PAYMENT'));
    assert.ok(body.chuaKiem.includes('khong_mo_duoc_link'));
  });

  it('không bắt nhầm câu tiếng Anh gõ dính dấu chấm (`call me.in the morning`) thành URL', () => {
    const env = analyze({ vanBan: 'Hi Mom, please call me.in the morning when you wake up.' });
    assert.equal(env.nhan, 'CHUA_THAY');
    assert.ok(!env.daKiem.includes('url'));
  });
});

describe('2. Bền vững hóa `khoCanhBao`, Cô lập Báo cáo tuần & Cầu nối Push thật', () => {
  it('lưu bản ghi `khoCanhBao` xuống `vault-store` không dính TRUONG_CAM (`noiDung`) và khôi phục sau khởi động', async () => {
    const khoVault = await moKho({ env: {} });
    const kho1 = taoKhoCanhBao({ khoGoc: khoVault });

    let vt = TC.taoVongTron('tk_bo_me_1');
    vt = TC.themThanhVien(vt, { id: 'tk_con_1', vaiTro: 'nguoi_than_tin_cay', boiAi: 'tk_bo_me_1' });
    vt = TC.datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: 'tk_con_1' }, 'tk_bo_me_1');

    const ra = await phatCanhBao({
      kq: { nhan: 'CAO', canThiep: 'PAUSE_60S', diem: 55, maLyDo: ['FIN_SAFE_ACCOUNT'], maGiaiThich: 'R1' },
      vongTron: vt,
      kho: kho1,
      guiPush: async () => ({ endpointOk: true }),
      chiaSeNoiDung: true,
      noiDung: 'Nội dung nhạy cảm không được phép xuống đĩa',
    });

    assert.match(ra.canhBaoId, /^cb_[a-z0-9]+_[a-f0-9]{12}$/);
    await new Promise((r) => setTimeout(r, 20));

    const kho2 = taoKhoCanhBao();
    const soNap = await kho2.taiTuKho(khoVault);
    assert.equal(soNap, 1);
    const banPhucHoi = kho2.lay(ra.canhBaoId);
    assert.equal(banPhucHoi.nhan, 'CAO');
    assert.equal(banPhucHoi.chuTaiKhoanId, 'tk_bo_me_1');
    assert.equal(banPhucHoi.noiDung, null);
    await khoVault.dong();
  });

  it('POST /api/detect/canh-bao gửi Push thật qua `KP.khoChung()` và cô lập `/api/bao-cao-tuan` theo phiên', async () => {
    const khoChung = await KP.khoChung();
    const phienBoMe = await KP.capPhien('tk_bo_me_push');
    await BDG.dangKyNhan(
      khoChung,
      'tk_con_push',
      { endpoint: 'https://push.example.com/sub-con-1', keys: { p256dh: 'k_p256', auth: 'k_auth' } },
      'vi'
    );

    const prevVapidPub = process.env.VAPID_PUBLIC_KEY;
    const prevVapidPriv = process.env.VAPID_PRIVATE_KEY;
    const prevVapidSub = process.env.VAPID_SUBJECT;
    process.env.VAPID_PUBLIC_KEY = 'pub_test';
    process.env.VAPID_PRIVATE_KEY = 'priv_test';
    process.env.VAPID_SUBJECT = 'mailto:test@khoanda.vn';

    let daGoiPush = 0;
    app.set('guiPushThay', async () => {
      daGoiPush += 1;
      return { ok: true, status: 201 };
    });

    try {
      let vt = TC.taoVongTron('tk_bo_me_push');
      vt = TC.themThanhVien(vt, { id: 'tk_con_push', vaiTro: 'nguoi_than_tin_cay', boiAi: 'tk_bo_me_push' });
      vt = TC.datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: 'tk_con_push' }, 'tk_bo_me_push');

      const resCb = await goiJson(
        '/api/detect/canh-bao',
        {
          ketQua: { nhan: 'CAO', canThiep: 'PAUSE_60S', maLyDo: ['FIN_SAFE_ACCOUNT'], maGiaiThich: 'R1' },
          vongTron: vt,
          tenNguoiThan: 'Con gái',
        },
        { authorization: `Bearer ${phienBoMe.token}` }
      );

      assert.equal(resCb.status, 200);
      assert.equal(daGoiPush, 1);
      assert.equal(resCb.body.nguoiCaoTuoi.dong3, 'da_gui_canh_bao_cho_nguoi_than');

      // Người lạ không đăng nhập gọi `/api/bao-cao-tuan` KHÔNG thấy cảnh báo của `tk_bo_me_push`
      const bcKhach = await goiJson('/api/bao-cao-tuan');
      assert.equal(bcKhach.body.demTheoNhan.cao, 0);

      // Chính chủ `tk_bo_me_push` gọi `/api/bao-cao-tuan` thấy đúng ca vừa phát
      const bcChinhChu = await goiJson('/api/bao-cao-tuan', undefined, {
        authorization: `Bearer ${phienBoMe.token}`,
      });
      assert.ok(bcChinhChu.body.demTheoNhan.cao >= 1);

      // Kiểm tra trần bộ nhớ `khoCanhBao` (evict bản ghi cũ nhất khi đầy)
      const khoNho = taoKhoCanhBao({ gioiHanBoNho: 3 });
      khoNho.them({ id: 'c1', nhan: 'NGHI_NGO' });
      khoNho.them({ id: 'c2', nhan: 'NGHI_NGO' });
      khoNho.them({ id: 'c3', nhan: 'NGHI_NGO' });
      khoNho.them({ id: 'c4', nhan: 'CAO' });
      assert.equal(khoNho.coBaoNhieu(), 3);
      assert.equal(khoNho.lay('c1'), null);
      assert.equal(khoNho.lay('c4').nhan, 'CAO');
    } finally {
      app.set('guiPushThay', undefined);
      if (prevVapidPub === undefined) delete process.env.VAPID_PUBLIC_KEY; else process.env.VAPID_PUBLIC_KEY = prevVapidPub;
      if (prevVapidPriv === undefined) delete process.env.VAPID_PRIVATE_KEY; else process.env.VAPID_PRIVATE_KEY = prevVapidPriv;
      if (prevVapidSub === undefined) delete process.env.VAPID_SUBJECT; else process.env.VAPID_SUBJECT = prevVapidSub;
    }
  });
});

describe('3. Fuzz-test 3.600 biến thể ngôn ngữ trong RAM (không làm phồng bộ đo chuẩn)', () => {
  it('chạy 3.600 biến thể (xưng hô, không dấu, viết tắt SMS, bẫy phủ định, tin lành) đạt 100% kỳ vọng', () => {
    const bo3000 = taoBoBienTheFuzz3000();
    assert.equal(bo3000.length, 3600);

    let sotNguyHiem = 0;
    let baoOanTinLanh = 0;

    for (const mau of bo3000) {
      const kq = analyze({ vanBan: mau.vanBan });
      if (mau.loai === 'nguy_hiem') {
        if (kq.nhan === 'CHUA_THAY') sotNguyHiem += 1;
      } else if (kq.nhan !== 'CHUA_THAY') {
        baoOanTinLanh += 1;
      }
    }

    assert.equal(sotNguyHiem, 0, `Bỏ sót ${sotNguyHiem}/2400 biến thể nguy hiểm`);
    assert.equal(baoOanTinLanh, 0, `Báo oan ${baoOanTinLanh}/600 biến thể tin lành`);
  });
});

describe('4. Khép kín Guardian ↔ Cảnh báo hai phía (`cb_...`) & Thư ký gia đình + Khử PII mẫu thật', () => {
  it('GET /api/detect/canh-bao/:id & /api/thu-ky/gia-dinh/cuoc-goi: con đã ghép đọc được & tự ghi `da_mo`, người lạ nhận 404, thu hồi mất quyền ngay', async () => {
    const tkMe = `tk_me_gd_${Date.now()}`;
    const tkCon = `tk_con_gd_${Date.now()}`;
    const tkLa = `tk_la_gd_${Date.now()}`;

    const phienMe = await KP.capPhien(tkMe);
    const phienCon = await KP.capPhien(tkCon);
    const phienLa = await KP.capPhien(tkLa);

    // Ghép cặp bố mẹ ↔ con cháu bằng mã 6 số
    const batDau = await KP.batDauGhep(tkMe);
    await KP.xacNhanGhep(tkCon, batDau.ma);

    let vt = TC.taoVongTron(tkMe);
    vt = TC.themThanhVien(vt, { id: tkCon, vaiTro: 'nguoi_than_tin_cay', boiAi: tkMe });
    vt = TC.datQuyTac(vt, { nguongTien: 5_000_000, nguoiNhanCanhBaoId: tkCon }, tkMe);

    // Bố mẹ phát cảnh báo hai phía (cố tình gài chuỗi lạ vào kq.nhan xem có lọt không)
    const resPhat = await goiJson(
      '/api/detect/canh-bao',
      {
        ketQua: { nhan: 'CAO', canThiep: 'PAUSE_60S', maLyDo: ['FIN_SAFE_ACCOUNT'], maGiaiThich: 'R1' },
        vongTron: vt,
      },
      { authorization: `Bearer ${phienMe.token}` }
    );
    assert.equal(resPhat.status, 200);
    const cbId = resPhat.body.canhBaoId;
    assert.ok(cbId.startsWith('cb_'));

    // Người lạ bị chặn 404
    const docLa = await goiJson(`/api/detect/canh-bao/${cbId}`, undefined, {
      authorization: `Bearer ${phienLa.token}`,
    });
    assert.equal(docLa.status, 404);

    // Con đã ghép đọc được (200) và đánh dấu báo nhầm thành công
    const docCon = await goiJson(`/api/detect/canh-bao/${cbId}`, undefined, {
      authorization: `Bearer ${phienCon.token}`,
    });
    assert.equal(docCon.status, 200);
    assert.equal(docCon.body.nhan, 'CAO');

    // Cuộc gọi Thư ký trên máy bố mẹ -> con đã ghép đọc được tóm tắt đã che SĐT, người lạ không thấy
    const cgStart = await goiJson(
      '/api/thu-ky/cuoc-goi/bat-dau',
      { soNguoiGoi: '0977123456', giaLap: true },
      { authorization: `Bearer ${phienMe.token}` }
    );
    await goiJson(
      `/api/thu-ky/cuoc-goi/${cgStart.body.phien.id}/luot`,
      { loiNoi: 'Tôi là công an điều tra yêu cầu chuyển tiền vào tài khoản tạm giữ ngay.' },
      { authorization: `Bearer ${phienMe.token}` }
    );

    const dsCon = await goiJson('/api/thu-ky/gia-dinh/cuoc-goi', undefined, {
      authorization: `Bearer ${phienCon.token}`,
    });
    assert.equal(dsCon.status, 200);
    assert.ok(dsCon.body.cuocGoi.some((c) => c.id === cgStart.body.phien.id && c.nhanRuiRo === 'CAO'));

    const dsLa = await goiJson('/api/thu-ky/gia-dinh/cuoc-goi', undefined, {
      authorization: `Bearer ${phienLa.token}`,
    });
    assert.equal(dsLa.body.cuocGoi.length, 0);

    // Thu hồi ghép cặp -> con mất quyền đọc ngay lập tức (404)
    await KP.thuHoiGhep(tkMe, tkCon);
    const docSauThuHoi = await goiJson(`/api/detect/canh-bao/${cbId}`, undefined, {
      authorization: `Bearer ${phienCon.token}`,
    });
    assert.equal(docSauThuHoi.status, 404);
  });

  it('công cụ `khu-pii-mau-that.js` che sạch SĐT, CCCD, STK, OTP, Email mà giữ nguyên tên miền lừa đảo', () => {
    const mauTho = {
      id: 'that-001',
      ho: 'gia_danh_cong_an',
      kenh: 'sms',
      ngon_ngu: 'vi',
      muc_do: 'CAO',
      toi_da: 'CAO',
      noi_dung: 'Tôi ở Công an gọi số 0981234567 báo CCCD 001088012345 liên quan vụ án. Chuyển 15.000.000đ vào STK 19034567890123 hoặc nhập mã OTP 654321 tại vneid-capnhat.top, email hotro@gia.vn.',
    };
    const daChuan = chuanHoaDongMauThat(mauTho, 1);
    assert.ok(!daChuan.noi_dung.includes('0981234567'));
    assert.ok(!daChuan.noi_dung.includes('001088012345'));
    assert.ok(!daChuan.noi_dung.includes('19034567890123'));
    assert.ok(!daChuan.noi_dung.includes('654321'));
    assert.ok(!daChuan.noi_dung.includes('hotro@gia.vn'));
    assert.ok(daChuan.noi_dung.includes('vneid-capnhat.top'));
    assert.ok(daChuan.noi_dung.includes('15.000.000đ'));
    assert.deepEqual(kiemDinhBanGhiMauThat(daChuan, 1), []);
  });
});
