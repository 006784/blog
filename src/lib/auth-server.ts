/**
 * 服务端认证核心库（仅用于 API Route，不可在 middleware 中导入）
 * 包含：JWT 完整操作 + httpOnly Cookie 设置 + DB Session 管理
 */
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

// 重新导出 Edge 兼容的类型和函数，API Route 只需导入此文件
export {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  COOKIE_TOTP_STEP,
  type AdminRole,
  type AccessPayload,
  verifyAccessToken,
  getSessionFromRequest,
  isIdleExpired,
  refreshAccessTokenOnResponse,
} from './auth-edge';

import {
  type AdminRole,
  type AccessPayload,
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  COOKIE_TOTP_STEP,
} from './auth-edge';

const RAW_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-me';
const JWT_SECRET = new TextEncoder().encode(RAW_SECRET);

const ACCESS_EXPIRY_S  = 60 * 60;
const REFRESH_EXPIRY_S = 7 * 24 * 60 * 60;
const EMAIL_LOGIN_EXPIRY_S = 10 * 60;
const PASSKEY_CHALLENGE_EXPIRY_S = 10 * 60;

function cookieOpts(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

// ─── JWT (API Route 专用) ──────────────────────────────────────────────────────

export async function signRefreshToken(sessionId: string): Promise<string> {
  return new SignJWT({ sessionId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_EXPIRY_S}s`)
    .sign(JWT_SECRET);
}

// ─── TOTP 激活流程：用签名 JWT Cookie 传递 pending secret ─────────────────────

const COOKIE_TOTP_PENDING = 'admin_totp_pending';
const COOKIE_EMAIL_LOGIN_PENDING = 'admin_email_login_pending';
const COOKIE_PASSKEY_REGISTRATION_PENDING = 'admin_passkey_registration_pending';
const COOKIE_PASSKEY_AUTH_PENDING = 'admin_passkey_auth_pending';

export async function signTotpPendingCookie(secret: string): Promise<string> {
  return new SignJWT({ totpSecret: secret })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(JWT_SECRET);
}

export async function verifyTotpPendingCookie(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.totpSecret as string) ?? null;
  } catch {
    return null;
  }
}

export { COOKIE_TOTP_PENDING };

export async function signEmailLoginCookie(email: string, code: string): Promise<string> {
  return new SignJWT({
    type: 'email_login',
    email,
    codeHash: hashValue(code),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EMAIL_LOGIN_EXPIRY_S}s`)
    .sign(JWT_SECRET);
}

export async function verifyEmailLoginCookie(
  token: string
): Promise<{ email: string; codeHash: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'email_login') return null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const codeHash = typeof payload.codeHash === 'string' ? payload.codeHash : null;
    if (!email || !codeHash) return null;
    return { email, codeHash };
  } catch {
    return null;
  }
}

export function isEmailLoginCodeValid(inputCode: string, codeHash: string): boolean {
  const incoming = Buffer.from(hashValue(inputCode));
  const stored = Buffer.from(codeHash);
  if (incoming.length !== stored.length) return false;
  return crypto.timingSafeEqual(incoming, stored);
}

export { COOKIE_EMAIL_LOGIN_PENDING, EMAIL_LOGIN_EXPIRY_S };

type PasskeyChallengeKind = 'registration' | 'authentication';

export async function signPasskeyChallengeCookie(
  kind: PasskeyChallengeKind,
  challenge: string
): Promise<string> {
  return new SignJWT({
    type: 'passkey_challenge',
    kind,
    challenge,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PASSKEY_CHALLENGE_EXPIRY_S}s`)
    .sign(JWT_SECRET);
}

export async function verifyPasskeyChallengeCookie(
  token: string,
  expectedKind: PasskeyChallengeKind
): Promise<{ challenge: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'passkey_challenge' || payload.kind !== expectedKind) return null;
    const challenge = typeof payload.challenge === 'string' ? payload.challenge : null;
    if (!challenge) return null;
    return { challenge };
  } catch {
    return null;
  }
}

export {
  COOKIE_PASSKEY_REGISTRATION_PENDING,
  COOKIE_PASSKEY_AUTH_PENDING,
  PASSKEY_CHALLENGE_EXPIRY_S,
};

export async function signTotpStepToken(ip: string): Promise<string> {
  return new SignJWT({ step: 'totp', ip })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(JWT_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<{ sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'refresh') return null;
    return { sessionId: payload.sessionId as string };
  } catch {
    return null;
  }
}

export async function verifyTotpStepToken(token: string): Promise<{ ip: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.step !== 'totp') return null;
    return { ip: payload.ip as string };
  } catch {
    return null;
  }
}

// ─── Cookie 设置 ──────────────────────────────────────────────────────────────

import { signAccessToken } from './auth-edge';

export async function setAuthCookies(
  res: NextResponse,
  sessionId: string,
  role: AdminRole = 'super_admin'
): Promise<void> {
  const accessToken  = await signAccessToken(sessionId, role);
  const refreshToken = await signRefreshToken(sessionId);
  res.cookies.set(COOKIE_ACCESS,  accessToken,  cookieOpts(ACCESS_EXPIRY_S));
  res.cookies.set(COOKIE_REFRESH, refreshToken, cookieOpts(REFRESH_EXPIRY_S));
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.delete(COOKIE_ACCESS);
  res.cookies.delete(COOKIE_REFRESH);
  res.cookies.delete(COOKIE_TOTP_STEP);
  res.cookies.delete(COOKIE_EMAIL_LOGIN_PENDING);
  res.cookies.delete(COOKIE_PASSKEY_REGISTRATION_PENDING);
  res.cookies.delete(COOKIE_PASSKEY_AUTH_PENDING);
}

// ─── 角色鉴权（API Route 中使用）─────────────────────────────────────────────

const ROLE_LEVEL: Record<AdminRole, number> = {
  editor: 1,
  admin: 2,
  super_admin: 3,
};

export async function requireAdminSession(
  request: NextRequest,
  minRole: AdminRole = 'editor'
): Promise<AccessPayload | null> {
  const token = request.cookies.get(COOKIE_ACCESS)?.value;
  if (!token) return null;

  const { verifyAccessToken, isIdleExpired } = await import('./auth-edge');
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  if (isIdleExpired(payload.lastActivity)) return null;
  if (ROLE_LEVEL[payload.role] < ROLE_LEVEL[minRole]) return null;
  return payload;
}

// ─── DB Session 管理 ──────────────────────────────────────────────────────────

export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value + RAW_SECRET).digest('hex');
}

export async function createDbSession(
  sessionId: string,
  ip: string,
  userAgent: string
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_S * 1000).toISOString();
  const { error } = await supabaseAdmin.from('admin_sessions').insert({
    id: sessionId,
    session_token: hashValue(sessionId),
    ip_address: ip,
    user_agent: userAgent,
    expires_at: expiresAt,
  });
  return !error;
}

export async function validateDbSession(sessionId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('expires_at')
    .eq('id', sessionId)
    .single();
  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  await supabaseAdmin
    .from('admin_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', sessionId);
}

export async function deleteDbSession(sessionId: string): Promise<void> {
  await supabaseAdmin.from('admin_sessions').delete().eq('id', sessionId);
}

export async function deleteAllDbSessions(): Promise<void> {
  await supabaseAdmin
    .from('admin_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function listDbSessions() {
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, ip_address, user_agent, last_activity, created_at, expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('last_activity', { ascending: false });
  return data ?? [];
}
