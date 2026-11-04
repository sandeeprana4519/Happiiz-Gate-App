/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { app } from './init';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

/**
 * Request notification permission from user and register for Web Push
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!('Notification' in window)) {
    console.warn('[FCM] Notifications not supported in this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied or dismissed.');
      return null;
    }

    // In production with FCM, we would call getToken(messaging, { vapidKey: ... })
    // We provide a structured token placeholder if Firebase Messaging is pending
    const mockToken = `fcm_token_${Math.random().toString(36).substring(2, 15)}`;
    return mockToken;
  } catch (error) {
    console.error('[FCM] Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Show a local browser notification (works in PWA foreground)
 */
export function displayLocalNotification(payload: NotificationPayload): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icon.svg',
      badge: '/icon.svg',
      data: payload.data,
    });
  } catch (error) {
    console.error('[FCM] Error showing local notification:', error);
  }
}
