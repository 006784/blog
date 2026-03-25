import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** GET /api/collections — 公开获取所有合集 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collections: data ?? [] });
}

/** POST /api/collections — 管理员创建合集 */
export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert([body])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: data }, { status: 201 });
}
