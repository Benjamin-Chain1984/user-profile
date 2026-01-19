/**
 * Client Token Service Types
 */

export interface Client {
  id: string;
  preferredName: string;
  shortBio?: string;
  photoUrl?: string;
  status: 'active' | 'inactive';
  posterQrTokenCreatedAt: Date;
  posterQrTokenRotatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientTokenResult {
  success: boolean;
  client?: Client;
  error?: string;
  invalidToken?: boolean;
  tokenRotated?: boolean;
}

export interface TokenRotationResult {
  success: boolean;
  newToken?: string;
  error?: string;
}

export interface ClientTokenService {
  /**
   * Resolve a client by their poster QR token.
   * Compares hash of provided token with stored hash.
   */
  resolveClientByToken(token: string): Promise<ClientTokenResult>;
  
  /**
   * Rotate a client's poster QR token.
   * Generates new token, stores hash, invalidates old token.
   */
  rotateClientToken(clientId: string): Promise<TokenRotationResult>;
  
  /**
   * Generate the full URL for a client's poster QR code.
   */
  generatePosterQrUrl(token: string): string;
  
  /**
   * Generate a new secure token (returns plaintext - only store hash!)
   */
  generateSecureToken(): string;
  
  /**
   * Hash a token for storage
   */
  hashToken(token: string): Promise<string>;
}
