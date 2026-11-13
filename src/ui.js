// Override UI: language, worker client, rendering, step animation, input, sheets, saving.
import { move, won, lost, fromSave, toSave, hash, mulberry32 } from './core.js';
import { paletteFor } from './palette.js';
import { PLAYS_MAX, logFrom, attemptOf, startAttempt, resume, logMove, entryOf, close, setOn, trim, fileOf } from './plays.js';
import { chapterOf, ENC_FROM, FW_FROM, MAX_LEVEL, clampLevel } from './levels.js';

const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEV = !location.hostname.endsWith('github.io');
const store = { get(k){ try { return localStorage.getItem(k) } catch { return null } }, set(k, v){ try { localStorage.setItem(k, v) } catch {} } };
const getJSON = async u => (await fetch(u)).json();
const sleep = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));

/* ---------- language ---------- */
// Texts live in lang/<code>.json; lang/languages.json lists them. Missing keys fall back to English.
const LANGS = await getJSON('lang/languages.json');
const EN = await getJSON('lang/en.json');
let T = EN;
async function setLang(code){ T = code === 'en' ? EN : { ...EN, ...await getJSON(`lang/${code}.json`) }; document.documentElement.lang = code }
const pickLang = () => { const s = store.get('override-lang'); if (s && LANGS[s]) return s; for (const l of navigator.languages || []) { const c = l.slice(0, 2); if (LANGS[c]) return c } return 'en' };
const t = (k, o = {}) => (T[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => o[x] ?? '');
await setLang(pickLang());

/* ---------- attempts (worker) ---------- */
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const ready = new Map(), waiting = new Map(), asked = new Set();
const keyOf = (level, fails) => `${level}:${fails}`;
worker.onmessage = e => {
  const { level, fails, S } = e.data, k = keyOf(level, fails);
  ready.set(k, S);
  waiting.get(k)?.(S); waiting.delete(k);
};
const failed = () => { hideLoading(); showSheet(t('loadFailed'), '', [[t('reload'), () => location.reload(), true]]) };
worker.onerror = worker.onmessageerror = failed;
function ask(level, fails){ const k = keyOf(level, fails); if (!ready.has(k) && !asked.has(k)) { asked.add(k); worker.postMessage({ level, fails }) } }
// Resolves with a fresh copy of the attempt for (level, fails); only the latest want() is delivered.
let wantKey = null;
function want(level, fails){
  const k = keyOf(level, fails); wantKey = k; ask(level, fails);
  return new Promise(res => {
    const give = S => { if (wantKey === k) res(JSON.parse(JSON.stringify(S))) };
    ready.has(k) ? give(ready.get(k)) : waiting.set(k, give);
  });
}
const prefetch = (level, fails) => { ask(level + 1, 0); ask(level, fails + 1) };

/* ---------- state ---------- */
let S = null, run = { best: 1, fails: 0 }, busy = false, grace = 0;
try { const o = JSON.parse(store.get('override-run')); if (Number.isInteger(o?.best) && o.best >= 1 && Number.isInteger(o.fails) && o.fails >= 0) run = o } catch {}
const saveRun = () => store.set('override-run', JSON.stringify(run));
const save = () => store.set('override-v1', JSON.stringify(toSave(S)));
/* ---------- play log ---------- */
let plog; try { plog = logFrom(JSON.parse(store.get('override-plays'))) } catch { plog = logFrom(null) }
let t0 = Date.now(), base = 0;   // seconds played: base from before a reload, plus time since t0 (page visible)
const secs = () => Math.round(base + (document.hidden ? 0 : (Date.now() - t0) / 1000));
// pause the clock while the page is hidden: fold elapsed time into base, restart t0 on return
document.addEventListener('visibilitychange', () => { if (document.hidden) { base += (Date.now() - t0) / 1000 } else t0 = Date.now() });
const savePlays = () => { trim(plog, PLAYS_MAX); store.set('override-plays', JSON.stringify(plog)) };
const openAttempt = () => { const a = plog.attempts.at(-1); return a && a.end === null ? a : null };
// fresh: a new attempt (level start, restart); else continue the saved one after a reload.
function logStart(fresh){
  if (!plog.on) return;
  if (won(S) || lost(S)) { const o = openAttempt(); if (!fresh && o && o.level === S.level && o.fails === S.fails) { base = o.t; t0 = Date.now(); logEnd(won(S) ? 'won' : 'lost') } return }
  if (fresh || !resume(plog, S)) startAttempt(plog, attemptOf(S, new Date().toISOString()));
  base = openAttempt().t; t0 = Date.now(); savePlays();
}
function logEnd(end){ if (plog.on) { close(plog, end, S, secs()); savePlays() } }
function load(){
  let o = null; try { o = JSON.parse(store.get('override-v1')) } catch {}
  const q = DEV && +new URLSearchParams(location.search).get('level');
  if (Number.isInteger(q) && q >= 1) return { level: q, fails: 0 };
  const s = fromSave(o);
  if (s) return { S: s };
  return { level: Number.isInteger(o?.level) && o.level >= 1 && o.level <= 1e6 ? o.level : 1, fails: Number.isInteger(o?.fails) && o.fails >= 0 ? o.fails : 0 };
}
const showLoading = level => { $('#loadTitle').textContent = t('loading', { n: level }); $('#loadSub').textContent = t('loadingSub'); $('#loading').classList.add('on') };
const hideLoading = () => $('#loading').classList.remove('on');
// Starts (level, fails): loading card until the worker answers (at least 400 ms if it had to wait).
async function begin(level, fails){
  busy = true; closeSheets();
  const t0 = performance.now(), cached = ready.has(keyOf(level, fails));
  if (!cached) showLoading(level);
  const s = await want(level, fails);
  if (!cached) await sleep(Math.max(0, 400 - (performance.now() - t0)));
  hideLoading();
  S = s; logStart(true); run.best = Math.max(run.best, level); run.fails = fails; saveRun(); save();
  start();
}
function start(){
  sync(); fit(); hud(); comms(); unlockScene(false);
  busy = false; grace = performance.now() + 400; sel = -1;
  prefetch(S.level, S.fails);
  if (won(S)) win(true); else if (lost(S)) lose(true);
}

/* ---------- view model ---------- */
let sprites = new Map(), vEnc = [], fx = [], sel = -1;
// Rebuilds the view from S: used at level start and after every move's animation (keeps view and state equal).
function sync(){
  sprites = new Map(); vEnc = S.enc.slice();
  S.grid.forEach((x, i) => { if (x) sprites.set(x.id, { ...x, x: i % S.n, y: Math.floor(i / S.n), tx: i % S.n, ty: Math.floor(i / S.n) }) });
}
const place = (sp, i) => { sp.tx = i % S.n; sp.ty = Math.floor(i / S.n) };
const settled = () => [...sprites.values()].every(p => p.x === p.tx && p.y === p.ty && !p.falling);
const settle = () => new Promise(res => { const f = () => settled() ? res() : requestAnimationFrame(f); f() });
const idAt = new Map();   // cell -> sprite id during animation
async function animate(steps){
  idAt.clear(); for (const [id, p] of sprites) idAt.set(p.ty * S.n + p.tx, id);
  for (let j = 0; j < steps.length; j++) {
    const s = steps[j];
    if (s.k === 'fall') {
      // one gravity pass moves tiles a single row: play a whole run of passes as one drop
      const above = new Map();   // column -> new tiles queued above the board in this run
      for (; j < steps.length && steps[j].k === 'fall'; j++) {
        for (const m of steps[j].moves) { const sp = sprites.get(m.id); place(sp, m.to); sp.falling = true; if (idAt.get(m.from) === m.id) idAt.delete(m.from); idAt.set(m.to, m.id) }
        for (const p of steps[j].spawns) {
          const x = p.i % S.n, k = (above.get(x) || 0) + 1; above.set(x, k);
          sprites.set(p.tile.id, { ...p.tile, x, y: -k, tx: x, ty: 0, vy: 0, falling: true }); idAt.set(p.i, p.tile.id);
        }
      }
      j--; await settle(); continue;
    }
    if (s.k === 'swap' || s.k === 'back') {
      const A = idAt.get(s.a), B = idAt.get(s.b);
      place(sprites.get(A), s.b); place(sprites.get(B), s.a); idAt.set(s.a, B); idAt.set(s.b, A);
      await settle();
    }
    if (s.k === 'combo') { flash(s.i, s.kind); await sleep(120) }
    if (s.k === 'convert') { for (const c of s.cells) sprites.get(idAt.get(c.i)).s = c.s; await sleep(450) }
    if (s.k === 'wave') {
      for (const f of s.fired) { const q = sprites.get(idAt.get(f.i)); flash(f.i, f.s, q && q.t >= 0 ? PAL.t[S.types[q.t]] : undefined) }
      for (const c of s.cracked) { vEnc[c.i] = c.hp; fx.push({ k: 'crack', i: c.i, at: performance.now() }) }
      for (const i of s.unlocked) sprites.get(idAt.get(i)).lock = false;
      for (const c of s.cleared) { const p = sprites.get(c.id); fx.push({ k: 'pop', p, at: performance.now() }); sparks(p.x + .5, p.y + .5, p.t >= 0 ? PAL.t[S.types[p.t]] : '#ffffff', 5, 5); sprites.delete(c.id); idAt.delete(c.i) }
      for (const c of s.created) { const y = Math.floor(c.i / S.n), x = c.i % S.n; sprites.set(c.tile.id, { ...c.tile, x, y, tx: x, ty: y }); idAt.set(c.i, c.tile.id) }
      hud(); await sleep(190);
    }
    if (s.k === 'shuffle') {
      toast(t('noMoves')); await sleep(600);
      for (const x of s.tiles) { const p = sprites.get(x.id); p.t = x.t; place(p, x.i); idAt.set(x.i, x.id) }
      await settle();
    }
  }
}

/* ---------- moves ---------- */
async function play(a, b){
  if (busy || performance.now() < grace || !S || won(S) || lost(S)) return;
  busy = true;
  const before = S.moves, r = move(S, a, b);
  if (r.ok) {                 // saved before animating: closing mid-cascade loses nothing
    save();
    if (plog.on && openAttempt()) { const cur = openAttempt(); logMove(plog, entryOf(S, r.steps, cur.moves.length + 1)); cur.t = secs(); savePlays() }
  }
  if (r.ok && !won(S)) {   // the patrol warnings flash once each, as the count crosses the line (never on the winning move)
    const quarter = Math.ceil(S.limit * .25);
    if (before > 3 && S.moves <= 3) alert('crit'); else if (before > quarter && S.moves <= quarter) alert('warn');
  }
  try { await animate(r.steps) } finally { sync(); hud(); busy = false }
  if (!r.ok) return;
  if (won(S)) { logEnd('won'); win() } else if (lost(S)) { logEnd('lost'); lose() }
}
let alertT;
function alert(kind){
  const el = $('#alert'); el.textContent = kind === 'crit' ? t('alertCrit') : t('alertWarn'); el.dataset.kind = kind;
  el.hidden = true; void el.offsetWidth; el.hidden = false;   // restart the animation
  clearTimeout(alertT); alertT = setTimeout(() => { el.hidden = true }, 2800);
}
function unlockScene(open){ $('#strip').classList.toggle('open', open) }
async function win(reloaded){
  busy = true; unlockScene(true);
  if (!reloaded && !RM) for (let k = 0; k < Math.min(S.moves, 10); k++) {   // flourish: purely visual
    const h = hash(S.level, S.fails, k); flash(h % (S.n * S.n), h >>> 16 & 1 ? 'h' : 'v', PAL.t[S.types[h % S.k]]); await sleep(120);
  }
  busy = false;
  const text = t('winText', { n: S.moves }) + (chapterOf(S.level + 1).pos === 1 ? ' ' + t('winChapter', { n: chapterOf(S.level + 1).n }) : '');
  showSheet(t('winTitle'), text, [[t('next'), () => { run.fails = 0; begin(S.level + 1, 0) }, true]], false, true);
}
function lose(){ showSheet(t('loseTitle'), t('loseText'), [[t('retry'), () => begin(S.level, S.fails + 1), true]]) }

/* ---------- drawing ---------- */
const cv = $('#board'); let g = cv.getContext('2d');
let cs = 40, dpr = 1, PAL = {};
function readPal(){
  const st = getComputedStyle(document.documentElement);
  for (const k of ['cell', 'ink', 'dim', 'enc', 'encInk', 'fw', 'sel', 'acc', 'screen']) PAL[k] = st.getPropertyValue('--' + k).trim();
  PAL.t = paletteFor(store.get('override-palette'));
}
function fit(){
  const w = $('#wrap'), size = Math.floor(Math.min(w.clientWidth, w.clientHeight));
  dpr = devicePixelRatio || 1; cs = size / (S?.n || 8);
  cv.style.width = cv.style.height = size + 'px'; cv.width = cv.height = Math.round(size * dpr);
}
const GLYPHS = ['ﾛ', 'ﾊ', 'X', 'T', 'Ξ', 'ﾐ', 'Z'];   // one character per glyph slot (types)
const MONO = getComputedStyle(document.documentElement).getPropertyValue('--mono');
const tint = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})` };
const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) };
const now = () => RM ? 0 : performance.now();
function glyph(ty, cx, cy, sz, a = 1){
  g.save(); g.globalAlpha *= a; g.font = `700 ${sz}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = PAL.t[ty]; g.shadowColor = PAL.t[ty]; g.shadowBlur = sz * .35; g.fillText(GLYPHS[ty], cx, cy + sz * .04); g.restore();
}
// worm: a data packet along the line it clears, chevrons both ways, dashes running along it
function drawWorm(ty, cx, cy, sz, v){
  const c = PAL.t[ty], L = sz * .45, H = sz * .27, T = now();
  g.save(); g.translate(cx, cy); if (v) g.rotate(Math.PI / 2);
  rr(-L, -H, 2 * L, 2 * H, H); g.fillStyle = tint(c, .25); g.fill();
  g.lineWidth = sz * .05; g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = sz * .25; g.stroke();
  g.lineWidth = sz * .06;
  for (const d of [-1, 1]) { g.beginPath(); g.moveTo(d * (L - sz * .1), -H * .55); g.lineTo(d * (L + sz * .02), 0); g.lineTo(d * (L - sz * .1), H * .55); g.stroke() }
  const p = (T / 1000) % 1; g.fillStyle = '#fff';
  for (const o of [0, .5]) { const x = -L + ((p + o) % 1) * 2 * L; g.fillRect(x - sz * .04, -H - sz * .02, sz * .08, sz * .04) }
  g.restore(); glyph(ty, cx, cy, sz * .36);
}
// logic bomb: a chip with 12 pins lighting up in turn, a blinking fuse light
function drawBomb(ty, cx, cy, sz){
  const c = PAL.t[ty], a = sz * .3, T = now(), ph = Math.floor(T / 120) % 12;
  g.save(); g.shadowColor = c; g.shadowBlur = sz * .25;
  for (let i = 0; i < 12; i++) {
    const side = Math.floor(i / 3), k = i % 3 - 1, o = a + sz * .07, q = k * a * .6;
    const [x, y] = [[q, -o], [o, q], [-q, o], [-o, -q]][side], hz = side % 2;
    g.fillStyle = i === ph ? '#fff' : c;
    g.fillRect(cx + x - (hz ? sz * .06 : sz * .035), cy + y - (hz ? sz * .035 : sz * .06), hz ? sz * .12 : sz * .07, hz ? sz * .07 : sz * .12);
  }
  rr(cx - a, cy - a, 2 * a, 2 * a, sz * .05); g.fillStyle = tint(c, .3); g.fill(); g.lineWidth = sz * .05; g.strokeStyle = c; g.stroke();
  if (Math.floor(T / 500) % 2) { g.fillStyle = '#ff4040'; g.shadowColor = '#ff4040'; g.beginPath(); g.arc(cx + a * .7, cy - a * .7, sz * .05, 0, 7); g.fill() }
  g.restore(); glyph(ty, cx, cy, sz * .34);
}
// zero-day: a turning ring in the level's colours around a white core
function drawZero(cx, cy, sz){
  const T = now(); g.save(); g.translate(cx, cy); g.rotate(T / 320);
  const n = S.k;
  for (let i = 0; i < n; i++) {
    const c = PAL.t[S.types[i]]; g.beginPath(); g.arc(0, 0, sz * .36, i * 2 * Math.PI / n + .06, (i + 1) * 2 * Math.PI / n - .06);
    g.strokeStyle = c; g.lineWidth = sz * .12; g.shadowColor = c; g.shadowBlur = sz * .2; g.stroke();
  }
  g.restore(); g.save(); g.beginPath(); g.arc(cx, cy, sz * .22, 0, 7); g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = sz * .4; g.fill();
  g.shadowBlur = 0; g.fillStyle = '#111'; g.font = `700 ${sz * .26}px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0', cx, cy + sz * .02); g.restore();
}
// firewall: a flame frame with cage bars over the tile (the tile stays at full colour)
function drawFw(cx, cy, sz){
  const a = sz * .44, T = now();
  g.save(); g.strokeStyle = PAL.fw; g.shadowColor = '#ff3b00'; g.shadowBlur = sz * .2; g.globalAlpha *= .8 + .2 * Math.sin(T / 90); g.lineWidth = sz * .035;
  g.beginPath(); for (const k of [-.5, 0, .5]) { g.moveTo(cx + k * a * .9, cy - a * .9); g.lineTo(cx + k * a * .9, cy + a * .9) } g.stroke(); g.restore();
  g.save(); rr(cx - a, cy - a, 2 * a, 2 * a, sz * .08);
  const gr = g.createLinearGradient(0, cy - a, 0, cy + a); gr.addColorStop(0, '#ffcc33'); gr.addColorStop(1, '#d42a00');
  g.strokeStyle = gr; g.lineWidth = sz * .07; g.shadowColor = '#ff4000'; g.shadowBlur = sz * .3; g.stroke();
  for (let i = 0; i < 4; i++) {
    const h = sz * (.08 + .06 * Math.abs(Math.sin(T / 120 + i * 1.7))), x = cx - a * .7 + i * a * .47;
    g.beginPath(); g.moveTo(x, cy - a); g.quadraticCurveTo(x + sz * .04, cy - a - h, x + sz * .08, cy - a); g.fillStyle = '#ffb000'; g.shadowColor = '#ff6000'; g.shadowBlur = sz * .2; g.fill();
  }
  g.restore();
}
function drawTile(x, cx, cy, sc = 1){
  const sz = cs * sc;
  if (x.s === 'z') drawZero(cx, cy, sz);
  else if (x.s === 'h' || x.s === 'v') drawWorm(S.types[x.t], cx, cy, sz, x.s === 'v');
  else if (x.s === 'b') drawBomb(S.types[x.t], cx, cy, sz);
  else glyph(S.types[x.t], cx, cy, sz * .5);
  if (x.lock) drawFw(cx, cy, sz);
}
// encrypted cell: jittering static, the amber outline shows hits left (double, single, dashed)
function drawEnc(cx, cy, hp, size = cs){
  const a = size * .44, j = Math.floor(now() / 150), ch = '#%&@$?!*', dens = [0, .25, .5, .8][Math.min(3, hp)];
  g.save(); rr(cx - a, cy - a, 2 * a, 2 * a, size * .08); g.fillStyle = PAL.enc; g.fill(); g.clip();
  g.font = `${size * .16}px ${MONO}`; g.fillStyle = 'rgba(140,160,200,.55)';
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) if (((x * 7 + y * 13 + j) % 10) / 10 < dens) g.fillText(ch[(x + y + j) % 8], cx - a + x * a * .4 + 2, cy - a + y * a * .4 + size * .14);
  g.restore(); g.save(); rr(cx - a, cy - a, 2 * a, 2 * a, size * .08); g.strokeStyle = PAL.encInk; g.lineWidth = size * .04;
  if (hp === 1) g.setLineDash([size * .08, size * .06]); g.stroke();
  if (hp >= 3) { rr(cx - a + size * .06, cy - a + size * .06, 2 * a - size * .12, 2 * a - size * .12, size * .06); g.stroke() }
  g.restore();
}
const flash = (i, kind, col) => { fx.push({ k: 'flash', i, kind, col, at: performance.now() }); boom(i, kind, col) };
/* ---------- particles and shake (visual only) ---------- */
// Tuning: BOOM sets how wild blasts look; sparks fly in cells/s, fall with SPARK_G, live 250 to 650 ms.
const BOOM = { spark: 1, shake: 1 }, SPARK_G = 14, fxRnd = mulberry32(hash(31, 7));
let shake = { amp: 0, at: 0 };
const kick = amp => { if (amp * BOOM.shake > shake.amp * (1 - Math.min(1, (performance.now() - shake.at) / 260))) shake = { amp: amp * BOOM.shake, at: performance.now() } };
function sparks(x, y, col, count, speed, spread = 2 * Math.PI, dir = 0){
  if (RM) return;
  for (let k = 0; k < Math.round(count * BOOM.spark); k++) {
    const a = dir + (fxRnd() - .5) * spread, v = speed * (.35 + fxRnd() * .9);
    fx.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, col: fxRnd() < .25 ? '#ffffff' : col, life: 250 + fxRnd() * 400, w: .07 + fxRnd() * .08, at: performance.now() });
  }
}
function boom(i, kind, col){
  const n = S.n, r = Math.floor(i / n), c = i % n, cx = c + .5, cy = r + .5, cl = col || GLOW;
  if (kind === 'h' || kind === 'v') {   // worm: sparks shower off the whole line, kicked sideways
    for (let k = 0; k < n; k++) { const x = kind === 'h' ? k + .5 : cx, y = kind === 'h' ? cy : k + .5; sparks(x, y, cl, 3, 6, 1.2, kind === 'h' ? -Math.PI / 2 : 0); sparks(x, y, cl, 2, 6, 1.2, kind === 'h' ? Math.PI / 2 : Math.PI) }
    kick(4);
  } else if (kind === 'b') { sparks(cx, cy, cl, 34, 11); kick(8) }
  else if (kind === 'bb' || kind === 'bw' || kind === 'ww') { sparks(cx, cy, cl, 50, 14); kick(11) }
  else if (kind === 'z' || kind === 'zw' || kind === 'zb' || kind === 'zz') { for (let t = 0; t < S.k; t++) sparks(cx, cy, PAL.t[S.types[t]], 12, 12); kick(kind === 'zz' ? 14 : 9) }
}
const GLOW = '#c9ffd9';
function flashShape(kind, r, c, n, p, col){
  const w = n * cs, R = (r0, rows) => g.fillRect(0, r0 * cs, w, rows * cs), C = (c0, cols) => g.fillRect(c0 * cs, 0, cols * cs, w);
  if (kind === 'h' || kind === 'v') {   // worm: a beam shoots out both ways from the worm, then burns out
    const reach = Math.min(1, p / .3) * w, fade = p < .3 ? 1 : 1 - (p - .3) / .7, th = cs * (.35 + .25 * (1 - fade));
    const o = (kind === 'h' ? c : r) * cs + cs / 2, a = Math.max(0, o - reach), b = Math.min(w, o + reach), m = (kind === 'h' ? r : c) * cs + cs / 2;
    const bar = (t, colr, blur) => { g.fillStyle = g.shadowColor = colr; g.shadowBlur = blur; if (kind === 'h') g.fillRect(a, m - t / 2, b - a, t); else g.fillRect(m - t / 2, a, t, b - a) };
    g.globalAlpha = fade; bar(th, col || GLOW, cs * .5); bar(th * .3, '#ffffff', cs * .3);
    g.globalAlpha = fade * .9; g.fillStyle = '#ffffff'; for (const e of [a, b]) { g.beginPath(); kind === 'h' ? g.arc(e, m, th * .55, 0, 7) : g.arc(m, e, th * .55, 0, 7); g.fill() }
    g.shadowBlur = 0; return;
  }
  if (kind === 'b' || kind === 'bb') {   // bomb: white flash, then two shock rings racing out past the blast area
    const X = (c + .5) * cs, Y = (r + .5) * cs, big = kind === 'bb' ? 5 : 3;
    if (p < .25) { g.globalAlpha = 1 - p / .25; g.fillStyle = '#ffffff'; g.shadowColor = col || GLOW; g.shadowBlur = cs; g.beginPath(); g.arc(X, Y, cs * big * .45 * (.5 + p * 2), 0, 7); g.fill(); g.shadowBlur = 0 }
    for (const [lag, lw] of [[0, .16], [.18, .07]]) {
      const q = Math.max(0, (p - lag) / (1 - lag)), h = (.6 + (big + .6) * Math.sqrt(q)) * cs / 2;
      g.globalAlpha = (1 - q) * (q > 0 ? 1 : 0); g.strokeStyle = g.shadowColor = lag ? '#ffffff' : (col || GLOW); g.shadowBlur = cs * .4; g.lineWidth = cs * lw * (1 - q * .6);
      g.strokeRect(X - h, Y - h, 2 * h, 2 * h);
    }
    g.shadowBlur = 0; return;
  }
  g.fillStyle = GLOW; g.globalAlpha = (1 - p) * .35;
  if (kind === 'ww') { R(r, 1); C(c, 1) }
  if (kind === 'bw') { R(r - 1, 3); C(c - 1, 3) }
  if (kind === 'zz' || kind === 'z' || kind === 'zw' || kind === 'zb') g.fillRect(0, 0, w, w);
}
// Falling tiles accelerate (GRAV cells/s²), drift sideways for diagonal fills, and hop once on landing.
const GRAV = 70, HOP = .22;
function fall(p, dt){
  p.vy = (p.vy || 0) + GRAV * dt; p.y += p.vy * dt;
  const left = Math.max(1e-3, p.ty - p.y);
  p.x += (p.tx - p.x) * Math.min(1, p.vy * dt / left);
  if (p.y >= p.ty) {
    p.y = p.ty; p.x = p.tx;
    if (p.vy > 6 && !p.hopped) { p.vy *= -HOP; p.hopped = true }
    else { p.vy = 0; p.hopped = p.falling = false }
  }
}
let last = performance.now();
function frame(ts){
  const dt = Math.min(.05, (ts - last) / 1000); last = ts;
  if (S) {
    const n = S.n, step = 11 * dt;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, n * cs, n * cs);
    const sp = RM ? 1 : Math.min(1, (ts - shake.at) / 260);
    if (sp < 1) { const a = shake.amp * (1 - sp) ** 2; g.translate((fxRnd() - .5) * 2 * a, (fxRnd() - .5) * 2 * a) }
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n;
      g.fillStyle = PAL.cell; g.beginPath(); g.roundRect(c * cs + cs * .04, r * cs + cs * .04, cs * .92, cs * .92, cs * .1); g.fill();
      if (vEnc[i]) drawEnc(c * cs + cs / 2, r * cs + cs / 2, vEnc[i]);
    }
    for (const p of sprites.values()) {
      if (RM) { p.x = p.tx; p.y = p.ty; p.vy = 0; p.falling = false }
      else if (p.falling) fall(p, dt);
      else { p.x += Math.max(-step, Math.min(step, p.tx - p.x)); p.y += Math.max(-step, Math.min(step, p.ty - p.y)) }
      if (p.y < -0.5) continue;
      drawTile(p, p.x * cs + cs / 2, p.y * cs + cs / 2);
    }
    if (sel >= 0) { g.strokeStyle = PAL.sel; g.lineWidth = 2.5; g.strokeRect(sel % n * cs + 2, Math.floor(sel / n) * cs + 2, cs - 4, cs - 4) }
    fx = fx.filter(f => {
      const p = (ts - f.at) / (f.k === 'spark' ? f.life : f.k === 'flash' ? (f.kind === 'h' || f.kind === 'v' ? 420 : f.kind === 'b' || f.kind === 'bb' ? 460 : 320) : 240); if (p >= 1 || RM) return false;
      g.globalAlpha = 1 - p;
      if (f.k === 'spark') {   // a glowing streak along its velocity, falling and slowing
        const t = (ts - f.at) / 1000, x = f.x + f.vx * t * (1 - t * .6), y = f.y + f.vy * t + SPARK_G * t * t / 2, vy = f.vy + SPARK_G * t;
        g.strokeStyle = g.shadowColor = f.col; g.shadowBlur = cs * .25; g.lineWidth = cs * f.w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x * cs, y * cs); g.lineTo((x - f.vx * .05) * cs, (y - vy * .05) * cs); g.stroke(); g.shadowBlur = 0;
      }
      else if (f.k === 'pop') drawTile(f.p, f.p.x * cs + cs / 2, f.p.y * cs + cs / 2, 1 + p * .9);
      else {
        const r = Math.floor(f.i / n), c = f.i % n;
        if (f.k === 'crack') { g.strokeStyle = PAL.encInk; g.lineWidth = 3; g.strokeRect(c * cs + 2 - p * 6, r * cs + 2 - p * 6, cs - 4 + p * 12, cs - 4 + p * 12) }
        if (f.k === 'flash') { flashShape(f.kind, r, c, n, p, f.col) }
      }
      g.globalAlpha = 1; return true;
    });
  }
  requestAnimationFrame(frame);
}

/* ---------- hud, comms, sheets ---------- */
function icon(goal){
  const c = document.createElement('canvas'), s = 22, d = devicePixelRatio || 1; c.width = c.height = s * d; c.style.width = c.style.height = s + 'px';
  const g2 = g, cs2 = cs; g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); cs = s;
  if (goal.kind === 'crack') drawEnc(s / 2, s / 2, 2, s);
  else if (goal.kind === 'firewall') drawFw(s / 2, s / 2, s);
  else glyph(S.types[goal.t], s / 2, s / 2, s * .8);
  g = g2; cs = cs2; return c;
}
function hud(){
  $('#deckName').textContent = t('deck'); $('#patrolLabel').textContent = t('patrol'); $('#menuBtn').textContent = t('menu'); $('#wip').textContent = t('wip'); $('#log2').textContent = t('logHandshake'); $('#log3').textContent = t('logInject');
  $('#who').textContent = t('decker'); $('#turnText').textContent = t('turnPhone');
  $('#levelLabel').textContent = t('level', { c: chapterOf(S.level).n, n: S.level });
  const el = $('#goals'); el.textContent = '';
  for (const goal of S.goals) {
    const d = document.createElement('span'); d.className = 'goal' + (goal.got >= goal.need ? ' done' : '');
    d.append(icon(goal), String(Math.max(0, goal.need - goal.got))); el.append(d);
  }
  $('#moves').textContent = S.moves;
  $('#patrol').classList.toggle('warn', S.moves <= Math.ceil(S.limit * .25));
  $('#patrol').classList.toggle('low', S.moves <= 3);
}
function comms(){
  const lines = [t('comms1'), t('comms2'), t('comms3'), t('comms4'), t('comms5'), t('comms6'), t('comms7'), t('comms8'), t('comms9'), t('comms10'), t('comms11'), t('comms12')];
  $('#line').textContent = S.level === ENC_FROM ? t('hintCrack') : S.level === FW_FROM ? t('hintFirewall') : lines[hash(S.level, 23) % lines.length];
}
let toastTimer; function toast(s){ const el = $('#toast'); el.textContent = s; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 1600) }
let dismissable = false;
let artTimer;
const closeSheet = () => { $('#sheet').classList.remove('on'); clearInterval(artTimer); grace = performance.now() + 400 };
const closeMenu = () => { $('#menu').hidden = true; grace = performance.now() + 400 };
const closeSheets = () => { closeSheet(); closeMenu() };
// buttons: [label, fn, main]. dismiss: tap outside the card or Escape closes it (win and loss sheets never dismiss).
function showSheet(title, text, buttons, dismiss, art){
  const card = $('#card'); card.textContent = ''; dismissable = !!dismiss; clearInterval(artTimer);
  if (art) { const l = document.createElement('pre'), w = document.createElement('canvas'); l.setAttribute('aria-hidden', 'true'); w.setAttribute('aria-hidden', 'true'); l.className = 'ascL'; w.className = 'ascW'; card.append(l, w); animateArt(l, w) }
  const h = document.createElement('h2'); h.textContent = title; card.append(h);
  if (text) { const p = document.createElement('p'); p.textContent = text; card.append(p) }
  for (const [label, fn, main] of buttons) {
    const b = document.createElement('button'); b.className = 'btn' + (main ? ' main' : ''); b.textContent = label;
    b.onclick = () => { closeSheet(); fn() }; card.append(b);
  }
  $('#sheet').classList.add('on');
}
// win art: an ASCII padlock that clicks open and colour-cycling block letters (art, not text: no translation)
const PWNED = [' ██████  ██     ██ ███    ██ ███████ ██████  ', ' ██   ██ ██     ██ ████   ██ ██      ██   ██ ', ' ██████  ██  █  ██ ██ ██  ██ █████   ██   ██ ', ' ██      ██ ███ ██ ██  ██ ██ ██      ██   ██ ', ' ██       ███ ███  ██   ████ ███████ ██████  '];
const PADLOCK = [['', '     .---.', '    / .-. \\', '    | | | |', " .--'-'-'-'--.", ' |    [ ]    |', ' |    ( )    |', " '-----------'"],
  ['     .---.', '    / .-. \\', '    | | |_|', '    | |', " .--'-'------.", ' |    [ ]    |', ' |    (*)    |', " '-----------'"]].map(f => f.join('\n'));
function animateArt(l, w){
  let k = 0; const cols = PWNED[0].length, d = devicePixelRatio || 1, px = 6;   // block letters drawn as pixels: fonts differ in block glyph widths
  w.width = cols * px * d; w.height = PWNED.length * px * 1.4 * d; w.style.width = cols * px + 'px';
  const x2 = w.getContext('2d'); x2.scale(d, d);
  const tick = () => {
    k++; l.textContent = PADLOCK[RM || k % 8 >= 4 ? 1 : 0];
    x2.clearRect(0, 0, w.width, w.height);
    PWNED.forEach((row, i) => {
      const c = PAL.t[(i + k) % 7]; x2.fillStyle = c; x2.shadowColor = c; x2.shadowBlur = 6;
      for (let x = 0; x < cols; x++) if (row[x] === '█') {
        x2.globalAlpha = k % 9 === 0 && !RM && hash(k, i, x) % 5 === 0 ? .45 : 1;
        x2.fillRect(x * px, i * px * 1.4, px - .5, px * 1.4 - .5);
      }
    });
    x2.globalAlpha = 1;
  };
  tick(); if (!RM) artTimer = setInterval(tick, 140);
}
$('#sheet').onclick = e => { if (e.target === $('#sheet') && dismissable) closeSheet() };
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#sheet').classList.contains('on')) { if (dismissable) closeSheet() }
  else if (!$('#menu').hidden) closeMenu();
});

/* ---------- menu ---------- */
let tab = 0;
const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e };
const btn = (label, fn, cls = 'btn') => { const b = el('button', label, cls); b.onclick = fn; return b };
const confirmSheet = (text, fn) => showSheet(text, '', [[t('yes'), fn, true], [t('cancel'), () => {}]], true);
function renderMenu(){
  const m = $('#menu'); m.textContent = '';
  const tabs = el('div', null, 'tabs');
  [t('tabRun'), t('tabSettings'), t('tabInfo')].forEach((l, i) => { const b = btn(l, () => { tab = i; renderMenu() }, i === tab ? 'on' : ''); tabs.append(b) });
  const body = el('div', null, 'menu-body');
  if (tab === 0) {
    // level picker: up to the best level reached, any level on a local build
    const max = DEV ? MAX_LEVEL : run.best, inp = el('input'), go = btn('', () => { closeMenu(); begin(clampLevel(inp.value, max, S.level), 0) });
    Object.assign(inp, { type: 'number', min: 1, max, value: S.level, inputMode: 'numeric' }); inp.setAttribute('aria-label', t('pickLevel'));
    const show = () => { go.textContent = t('playLevel', { n: clampLevel(inp.value, max, S.level) }) };
    const step = d => { inp.value = clampLevel(+clampLevel(inp.value, max, S.level) + d, max, S.level); show() };
    const dn = btn('\u2212', () => step(-1)), up = btn('+', () => step(1));
    dn.setAttribute('aria-label', t('levelDown')); up.setAttribute('aria-label', t('levelUp'));
    inp.oninput = show; inp.onchange = () => { inp.value = clampLevel(inp.value, max, S.level); show() };
    inp.onkeydown = e => { if (e.key === 'Enter') go.click() };
    const row = el('div', null, 'seg pick'); row.append(dn, inp, up); show();
    body.append(el('label', t('pickLevel')), row, go);
  }
  if (tab === 0) body.append(
    el('p', t('best', { n: run.best })),
    btn(t('restart'), () => confirmSheet(t('restartAsk'), () => begin(S.level, S.fails))),
    btn(t('startOver'), () => confirmSheet(t('startOverAsk'), () => { run.fails = 0; saveRun(); begin(1, 0) })));
  if (tab === 1) {
    const sel = el('select'); for (const [c, n] of Object.entries(LANGS)) { const o = el('option', n); o.value = c; o.selected = c === document.documentElement.lang; sel.append(o) }
    sel.onchange = async () => { store.set('override-lang', sel.value); await setLang(sel.value); hud(); comms(); renderMenu() };
    body.append(el('label', t('language')), sel, el('label', t('palette')));
    const cur = store.get('override-palette') === 'colourblind' ? 'colourblind' : 'standard', seg = el('div', null, 'seg');
    for (const [k, l] of [['standard', t('paletteStandard')], ['colourblind', t('paletteColourblind')]]) seg.append(btn(l, () => { store.set('override-palette', k); readPal(); hud(); renderMenu() }, k === cur ? 'on' : ''));
    body.append(seg, el('label', t('playLog')), el('p', t('playLogText')));
    const lseg = el('div', null, 'seg');
    for (const [on, l] of [[false, t('off')], [true, t('on')]]) lseg.append(btn(l, () => {
      if (on === plog.on) return;
      if (on && !plog.id) plog.id = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join('');
      setOn(plog, on); if (on) logStart(true); savePlays(); renderMenu();
    }, on === plog.on ? 'on' : ''));
    body.append(lseg);
    if (plog.on) body.append(el('p', t('playLogCount', { n: plog.attempts.length })), btn(t('playLogDownload'), downloadLog));
    if (plog.attempts.length) body.append(btn(t('playLogClear'), () => confirmSheet(t('playLogClearAsk'), () => { plog.attempts = plog.attempts.filter(x => plog.on && x === openAttempt()); savePlays(); renderMenu() })));
  }
  if (tab === 2) {
    const a = el('a', t('github')); a.href = 'https://github.com/thomaslazar/override'; a.target = '_blank'; a.rel = 'noopener';
    body.append(el('h2', 'Override'), el('h3', t('howTitle')), el('p', t('howText')), el('p', t('fair')), btn(t('share'), share, 'btn main'), a, el('p', t('licence')), el('p', t('font')));
  }
  m.append(tabs, body, btn(t('keepPlaying'), closeMenu, 'btn main'));
}
$('#menuBtn').onclick = () => { if (busy || !S) return; renderMenu(); $('#menu').hidden = false };
async function downloadLog(){
  const ua = navigator.userAgent, first = l => l.find(n => ua.includes(n)), device = [first(['Android', 'iPhone', 'iPad', 'Windows', 'Mac OS', 'Linux']), first(['Firefox', 'Edg', 'Chrome', 'Safari'])].filter(Boolean).join(' ');
  const f = fileOf(plog, device, new Date()), file = new File([f.text], f.name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file] }) } catch {} return }
  const a = el('a'); a.href = URL.createObjectURL(file); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function share(){
  const url = location.origin + location.pathname;
  if (navigator.share) { try { await navigator.share({ title: 'Override', text: t('shareText'), url }) } catch {} return }
  try { await navigator.clipboard.writeText(url); toast(t('linkCopied')) }
  catch { showSheet(t('share'), url, [[t('cancel'), () => {}]], true) }
}

/* ---------- input ---------- */
let press = null;
const blocked = () => busy || performance.now() < grace || !S || $('#sheet').classList.contains('on') || !$('#menu').hidden;
const cellAt = e => { const b = cv.getBoundingClientRect(), r = Math.floor((e.clientY - b.top) / cs), c = Math.floor((e.clientX - b.left) / cs); return r >= 0 && c >= 0 && r < S.n && c < S.n ? r * S.n + c : -1 };
const adjacent = (a, b) => Math.abs(Math.floor(a / S.n) - Math.floor(b / S.n)) + Math.abs(a % S.n - b % S.n) === 1;
cv.onpointerdown = e => { if (blocked()) return; const p = cellAt(e); if (p < 0) return; press = { p, x: e.clientX, y: e.clientY, id: e.pointerId }; cv.setPointerCapture(e.pointerId) };
cv.onpointermove = e => {
  if (!press || e.pointerId !== press.id) return;
  const dx = e.clientX - press.x, dy = e.clientY - press.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < cs * .35) return;
  const r = Math.floor(press.p / S.n) + (Math.abs(dx) > Math.abs(dy) ? 0 : Math.sign(dy)), c = press.p % S.n + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0);
  const a = press.p; press = null; sel = -1;
  if (r >= 0 && c >= 0 && r < S.n && c < S.n) play(a, r * S.n + c);
};
cv.onpointerup = () => {
  if (!press) return; const p = press.p; press = null;
  if (sel >= 0 && adjacent(sel, p)) { const s = sel; sel = -1; play(s, p) }
  else sel = sel === p ? -1 : p;
};
cv.onpointercancel = () => press = null;

/* ---------- boot ---------- */
readPal(); fit();
document.fonts.ready.then(() => { if (S) hud() });
const first = load();
if (first.S) { S = first.S; logStart(false); start() } else begin(first.level, first.fails);
requestAnimationFrame(frame);
new ResizeObserver(() => S && fit()).observe($('#wrap'));   // the HUD's height changes too, not only the window
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
if ('serviceWorker' in navigator) {
  if (DEV) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).then(() => caches.keys()).then(ks => ks.filter(k => k.startsWith('override-')).forEach(k => caches.delete(k)));
  else navigator.serviceWorker.register('sw.js');
}
