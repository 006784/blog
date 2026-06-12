/**
 * HTTP 层安全监控
 * 识别扫描器探测 / SQLi-XSS 模式 / 恶意工具 UA，
 * 写入 security_events 表供管理后台「安全」标签页展示。
 *
 * 注意：本项目部署在 Vercel（无 TCP/IP 层可见性），
 * 这里只能也只应该识别 HTTP 应用层信号，无法检测端口扫描等网络层攻击。
 */
import { supabaseAdmin } from './supabase';
import { logger } from './logger';

export type SecurityEventType =
  | 'scanner_probe'
  | 'sqli_xss_pattern'
  | 'malicious_ua'
  | 'unknown_404'
  | 'login_failure'
  | 'ip_banned';

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

interface ClassifyInput {
  path: string;
  search: string;
  userAgent: string;
}

export interface Classification {
  type: SecurityEventType;
  severity: SecuritySeverity;
  detail?: Record<string, unknown>;
}

// 常见扫描器探测的敏感路径特征
const SENSITIVE_PATH_PATTERNS = [
  '.env', '.git', 'wp-admin', 'wp-login', 'wp-content', 'xmlrpc.php',
  'phpmyadmin', '.aws', '.ssh', 'id_rsa', '.htaccess', '.svn', 'vendor/',
  'actuator', 'docker-compose', '/cgi-bin/', '.idea', 'eval-stdin', 'shell.php',
];

// SQLi / XSS 常见 query 模式
const SQLI_XSS_PATTERNS = [
  'union select', 'or 1=1', '<script', 'javascript:', 'onerror=',
  'etc/passwd', 'base64_decode', '%00',
];

// 常见安全扫描工具 UA 特征
const MALICIOUS_UA_PATTERNS = [
  'sqlmap', 'nikto', 'nmap', 'masscan', 'nuclei', 'acunetix',
  'wpscan', 'dirbuster', 'gobuster', 'zgrab',
];

function matchAny(haystack: string, patterns: string[]): string | null {
  const lower = haystack.toLowerCase();
  return patterns.find((p) => lower.includes(p)) ?? null;
}

/** 对一次「全站未匹配路由」的请求进行分类 */
export function classifyRequest({ path, search, userAgent }: ClassifyInput): Classification {
  const fullPath = search ? `${path}?${search}` : path;

  const sensitiveHit = matchAny(fullPath, SENSITIVE_PATH_PATTERNS);
  if (sensitiveHit) {
    return { type: 'scanner_probe', severity: 'high', detail: { matched: sensitiveHit } };
  }

  const sqliHit = matchAny(fullPath, SQLI_XSS_PATTERNS);
  if (sqliHit) {
    return { type: 'sqli_xss_pattern', severity: 'high', detail: { matched: sqliHit } };
  }

  const uaHit = matchAny(userAgent, MALICIOUS_UA_PATTERNS);
  if (uaHit) {
    return { type: 'malicious_ua', severity: 'high', detail: { matched: uaHit } };
  }

  return { type: 'unknown_404', severity: 'low' };
}

export interface SecurityEventInput {
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  ip: string;
  path?: string;
  method?: string;
  userAgent?: string;
  referer?: string;
  detail?: Record<string, unknown>;
}

/** 写入安全事件，fire-and-forget，失败仅记录日志，不影响主流程 */
export async function logSecurityEvent(event: SecurityEventInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('security_events').insert({
      event_type: event.eventType,
      severity: event.severity,
      ip_address: event.ip,
      path: event.path ?? null,
      method: event.method ?? null,
      user_agent: event.userAgent?.substring(0, 500) ?? null,
      referer: event.referer?.substring(0, 500) ?? null,
      detail: event.detail ?? null,
    });
    if (error) throw error;
  } catch (e) {
    logger.error('记录安全事件失败', e);
  }
}
