/**
 * 登录端点专用四层限速器 + IP 封禁
 * - 5 次 / 5 分钟 (per IP)
 * - 15 次 / 1 小时 (per IP)
 * - 50 次 / 24 小时 (per IP)
 * - 10 次连续失败 → IP 封禁 24 小时 + 邮件告警
 */
import { RateLimiterMemory, type RateLimiterRes } from 'rate-limiter-flexible';
import { logger } from './logger';

// ─── 速率限制器实例 ────────────────────────────────────────────────────────────

// 开发环境放宽限制，避免本地调试时反复触发封禁
const isDev = process.env.NODE_ENV !== 'production';

const limiter5m  = new RateLimiterMemory({ keyPrefix: 'auth_5m',  points: isDev ? 100 : 5,  duration: 5 * 60 });
const limiter1h  = new RateLimiterMemory({ keyPrefix: 'auth_1h',  points: isDev ? 500 : 15, duration: 60 * 60 });
const limiter24h = new RateLimiterMemory({ keyPrefix: 'auth_24h', points: isDev ? 1000 : 50, duration: 24 * 60 * 60 });

/** 失败计数器，生产环境 10 次 / 24h 触发封禁，开发环境不封禁 */
const failureCounter = new RateLimiterMemory({ keyPrefix: 'auth_fail', points: isDev ? 9999 : 10, duration: 24 * 60 * 60 });

/** IP 封禁表（内存存储，重启后重置） */
const bannedIPs = new Map<string, number>(); // ip → banUntilMs

const BAN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 小时

// ─── IP 提取 ──────────────────────────────────────────────────────────────────

export function extractIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return (xff?.split(',')[0] ?? realIp ?? '127.0.0.1').trim();
}

// ─── 封禁检查 ──────────────────────────────────────────────────────────────────

export function isIPBanned(ip: string): boolean {
  const until = bannedIPs.get(ip);
  if (!until) return false;
  if (Date.now() > until) {
    bannedIPs.delete(ip);
    return false;
  }
  return true;
}

export function banIP(ip: string): void {
  bannedIPs.set(ip, Date.now() + BAN_DURATION_MS);
}

// ─── 主检查函数 ───────────────────────────────────────────────────────────────

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: string; retryAfterSeconds: number };

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  if (isIPBanned(ip)) {
    return { ok: false, reason: '该 IP 已被封禁，请 24 小时后再试', retryAfterSeconds: 86400 };
  }

  try {
    await Promise.all([
      limiter5m.consume(ip),
      limiter1h.consume(ip),
      limiter24h.consume(ip),
    ]);
    return { ok: true };
  } catch (e) {
    const res = e as RateLimiterRes;
    const secs = Math.ceil(res.msBeforeNext / 1000);
    return { ok: false, reason: '登录尝试过于频繁，请稍后再试', retryAfterSeconds: secs };
  }
}

// ─── 失败记录 ──────────────────────────────────────────────────────────────────

export async function recordLoginFailure(ip: string): Promise<void> {
  try {
    await failureCounter.consume(ip);
  } catch {
    // 超过 10 次 → 封禁
    banIP(ip);
    logger.warn('IP 封禁（登录失败 10 次）', { ip, module: 'auth' });
    await sendBanAlert(ip);
  }
}

export async function resetLoginFailures(ip: string): Promise<void> {
  try {
    await failureCounter.delete(ip);
  } catch {
    // ignore
  }
}

// ─── 封禁告警邮件 ─────────────────────────────────────────────────────────────

async function sendBanAlert(ip: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAILS?.split(/[,\n;]+/).map((value) => value.trim()).find(Boolean)
    || process.env.ADMIN_EMAIL;
  if (!apiKey || !adminEmail) return;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || `security@${process.env.NEXT_PUBLIC_SITE_URL?.replace(/https?:\/\//, '') || 'example.com'}`,
      to: adminEmail,
      subject: '【安全告警】博客管理后台疑似遭受暴力破解',
      html: `
        <h2>安全告警</h2>
        <p>IP <strong>${ip}</strong> 在 24 小时内登录失败超过 10 次，已自动封禁 24 小时。</p>
        <p>时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
        <p>如不是您本人操作，请检查服务器安全配置。</p>
      `,
    });
  } catch (err) {
    logger.error('发送封禁告警邮件失败', { error: err, module: 'auth' });
  }
}
