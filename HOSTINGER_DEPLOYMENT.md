# Happiiz Gate App — Hostinger Production Deployment, Auth Repair & Operations Guide

This guide explains the permanent fix for Hostinger `public_html` deployments, `.htaccess` preservation, Super Admin Firebase Authentication repair, and safe rollback procedures.

---

## 1. Root Cause of `public_html` Emptying & `.htaccess` Deletion

When a Vite + React repository is connected directly to **Hostinger hPanel -> Git Auto-Deployment** targeting `public_html/`:
1. Hostinger pulls the **raw source repository** straight into `public_html/` instead of the compiled Vite `dist/` bundle.
2. In raw source form, `index.html` references `/src/main.tsx` (which browsers cannot execute) and `.htaccess` lives inside `public/.htaccess` rather than `public_html/.htaccess`.
3. Each Git webhook pull resets/cleans `public_html/`, wiping out any manually uploaded `.htaccess` and previously built `dist/` files — leaving `public_html/` broken or returning Apache 403/404 errors.

### Permanent Architecture Fix
1. **Disable Hostinger hPanel Git Auto-Deployment into `public_html/`** (hPanel -> Websites -> Advanced -> Git -> Delete/Disconnect the raw-repo deployment on `public_html`).
2. **Use the Safe GitHub Actions Workflow** (`.github/workflows/deploy-hostinger.yml`), which:
   - Builds `dist/` cleanly in CI (`npm ci`, `npm run lint`, `npm run build`).
   - Copies/verifies `public/.htaccess` -> `dist/.htaccess`.
   - Runs `node scripts/verify-build.mjs` (validates `index.html`, `assets/*.js`, `assets/*.css`, `.htaccess`, PWA manifests, and **0 leaked credentials**).
   - Creates a timestamped backup archive on Hostinger before syncing.
   - Uploads **only `dist/`** into a remote staging folder first, validates it, and safely syncs into `public_html/` **without deleting `.well-known/`, `cgi-bin/`, or unrelated server files** (never runs `rm -rf public_html/*`).
   - Runs `node scripts/health-check.mjs` against your live URL and **automatically rolls back** from backup if verification fails.

---

## 2. Required GitHub Actions Secrets

Add these secrets in **GitHub Repository -> Settings -> Secrets and variables -> Actions**:

### Hostinger SSH Deployment Secrets
- `HOSTINGER_SSH_HOST` — Hostinger SSH hostname or IP (from hPanel -> Advanced -> SSH Access)
- `HOSTINGER_SSH_PORT` — SSH port (Hostinger default is `65002`)
- `HOSTINGER_SSH_USER` — Hostinger SSH username (e.g., `u123456789`)
- `HOSTINGER_SSH_KEY` — Private SSH key authorized in hPanel SSH Access
- `HOSTINGER_DEPLOY_PATH` — Exact path to your domain's `public_html` (e.g., `/home/u123456789/domains/yourdomain.com/public_html`)

### Production Firebase Web Config Secrets (Public Web SDK Identifiers)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- `VITE_PUBLIC_APP_URL` — Live HTTPS URL (e.g., `https://yourdomain.com`) for automated post-deploy health checks

> **Note for Hostinger Shared Plans without SSH**: If SSH is unavailable on your plan, run `npm run build && node scripts/verify-build.mjs` locally or download the CI build artifact, back up `public_html/` first, and upload only the contents of `dist/` (including `.htaccess`) via FTPS/File Manager. Never enable `dangerous-clean-slate: true` in any FTP action.

---

## 3. Super Admin Login Repair (Server-Side Firebase Admin SDK)

Production login enforces **Firebase Authentication + verified Custom Claims / Firestore `/users/{uid}`** (never hardcoded passwords and never email-only Super Admin assignment).

If the Super Admin cannot sign in on the live domain, run the included server-side provisioning & diagnostic script privately from a trusted machine:

```bash
# 1. Download a Firebase Service Account key from:
#    Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
#    (NEVER commit this JSON file to GitHub!)

# 2. Run read-only diagnostics first
export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/serviceAccountKey.json"
export SUPER_ADMIN_UID="i2INKUJ27fZpwFKOBV5o7qOm4it2"
export SUPER_ADMIN_EMAIL="sandeeprana4519@gmail.com"
npm install --no-save firebase-admin
node scripts/provision-super-admin.mjs --verify-only

# 3. Repair Custom Claims + Firestore /users/{uid} (and optionally reset password via env var)
node scripts/provision-super-admin.mjs

# Optional: Only if the Firebase Auth password itself needs to be updated:
# export SUPER_ADMIN_NEW_PASSWORD="<your-strong-password>"
# node scripts/provision-super-admin.mjs
```

### Required Firebase Console Checks
1. **Authentication -> Sign-in method**: Confirm **Email/Password** is **Enabled** (plus Google/Phone if used).
2. **Authentication -> Settings -> Authorized domains**: Add your live Hostinger domain (e.g., `yourdomain.com` and `www.yourdomain.com`).
3. **Deploy Updated Security Rules**:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
4. **Optional Trusted Cloud Functions** (`functions/src/index.ts`):
   ```bash
   cd functions && npm install && npm run build && firebase deploy --only functions
   ```

---

## 4. Universal Single Login & Role Routing

All roles authenticate through one Universal Login page (`/login`) using **Login ID / Email / Mobile Number + Password**:
- `SUPER_ADMIN` -> `/super-admin`
- `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_FINANCE`, `PLATFORM_OPERATIONS`, `PLATFORM_READ_ONLY`, `PLATFORM_STAFF`, `PLATFORM_ADMIN_STAFF` -> `/platform-staff`
- `DIGITAL_SUPPORTER` -> `/supporter`
- `SOCIETY_ADMIN`, `COMPANY_ADMIN` -> `/society`
- `SOCIETY_STAFF` -> `/dashboard/society-staff`
- `SECURITY_STAFF`, `SECURITY_SUPERVISOR` -> `/security-staff`
- `SECURITY_GUARD`, `GATE_GUARD` -> `/guard`
- `RESIDENT` -> `/dashboard/resident`
- `SERVICE_PARTNER`, `TECHNICIAN` -> `/partner`

---

## 5. Manual Backup, Rollback & Post-Deploy Health Verification

### Automated & Manual Health Check
```bash
node scripts/verify-build.mjs
node scripts/health-check.mjs https://yourdomain.com
```

### Instant Rollback on Hostinger
Each CI deployment retains the last 5 backups in `~/domains/yourdomain.com/happiiz_backups/public_html_YYYYMMDD_HHMMSS.tar.gz`.
To restore manually via SSH:
```bash
tar -xzf ~/domains/yourdomain.com/happiiz_backups/public_html_YYYYMMDD_HHMMSS.tar.gz \
  -C ~/domains/yourdomain.com/public_html
```
To roll back Firestore rules, open **Firebase Console -> Firestore Database -> Rules -> Version History** and click **Restore**.
