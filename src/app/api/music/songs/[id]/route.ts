import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/music/songs/[id] — 更新歌曲（管理员）或切换收藏（任意） */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await request.json();

  // 仅收藏切换允许非管理员（保留给未来扩展，目前也需登录）
  const isAdminOp = Object.keys(body).some(k => k !== 'is_favorite');
  if (isAdminOp && !await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('songs')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ song: data });
}

/** DELETE /api/music/songs/[id] — 管理员删除歌曲 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from('songs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
