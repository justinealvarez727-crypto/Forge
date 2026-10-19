// Renders public/favicon.svg into the PNG icons the PWA manifest needs.
// Run with: npm run icons
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url));
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname;

await sharp(svg).resize(192, 192).png().toFile(out('pwa-192.png'));
await sharp(svg).resize(512, 512).png().toFile(out('pwa-512.png'));
await sharp(svg).resize(180, 180).png().toFile(out('apple-touch-icon.png'));

// Maskable icons need a safe zone: render the glyph at 80% on a full-bleed background.
const inner = await sharp(svg).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#5b5bd6' },
})
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(out('pwa-maskable-512.png'));

console.log('Icons generated.');
