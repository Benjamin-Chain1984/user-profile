/**
 * Biometric (WebAuthn platform authenticator) helpers.
 *
 * Purpose: after a staff member has verified by SMS on this device, we can use
 * the phone's built-in biometrics (Face ID / Touch ID / Android fingerprint) as
 * a fast local unlock for the QR access flow.
 *
 * Security model: the trusted-device record + SMS verification remain the
 * server-side factors. Biometrics act as a device-local gate that protects the
 * saved session from being used by someone who picks up the phone.
 */

const BIOMETRIC_KEY = 'ideal_biometric_credential';

interface StoredBiometric {
  credentialId: string; // base64url
  userId: string;
  userName?: string;
  enrolledAt: string;
}

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

function randomBytes(length = 32): ArrayBuffer {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

/** Is a platform authenticator (Face ID / fingerprint) available on this device? */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    if (!('PublicKeyCredential' in window)) return false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function getStoredBiometric(): StoredBiometric | null {
  try {
    const raw = localStorage.getItem(BIOMETRIC_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredBiometric;
  } catch {
    return null;
  }
}

/** Is biometric unlock enrolled on this device for this specific user? */
export function isBiometricEnrolledFor(userId?: string | null): boolean {
  const stored = getStoredBiometric();
  if (!stored || !userId) return false;
  return stored.userId === userId;
}

export function clearBiometric(): void {
  localStorage.removeItem(BIOMETRIC_KEY);
}

/**
 * Enrol this device's biometrics for the given staff user.
 */
export async function enrolBiometric(
  userId: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isBiometricAvailable())) {
      return { success: false, error: 'Biometrics are not available on this device.' };
    }

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(),
        rp: { name: 'IDEAL', id: window.location.hostname },
        user: {
          id: randomBytes(16),
          name: userName || userId,
          displayName: userName || 'IDEAL staff',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Biometric setup was cancelled.' };
    }

    const stored: StoredBiometric = {
      credentialId: toBase64Url(credential.rawId),
      userId,
      userName,
      enrolledAt: new Date().toISOString(),
    };
    localStorage.setItem(BIOMETRIC_KEY, JSON.stringify(stored));
    return { success: true };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric setup was cancelled.' };
    }
    console.error('[Biometric] Enrolment failed:', err);
    return { success: false, error: err?.message || 'Could not set up biometric unlock.' };
  }
}

/**
 * Ask the device for a biometric check. Returns true when the user verifies.
 */
export async function verifyBiometric(): Promise<{ success: boolean; error?: string }> {
  const stored = getStoredBiometric();
  if (!stored) return { success: false, error: 'No biometric unlock set up on this device.' };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(),
        allowCredentials: [
          { id: fromBase64Url(stored.credentialId), type: 'public-key' },
        ],
        userVerification: 'required',
        timeout: 60000,
        rpId: window.location.hostname,
      },
    });

    if (!assertion) return { success: false, error: 'Biometric check failed.' };
    return { success: true };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric check was cancelled.' };
    }
    console.error('[Biometric] Verification failed:', err);
    return { success: false, error: err?.message || 'Biometric check failed.' };
  }
}
