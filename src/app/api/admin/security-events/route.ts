import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { getBannedIPs } from '@/lib/rate-limit-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface SecurityEventRow {
  id: string;
  event_type: string;
  severity: string;
  ip_address: string;
  path: string | null;
  method: string | null;
  user_agent: string | null;
  referer: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
}

// GET - 安全事件概览（仅管理员）
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return err('未登录或会话已过期', 401, 'UNAUTHORIZED');
    }

    const days = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('days') || '7', 10), 1), 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) throw error;

    const events = (data ?? []) as SecurityEventRow[];
    const flagged = events.filter((e) => e.severity !== 'low');

    const byType: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};
    const pathCounts: Record<string, number> = {};
    let todayFlagged = 0;
    let today404 = 0;

    for (const e of events) {
      byType[e.event_type] = (byType[e.event_type] || 0) + 1;
      if (new Date(e.created_at) >= todayStart) {
        today404++;
        if (e.severity !== 'low') todayFlagged++;
      }
    }

    for (const e of flagged) {
      ipCounts[e.ip_address] = (ipCounts[e.ip_address] || 0) + 1;
      if (e.path) pathCounts[e.path] = (pathCounts[e.path] || 0) + 1;
    }

    const topIPs = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    return ok({
      flaggedEvents: flagged.slice(0, 50),
      summary: {
        byType,
        topIPs,
        topPaths,
        todayFlagged,
        weekFlagged: flagged.length,
        today404,
        week404: events.length,
      },
      bannedIPs: getBannedIPs(),
    });
  } catch (error) {
    logger.error('获取安全事件失败', error);
    return err('获取安全事件失败');
  }
}
