import { NextRequest } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { err, ok } from '@/lib/api';
import {
  COOKIE_PASSKEY_AUTH_PENDING,
  PASSKEY_CHALLENGE_EXPIRY_S,
  signPasskeyChallengeCookie,
} from '@/lib/auth-server';
import { getPasskeyRelyingParty, getStoredAdminPasskeys } from '@/lib/passkeys';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const passkeys = await getStoredAdminPasskeys();
  if (passkeys.length === 0) {
    return err('还没有绑定通行密钥，请先用邮箱登录后添加', 404, 'PASSKEY_NOT_CONFIGURED');
  }

  const { rpID } = getPasskeyRelyingParty(request);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: passkeys.map((passkey) => ({
      id: passkey.id,
      transports: passkey.transports,
    })),
  });

  const token = await signPasskeyChallengeCookie('authentication', options.challenge);
  const response = ok({
    options,
    count: passkeys.length,
  });

  response.cookies.set(COOKIE_PASSKEY_AUTH_PENDING, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: PASSKEY_CHALLENGE_EXPIRY_S,
  });

  return response;
}
