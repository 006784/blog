import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * 验证请求头中的 Bearer API Key
 * 用于外部工具（Claude Code 等）无 cookie 调用管理 API
 */
export function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const incomingKey = authHeader.slice(7).trim();
  const validKey = process.env.BLOG_API_KEY;
  if (!validKey || incomingKey.length === 0) return false;

  // 固定时间比较，防止时序攻击
  try {
    const a = Buffer.from(incomingKey);
    const b = Buffer.from(validKey);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
