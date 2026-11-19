/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PWAScopeKey = 'guard' | 'supporter' | 'partner' | 'root';

export interface PWAScopeMetadata {
  key: PWAScopeKey;
  appName: string;
  shortName: string;
  description: string;
  manifestUrl: string;
  swUrl: string | null;
  scope: string;
  themeColor: string;
  appleTouchIcon: string;
}

export function resolvePWAScope(pathname: string): PWAScopeMetadata {
  if (pathname.startsWith('/guard') || pathname.startsWith('/dashboard/guard')) {
    return {
      key: 'guard',
      appName: 'Happiiz Guard',
      shortName: 'Happiiz Guard',
      description: 'Install for instant gate scanning, ANPR recognition & SOS dispatch.',
      manifestUrl: '/guard/manifest.webmanifest',
      swUrl: '/guard/sw.js',
      scope: '/guard/',
      themeColor: '#064E3B',
      appleTouchIcon: '/guard/apple-touch-icon.png',
    };
  }
  if (pathname.startsWith('/supporter') || pathname.startsWith('/dashboard/supporter')) {
    return {
      key: 'supporter',
      appName: 'Happiiz Supporter',
      shortName: 'Happiiz Supporter',
      description: 'Install for mobile ticket resolution, society assistance & priority alerts.',
      manifestUrl: '/supporter/manifest.webmanifest',
      swUrl: '/supporter/sw.js',
      scope: '/supporter/',
      themeColor: '#1E3A8A',
      appleTouchIcon: '/supporter/apple-touch-icon.png',
    };
  }
  if (pathname.startsWith('/partner') || pathname.startsWith('/dashboard/service-partner')) {
    return {
      key: 'partner',
      appName: 'Happiiz Partner',
      shortName: 'Happiiz Partner',
      description: 'Install for work order dispatch, gate entry passes & settlement tracking.',
      manifestUrl: '/partner/manifest.webmanifest',
      swUrl: '/partner/sw.js',
      scope: '/partner/',
      themeColor: '#92400E',
      appleTouchIcon: '/partner/apple-touch-icon.png',
    };
  }
  return {
    key: 'root',
    appName: 'Happiiz Gate App',
    shortName: 'Happiiz Gate',
    description: 'Add to home screen for fast gate verification & offline access.',
    manifestUrl: '/manifest.webmanifest',
    swUrl: null,
    scope: '/',
    themeColor: '#673AB7',
    appleTouchIcon: '/apple-touch-icon.png',
  };
}

export function usePWAInstall() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState<ServiceWorker | null>(null);

  const scopeMeta = useMemo(() => resolvePWAScope(location.pathname), [location.pathname]);

  // Synchronize manifest link, theme-color, and apple-touch-icon for current PWA scope
  useEffect(() => {
    const manifestLink =
      (document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null) ||
      (() => {
        const el = document.createElement('link');
        el.rel = 'manifest';
        document.head.appendChild(el);
        return el;
      })();
    manifestLink.href = scopeMeta.manifestUrl;

    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (appleIcon) appleIcon.href = scopeMeta.appleTouchIcon;

    const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (themeMeta) themeMeta.content = scopeMeta.themeColor;

    const appleTitle = document.querySelector(
      'meta[name="apple-mobile-web-app-title"]'
    ) as HTMLMetaElement | null;
    if (appleTitle) appleTitle.content = scopeMeta.shortName;

    // Register isolated service worker for /guard/, /supporter/, /partner/
    if (scopeMeta.swUrl && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(scopeMeta.swUrl, { scope: scopeMeta.scope })
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateWaiting(newWorker);
              }
            });
          });
        })
        .catch(() => {
          // Non-fatal in local dev or unsupported environments
        });
    }
  }, [scopeMeta]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  const applyUpdate = () => {
    if (!updateWaiting) return;
    updateWaiting.postMessage({ type: 'SKIP_WAITING' });
    setUpdateWaiting(null);
    window.location.reload();
  };

  return {
    scopeMeta,
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    hasUpdate: !!updateWaiting,
    install,
    applyUpdate,
  };
}
