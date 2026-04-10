import { NextRequest } from 'next/server';
import { err } from '@/lib/api';
import { logger } from '@/lib/logger';
import { extractIP } from '@/lib/rate-limit-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = extractIP(request);
  logger.warn('已阻止旧密码登录入口访问', {
    module: 'auth',
    ip,
    action: 'legacy_password_login_blocked',
  });
  return err('密码登录已停用，请使用邮箱验证码或通行密钥登录', 410, 'PASSWORD_LOGIN_DISABLED');
}
