import { NextRequest } from 'next/server';
import { err, ok, parseBody, z } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  COOKIE_EMAIL_LOGIN_PENDING,
  EMAIL_LOGIN_EXPIRY_S,
  signEmailLoginCookie,
} from '@/lib/auth-server';
import {
  checkLoginRateLimit,
  extractIP,
  recordLoginFailure,
} from '@/lib/rate-limit-auth';
import {
  generateAdminLoginCode,
  getAdminLoginEmails,
  isAllowedAdminEmail,
  maskAdminEmail,
  normalizeAdminEmail,
  sendAdminLoginCodeEmail,
} from '@/lib/admin-email-login';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  email: z.string().email('请输入有效的管理员邮箱'),
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

  const parsed = await parseBody(request, requestSchema);
  if (parsed instanceof Response) return parsed;

  const adminEmails = await getAdminLoginEmails();
  if (adminEmails.length === 0) {
    logger.error('管理员邮箱未配置，无法发送登录验证码', { module: 'auth', ip });
    return err('管理员邮箱未配置，请先在环境变量 ADMIN_EMAIL 或个人资料里设置邮箱', 500, 'ADMIN_EMAIL_NOT_CONFIGURED');
  }

  const email = normalizeAdminEmail(parsed.email);
  if (!(await isAllowedAdminEmail(email))) {
    await recordLoginFailure(ip);
    logger.warn('管理员邮箱登录失败：邮箱不匹配', { module: 'auth', ip, email });
    return err('该邮箱没有管理员权限', 403, 'EMAIL_NOT_ALLOWED');
  }

  if (!process.env.RESEND_API_KEY) {
    logger.error('邮件服务未配置，无法发送管理员验证码', { module: 'auth', ip });
    return err('邮件服务未配置，请先设置 RESEND_API_KEY', 500, 'EMAIL_SERVICE_NOT_CONFIGURED');
  }

  const code = generateAdminLoginCode();

  try {
    await sendAdminLoginCodeEmail(email, code);
  } catch (error) {
    logger.error('发送管理员登录验证码失败', {
      module: 'auth',
      ip,
      email,
      error: error instanceof Error ? error.message : String(error),
    });
    return err('验证码发送失败，请稍后重试', 500, 'EMAIL_SEND_FAILED');
  }

  const pendingToken = await signEmailLoginCookie(email, code);
  const response = ok({
    email: maskAdminEmail(email),
    expiresIn: EMAIL_LOGIN_EXPIRY_S,
    sent: true,
  });

  response.cookies.set(COOKIE_EMAIL_LOGIN_PENDING, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: EMAIL_LOGIN_EXPIRY_S,
  });

  logger.info('管理员邮箱验证码已发送', { module: 'auth', ip, email });
  return response;
}
