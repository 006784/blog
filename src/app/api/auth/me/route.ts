import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * 客户端用此接口判断是否已登录（httpOnly cookie 无法被 JS 直接读取）
 */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request);
  if (!session) return err('未登录', 401, 'UNAUTHORIZED');
  return ok({ role: session.role, sessionId: session.sessionId });
}
