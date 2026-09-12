import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceDir = resolve(rootDir, 'dist/firefox');
const firefoxPath = process.env.FIREFOX_PATH
  ?? 'C:/Program Files/WindowsApps/Mozilla.Firefox_154.0.1.0_x64__n80bbvh6b1yt2/VFS/ProgramFiles/Firefox Package Root/firefox.exe';

if (!existsSync(sourceDir)) {
  throw new Error('Firefox extension output is missing. Run pnpm build before starting Firefox.');
}
if (!existsSync(firefoxPath)) {
  throw new Error('Firefox executable was not found. Set FIREFOX_PATH to its full path.');
}

execFileSync(process.execPath, [
  resolve(rootDir, 'node_modules/web-ext/bin/web-ext.js'),
  'run',
  '--source-dir', sourceDir,
  '--firefox', firefoxPath,
  '--start-url', 'about:blank',
], {
  cwd: rootDir,
  stdio: 'inherit',
});