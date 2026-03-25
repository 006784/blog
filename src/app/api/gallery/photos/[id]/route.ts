import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/gallery/photos/[id] — 更新照片 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('photos')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ photo: data });
}

/** DELETE /api/gallery/photos/[id] — 删除照片 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from('photos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
