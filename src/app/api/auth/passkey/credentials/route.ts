import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';
import { getStoredAdminPasskeys, sanitizePasskeyForClient } from '@/lib/passkeys';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request, 'editor');
  if (!session) {
    return err('未授权', 401, 'UNAUTHORIZED');
  }

  const passkeys = await getStoredAdminPasskeys();
  return ok({
    passkeys: passkeys.map(sanitizePasskeyForClient),
  });
}
