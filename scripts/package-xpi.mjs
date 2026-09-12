import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceDir = resolve(rootDir, 'dist/firefox');
const artifactsDir = resolve(rootDir, 'dist/firefox-artifacts');

if (!existsSync(sourceDir)) {
  throw new Error('Firefox extension output is missing. Run pnpm build before packaging.');
}

await rm(artifactsDir, { recursive: true, force: true });
await mkdir(artifactsDir, { recursive: true });
runWebExt([
  'build',
  '--source-dir', sourceDir,
  '--artifacts-dir', artifactsDir,
  '--filename', 'raptorqr-web-ext-dev.xpi',
  '--overwrite-dest',
]);

const artifacts = await readdir(artifactsDir);
if (!artifacts.includes('raptorqr-web-ext-dev.xpi')) {
  throw new Error('web-ext did not create the expected development XPI.');
}

console.log(`Created development XPI: ${resolve(artifactsDir, 'raptorqr-web-ext-dev.xpi')}`);

function runWebExt(args) {
  execFileSync('pnpm', ['exec', 'web-ext', ...args], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}