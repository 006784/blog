import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_TIMELINE_EVENTS } from '@/lib/timeline-defaults';

export const dynamic = 'force-dynamic';

function keyOf(event: { title: string; date: string }) {
  return `${event.date}::${event.title}`;
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('timeline_events')
    .select('title, date');

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingKeys = new Set((existing || []).map((event) => keyOf(event)));
  const missing = DEFAULT_TIMELINE_EVENTS.filter((event) => !existingKeys.has(keyOf(event)));

  if (missing.length === 0) {
    const { data, error } = await supabaseAdmin
      .from('timeline_events')
      .select('*')
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data, inserted: 0 });
  }

  const { data, error } = await supabaseAdmin
    .from('timeline_events')
    .insert(missing)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: allEvents, error: allEventsError } = await supabaseAdmin
    .from('timeline_events')
    .select('*')
    .order('date', { ascending: false });

  if (allEventsError) return NextResponse.json({ error: allEventsError.message }, { status: 500 });

  return NextResponse.json({ events: allEvents, inserted: data?.length ?? missing.length }, { status: 201 });
}
