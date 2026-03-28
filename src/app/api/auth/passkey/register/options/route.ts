import { NextRequest } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { err, ok } from '@/lib/api';
import {
  COOKIE_PASSKEY_REGISTRATION_PENDING,
  PASSKEY_CHALLENGE_EXPIRY_S,
  requireAdminSession,
  signPasskeyChallengeCookie,
} from '@/lib/auth-server';
import {
  getAdminPasskeyUserIdentity,
  getPasskeyRelyingParty,
  getStoredAdminPasskeys,
} from '@/lib/passkeys';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await requireAdminSession(request, 'editor');
  if (!session) {
    return err('未授权', 401, 'UNAUTHORIZED');
  }

  const { rpID, rpName } = getPasskeyRelyingParty(request);
  const { userDisplayName, userName } = await getAdminPasskeyUserIdentity();
  const passkeys = await getStoredAdminPasskeys();

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userName,
    userDisplayName,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
    excludeCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
    preferredAuthenticatorType: 'localDevice',
  });

  const token = await signPasskeyChallengeCookie('registration', options.challenge);
  const response = ok({ options });
  response.cookies.set(COOKIE_PASSKEY_REGISTRATION_PENDING, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: PASSKEY_CHALLENGE_EXPIRY_S,
  });

  return response;
}
