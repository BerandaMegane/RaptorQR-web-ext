import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourcePath = resolve(rootDir, 'vendor/RaptorQR/apps/web/public/raptorqr.svg');
const outputDir = resolve(rootDir, 'assets/icons');
const sizes = [16, 32, 48, 128];

await mkdir(outputDir, { recursive: true });

await Promise.all(sizes.map((size) => sharp(sourcePath)
  .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(resolve(outputDir, `icon-${size}.png`))));

console.log(`Generated ${sizes.length} PNG icons from RaptorQR's SVG.`);