// Browser check: node tools/shot.mjs <url> <out.png> [--size WxH] [--won] [--eval JS] [--reduced-motion]
// Real-time headless Chromium over CDP (never --virtual-time-budget: it stalls the worker).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { createServer } from 'node:net';

const a = process.argv.slice(2), flag = n => a.includes(n), opt = n => a[a.indexOf(n) + 1];
const [url, out] = a;
if (!url || !out) { console.error('usage: node tools/shot.mjs <url> <out.png> [--size WxH] [--won] [--eval JS] [--reduced-motion]'); process.exit(1) }
const [W, H] = (flag('--size') ? opt('--size') : '402x706').split('x').map(Number);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = await new Promise(r => { const s = createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)) }) });
// snap Chromium cannot reach /tmp, so the profile lives under $HOME
const dir = `${homedir()}/override-shots/prof-shot-${process.pid}`; mkdirSync(dir, { recursive: true });
const proc = spawn('/snap/bin/chromium', ['--headless', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, 'about:blank'], { stdio: 'ignore' });
// Snap moves Chromium into its own session and AppArmor blocks signals to it, so proc.kill() leaks
// whole browsers. Close it from inside instead: Browser.close over the browser-level CDP socket.
const closeBrowser = async () => {
  try {
    const v = await (await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(2000) })).json();
    const b = new WebSocket(v.webSocketDebuggerUrl);
    await Promise.race([new Promise(r => b.onopen = r), sleep(2000)]);
    b.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
    await Promise.race([new Promise(r => proc.once('exit', r)), sleep(3000)]);
  } catch {}
  try { proc.kill() } catch {}
  try { rmSync(dir, { recursive: true, force: true }) } catch {}
};
const bail = async msg => { if (msg) console.error(msg); await closeBrowser(); process.exit(1) };
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => bail());
setTimeout(() => bail('shot: timed out after 60 s'), 60000).unref();
let ws;
try {
  let tab;
  for (let i = 0; i < 50 && !tab; i++) { await sleep(300); try { tab = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === 'page') } catch {} }
  ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map(), errors = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(x => x.value ?? x.description).join(' '));
  };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) });
  const ev = async js => (await send('Runtime.evaluate', { expression: js, returnByValue: true, awaitPromise: true })).result?.result?.value;
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: flag('--dpr') ? +opt('--dpr') : 2, mobile: true });
  if (flag('--reduced-motion')) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url }); await sleep(7000);
  if (flag('--won')) {
    await ev(`(() => { const s = JSON.parse(localStorage['override-v1']); s.goals.forEach(g => g.got = g.need); localStorage['override-v1'] = JSON.stringify(s) })()`);
    await send('Page.navigate', { url: url.split('?')[0] }); await sleep(7000);
  }
  if (flag('--eval')) { await ev(opt('--eval')); await sleep(1500) }
  const m = await ev(`['strip','comms','deck','log','hud','wrap','board','soft'].map(i => { const e = document.getElementById(i); if (!e) return i + ':missing'; const r = e.getBoundingClientRect(); return i + ':' + Math.round(r.top) + '+' + Math.round(r.height) + ' x ' + Math.round(r.width) }).join('\\n')`);
  console.log(m); console.log(errors.length ? 'errors:\n' + errors.join('\n') : 'no console errors');
  writeFileSync(out, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'));
} finally {
  try { ws?.close() } catch {}
  await closeBrowser();
  setTimeout(() => process.exit(0), 300);
}
