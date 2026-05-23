import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export interface BriefingLink { title: string; url: string; comment?: string }
export interface Briefing {
  id: string;
  date: string;          // YYYY-MM-DD
  title: string;
  content: string;
  mood?: string | null;
  weather?: string | null;
  links: BriefingLink[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** GET /api/briefings?limit=N&page=P
 *  Public: only is_public=true rows.
 *  Also accepts ?today=1 to return just today's briefing.
 */
export async function GET(request: NextRequest) {
  const today = request.nextUrl.searchParams.get('today');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
  const page  = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);

  if (today) {
    const todayDate = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
      .from('daily_briefings')
      .select('*')
      .eq('date', todayDate)
      .eq('is_public', true)
      .maybeSingle();
    return NextResponse.json({ briefing: data });
  }

  const from = (page - 1) * limit;
  const { data, error, count } = await supabaseAdmin
    .from('daily_briefings')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .order('date', { ascending: false })
    .range(from, from + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ briefings: data ?? [], total: count ?? 0, page, limit });
}

/** POST /api/briefings — admin only, upsert by date */
export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const body = await request.json() as Partial<Briefing>;
  if (!body.date) return NextResponse.json({ error: '缺少 date' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('daily_briefings')
    .upsert({ ...body, updated_at: new Date().toISOString() }, { onConflict: 'date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ briefing: data }, { status: 201 });
}
