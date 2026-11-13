// Play log report: node tools/plays.mjs <file> [file ...]  (files exported from the menu's Play log)
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const med = a => a.length ? [...a].sort((x, y) => x - y)[a.length >> 1] : null;
const used = a => a.left == null ? a.moves.length : a.limit - a.left;

// One row per level (sorted), then a total row with level 'all'.
export function report(files) {
  const all = files.flatMap(f => f.attempts);
  const row = (level, as) => {
    const ms = as.flatMap(a => a.moves), fin = as.filter(a => a.end === 'won' || a.end === 'lost');
    return { level, attempts: as.length, won: as.filter(a => a.end === 'won').length, lost: as.filter(a => a.end === 'lost').length,
      left: as.filter(a => a.end === 'left').length, used: med(fin.map(used)), need: med(as.map(a => a.need).filter(x => x != null)), limit: med(as.map(a => a.limit).filter(x => x != null)),
      wpm: ms.length ? ms.reduce((n, m) => n + m.w, 0) / ms.length : null, big: ms.length ? 100 * ms.filter(m => m.w >= 4).length / ms.length : null };
  };
  const levels = [...new Set(all.map(a => a.level))].sort((a, b) => a - b);
  return [...levels.map(l => row(l, all.filter(a => a.level === l))), row('all', all)];
}

const f = (x, d = 0) => x == null ? '-' : x.toFixed(d);
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length < 3) { console.log('usage: node tools/plays.mjs <file> [file ...]'); process.exit(0); }
  const files = process.argv.slice(2).map(p => JSON.parse(readFileSync(p, 'utf8')));
  console.log('level  tries  won lost left  used  need limit  waves/move  4+%');
  for (const r of report(files)) console.log(`${String(r.level).padStart(5)} ${String(r.attempts).padStart(6)} ${String(r.won).padStart(4)} ${String(r.lost).padStart(4)} ${String(r.left).padStart(4)} ${f(r.used).padStart(5)} ${f(r.need).padStart(5)} ${f(r.limit).padStart(5)} ${f(r.wpm, 2).padStart(11)} ${f(r.big).padStart(4)}`);
}
