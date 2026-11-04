import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Write public/icon.svg (Vector logo with 3D navy-to-blue gradient and glowing gate shield)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A192F" />
      <stop offset="50%" stop-color="#0F284E" />
      <stop offset="100%" stop-color="#050C1A" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="50%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#1D4ED8" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.25)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>
  </defs>

  <!-- Background Base -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  
  <!-- Outer Tech Hexagon / Shield Ring -->
  <circle cx="256" cy="256" r="210" stroke="url(#primaryGrad)" stroke-width="4" stroke-opacity="0.3" fill="none"/>
  <circle cx="256" cy="256" r="185" stroke="url(#primaryGrad)" stroke-width="2" stroke-dasharray="12 10" stroke-opacity="0.4" fill="none"/>
  
  <!-- 3D Layered Security Shield -->
  <path d="M 256 95 L 375 145 C 375 270 256 385 256 415 C 256 385 137 270 137 145 Z" 
        fill="url(#glassGrad)" 
        stroke="url(#primaryGrad)" 
        stroke-width="8" 
        filter="url(#glow)"/>
        
  <!-- Inner Shield Core -->
  <path d="M 256 125 L 345 162 C 345 260 256 350 256 375 C 256 350 167 260 167 162 Z" 
        fill="#0A192F" 
        fill-opacity="0.85"
        stroke="url(#goldGrad)" 
        stroke-width="3"/>

  <!-- Futuristic Gate Arch & Keyhole Glyph -->
  <!-- Smart Gate Bars -->
  <line x1="205" y1="200" x2="205" y2="300" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
  <line x1="230" y1="185" x2="230" y2="315" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
  <line x1="256" y1="175" x2="256" y2="325" stroke="#60A5FA" stroke-width="8" stroke-linecap="round"/>
  <line x1="282" y1="185" x2="282" y2="315" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>
  <line x1="307" y1="200" x2="307" y2="300" stroke="#38BDF8" stroke-width="6" stroke-linecap="round"/>

  <!-- Gate Cross-bar / Smart Beam -->
  <path d="M 195 245 L 317 245" stroke="#93C5FD" stroke-width="6" stroke-linecap="round"/>

  <!-- Central Glowing Verification Ring -->
  <circle cx="256" cy="245" r="28" fill="#1E40AF" stroke="#60A5FA" stroke-width="4"/>
  <circle cx="256" cy="245" r="14" fill="#38BDF8" filter="url(#glow)"/>
  <path d="M 251 245 L 255 249 L 263 241" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');

// Function to generate a valid PNG buffer directly in pure Node.js
function createPNG(width, height, r, g, b, a = 255) {
  // Simple uncompressed PNG encoder
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

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const scanlineSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineSize);

  // Render a sleek dark navy gradient with a blue circular badge
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter type 0: None
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep Navy background (#0A192F to #0F284E)
      let pr = 10;
      let pg = 25;
      let pb = 47;
      let pa = 255;

      if (dist <= radius) {
        // Inside central shield circle - bright sapphire & azure
        const innerRatio = dist / radius;
        pr = Math.floor(37 * (1 - innerRatio) + 10 * innerRatio);
        pg = Math.floor(99 * (1 - innerRatio) + 37 * innerRatio);
        pb = Math.floor(235 * (1 - innerRatio) + 78 * innerRatio);

        // Core gate emblem
        if (Math.abs(dx) < width * 0.15 && Math.abs(dy) < height * 0.2) {
          pr = 56;
          pg = 189;
          pb = 248; // Cyan accent
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

// Generate PWA Icons
const pwa192 = createPNG(192, 192, 37, 99, 235);
const pwa512 = createPNG(512, 512, 37, 99, 235);
const appleIcon = createPNG(180, 180, 37, 99, 235);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwa512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), pwa192);

console.log('PWA icons created successfully in public directory.');
