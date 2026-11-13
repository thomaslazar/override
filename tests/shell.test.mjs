import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const sw = readFileSync('sw.js', 'utf8');

test('every art and font file is in SHELL', () => {
  const shell = sw.match(/const SHELL = \[([\s\S]*?)\];/)[1];
  const listed = [...shell.matchAll(/'([^']+)'/g)].map(m => m[1]);
  for (const dir of ['art', 'fonts'])
    for (const f of readdirSync(dir).filter(f => f !== 'OFL.txt'))
      assert.ok(listed.includes(`${dir}/${f}`), `${dir}/${f} missing from SHELL`);
});

test('the workflow copies art', () => {
  const wf = readFileSync('.github/workflows/pages.yml', 'utf8');
  assert.match(wf.split('\n').find(l => l.includes('cp -r')), / art /);
});

test('cache name is override-3', () => {
  assert.ok(sw.includes("const CACHE = 'override-3'"));
});
