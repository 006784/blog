import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';
import { buildDiaryPayload, saveDiary } from '@/lib/diary-persistence';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ date: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await ctx.params;
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('diary_date', date)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ diary: data?.[0] ?? null, diaries: data ?? [] });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await ctx.params;
  const body = await req.json();
  const payload = buildDiaryPayload(body, date);
  const diaryId = typeof body.id === 'string' && body.id.trim().length > 0 ? body.id : undefined;

  if (!payload.content) {
    return NextResponse.json({ error: '日记内容不能为空' }, { status: 400 });
  }

  const { data, error } = await saveDiary(payload, diaryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ diary: data });
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { date } = await ctx.params;
  const diaryId = new URL(req.url).searchParams.get('id')?.trim();

  if (!diaryId) {
    return NextResponse.json(
      { error: '请使用日记 ID 删除，避免误删同一天的其他日记' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('diaries')
    .delete()
    .eq('id', diaryId)
    .eq('diary_date', date)
    .select('id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Diary not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
