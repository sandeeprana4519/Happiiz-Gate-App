#!/usr/bin/env node
/**
 * Happiiz Gate App — Post-Deploy HTTP Health Check Script
 *
 * Usage:
 *   node scripts/health-check.mjs http://127.0.0.1:3000
 *   node scripts/health-check.mjs https://your-hostinger-domain.com
 */

const baseUrl = (process.argv[2] || 'http://127.0.0.1:3000').replace(/\/+$/, '');

let failed = false;

function pass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function warn(msg) {
  console.warn(`  [WARN] ${msg}`);
}

function fail(msg) {
  console.error(`  [FAIL] ${msg}`);
  failed = true;
}

async function checkHtmlRoute(routePath) {
  const url = `${baseUrl}${routePath}`;
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  if (res.status === 200 && text.includes('id="root"')) {
    pass(`GET ${routePath} -> HTTP 200 (SPA root shell rendered)`);
  } else {
    fail(`GET ${routePath} -> HTTP ${res.status} (missing #root shell)`);
  }
  return text;
}

async function checkManifest(manifestPath) {
  const url = `${baseUrl}${manifestPath}`;
  const res = await fetch(url);
  if (res.status === 200) {
    try {
      const json = await res.json();
      if (json.name && json.start_url) {
        pass(`GET ${manifestPath} -> HTTP 200 (${json.name})`);
        return;
      }
    } catch (_) {}
  }
  fail(`GET ${manifestPath} -> HTTP ${res.status} (invalid or missing webmanifest)`);
}

async function main() {
  console.log(`=== Happiiz Gate Health Check: ${baseUrl} ===\n`);

  // 1. Core SPA routes (including direct refresh on deep links)
  const homeHtml = await checkHtmlRoute('/');
  await checkHtmlRoute('/login');
  await checkHtmlRoute('/super-admin');
  await checkHtmlRoute('/society');
  await checkHtmlRoute('/guard/');
  await checkHtmlRoute('/supporter/');
  await checkHtmlRoute('/partner/');

  // 2. Verify referenced JS/CSS bundle loads if production built HTML
  const assetMatches = [...homeHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  if (assetMatches.length > 0) {
    for (const assetPath of assetMatches.slice(0, 4)) {
      const res = await fetch(`${baseUrl}${assetPath}`);
      if (res.status === 200) {
        pass(`GET ${assetPath} -> HTTP 200 (${res.headers.get('content-type') || 'ok'})`);
      } else {
        fail(`GET ${assetPath} -> HTTP ${res.status}`);
      }
    }
  } else {
    warn('Dev-mode HTML detected (no hashed /assets/* tags in index.html).');
  }

  // 3. Verify Scoped PWA Manifests
  await checkManifest('/guard/manifest.webmanifest');
  await checkManifest('/supporter/manifest.webmanifest');
  await checkManifest('/partner/manifest.webmanifest');

  // 4. Optional Backend ANPR Health Check (present when Express server.ts is running)
  try {
    const anprRes = await fetch(`${baseUrl}/api/anpr/health`);
    if (anprRes.status === 200) {
      const data = await anprRes.json();
      pass(`GET /api/anpr/health -> HTTP 200 (status: ${data.status || 'ok'})`);
    } else {
      warn(`GET /api/anpr/health -> HTTP ${anprRes.status} (normal on static-only hosting)`);
    }
  } catch (err) {
    warn(`GET /api/anpr/health unreachable (${err.message})`);
  }

  console.log('');
  if (failed) {
    console.error('HEALTH CHECK FAILED.');
    process.exit(1);
  }
  console.log('HEALTH CHECK PASSED.');
}

main().catch((err) => {
  console.error('[FATAL] Health check failed:', err?.message || err);
  process.exit(1);
});
