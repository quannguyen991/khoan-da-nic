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
  assert.match(csp, /frame-ancestors 'none'/);
  // img-src KHÔNG được mở cho https: bên ngoài — ảnh từ máy chủ lạ là một lượt
  // gọi ra ngoài mỗi lần bác mở app.
  assert.ok(!/img-src[^;]*https:/.test(csp), 'img-src đã mở cho máy chủ ngoài');
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
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
