/**
 * Environment configuration for the IDEAL app.
 * All environment variables should be accessed through this module.
 * This ensures portability and makes it easy to swap providers.
 */

/**
 * Safely get the app domain with fallback to current origin.
 * Never throws - always returns a usable value.
 */
function getAppDomain(): string {
  const envDomain = import.meta.env.VITE_APP_DOMAIN;
  
  if (!envDomain) {
    console.info('[env] VITE_APP_DOMAIN not set, using window.location.origin for QR URLs');
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  
  // Validate it's a proper URL
  try {
    new URL(envDomain);
    return envDomain;
  } catch {
    console.warn('[env] VITE_APP_DOMAIN is not a valid URL, falling back to window.location.origin');
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
}

export const env = {
  // Supabase / Backend
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'IDEAL',
  appDomain: getAppDomain(),
  
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
 * Validate required environment variables (non-blocking)
 */
export function validateEnv(): void {
  const required = ['supabaseUrl', 'supabaseAnonKey'] as const;
  const missing = required.filter((key) => !env[key]);
  
  if (missing.length > 0) {
    console.warn(`[env] Missing environment variables: ${missing.join(', ')}`);
  }
}
