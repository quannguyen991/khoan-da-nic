#!/usr/bin/env node
/**
 * CHỤP MÀN THẬT CỦA APP cho trang giới thiệu /gioi-thieu.
 *
 *   npm run dev            (một cửa sổ khác — cần app chạy ở http://localhost:5173)
 *   node scripts/chup-man-that.mjs [--goc http://localhost:5173]
 *
 * ⚠️ VÌ SAO KHÔNG VẼ LẠI BẰNG TAY, CŨNG KHÔNG DÙNG ẢNH CHỤP (24/9/2026).
 * Bản vẽ tay đầu tiên trông "giống giống" nhưng sai hẳn: màn Khẩn cấp thật màu đỏ,
 * có câu "Để tôi hỏi con rồi gọi lại." — bản vẽ thì không. Người dùng đòi giống
 * 100%. Ảnh chụp thì giống, nhưng là chữ nướng vào ảnh (§4.4 cấm) và bản tiếng
 * Anh sẽ hiện chữ Việt. Nên script này chụp CHÍNH DOM của app ở từng màn, kèm
 * TOÀN BỘ CSS của app lúc chụp → trang giới thiệu nhúng lại trong <iframe> tĩnh:
 * giống app vì nó LÀ app, chữ vẫn là chữ, có đủ hai ngôn ngữ.
 *
 * ⚠️ APP ĐỔI GIAO DIỆN THÌ CHẠY LẠI SCRIPT NÀY. Ảnh chụp DOM không tự cập nhật.
 *
 * Đầu ra: backend/src/man-that/{app.css, <man>.<vi|en>.html}. Không có <script>,
 * không có link bấm được — chỉ để nhìn. Dữ liệu mẫu: người thân "Lan", số 0900000000.
 * Chạy bằng Edge/Chrome chạy ngầm qua DevTools Protocol (Node 22+, không cần gói).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const doi = (ten, macDinh) => { const i = process.argv.indexOf(ten); return i > 0 ? process.argv[i + 1] : macDinh; };
const GOC = doi('--goc', 'http://localhost:5173');
const THU_MUC = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'backend', 'src', 'man-that');
const TRINH_DUYET = [
  process.env.CHROME,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find((p) => p && fs.existsSync(p));
if (!TRINH_DUYET) { console.error('Không thấy Edge/Chrome. Đặt biến CHROME=<đường dẫn>.'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CONG = 9340 + Math.floor(Math.random() * 50);
const hoSo = fs.mkdtempSync(path.join(os.tmpdir(), 'khoan-da-chup-'));
const may = spawn(TRINH_DUYET, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--disable-extensions',
  `--remote-debugging-port=${CONG}`, `--user-data-dir=${hoSo}`, 'about:blank'], { stdio: 'ignore' });

let trang;
for (let i = 0; i < 50 && !trang; i++) {
  try { trang = (await (await fetch(`http://127.0.0.1:${CONG}/json/list`)).json()).find((x) => x.type === 'page'); } catch { /* chờ */ }
  if (!trang) await sleep(300);
}
const ws = new WebSocket(trang.webSocketDebuggerUrl);
let so = 0; const cho = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && cho.has(d.id)) { cho.get(d.id)(d); cho.delete(d.id); } };
await new Promise((r) => { ws.onopen = r; });
const gui = (method, params = {}) => new Promise((r) => { const i = ++so; cho.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (bieuThuc) => {
  const r = await gui('Runtime.evaluate', { expression: bieuThuc, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400));
  return r.result?.result?.value;
};
const mo = async () => { await gui('Page.navigate', { url: `${GOC}/` }); await sleep(3500); };
const bam = async (chu) => {
  const kq = await ev(`(() => {
    const ds = [...document.querySelectorAll('button, a, [role=button]')];
    const el = ds.find((e) => (e.innerText || e.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().includes(${JSON.stringify(chu)}));
    if (!el) return false; el.click(); return true;
  })()`);
  if (!kq) throw new Error(`Không thấy nút "${chu}"`);
  await sleep(1200);
};

await gui('Page.enable'); await gui('Runtime.enable');
await gui('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await gui('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

/** Chụp DOM hiện tại: bỏ script, bỏ link bấm được, bỏ nút nổi nhỏ cố định (bóng quét nhanh). */
const CHUP_DOM = `(() => {
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') {
      const r = el.getBoundingClientRect();
      if (r.width < 120 && r.height < 120) el.setAttribute('data-bo-khi-chup', '1');
    }
  }
  const goc = document.documentElement.cloneNode(true);
  document.querySelectorAll('[data-bo-khi-chup]').forEach((e) => e.removeAttribute('data-bo-khi-chup'));
  goc.querySelectorAll('[data-bo-khi-chup], [id^="__"], script, noscript, link, style, template, iframe').forEach((e) => e.remove());
  goc.querySelectorAll('a').forEach((a) => { a.removeAttribute('href'); a.removeAttribute('target'); });
  goc.querySelectorAll('button, a, input, textarea, select, [tabindex]').forEach((e) => e.setAttribute('tabindex', '-1'));
  goc.querySelectorAll('input, textarea').forEach((e) => e.setAttribute('readonly', ''));
  goc.querySelector('head').innerHTML = '<meta charset="utf-8"><meta name="viewport" content="width=390">'
    + '<meta name="robots" content="noindex"><link rel="stylesheet" href="/man-that/app.css">'
    + '<style>html,body{overflow:hidden!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}</style>';
  return '<!doctype html>\\n' + goc.outerHTML;
})()`;

const LAY_CSS = `(() => {
  const phan = [];
  for (const ss of document.styleSheets) {
    let luat; try { luat = ss.cssRules; } catch { continue; }
    for (const r of luat) phan.push(r.cssText);
  }
  return phan.join('\\n');
})()`;

const CHU = {
  vi: { troLy: 'Nói cho cháu nghe', gui: 'Gửi', xong: 'Kiểm tin này ngay', cau: 'Ngân hàng bảo chuyển tiền, không thì tài khoản bị khoá.',
    day: 'Xem đầy đủ', caiDat: 'Cài đặt', quyTac: 'Quy tắc nhà mình', mau: 'Nhà mình không chuyển tiền khi đang nghe điện thoại.',
    tiep: 'Tiếp tục', quayLai: 'Quay lại', khanCap: 'Khẩn cấp', them: 'Xem thêm', lo: 'Tôi đã lỡ chuyển tiền', tiepTheo: 'Xem việc tiếp theo' },
  en: { troLy: 'Talk to me', gui: 'Send', xong: 'Check this now', cau: 'The bank says transfer the money or my account gets locked.',
    day: 'Show the full app', caiDat: 'Settings', quyTac: 'Your family rule', mau: 'Our family never transfers money while still on a phone call.',
    tiep: 'Continue', quayLai: 'Back', khanCap: 'Emergency', them: 'See more', lo: 'I already sent money', tiepTheo: 'See what to do next' },
};

fs.mkdirSync(THU_MUC, { recursive: true });
const ghi = (ten, noiDung) => { fs.writeFileSync(path.join(THU_MUC, ten), noiDung); console.log('  đã ghi', ten, `${Math.round(noiDung.length / 1024)} KB`); };

let css = '';
for (const lang of ['vi', 'en']) {
  const c = CHU[lang];
  console.log(`— ${lang}`);
  await mo();
  await ev(`localStorage.clear(); Object.entries(${JSON.stringify({
    lang, khoan_da_user_role: 'elder', daXemIntro: '1', khoan_da_sieu_don_gian: '1',
    khoan_da_da_bao_giong_ra_ngoai: '1',
    familyMembers: JSON.stringify([{ id: 1, name: 'Lan', relation: lang === 'vi' ? 'Con gái' : 'Daughter', phone: '0900000000' }]),
  })}).forEach(([k, v]) => localStorage.setItem(k, v)); true`);
  await mo();

  // 1. Nói cho cháu nghe — một lượt thật với máy chủ đang chạy.
  await bam(c.troLy);
  await ev(`(() => {
    const el = [...document.querySelectorAll('input')].find((i) => !i.type || i.type === 'text');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(c.cau)});
    el.dispatchEvent(new Event('input', { bubbles: true })); return true;
  })()`);
  await bam(c.gui);
  for (let i = 0; i < 90; i++) {
    if (await ev(`document.body.innerText.includes(${JSON.stringify(c.xong)})`)) break;
    await sleep(1000);
  }
  await sleep(1500);
  ghi(`tro-ly.${lang}.html`, await ev(CHUP_DOM));
  if (!css) css = await ev(LAY_CSS);

  // 2. Quy tắc nhà mình — đặt một quy tắc cùng "Lan" qua đúng giao diện.
  await mo();
  await bam(c.day); await bam(c.caiDat); await bam(c.quyTac);
  await bam(c.mau); await bam(c.tiep); await bam('Lan');
  await bam(c.quayLai);   // từ màn "đã lưu", Quay lại về thẳng danh sách quy tắc
  ghi(`quy-tac.${lang}.html`, await ev(CHUP_DOM));

  // 3. Khẩn cấp → dừng 60 giây.
  await mo();
  await bam(c.khanCap);
  ghi(`khan-cap.${lang}.html`, await ev(CHUP_DOM));

  // 4. Sau khi lỡ chuyển tiền → việc tiếp theo.
  await bam(c.them); await bam(c.lo); await bam(c.tiepTheo);
  await ev('document.querySelectorAll("*").forEach((e) => { if (e.scrollTop) e.scrollTop = 0; }); scrollTo(0, 0); true');
  ghi(`phuc-hoi.${lang}.html`, await ev(CHUP_DOM));
}

/*
 * CSS: giữ nguyên, chỉ đổi @font-face Quicksand sang /phong-chu (tệp tự phục vụ,
 * tên không băm) và bỏ @font-face họ khác (đường dẫn dev/băm sẽ chết sau build).
 */
const conUrl = [];
css = css.replace(/@font-face\s*\{[^}]*\}/g, (khoi) => {
  if (!/Quicksand/i.test(khoi)) return '';
  const m = khoi.match(/quicksand-([a-z-]+?)-(\d{3})-normal/i);
  if (!m) return '';
  return khoi.replace(/src:[^;]+;/, `src: url("/phong-chu/quicksand-${m[1]}-${m[2]}-normal.woff2") format("woff2");`);
});
for (const m of css.matchAll(/url\((["']?)([^)"']+)\1\)/g)) {
  if (!m[2].startsWith('data:') && !m[2].startsWith('#') && !m[2].startsWith('/phong-chu/')) conUrl.push(m[2]);
}
if (conUrl.length) console.warn('⚠️ CSS còn url() ngoài /phong-chu:', [...new Set(conUrl)].slice(0, 10));
ghi('app.css', css);

ws.close(); may.kill();
try { fs.rmSync(hoSo, { recursive: true, force: true }); } catch { /* Edge còn giữ tệp thì thôi */ }
process.exit(0);
