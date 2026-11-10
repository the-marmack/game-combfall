import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the workflow tests and publishes web', async () => {
  const workflow = await read('.github/workflows/pages.yml');
  assert.match(workflow, /npm test/);
  assert.match(workflow, /path: web\s*$/m);
});

test('every link in the page is relative', async () => {
  const html = await read('web/index.html');
  const links = [...html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']*)["']/g)].map((m) => m[1]);
  assert.ok(links.length > 0, 'the page has links');
  for (const link of links) {
    assert.equal(link.startsWith('/'), false, link);
    assert.equal(link.startsWith('http'), false, link);
  }
});

test('the readme links the live game', async () => {
  const readme = await read('README.md');
  assert.match(readme, /^Play at https:\/\/the-marmack\.github\.io\/game-combfall\/$/m);
});
