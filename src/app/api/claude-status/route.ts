import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface ClaudeStatus {
  id: string;
  date: string;          // YYYY-MM-DD
  mood: string;          // 一句话心情
  thoughts: string;      // 对主人 / 工作的看法
  tasks: string[];       // 今天完成的任务
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** GET /api/claude-status?today=1 返回今天；否则返回最近一条；?limit=N&page=P 列表 */
export async function GET(request: NextRequest) {
  const today = request.nextUrl.searchParams.get('today');
  const list = request.nextUrl.searchParams.get('list');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);

  if (list) {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabaseAdmin
      .from('claude_status')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('date', { ascending: false })
      .range(from, from + limit - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [], total: count ?? 0, page, limit });
  }

  // today=1 取今天；否则取最近一条（首页用，避免当天还没生成时空白）
  let query = supabaseAdmin
    .from('claude_status')
    .select('*')
    .eq('is_public', true);

  if (today) {
    query = query.eq('date', new Date().toISOString().slice(0, 10));
  }

  const { data } = await query.order('date', { ascending: false }).limit(1).maybeSingle();
  return NextResponse.json({ status: data });
}

/** POST /api/claude-status — admin only, upsert by date */
export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const body = await request.json() as Partial<ClaudeStatus>;
  if (!body.date) return NextResponse.json({ error: '缺少 date' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('claude_status')
    .upsert({ ...body, updated_at: new Date().toISOString() }, { onConflict: 'date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: data }, { status: 201 });
}
