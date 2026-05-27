import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/briefing
 * Vercel Cron 调用此端点自动生成每日简报（早 7 / 中 12 / 晚 6 CST）。
 * 每次调用会覆盖当天已有简报（upsert by date）。
 * 必须携带 Authorization: Bearer $CRON_SECRET。
 */
export async function GET(request: NextRequest) {
  // 验证 cron secret（Vercel 自动注入）
  const auth = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 复用 /api/briefings/generate 的逻辑，直接内部调用
    const origin = process.env.NEXT_PUBLIC_SITE_URL
      ?? process.env.VERCEL_URL
      ?? 'http://localhost:3000';

    const base = origin.startsWith('http') ? origin : `https://${origin}`;

    const res = await fetch(`${base}/api/briefings/generate`, {
      method: 'POST',
      headers: {
        // 使用 service-role 伪造管理员身份（cron 没有 cookie）
        'x-cron-secret': secret ?? '',
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json() as { briefing?: { title?: string }; error?: string; newsCount?: number };

    if (!res.ok) {
      console.error('[cron/briefing] generate failed:', data.error);
      return NextResponse.json({ ok: false, error: data.error }, { status: 500 });
    }

    console.warn('[cron/briefing] generated:', data.briefing?.title, `(${data.newsCount} news items)`);
    return NextResponse.json({ ok: true, title: data.briefing?.title, newsCount: data.newsCount });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[cron/briefing] error:', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
