/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// =====================================================================
// HAPPIIZ GATE APP — UNIFIED REAL-TIME SYNCHRONIZATION & EVENT BUS
// Provides instant cross-window, cross-tab, and cross-dashboard event
// propagation using BroadcastChannel with localStorage fallback.
// =====================================================================

export type EcosystemEventType =
  | 'VISITOR_PRE_APPROVED'
  | 'VISITOR_WALK_IN_REQUESTED'
  | 'VISITOR_APPROVAL_RESPONSE'
  | 'VISITOR_ENTRY_GRANTED'
  | 'VISITOR_EXIT_RECORDED'
  | 'SERVICE_BOOKING_CREATED'
  | 'SERVICE_BOOKING_ACCEPTED'
  | 'SERVICE_BOOKING_REJECTED'
  | 'SERVICE_BOOKING_COMPLETED'
  | 'SERVICE_INVOICE_PAID'
  | 'EMERGENCY_TRIGGERED'
  | 'EMERGENCY_ACKNOWLEDGED'
  | 'EMERGENCY_RESOLVED'
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_UPDATED'
  | 'NOTICE_PUBLISHED'
  | 'AMENITY_BOOKED'
  | 'AMENITY_STATUS_CHANGED'
  | 'HOUSEHOLD_UPDATED'
  | 'NOTIFICATION_DISPATCHED'
  | 'AUDIT_LOG_RECORDED'
  | 'MARKETPLACE_SERVICE_CREATED'
  | 'MARKETPLACE_SERVICE_UPDATED'
  | 'MARKETPLACE_SERVICE_DELETED'
  | 'MARKETPLACE_BOOKING_CREATED'
  | 'MARKETPLACE_BOOKING_ACCEPTED'
  | 'MARKETPLACE_BOOKING_STARTED'
  | 'MARKETPLACE_BOOKING_COMPLETED'
  | 'PARTNER_RATES_UPDATED'
  | 'ROLE_PERMISSIONS_UPDATED'
  | 'SETTINGS_UPDATED';

export interface EcosystemSyncEvent<T = any> {
  id: string;
  type: EcosystemEventType;
  societyId: string;
  senderUid: string;
  senderRole: string;
  timestamp: string;
  payload: T;
}

type SyncEventListener<T = any> = (event: EcosystemSyncEvent<T>) => void;

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<EcosystemEventType, Set<SyncEventListener>> = new Map();
  private allListeners: Set<SyncEventListener> = new Set();
  private processedEventIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel('happiiz_gate_sync_bus');
          this.channel.onmessage = (messageEvent) => {
            this.handleIncomingEvent(messageEvent.data);
          };
        }
      } catch (e) {
        console.warn('[SyncBus] BroadcastChannel not supported, falling back to storage listener:', e);
      }

      // Storage event listener fallback (supports cross-window even if BroadcastChannel fails)
      window.addEventListener('storage', (storageEvent) => {
        if (storageEvent.key === 'hpz_sync_bus_event' && storageEvent.newValue) {
          try {
            const event: EcosystemSyncEvent = JSON.parse(storageEvent.newValue);
            this.handleIncomingEvent(event);
          } catch (_) {}
        }
      });
    }
  }

  /**
   * Broadcast an ecosystem event to all connected portals, windows, and tabs.
   */
  public broadcast<T = any>(
    type: EcosystemEventType,
    societyId: string,
    senderUid: string,
    senderRole: string,
    payload: T
  ): EcosystemSyncEvent<T> {
    const event: EcosystemSyncEvent<T> = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      societyId,
      senderUid,
      senderRole,
      timestamp: new Date().toISOString(),
      payload,
    };

    // Mark as processed locally to avoid loopback double execution
    this.processedEventIds.add(event.id);
    this.cleanEventIdCache();

    // Trigger local listeners in current window
    this.dispatchToListeners(event);

    // Broadcast across windows/tabs
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.warn('[SyncBus] BroadcastChannel send error:', err);
      }
    }

    // Trigger storage event fallback
    try {
      localStorage.setItem('hpz_sync_bus_event', JSON.stringify(event));
    } catch (_) {}

    return event;
  }

  /**
   * Subscribe to a specific ecosystem event type.
   */
  public subscribe<T = any>(type: EcosystemEventType, callback: SyncEventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const set = this.listeners.get(type)!;
    set.add(callback as SyncEventListener);

    return () => {
      set.delete(callback as SyncEventListener);
    };
  }

  /**
   * Subscribe to all ecosystem events.
   */
  public subscribeAll(callback: SyncEventListener): () => void {
    this.allListeners.add(callback);
    return () => {
      this.allListeners.delete(callback);
    };
  }

  private handleIncomingEvent(event: EcosystemSyncEvent): void {
    if (!event || !event.id || this.processedEventIds.has(event.id)) {
      return;
    }
    this.processedEventIds.add(event.id);
    this.cleanEventIdCache();
    this.dispatchToListeners(event);
  }

  private dispatchToListeners(event: EcosystemSyncEvent): void {
    // Specific type listeners
    const specificSet = this.listeners.get(event.type);
    if (specificSet) {
      specificSet.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[SyncBus] Listener error for ${event.type}:`, err);
        }
      });
    }

    // Global listeners
    this.allListeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[SyncBus] Global listener error:', err);
      }
    });
  }

  private cleanEventIdCache(): void {
    if (this.processedEventIds.size > 200) {
      const arr = Array.from(this.processedEventIds);
      this.processedEventIds = new Set(arr.slice(arr.length - 100));
    }
  }
}

export const syncBus = new RealtimeSyncManager();
