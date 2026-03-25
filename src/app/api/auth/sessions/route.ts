import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err, parseBody } from '@/lib/api';
import {
  requireAdminSession,
  listDbSessions,
  deleteDbSession,
  deleteAllDbSessions,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

/** GET /api/auth/sessions — 列出所有活跃 session */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request, 'super_admin');
  if (!session) return err('未授权', 401);

  const sessions = await listDbSessions();
  return ok(
    sessions.map((s) => ({
      id: s.id,
      ip: s.ip_address,
      userAgent: s.user_agent,
      lastActivity: s.last_activity,
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      isCurrent: s.id === session.sessionId,
    }))
  );
}

const deleteSchema = z.object({
  sessionId: z.string().optional(), // 指定 sessionId；不传则删除全部
});

/** DELETE /api/auth/sessions — 踢出指定 session 或所有其他 session */
export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request, 'super_admin');
  if (!session) return err('未授权', 401);

  const parsed = await parseBody(request, deleteSchema);
  if (parsed instanceof Response) return parsed;

  if (parsed.sessionId) {
    await deleteDbSession(parsed.sessionId);
    return ok({ deleted: parsed.sessionId });
  }

  // 删除所有 session（包括当前），客户端 cookie 会自然失效
  await deleteAllDbSessions();
  return ok({ deleted: 'all' });
}
