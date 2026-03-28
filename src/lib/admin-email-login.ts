import { randomInt } from 'crypto';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { defaultProfile, normalizeProfile } from '@/lib/profile';
import { supabaseAdmin } from '@/lib/supabase';

const PROFILE_KEY = 'profile';
const LOGIN_CODE_TTL_MINUTES = 10;

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function maskAdminEmail(email: string): string {
  const [name = '', domain = ''] = email.split('@');
  if (!domain) return email;

  const visible = name.slice(0, Math.min(2, name.length));
  const maskedName = `${visible}${'*'.repeat(Math.max(2, name.length - visible.length))}`;
  return `${maskedName}@${domain}`;
}

export function generateAdminLoginCode(): string {
  return randomInt(100000, 1000000).toString();
}

function collectConfiguredAdminEmails(): string[] {
  const normalized = new Set<string>();
  const raw = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(',');

  raw
    .split(/[,\n;]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((email) => normalized.add(normalizeAdminEmail(email)));

  return Array.from(normalized);
}

export async function getAdminLoginEmails(): Promise<string[]> {
  const normalized = new Set<string>(collectConfiguredAdminEmails());

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', PROFILE_KEY)
      .maybeSingle();

    if (error) throw error;

    const profile = normalizeProfile(data?.value ?? defaultProfile);
    if (profile.email) {
      normalized.add(normalizeAdminEmail(profile.email));
    }
  } catch (error) {
    logger.error('读取管理员邮箱失败', {
      module: 'auth',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return Array.from(normalized);
}

export async function getAdminLoginEmail(): Promise<string | null> {
  const [primaryEmail] = await getAdminLoginEmails();
  return primaryEmail ?? null;
}

export async function isAllowedAdminEmail(email: string): Promise<boolean> {
  const normalizedEmail = normalizeAdminEmail(email);
  const allowed = await getAdminLoginEmails();
  return allowed.includes(normalizedEmail);
}

export async function sendAdminLoginCodeEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY_MISSING');
  }

  const resend = new Resend(apiKey);
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Lumen';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const from = process.env.RESEND_FROM || 'Lumen <noreply@artchain.icu>';

  await resend.emails.send({
    from,
    to: email,
    subject: `${siteName} 管理员登录验证码`,
    text: `${siteName} 管理员登录验证码：${code}

验证码 ${LOGIN_CODE_TTL_MINUTES} 分钟内有效，仅用于本次登录。
如果这不是你的操作，请忽略本邮件。

登录地址：${siteUrl}/admin/login`,
    html: `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>管理员登录验证码</title>
      </head>
      <body style="margin:0;padding:24px;background:#f8f4ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#2f261f;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:rgba(255,255,255,0.82);border:1px solid rgba(116,80,48,0.12);border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(77,53,31,0.10);">
          <tr>
            <td style="padding:32px 32px 16px;">
              <div style="display:inline-block;padding:10px 14px;border-radius:999px;background:linear-gradient(135deg,#f8d6b2,#f7e8d2);font-size:12px;color:#7a5331;letter-spacing:0.08em;">ADMIN LOGIN</div>
              <h1 style="margin:18px 0 8px;font-size:28px;line-height:1.2;color:#2f261f;">管理员登录验证码</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#7b6653;">你正在登录 ${siteName} 管理后台，输入下面的 6 位验证码即可完成登录。</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 12px;">
              <div style="border-radius:22px;padding:24px;background:linear-gradient(135deg,#fff1df,#fde1d1);border:1px solid rgba(168,104,50,0.16);text-align:center;">
                <div style="font-size:13px;color:#8e6b49;letter-spacing:0.12em;margin-bottom:10px;">VERIFICATION CODE</div>
                <div style="font-size:40px;line-height:1;font-weight:700;letter-spacing:0.24em;color:#473221;">${code}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 32px 32px;">
              <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#6e5a48;">验证码 <strong>${LOGIN_CODE_TTL_MINUTES} 分钟</strong> 内有效，仅用于本次登录。</p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#8e7a69;">如果这不是你的操作，请直接忽略本邮件。登录地址：<a href="${siteUrl}/admin/login" style="color:#8b5b2b;text-decoration:none;">${siteUrl}/admin/login</a></p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
