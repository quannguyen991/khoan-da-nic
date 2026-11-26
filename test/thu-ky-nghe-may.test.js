'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const {
  taoStoreThuKy,
  taoQuanLyStoreThuKy,
  taoTokenPhienKhach,
  xacMinhTokenPhienKhach,
  LOI_CHAO_MO_DAU,
  LOI_NHAN_DU_PHONG,
} = require('../backend/src/thu-ky-nghe-may');
const {
  locLoiDapThuKy,
  PHIEN_BAN_LUAT_THU_KY,
  BO_LUAT_TIN_HIEU,
  CONG_HUONG_THU_KY,
  trichThucTheCuocGoi,
} = require('../backend/src/thu-ky-bo-luat');
const { BO_KICH_BAN_THU_KY, chayDanhGiaBoLuatThuKy } = require('../backend/src/thu-ky-kich-ban');

process.env.KHOAN_DA_KHONG_GOI_AI = '1';
const { app } = require('../backend/server');

let server;
let goc;

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  goc = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

describe('Thư ký nghe máy hộ — Chuẩn hóa §4.2, §4.1, §11, §12 & Bảo mật Phiên', () => {
  it('luôn giới thiệu rõ là trợ lý tự động ngay đầu cuộc gọi và trả kèm nhanRuiRo thuộc 3 nhãn chuẩn', () => {
    const store = taoStoreThuKy();
    const phien = store.batDauCuocGoi({ soNguoiGoi: '0981234567' });
    assert.equal(phien.hoiThoai[0].noiDung, LOI_CHAO_MO_DAU);
    assert.match(phien.hoiThoai[0].noiDung, /trợ lý tự động/i);
    assert.ok(['CAO', 'NGHI_NGO', 'CHUA_THAY'].includes(phien.nhanRuiRo));
  });

  it('§4.2 — không giữ trọng số riêng trong BO_LUAT_TIN_HIEU hay CONG_HUONG_THU_KY', () => {
    for (const l of BO_LUAT_TIN_HIEU) {
      assert.equal('trongSo' in l, false, `${l.ma} còn giữ trọng số riêng`);
    }
    for (const c of CONG_HUONG_THU_KY) {
      assert.equal('diemCong' in c, false, `${c.ma} còn giữ điểm cộng riêng`);
    }
  });

  it('phát hiện giả danh công an đòi chuyển tiền qua decision-engine.js (nhanRuiRo = CAO)', async () => {
    const store = taoStoreThuKy();
    const phien = store.batDauCuocGoi({ soNguoiGoi: '0981111222' });
    const kq = await store.xuLyLuotNguoiGoi(phien.id, {
      loiNoi: 'Tôi là công an điều tra, yêu cầu bác chuyển tiền vào tài khoản tạm giữ ngay và giữ bí mật.',
    });

    assert.equal(kq.ketThuc, true);
    assert.equal(kq.phien.trangThaiPhanLoai, 'dang_ngo');
    assert.equal(kq.phien.nhanRuiRo, 'CAO');
    assert.match(kq.phien.caller_claim, /tự xưng/i);
    assert.ok(kq.phien.signals.includes('TK_CHUYEN_TIEN'));
    assert.ok(kq.phien.signals.includes('FIN_SAFE_ACCOUNT'));
    assert.doesNotMatch(kq.loiDap, /an toàn/i);
  });

  it('§12 — chống câu thần chú phủ định: mở đầu "không chuyển tiền" nhưng vế sau đòi OTP vẫn bắt CAO', async () => {
    const store = taoStoreThuKy();
    const p1 = store.batDauCuocGoi({ soNguoiGoi: '0982222333' });
    const kqBay = await store.xuLyLuotNguoiGoi(p1.id, {
      loiNoi: 'Tôi gọi từ ngân hàng, bác hoàn toàn không cần chuyển tiền, chỉ cần đọc ngay mã OTP 6 số vừa gửi về máy.',
    });
    assert.equal(kqBay.phien.trangThaiPhanLoai, 'dang_ngo');
    assert.equal(kqBay.phien.nhanRuiRo, 'CAO');
    assert.ok(kqBay.phien.signals.includes('CRED_OTP_SHARE') || kqBay.phien.signals.includes('TK_OTP_MAT_KHAU'));

    // Kiểm tra chữ "dùng" không bị bỏ dấu nhầm thành "đừng"
    const p2 = store.batDauCuocGoi({ soNguoiGoi: '0982222444' });
    const kqDung = await store.xuLyLuotNguoiGoi(p2.id, {
      loiNoi: 'Bác dùng ứng dụng ngân hàng chuyển tiền đóng phí hồ sơ ngay cho tôi.',
    });
    assert.equal(kqDung.phien.trangThaiPhanLoai, 'dang_ngo');
    assert.ok(kqDung.phien.signals.includes('TK_CHUYEN_TIEN'));
  });

  it('xử lý đúng câu phủ định thật sự "không chuyển tiền, không cần OTP" để không báo động nhầm', async () => {
    const store = taoStoreThuKy();
    const phien = store.batDauCuocGoi({ soNguoiGoi: '0936444555' });
    const kq = await store.xuLyLuotNguoiGoi(phien.id, {
      loiNoi: 'Tôi gọi xác nhận lịch hẹn tại quầy ngân hàng, cuộc gọi này hoàn toàn không chuyển tiền và không cần OTP.',
    });

    assert.notEqual(kq.phien.trangThaiPhanLoai, 'dang_ngo');
    assert.equal(kq.phien.nhanRuiRo, 'CHUA_THAY');
    // §11 — câu giải thích không khẳng định vắng tín hiệu cụ thể ("OTP hay đường dẫn")
    assert.doesNotMatch(kq.phien.giaiThichChoBac, /OTP hay đường dẫn/i);
  });

  it('ưu tiên phân loại khẩn cấp khi có tai nạn / cấp cứu và không tự kết luận thật giả', async () => {
    const store = taoStoreThuKy();
    const phien = store.batDauCuocGoi({ soNguoiGoi: '0912333444' });
    const kq = await store.xuLyLuotNguoiGoi(phien.id, {
      loiNoi: 'Alo bác ơi, cháu gọi từ bệnh viện báo người nhà bị tai nạn cấp cứu gấp.',
    });

    assert.equal(kq.ketThuc, true);
    assert.equal(kq.phien.trangThaiPhanLoai, 'khan_cap');
    assert.equal(kq.phien.urgency, 'emergency');
    assert.match(kq.phien.summary, /Không tự kết luận thật giả/i);
  });

  it('chỉ hỏi lại tối đa 1 lần khi không nghe rõ, lần 2 chuyển về chưa xác minh kèm lời nhắn dự phòng', async () => {
    const store = taoStoreThuKy();
    const phien = store.batDauCuocGoi({ soNguoiGoi: 'Số lạ' });

    const luot1 = await store.xuLyLuotNguoiGoi(phien.id, { khongNgheRo: true });
    assert.equal(luot1.ketThuc, false);

    const luot2 = await store.xuLyLuotNguoiGoi(phien.id, { khongNgheRo: true });
    assert.equal(luot2.ketThuc, true);
    assert.equal(luot2.loiDap, LOI_NHAN_DU_PHONG);
    assert.equal(luot2.phien.trangThaiPhanLoai, 'khong_du_thong_tin');
  });

  it('fallback an toàn khi dịch vụ AI lỗi', async () => {
    const store = taoStoreThuKy();
    const phien = store.batDauCuocGoi({ soNguoiGoi: '0904000111' });
    const kq = await store.xuLyLuotNguoiGoi(phien.id, {
      loiNoi: 'Chào bác, em gọi hỏi thăm sức khỏe bác thôi ạ.',
      tuyChon: { giaLapLoiAi: true },
    });

    assert.equal(kq.ketThuc, true);
    assert.equal(kq.phien.trangThaiPhanLoai, 'loi_he_thong');
    assert.equal(kq.loiDap, LOI_NHAN_DU_PHONG);
  });

  it('bộ luật v1.2.0 đạt 100% trên toàn bộ 50 kịch bản chuẩn §7 (Recall 100%, FP 0%)', () => {
    assert.equal(PHIEN_BAN_LUAT_THU_KY, '1.2.0');
    assert.ok(BO_KICH_BAN_THU_KY.length >= 50);

    const kq = chayDanhGiaBoLuatThuKy();
    assert.equal(kq.soKichBanDat, kq.tongKichBan, JSON.stringify(kq.chiTiet.filter((x) => !x.dat), null, 2));
    assert.equal(kq.tyLeDatPhanTram, 100);
    assert.equal(kq.recallDangNgoPhanTram, 100);
    assert.equal(kq.baoNhamHopLePhanTram, 0);
  });

  it('HTTP router `/api/thu-ky/*`: bắt buộc chữ ký HMAC trên phiên khách và ẩn trọng số nội bộ', async () => {
    // 1. Header giả mạo không có chữ ký HMAC bị chặn 401
    const rGia = await fetch(`${goc}/api/thu-ky/cau-hinh`, {
      headers: { 'x-thu-ky-session': 'phien_tu_bia_123456789' },
    });
    assert.equal(rGia.status, 401);

    // 2. Xin token phiên khách hợp lệ từ server
    const rCap = await fetch(`${goc}/api/thu-ky/phien-khach`, { method: 'POST' });
    assert.equal(rCap.status, 200);
    const { token } = await rCap.json();
    assert.ok(xacMinhTokenPhienKhach(token));
    assert.equal(xacMinhTokenPhienKhach(`${token}x`), null);

    // 3. Gọi cấu hình với token HMAC hợp lệ
    const rOk = await fetch(`${goc}/api/thu-ky/cau-hinh`, {
      headers: { 'x-thu-ky-session': token },
    });
    assert.equal(rOk.status, 200);

    // 4. Endpoint /bo-luat không lộ trongSo hay diemCong
    const rLuat = await fetch(`${goc}/api/thu-ky/bo-luat`);
    const bodyLuat = await rLuat.json();
    assert.ok(!JSON.stringify(bodyLuat).includes('trongSo'));
    assert.ok(!JSON.stringify(bodyLuat).includes('diemCong'));
  });

  it('lưu bền vững cấu hình và tóm tắt cuộc gọi (đã che SĐT, bỏ thucThe/hoiThoai) vào vault-store', async () => {
    const { moKho } = require('../backend/src/vault-store');
    const kho = await moKho({ env: {} });
    const token = taoTokenPhienKhach();
    assert.ok(token.startsWith('tk1.'));

    const qly1 = taoQuanLyStoreThuKy(100, kho);
    const s1 = qly1.layStore('tk:bac_hung');
    s1.capNhatCauHinh({ cheDo: 'chi_ghi_loi_nhan', nguoiHoTro: [{ ten: 'Con trai', dienThoai: '0911222333' }] });
    const p = s1.batDauCuocGoi({ soNguoiGoi: '0988777666' });
    await s1.xuLyLuotNguoiGoi(p.id, { loiNoi: 'Tôi là công an yêu cầu chuyển 20 triệu ngay.' });

    await new Promise((r) => setTimeout(r, 20));

    const qly2 = taoQuanLyStoreThuKy(100, kho);
    const s2 = qly2.layStore('tk:bac_hung');
    await s2.taiTuKho(kho);

    assert.equal(s2.layCauHinh().cheDo, 'chi_ghi_loi_nhan');
    assert.equal(s2.layDanhSachCuocGoi().length, 1);
    assert.equal(s2.layDanhSachCuocGoi()[0].soNguoiGoi, '0988***666');
    assert.deepEqual(s2.layDanhSachCuocGoi()[0].hoiThoai, []);

    const tt = trichThucTheCuocGoi('Chào bác, tôi là Hùng bên Công an quận yêu cầu chuyển 15 triệu đồng.');
    assert.equal(tt.tenTuXung, 'Hùng');
    assert.doesNotMatch(locLoiDapThuKy('Số CCCD 001099012345 an toàn'), /001099012345|an toàn/i);
    await kho.dong();
  });
});
