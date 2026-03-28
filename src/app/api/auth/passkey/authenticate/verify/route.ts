import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { err, ok, parseBody, z } from '@/lib/api';
import {
  COOKIE_PASSKEY_AUTH_PENDING,
  createDbSession,
  setAuthCookies,
  verifyPasskeyChallengeCookie,
} from '@/lib/auth-server';
import {
  getPasskeyRelyingParty,
  getStoredAdminPasskeys,
  toWebAuthnCredential,
  upsertStoredAdminPasskey,
} from '@/lib/passkeys';
import { extractIP } from '@/lib/rate-limit-auth';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  response: z.custom<AuthenticationResponseJSON>(),
});

export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, verifySchema);
  if (parsed instanceof Response) return parsed;

  const pendingToken = request.cookies.get(COOKIE_PASSKEY_AUTH_PENDING)?.value;
  if (!pendingToken) {
    return err('通行密钥登录已过期，请重新尝试', 400, 'PASSKEY_AUTH_EXPIRED');
  }

  const pending = await verifyPasskeyChallengeCookie(pendingToken, 'authentication');
  if (!pending) {
    return err('通行密钥登录已过期，请重新尝试', 400, 'PASSKEY_AUTH_EXPIRED');
  }

  const passkeys = await getStoredAdminPasskeys();
  const storedPasskey = passkeys.find((passkey) => passkey.id === parsed.response.id);
  if (!storedPasskey) {
    return err('没有找到匹配的通行密钥，请先重新绑定', 404, 'PASSKEY_NOT_FOUND');
  }

  const { origins, rpIDs } = getPasskeyRelyingParty(request);
  const verification = await verifyAuthenticationResponse({
    response: parsed.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: origins,
    expectedRPID: rpIDs,
    credential: toWebAuthnCredential(storedPasskey),
    requireUserVerification: true,
  });

  if (!verification.verified) {
    return err('通行密钥验证失败，请重试', 401, 'PASSKEY_AUTH_FAILED');
  }

  const ip = extractIP(request);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const sessionId = crypto.randomUUID();
  const created = await createDbSession(sessionId, ip, userAgent);
  if (!created) {
    return err('登录失败，请稍后重试', 500, 'SESSION_CREATE_FAILED');
  }

  await upsertStoredAdminPasskey({
    ...storedPasskey,
    counter: verification.authenticationInfo.newCounter,
    backedUp: verification.authenticationInfo.credentialBackedUp,
    deviceType: verification.authenticationInfo.credentialDeviceType,
    lastUsedAt: new Date().toISOString(),
  });

  const response = ok({ authenticated: true });
  await setAuthCookies(response, sessionId);
  response.cookies.delete(COOKIE_PASSKEY_AUTH_PENDING);
  return response;
}
