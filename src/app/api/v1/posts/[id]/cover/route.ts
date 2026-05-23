/**
 * POST /api/v1/posts/:id/cover — 重新生成封面图
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateCoverImage } from '@/lib/cover-generator';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select('id, title, description, tags, category')
    .eq(isUuid ? 'id' : 'slug', id)
    .single();

  if (error || !post) return NextResponse.json({ error: '文章不存在' }, { status: 404 });

  const url = await generateCoverImage({
    title:       post.title,
    description: post.description ?? undefined,
    tags:        Array.isArray(post.tags) ? post.tags as string[] : [],
    category:    post.category ?? undefined,
  });

  if (!url) return NextResponse.json({ error: '封面生成失败，请稍后重试' }, { status: 502 });

  const { error: updateError } = await supabaseAdmin
    .from('posts')
    .update({ cover_image: url })
    .eq('id', post.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ cover_image: url });
}
