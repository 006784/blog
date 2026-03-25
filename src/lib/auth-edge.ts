/**
 * Edge-compatible 认证工具（仅用于 middleware）
 * 只依赖 jose（Web Crypto），不引入任何 Node.js API
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';

const RAW_SECRET = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD || 'change-me';
const JWT_SECRET = new TextEncoder().encode(RAW_SECRET);

const ACCESS_EXPIRY_S  = 60 * 60;          // 1 小时
const IDLE_TIMEOUT_MS  = 30 * 60 * 1000;   // 30 分钟

export const COOKIE_ACCESS    = 'admin_access';
export const COOKIE_REFRESH   = 'admin_refresh';
export const COOKIE_TOTP_STEP = 'admin_totp_step';

export type AdminRole = 'editor' | 'admin' | 'super_admin';

export interface AccessPayload extends JWTPayload {
  sessionId: string;
  role: AdminRole;
  lastActivity: number;
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export async function signAccessToken(
  sessionId: string,
  role: AdminRole = 'super_admin'
): Promise<string> {
  return new SignJWT({ sessionId, role, lastActivity: Date.now() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_EXPIRY_S}s`)
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as AccessPayload;
  } catch {
    return null;
  }
}

// ─── 空闲超时 ─────────────────────────────────────────────────────────────────

export function isIdleExpired(lastActivity: number): boolean {
  return Date.now() - lastActivity > IDLE_TIMEOUT_MS;
}

// ─── 从请求中读取 session（middleware 使用）────────────────────────────────────

export async function getSessionFromRequest(
  request: NextRequest
): Promise<AccessPayload | null> {
  const token = request.cookies.get(COOKIE_ACCESS)?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  if (isIdleExpired(payload.lastActivity)) return null;
  return payload;
}

/** 每次请求滑动刷新 lastActivity，防止空闲超时误踢 */
export async function refreshAccessTokenOnResponse(
  res: NextResponse,
  session: AccessPayload
): Promise<void> {
  const refreshed = await signAccessToken(session.sessionId, session.role);
  res.cookies.set(COOKIE_ACCESS, refreshed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ACCESS_EXPIRY_S,
  });
}
