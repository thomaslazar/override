// Opt-in play log: pure, mutates only the log passed in. Move entry: {n, w, c, sm, sf, g, sh}.
export const PLAYS_V = 1, PLAYS_MAX = 1e6;
export const logFrom = o => {
  const l = o && typeof o === 'object' ? o : {};
  return { v: PLAYS_V, on: l.on === true, id: typeof l.id === 'string' && l.id.length >= 8 && l.id.length <= 32 ? l.id : null,
    attempts: Array.isArray(l.attempts) ? l.attempts.filter(a => a && typeof a === 'object' && Array.isArray(a.moves)) : [] };
};
export const attemptOf = (S, at) => ({ level: S.level, fails: S.fails, n: S.n, k: S.k,
  goals: S.goals.map(g => g.t === undefined ? { kind: g.kind, need: g.need } : { kind: g.kind, t: g.t, need: g.need }),
  limit: S.limit, need: S.need, salt: S.salt, drop: S.drop, at, moves: [], end: null, left: null, t: 0 });
const open = log => { const a = log.attempts.at(-1); return a && a.end === null ? a : null; };
export const close = (log, end, S, seconds = 0) => { const a = open(log); if (a) { a.end = end; a.left = S ? S.limit - S.moves : null; a.t = seconds; } };
export const startAttempt = (log, attempt) => { close(log, 'left'); log.attempts.push(attempt); };
export const resume = (log, S) => { const a = open(log); if (a && a.level === S.level && a.fails === S.fails) return true; close(log, 'left'); return false; };
export const logMove = (log, entry) => open(log)?.moves.push(entry);
export const entryOf = (S, steps, n) => {
  const sum = (k, f) => steps.reduce((x, s) => x + (s.k === k ? f(s) : 0), 0);
  return { n, w: sum('wave', () => 1), c: sum('wave', s => s.cleared.length), sm: sum('wave', s => s.created.length),
    sf: sum('wave', s => s.fired.length), g: S.goals.map(g => g.got), sh: steps.some(s => s.k === 'shuffle') ? 1 : 0 };
};
export const setOn = (log, on) => { log.on = on; if (!on && open(log)) log.attempts.pop(); };
export const trim = (log, max = PLAYS_MAX) => {
  while (JSON.stringify(log).length > max && log.attempts.length > (open(log) ? 1 : 0)) log.attempts.shift();
};
export const fileOf = (log, device, date) => ({ name: `override-plays-${date.toISOString().slice(0, 10)}.json`,
  text: JSON.stringify({ v: PLAYS_V, id: log.id, device, attempts: log.attempts }) });
