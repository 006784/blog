import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/gallery/albums/[id] — 更新相册 */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('albums')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ album: data });
}

/** DELETE /api/gallery/albums/[id] — 删除相册 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from('albums').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
