import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function createThemedSVG({ bg1, bg2, primary, accent, glyph }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${accent}" />
      <stop offset="100%" stop-color="${primary}" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="206" stroke="url(#primaryGrad)" stroke-width="4" stroke-opacity="0.35" fill="none"/>
  <path d="M 256 96 L 372 146 C 372 268 256 382 256 412 C 256 382 140 268 140 146 Z"
        fill="${bg1}" fill-opacity="0.9" stroke="url(#primaryGrad)" stroke-width="10"/>
  ${glyph}
</svg>`;
}

function createPNG(width, height, palette) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        let bit = (crc ^ byte) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    return (crc ^ -1) >>> 0;
  }

  function createChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(typeAndData), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);

  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineSize);
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let pr = palette.bg[0];
      let pg = palette.bg[1];
      let pb = palette.bg[2];
      const pa = 255;

      if (dist <= radius) {
        const innerRatio = dist / radius;
        pr = Math.floor(palette.ring[0] * (1 - innerRatio) + palette.bg[0] * innerRatio);
        pg = Math.floor(palette.ring[1] * (1 - innerRatio) + palette.bg[1] * innerRatio);
        pb = Math.floor(palette.ring[2] * (1 - innerRatio) + palette.bg[2] * innerRatio);

        if (Math.abs(dx) < width * 0.15 && Math.abs(dy) < height * 0.2) {
          pr = palette.core[0];
          pg = palette.core[1];
          pb = palette.core[2];
        }
      }

      rawData[offset++] = pr;
      rawData[offset++] = pg;
      rawData[offset++] = pb;
      rawData[offset++] = pa;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function writeIconSet(targetDir, svg, palette, includeFavicon = false) {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'icon.svg'), svg, 'utf-8');
  const pwa192 = createPNG(192, 192, palette);
  const pwa512 = createPNG(512, 512, palette);
  const apple180 = createPNG(180, 180, palette);
  fs.writeFileSync(path.join(targetDir, 'pwa-192x192.png'), pwa192);
  fs.writeFileSync(path.join(targetDir, 'pwa-512x512.png'), pwa512);
  fs.writeFileSync(path.join(targetDir, 'pwa-maskable-512x512.png'), pwa512);
  fs.writeFileSync(path.join(targetDir, 'apple-touch-icon.png'), apple180);
  if (includeFavicon) {
    fs.writeFileSync(path.join(targetDir, 'favicon.ico'), pwa192);
  }
}

// 1. Root Happiiz Gate Icon Set
writeIconSet(
  publicDir,
  createThemedSVG({
    bg1: '#0A192F',
    bg2: '#0F284E',
    primary: '#2563EB',
    accent: '#38BDF8',
    glyph: `<circle cx="256" cy="245" r="42" fill="#1E40AF" stroke="#38BDF8" stroke-width="6"/>
            <path d="M 238 245 L 250 258 L 276 230" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  { bg: [10, 25, 47], ring: [37, 99, 235], core: [56, 189, 248] },
  true
);

// 2. PWA App 1: Gate Guard (/public/guard/) — Emerald Shield
writeIconSet(
  path.join(publicDir, 'guard'),
  createThemedSVG({
    bg1: '#022C22',
    bg2: '#064E3B',
    primary: '#059669',
    accent: '#34D399',
    glyph: `<rect x="206" y="196" width="100" height="96" rx="18" fill="#065F46" stroke="#34D399" stroke-width="6"/>
            <path d="M 236 245 L 250 260 L 278 230" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  }),
  { bg: [6, 78, 59], ring: [16, 185, 129], core: [167, 243, 208] }
);

// 3. PWA App 2: Digital Supporter (/public/supporter/) — Indigo/Cyan Headset
writeIconSet(
  path.join(publicDir, 'supporter'),
  createThemedSVG({
    bg1: '#1E1B4B',
    bg2: '#1E3A8A',
    primary: '#2563EB',
    accent: '#22D3EE',
    glyph: `<path d="M 196 258 V 238 A 60 60 0 0 1 316 238 V 258" fill="none" stroke="#22D3EE" stroke-width="10" stroke-linecap="round"/>
            <rect x="184" y="248" width="26" height="44" rx="10" fill="#22D3EE"/>
            <rect x="302" y="248" width="26" height="44" rx="10" fill="#22D3EE"/>`,
  }),
  { bg: [30, 58, 138], ring: [37, 99, 235], core: [34, 211, 238] }
);

// 4. PWA App 3: Service Partner (/public/partner/) — Amber/Slate Badge
writeIconSet(
  path.join(publicDir, 'partner'),
  createThemedSVG({
    bg1: '#1C1917',
    bg2: '#451A03',
    primary: '#D97706',
    accent: '#FBBF24',
    glyph: `<circle cx="256" cy="245" r="44" fill="#78350F" stroke="#FBBF24" stroke-width="7"/>
            <path d="M 240 245 H 272 M 256 229 V 261" stroke="#FEF3C7" stroke-width="9" stroke-linecap="round"/>`,
  }),
  { bg: [69, 26, 3], ring: [217, 119, 6], core: [251, 191, 36] }
);

console.log('Root + 3 scoped PWA icon sets generated in public/, public/guard/, public/supporter/, public/partner/.');
