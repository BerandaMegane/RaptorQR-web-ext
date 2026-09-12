import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const upstreamDir = resolve(rootDir, 'vendor/RaptorQR');
const patchPath = resolve(rootDir, 'patches/raptorqr-extension-build.patch');

if (!existsSync(resolve(upstreamDir, '.git'))) {
  throw new Error('RaptorQR submodule is not initialized. Run git submodule update --init --recursive.');
}

if (canApply(['apply', '--check', patchPath])) {
  run(['apply', patchPath]);
  console.log('Applied RaptorQR extension build patch.');
} else if (canApply(['apply', '--reverse', '--check', patchPath])) {
  console.log('RaptorQR extension build patch is already applied.');
} else {
  throw new Error('RaptorQR extension build patch does not match the checked-out upstream revision.');
}

function canApply(args) {
  try {
    execFileSync('git', ['-C', upstreamDir, ...args], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(args) {
  execFileSync('git', ['-C', upstreamDir, ...args], { stdio: 'inherit' });
}