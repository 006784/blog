import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ date: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await ctx.params;
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('diary_date', date)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ diary: data });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await ctx.params;
  const body = await req.json();

  const payload = {
    ...body,
    diary_date: date,
    word_count: (body.content || '').length,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('diaries')
    .upsert(payload, { onConflict: 'diary_date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ diary: data });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await ctx.params;
  const { error } = await supabase.from('diaries').delete().eq('diary_date', date);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
