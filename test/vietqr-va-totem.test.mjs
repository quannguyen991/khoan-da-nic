import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const GOC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadTsModule(relPath, mocks = {}) {
  const src = readFileSync(path.join(GOC, relPath), 'utf8');
  const out = esbuild.transformSync(src, { loader: 'ts', format: 'cjs' });
  const mod = { exports: {} };
  const customRequire = (id) => {
    if (id in mocks) return mocks[id];
    throw new Error(`Unexpected import in standalone test: ${id}`);
  };
  const fn = new Function('exports', 'module', 'require', out.code);
  fn(mod.exports, mod, customRequire);
  return mod.exports;
}

const { phanTichVietQR, tinhCrc16Ccitt } = loadTsModule('src/lib/vietqr-inspector.ts');
const { tinhTinHieuNgay, taoMaGiongGiaDinh, layNgayVietNam, SO_TO_HOP_TOTEM } = loadTsModule('src/lib/tin-hieu-ngay.ts');
const { sangLocTinDenTaiMay } = loadTsModule('src/lib/tang-0-cuc-bo.ts', {
  '../api-goc': { api: (p) => p },
});

function buildTlv(tag, val) {
  const bytes = new TextEncoder().encode(val);
  return `${tag}${String(bytes.length).padStart(2, '0')}${val}`;
}

describe('VietQR EMVCo Inspector (offline, §4.3, §11, i18n)', () => {
  it('giải mã đúng TLV UTF-8, kiểm tra CRC Tag 63 và khai chuaKiemCrc khi thiếu Tag 63', () => {
    const sub01 = `${buildTlv('00', '970422')}${buildTlv('01', '0987654321')}`;
    const tag38 = buildTlv('38', `${buildTlv('00', 'A000000727')}${buildTlv('01', sub01)}`);
    const tag54 = buildTlv('54', '500000');
    const tag59 = buildTlv('59', 'Nguyễn Văn Bình');
    const tag62 = buildTlv('62', buildTlv('08', 'Đóng phí tạm giữ hồ sơ'));
    const bodyKhongCrc = `000201010212${tag38}${tag54}5802VN${tag59}${tag62}`;
    const payload = `${bodyKhongCrc}6304`;
    const crc = tinhCrc16Ccitt(new TextEncoder().encode(payload));

    const kqDung = phanTichVietQR(`${payload}${crc}`, 'vi');
    assert.equal(kqDung.hopLe, true);
    assert.equal(kqDung.crcHopLe, true);
    assert.equal(kqDung.chuaKiemCrc, false);
    assert.equal(kqDung.nganHang, 'MB Bank');
    assert.equal(kqDung.tenChuTaiKhoan, 'Nguyễn Văn Bình');
    assert.ok(kqDung.canhBaoNoiDung.some((c) => /tạm giữ/i.test(c)));
    assert.doesNotMatch(kqDung.tomTatChoBac, /an toàn/i);

    // §4.3 — thiếu Tag 63 không được im lặng coi như bình thường
    const kqThieuCrc = phanTichVietQR(bodyKhongCrc, 'vi');
    assert.equal(kqThieuCrc.crcHopLe, null);
    assert.equal(kqThieuCrc.chuaKiemCrc, true);
    assert.ok(kqThieuCrc.canhBaoNoiDung.some((c) => /Tag 63/i.test(c)));

    // Hỗ trợ tiếng Anh
    const kqEn = phanTichVietQR(`${payload}0000`, 'en');
    assert.equal(kqEn.crcHopLe, false);
    assert.ok(kqEn.canhBaoNoiDung.some((c) => /Integrity check/i.test(c)));
  });

  it('nhận diện thêm BIN SeABank (970440) và cảnh báo memo hoàn thuế / cắt điện / phí hải quan + TLD .shop/.online', () => {
    const tag38 = buildTlv('38', `${buildTlv('00', 'A000000727')}${buildTlv('01', `${buildTlv('00', '970440')}${buildTlv('01', '9876543210')}`)}${buildTlv('02', 'QRIBFTTA')}`);
    const tag62 = buildTlv('62', buildTlv('08', 'Hoan thue TNCN qua eTax phi hai quan'));
    const body = `${buildTlv('00', '01')}${buildTlv('01', '12')}${tag38}${buildTlv('53', '704')}${buildTlv('54', '1500000')}${buildTlv('58', 'VN')}${tag62}6304`;
    const qr = `${body}${tinhCrc16Ccitt(new TextEncoder().encode(body))}`;

    const kq = phanTichVietQR(qr, 'vi');
    assert.equal(kq.crcHopLe, true);
    assert.equal(kq.nganHang, 'SeABank');
    assert.ok(kq.canhBaoNoiDung.some((c) => /hoàn thuế/i.test(c)));
    assert.ok(kq.canhBaoNoiDung.some((c) => /hải quan/i.test(c)));

    const kqShop = phanTichVietQR('https://viettelpost-giaohang.shop/nhanhang', 'vi');
    assert.equal(kqShop.loaiQR, 'url');
    assert.ok(kqShop.canhBaoNoiDung.length >= 1);
  });

  it('chặn các URI scheme nguy hiểm (javascript:, intent:) và cảnh báo link .apk', () => {
    const kqJs = phanTichVietQR('javascript:alert(1)', 'vi');
    assert.equal(kqJs.hopLe, false);
    assert.equal(kqJs.loaiQR, 'scheme_la');
    assert.equal(kqJs.canhBaoNoiDung.length, 1);

    const kqUrl = phanTichVietQR('https://vneid-capnhat.top/cai.apk', 'en');
    assert.equal(kqUrl.loaiQR, 'url');
    assert.ok(kqUrl.canhBaoNoiDung.length >= 2);
  });
});

describe('Daily Family Totem (11.520 tổ hợp + CSPRNG + song ngữ)', () => {
  it('có đúng 11.520 tổ hợp và đồng bộ tất định giữa hai máy dùng chung familySeed', () => {
    assert.equal(SO_TO_HOP_TOTEM, 11520);
    const seed = taoMaGiongGiaDinh();
    assert.equal(seed.length, 8);
    const moc = Date.UTC(2026, 10, 25, 9, 0, 0);
    const tVi1 = tinhTinHieuNgay(seed, moc, 'vi');
    const tVi2 = tinhTinHieuNgay(seed.toLowerCase(), moc + 3600_000, 'vi');
    const tEn = tinhTinHieuNgay(seed, moc, 'en');

    assert.equal(tVi1.chuoiHienThi, tVi2.chuoiHienThi);
    assert.equal(tVi1.soKiem, tEn.soKiem);
    assert.ok(tVi1.soKiem >= 10 && tVi1.soKiem <= 99);
    assert.equal(tVi1.ngay, layNgayVietNam(moc));
    assert.notEqual(tVi1.chuoiHienThi, tEn.chuoiHienThi);
  });
});

describe('Bộ sàng lọc Tầng 0 tại máy (`tang-0-cuc-bo.ts`)', () => {
  it('bắt mạo danh + link ngoài allowlist (R1), file APK (R2), xin OTP (R8) và bỏ qua SMS cảnh báo thật', () => {
    const r1 = sangLocTinDenTaiMay('Thông báo phạt nguội CSGT, tra cứu tại csgt-tracuu.top ngay.');
    assert.equal(r1.coDauHieu, true);
    assert.equal(r1.nhanDeXuat, 'CAO');
    assert.ok(r1.luatKhopVoi.includes('R1'));

    const r2 = sangLocTinDenTaiMay('Tải ứng dụng VNeID mới tại vneid-update.top/app.apk');
    assert.equal(r2.nhanDeXuat, 'CAO');
    assert.equal(r2.canThiep, 'PROTECTED_CRITICAL');

    const lanh = sangLocTinDenTaiMay('[Vietcombank] Mã OTP của quý khách là 123456. Tuyệt đối không chia sẻ mã OTP cho bất kỳ ai.');
    assert.equal(lanh.coDauHieu, false);
    assert.equal(lanh.nhanDeXuat, 'CHUA_THAY');

    const evnFake = sangLocTinDenTaiMay('Thông báo cắt điện khẩn cấp EVN, xem hóa đơn tại evn-hoadon.online');
    assert.equal(evnFake.coDauHieu, true);
    assert.equal(evnFake.nhanDeXuat, 'CAO');
  });
});
