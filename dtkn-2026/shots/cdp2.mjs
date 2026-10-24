// Chụp màn hình app ở đúng tỉ lệ khung iPhone (393x852 @3x), không cắt.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const OUT = 'D:/KHOAN-DA-24H/dtkn-2026/shots/phone';
const URL = 'https://khoan-da.onrender.com/';
mkdirSync(OUT, { recursive: true });

const profile = path.join(process.env.TEMP || 'C:/Temp', 'khoanda-cdp-phone');
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error('no devtools target');
}

const ws = new WebSocket(await getTarget());
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
  }
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id; pending.set(mid, { resolve, reject });
  ws.send(JSON.stringify({ id: mid, method, params }));
});
const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, deviceScaleFactor: 3, mobile: true });
await send('Page.navigate', { url: URL });
await sleep(9000);

const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
  console.log('saved', name);
};
const clickLabel = (label) => evalJs(`(() => { const norm = e => (e.innerText||'').trim().replace(/\s+/g,' '); const vis = [...document.querySelectorAll('button, a, [role=button], div, span')].filter(e => e.offsetParent !== null); let el = vis.find(e => norm(e) === ${JSON.stringify(label)}) || vis.find(e => norm(e).startsWith(${JSON.stringify(label)}) && norm(e).length < 60); if (!el) return false; el.click(); return true; })()`);
const buttons = () => evalJs(`[...document.querySelectorAll('button, a, [role=button]')].map(b => (b.innerText||'').trim().replace(/\\s+/g,' ')).filter(t => t && t.length < 60)`);

const steps = process.argv.slice(2); // ví dụ: "Đã hiểu=05-trang-chu.png"
console.log('START', JSON.stringify(await buttons()));
await shot('00-start.png');
for (const st of steps) {
  const [label, out] = st.split('=');
  if (label !== '_') {
    const ok = await clickLabel(label);
    console.log('click', label, ok);
    await sleep(4000);
  }
  if (out) await shot(out);
  console.log('BUTTONS', JSON.stringify(await buttons()));
}
ws.close();
chrome.kill();
process.exit(0);
