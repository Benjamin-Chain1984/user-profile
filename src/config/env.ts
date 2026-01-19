/**
 * Environment configuration for the IDEAL app.
 * All environment variables should be accessed through this module.
 * This ensures portability and makes it easy to swap providers.
 */

export const env = {
  // Supabase / Backend
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'IDEAL',
  appDomain: import.meta.env.VITE_APP_DOMAIN || window.location.origin,
  
  // Feature Flags
  enablePasskeys: import.meta.env.VITE_ENABLE_PASSKEYS !== 'false',
  enableSmsOtp: import.meta.env.VITE_ENABLE_SMS_OTP !== 'false',
  
  // SMS Provider (for documentation purposes - actual keys should be in secrets)
  smsProvider: import.meta.env.VITE_SMS_PROVIDER || 'twilio',
  
  // Development
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = ['supabaseUrl', 'supabaseAnonKey'] as const;
  const missing = required.filter((key) => !env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }
}
