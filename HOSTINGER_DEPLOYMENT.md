# Happiiz Gate App — Hostinger Deployment Guide

This guide details the step-by-step procedure for deploying **Happiiz Gate App** (Vite + React + PWA) to **Hostinger Web Hosting**, **Hostinger Cloud Hosting**, or **Hostinger VPS**.

---

## 1. Quick Specifications

| Parameter | Value |
|---|---|
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Routing Architecture** | Single Page Application (SPA) using HTML5 `history.pushState` |
| **Server Rewrite** | Apache / LiteSpeed `.htaccess` (pre-configured in `public/.htaccess`) |
| **PWA Cache Engine** | Workbox via `vite-plugin-pwa` with automatic service worker registration |

---

## 2. Step-by-Step Deployment on Hostinger (Shared / Cloud / hPanel)

### Step 1: Configure Environment Variables
1. Copy `.env.example` to `.env` or set your environment variables before building:
   ```bash
   cp .env.example .env
   ```
2. Enter your production **Firebase Client Configuration** in `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_APP_ENV="production"`
   - `VITE_ENABLE_DEV_MOCK_AUTH="false"`

### Step 2: Build the Production Bundle
Run the production build command:
```bash
npm run build
```
This generates the optimized, production-ready static assets in the **`dist/`** directory.

### Step 3: Verify the Output Assets
Ensure the `dist/` folder contains:
- `index.html`
- `.htaccess` (copied automatically from `public/.htaccess`)
- `sw.js` (Service Worker)
- `manifest.webmanifest`
- `icon.svg`, `pwa-192x192.png`, `pwa-512x512.png`
- `assets/` (bundled JS & CSS)

### Step 4: Upload to Hostinger hPanel File Manager
1. Log in to **Hostinger hPanel** (`hpanel.hostinger.com`).
2. Navigate to **Websites** > choose your domain > click **Manage**.
3. Open **Files** > **File Manager**.
4. Go into the **`public_html`** root folder of your website.
5. Upload the contents of your local `dist/` folder directly into `public_html` (so that `index.html` and `.htaccess` reside in `public_html/`).

---

## 3. SPA Route Fallback & Direct URL Refresh

When users refresh nested URLs like `/dashboard/guard` or `/dashboard/resident`, Apache or LiteSpeed must serve `index.html` instead of a 404 error.

This is automatically handled by the pre-configured **`.htaccess`** file included in the project root:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  # Cache static assets (CSS, JS, Fonts, Images)
  <FilesMatch "\.(ico|jpe?g|png|gif|swf|css|js|svg|woff2?|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public"
  </FilesMatch>
  
  # Ensure Service Worker and Manifest are never stale
  <FilesMatch "(sw\.js|registerSW\.js|manifest\.webmanifest)$">
    Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
  </FilesMatch>
</IfModule>
```

---

## 4. HTTPS & PWA Verification

Progressive Web Apps **require HTTPS** to activate Service Workers and allow PWA installation on Android and iOS:
1. In Hostinger hPanel, go to **Security** > **SSL**.
2. Ensure **Let's Encrypt SSL** is active with **Force HTTPS** enabled.
3. Open your domain in Chrome on mobile or desktop:
   - Look for the **"Install App"** prompt in the Happiiz Gate App banner or Chrome omnibox.
   - On iOS Safari, tap **Share** > **Add to Home Screen**.
