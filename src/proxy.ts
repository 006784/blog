import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, refreshAccessTokenOnResponse } from '@/lib/auth-edge';
import { supabaseAdmin } from '@/lib/supabase';

// ─── CSP ─────────────────────────────────────────────────────────────────────

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https: http:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com",
  "media-src 'self' blob: https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// ─── 安全响应头 ───────────────────────────────────────────────────────────────

function applySecurityHeaders(res: NextResponse): void {
  res.headers.set('Content-Security-Policy', CSP);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'geolocation=(self), microphone=(self), camera=(self)');
}

// ─── 需要管理员权限的路径 ──────────────────────────────────────────────────────

function isAdminPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

async function hasActiveAdminSession(sessionId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('id')
    .eq('id', sessionId)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return !error && !!data;
}

/** 对搜索引擎屏蔽的路径（后台所有路径） */
function isNoIndexPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/write')
  );
}

// ─── 中间件主体 ───────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 统一去掉尾部斜线再比较（next.config.ts 有 trailingSlash: true）
  const path = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  // ── 登录页最优先放行，避免任何重定向死循环 ──
  if (path === '/admin/login') {
    const res = NextResponse.next();
    applySecurityHeaders(res);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // 生产环境屏蔽调试端点
  if (process.env.NODE_ENV === 'production') {
    const debugRoutes = ['/api/test-logs', '/api/news/test', '/api/news/test-simple'];
    if (debugRoutes.some((r) => pathname.startsWith(r))) {
      const adminKey = request.headers.get('x-admin-key');
      if (adminKey !== process.env.ADMIN_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
  }

  const res = NextResponse.next();
  applySecurityHeaders(res);

  // ── 反收录：admin / dashboard / profile / write 路径 ──
  if (isNoIndexPath(path)) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // ── 不需要保护的路径直接放行 ──
  if (!isAdminPath(path)) return res;

  // ── 验证 admin session ──
  const session = await getSessionFromRequest(request);

  if (!session) {
    // API 路由返回 401；页面跳转到登录页
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: '未登录或会话已过期', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  if (!await hasActiveAdminSession(session.sessionId)) {
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: '未登录或会话已过期', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // ── 滑动刷新 lastActivity（防止空闲超时误踢） ──
  await refreshAccessTokenOnResponse(res, session);

  // ── 透传 sessionId 给下游 API Route ──
  res.headers.set('x-session-id', session.sessionId);
  res.headers.set('x-admin-role', session.role);

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|logo.svg|opengraph-image).*)',
  ],
};
