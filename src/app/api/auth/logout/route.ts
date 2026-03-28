import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  verifyAccessToken,
  clearAuthCookies,
  deleteDbSession,
  deleteAllDbSessions,
  COOKIE_ACCESS,
} from '@/lib/auth-server';
import { extractIP } from '@/lib/rate-limit-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 * body: { all?: boolean }  — all=true 则踢出所有设备
 */
export async function POST(request: NextRequest) {
  const ip = extractIP(request);
  const token = request.cookies.get(COOKIE_ACCESS)?.value;

  let sessionId: string | null = null;
  if (token) {
    const payload = await verifyAccessToken(token);
    sessionId = payload?.sessionId ?? null;
  }

  let all = false;
  try {
    const body = await request.json();
    all = !!body.all;
  } catch {
    // body 可选
  }

  if (sessionId) {
    if (all) {
      await deleteAllDbSessions();
      logger.info('管理员退出所有设备', { module: 'auth', ip });
    } else {
      await deleteDbSession(sessionId);
      logger.info('管理员退出登录', { module: 'auth', ip, sessionId });
    }
  }

  const res = ok({ message: '已退出登录' });
  clearAuthCookies(res);
  return res;
}
