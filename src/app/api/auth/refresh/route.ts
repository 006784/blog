import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import {
  verifyRefreshToken,
  rotateDbSession,
  setAuthCookies,
  COOKIE_REFRESH,
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/refresh
 * 用 refresh_token cookie 换取新的 access_token + refresh_token
 * 旧 refresh token 立即失效（rotation）
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(COOKIE_REFRESH)?.value;
  if (!refreshToken) return err('无刷新令牌', 401);

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return err('刷新令牌无效或已过期', 401);

  const nextSessionId = await rotateDbSession(payload.sessionId);
  if (!nextSessionId) return err('会话已失效，请重新登录', 401);

  const res = ok({ refreshed: true });
  await setAuthCookies(res, nextSessionId);
  return res;
}
