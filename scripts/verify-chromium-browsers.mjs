import { access, mkdtemp, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const extensionDir = resolve(rootDir, 'dist/chromium');
const browsers = [
  {
    name: 'Chrome',
    executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  },
  {
    name: 'Edge',
    executablePath: process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  },
];

await assertReadable(extensionDir, 'Run pnpm build before browser verification.');

for (const browser of browsers) {
  await verifyBrowser(browser);
}

console.log('Verified the unpacked RaptorQR extension in Chrome and Edge, including offline operation.');

async function verifyBrowser(browser) {
  await assertReadable(browser.executablePath, `${browser.name} was not found. Set ${browser.name.toUpperCase()}_PATH to override the executable path.`);

  const profileDir = await mkdtemp(resolve(tmpdir(), 'raptorqr-extension-'));
  let context;
  let browserInstance;
  let browserProcess;

  try {
    ({ context, browserInstance, browserProcess } = await launchBrowser(browser.executablePath, profileDir));

    const externalRequests = [];
    const browserErrors = [];
    context.on('request', (request) => {
      if (/^https?:\/\//i.test(request.url())) externalRequests.push(request.url());
    });
    context.on('page', (page) => attachErrorCapture(page, browserErrors));

    const extensionOrigin = await getExtensionOrigin(context, browser.name);
    await context.grantPermissions(['camera'], { origin: extensionOrigin });

    const page = await context.newPage();
    attachErrorCapture(page, browserErrors);
    await page.goto(`${extensionOrigin}/app/index.html`, { waitUntil: 'domcontentloaded' });
    await verifySender(page, 'Browser smoke text');
    await verifyFileSender(page);
    await verifyCamera(page);

    await context.setOffline(true);
    const offlinePage = await context.newPage();
    attachErrorCapture(offlinePage, browserErrors);
    await offlinePage.goto(`${extensionOrigin}/app/index.html`, { waitUntil: 'domcontentloaded' });
    await verifySender(offlinePage, 'Offline browser smoke text');

    requireValue(externalRequests.length === 0, `${browser.name}: external network requests occurred: ${externalRequests.join(', ')}`);
    requireValue(browserErrors.length === 0, `${browser.name}: browser errors occurred: ${browserErrors.join(' | ')}`);
    console.log(`${browser.name}: app, workers, WASM, camera permission, file input, and offline text transfer verified.`);
  } finally {
    await context?.close();
    await browserInstance?.close();
    await stopBrowser(browserProcess);
    await rm(profileDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }
}

async function launchBrowser(executablePath, profileDir) {
  const port = await getAvailablePort();
  const endpoint = `http://127.0.0.1:${port}`;
  const browserProcess = spawn(executablePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    `--disable-extensions-except=${extensionDir}`,
    `--load-extension=${extensionDir}`,
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--no-first-run',
    '--no-default-browser-check',
  ], { stdio: 'ignore' });

  try {
    await waitForDebugger(endpoint);
    const browserInstance = await chromium.connectOverCDP(endpoint);
    const context = browserInstance.contexts()[0];
    requireValue(context, 'Browser did not create a persistent context.');
    return { browserInstance, browserProcess, context };
  } catch (error) {
    browserProcess.kill();
    throw error;
  }
}

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  await new Promise((resolvePromise) => server.close(resolvePromise));
  requireValue(typeof address === 'object' && address !== null, 'Could not allocate a debugger port.');
  return address.port;
}

async function waitForDebugger(endpoint) {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }

  throw new Error(`Browser debugger did not start: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

async function stopBrowser(browserProcess) {
  if (!browserProcess || browserProcess.exitCode !== null) return;

  const exited = new Promise((resolvePromise) => browserProcess.once('exit', resolvePromise));
  browserProcess.kill();
  await Promise.race([
    exited,
    new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000)),
  ]);
}

async function getExtensionOrigin(context, browserName) {
  const extensionsPage = await context.newPage();

  try {
    await extensionsPage.goto('chrome://extensions/', { waitUntil: 'domcontentloaded' });
    const extensionItem = extensionsPage.locator('extensions-item').filter({ hasText: 'RaptorQR' });
    const loaded = await extensionItem.waitFor({ state: 'attached', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    requireValue(
      loaded === 1,
      `${browserName}: the browser did not load the unpacked extension from the command line. Use a development Chromium build that permits --load-extension, or load dist/chromium manually from chrome://extensions before completing the browser checklist.`,
    );
    const extensionId = await extensionItem.evaluate((element) => element.data?.id);
    requireValue(typeof extensionId === 'string' && /^[a-p]{32}$/.test(extensionId), `${browserName}: unpacked RaptorQR extension was not loaded.`);
    return `chrome-extension://${extensionId}`;
  } finally {
    await extensionsPage.close();
  }
}

async function verifySender(page, text) {
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByPlaceholder('Type or paste text to transfer…').fill(text);
  await page.getByRole('button', { name: 'Start Live QR', exact: true }).click();
  await page.getByLabel('Live QR transfer frames').waitFor({ state: 'visible', timeout: 120_000 });
  await page.getByRole('button', { name: 'Stop', exact: true }).first().click();
}

async function verifyFileSender(page) {
  await page.getByRole('button', { name: 'File', exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'browser-smoke.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Browser file transfer smoke test.', 'utf8'),
  });
  await page.getByRole('button', { name: 'Start Live QR', exact: true }).click();
  await page.getByLabel('Live QR transfer frames').waitFor({ state: 'visible', timeout: 120_000 });
  await page.getByRole('button', { name: 'Stop', exact: true }).first().click();
}

async function verifyCamera(page) {
  await page.getByRole('button', { name: /Receiver/ }).click();
  await page.getByRole('button', { name: /Start Scan/ }).click();
  await page.getByRole('button', { name: /Stop Scan/ }).waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByRole('button', { name: /Stop Scan/ }).click();
}

function attachErrorCapture(page, errors) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
}

async function assertReadable(path, message) {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(message);
  }
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}