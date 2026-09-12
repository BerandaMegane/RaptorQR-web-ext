import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDir = resolve(rootDir, 'dist');
const targets = ['chromium', 'firefox'];

export async function verifyExtensionOutputs() {
  for (const target of targets) {
    await verifyTarget(target, resolve(distDir, target));
  }

  console.log('Verified Chromium and Firefox extension outputs.');
}

async function verifyTarget(target, targetDir) {
  const files = await listFiles(targetDir);
  const relativeFiles = files.map((file) => relative(targetDir, file).replaceAll('\\', '/'));
  const manifest = await readJson(resolve(targetDir, 'manifest.json'));

  requireValue(manifest.manifest_version === 3, `${target}: manifest_version must be 3.`);
  requireValue(typeof manifest.name === 'string' && manifest.name.length > 0, `${target}: name is required.`);
  requireValue(typeof manifest.version === 'string' && manifest.version.length > 0, `${target}: version is required.`);
  requireValue(typeof manifest.action?.default_title === 'string', `${target}: action.default_title is required.`);
  requireValue(
    manifest.content_security_policy?.extension_pages === "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    `${target}: extension page CSP must allow only local scripts and WebAssembly compilation.`,
  );
  requireValue(!('permissions' in manifest), `${target}: permissions must not be requested.`);
  requireValue(!('host_permissions' in manifest), `${target}: host_permissions must not be requested.`);
  requireFile(relativeFiles, 'LICENSE', `${target}: extension license`);
  requireFile(relativeFiles, 'LICENSES/RaptorQR-MIT.txt', `${target}: RaptorQR license notice`);
  requireFile(relativeFiles, 'LICENSES/Apache-2.0.txt', `${target}: Apache 2.0 license notice`);
  requireFile(relativeFiles, 'LICENSES/MIT-DEPENDENCIES.txt', `${target}: bundled MIT dependency notices`);
  requireFile(relativeFiles, 'LICENSES/fast_qr-MIT.txt', `${target}: fast_qr license notice`);
  requireFile(relativeFiles, 'LICENSES/Zint-BSD-3-Clause.txt', `${target}: Zint BSD 3-Clause license notice`);
  requireFile(relativeFiles, 'LICENSES/ZXing-WASM-NOTICE.txt', `${target}: ZXing WASM provenance notice`);

  for (const iconPath of Object.values(manifest.icons ?? {})) {
    requireValue(typeof iconPath === 'string', `${target}: icon path is invalid.`);
    requireFile(relativeFiles, iconPath, `${target}: icon`);
  }

  if (target === 'firefox') {
    requireValue(!('service_worker' in manifest.background), `${target}: Chromium-only background service worker is not allowed.`);
    requireValue(
      JSON.stringify(manifest.background?.scripts) === '["background.js"]',
      `${target}: Firefox background script fallback is required.`,
    );
    requireFile(relativeFiles, manifest.background.scripts[0], `${target}: background script`);
    requireValue(typeof manifest.browser_specific_settings?.gecko?.id === 'string', `${target}: Gecko ID is required.`);
    requireValue(manifest.browser_specific_settings?.gecko?.strict_min_version === '142.0', `${target}: Gecko minimum version must support the declared data collection setting.`);
    requireValue(
      JSON.stringify(manifest.browser_specific_settings?.gecko?.data_collection_permissions?.required) === '["none"]',
      `${target}: Gecko data collection declaration is invalid.`,
    );
  } else {
    requireValue(manifest.background?.service_worker === 'background.js', `${target}: background service worker is invalid.`);
    requireFile(relativeFiles, manifest.background.service_worker, `${target}: background service worker`);
    requireValue(!('scripts' in manifest.background), `${target}: Firefox-only background script fallback is not allowed.`);
    requireValue(!('browser_specific_settings' in manifest), `${target}: Firefox-only settings are not allowed.`);
  }

  requireFile(relativeFiles, 'app/index.html', `${target}: application HTML`);
  requireMatch(relativeFiles, /^app\/assets\/index-[^/]+\.js$/, `${target}: application JavaScript`);
  requireMatch(relativeFiles, /^app\/assets\/encode\.worker-[^/]+\.js$/, `${target}: encode worker`);
  requireMatch(relativeFiles, /^app\/assets\/decode\.worker-[^/]+\.js$/, `${target}: decode worker`);
  requireMatch(relativeFiles, /^app\/assets\/qr_render\.worker-[^/]+\.js$/, `${target}: QR render worker`);
  requireMatch(relativeFiles, /^app\/assets\/gif\.worker-[^/]+\.js$/, `${target}: GIF worker`);
  requireMatch(relativeFiles, /^app\/assets\/raptorqr_fast_qr_wasm_bg-[^/]+\.wasm$/, `${target}: Fast QR WASM`);
  requireMatch(relativeFiles, /^app\/assets\/raptorqr_raptorq_wasm_bg-[^/]+\.wasm$/, `${target}: RaptorQ WASM`);
  requireMatch(relativeFiles, /^app\/assets\/zxing_reader-[^/]+\.wasm$/, `${target}: ZXing reader WASM`);
  requireMatch(relativeFiles, /^app\/assets\/zxing_writer-[^/]+\.wasm$/, `${target}: ZXing writer WASM`);

  for (const forbiddenPath of ['app/sw.js', 'app/manifest.webmanifest']) {
    requireValue(!relativeFiles.includes(forbiddenPath), `${target}: PWA asset remains: ${forbiddenPath}`);
  }

  const textFiles = files.filter((file) => /\.(?:css|html|js|json|mjs)$/i.test(file));
  const textContents = await Promise.all(textFiles.map(async (file) => ({
    file,
    content: await readFile(file, 'utf8'),
  })));

  for (const { file, content } of textContents) {
    const fileName = relative(targetDir, file).replaceAll('\\', '/');
    requireValue(!/navigator\.serviceWorker|serviceWorker\.register|caches\.open/.test(content), `${target}: PWA runtime code remains in ${fileName}.`);
    requireValue(!/-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----|AMO_(?:API_KEY|API_SECRET|JWT_ISSUER|JWT_SECRET)/.test(content), `${target}: credential material remains in ${fileName}.`);
    requireValue(!/\b(?:fetch|importScripts)\s*\(\s*['"]https?:\/\//.test(content), `${target}: external runtime URL remains in ${fileName}.`);

    if (/\.(?:html|css)$/i.test(file)) {
      verifyDocumentReferences(target, targetDir, fileName, content);
    }
  }
}

function verifyDocumentReferences(target, targetDir, fileName, content) {
  const references = [
    ...content.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi),
    ...content.matchAll(/\burl\(\s*["']?([^\s)'";]+)["']?\s*\)/gi),
  ];

  for (const match of references) {
    const reference = match[1];
    if (reference.startsWith('data:') || reference.startsWith('#')) continue;
    requireValue(!/^https?:\/\//i.test(reference), `${target}: external URL in ${fileName}: ${reference}`);
    requireValue(!reference.startsWith('/'), `${target}: absolute package path in ${fileName}: ${reference}`);

    const resolvedPath = resolve(dirname(resolve(targetDir, fileName)), reference);
    requireValue(resolvedPath.startsWith(targetDir), `${target}: path escapes package in ${fileName}: ${reference}`);
    requireValue(existsSync(resolvedPath), `${target}: missing ${reference} referenced by ${fileName}.`);
  }
}

async function listFiles(directory) {
  requireValue(existsSync(directory), `Extension output is missing: ${directory}`);
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nestedFiles.flat();
}

async function readJson(path) {
  requireValue(existsSync(path), `Extension output is missing: ${path}`);
  return JSON.parse(await readFile(path, 'utf8'));
}

function requireFile(files, expectedPath, description) {
  requireValue(files.includes(expectedPath), `${description} is missing: ${expectedPath}`);
}

function requireMatch(files, pattern, description) {
  requireValue(files.some((file) => pattern.test(file)), `${description} is missing.`);
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await verifyExtensionOutputs();
}