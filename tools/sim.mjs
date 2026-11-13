// Balance report: node tools/sim.mjs [levels] [runs] [--refill nice]
// levels: "1-60", "3,25,50" or a mix; runs: attempts per level (run r plays with fails = r).
import { prepare, solve, pick, CAP } from '../src/bot.js';
import { move, won, mulberry32, hash } from '../src/core.js';
import { chapterOf, difficulty } from '../src/levels.js';

const args = process.argv.slice(2), nice = args.join(' ').includes('--refill nice');
const pos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--refill');
const levels = (pos[0] || '1,3,5,10,15,20,25,30,31,45,60').split(',').flatMap(p => {
  const [a, b] = p.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
});
const runs = +(pos[1] || 1), goal = g => g.kind === 'tiles' ? `t${g.t}:${g.need}` : `${g.kind}:${g.need}`;
console.log('level ch  n k goals                          need limit margin salt drop target ratio  w/m   4+    ms' + (nice ? '  nice saved' : ''));
let saved = 0, count = 0;
const ratios = [], wpm = [], big = [], times = [], med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
// replay three bot games as solve plays them (own refill seed, nice off, no limit), counting wave steps per move
const cascades = S => {
  let moves = 0, waves = 0, many = 0;
  for (let k = 0; k < 3; k++) {
    const C = structuredClone(S), rnd = mulberry32(k); C.nice = false; C.seed = hash(S.seed, k, 17); C.moves = CAP; C.limit = 0;
    while (C.moves > 0 && !won(C)) {
      const p = pick(C, rnd); if (!p) break;
      const r = move(C, p[0], p[1]); if (!r.ok) break;
      const w = r.steps.filter(s => s.k === 'wave').length; moves++; waves += w; if (w >= 4) many++;
    }
  }
  return moves ? [waves / moves, 100 * many / moves] : [0, 0];
};
for (const l of levels) for (let r = 0; r < runs; r++) {
  const t0 = Date.now(), S = prepare(l, r), ms = Date.now() - t0;
  const target = Math.round(8 + 14 * difficulty(l)), ratio = Math.round(100 * S.need / target), [wm, big4] = cascades(S);
  ratios.push(ratio); wpm.push(wm); big.push(big4); times.push(ms);
  let line = `${String(l).padStart(5)} ${String(chapterOf(l).n).padStart(2)} ${S.n} ${S.k} ${S.goals.map(goal).join(' ').padEnd(30)} ${String(S.need).padStart(4)} ${String(S.limit).padStart(5)} ${String(S.limit - S.need).padStart(6)} ${String(S.salt).padStart(4)} ${String(S.drop).padStart(4)} ${String(target).padStart(6)} ${String(ratio).padStart(4)}% ${wm.toFixed(2)} ${String(big4.toFixed(0)).padStart(3)}% ${String(ms).padStart(5)}`;
  if (nice) {
    const xs = [0, 1, 2].map(k => solve(S, k, true)).sort((a, b) => a - b), nn = xs[1];
    line += ` ${String(nn).padStart(5)} ${String(S.need - nn).padStart(5)}`;
    if (Number.isFinite(nn)) { saved += S.need - nn; count++ }
  }
  console.log(line);
}
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`summary: median ratio ${med(ratios)}%, waves/move ${mean(wpm).toFixed(2)}, 4+ share ${mean(big).toFixed(1)}%, ms median ${med(times)} max ${Math.max(...times)}`);
if (nice && count) console.log(`helpful refill saves ${(saved / count).toFixed(1)} moves per level on average`);
