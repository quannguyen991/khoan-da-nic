/**
 * HÀNG RÀO CHO §HĐ · §4.1 · §4.2 · §4.3 · §4.4.
 *
 * ⚠️ ĐO QUA HTTP, KHÔNG CHỈ GỌI HÀM. §5.2 — dự án đã bị cắn đúng chỗ này: bộ
 * luật hỏi nhanh viết xong, có test, và chưa bao giờ chạy được qua mạng vì cửa
 * HTTP không rút trường đó ra.
 *
 * ⚠️ Mỗi bài dưới đây tương ứng một lỗi ĐÃ ĐO ĐƯỢC ngày 18/8/2026, không phải
 * một giả định. Xoá bài nào thì đọc phần mô tả của bài đó trước.
 *
 * Chạy: npm test
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Không gọi ra gateway thật khi chạy test.
process.env.KHOAN_DA_KHONG_GOI_AI = '1';

const { app } = require(path.join(GOC, 'backend', 'server.js'));

let may;
let coSo;

before(async () => {
  may = app.listen(0);
  await new Promise((ok) => may.once('listening', ok));
  coSo = `http://127.0.0.1:${may.address().port}`;
});

after(() => may?.close());

const goi = async (duong, than) => {
  const r = await fetch(`${coSo}${duong}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(than),
  });
  return { ma: r.status, than: await r.json(), headers: r.headers };
};

const doc = (p) => readFileSync(path.join(GOC, p), 'utf8');

// ══════════════════════════════════════════════════════════════════════════
// §HĐ + §4.2 — TÍN HIỆU CỦA NHÁNH PHẢI ĐI ĐƯỢC QUA CỬA HTTP
// ══════════════════════════════════════════════════════════════════════════

/**
 * ĐÂY LÀ BÀI QUAN TRỌNG NHẤT CỦA TỆP.
 *
 * `src/bo-hoi-nhanh.js` gắn cho mỗi nhánh một SIGNAL_ID riêng, nhưng cửa HTTP
 * chỉ nhận `traLoiBoHoiNhanh` — tức chỉ nhận CÂU TRẢ LỜI. Bản frontend đầu tiên
 * chọn nhánh xong không gửi gì về nó, và đo được:
 *
 *   nhánh "Đưa mã OTP" + CÓ cả hai câu, thiếu tín hiệu nhánh → NGHI_NGO · VERIFY_PATH
 *   cùng lượt đó, có tín hiệu nhánh                          → CAO      · PROTECTED_CRITICAL
 *
 * Mất một bậc VÀ mất màn khẩn cấp, ở đúng kịch bản trung tâm của cả tính năng.
 * Cách vá: nhánh trùng đúng một CÂU HỎI mang cùng SIGNAL_ID, nên chọn nhánh là
 * đặt sẵn câu đó thành `true`.
 */
test('§4.2 · nhánh doi_otp kèm tín hiệu nhánh ⇒ CAO + PROTECTED_CRITICAL (CO-01)', async () => {
  const { than } = await goi('/api/analyze', {
    traLoiBoHoiNhanh: {
      ho_xin_ma_trong_tin_nhan: true,          // tín hiệu CỦA NHÁNH doi_otp
      ho_bao_chuyen_tien_hoac_rut_tien: true,
      ho_bao_dung_cup_may: true,
    },
  });
  assert.equal(than.nhan, 'CAO');
  assert.equal(than.canThiep, 'PROTECTED_CRITICAL');
});

test('§4.2 · thiếu tín hiệu nhánh thì CHÍNH LƯỢT ĐÓ nhẹ hơn — bằng chứng bài trên có ích', async () => {
  const { than } = await goi('/api/analyze', {
    traLoiBoHoiNhanh: {
      ho_bao_chuyen_tien_hoac_rut_tien: true,
      ho_bao_dung_cup_may: true,
    },
  });
  assert.notEqual(than.nhan, 'CAO');
});

test('§15.8 · lượt CHỈ có bộ hỏi nhanh không bị trả 400', async () => {
  const { ma } = await goi('/api/analyze', {
    traLoiBoHoiNhanh: { ho_nhac_tai_khoan_an_toan: true },
  });
  assert.equal(ma, 200);
});

/**
 * §4.2 — "mọi thứ thêm vào chỉ được LÀM TĂNG cảnh giác, không bao giờ giảm".
 * Trả lời KHÔNG nghĩa là "chưa thấy dấu hiệu này trong điều bác kể", KHÔNG phải
 * bằng chứng vắng mặt.
 */
test('§4.2 · trả lời toàn KHÔNG không hạ mức so với lượt không gửi bộ hỏi nhanh', async () => {
  const vanBan = 'Công an đây, bác chuyển 50 triệu vào tài khoản an toàn và đọc mã OTP';
  const a = await goi('/api/analyze', { vanBan });
  const b = await goi('/api/analyze', {
    vanBan,
    traLoiBoHoiNhanh: {
      ho_bao_dung_cup_may: false,
      ho_xin_ma_trong_tin_nhan: false,
      ho_bao_chuyen_tien_hoac_rut_tien: false,
    },
  });
  const bac = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
  assert.ok(bac[b.than.nhan] >= bac[a.than.nhan], 'bộ hỏi nhanh trả lời KHÔNG đã hạ mức');
});

/**
 * `verifiedChannel` / `verifiedRelationship` là HAI LÁ CỜ DUY NHẤT có thể hạ
 * mức. `/api/analyze` không đòi đăng nhập, nên không có danh tính nào biện minh
 * cho việc nhận chúng từ thân yêu cầu.
 */
test('§6.8 · verifiedRelationship gửi kèm bị bỏ, mức không đổi', async () => {
  const vanBan = 'Bác chuyển gấp 20 triệu vào tài khoản này giúp con';
  const a = await goi('/api/analyze', { vanBan });
  const b = await goi('/api/analyze', { vanBan, verifiedRelationship: true, verifiedChannel: true });
  assert.equal(a.than.nhan, b.than.nhan);
});

test('§6.8 · khoá lạ trong traLoiBoHoiNhanh bị bỏ im lặng, không phản chiếu ra phản hồi', async () => {
  const { ma, than } = await goi('/api/analyze', {
    traLoiBoHoiNhanh: { xyz_la: true, ho_xin_ma_trong_tin_nhan: true },
  });
  assert.equal(ma, 200);
  assert.ok(!JSON.stringify(than).includes('xyz_la'));
});

// ══════════════════════════════════════════════════════════════════════════
// §4.3 — "KHÔNG KIỂM ĐƯỢC" ≠ "ĐÃ KIỂM, KHÔNG THẤY GÌ"
// ══════════════════════════════════════════════════════════════════════════

test('§4.3 · bộ hỏi nhanh vẫn khai chua_nghe_duoc_cuoc_goi, không ngoại lệ', async () => {
  const { than } = await goi('/api/analyze', {
    traLoiBoHoiNhanh: { ho_bao_dung_cup_may: true },
  });
  assert.ok(than.chuaKiem.includes('chua_nghe_duoc_cuoc_goi'));
});

test('§HĐ · lượt không có AI chạy phải khai aiDaChay=false VÀ có mã trong chuaKiem', async () => {
  const { than } = await goi('/api/analyze', { vanBan: 'xin chào bác' });
  assert.equal(than.aiDaChay, false);
  assert.ok(than.chuaKiem.length > 0, 'aiDaChay=false mà chuaKiem rỗng');
});

// ══════════════════════════════════════════════════════════════════════════
// §6.8 — HEADER AN NINH
// ══════════════════════════════════════════════════════════════════════════

/**
 * Ba header này TỪNG BỊ GỠ MẤT trong khi khối chú thích 20 dòng mô tả chúng vẫn
 * nằm nguyên trong `backend/server.js`. Một chú thích mồ côi như vậy còn tệ hơn
 * không có chú thích: người đọc mã tin rằng chỗ đó đã được bảo vệ.
 */
test('§6.8 · CSP, x-frame-options, referrer-policy có mặt', async () => {
  const r = await fetch(`${coSo}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ vanBan: 'test' }),
  });
  const csp = r.headers.get('content-security-policy');
  assert.ok(csp, 'thiếu content-security-policy');
  assert.match(csp, /default-src 'self'/);
  /*
   * ⚠️ `'self'`, KHÔNG PHẢI `'none'`, VÀ KHÔNG PHẢI `*`.
   *  · `'none'` chặn luôn khung điện thoại của chính mình (iframe cùng nguồn),
   *    và chặn im lặng — khung hiện ra rỗng, không báo lỗi;
   *  · `*` hay bỏ hẳn dòng này thì trang của kẻ khác nhúng được app vào để
   *    lừa bác bấm nhầm. Test này chốt đúng ở giữa.
   */
  assert.match(csp, /frame-ancestors 'self'/);
  assert.ok(!/frame-ancestors[^;]*\*/.test(csp), "frame-ancestors mở cho mọi tên miền");
  // img-src KHÔNG được mở cho https: bên ngoài — ảnh từ máy chủ lạ là một lượt
  // gọi ra ngoài mỗi lần bác mở app.
  assert.ok(!/img-src[^;]*https:/.test(csp), 'img-src đã mở cho máy chủ ngoài');
  assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
});

// ══════════════════════════════════════════════════════════════════════════
// §4.1 · §11 — NHỮNG CHỮ KHÔNG ĐƯỢC VIẾT (soi mã nguồn giao diện)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Bỏ chú thích trước khi soi.
 *
 * ⚠️ CHÚ THÍCH TRONG MÃ CỐ Ý NHẮC LẠI NGUYÊN VĂN ĐOẠN HỎNG — đó là cách dự án
 * này ghi lại vì sao mã trông như vậy. Soi cả chú thích thì test đỏ vì chính
 * tài liệu của nó, và người sửa sẽ xoá tài liệu để test xanh. Bỏ CẢ ba dạng:
 * khối `/* *​/`, dòng `//`, và chú thích HTML.
 */
const boChuThich = (s) => s
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

const TEP_GIAO_DIEN = ['src/App.tsx', 'src/i18n.ts', 'src/catalog.ts',
  ...readdirSync(path.join(GOC, 'src', 'components')).map((f) => `src/components/${f}`)];

test('§4.1 · ba nhãn rủi ro nguyên văn, và không có nhãn thứ tư', () => {
  const s = doc('src/catalog.ts');
  assert.match(s, /CAO: c\('Nguy hiểm cao', 'High risk'\)/);
  assert.match(s, /NGHI_NGO: c\('Nghi ngờ', 'Suspicious'\)/);
  assert.match(s, /CHUA_THAY: c\('Chưa thấy dấu hiệu rủi ro', 'No clear risk signals found'\)/);
});

/**
 * ⚠️ BA NHÃN PHẢI GIỐNG NHAU Ở MỌI MÀN.
 * Màn Bài học từng mã cứng 'NGUY CƠ CAO' / 'NGHI VẤN' — hai chữ không có trong
 * §4.1. Bác học một bộ từ ở màn này rồi gặp một bộ khác ở màn kết quả thì hai
 * màn nói về cùng một mức mà nghe như hai chuyện.
 */
test('§4.1 · không màn nào mã cứng nhãn rủi ro riêng', () => {
  for (const f of TEP_GIAO_DIEN) {
    const s = boChuThich(doc(f));
    for (const cau of ['NGUY CƠ CAO', 'NGHI VẤN', 'Nguy cơ cao', 'Nghi vấn']) {
      assert.ok(!s.includes(`'${cau}'`) && !s.includes(`"${cau}"`), `${f} mã cứng nhãn "${cau}"`);
    }
  }
});

test('§4.1 · không chuỗi hiển thị nào là "An toàn" / "Safe"', () => {
  for (const f of TEP_GIAO_DIEN) {
    const s = boChuThich(doc(f));
    assert.ok(!/"An toàn"\s*:/.test(s), `${f} còn khoá nhãn "An toàn"`);
    assert.ok(!/:\s*['"]Safe['"]/.test(s), `${f} còn giá trị "Safe"`);
    assert.ok(!/t\(["']An toàn["']\)/.test(s), `${f} còn hiển thị nhãn "An toàn"`);
  }
});

test('§12 · không hứa chặn cuộc gọi', () => {
  for (const f of TEP_GIAO_DIEN) {
    const s = boChuThich(doc(f));
    assert.ok(!/Đã chặn cuộc gọi/.test(s), `${f} còn hứa "Đã chặn cuộc gọi"`);
    assert.ok(!/Blocked fake police call/.test(s), `${f} còn hứa "Blocked …call"`);
    // ⚠️ "chặn số lạ" cũng là hứa chặn. Bản trước có ở BA chỗ: mô tả vai trò
    // trong màn chọn, mô tả Guardian, và tên một công tắc.
    assert.ok(!/chặn số lạ/.test(s), `${f} còn hứa "chặn số lạ"`);
    assert.ok(!/call blocking/i.test(s), `${f} còn hứa "call blocking"`);
  }
});

test('§11 · không nói "đã gửi" khi mới chỉ mở bảng soạn tin', () => {
  for (const f of TEP_GIAO_DIEN) {
    const s = boChuThich(doc(f));
    assert.ok(!/Đã gửi lời nhắc an toàn/.test(s), `${f} còn câu "Đã gửi lời nhắc…"`);
  }
});

test('quyền riêng tư · không tài nguyên nào tải từ máy chủ ngoài', () => {
  for (const f of [...TEP_GIAO_DIEN, 'index.html']) {
    const s = boChuThich(doc(f));
    assert.ok(!/https:\/\/images\.unsplash\.com/.test(s), `${f} còn ảnh unsplash`);
    assert.ok(!/fonts\.googleapis\.com/.test(s), `${f} còn font Google`);
  }
});

// ══════════════════════════════════════════════════════════════════════════
// §HĐ — FRONTEND PHẢI ĐỌC ĐỦ BỐN TRƯỜNG
// ══════════════════════════════════════════════════════════════════════════

test('§HĐ luật 3 · giao diện có đọc chuaKiem và aiDaChay', () => {
  const nguon = TEP_GIAO_DIEN.map((f) => doc(f)).join('\n');
  assert.match(nguon, /chuaKiem/, 'không nơi nào đọc chuaKiem');
  assert.match(nguon, /aiDaChay/, 'không nơi nào đọc aiDaChay');
  assert.match(nguon, /canThiep/, 'không nơi nào đọc canThiep');
});

test('§HĐ luật 1 · frontend không tự sinh nhãn ngoài ba enum', () => {
  const nguon = TEP_GIAO_DIEN.map((f) => boChuThich(doc(f))).join('\n');
  assert.ok(!/TRUNG_BINH/.test(nguon), 'còn nhãn thứ tư TRUNG_BINH');
  assert.ok(!/riskLevel\s*===\s*['"]MEDIUM['"]/.test(nguon), 'còn so sánh mức MEDIUM không có trong hợp đồng');
});

test('§15.11.1 · mã câu hỏi và mã nhánh của giao diện khớp ma-hop-dong.json', () => {
  const hd = JSON.parse(doc('src/config/ma-hop-dong.json'));
  const cat = doc('src/catalog.ts');
  for (const ma of hd.cauHoiNhanh) {
    assert.ok(new RegExp(`\\b${ma}\\s*:`).test(cat), `catalog thiếu câu hỏi ${ma}`);
  }
  for (const ma of hd.nhanhHanhDong) {
    assert.ok(new RegExp(`\\b${ma}\\s*:`).test(cat), `catalog thiếu nhánh ${ma}`);
  }
});

// ══════════════════════════════════════════════════════════════════════════
// §4.4 — SÀN TIẾP CẬN
// ══════════════════════════════════════════════════════════════════════════

test('§4.4 · không cỡ chữ nào dưới sàn 14px', () => {
  for (const f of TEP_GIAO_DIEN) {
    const s = boChuThich(doc(f));
    const pham = s.match(/text-\[(\d+(?:\.\d+)?)px\]/g) || [];
    for (const p of pham) {
      const px = Number(p.match(/([\d.]+)px/)[1]);
      assert.ok(px >= 14, `${f} có ${p}, dưới sàn 14px`);
    }
    assert.ok(!/\btext-xs\b/.test(s), `${f} còn text-xs (12px)`);
  }
});

test('§4.4 · không ghi thẳng style.fontSize — inline style vô hiệu hoá cả hệ bậc chữ', () => {
  for (const f of TEP_GIAO_DIEN) {
    const s = boChuThich(doc(f));
    assert.ok(!/style\.fontSize\s*=/.test(s), `${f} còn ghi style.fontSize`);
  }
});

test('§4.4 · sàn tiếp cận được nạp, và nằm trong APP_SHELL của service worker', () => {
  const html = doc('index.html');
  assert.match(html, /vung-cham-san\.css/);
  assert.match(html, /tokens\.css/);
  const sw = doc('public/sw.js');
  assert.match(sw, /'\/vung-cham-san\.css'/);
  // §4.3 — service worker KHÔNG được đệm kết quả phân tích.
  assert.match(sw, /startsWith\('\/api\/'\)/);
});

test('§4.5 · trang khai lang="vi", không phải "en"', () => {
  assert.match(doc('index.html'), /<html lang="vi">/);
});

// ══════════════════════════════════════════════════════════════════════════
// BỘ ĐO PHẢI THẬT SỰ ĐO
// ══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ `tsc --noEmit` TỪNG CHẠY XANH MÀ KHÔNG KIỂM GÌ Ở NỬA GIAO DIỆN.
 * Dự án không có `@types/react`, nên mọi prop, hook và sự kiện của React là
 * `any` ngầm. Một bộ đo báo "không có lỗi" trong khi nó không đo chính là dạng
 * lỗi dự án này đã bị cắn nhiều lần.
 */
test('bộ đo · có @types/react và tsconfig bật strict', () => {
  const pkg = JSON.parse(doc('package.json'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  assert.ok(deps['@types/react'], 'thiếu @types/react — tsc không kiểm được phần React');
  assert.ok(deps['@types/react-dom'], 'thiếu @types/react-dom');

  // tsconfig có chú thích khối nên không JSON.parse thẳng được.
  const ts = doc('tsconfig.json');
  for (const co of ['"strict": true', '"noUnusedLocals": true', '"noUncheckedIndexedAccess": true']) {
    assert.ok(ts.includes(co), `tsconfig thiếu ${co}`);
  }
});

/**
 * §4.3 — "hỏng thì người dùng thấy gì?" Nếu câu trả lời là "giống hệt lúc bình
 * thường" thì đó là bug. `speechApiSupported` từng được đặt `false` mà không màn
 * hình nào đọc tới, nên trên máy không nhận được giọng nói bác vẫn thấy đúng
 * dòng "Đang nghe bác nói".
 */
test('§4.3 · máy không chuyển được lời nói thành chữ thì màn hình nói ra', () => {
  const s = doc('src/App.tsx');
  assert.match(s, /!speechApiSupported/, 'không nơi nào đọc speechApiSupported');
});

/**
 * ⚠️ CHỈ ĐƯỢC CÓ MỘT BẢN `ma-hop-dong.json`.
 * Hai bản sẽ phân kỳ, và khi lệch thì `locTraLoiBoHoiNhanh()` ở máy chủ bỏ IM
 * LẶNG câu trả lời — không lỗi, không cảnh báo, chỉ là một lượt bị chấm hụt.
 * Bản gốc ở `src/config/`; `vite.config.ts` phát nó ra `/config/…` cho service
 * worker.
 */
test('§HĐ · chỉ một bản ma-hop-dong.json trong repo', () => {
  assert.ok(existsSync(path.join(GOC, 'src/config/ma-hop-dong.json')), 'thiếu bản gốc ở src/config');
  assert.ok(!existsSync(path.join(GOC, 'public/config/ma-hop-dong.json')),
    'có bản thứ hai trong public/ — hai bản sẽ phân kỳ im lặng');
});

/**
 * §11 — KHÔNG HỨA MẠNH HƠN SỰ THẬT VỀ ĐƯỜNG ĐI CỦA DỮ LIỆU.
 *
 * `LLM_CUC_BO=1` chỉ nói mô hình chạy CÙNG MÁY VỚI MÁY CHỦ. Nó KHÔNG nói người
 * dùng đang ngồi ở máy nào. Khi máy chủ được host cho người khác truy cập, câu
 * "nội dung không rời khỏi máy" là sai — nội dung rời khỏi điện thoại của họ.
 * Mặc định phải là câu YẾU HƠN; câu mạnh chỉ bật khi người triển khai khai rõ.
 */
test('§11 · chạy AI cục bộ mặc định KHÔNG hứa "không rời khỏi máy"', async () => {
  const { layCauHinh } = require(path.join(GOC, 'backend', 'src', 'ai', 'fable-client.js'));

  const mayChu = layCauHinh({ LLM_CUC_BO: '1' });
  assert.equal(mayChu.noiChay, 'tren_may_chu_tu_van_hanh',
    'mặc định phải là giả định an toàn hơn: máy chủ tự vận hành');

  const mayNguoiDung = layCauHinh({ LLM_CUC_BO: '1', LLM_CHAY_TREN_MAY_NGUOI_DUNG: '1' });
  assert.equal(mayNguoiDung.noiChay, 'tren_may_nguoi_dung');

  // Câu mạnh ("không rời khỏi máy") chỉ được gắn cho đúng một trạng thái.
  const cat = doc('src/catalog.ts');
  const khoiNoiChay = cat.slice(cat.indexOf('export const NOI_CHAY_AI'));
  const viTriCauManh = khoiNoiChay.indexOf('không rời khỏi máy');
  const viTriTrangThaiManh = khoiNoiChay.indexOf('tren_may_nguoi_dung');
  const viTriTrangThaiYeu = khoiNoiChay.indexOf('tren_may_chu_tu_van_hanh');
  assert.ok(viTriTrangThaiManh < viTriCauManh && viTriCauManh < viTriTrangThaiYeu,
    'câu "không rời khỏi máy" phải thuộc về tren_may_nguoi_dung, không phải trạng thái máy chủ');
});

/**
 * §4.3 — MÔ HÌNH KHÔNG NHÌN ĐƯỢC ẢNH THÌ MÀN HÌNH PHẢI NÓI RA.
 *
 * Mô hình chỉ-đọc-chữ (qwen2.5, llama3.1…) nhận khối `image_url` rồi lặng lẽ bỏ
 * qua nó — không lỗi, không cảnh báo. Nếu cứ gửi ảnh đi thì tầng sàn thấy có
 * trường `anh` và khai `daKiem: ['anh_ocr']`, tức màn hình nói "đã đọc chữ trong
 * ảnh" về một tấm ảnh chưa ai nhìn.
 *
 * Đây là loại lỗi chỉ lộ ra khi đổi sang mô hình cục bộ; mọi test chạy bằng văn
 * bản đều xanh trong khi nó đang sai.
 */
test('§4.3 · mô hình không có thị giác ⇒ ảnh vào chuaKiem, KHÔNG vào daKiem', async () => {
  const anh1px = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const cu = { ...process.env };
  try {
    process.env.LLM_CUC_BO = '1';
    delete process.env.LLM_CUC_BO_CO_THI_GIAC;
    const { than } = await goi('/api/analyze', { anh: anh1px });
    assert.ok(!than.daKiem.includes('anh_ocr'),
      'khai đã đọc chữ trong ảnh trong khi mô hình không nhìn được ảnh');
    assert.ok(than.chuaKiem.includes('khong_doc_duoc_anh'),
      'phải nói ra là chưa đọc được ảnh');
  } finally {
    process.env = cu;
  }
});

test('§4.3 · mặc định của đường cục bộ là KHÔNG có thị giác', () => {
  const { layCauHinh } = require(path.join(GOC, 'backend', 'src', 'ai', 'fable-client.js'));
  assert.equal(layCauHinh({ LLM_CUC_BO: '1' }).coThiGiac, false,
    'giả định an toàn hơn: chưa khai thì coi như mô hình không nhìn được ảnh');
  assert.equal(layCauHinh({ LLM_CUC_BO: '1', LLM_CUC_BO_CO_THI_GIAC: '1' }).coThiGiac, true);
});

/**
 * §4.6 — BÁO OAN LÀ THỨ ĐẮT NHẤT VỚI APP NÀY.
 *
 * Mô hình nhỏ chạy tại chỗ lấy một câu CÓ THẬT trong tin nhắn rồi dán sai nhãn
 * lên. `trichCoThat()` chỉ kiểm câu trích có tồn tại, không kiểm nó có đúng
 * nghĩa với nhãn — nên tín hiệu bịa đi thẳng qua.
 *
 * Đo 18/8/2026 với qwen2.5vl:7b: 3 trên 5 tin nhắn LÀNH bị báo động.
 */
test('§4.6 · bằng chứng không mang dấu hiệu của tín hiệu ⇒ loại tín hiệu đó', () => {
  const { analyze } = require(path.join(GOC, 'backend', 'src', 'analysis', 'pipeline.js'));
  const mk = (id, q) => ({
    id, state: 'present', confidence: 0.9, source: 'llm',
    evidence: [{ quote: q, start: 0, end: q.length, sourceId: 'van_ban' }],
  });

  // Tin nhắn ngân hàng thật + ba tín hiệu tài chính bịa hoàn toàn.
  const lanh = analyze({
    vanBan: 'BIDV: Tai khoan cua quy khach vua bi tru 500.000d. So du con lai 12.450.000d.',
    llmSignals: [
      mk('FIN_RECOVERY_FEE', 'Tai khoan cua quy khach vua bi tru 500.000d'),
      mk('FIN_CRYPTO_TRANSFER', 'So du con lai 12.450.000d'),
      mk('FIN_TRANSFER_REQUEST', 'vua bi tru 500.000d'),
    ],
  });
  assert.equal(lanh.nhan, 'CHUA_THAY', 'báo oan trên tin nhắn ngân hàng thật');
  assert.equal(lanh.maLyDo.length, 0);

  // ⚠️ VÀ HÀNG RÀO KHÔNG ĐƯỢC ĂN CẢ TÍN HIỆU THẬT. Đây mới là nửa nguy hiểm.
  const that = analyze({
    vanBan: 'Chào bác, tôi là công an. Bác chuyển 50 triệu vào tài khoản an toàn của cơ quan và đọc mã OTP cho tôi.',
    llmSignals: [
      mk('FIN_TRANSFER_REQUEST', 'chuyển 50 triệu vào tài khoản an toàn'),
      mk('CRED_OTP_SHARE', 'đọc mã OTP cho tôi'),
      mk('FIN_SAFE_ACCOUNT', 'tài khoản an toàn của cơ quan'),
    ],
  });
  assert.equal(that.nhan, 'CAO', 'hàng rào đã loại oan tín hiệu thật');
  assert.ok(that.maLyDo.includes('CRED_OTP_SHARE'));
  assert.ok(that.maLyDo.includes('FIN_SAFE_ACCOUNT'));
});

test('§4.3 · tín hiệu KHÔNG có mẫu trong locale pack thì đi qua như cũ', () => {
  const { bangChungMangDauHieu } = require(path.join(GOC, 'backend', 'src', 'analysis', 'evidence-validator.js'));
  const { packTheoNgonNgu } = require(path.join(GOC, 'backend', 'src', 'analysis', 'locale-pack-registry.js'));
  const pack = packTheoNgonNgu('vi');
  // Mã này cố ý không có trong directPatterns — không có gì để đối chiếu, nên
  // im lặng loại nó đi là tự bịt mắt mình.
  const tin = {
    id: 'CASE_REPEATED_CONTACT', source: 'llm',
    evidence: [{ quote: 'một câu bất kỳ' }],
  };
  assert.equal(bangChungMangDauHieu(tin, {}, pack), true);
});

/**
 * §4.3 — VECTOR HỎNG CÚ PHÁP LÀ MỘT LỖI IM LẶNG, VÀ NÓ ĐÃ XẢY RA THẬT.
 *
 * ĐO ĐƯỢC 19/8/2026 trên máy ảo Android 14. Cả BA biểu tượng lối tắt đều dùng
 * cú pháp arc nén của SVG — `a15.1 15.1 0 006.6 6.6`, trong đó `006.6` là hai
 * cờ `0 0` viết dính vào toạ độ `6.6`. Trình duyệt đọc được. Android thì không:
 *
 *     IllegalArgumentException: a needs to be followed by a multiple of 7
 *     floats. However, 5 float(s) are found.
 *
 * Và đây là phần đúng kiểu §4.3: KHÔNG CÓ GÌ BÁO LỖI Ở PHÍA NGƯỜI DÙNG. Gradle
 * dựng thành công, APK cài được, app mở bình thường. Chỉ có SystemUI — một tiến
 * trình khác — lặng lẽ bỏ qua biểu tượng, và hệ quả là:
 *
 *   · ba lối tắt giữ-biểu-tượng-app không có hình,
 *   · và THÔNG BÁO THƯỜNG TRỰC KHÔNG HIỆN LÊN THANH, vì `setSmallIcon` trỏ vào
 *     đúng một trong ba tệp đó.
 *
 * Cái thứ hai mới là cái nguy hiểm: bác bật công tắc "túc trực 24/7", tin rằng
 * có một lối tắt chờ sẵn lúc bị gọi thúc, và lúc cần thì trên thanh không có gì.
 *
 * ⚠️ THÊM VECTOR MỚI NÀO THÌ NÓ TỰ ĐỘNG ĐI QUA TEST NÀY. Đừng bỏ test đi khi
 * thấy nó chặn một tệp mới — hãy giãn cờ arc ra: `a 15.1 15.1 0 0 0 6.6 6.6`.
 */
test('§4.3 · vector drawable không dùng cú pháp arc nén (Android không đọc được)', () => {
  const goc = path.join(GOC, 'android/app/src/main/res');
  if (!existsSync(goc)) return;   // bản không kèm mã native

  const SO = /-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;
  const hong = [];

  const quet = (thuMuc) => {
    for (const ten of readdirSync(thuMuc)) {
      const duong = path.join(thuMuc, ten);
      if (statSync(duong).isDirectory()) { quet(duong); continue; }
      if (!ten.endsWith('.xml')) continue;
      const noi = readFileSync(duong, 'utf8');
      for (const m of noi.matchAll(/pathData="([^"]*)"/g)) {
        for (const a of m[1].matchAll(/[aA]([^a-zA-Z]*)/g)) {
          const n = (a[1].match(SO) || []).length;
          // Mỗi cung tròn cần đúng 7 tham số: rx ry xoay cờ cờ x y.
          if (n % 7 !== 0) hong.push(`${path.relative(goc, duong)} (${n} số)`);
        }
      }
    }
  };
  quet(goc);

  assert.deepEqual(
    hong, [],
    'Vector dùng cú pháp arc nén — Android ném IllegalArgumentException và bỏ qua ' +
    'biểu tượng trong im lặng. Giãn hai cờ ra: "a 4 4 0 0 0 -2 2".',
  );
});

/**
 * §4.3 — NGUỒN ĐẦU VÀO THỨ NĂM: TRẠNG THÁI MÁY.
 *
 * Ba ca phải KHÁC NHAU ở đầu ra, và đây là chỗ dễ gộp nhầm nhất:
 *
 *   · bản web (không gửi trường)   ⇒ không khai gì — KHÔNG được nói "đã kiểm"
 *   · APK nhưng không đọc được     ⇒ `chuaKiem`
 *   · APK, đọc được                ⇒ `daKiem`
 *
 * Gộp ca một với ca ba là lỗi §4.3 kinh điển: bản web không có cách nào nhìn
 * vào bên trong máy, mà Phiếu tin cậy lại khai "đã xem trạng thái máy".
 */
test('§4.3 · trạng thái máy — ba ca khác nhau, không gộp', async () => {
  const web = await goi('/api/analyze', { vanBan: 'Chào bác, con là con trai đây.' });
  assert.ok(!web.than.daKiem.includes('trang_thai_may'),
    'bản web không nhìn được vào trong máy, không được khai là đã xem');
  assert.ok(!web.than.chuaKiem.includes('chua_xem_duoc_trang_thai_may'),
    'bản web KHÔNG có tính năng này — nói "chưa xem được" là bịa ra một giới hạn không tồn tại');

  const hong = await goi('/api/analyze', {
    vanBan: 'Chào bác, con là con trai đây.',
    trangThaiMay: { docDuoc: false, soUngDungLa: 0, coCaiTrongTuan: false },
  });
  assert.ok(hong.than.chuaKiem.includes('chua_xem_duoc_trang_thai_may'),
    'không đọc được trạng thái máy thì PHẢI nói ra');
  assert.ok(!hong.than.daKiem.includes('trang_thai_may'));

  const oke = await goi('/api/analyze', {
    vanBan: 'Chào bác, con là con trai đây.',
    trangThaiMay: { docDuoc: true, soUngDungLa: 0, coCaiTrongTuan: false },
  });
  assert.ok(oke.than.daKiem.includes('trang_thai_may'),
    'đọc được thì khai là đã kiểm');
  assert.ok(!oke.than.chuaKiem.includes('chua_xem_duoc_trang_thai_may'));
});

/**
 * §4.2 — TRẠNG THÁI MÁY CHỈ ĐƯỢC LÀM TĂNG CẢNH GIÁC.
 *
 * ⚠️ MÁY SẠCH KHÔNG ĐƯỢC HẠ MỨC. Đây đúng là chỗ dễ "tối ưu" nhầm: thấy máy
 * không có ứng dụng lạ nào thì trừ điểm cho đỡ báo động giả. Làm vậy là tặng
 * kẻ lừa đảo một câu thần chú mới — chúng chỉ cần bảo nạn nhân gỡ app đi trước
 * khi kiểm, cùng bài học với "đừng tải trên CH Play" (§12).
 */
test('§4.2 · máy sạch KHÔNG hạ mức so với khi không gửi trạng thái máy', async () => {
  const tin = 'Toi la can bo Cong an. Bac chuyen 50 trieu vao tai khoan an toan va doc ma OTP ngay, khong duoc noi voi ai.';
  const khong = await goi('/api/analyze', { vanBan: tin });
  const sach = await goi('/api/analyze', {
    vanBan: tin,
    trangThaiMay: { docDuoc: true, soUngDungLa: 0, coCaiTrongTuan: false },
  });
  const bac = { CHUA_THAY: 0, NGHI_NGO: 1, CAO: 2 };
  assert.ok(bac[sach.than.nhan] >= bac[khong.than.nhan],
    `máy sạch làm tụt mức: ${khong.than.nhan} -> ${sach.than.nhan}`);
});

/**
 * §4.3 — ĐƯỜNG DỰ PHÒNG PHẢI DÙNG MODEL CỦA ĐÚNG NHÀ CUNG CẤP.
 *
 * Bẫy đặt ra ngày 19/8/2026 khi chuyển đường AI chính sang gateway: cấu hình
 * triển khai đặt `RISK_LLM_MODEL=gpt-5.4`, còn `GEMINI_API_KEY` giữ làm dự
 * phòng. Nhưng `model` đọc chung ở đầu hàm, nên nhánh Gemini nhận nguyên
 * `gpt-5.4` và Google trả 404 cho một tên model nó chưa từng có.
 *
 * Hỏng đúng lúc tệ nhất — đường dự phòng chỉ được dùng khi đường chính đã chết.
 * Và nhìn từ ngoài nó giống hệt "khoá Gemini sai" chứ không giống "tên model
 * của nhà cung cấp khác", nên rất dễ đi tìm nhầm chỗ.
 */
test('§4.3 · Gemini dự phòng không nhận model của gateway', () => {
  const { layCauHinh } = require(path.join(GOC, 'backend', 'src', 'ai', 'fable-client.js'));

  const duPhong = layCauHinh({ GEMINI_API_KEY: 'g', RISK_LLM_MODEL: 'gpt-5.4' });
  assert.equal(duPhong.noiChay, 'gemini');
  assert.ok(/^gemini/i.test(duPhong.model),
    `nhánh Gemini nhận model của nhà cung cấp khác: ${duPhong.model}`);

  // Gateway vẫn phải nhận đúng model được đặt cho nó.
  const chinh = layCauHinh({ LLM_API_BASE: 'https://x/v1', LLM_API_KEY: 'k', RISK_LLM_MODEL: 'gpt-5.4' });
  assert.equal(chinh.noiChay, 'gateway');
  assert.equal(chinh.model, 'gpt-5.4');

  // Và vẫn đè được khi Google đổi tên model.
  const de = layCauHinh({ GEMINI_API_KEY: 'g', GEMINI_MODEL: 'gemini-2.0-flash' });
  assert.equal(de.model, 'gemini-2.0-flash');
});

/**
 * §6.10 — TẦNG LUẬT PHẢI ĐỨNG MỘT MÌNH ĐƯỢC, KỂ CẢ VỚI TIẾNG VIỆT KHÔNG DẤU.
 *
 * ĐO ĐƯỢC 19/8/2026. `chuanHoa()` gỡ dấu ngăn hàng nghìn bằng
 * `(?<=\d)[.,](?=\d{3})`. Ranh giới từ `` phân biệt chữ ASCII với chữ
 * khác, nên cùng một số tiền cho hai kết quả khác nhau:
 *
 *     "1.200.000đ"  ->  1200000đ    (đ không phải chữ ASCII)
 *     "1.200.000d"  ->  1200.000d   (d là chữ ASCII — CÒN SÓT dấu chấm)
 *
 * Dấu chấm còn sót chặn ngang `[^.]{0,N}` của gần như mọi mẫu trong cue bank,
 * nên toàn bộ tầng luật mù với tin nhắn viết KHÔNG DẤU có kèm số tiền — mà
 * không dấu chính là cách tin nhắn lừa đảo hay được viết nhất.
 *
 * Hệ quả đo được: ca "việc nhẹ lương cao" (nạp 1.200.000d làm nhiệm vụ) trước
 * đây tầng luật câm hoàn toàn, và cả gpt-5.4 lẫn qwen đều bỏ sót nốt — tức là
 * không lớp nào bắt được. Sau khi vá, tầng luật ra CAO trong 0,02 giây.
 */
test('§6.10 · tầng luật bắt được số tiền viết KHÔNG DẤU', async () => {
  const { chuanHoa } = require(path.join(GOC, 'backend', 'src', 'analysis', 'context-builder.js'));

  assert.equal(chuanHoa('nap 1.200.000d'), 'nap 1200000d',
    'dấu ngăn hàng nghìn còn sót khi đơn vị viết không dấu');
  assert.equal(chuanHoa('nap 1.200.000đ'), 'nap 1200000đ');
  // Ngày tháng KHÔNG được gộp — "19.8.2026" không phải số tiền.
  assert.equal(chuanHoa('ngay 19.8.2026'), 'ngay 19.8.2026');

  const tin = 'Chi oi ben em tuyen CTV lam nhiem vu don hang, hoa hong 15%. '
    + 'Chi nap 1.200.000d lam nhiem vu cuoi la rut duoc ca von lan thuong ngay a';
  const { than } = await goi('/api/analyze/so-bo', { vanBan: tin });
  assert.ok(['CAO', 'NGHI_NGO'].includes(than.nhan),
    `tầng luật bỏ sót kịch bản "việc nhẹ lương cao" viết không dấu: ${than.nhan}`);

  // Và KHÔNG được kéo theo báo oan: tin ngân hàng thật cũng có số tiền như thế.
  const lanh = await goi('/api/analyze/so-bo', {
    vanBan: 'Tai khoan cua quy khach vua bi tru 1.200.000d. So du con lai 3.450.000d.',
  });
  assert.equal(lanh.than.nhan, 'CHUA_THAY',
    'gom số tiền không được biến tin nhắn ngân hàng thật thành cảnh báo');
});

/**
 * §6.7 — `/api/analyze/so-bo` LÀ ĐƯỜNG DỰ PHÒNG, NÓ KHÔNG ĐƯỢC NÉM 500.
 *
 * Route này là handler RIÊNG, không nằm trong `xuLyPhanTich`. Khi thêm nguồn
 * đầu vào `trangThaiMay` (19/8/2026), dòng gọi `analyze()` ở đây được sửa theo
 * nhưng biến thì khai bên handler kia — `ReferenceError` ⇒ HTTP 500.
 *
 * Hỏng đúng chỗ tệ nhất: giao diện gọi route này KHI `/api/analyze` đã lỗi. Cả
 * hai cùng chết thì màn kết quả rơi về `khongGoiDuocMayChu`, và bác không có
 * cách nào biết là do một biến chưa khai.
 */
test('§6.7 · /api/analyze/so-bo nhận đủ mọi trường mà /api/analyze nhận', async () => {
  const day = {
    vanBan: 'Bac chuyen 50 trieu vao tai khoan an toan',
    trangThaiMay: { docDuoc: true, soUngDungLa: 1, coCaiTrongTuan: true },
    traLoiBoHoiNhanh: {},
    ghiAm: false,
  };
  const { ma } = await goi('/api/analyze/so-bo', day);
  assert.notEqual(ma, 500, 'đường dự phòng ném 500 khi nhận đủ trường của đường chính');
  assert.equal(ma, 200);
});

/**
 * §6.10 — CÙNG MỘT VỤ LỪA, HAI NGÔN NGỮ PHẢI CHO CÙNG KẾT QUẢ.
 *
 * Đo được 19/8/2026: hai pack lệch nhau ở cả hai chiều, và mỗi chiều đều tạo
 * ra một lỗ thật.
 *
 *   · `OFF_ADVANCE_FEE` và `OFF_TASK_PREPAY` KHÔNG CÓ mẫu nào ở en-US, nên
 *     kịch bản "việc nhẹ lương cao" viết bằng tiếng Anh lọt hoàn toàn.
 *   · `FIN_TRANSFER_REQUEST` bên vi-VN bắt được số tiền viết trần
 *     ("nạp 1.200.000d") còn en-US thì đòi dấu `$` hoặc chữ "money" — mà tin
 *     nhắn nhắm vào người Việt, dù viết tiếng Anh, gần như luôn ghi số trần.
 *   · Ngược lại, `DEV_INSTALL_APK_UNKNOWN` bên vi-VN chỉ nhận "qua link" nên
 *     "tải ứng dụng TẠI link…" lọt, trong khi en-US bắt được ngay.
 *
 * Ba lỗ, cùng một nguyên nhân: hai pack được viết ở hai thời điểm khác nhau và
 * không ai so chúng với nhau. Test này là chỗ so.
 */
test('§6.10 · hai pack ngôn ngữ phủ cùng một tập tín hiệu', () => {
  const vi = require(path.join(GOC, 'backend', 'src', 'analysis', 'locale-packs', 'vi-VN.js'));
  const en = require(path.join(GOC, 'backend', 'src', 'analysis', 'locale-packs', 'en-US.js'));

  const kvi = Object.keys(vi.directPatterns);
  const ken = Object.keys(en.directPatterns);

  const thieuEn = kvi.filter((k) => !ken.includes(k));
  const thieuVi = ken.filter((k) => !kvi.includes(k));

  /*
   * ⚠️ DANH SÁCH NGOẠI LỆ CHỈ ĐƯỢC NHỎ ĐI. Mỗi mã ở đây là một kịch bản mà một
   * ngôn ngữ bắt được còn ngôn ngữ kia thì không — tức một nửa người dùng
   * không được bảo vệ. Thêm mã vào đây là hợp thức hoá một lỗ.
   */
  const CHAP_NHAN_LECH = ['CRED_CARD_SECRET', 'DEV_ACCESSIBILITY_PERMISSION'];

  assert.deepEqual(thieuEn.filter((k) => !CHAP_NHAN_LECH.includes(k)), [],
    `tín hiệu có mẫu ở vi-VN nhưng THIẾU ở en-US: ${thieuEn.join(', ')}`);
  assert.deepEqual(thieuVi.filter((k) => !CHAP_NHAN_LECH.includes(k)), [],
    `tín hiệu có mẫu ở en-US nhưng THIẾU ở vi-VN: ${thieuVi.join(', ')}`);
});

/**
 * Cùng nội dung, hai ngôn ngữ, tầng luật thuần phải cùng phát hiện.
 *
 * ⚠️ CHẠY TRÊN `/api/analyze/so-bo` — KHÔNG AI. Nếu để AI chạy thì test này đo
 * model chứ không đo bộ luật, và nó sẽ đỏ hoặc xanh tuỳ nhà cung cấp hôm đó
 * có sống hay không.
 */
test('§6.10 · tầng luật bắt được cùng kịch bản ở cả hai ngôn ngữ', async () => {
  const cap = [
    {
      ten: 'việc nhẹ lương cao / task prepay',
      vi: 'Chi oi ben em tuyen CTV lam nhiem vu don hang, hoa hong 15%. '
        + 'Chi nap 1.200.000d lam nhiem vu cuoi la rut duoc ca von lan thuong ngay a',
      en: 'Hi, we are recruiting part time helpers to complete simple order tasks, 15% commission. '
        + 'Just top up 1,200,000 for the final task and you can withdraw both your capital and the bonus right away.',
    },
    {
      ten: 'giả danh điện lực / utility impersonation',
      vi: 'Thong bao: Hoa don dien thang nay cua quy khach qua han. '
        + 'Vui long tai ung dung tai link evn-thanhtoan.xyz de thanh toan trong 2 gio, neu khong se bi cat dien.',
      en: 'Notice from the Electricity Department: your household has an unpaid bill and power will be cut off '
        + 'within 2 hours. Please install our support app from this link and pay right away to avoid disconnection.',
    },
  ];

  for (const c of cap) {
    for (const ngonNgu of ['vi', 'en']) {
      const { than } = await goi('/api/analyze/so-bo', { vanBan: c[ngonNgu] });
      assert.ok(['CAO', 'NGHI_NGO'].includes(than.nhan),
        `[${ngonNgu}] tầng luật bỏ sót "${c.ten}": ${than.nhan}`);
    }
  }

  // Và tin nhắn lành ở cả hai ngôn ngữ vẫn phải sạch.
  for (const lanh of [
    'Me oi chieu nay con qua don me di kham, me nho mang the bao hiem nhe',
    'Mum, I will pick you up this afternoon for the check up, remember to bring your health insurance card.',
    'Tai khoan cua quy khach vua bi tru 1.200.000d. So du con lai 3.450.000d.',
    'Your account has been debited 1,200,000. Remaining balance 3,450,000.',
  ]) {
    const { than } = await goi('/api/analyze/so-bo', { vanBan: lanh });
    assert.equal(than.nhan, 'CHUA_THAY', `báo oan tin nhắn lành: "${lanh.slice(0, 45)}…"`);
  }
});

/**
 * ══════ BỘ 100 TÌNH HUỐNG — HÀNG RÀO CHỐNG THỤT LÙI ══════
 *
 * ⚠️ VÌ SAO CẦN BỘ LỚN: bộ thử cũ có 10 mẫu và cho 5/5 — nhìn như đã xong.
 * Bộ 100 cho 30/50 ở lần đo đầu (60%). Chênh lệch đó không phải vì bộ luật
 * kém đi, mà vì 10 mẫu không đủ để thấy mình đang mù ở đâu.
 *
 * ⚠️ GỌI `analyze()` TRỰC TIẾP, KHÔNG QUA HTTP. Máy chủ giới hạn 30 lượt/phút;
 * 100 lượt qua HTTP thì phần lớn trả 429, và nếu không kiểm mã lỗi thì chúng
 * trông y hệt "bỏ sót" — một phép đo báo sai theo hướng nguy hiểm nhất: làm bộ
 * luật trông tệ hơn thực tế rồi dẫn tới việc nới mẫu cho đến khi báo oan.
 *
 * ⚠️ HAI NGƯỠNG BẤT ĐỐI XỨNG, VÀ ĐÓ LÀ CHỦ Ý:
 *   · bắt được ≥ 75%  — sàn, có thể còn tăng
 *   · báo oan  ≤ 2%   — trần rất chặt
 * Bỏ sót một tin lừa đảo là mất một cơ hội cảnh báo. Báo oan một tin lành là
 * dạy bác bỏ qua cảnh báo — và lần đúng tiếp theo cũng bị bỏ qua theo (§4.6).
 * Hai loại sai này không cùng giá.
 */
test('§6.10 · bộ 100 tình huống — tầng luật giữ được mức đã đo', () => {
  const { analyze } = require(path.join(GOC, 'backend', 'src', 'analysis', 'pipeline.js'));
  const bo = JSON.parse(readFileSync(
    path.join(GOC, 'test', 'du-lieu', 'tinh-huong-100.json'), 'utf8'));
  const th = bo.tinhHuong;

  assert.equal(th.length, 100, 'bộ thử phải có đúng 100 tình huống');

  const BAC = { NO_SIGNS_FOUND: 0, SUSPICIOUS: 1, HIGH: 2 };
  let luaDao = 0; let batDuoc = 0; let lanh = 0; let baoOan = 0;
  const sot = []; const oan = [];

  for (const x of th) {
    const kq = analyze({ vanBan: x.noiDung });
    const muc = BAC[kq.riskLabel] ?? 0;
    if (x.nhom === 'lua_dao') {
      luaDao += 1;
      if (muc >= 1) batDuoc += 1; else sot.push(x.ma);
    } else {
      lanh += 1;
      if (muc >= 1) { baoOan += 1; oan.push(`${x.ma} → ${kq.riskLabel}`); }
    }
  }

  const tiLeBat = (batDuoc / luaDao) * 100;
  const tiLeOan = (baoOan / lanh) * 100;

  assert.ok(tiLeOan <= 2,
    `BÁO OAN vượt trần 2%: ${baoOan}/${lanh} (${tiLeOan.toFixed(0)}%) — ${oan.join(', ')}`);
  assert.ok(tiLeBat >= 75,
    `BẮT ĐƯỢC tụt dưới sàn 75%: ${batDuoc}/${luaDao} (${tiLeBat.toFixed(0)}%) — bỏ sót: ${sot.join(', ')}`);
});

/**
 * ⚠️ NỬA LÀNH CỦA BỘ THỬ PHẢI KHÓ, KHÔNG ĐƯỢC HIỀN.
 *
 * Một bộ thử toàn tin lành hiền lành ("con chào mẹ") thì tỉ lệ báo oan luôn 0%
 * và con số đó không nói lên điều gì. Test này đếm xem nửa lành có thật sự
 * chứa những thứ TRÔNG GIỐNG dấu hiệu hay không: số tiền, chữ gấp, đường link,
 * mã OTP, tên cơ quan.
 *
 * Nếu ai đó làm đẹp số liệu bằng cách thêm tin lành dễ, test này đỏ.
 */
test('§6.10 · nửa lành của bộ 100 đủ khó để phép đo có nghĩa', () => {
  const bo = JSON.parse(readFileSync(
    path.join(GOC, 'test', 'du-lieu', 'tinh-huong-100.json'), 'utf8'));
  const lanh = bo.tinhHuong.filter((x) => x.nhom === 'lanh');

  /*
   * ⚠️ NHẬN CẢ DẠNG KHÔNG DẤU. Bộ thử cố ý trộn hai lối viết, nên một biểu
   * thức chỉ có chữ có dấu sẽ đếm hụt gần một nửa và báo bộ thử "quá hiền"
   * trong khi nó không hề hiền.
   */
  const KHO = new RegExp([
    '\\\\d[\\\\d.,]{3,}',                       // số tiền
    'g[âa]p|ngay|h[ôo]m nay|tr[ưu][ơo]c',    // gấp gáp
    'link|http',                             // đường dẫn
    'otp|m[ãa] x[áa]c',                      // mã xác thực
    'ng[âa]n h[àa]ng|c[ôo]ng an|thu[êe]|[đd]i[ệe]n l[ựu]c|b[ảa]o hi[ểe]m',
    'chuy[ểe]n|n[ộo]p|[đd][óo]ng|thanh to[áa]n',
  ].join('|'), 'i');
  const soKho = lanh.filter((x) => KHO.test(x.noiDung)).length;
  const tiLe = (soKho / lanh.length) * 100;

  assert.ok(tiLe >= 60,
    `chỉ ${soKho}/${lanh.length} (${tiLe.toFixed(0)}%) tin lành có yếu tố dễ gây báo oan — `
    + 'bộ thử quá hiền, tỉ lệ báo oan 0% sẽ không chứng minh được gì');
});

/**
 * ══════ KHUNG ĐIỆN THOẠI TRÊN MÀN HÌNH RỘNG ══════
 *
 * Ban giám khảo mở bản demo trên máy tính, nên thứ họ thấy phải là giao diện
 * điện thoại thật — không phải bố cục máy tính bị bóp vào một cột hẹp.
 *
 * ⚠️ HAI LẦN ĐÃ HỎNG Ở ĐÚ NG CHỖ NÀY, GHI LẠI ĐỂ KHÔNG HỎNG LẦN BA:
 *
 * 1. Bọc bằng CSS (`#root { width: 390px }`). Không đủ: 285 lớp `sm:`/`md:`/`lg:`
 *    của Tailwind là media query, mà media query đo **cửa sổ trình duyệt** chứ
 *    không đo khối chứa. Kết quả: chữ rơi dọc từng ký tự.
 *    → Phải là <iframe>, vì chỉ iframe mới có viewport riêng.
 *
 * 2. Có iframe rồi nhưng CSP để `frame-ancestors 'none'`. Trình duyệt chặn
 *    thẳng, và chặn **im lặng**: viền máy vẫn vẽ đủ, bên trong trống trơn.
 *    → Test `§6.8` chốt `'self'`. Đừng đổi nó về `'none'` để "chặt hơn".
 */
test('§6.9 · khung điện thoại dùng iframe, không dùng CSS bóp #root', () => {
  const khung = readFileSync(path.join(GOC, 'src', 'khung-dien-thoai.ts'), 'utf8');
  assert.match(khung, /createElement\('iframe'\)/,
    'khung phải dựng bằng <iframe> — xem khối chú thích đầu tệp trước khi đổi');
  assert.match(khung, /allow\s*=\s*'[^']*microphone/,
    'thiếu allow="microphone" — nút "Bấm để nói" sẽ chết lặng trong iframe');

  const css = readFileSync(path.join(GOC, 'src', 'index.css'), 'utf8');
  const khoiCSS = css.replace(/\/\*[\s\S]*?\*\//g, '');   // bỏ chú thích trước khi soi
  assert.ok(!/@media[^{]*min-width:\s*9\d\dpx/.test(khoiCSS),
    'index.css đã bọc lại khung bằng media query — cách đó không dùng được, xem src/khung-dien-thoai.ts');
});

/**
 * Vào thẳng `?khung=1` thì KHÔNG được bọc thêm một lần nữa. Bọc lồng nghĩa là
 * hai bản app cùng chạy: hai service worker, hai bộ localStorage ghi đè nhau, hai
 * lượt gọi `/api/analyze` cho một tin nhắn.
 */
test('§6.9 · khung tự nhận ra mình đang ở trong khung', () => {
  const khung = readFileSync(path.join(GOC, 'src', 'khung-dien-thoai.ts'), 'utf8');
  assert.match(khung, /window\.self\s*!==\s*window\.top/, 'thiếu chốt chống bọc lồng');
  assert.match(khung, /searchParams\.set\(DAU_TRONG_KHUNG/, 'thiếu dấu đánh khung trên URL');
  const main = readFileSync(path.join(GOC, 'src', 'main.tsx'), 'utf8');
  assert.match(main, /if\s*\(!dungKhungDienThoai\(\)\)/,
    'main.tsx phải bỏ qua việc gắn React khi trang ngoài chỉ là cái vỏ máy');
});

/**
 * KHÓA TRÙNG TRONG LOCALE PACK — MẤT MẪU MÀ KHÔNG AI BIẾT.
 *
 * Đo 20/8/2026: `DEV_ACCESSIBILITY_PERMISSION` bị khai hai lần trong `en-US.js`.
 * JavaScript không báo lỗi — nó lấy bản sau và vứt bản trước, nên mẫu
 * "accessibility service" biến mất khỏi tầng luật.
 *
 * ⚠️ TEST "hai pack phủ cùng tập tín hiệu" KHÔNG BẮT ĐƯỢC CA NÀY, vì nó hỏi
 * object đã dựng xong — lúc đó khóa trùng đã gộp mất rồi. Phải soi MÃ NGUỒN.
 * Đó cũng là lý do test này đọc trên văn bản chứ không `import`.
 */
test('§6.10 · locale pack không có khóa tín hiệu trùng', () => {
  /*
   * ⚠️ PHẢI SOI THEO TỪNG OBJECT, KHÔNG SOI CẢ TỆP MỘT LƯỢT.
   * Mỗi pack có nhiều object con (`directPatterns`, `suppressors`, …) và cùng
   * một mã tín hiệu XUẤT HIỆN Ở NHIỀU OBJECT LÀ ĐÚNG: `FIN_TRANSFER_REQUEST`
   * vừa có mẫu nhận dạng, vừa có mẫu triệt tiêu. Soi cả tệp một lượt thì bốn
   * cặp hợp lệ đó bị báo là trùng — đã đo 20/8/2026.
   */
  for (const ten of ['vi-VN', 'en-US']) {
    const ma = readFileSync(
      path.join(GOC, 'backend', 'src', 'analysis', 'locale-packs', `${ten}.js`), 'utf8');

    // Cắt tệp theo các object con khai ở mức thụt 2 dấu cách: `  directPatterns: {`
    const moc = [...ma.matchAll(/^ {2}([a-zA-Z][\w]*):\s*\{/gm)];
    assert.ok(moc.length >= 2, `${ten}.js chỉ soi ra ${moc.length} object con — biểu thức soi đã hỏng`);

    let tongKhoa = 0;
    for (let k = 0; k < moc.length; k += 1) {
      const dau = moc[k].index;
      const cuoi = k + 1 < moc.length ? moc[k + 1].index : ma.length;
      const khoa = [...ma.slice(dau, cuoi).matchAll(/^ {4}([A-Z][A-Z0-9_]{3,}):/gm)].map((m) => m[1]);
      tongKhoa += khoa.length;

      const dem = new Map();
      for (const x of khoa) dem.set(x, (dem.get(x) || 0) + 1);
      const trung = [...dem].filter(([, n]) => n > 1).map(([x, n]) => `${x} (×${n})`);
      assert.deepEqual(trung, [],
        `${ten}.js → ${moc[k][1]} khai trùng khóa: ${trung.join(', ')}`
        + ' — JavaScript lặng lẽ lấy bản sau và vứt bản trước');
    }
    assert.ok(tongKhoa > 20, `${ten}.js chỉ soi ra ${tongKhoa} khóa — biểu thức soi đã hỏng`);
  }
});

/**
 * ĐƯỜNG DỰ PHÒNG CUỐI CÙNG PHẢI CÓ NGÂN SÁCH RIÊNG.
 *
 * Đo trên bản chạy thật 20/8/2026, sau khi đặt `LLM_TIMEOUT_MS=20000` để cắt
 * gateway lúc nó treo: cùng biến đó cắt luôn Gemini ở đường dự phòng, mà Gemini
 * cần ~28,8s. Kết quả đo được: `aiDaChay: false` sau 37 giây chờ — bác chờ LÂU
 * HƠN trước khi "tối ưu", và còn MẤT luôn tầng AI.
 *
 * Bài học: trần chờ của đường chính nghĩa là "bỏ sớm để còn kịp thử đường
 * khác". Đường cuối không còn gì để kịp, nên nó không được thừa trần đó.
 */
test('§6.7 · trần chờ đường chính KHÔNG cắt luôn đường dự phòng cuối', () => {
  const { layCacDuong } = require(path.join(GOC, 'backend', 'src', 'ai', 'fable-client.js'));
  const duong = layCacDuong({
    LLM_API_BASE: 'https://vi-du.test/v1',
    LLM_API_KEY: 'không-phải-khoá-thật',
    RISK_LLM_MODEL: 'gpt-5.4',
    GEMINI_API_KEY: 'không-phải-khoá-thật',
    LLM_TIMEOUT_MS: '20000',
  });

  const chinh = duong.find((d) => !d.laDuPhong);
  const cuoi = duong[duong.length - 1];
  assert.ok(chinh && cuoi && chinh !== cuoi, 'phải dựng được cả đường chính lẫn đường dự phòng');

  assert.equal(chinh.timeout, 20_000, 'LLM_TIMEOUT_MS phải áp cho đường chính');
  assert.ok(cuoi.timeout > 20_000,
    `đường dự phòng cuối đang thừa trần của đường chính (${cuoi.timeout}ms) — `
    + 'gateway hỏng thì Gemini cũng bị bỏ theo, bác chờ lâu hơn mà vẫn không có AI');

  // Đặt riêng thì phải đổi được — không phải số cứng.
  const duong2 = layCacDuong({
    LLM_API_BASE: 'https://vi-du.test/v1',
    LLM_API_KEY: 'x',
    GEMINI_API_KEY: 'y',
    LLM_TIMEOUT_MS: '20000',
    GEMINI_TIMEOUT_MS: '30000',
  });
  assert.equal(duong2[duong2.length - 1].timeout, 30_000, 'GEMINI_TIMEOUT_MS phải đổi được trần');
});

/**
 * TẮT PHẦN NGHIĨ THÌ PHẢI TẮT CẢ `reasoning_effort` — KHÔNG PHẢI MỘT, LÀ HAI.
 *
 * Đo 20/8/2026 trên gateway `api.ai-box.vn`, cùng một lời nhắc thật:
 *
 *   để nguyên                                22,05s — sinh 4.084 token
 *   enable_thinking:false                     2,03s — sinh   169 token
 *   enable_thinking:false + reasoning_effort 30,17s — sinh 3.569 token
 *
 * Dòng thứ ba là cái bẫy: `reasoning_effort` BẬT LẠI phần nghĩ dù đã tắt, và mã
 * này **đang gửi nó sẵn** cho đường chính. Ai đó thêm lại một dòng
 * `mucSuyLuan = 'low'` vì thấy "để undefined nhìn như thiếu sót" là app chậm gấp
 * 11 lần, không lỗi nào, không test nào đỏ. Test này là cái đỏ đó.
 */
test('§6.7 · mô học vừa nghĩ vừa trả lời: tắt nghĩ thì không gửi reasoning_effort', () => {
  const { layCauHinh, nenTatSuyNghi } = require(path.join(GOC, 'backend', 'src', 'ai', 'fable-client.js'));
  const nen = (model, them = {}) => layCauHinh({
    LLM_API_BASE: 'https://vi-du.test/v1', LLM_API_KEY: 'x', RISK_LLM_MODEL: model, ...them });

  for (const m of ['qwen3.7-flash', 'qwen3.8-max', 'glm-5.2', 'deepseek-v4-flash', 'kimi-k3']) {
    const c = nen(m);
    assert.equal(c.tatSuyNghi, true, `${m} thuộc họ vừa nghĩ vừa trả lời, phải tắt phần nghĩ`);
    assert.equal(c.mucSuyLuan, undefined,
      `${m} tắt nghĩ nhưng vẫn gửi reasoning_effort=${c.mucSuyLuan} — tham số này BẬT LẠI phần nghĩ`);
  }

  // Mô hình không thuộc họ đó thì giữ nguyên nếp cũ — đừng tự động gửi tham số lạ.
  for (const m of ['gpt-5.4', 'gemini-3.6-flash']) {
    const c = nen(m);
    assert.equal(c.tatSuyNghi, false, `${m} không thuộc họ này, đừng gửi enable_thinking`);
    assert.equal(c.mucSuyLuan, 'low');
  }

  // Phải đè được bằng biến, cho mô hình ngoài danh sách hoặc nhà cung cấp không hiểu.
  assert.equal(nenTatSuyNghi('gpt-5.4', { LLM_TAT_SUY_NGHI: '1' }), true);
  assert.equal(nenTatSuyNghi('qwen3.7-flash', { LLM_TAT_SUY_NGHI: '0' }), false);
});
