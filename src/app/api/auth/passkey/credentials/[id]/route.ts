import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';
import { removeStoredAdminPasskey } from '@/lib/passkeys';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request, 'editor');
  if (!session) {
    return err('未授权', 401, 'UNAUTHORIZED');
  }

  const { id } = await context.params;
  await removeStoredAdminPasskey(id);
  return ok({ deleted: true });
}
