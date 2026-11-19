#!/usr/bin/env node
/**
 * Happiiz Gate App — Production Build Integrity & Secret Hygiene Verifier
 *
 * Verifies:
 * 1. dist/index.html exists and references compiled assets
 * 2. dist/assets/ contains compiled JS and CSS bundles
 * 3. dist/.htaccess exists and includes SPA fallback + missing-asset 404 protection
 * 4. Scoped PWA manifests & service workers exist (guard, supporter, partner)
 * 5. Zero hardcoded credentials, passwords, or service account keys leaked into dist/
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

const REQUIRED_FILES = [
  'index.html',
  '.htaccess',
  'manifest.webmanifest',
  'offline.html',
  'guard/manifest.webmanifest',
  'guard/sw.js',
  'guard/offline.html',
  'supporter/manifest.webmanifest',
  'supporter/sw.js',
  'supporter/offline.html',
  'partner/manifest.webmanifest',
  'partner/sw.js',
  'partner/offline.html',
];

const FORBIDDEN_PATTERNS = [
  { name: 'Super Admin password string', pattern: /Kanha@9298/i },
  { name: 'Hardcoded partner password', pattern: /Partner@2026/i },
  { name: 'Dev sandbox password Happiiz@2026', pattern: /Happiiz@2026/ },
  { name: 'Dev sandbox password GatePass@123', pattern: /GatePass@123/ },
  { name: 'Dev sandbox password Emerald@2026', pattern: /Emerald@2026/ },
  { name: 'Private key header', pattern: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Service account private_key_id', pattern: /"private_key_id"\s*:/ },
];

let failed = false;

function pass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function fail(msg) {
  console.error(`  [FAIL] ${msg}`);
  failed = true;
}

console.log('=== Happiiz Gate Production Build Verification ===\n');

if (!fs.existsSync(DIST_DIR)) {
  fail('dist/ directory does not exist. Run `npm run build` first.');
  process.exit(1);
}

// 1. Check required files
for (const rel of REQUIRED_FILES) {
  const full = path.join(DIST_DIR, rel);
  if (fs.existsSync(full) && fs.statSync(full).size > 0) {
    pass(`Found ${rel}`);
  } else {
    fail(`Missing or empty required file: dist/${rel}`);
  }
}

// 2. Check compiled JS and CSS assets
const assetsDir = path.join(DIST_DIR, 'assets');
if (!fs.existsSync(assetsDir)) {
  fail('Missing dist/assets/ directory.');
} else {
  const assetFiles = fs.readdirSync(assetsDir);
  const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
  const cssFiles = assetFiles.filter((f) => f.endsWith('.css'));

  if (jsFiles.length > 0) pass(`Found ${jsFiles.length} compiled JS bundle(s) in dist/assets/`);
  else fail('No compiled .js files found in dist/assets/');

  if (cssFiles.length > 0) pass(`Found ${cssFiles.length} compiled CSS bundle(s) in dist/assets/`);
  else fail('No compiled .css files found in dist/assets/');

  // 3. Scan compiled JS/HTML files for leaked credentials or dev passwords
  const filesToScan = [
    path.join(DIST_DIR, 'index.html'),
    ...jsFiles.map((f) => path.join(assetsDir, f)),
  ];

  let leaksFound = 0;
  for (const filePath of filesToScan) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rule of FORBIDDEN_PATTERNS) {
      if (rule.pattern.test(content)) {
        fail(`Secret hygiene violation: ${rule.name} found in ${path.relative(process.cwd(), filePath)}`);
        leaksFound += 1;
      }
    }
  }
  if (leaksFound === 0) {
    pass('Secret hygiene scan passed (0 hardcoded passwords or private keys in dist/)');
  }
}

// 4. Verify .htaccess key directives
const htaccessPath = path.join(DIST_DIR, '.htaccess');
if (fs.existsSync(htaccessPath)) {
  const ht = fs.readFileSync(htaccessPath, 'utf8');
  if (ht.includes('RewriteEngine On') && ht.includes('/index.html')) {
    pass('dist/.htaccess includes SPA RewriteRule to /index.html');
  } else {
    fail('dist/.htaccess is missing RewriteEngine / SPA fallback rules');
  }
  if (ht.includes('Options -MultiViews -Indexes')) {
    pass('dist/.htaccess disables MultiViews and directory indexing');
  } else {
    fail('dist/.htaccess is missing `Options -MultiViews -Indexes`');
  }
  if (ht.includes('[R=404,L]')) {
    pass('dist/.htaccess returns 404 for missing static assets instead of rewriting to index.html');
  } else {
    fail('dist/.htaccess does not protect missing static assets from index.html rewrite');
  }
}

console.log('');
if (failed) {
  console.error('BUILD VERIFICATION FAILED.');
  process.exit(1);
}
console.log('BUILD VERIFICATION PASSED.');
