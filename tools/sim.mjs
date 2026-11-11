// Balance report: node tools/sim.mjs [levels] [runs] [--refill nice]
// levels: "1-60", "3,25,50" or a mix; runs: attempts per level (run r plays with fails = r).
import { prepare, solve } from '../src/bot.js';
import { chapterOf } from '../src/levels.js';

const args = process.argv.slice(2), nice = args.join(' ').includes('--refill nice');
const pos = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--refill');
const levels = (pos[0] || '1,3,5,10,15,20,25,30,31,45,60').split(',').flatMap(p => {
  const [a, b] = p.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
});
const runs = +(pos[1] || 1), goal = g => g.kind === 'tiles' ? `t${g.t}:${g.need}` : `${g.kind}:${g.need}`;
console.log('level ch  n k goals                          need limit margin salt drop    ms' + (nice ? '  nice saved' : ''));
let saved = 0, count = 0;
for (const l of levels) for (let r = 0; r < runs; r++) {
  const t0 = Date.now(), S = prepare(l, r), ms = Date.now() - t0;
  let line = `${String(l).padStart(5)} ${String(chapterOf(l).n).padStart(2)} ${S.n} ${S.k} ${S.goals.map(goal).join(' ').padEnd(30)} ${String(S.need).padStart(4)} ${String(S.limit).padStart(5)} ${String(S.limit - S.need).padStart(6)} ${String(S.salt).padStart(4)} ${String(S.drop).padStart(4)} ${String(ms).padStart(5)}`;
  if (nice) {
    const xs = [0, 1, 2].map(k => solve(S, k, true)).sort((a, b) => a - b), nn = xs[1];
    line += ` ${String(nn).padStart(5)} ${String(S.need - nn).padStart(5)}`;
    if (Number.isFinite(nn)) { saved += S.need - nn; count++ }
  }
  console.log(line);
}
if (nice && count) console.log(`helpful refill saves ${(saved / count).toFixed(1)} moves per level on average`);
