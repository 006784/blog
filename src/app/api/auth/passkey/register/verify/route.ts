import { NextRequest } from 'next/server';
import { verifyRegistrationResponse, type RegistrationResponseJSON } from '@simplewebauthn/server';
import { err, ok, parseBody, z } from '@/lib/api';
import {
  COOKIE_PASSKEY_REGISTRATION_PENDING,
  requireAdminSession,
  verifyPasskeyChallengeCookie,
} from '@/lib/auth-server';
import {
  getPasskeyRelyingParty,
  sanitizePasskeyForClient,
  upsertStoredAdminPasskey,
} from '@/lib/passkeys';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  response: z.custom<RegistrationResponseJSON>(),
  name: z.string().trim().max(60).optional(),
});

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request, 'editor');
  if (!session) {
    return err('未授权', 401, 'UNAUTHORIZED');
  }

  const parsed = await parseBody(request, verifySchema);
  if (parsed instanceof Response) return parsed;

  const pendingToken = request.cookies.get(COOKIE_PASSKEY_REGISTRATION_PENDING)?.value;
  if (!pendingToken) {
    return err('通行密钥注册已过期，请重新开始', 400, 'PASSKEY_REGISTRATION_EXPIRED');
  }

  const pending = await verifyPasskeyChallengeCookie(pendingToken, 'registration');
  if (!pending) {
    return err('通行密钥注册已过期，请重新开始', 400, 'PASSKEY_REGISTRATION_EXPIRED');
  }

  const { origins, rpIDs } = getPasskeyRelyingParty(request);
  const verification = await verifyRegistrationResponse({
    response: parsed.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: origins,
    expectedRPID: rpIDs,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return err('通行密钥验证失败，请重试', 400, 'PASSKEY_REGISTRATION_FAILED');
  }

  const registrationInfo = verification.registrationInfo;
  const credential = registrationInfo.credential;
  const passkeyName = parsed.name?.trim() || '当前设备通行密钥';
  const now = new Date().toISOString();

  const storedPasskey = {
    id: credential.id,
    name: passkeyName,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports,
    deviceType: registrationInfo.credentialDeviceType,
    backedUp: registrationInfo.credentialBackedUp,
    createdAt: now,
    lastUsedAt: now,
  } as const;

  await upsertStoredAdminPasskey(storedPasskey);

  const response = ok({
    passkey: sanitizePasskeyForClient(storedPasskey),
  });
  response.cookies.delete(COOKIE_PASSKEY_REGISTRATION_PENDING);
  return response;
}
