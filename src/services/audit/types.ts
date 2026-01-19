/**
 * Audit Service Types
 */

export type AuditAction = 
  | 'CLIENT_ACCESS'
  | 'QR_ROTATE'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAIL'
  | 'OTP_SENT'
  | 'OTP_VERIFY_FAIL'
  | 'LOGOUT'
  | 'DATA_LOGGED';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  actorUserId?: string;
  action: AuditAction;
  clientId?: string;
  metadata: Record<string, any>;
}

export interface AuditMetadata {
  userAgent?: string;
  ip?: string;
  route?: string;
  moduleName?: string;
  device?: string;
  [key: string]: any;
}

export interface AuditService {
  /**
   * Log an audit event
   */
  logEvent(
    action: AuditAction,
    clientId?: string,
    metadata?: AuditMetadata
  ): Promise<void>;

  /**
   * Get audit events for a client
   */
  getClientEvents(clientId: string, limit?: number): Promise<AuditEvent[]>;

  /**
   * Get recent events (admin only)
   */
  getRecentEvents(limit?: number): Promise<AuditEvent[]>;
}
