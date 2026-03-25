import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody, ok, err } from '@/lib/api';
import { verifyAdminPassword } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import {
  setAuthCookies,
  createDbSession,
} from '@/lib/auth-server';
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginFailures,
  extractIP,
} from '@/lib/rate-limit-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  password: z.string().min(1, '密码不能为空'),
});

/** 检查是否启用了 TOTP */
async function isTotpEnabled(): Promise<string | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'admin_totp')
    .single();

  if (!data?.value?.enabled) return null;
  return (data.value as { secret: string }).secret ?? null;
}

/**
 * POST /api/auth/login
 * Step 1: 密码验证
 * - 如果 TOTP 未启用 → 直接颁发 session cookie
 * - 如果 TOTP 已启用 → 颁发短期 totp_step token，前端继续调 /api/auth/totp/verify
 */
export async function POST(request: NextRequest) {
  const ip = extractIP(request);

  // 四层速率限制
  const rl = await checkLoginRateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: rl.reason },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    );
  }

  const parsed = await parseBody(request, loginSchema);
  if (parsed instanceof Response) return parsed;
  const { password } = parsed;

  const isValid = verifyAdminPassword(password);

  if (!isValid) {
    await recordLoginFailure(ip);
    logger.warn('管理员登录失败', { module: 'auth', ip, action: 'login_failed' });
    // 固定延迟，防止时序攻击
    await new Promise((r) => setTimeout(r, 500));
    return err('密码错误', 401);
  }

  // 密码验证成功 → 重置失败计数
  await resetLoginFailures(ip);

  // 直接颁发完整 session（TOTP 已全局禁用）
  const sessionId = crypto.randomUUID();
  const ua = request.headers.get('user-agent') ?? 'unknown';
  await createDbSession(sessionId, ip, ua);

  logger.info('管理员登录成功', { module: 'auth', ip, action: 'login_success' });

  const res = ok({ requires_totp: false });
  await setAuthCookies(res, sessionId);
  return res;
}
