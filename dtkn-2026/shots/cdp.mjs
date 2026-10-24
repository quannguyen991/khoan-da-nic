// Chụp màn hình app Khoan Đã ở đúng 9:16 (540x960 @2x = 1080x1920) bằng Chrome DevTools Protocol.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const OUT = 'D:/KHOAN-DA-24H/dtkn-2026/shots';
const URL = 'https://khoan-da.onrender.com/';
mkdirSync(OUT, { recursive: true });

const profile = path.join(process.env.TEMP || 'C:/Temp', 'khoanda-cdp-profile');
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

const wsUrl = await getTarget();
const ws = new WebSocket(wsUrl);
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
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

const evalJs = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 540, height: 960, deviceScaleFactor: 2, mobile: true,
});
await send('Page.navigate', { url: URL });
await sleep(9000);

const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
  console.log('saved', name);
};

// Khám phá các nút có trên màn hình hiện tại
const buttons = async () => evalJs(`[...document.querySelectorAll('button, a, [role=button]')]
  .map(b => (b.innerText||'').trim().replace(/\\s+/g,' ')).filter(t => t && t.length < 60)`);

const mode = process.argv[2] || 'explore';
if (mode === 'explore') {
  console.log('BUTTONS1', JSON.stringify(await buttons()));
  await shot('01-chon-vai-tro.png');
} else if (mode === 'click') {
  const label = process.argv[3];
  const ok = await evalJs(`(() => { const el = [...document.querySelectorAll('button, a, [role=button], div')].find(b => (b.innerText||'').trim().replace(/\\s+/g,' ').startsWith(${JSON.stringify(label)}) && b.offsetParent !== null); if (!el) return false; el.click(); return true; })()`);
  console.log('clicked', label, ok);
  await sleep(5000);
  console.log('BUTTONS', JSON.stringify(await buttons()));
  await shot(process.argv[4] || 'after-click.png');
}

ws.close();
chrome.kill();
process.exit(0);
