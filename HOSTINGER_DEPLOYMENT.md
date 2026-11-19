# Happiiz Gate App — Hostinger Production Deployment & Operations Guide

This guide covers building, hardening, deploying, migrating, backing up, and manually verifying the unified **Happiiz Gate App** ecosystem (3 installable mobile PWAs + 4 web portals) on Hostinger.

---

## 1. Architecture Summary (Shared Domain + Isolated PWA Scopes)

All 7 primary portals run from one unified codebase and build (`npm run build` -> `dist/`):

### Separately Installable Mobile PWAs
1. **Gate Guard App** (`https://your-domain.com/guard/`)
   - Manifest: `/guard/manifest.webmanifest` · Service Worker: `/guard/sw.js` · Offline fallback: `/guard/offline.html`
   - Roles: `SECURITY_GUARD` (`GATE_GUARD`), `SECURITY_STAFF`, `SOCIETY_ADMIN`, `SUPER_ADMIN`
2. **Digital Supporter App** (`https://your-domain.com/supporter/`)
   - Manifest: `/supporter/manifest.webmanifest` · Service Worker: `/supporter/sw.js` · Offline fallback: `/supporter/offline.html`
   - Roles: `DIGITAL_SUPPORTER`, `PLATFORM_STAFF`, `SUPER_ADMIN`
3. **Service Partner App** (`https://your-domain.com/partner/`)
   - Manifest: `/partner/manifest.webmanifest` · Service Worker: `/partner/sw.js` · Offline fallback: `/partner/offline.html`
   - Roles: `SERVICE_PARTNER`, `SUPER_ADMIN`

### Web Administrative Portals
4. **Society Admin Portal** (`/society` & `/dashboard/society-admin`) — `SOCIETY_ADMIN`
5. **Security Staff Portal** (`/security-staff` & `/dashboard/security-staff`) — `SECURITY_STAFF`
6. **Platform Admin Staff Portal** (`/platform-staff`, `/staff/*`, `/dashboard/platform-staff`) — `PLATFORM_STAFF` (`PLATFORM_ADMIN_STAFF`)
7. **Super Admin Portal** (`/super-admin`, `/admin/*`, `/dashboard/super-admin`) — `SUPER_ADMIN`

*(Preserved Phase 1–11 portals: `/dashboard/resident` for `RESIDENT`, `/dashboard/society-staff` & `/society-staff/*` for `SOCIETY_STAFF`.)*

---

## 2. Production Environment & Build Instructions

1. Copy `.env.production.example` to `.env.production` (do NOT copy `.env.testing.example` to production).
2. Populate all `VITE_FIREBASE_*` values from **Firebase Console -> Project Settings -> Your Apps (Web)**.
3. Confirm `VITE_APP_ENV="production"` and `VITE_ENABLE_DEV_MOCK_AUTH="false"`.
4. Generate/refresh PWA icons & build:
   ```bash
   node scripts/generate-icons.js
   npm run lint
   npm run build
   ```
5. Verify `dist/` contains:
   - `index.html`, `.htaccess`, `offline.html`, `manifest.webmanifest`, `sw.js`, `assets/`
   - `guard/manifest.webmanifest`, `guard/sw.js`, `guard/offline.html`, `guard/pwa-*.png`
   - `supporter/manifest.webmanifest`, `supporter/sw.js`, `supporter/offline.html`, `supporter/pwa-*.png`
   - `partner/manifest.webmanifest`, `partner/sw.js`, `partner/offline.html`, `partner/pwa-*.png`

---

## 3. Hostinger `public_html` Deployment Steps

1. In Hostinger **hPanel -> Websites -> File Manager**, open `public_html/`.
2. **Backup First**: Zip existing `public_html/` files into `/backups/pre-release-YYYYMMDD.zip` before uploading.
3. Upload the entire contents of `dist/` into `public_html/` (ensure dotfiles like `.htaccess` are visible and uploaded).
4. In **hPanel -> Security -> SSL**, confirm Let's Encrypt SSL is active and **Force HTTPS** is enabled.
5. **Full-Stack AI ANPR Backend (`/api/anpr/*`)**:
   - Static Shared Hosting serves Vite SPA + PWAs; live `/api/anpr/recognize` Gemini Vision OCR requires running the Node server (`npm start` -> `tsx server.ts` on Hostinger Cloud/VPS or Node.js App Manager with `GEMINI_API_KEY` set privately on the server).
   - Never add `VITE_` in front of `GEMINI_API_KEY`.

---

## 4. Firebase Console Manual Configuration Steps

1. **Authentication -> Sign-in method**:
   - Enable **Email/Password**
   - Enable **Google**
   - Enable **Phone** (optional OTP verification; configure test phone numbers only in staging)
2. **Authentication -> Settings -> Authorized domains**:
   - Add your live Hostinger domain (e.g., `your-domain.com` and `www.your-domain.com`).
3. **Cloud Firestore**:
   - Provision Firestore in your target region (e.g., `asia-southeast1`).
   - Deploy `firestore.rules` and `firestore.indexes.json`:
     ```bash
     firebase deploy --only firestore:rules,firestore:indexes
     ```
4. **Firebase Storage**:
   - Provision default Storage bucket and deploy `storage.rules`:
     ```bash
     firebase deploy --only storage
     ```
5. **Initial Super Admin Provisioning**:
   - Create your root owner account in **Firebase Authentication**.
   - In Firestore `/users/{uid}`, create their profile document with `primaryRole: "SUPER_ADMIN"`, `role: "SUPER_ADMIN"`, `accountStatus: "ACTIVE"`, and `isSuperAdmin: true`.

---

## 5. Non-Destructive Database Migration Plan

All schema extensions in this release are strictly **additive**:
- Existing `/users/{uid}`, `/societies/{societyId}`, `/societies/{societyId}/members/{uid}`, `/societies/{societyId}/vehicles/{vehicleId}`, `/societies/{societyId}/anprScans/{scanId}`, `/gate_passes/{passId}`, and `/supportTickets/{ticketId}` documents continue working unchanged.
- Existing `SECURITY_GUARD` and `PLATFORM_STAFF` role strings are automatically normalized alongside `GATE_GUARD` and `PLATFORM_ADMIN_STAFF`.
- Optional new user fields (`username`, `loginId`, `assignedSocieties`, `digitalSupporterTier`, `securityStaffPermissions`) default safely when absent.
- Zero destructive collection drops, renames, or overwrites are required.

---

## 6. Backup & Rollback Plan

1. **Before Deploying**:
   - Run automated Firestore export to Cloud Storage:
     ```bash
     gcloud firestore export gs://YOUR_BACKUP_BUCKET/pre-prod-YYYYMMDD
     ```
   - Archive current `public_html/` contents on Hostinger before overwriting.
2. **Instant Rollback**:
   - If any regression occurs after release, restore the archived `dist/` zip into `public_html/` via hPanel File Manager and re-deploy the prior `firestore.rules` version from Firebase Console -> Firestore -> Rules -> Version History.

---

## 7. Manual Mobile & Browser Testing Checklist

- **Android Chrome**:
  - Open `https://your-domain.com/guard/` -> Install **"Happiiz Guard"** -> confirm emerald shield home-screen icon and standalone launch to `/guard/`.
  - Open `https://your-domain.com/supporter/` -> Install **"Happiiz Supporter"** -> confirm indigo icon and separate home-screen entry.
  - Open `https://your-domain.com/partner/` -> Install **"Happiiz Partner"** -> confirm amber icon and separate home-screen entry.
- **iOS Safari**:
  - Open `/guard/`, `/supporter/`, `/partner/` in Safari -> **Share -> Add to Home Screen** -> verify standalone mode (`navigator.standalone === true`).
- **Offline Test**:
  - Enable Airplane Mode inside each installed PWA -> refresh/navigate -> verify scoped `offline.html` fallback renders cleanly without browser errors.
- **Direct Refresh Test**:
  - Hard-refresh `/login`, `/guard/`, `/supporter/`, `/partner/`, `/society`, `/security-staff`, `/platform-staff`, `/super-admin` -> confirm HTTP 200 (never 403/404).

---

## 8. Owner Sandbox / Staging Testing Guide

Quick-test helpers and simulated OTP hints are automatically stripped from production builds (`VITE_APP_ENV="production"` and `npm run build`). To run isolated UI walkthroughs in staging or local development:
1. Use `.env.testing.example` copied to `.env.local` (`VITE_ENABLE_DEV_MOCK_AUTH="true"`).
2. Restart the local dev server (`npm run dev`).
3. Do NOT deploy a build created with `VITE_ENABLE_DEV_MOCK_AUTH="true"` to a public Hostinger production domain.
