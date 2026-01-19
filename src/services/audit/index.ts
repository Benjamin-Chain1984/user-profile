/**
 * Audit Service Implementation
 */

import { supabase } from '@/integrations/supabase/client';
import type { AuditService, AuditAction, AuditEvent, AuditMetadata } from './types';

function toAuditEvent(row: any): AuditEvent {
  return {
    id: row.id,
    timestamp: new Date(row.timestamp),
    actorUserId: row.actor_user_id,
    action: row.action as AuditAction,
    clientId: row.client_id,
    metadata: row.metadata_json || {},
  };
}

class AuditServiceImpl implements AuditService {
  async logEvent(
    action: AuditAction,
    clientId?: string,
    metadata?: AuditMetadata
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const enrichedMetadata: AuditMetadata = {
        ...metadata,
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
      };

      await supabase.rpc('log_audit_event', {
        p_actor_user_id: user?.id || null,
        p_action: action,
        p_client_id: clientId || null,
        p_metadata_json: enrichedMetadata,
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
      // Don't throw - audit logging should not break the app
    }
  }

  async getClientEvents(clientId: string, limit = 50): Promise<AuditEvent[]> {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('client_id', clientId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching client audit events:', error);
      return [];
    }

    return (data || []).map(toAuditEvent);
  }

  async getRecentEvents(limit = 100): Promise<AuditEvent[]> {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent audit events:', error);
      return [];
    }

    return (data || []).map(toAuditEvent);
  }
}

// Export singleton instance
export const auditService = new AuditServiceImpl();

// Re-export types
export * from './types';
