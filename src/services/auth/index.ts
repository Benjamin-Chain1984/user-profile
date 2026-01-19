/**
 * Auth Service - Main Entry Point
 * 
 * This module exports a configured auth adapter.
 * To switch providers, modify the export here.
 */

import { supabaseAuth } from './providers/supabase';
import type { AuthAdapter } from './types';

// Export the active auth adapter
// To switch providers, import a different adapter here
export const authService: AuthAdapter = supabaseAuth;

// Re-export types for convenience
export * from './types';
