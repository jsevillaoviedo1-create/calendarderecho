/**
 * WebAuthn local biometric authentication helper.
 * Uses the Web Authentication API (PublicKeyCredential) with platform authenticators
 * (Touch ID, Face ID, Windows Hello, Android Biometrics) for local session unlocking.
 */

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Checks if the user's device supports platform biometrics (Touch ID, Face ID, Windows Hello).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    }
    return false;
  } catch (error) {
    console.warn('Error checking biometric platform authenticator:', error);
    return false;
  }
}

/**
 * Registers local biometrics for the current user.
 * Returns the created credential ID encoded in base64.
 */
export async function registerBiometricCredential(
  userId: string,
  userEmail: string,
  displayName: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  try {
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Tu dispositivo o navegador no cuenta con soporte para biometría local (Touch ID / Face ID / Windows Hello).',
      };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userBuffer = new TextEncoder().encode(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Chronos Calendar',
        id: window.location.hostname,
      },
      user: {
        id: userBuffer,
        name: userEmail,
        displayName: displayName || userEmail.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'No se completó el registro biométrico.' };
    }

    const credentialId = bufferToBase64(credential.rawId);
    return { success: true, credentialId };
  } catch (error: any) {
    console.error('Biometric registration error:', error);
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Registro cancelado o denegado por el usuario.' };
    }
    return { success: false, error: error.message || 'Error registrando biometría en el dispositivo.' };
  }
}

/**
 * Prompts user to unlock local session using their enrolled biometric credential.
 */
export async function verifyBiometricUnlock(
  credentialIdBase64?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
      return { success: false, error: 'Biometría no disponible en este dispositivo.' };
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = credentialIdBase64
      ? [
          {
            type: 'public-key',
            id: base64ToBuffer(credentialIdBase64),
            transports: ['internal'],
          },
        ]
      : [];

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname,
      userVerification: 'required',
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: 'Desbloqueo biométrico no completado.' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Biometric verification error:', error);
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Verificación biométrica cancelada.' };
    }
    return { success: false, error: error.message || 'Fallo de verificación biométrica.' };
  }
}
