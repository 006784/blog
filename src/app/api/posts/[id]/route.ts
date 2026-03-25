import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/posts/[id] — 更新文章（含置顶操作） */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json();

  // 如果是置顶操作，先清除其他文章的置顶状态
  if (body.is_pinned === true) {
    await supabaseAdmin
      .from('posts')
      .update({ is_pinned: false })
      .eq('is_pinned', true)
      .neq('id', id);
  }

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

/** DELETE /api/posts/[id] — 删除文章 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
