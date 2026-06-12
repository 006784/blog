import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { classifyRequest, logSecurityEvent } from '@/lib/security-monitor';
import { extractIP } from '@/lib/rate-limit-auth';

/**
 * 根级 catch-all：仅在「全站找不到任何匹配路由」时命中
 * （已存在的页面/动态路由优先级更高，不会经过这里）。
 * 用于记录扫描器对不存在路径的探测，记录后渲染标准 404。
 */
export default async function CatchAllNotFound({
  params,
  searchParams,
}: {
  params: Promise<{ rest: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { rest } = await params;
  const sp = await searchParams;
  const h = await headers();

  const path = '/' + rest.join('/');
  const search = Object.entries(sp)
    .flatMap(([key, value]) => {
      if (value === undefined) return [];
      return (Array.isArray(value) ? value : [value]).map((v) => `${key}=${v}`);
    })
    .join('&');
  const userAgent = h.get('user-agent') ?? '';

  const classification = classifyRequest({ path, search, userAgent });
  void logSecurityEvent({
    eventType: classification.type,
    severity: classification.severity,
    ip: extractIP({ headers: h } as unknown as Request),
    path,
    userAgent,
    referer: h.get('referer') ?? undefined,
    detail: classification.detail,
  });

  notFound();
}
