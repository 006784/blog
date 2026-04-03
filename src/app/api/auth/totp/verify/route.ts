import { NextRequest } from 'next/server';
import { verify as totpVerify } from 'otplib';
import { z } from 'zod';
import { parseBody, ok, err } from '@/lib/api';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase';
import {
  verifyTotpStepToken,
  verifyTotpPendingCookie,
  requireAdminSession,
  setAuthCookies,
  createDbSession,
  COOKIE_TOTP_STEP,
  COOKIE_TOTP_PENDING,
} from '@/lib/auth-server';
import { extractIP } from '@/lib/rate-limit-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({ code: z.string().length(6, 'TOTP 为 6 位数字') });

/**
 * POST /api/auth/totp/verify
 * 两种用途：
 *  1. 登录第二步（携带 totp_step cookie）→ 颁发完整 session
 *  2. TOTP 设置确认（已登录用户）→ 将 pending secret 激活
 */
export async function POST(request: NextRequest) {
  const ip = extractIP(request);
  const parsed = await parseBody(request, verifySchema);
  if (parsed instanceof Response) return parsed;
  const { code } = parsed;

  // ── 场景 1：登录第二步 ──────────────────────────────────────────────────────
  const stepToken = request.cookies.get(COOKIE_TOTP_STEP)?.value;
  if (stepToken) {
    const stepPayload = await verifyTotpStepToken(stepToken);
    if (!stepPayload) return err('TOTP 验证步骤已超时，请重新登录', 401);

    // 读取已启用的 TOTP 密钥
    const { data } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'admin_totp')
      .single();

    const secret = (data?.value as { secret?: string })?.secret;
    if (!secret) return err('TOTP 未配置', 500);

    const result = await totpVerify({ token: code, secret });
    if (!result) {
      logger.warn('TOTP 验证失败（登录步骤）', { module: 'auth', ip });
      return err('验证码错误，请重试', 401);
    }

    // 颁发完整 session
    const sessionId = crypto.randomUUID();
    const ua = request.headers.get('user-agent') ?? 'unknown';
    const created = await createDbSession(sessionId, ip, ua);
    if (!created) {
      logger.error('管理员 TOTP 登录失败：会话创建失败', { module: 'auth', ip });
      return err('登录失败，请稍后重试', 500, 'SESSION_CREATE_FAILED');
    }

    logger.info('管理员 TOTP 登录成功', { module: 'auth', ip });

    const res = ok({ authenticated: true });
    await setAuthCookies(res, sessionId);
    // 清除临时 totp_step cookie
    res.cookies.delete(COOKIE_TOTP_STEP);
    return res;
  }

  // ── 场景 2：已登录用户激活 TOTP ────────────────────────────────────────────
  const session = await requireAdminSession(request, 'super_admin');
  if (!session) return err('未授权', 401);

  // 从签名 cookie 读取 pending secret
  const pendingToken = request.cookies.get(COOKIE_TOTP_PENDING)?.value;
  if (!pendingToken) return err('没有待激活的 TOTP 配置，请先点击"生成二维码"', 400);

  const pendingSecret = await verifyTotpPendingCookie(pendingToken);
  if (!pendingSecret) return err('TOTP 配置已过期（超过10分钟），请重新生成二维码', 400);

  const result = totpVerify({ token: code, secret: pendingSecret });
  if (!result) return err('验证码错误，TOTP 未激活', 401);

  // 激活：保存到数据库
  await supabaseAdmin.from('site_settings').upsert({
    key: 'admin_totp',
    value: { enabled: true, secret: pendingSecret, activatedAt: new Date().toISOString() },
  }, { onConflict: 'key' });

  logger.info('TOTP 双因素认证已启用', { module: 'auth' });

  const res = ok({ enabled: true });
  res.cookies.delete(COOKIE_TOTP_PENDING);
  return res;
}
