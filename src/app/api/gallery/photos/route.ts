import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** POST /api/gallery/photos — 管理员添加照片 */
export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('photos')
    .insert([body])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photo: data }, { status: 201 });
}
