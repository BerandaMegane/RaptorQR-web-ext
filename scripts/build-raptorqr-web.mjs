import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const upstreamDir = resolve(rootDir, 'vendor/RaptorQR');
const distDir = resolve(upstreamDir, 'apps/web/dist');
const verifyOnly = process.argv.includes('--verify-only');

if (!existsSync(resolve(upstreamDir, '.git'))) {
  throw new Error('RaptorQR submodule is not initialized. Run git submodule update --init --recursive.');
}

if (!verifyOnly) {
  run('node', [resolve(rootDir, 'scripts/apply-raptorqr-extension-patch.mjs')], rootDir);
  run('pnpm', ['install', '--frozen-lockfile'], upstreamDir);
  run('pnpm', ['build'], upstreamDir, { VITE_EXTENSION_BUILD: 'true' });
}

await verifyExtensionBuild();

async function verifyExtensionBuild() {
  if (!existsSync(distDir)) {
    throw new Error('RaptorQR build output is missing. Run pnpm run build:upstream first.');
  }

  const files = await listFiles(distDir);
  const relativeFiles = files.map((file) => relative(distDir, file).replaceAll('\\', '/'));
  const fileContents = await Promise.all(files.map((file) => readFile(file, 'utf8').catch(() => '')));
  const combinedContents = fileContents.join('\n');

  requireFile(relativeFiles, 'index.html');
  requireMatch(relativeFiles, /(^|\/)assets\/index-[^/]+\.js$/, 'application JavaScript');
  requireMatch(relativeFiles, /(^|\/)assets\/encode\.worker-[^/]+\.js$/, 'encode worker');
  requireMatch(relativeFiles, /(^|\/)assets\/decode\.worker-[^/]+\.js$/, 'decode worker');
  requireMatch(relativeFiles, /(^|\/)assets\/qr_render\.worker-[^/]+\.js$/, 'QR render worker');
  requireMatch(relativeFiles, /(^|\/)assets\/gif\.worker-[^/]+\.js$/, 'GIF worker');
  requireMatch(relativeFiles, /raptorqr_fast_qr_wasm_bg-[^/]+\.wasm$/, 'Fast QR WASM');
  requireMatch(relativeFiles, /raptorqr_raptorq_wasm_bg-[^/]+\.wasm$/, 'RaptorQ WASM');
  requireMatch(relativeFiles, /zxing_reader-[^/]+\.wasm$/, 'ZXing reader WASM');
  requireMatch(relativeFiles, /zxing_writer-[^/]+\.wasm$/, 'ZXing writer WASM');

  for (const forbiddenFile of ['sw.js', 'manifest.webmanifest']) {
    if (relativeFiles.includes(forbiddenFile)) {
      throw new Error(`Extension build unexpectedly includes ${forbiddenFile}.`);
    }
  }

  for (const forbiddenCode of ['navigator.serviceWorker', 'serviceWorker.register', 'caches.open']) {
    if (combinedContents.includes(forbiddenCode)) {
      throw new Error(`Extension build unexpectedly includes ${forbiddenCode}.`);
    }
  }

  const indexHtml = await readFile(join(distDir, 'index.html'), 'utf8');
  if (indexHtml.includes('manifest.webmanifest')) {
    throw new Error('Extension build HTML still references manifest.webmanifest.');
  }
  if (/\b(?:src|href)=["']https?:\/\//i.test(indexHtml)) {
    throw new Error('Extension build HTML references an external HTTP(S) asset.');
  }

  console.log(`Verified RaptorQR extension build (${relativeFiles.length} files).`);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return files.flat();
}

function requireFile(files, expectedFile) {
  if (!files.includes(expectedFile)) {
    throw new Error(`Extension build is missing ${expectedFile}.`);
  }
}

function requireMatch(files, pattern, description) {
  if (!files.some((file) => pattern.test(file))) {
    throw new Error(`Extension build is missing ${description}.`);
  }
}

function run(command, args, cwd, environment = {}) {
  execFileSync(command, args, {
    cwd,
    env: { ...process.env, ...environment },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });
}