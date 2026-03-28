import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { err, ok, parseBody, z } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  COOKIE_EMAIL_LOGIN_PENDING,
  createDbSession,
  isEmailLoginCodeValid,
  setAuthCookies,
  verifyEmailLoginCookie,
} from '@/lib/auth-server';
import {
  checkLoginRateLimit,
  extractIP,
  recordLoginFailure,
  resetLoginFailures,
} from '@/lib/rate-limit-auth';
import {
  getAdminLoginEmails,
  isAllowedAdminEmail,
  normalizeAdminEmail,
} from '@/lib/admin-email-login';

export const dynamic = 'force-dynamic';

const verifySchema = z.object({
  email: z.string().email('请输入有效的管理员邮箱'),
  code: z.string().regex(/^\d{6}$/, '验证码为 6 位数字'),
});

export async function POST(request: NextRequest) {
  const ip = extractIP(request);
  const rl = await checkLoginRateLimit(ip);
  if (!rl.ok) {
    return Response.json(
      { success: false, error: rl.reason },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      }
    );
  }

  const parsed = await parseBody(request, verifySchema);
  if (parsed instanceof Response) return parsed;

  const pendingToken = request.cookies.get(COOKIE_EMAIL_LOGIN_PENDING)?.value;
  if (!pendingToken) {
    return err('验证码已过期，请重新获取', 401, 'EMAIL_CODE_EXPIRED');
  }

  const pending = await verifyEmailLoginCookie(pendingToken);
  if (!pending) {
    return err('验证码已过期，请重新获取', 401, 'EMAIL_CODE_EXPIRED');
  }

  const adminEmails = await getAdminLoginEmails();
  if (adminEmails.length === 0) {
    logger.error('管理员邮箱未配置，无法完成邮箱登录', { module: 'auth', ip });
    return err('管理员邮箱未配置，请先设置后再登录', 500, 'ADMIN_EMAIL_NOT_CONFIGURED');
  }

  const email = normalizeAdminEmail(parsed.email);
  if (!(await isAllowedAdminEmail(email)) || email !== pending.email) {
    await recordLoginFailure(ip);
    logger.warn('管理员邮箱验证码验证失败：邮箱不匹配', { module: 'auth', ip, email });
    return err('邮箱与验证码不匹配，请重新获取验证码', 401, 'EMAIL_CODE_MISMATCH');
  }

  if (!isEmailLoginCodeValid(parsed.code, pending.codeHash)) {
    await recordLoginFailure(ip);
    logger.warn('管理员邮箱验证码错误', { module: 'auth', ip, email });
    return err('验证码错误，请重试', 401, 'INVALID_EMAIL_CODE');
  }

  await resetLoginFailures(ip);

  const sessionId = crypto.randomUUID();
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const created = await createDbSession(sessionId, ip, userAgent);
  if (!created) {
    logger.error('管理员邮箱登录失败：会话创建失败', { module: 'auth', ip, email });
    return err('登录失败，请稍后重试', 500, 'SESSION_CREATE_FAILED');
  }

  const response = ok({ authenticated: true });
  await setAuthCookies(response, sessionId);
  response.cookies.delete(COOKIE_EMAIL_LOGIN_PENDING);

  logger.info('管理员邮箱登录成功', { module: 'auth', ip, email, action: 'email_login_success' });
  return response;
}
