import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';
import { buildDiaryPayload, saveDiary } from '@/lib/diary-persistence';

export const dynamic = 'force-dynamic';

function getMoodScoreFromEnvironment(value: unknown): number | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const environment = value as Record<string, unknown>;
  const editor = environment.editor;
  if (!editor || typeof editor !== 'object' || Array.isArray(editor)) {
    return undefined;
  }

  return typeof (editor as Record<string, unknown>).mood_score === 'number'
    ? (editor as Record<string, unknown>).mood_score as number
    : undefined;
}

export async function GET(req: NextRequest) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year') || new Date().getFullYear().toString();
  const month = searchParams.get('month');
  const view = searchParams.get('view') || 'timeline';

  let query = supabase
    .from('diaries')
    .select('*')
    .order('diary_date', { ascending: false });

  if (month) {
    const pad = month.padStart(2, '0');
    const monthNumber = Number.parseInt(pad, 10);
    const nextYear = monthNumber === 12 ? (Number.parseInt(year, 10) + 1).toString() : year;
    const nextMonth = (monthNumber === 12 ? 1 : monthNumber + 1).toString().padStart(2, '0');
    query = query
      .gte('diary_date', `${year}-${pad}-01`)
      .lt('diary_date', `${nextYear}-${nextMonth}-01`);
  } else {
    query = query.gte('diary_date', `${year}-01-01`).lte('diary_date', `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const diaries = data || [];

  const calendarDots: Record<string, { mood?: string; hasContent: boolean; mood_score?: number }> = {};
  diaries.forEach((d) => {
    calendarDots[d.diary_date] = {
      mood: d.mood,
      hasContent: Boolean(d.content),
      mood_score: getMoodScoreFromEnvironment(d.environment_data),
    };
  });

  return NextResponse.json({ diaries, calendarDots, view });
}

export async function POST(req: NextRequest) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const date = body.diary_date || new Date().toISOString().split('T')[0];
  const payload = buildDiaryPayload(body, date);
  const diaryId = typeof body.id === 'string' && body.id.trim().length > 0 ? body.id : undefined;

  if (!payload.content) {
    return NextResponse.json({ error: '日记内容不能为空' }, { status: 400 });
  }

  const { data, error } = await saveDiary(payload, diaryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ diary: data });
}
