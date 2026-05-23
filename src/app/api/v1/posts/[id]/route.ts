/**
 * 外部 API v1 — 单篇文章操作
 *
 * GET    /api/v1/posts/:id   — 获取文章详情（id 或 slug）
 * PATCH  /api/v1/posts/:id   — 更新文章
 * DELETE /api/v1/posts/:id   — 删除文章
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizePostPayload, updatePostRecord, clearOtherPinnedPosts } from '@/lib/post-persistence';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', id)
    .single();

  if (error || !data) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  return NextResponse.json({ post: data });
}

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
    const message = error instanceof Error ? error.message : '更新失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);

  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq(isUuid ? 'id' : 'slug', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
