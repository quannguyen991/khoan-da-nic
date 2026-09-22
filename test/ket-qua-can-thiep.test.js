'use strict';
/**
 * KẾT QUẢ CAN THIỆP — §4.6 và "can thiệp có đổi được hành động không".
 *
 * Canh ba thứ: nút "Tôi ổn" thật sự GHI (trước 22/9/2026 nó không ghi gì), bản
 * ghi không mang nội dung, và dữ liệu không có đường ra mạng.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const TEP_GOI = path.join(GOC, 'node_modules', '.goi-test-vong-tron', 'ket-qua-can-thiep.cjs');
const NGUON = path.join(GOC, 'src', 'lib', 'ket-qua-can-thiep.ts');

function goi() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(path.dirname(TEP_GOI), { recursive: true });
  esbuild.buildSync({
    entryPoints: [NGUON], bundle: true, format: 'cjs', platform: 'node',
    outfile: TEP_GOI, absWorkingDir: GOC, logLevel: 'silent',
  });
  return require(TEP_GOI);
}

function datKho(banDau = {}) {
  const kho = { ...banDau };
  const gia = {
    getItem: (k) => (k in kho ? kho[k] : null),
    setItem: (k, v) => { kho[k] = String(v); },
    removeItem: (k) => { delete kho[k]; },
    _kho: kho,
  };
  try { globalThis.localStorage = gia; } catch { /* rơi xuống defineProperty */ }
  if (globalThis.localStorage !== gia) {
    Object.defineProperty(globalThis, 'localStorage', { value: gia, configurable: true, writable: true });
  }
  return gia;
}

const K = goi();

test('§4.6 — nút "Tôi ổn" ở màn khẩn cấp GHI một mẫu báo động giả', () => {
  const app = fs.readFileSync(path.join(GOC, 'src', 'App.tsx'), 'utf8');
  const i = app.indexOf("t('Tôi ổn, không có gì nguy hiểm')");
  assert.ok(i > 0, 'không tìm thấy nút "Tôi ổn"');
  const nut = app.slice(app.lastIndexOf('<button', i), i);
  assert.match(nut, /ghiHanhDong\(laKhanCap \? 'toi_on'/,
    '§4.6: "Mỗi lần bấm nút này là một mẫu dữ liệu báo động giả — ghi lại để hiệu chỉnh ngưỡng." '
    + 'Nút chỉ điều hướng mà không ghi là bỏ mất đúng dữ liệu duy nhất cho biết bộ luật báo oan bao nhiêu.');
});

test('ghi đúng mức, nhãn, mã và hành động', () => {
  datKho();
  const b = K.ghiKetQua({ canThiep: 'PROTECTED_CRITICAL', nhan: 'CAO', maLyDo: ['CRED_OTP_SHARE'], hanhDong: 'toi_on' }, 1000);
  assert.deepStrictEqual(b, { luc: 1000, canThiep: 'PROTECTED_CRITICAL', nhan: 'CAO', maLyDo: ['CRED_OTP_SHARE'], hanhDong: 'toi_on' });
  assert.strictEqual(K.docKetQua().length, 1);
});

test('KHÔNG lưu nội dung — thứ không trông như MÃ bị bỏ', () => {
  datKho();
  const b = K.ghiKetQua({
    canThiep: 'Tôi là công an',
    nhan: 'CAO',
    maLyDo: ['FIN_TRANSFER_REQUEST', 'chuyển 50 triệu vào tài khoản 9999888877', 'Nguyễn Văn A'],
    hanhDong: 'bam_goi_nguoi_than',
  });
  assert.strictEqual(b.canThiep, null, 'chuỗi có dấu tiếng Việt lọt vào trường mức can thiệp');
  assert.deepStrictEqual(b.maLyDo, ['FIN_TRANSFER_REQUEST'], 'nội dung tin nhắn lọt vào mã lý do');
  const json = JSON.stringify(K.docKetQua());
  assert.ok(!json.includes('9999888877') && !json.includes('Nguyễn'), 'bản ghi chứa nội dung riêng tư');
});

test('không phình vô hạn — giữ tối đa TOI_DA_BAN_GHI lượt', () => {
  datKho();
  for (let i = 0; i < K.TOI_DA_BAN_GHI + 20; i += 1) K.ghiKetQua({ hanhDong: 've_trang_chu' }, i);
  assert.strictEqual(K.docKetQua().length, K.TOI_DA_BAN_GHI);
});

test('kho hỏng hoặc bị chặn thì KHÔNG ném — nút người dùng bấm vẫn phải chạy', () => {
  datKho({ khoan_da_ket_qua_can_thiep: '{hong' });
  assert.doesNotThrow(() => K.ghiKetQua({ hanhDong: 'toi_on' }));
  Object.defineProperty(globalThis, 'localStorage', {
    value: { getItem() { throw new Error('chan'); }, setItem() { throw new Error('chan'); } },
    configurable: true, writable: true,
  });
  assert.doesNotThrow(() => K.ghiKetQua({ hanhDong: 'toi_on' }));
  assert.deepStrictEqual(K.docKetQua(), []);
});

test('tỷ lệ báo oan chỉ ra số khi đủ mẫu (§11 — không gọi tiếng ồn là số đo)', () => {
  datKho();
  for (let i = 0; i < 3; i += 1) K.ghiKetQua({ canThiep: 'PROTECTED_CRITICAL', hanhDong: 'toi_on' }, i);
  assert.strictEqual(K.tomTatKetQua().tyLeBaoOan, null, 'dưới 5 lượt mà đã ra tỷ lệ');
  K.ghiKetQua({ canThiep: 'PROTECTED_CRITICAL', hanhDong: 'bam_goi_nguoi_than' }, 10);
  K.ghiKetQua({ canThiep: 'PROTECTED_CRITICAL', hanhDong: 'bam_goi_nguoi_than' }, 11);
  const t = K.tomTatKetQua();
  assert.strictEqual(t.soLuotKhanCap, 5);
  assert.strictEqual(t.tyLeBaoOan, 3 / 5);
});

test('không có đường ra mạng trong module ghi kết quả', () => {
  const nguon = fs.readFileSync(NGUON, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  for (const cam of ['fetch(', 'sendBeacon', 'XMLHttpRequest', 'WebSocket', 'api(']) {
    assert.ok(!nguon.includes(cam), `module có "${cam}" — dữ liệu về lúc một người đang hoảng không được rời khỏi máy`);
  }
});
