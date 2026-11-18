// Cred, stock, loot and gear offers. Pure: no DOM, no storage.
import { rngFor, GEAR_IDS } from './core.js';
import { chapterOf, difficulty, CHAPTER } from './levels.js';

export const ITEMS = [
  { id: 'worm', kind: 'gear', price: 40 }, { id: 'bomb', kind: 'gear', price: 50 },
  { id: 'rocket', kind: 'gear', price: 40 }, { id: 'zero', kind: 'gear', price: 100 },
  { id: 'moves', kind: 'gear', price: 60 }, { id: 'hammer', kind: 'tool', price: 60 },
  { id: 'swap', kind: 'tool', price: 80 }, { id: 'shuffle', kind: 'tool', price: 30 },
];
export const STARTER = { worm: 2, bomb: 1, rocket: 1, hammer: 1, shuffle: 1 };
const LOOT = { shuffle: 3, worm: 3, rocket: 2, bomb: 2, hammer: 2, moves: 2, swap: 1, zero: 1 };
const nat = v => Number.isInteger(v) && v >= 0;

// A stored deck, repaired field by field: a bad cred or item count becomes 0, unknown ids are dropped;
// a missing or non-object value gives the starter set.
export function deckFrom(o){
  const items = {};
  if (!o || typeof o !== 'object') { for (const { id } of ITEMS) items[id] = STARTER[id] || 0; return { cred: 0, items } }
  const got = o.items && typeof o.items === 'object' ? o.items : {};
  for (const { id } of ITEMS) items[id] = nat(got[id]) ? got[id] : 0;
  return { cred: nat(o.cred) ? o.cred : 0, items };
}

export const payout = (score, best) => best == null ? Math.floor(score / 100) : Math.max(0, Math.floor((score - best) / 100));

export function lootFor(level){
  const { start, pos } = chapterOf(level), r = rngFor(level, 47);
  const d = difficulty(level);
  let rank = 0;   // levels of the chapter strictly harder; ties count in its favour
  for (let i = 0; i < CHAPTER; i++) if (difficulty(start + i) > d) rank++;
  const p = pos % 5 === 0 || pos === CHAPTER ? 1 : rank < 10 ? .35 : .10;
  if (r() >= p) return null;
  let x = r() * Object.values(LOOT).reduce((a, b) => a + b, 0);
  for (const [id, w] of Object.entries(LOOT)) if ((x -= w) < 0) return id;
  return 'shuffle';
}

export function gearFor(level){
  const r = rngFor(level, 53), pool = [...GEAR_IDS], out = [];
  while (out.length < 3) {
    const id = pool.splice(Math.floor(r() * pool.length), 1)[0];
    out.push(id === 'moves' ? { id, n: 3 + Math.floor(r() * 3) } : { id });
  }
  return out;
}

export const add = (deck, id, k = 1) => { deck.items[id] = (deck.items[id] || 0) + k };
export function buy(deck, id){
  const price = ITEMS.find(i => i.id === id)?.price;
  if (price == null || deck.cred < price) return false;
  deck.cred -= price; add(deck, id); return true;
}
export function take(deck, id){
  if (!(deck.items[id] > 0)) return false;
  deck.items[id]--; return true;
}
