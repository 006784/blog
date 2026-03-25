import { NextRequest } from 'next/server';
import { verifyAdminPassword } from '@/lib/env';
import { parseBody, ok, err, z } from '@/lib/api';
import { logger } from '@/lib/logger';
import { encodeAdminToken } from '@/lib/admin-token';

// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

const verifySchema = z.object({
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 验证管理员密码
 * POST /api/auth/verify
 */
export async function POST(request: NextRequest) {
  const parsed = await parseBody(request, verifySchema);
  if (parsed instanceof Response) return parsed;
  const { password } = parsed;

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const isValid = verifyAdminPassword(password);

  if (!isValid) {
    logger.warn('管理员登录失败', { module: 'auth', ip, action: 'login_failed' });
    return err('密码错误', 401);
  }

  logger.info('管理员登录成功', { module: 'auth', ip, action: 'login_success' });
  return ok({ token: encodeAdminToken(password) });
}
