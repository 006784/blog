import { NextRequest } from 'next/server';
import { generateSecret, generateURI } from 'otplib';
import QRCode from 'qrcode';
import { ok, err } from '@/lib/api';
import { requireAdminSession, signTotpPendingCookie, COOKIE_TOTP_PENDING } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Lumen';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';

/**
 * GET /api/auth/totp/setup
 * 生成 TOTP 密钥 + QR code，将 pending secret 存入签名 cookie（10 分钟有效）
 */
export async function GET(request: NextRequest) {
  const session = await requireAdminSession(request, 'super_admin');
  if (!session) return err('未授权', 401);

  const secret = generateSecret();
  const otpauthUrl = await generateURI({ secret, label: ADMIN_EMAIL, issuer: SITE_NAME });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  // 用签名 JWT cookie 存储 pending secret（10 分钟），无需数据库
  const pendingToken = await signTotpPendingCookie(secret);

  const res = ok({ qrDataUrl, secret, otpauthUrl });
  res.cookies.set(COOKIE_TOTP_PENDING, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 10 * 60,
  });
  return res;
}

/**
 * DELETE /api/auth/totp/setup
 * 关闭 TOTP
 */
export async function DELETE(request: NextRequest) {
  const session = await requireAdminSession(request, 'super_admin');
  if (!session) return err('未授权', 401);

  await supabaseAdmin.from('site_settings').delete().eq('key', 'admin_totp');

  const res = ok({ disabled: true });
  res.cookies.delete(COOKIE_TOTP_PENDING);
  return res;
}
