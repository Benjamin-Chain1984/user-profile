/**
 * Device Fingerprint Utility
 * Generates and persists a unique device ID in localStorage.
 * Used for trusted device tracking in MFA flow.
 */

const DEVICE_ID_KEY = 'ideal_device_id';
const DEVICE_NAME_KEY = 'ideal_device_name';

/**
 * Generate a random device ID (UUID v4 format)
 */
function generateDeviceId(): string {
  return crypto.randomUUID();
}

/**
 * Get or create a persistent device ID for this browser.
 * Returns the same ID across sessions until localStorage is cleared.
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get a human-readable device name from the user agent
 */
export function getDeviceName(): string {
  const cached = localStorage.getItem(DEVICE_NAME_KEY);
  if (cached) return cached;

  const ua = navigator.userAgent;
  let name = 'Unknown Device';

  if (/iPhone/.test(ua)) name = 'iPhone';
  else if (/iPad/.test(ua)) name = 'iPad';
  else if (/Android/.test(ua)) name = 'Android';
  else if (/Mac/.test(ua)) name = 'Mac';
  else if (/Windows/.test(ua)) name = 'Windows PC';
  else if (/Linux/.test(ua)) name = 'Linux';

  // Add browser
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) name += ' (Chrome)';
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) name += ' (Safari)';
  else if (/Firefox/.test(ua)) name += ' (Firefox)';
  else if (/Edg/.test(ua)) name += ' (Edge)';

  localStorage.setItem(DEVICE_NAME_KEY, name);
  return name;
}

/**
 * Clear device identity (e.g., on manual logout/revoke)
 */
export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
}
