function encodeUtf8(value: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value);
  }

  return Uint8Array.from(Buffer.from(value, 'utf8'));
}

function decodeUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }

  return Buffer.from(bytes).toString('utf8');
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof btoa === 'function') {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }

    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(token: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(token);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }

  return Uint8Array.from(Buffer.from(token, 'base64'));
}

export function encodeAdminToken(password: string): string {
  return bytesToBase64(encodeUtf8(password));
}

export function decodeAdminToken(token: string): string | null {
  try {
    return decodeUtf8(base64ToBytes(token));
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim() || null;
}

export function isValidAdminToken(
  token: string | null | undefined,
  adminPassword: string
): boolean {
  if (!token) return false;
  return token === encodeAdminToken(adminPassword);
}

export function isValidAdminBearer(
  authHeader: string | null,
  adminPassword: string
): boolean {
  return isValidAdminToken(extractBearerToken(authHeader), adminPassword);
}

export function readVerifyResponseToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const flatToken = (payload as { token?: unknown }).token;
  if (typeof flatToken === 'string' && flatToken) return flatToken;

  const nestedData = (payload as { data?: unknown }).data;
  if (!nestedData || typeof nestedData !== 'object') return null;

  const nestedToken = (nestedData as { token?: unknown }).token;
  return typeof nestedToken === 'string' && nestedToken ? nestedToken : null;
}
