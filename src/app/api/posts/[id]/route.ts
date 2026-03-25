import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { clearOtherPinnedPosts, sanitizePostPayload, updatePostRecord } from '@/lib/post-persistence';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/posts/[id] — 更新文章（含置顶操作） */
export async function PATCH(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const payload = sanitizePostPayload(body, 'update');

    if (payload.is_pinned === true) {
      await clearOtherPinnedPosts(id);
    }

    const post = await updatePostRecord(id, payload);
    return NextResponse.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : '更新文章失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
