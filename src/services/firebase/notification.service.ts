/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { app, auth, db } from './init';
import { syncBus } from './sync.service';

export type NotificationCategory =
  | 'VISITOR'
  | 'SERVICE'
  | 'EMERGENCY'
  | 'COMMUNITY'
  | 'MAINTENANCE'
  | 'SYSTEM';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface EcosystemNotification {
  id: string;
  recipientUid: string;
  recipientRole?: string;
  societyId?: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  icon?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  deliveryStatus: 'DELIVERED' | 'FAILED' | 'READ';
  retryCount?: number;
}

export interface NotificationPreferences {
  visitorArrivals: boolean;
  visitorApprovals: boolean;
  serviceUpdates: boolean;
  emergencyAlerts: boolean;
  communityNotices: boolean;
  maintenanceBills: boolean;
  soundEnabled: boolean;
  browserPushEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  visitorArrivals: true,
  visitorApprovals: true,
  serviceUpdates: true,
  emergencyAlerts: true,
  communityNotices: true,
  maintenanceBills: true,
  soundEnabled: true,
  browserPushEnabled: true,
};

// Storage helper with fallback
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return fallback;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {}
}

const DEFAULT_NOTIFICATIONS: EcosystemNotification[] = [
  {
    id: 'notif_init_01',
    recipientUid: 'usr_resident_04',
    category: 'VISITOR',
    priority: 'HIGH',
    title: 'Visitor At Gate A',
    body: 'Karan Mehra is requesting guest entry to flat B-704.',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    deliveryStatus: 'DELIVERED',
  },
  {
    id: 'notif_init_02',
    recipientUid: 'usr_resident_04',
    category: 'SERVICE',
    priority: 'NORMAL',
    title: 'Service Booking Confirmed',
    body: 'Urban Clap Plumbing Solutions accepted your water purifier inspection.',
    isRead: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    deliveryStatus: 'READ',
  },
  {
    id: 'notif_init_03',
    recipientUid: 'usr_resident_04',
    category: 'COMMUNITY',
    priority: 'NORMAL',
    title: 'New Society Notice Published',
    body: 'Clubhouse Maintenance and Power Audit scheduled for this Saturday.',
    isRead: false,
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    deliveryStatus: 'DELIVERED',
  },
];

class UnifiedNotificationEngine {
  private recentNotificationFingerprints: Set<string> = new Set();

  /**
   * Request Web Push permissions and return device token
   */
  public async requestNotificationPermission(): Promise<string | null> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[FCM] Notifications not supported in this browser.');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCM] Notification permission denied or dismissed.');
        return null;
      }

      // Generate consistent device token
      const existingToken = localStorage.getItem('hpz_fcm_device_token');
      if (existingToken) return existingToken;

      const newToken = `fcm_token_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      localStorage.setItem('hpz_fcm_device_token', newToken);
      return newToken;
    } catch (error) {
      console.error('[FCM] Error requesting notification permission:', error);
      return null;
    }
  }

  /**
   * Display a native system notification if permitted
   */
  public displayLocalNotification(payload: { title: string; body: string; icon?: string; data?: any }): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon.svg',
        badge: '/icon.svg',
        data: payload.data,
      });
    } catch (err) {
      console.warn('[FCM] Native notification trigger note:', err);
    }
  }

  /**
   * Dispatch a notification to a specific recipient with duplicate prevention & retry handling
   */
  public dispatchNotification(params: {
    recipientUid: string;
    recipientRole?: string;
    societyId?: string;
    category: NotificationCategory;
    priority?: NotificationPriority;
    title: string;
    body: string;
    actionUrl?: string;
    data?: Record<string, any>;
  }): EcosystemNotification {
    // Deduplication key: recipient + title + 30-second window
    const fingerprint = `${params.recipientUid}_${params.title}_${params.body.substring(0, 30)}`;
    if (this.recentNotificationFingerprints.has(fingerprint)) {
      // Avoid duplicate spam
      return {
        id: `notif_dup_${Date.now()}`,
        recipientUid: params.recipientUid,
        category: params.category,
        priority: params.priority || 'NORMAL',
        title: params.title,
        body: params.body,
        isRead: false,
        createdAt: new Date().toISOString(),
        deliveryStatus: 'DELIVERED',
      };
    }

    this.recentNotificationFingerprints.add(fingerprint);
    setTimeout(() => {
      this.recentNotificationFingerprints.delete(fingerprint);
    }, 30000);

    const notification: EcosystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUid: params.recipientUid,
      recipientRole: params.recipientRole,
      societyId: params.societyId,
      category: params.category,
      priority: params.priority || 'NORMAL',
      title: params.title,
      body: params.body,
      actionUrl: params.actionUrl,
      data: params.data,
      isRead: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      retryCount: 0,
    };

    // Save to recipient store
    const storeKey = `hpz_user_notifications_${params.recipientUid}`;
    const existing = getStored<EcosystemNotification[]>(storeKey, DEFAULT_NOTIFICATIONS);
    setStored(storeKey, [notification, ...existing]);

    // Native browser push if permitted and user preferences allow
    const prefs = this.getPreferences(params.recipientUid);
    if (prefs.browserPushEnabled) {
      this.displayLocalNotification({
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    }

    // Broadcast on sync bus
    syncBus.broadcast(
      'NOTIFICATION_DISPATCHED',
      params.societyId || 'all',
      auth?.currentUser?.uid || 'system',
      'SYSTEM',
      notification
    );

    return notification;
  }

  /**
   * Broadcast a society-wide notification (e.g. Emergency or Notice)
   */
  public broadcastToSociety(
    societyId: string,
    params: {
      category: NotificationCategory;
      priority: NotificationPriority;
      title: string;
      body: string;
      data?: Record<string, any>;
    }
  ): void {
    // In-memory / localStorage society notification feed
    const key = `hpz_soc_broadcasts_${societyId}`;
    const broadcasts = getStored<EcosystemNotification[]>(key, []);
    const newBroadcast: EcosystemNotification = {
      id: `bc_${Date.now()}`,
      recipientUid: 'SOCIETY_ALL',
      societyId,
      category: params.category,
      priority: params.priority,
      title: params.title,
      body: params.body,
      isRead: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
      data: params.data,
    };

    setStored(key, [newBroadcast, ...broadcasts]);

    // Show native alert for critical alerts
    if (params.priority === 'CRITICAL') {
      this.displayLocalNotification({
        title: `🚨 EMERGENCY: ${params.title}`,
        body: params.body,
      });
    }

    syncBus.broadcast(
      'NOTIFICATION_DISPATCHED',
      societyId,
      auth?.currentUser?.uid || 'system',
      'SYSTEM',
      newBroadcast
    );
  }

  /**
   * Get user notifications
   */
  public getUserNotifications(recipientUid: string): EcosystemNotification[] {
    const storeKey = `hpz_user_notifications_${recipientUid}`;
    return getStored<EcosystemNotification[]>(storeKey, DEFAULT_NOTIFICATIONS);
  }

  /**
   * Mark notification as read
   */
  public markAsRead(recipientUid: string, notificationId: string): void {
    const storeKey = `hpz_user_notifications_${recipientUid}`;
    const list = this.getUserNotifications(recipientUid);
    const updated = list.map((n) => (n.id === notificationId ? { ...n, isRead: true, deliveryStatus: 'READ' as const } : n));
    setStored(storeKey, updated);
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(recipientUid: string): void {
    const storeKey = `hpz_user_notifications_${recipientUid}`;
    const list = this.getUserNotifications(recipientUid);
    const updated = list.map((n) => ({ ...n, isRead: true, deliveryStatus: 'READ' as const }));
    setStored(storeKey, updated);
  }

  /**
   * Delete a notification
   */
  public deleteNotification(recipientUid: string, notificationId: string): void {
    const storeKey = `hpz_user_notifications_${recipientUid}`;
    const list = this.getUserNotifications(recipientUid);
    const updated = list.filter((n) => n.id !== notificationId);
    setStored(storeKey, updated);
  }

  /**
   * Get notification preferences for user
   */
  public getPreferences(userUid: string): NotificationPreferences {
    const key = `hpz_notif_prefs_${userUid}`;
    return getStored<NotificationPreferences>(key, DEFAULT_NOTIFICATION_PREFERENCES);
  }

  /**
   * Update notification preferences for user
   */
  public updatePreferences(userUid: string, preferences: Partial<NotificationPreferences>): NotificationPreferences {
    const key = `hpz_notif_prefs_${userUid}`;
    const current = this.getPreferences(userUid);
    const updated = { ...current, ...preferences };
    setStored(key, updated);
    return updated;
  }
}

export const notificationEngine = new UnifiedNotificationEngine();

// Legacy compatibility exports
export const requestNotificationPermission = () => notificationEngine.requestNotificationPermission();
export const displayLocalNotification = (payload: { title: string; body: string; icon?: string; data?: any }) =>
  notificationEngine.displayLocalNotification(payload);
