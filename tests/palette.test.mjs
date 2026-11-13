import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTES, paletteFor } from '../src/palette.js';

const lum = h => {
  const n = parseInt(h.slice(1), 16);
  const [r, g, b] = [n >> 16, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 });
  return .2126 * r + .7152 * g + .0722 * b;
};

test('standard palette', () => {
  assert.deepEqual(PALETTES.standard, ['#3dff8a', '#35c2d9', '#ff4fa3', '#f2c230', '#a77cf0', '#ff6a2b', '#e9f0ff']);
});
test('colour-blind palette is the Okabe-Ito set with luminance steps', () => {
  const cb = PALETTES.colourblind;
  assert.deepEqual([...cb].sort(), ['#56b4e9', '#e69f00', '#f0e442', '#009e73', '#0072b2', '#d55e00', '#cc79a7'].sort());
  for (let i = 1; i < 7; i++) assert.ok(Math.abs(lum(cb[i]) - lum(cb[i - 1])) >= .08, `${cb[i - 1]} / ${cb[i]}`);
});
test('seven distinct colours each; unknown name is standard', () => {
  for (const p of Object.values(PALETTES)) assert.equal(new Set(p).size, 7);
  assert.deepEqual(paletteFor('nope'), PALETTES.standard);
  assert.deepEqual(paletteFor('colourblind'), PALETTES.colourblind);
});
