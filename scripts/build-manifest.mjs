import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function buildManifest(target, outputPath) {
  const manifest = JSON.parse(await readFile(
    resolve(rootDir, 'extension/manifest.base.json'),
    'utf8',
  ));

  if (target === 'firefox') {
    manifest.browser_specific_settings = {
      gecko: {
        id: 'raptorqr-web-ext@example.invalid',
        strict_min_version: '121.0',
        data_collection_permissions: {
          required: ['none'],
        },
      },
    };
  } else if (target !== 'chromium') {
    throw new Error(`Unsupported extension target: ${target}`);
  }

  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [target, outputPath] = process.argv.slice(2);
  if (!target || !outputPath) {
    throw new Error('Usage: node scripts/build-manifest.mjs <chromium|firefox> <output-path>');
  }
  await buildManifest(target, resolve(outputPath));
}