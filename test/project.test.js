import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('project has an MIT licence and no dependencies', async () => {
  assert.match(await read('LICENSE'), /MIT License/);

  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.license, 'MIT');
  assert.equal('dependencies' in pkg, false);
  assert.equal('devDependencies' in pkg, false);
});

test('readme says how to play and run', async () => {
  const readme = await read('README.md');
  assert.match(readme, /^## How to play$/m);
  assert.match(readme, /^## Run it$/m);
});
