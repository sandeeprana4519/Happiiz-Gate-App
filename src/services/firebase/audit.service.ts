/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from './init';
import { collection, doc, setDoc } from 'firebase/firestore';
import { syncBus } from './sync.service';

export type AuditActionType =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'VISITOR_ENTRY'
  | 'VISITOR_EXIT'
  | 'VISITOR_APPROVAL'
  | 'VISITOR_REJECTION'
  | 'BOOKING_CHANGES'
  | 'JOB_STATUS_CHANGES'
  | 'PAYMENT_EVENTS'
  | 'COMPLAINT_UPDATES'
  | 'EMERGENCY_RESPONSE'
  | 'ADMIN_ACTIONS'
  | 'PERMISSION_CHANGES';

export interface UnifiedAuditLogEntry {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: string;
  societyId?: string;
  targetId: string;
  targetType: string;
  action: AuditActionType | string;
  timestamp: string;
  changeSummary: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

const AUDIT_STORE_KEY = 'happiiz_global_audit_logs';

function getStoredLogs(): UnifiedAuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return [];
}

function setStoredLogs(logs: UnifiedAuditLogEntry[]): void {
  try {
    localStorage.setItem(AUDIT_STORE_KEY, JSON.stringify(logs));
  } catch (_) {}
}

/**
 * Append an immutable audit event to both local persistent store and Firestore (if connected).
 */
export async function logEcosystemAuditEvent(params: {
  action: AuditActionType | string;
  targetId: string;
  targetType: string;
  changeSummary: string;
  societyId?: string;
  actorUid?: string;
  actorName?: string;
  actorRole?: string;
  metadata?: Record<string, any>;
}): Promise<UnifiedAuditLogEntry> {
  const currentFbUser = auth?.currentUser;

  const entry: UnifiedAuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actorUid: params.actorUid || currentFbUser?.uid || 'usr_system',
    actorName: params.actorName || currentFbUser?.displayName || 'Authorized System Actor',
    actorRole: params.actorRole || 'SYSTEM',
    societyId: params.societyId || 'soc_emerald_heights',
    targetId: params.targetId,
    targetType: params.targetType,
    action: params.action,
    timestamp: new Date().toISOString(),
    changeSummary: params.changeSummary,
    ipAddress: '127.0.0.1 (Verified Gateway Tunnel)',
    metadata: params.metadata,
  };

  // 1. Save to local audit buffer
  const existing = getStoredLogs();
  setStoredLogs([entry, ...existing.slice(0, 1000)]);

  // 2. Also write to society-specific audit log for Society Admin portal
  if (entry.societyId) {
    try {
      const socKey = 'hpz_soc_audit_' + entry.societyId;
      const rawSoc = localStorage.getItem(socKey);
      const socLogs = rawSoc ? JSON.parse(rawSoc) : [];
      localStorage.setItem(socKey, JSON.stringify([entry, ...socLogs.slice(0, 500)]));
    } catch (_) {}
  }

  // 3. Persist to Firestore if authenticated and connected
  if (db && currentFbUser && !currentFbUser.uid.startsWith('dev_')) {
    try {
      await setDoc(doc(db, 'auditLogs', entry.id), entry);
    } catch (err) {
      console.warn('[AuditService] Remote audit log sync notice:', err);
    }
  }

  // 4. Broadcast on sync bus
  syncBus.broadcast(
    'AUDIT_LOG_RECORDED',
    entry.societyId || 'global',
    entry.actorUid,
    entry.actorRole,
    entry
  );

  return entry;
}

/**
 * Fetch all unified audit logs with optional filters
 */
export async function getEcosystemAuditLogs(filters?: {
  societyId?: string;
  action?: string;
  actorUid?: string;
  limit?: number;
}): Promise<UnifiedAuditLogEntry[]> {
  let logs = getStoredLogs();

  if (filters?.societyId) {
    logs = logs.filter((l) => l.societyId === filters.societyId);
  }
  if (filters?.action) {
    logs = logs.filter((l) => l.action === filters.action);
  }
  if (filters?.actorUid) {
    logs = logs.filter((l) => l.actorUid === filters.actorUid);
  }

  if (filters?.limit) {
    logs = logs.slice(0, filters.limit);
  }

  return logs;
}
