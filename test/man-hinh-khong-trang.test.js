'use strict';
/**
 * BẤM MỖI NÚT CHÍNH MỘT LẦN, VÀ MÀN HÌNH PHẢI CÒN ĐÓ.
 *
 * ⚠️ ĐÂY LÀ TEST DUY NHẤT TRONG BỘ NÀY THẬT SỰ DỰNG REACT. Mọi test khác chỉ
 * ĐỌC MÃ NGUỒN, và đó là lý do hai lỗi làm TRẮNG CẢ APP đã lọt tới bản web
 * thật trong khi `npm test` xanh 100%:
 *
 *   · `ReferenceError: superBasic is not defined` — bấm "Tìm kiếm" là mất sạch
 *     màn hình.
 *   · `TypeError: Cannot read properties of null (reading 'name')` — bấm nút
 *     bóng nổi khi chưa có người thân. Đã đo trên bản dựng thật: 0 nút, 0 chữ.
 *
 * Cả hai đều là lỗi LÚC CHẠY. `test/bien-dich-khong-loi.test.js` bắt được lớp
 * lỗi kiểu, nhưng trình biên dịch không biết một nút bấm vào thì ra gì.
 *
 * ⚠️ GIEO `familyMembers: []` LÀ CÓ CHỦ Ý, KHÔNG PHẢI CHO NHANH. Danh sách rỗng
 * là trạng thái của một máy VỪA CÀI — và đúng là trạng thái duy nhất làm lộ cả
 * hai lỗi trên. Gieo sẵn vài người thân giả thì test này xanh vĩnh viễn mà
 * không canh được gì. Ai sửa dòng đó thì đọc lại đoạn này trước.
 *
 * ⚠️ ĐÂY LÀ PHÉP THỬ KHÓI, KHÔNG PHẢI TEST GIAO DIỆN. Nó trả lời đúng một câu:
 * "bấm vào có sập không". Nó KHÔNG kiểm bố cục, màu, cỡ chạm hay chữ hiển thị —
 * những thứ đó có test riêng (§4.4, §4.1). Đừng nhét thêm việc vào đây.
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const GOC = path.join(__dirname, '..');
const THU_MUC_GOI = path.join(GOC, 'node_modules', '.cache', 'khoan-da-khoi-dong');
const TEP_GOI = path.join(THU_MUC_GOI, 'app.cjs');

/** Thiếu phụ thuộc thì BỎ QUA CÓ THÔNG BÁO — đừng báo đỏ oan, cũng đừng im. */
function thieuGi() {
  for (const g of ['jsdom', 'esbuild', 'react', 'react-dom']) {
    if (!fs.existsSync(path.join(GOC, 'node_modules', g))) return `chưa cài ${g}`;
  }
  return false;
}
const BO_QUA = thieuGi();

/** Tính một lần ở cửa sổ đầu, rồi mọi cửa sổ sau gán lại đúng danh sách này. */
let KHOA_TRINH_DUYET = null;

/**
 * Gói `src/App.tsx` thành CJS để `require` được.
 *
 * ⚠️ `react` PHẢI Ở NGOÀI GÓI. Nhúng nó vào thì trong tiến trình có HAI bản
 * React, và `react-dom` gọi hook của bản kia — ra
 * `Cannot read properties of null (reading 'useState')`, một lỗi trông y hệt
 * lỗi thật của app nhưng do chính bộ đo gây ra.
 *
 * ⚠️ VÀ GÓI PHẢI NẰM TRONG `node_modules`. Để ngoài dự án thì `require('react')`
 * từ trong gói không phân giải được.
 */
function goiApp() {
  const esbuild = require(path.join(GOC, 'node_modules', 'esbuild'));
  fs.mkdirSync(THU_MUC_GOI, { recursive: true });
  esbuild.buildSync({
    entryPoints: [path.join(GOC, 'src', 'App.tsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile: TEP_GOI,
    jsx: 'automatic',
    absWorkingDir: GOC,
    external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"test"' },
    loader: { '.css': 'empty', '.webp': 'empty', '.png': 'empty', '.jpg': 'empty', '.svg': 'empty' },
    logLevel: 'silent',
  });
}

/**
 * Dựng một cửa sổ jsdom và phơi global cho React.
 * Trả về `{ w, loi }` — `loi` gom mọi lỗi ném ra trong lúc dựng và bấm.
 */
function dungCuaSo() {
  const { JSDOM } = require(path.join(GOC, 'node_modules', 'jsdom'));
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
    { url: 'http://localhost/', pretendToBeVisual: true });
  const w = dom.window;

  /*
   * ⚠️ ĐẶT QUA `defineProperty`, KHÔNG GÁN THẲNG. Node 24 khai `globalThis.navigator`
   * là getter chỉ đọc, nên `global.navigator = ...` trong chế độ strict ném
   * `Cannot set property navigator of #<Object> which has only a getter`.
   */
  const dat = (k, v) => {
    try { global[k] = v; } catch { /* rơi xuống defineProperty */ }
    if (global[k] !== v) {
      try { Object.defineProperty(global, k, { value: v, configurable: true, writable: true }); }
      catch { /* không đặt được thì thôi — app sẽ tự báo nếu thật sự cần */ }
    }
  };

  /*
   * ⚠️ GHI ĐÈ MỖI LẦN DỰNG CỬA SỔ MỚI — ĐỪNG "BỎ QUA KHOÁ ĐÃ CÓ".
   *
   * Bản trước bỏ qua khoá đã nằm trong `global`. Nhưng test sau đóng cửa sổ của
   * test trước, nên `global.Image` vẫn trỏ vào cửa sổ ĐÃ ĐÓNG và `new Image()`
   * ném `Cannot read properties of undefined (reading 'createElement')` — một
   * lỗi của bộ đo, trông hệt lỗi của app.
   *
   * Danh sách khoá tính MỘT LẦN từ cửa sổ đầu (khoá nào của trình duyệt mà Node
   * không có sẵn), rồi mọi cửa sổ sau đều gán lại đúng danh sách đó.
   */
  if (KHOA_TRINH_DUYET === null) {
    const KHONG_DE = new Set(['global', 'globalThis', 'process', 'require', 'module', 'exports',
      'Buffer', 'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate']);
    KHOA_TRINH_DUYET = Object.getOwnPropertyNames(w).filter((k) => {
      if (KHONG_DE.has(k)) return false;
      if (['window', 'document', 'navigator'].includes(k)) return true;
      return !(k in global) || global[k] === undefined;
    });
  }
  for (const k of KHOA_TRINH_DUYET) dat(k, w[k]);
  dat('window', w);
  dat('document', w.document);
  dat('navigator', w.navigator);
  global.IS_REACT_ACT_ENVIRONMENT = true;

  /*
   * GIẢ LẬP NĂM NHÓM API TRÌNH DUYỆT MÀ JSDOM KHÔNG CÓ.
   * Giả lập ở đây là "có mặt nhưng không làm gì" — đủ để app chạy qua, và
   * KHÔNG giả vờ là chúng thành công. `getUserMedia` ném lỗi vì trong bộ đo
   * thì đúng là không có micro; app phải chịu được điều đó (§4.3).
   */
  w.scrollTo = () => {};
  w.open = () => null;
  w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; },
    addEventListener() {}, removeEventListener() {} };
  w.SpeechSynthesisUtterance = function () {};
  function Notif() {}
  Notif.permission = 'default';
  Notif.requestPermission = async () => 'denied';
  w.Notification = Notif;
  w.documentPictureInPicture = undefined;
  Object.defineProperty(w.navigator, 'mediaDevices', {
    value: { getUserMedia: async () => { throw new Error('bộ đo không có thiết bị thu'); } },
    configurable: true,
  });
  for (const k of ['scrollTo', 'open', 'speechSynthesis', 'SpeechSynthesisUtterance', 'Notification']) {
    dat(k, w[k]);
  }

  /*
   * MẠNG BỊ CHẶN, VÀ ĐÓ LÀ MỘT PHÉP THỬ CHỨ KHÔNG PHẢI HẠN CHẾ.
   * §4.3 — mất mạng thì app phải nói ra, không được sập và cũng không được
   * hiện "chưa thấy dấu hiệu rủi ro".
   */
  global.fetch = async () => { throw new Error('mạng bị chặn trong phép thử'); };
  w.fetch = global.fetch;

  const loi = [];
  w.addEventListener('error', (e) => loi.push(`lỗi cửa sổ: ${e.message}`));
  const gocConsole = console.error;
  console.error = (...a) => {
    const s = a.map(String).join(' ');
    // React in lại chính lỗi đã bắt được ở trên; đừng đếm hai lần.
    if (!/The above error|error boundary|not wrapped in act/.test(s)) loi.push(s.slice(0, 200));
    if (process.env.KHOAN_DA_ON_AO) gocConsole(...a);
  };

  /**
   * ⚠️ PHẢI ĐÓNG CỬA SỔ, KHÔNG PHẢI CHO SẠCH SẼ.
   *
   * `pretendToBeVisual: true` mở một vòng `requestAnimationFrame` chạy mãi. Bỏ
   * cửa sổ mà không đóng thì vòng đó giữ tiến trình sống: chạy thẳng tệp này
   * vẫn xong trong 6 giây, nhưng tiến trình con của `node --test` KHÔNG BAO GIỜ
   * thoát — `npm test` treo vô hạn, không in ra một dòng nào.
   *
   * Trả lại `console.error` cũng bắt buộc: nó là global, và để nguyên thì test
   * sau nuốt mất lỗi của chính nó.
   */
  const don = () => {
    console.error = gocConsole;
    try { w.close(); } catch { /* đóng rồi thì thôi */ }
  };

  return { w, loi, don };
}

/** Trạng thái của một máy VỪA CÀI — xem chú thích đầu tệp. */
function gieoTrangThaiMoiCai(w) {
  w.localStorage.clear();
  w.localStorage.setItem('khoan_da_user_role', 'elder');
  w.localStorage.setItem('familyMembers', '[]');
  w.localStorage.setItem('hasOverlayPermission', 'true');
  w.localStorage.setItem('showFloatingBall', 'true');
}

async function moApp(t) {
  const { w, loi, don } = dungCuaSo();
  t.after(don);
  gieoTrangThaiMoiCai(w);

  const React = require(path.join(GOC, 'node_modules', 'react'));
  const { createRoot } = require(path.join(GOC, 'node_modules', 'react-dom', 'client'));
  const App = require(TEP_GOI).default;

  await React.act(async () => {
    createRoot(w.document.getElementById('root')).render(React.createElement(App));
  });
  await React.act(async () => { await new Promise((r) => setTimeout(r, 300)); });

  const timNut = (nhan) => [...w.document.querySelectorAll('button')]
    .find((b) => ((b.getAttribute('aria-label') || b.textContent || '').trim()).startsWith(nhan));

  const bam = async (nhan) => {
    const b = timNut(nhan);
    if (!b) return false;
    await React.act(async () => { b.click(); await new Promise((r) => setTimeout(r, 250)); });
    return true;
  };

  const doDac = () => ({
    soNut: w.document.querySelectorAll('button').length,
    soChu: (w.document.body.textContent || '').trim().length,
  });

  // Qua màn chọn vai để tới màn chính.
  await bam('Bỏ qua');
  return { w, loi, bam, timNut, doDac };
}

test('app dựng được và không trắng màn ngay từ đầu', { skip: BO_QUA }, async (t) => {
  goiApp();
  const { loi, doDac } = await moApp(t);
  const d = doDac();
  assert.ok(d.soNut > 0, `dựng xong mà không có nút nào — ${JSON.stringify(d)}`);
  assert.ok(d.soChu > 0, 'dựng xong mà không có chữ nào');
  assert.deepStrictEqual(loi, [], `ném lỗi ngay khi dựng:\n${loi.join('\n')}`);
});

test('bấm từng tab điều hướng, không tab nào làm trắng màn', { skip: BO_QUA }, async (t) => {
  const { loi, bam, doDac } = await moApp(t);
  /*
   * "Tìm kiếm" nằm đầu danh sách vì chính nó là nút đã ném
   * `superBasic is not defined` và xoá sạch màn hình trên bản web thật.
   */
  for (const tab of ['Tìm kiếm', 'Trang chủ', 'Lịch sử', 'Trang chủ', 'Gia đình', 'Trang chủ', 'Hồ sơ']) {
    const co = await bam(tab);
    assert.ok(co, `không tìm thấy nút "${tab}" — đổi nhãn thì sửa cả danh sách này`);
    const d = doDac();
    assert.ok(d.soNut > 0 && d.soChu > 0,
      `bấm "${tab}" xong màn hình trắng — ${JSON.stringify(d)}\n${loi.join('\n')}`);
  }
  assert.deepStrictEqual(loi, [], `bấm điều hướng làm ném lỗi:\n${loi.join('\n')}`);
});

test('mở Menu tác vụ khi CHƯA CÓ người thân nào', { skip: BO_QUA }, async (t) => {
  const { w, loi, bam, doDac } = await moApp(t);
  assert.ok(await bam('Menu tác vụ'), 'không tìm thấy nút "Menu tác vụ"');
  const d = doDac();
  assert.ok(d.soNut > 0 && d.soChu > 0, `mở menu xong màn hình trắng — ${JSON.stringify(d)}`);
  assert.match(w.document.body.textContent, /Chưa có ai/,
    'menu phải mời bác thêm người thân, không được để trống chỗ tên');
  assert.deepStrictEqual(loi, [], `mở menu làm ném lỗi:\n${loi.join('\n')}`);
});

/**
 * ⚠️ CA NÀY LÀ LÝ DO CẢ TỆP TỒN TẠI. Nút bóng nổi nằm trong LỐI TẮT KHẨN CẤP,
 * và nó từng ném `Cannot read properties of null (reading 'name')` làm trắng cả
 * app — không ai báo, không test nào thấy.
 */
test('mở lối tắt bóng nổi khi CHƯA CÓ người thân nào', { skip: BO_QUA }, async (t) => {
  const { w, loi, doDac } = await moApp(t);
  const React = require(path.join(GOC, 'node_modules', 'react'));

  const bong = w.document.querySelector('.fixed.right-3.bottom-40');
  assert.ok(bong, 'không tìm thấy bóng nổi — đổi vị trí thì sửa cả bộ chọn này');
  const nut = bong.querySelector('button');
  assert.ok(nut, 'bóng nổi không có nút bấm');

  await React.act(async () => { nut.click(); await new Promise((r) => setTimeout(r, 300)); });

  const d = doDac();
  assert.ok(d.soNut > 0 && d.soChu > 0,
    `mở bóng nổi xong màn hình TRẮNG — đúng lỗi đã lên bản web thật: ${JSON.stringify(d)}`);
  assert.match(w.document.body.textContent, /Gọi ngay cho con cháu/, 'lối tắt không mở ra');
  assert.match(w.document.body.textContent, /Chưa có ai/,
    'chưa có người thân thì phải mời thêm, không được đọc thẳng tên của một người không tồn tại');
  assert.deepStrictEqual(loi, [], `mở bóng nổi làm ném lỗi:\n${loi.join('\n')}`);
});
