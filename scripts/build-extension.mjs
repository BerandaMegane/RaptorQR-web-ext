import { execFileSync } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest } from './build-manifest.mjs';
import { verifyExtensionOutputs } from './verify-extension.mjs';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const upstreamDistDir = resolve(rootDir, 'vendor/RaptorQR/apps/web/dist');
const distDir = resolve(rootDir, 'dist');
const targets = ['chromium', 'firefox'];

run(process.execPath, [resolve(rootDir, 'scripts/build-raptorqr-web.mjs')]);
run(process.execPath, [resolve(rootDir, 'scripts/generate-icons.mjs')]);

await rm(distDir, { recursive: true, force: true });

for (const target of targets) {
  const targetDir = resolve(distDir, target);
  await mkdir(targetDir, { recursive: true });
  await cp(upstreamDistDir, resolve(targetDir, 'app'), { recursive: true });
  await cp(resolve(rootDir, 'extension/background.js'), resolve(targetDir, 'background.js'));
  await cp(resolve(rootDir, 'assets/icons'), resolve(targetDir, 'icons'), { recursive: true });
  await cp(resolve(rootDir, 'LICENSE'), resolve(targetDir, 'LICENSE'));
  await cp(resolve(rootDir, 'LICENSES'), resolve(targetDir, 'LICENSES'), { recursive: true });
  await buildManifest(target, resolve(targetDir, 'manifest.json'));
  verifyTarget(targetDir);
}

await verifyExtensionOutputs();
console.log('Built Chromium and Firefox extension directories.');

function verifyTarget(targetDir) {
  for (const requiredPath of [
    'manifest.json',
    'background.js',
    'app/index.html',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png',
    'LICENSE',
    'LICENSES/RaptorQR-MIT.txt',
    'LICENSES/Apache-2.0.txt',
    'LICENSES/MIT-DEPENDENCIES.txt',
    'LICENSES/fast_qr-MIT.txt',
    'LICENSES/Zint-BSD-3-Clause.txt',
    'LICENSES/ZXing-WASM-NOTICE.txt',
  ]) {
    if (!existsSync(resolve(targetDir, requiredPath))) {
      throw new Error(`Extension output is missing ${requiredPath}.`);
    }
  }
}

function run(command, args) {
  execFileSync(command, args, { cwd: rootDir, stdio: 'inherit' });
}