/**
 * Client Token Service Implementation
 * 
 * Handles secure token generation, hashing, and resolution for poster QR codes.
 */

import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';
import type { 
  ClientTokenService, 
  Client, 
  ClientTokenResult, 
  TokenRotationResult 
} from './types';

/**
 * Convert database row to Client type
 */
function toClient(row: any): Client {
  return {
    id: row.id,
    preferredName: row.preferred_name,
    shortBio: row.short_bio,
    photoUrl: row.photo_url,
    status: row.status,
    posterQrTokenCreatedAt: new Date(row.poster_qr_token_created_at),
    posterQrTokenRotatedAt: row.poster_qr_token_rotated_at 
      ? new Date(row.poster_qr_token_rotated_at) 
      : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Generate a cryptographically secure random token
 * Uses Web Crypto API for security
 */
/**
 * Generate a cryptographically secure random token
 * Uses Web Crypto API for security
 */
export function generateSecureToken(): string {
  const bytes = new Uint8Array(32); // 256 bits of entropy
  crypto.getRandomValues(bytes);
  // Convert to base64url encoding (URL-safe)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Hash a token using SHA-256
 * Only the hash is stored in the database
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

class ClientTokenServiceImpl implements ClientTokenService {
  async resolveClientByToken(token: string): Promise<ClientTokenResult> {
    try {
      // Hash the incoming token
      const tokenHash = await hashToken(token);
      
      // Look up client by token hash
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('poster_qr_token_hash', tokenHash)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error resolving client token:', error);
        return { success: false, error: 'Failed to resolve token' };
      }

      if (!data) {
        return { 
          success: false, 
          invalidToken: true,
          error: 'This QR code is invalid or has been replaced. Please ask admin for a new poster.',
        };
      }

      return {
        success: true,
        client: toClient(data),
      };
    } catch (err) {
      console.error('Token resolution error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async rotateClientToken(clientId: string): Promise<TokenRotationResult> {
    try {
      // Generate new token
      const newToken = generateSecureToken();
      const newTokenHash = await hashToken(newToken);

      // Update client with new token hash
      const { error } = await supabase
        .from('clients')
        .update({
          poster_qr_token_hash: newTokenHash,
          poster_qr_token_rotated_at: new Date().toISOString(),
        })
        .eq('id', clientId);

      if (error) {
        console.error('Error rotating token:', error);
        return { success: false, error: 'Failed to rotate token' };
      }

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('log_audit_event', {
          p_actor_user_id: user.id,
          p_action: 'QR_ROTATE',
          p_client_id: clientId,
          p_metadata_json: { 
            userAgent: navigator.userAgent,
            route: window.location.pathname,
          },
        });
      }

      return {
        success: true,
        newToken, // Return plaintext token for QR code generation
      };
    } catch (err) {
      console.error('Token rotation error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  generatePosterQrUrl(token: string): string {
    return `${env.appDomain}/c/${token}`;
  }

  generateSecureToken(): string {
    return generateSecureToken();
  }

  async hashToken(token: string): Promise<string> {
    return hashToken(token);
  }
}

// Export singleton instance
export const clientTokenService = new ClientTokenServiceImpl();

// Re-export types
export * from './types';
