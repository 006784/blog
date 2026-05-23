/**
 * 外部 API v1 — 文章管理
 *
 * 认证方式：请求头 Authorization: Bearer <BLOG_API_KEY>
 *
 * GET  /api/v1/posts              — 获取文章列表（支持 ?status=published|draft|all&limit=&offset=&search=）
 * POST /api/v1/posts              — 创建新文章
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';
import { createPostRecord, sanitizePostPayload } from '@/lib/post-persistence';
import { generateCoverImage } from '@/lib/cover-generator';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权，请提供有效的 Bearer API Key' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status  = searchParams.get('status') || 'all';
  const limit   = Math.min(Number(searchParams.get('limit') || 20), 100);
  const offset  = Number(searchParams.get('offset') || 0);
  const search  = searchParams.get('search') || '';

  let query = supabaseAdmin
    .from('posts')
    .select('id, title, slug, description, status, category, tags, cover_image, author, reading_time, published_at, created_at, updated_at, is_pinned, collection_id')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') query = query.eq('status', status);
  if (search)           query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ posts: data, total: count ?? data?.length ?? 0, limit, offset });
}

export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权，请提供有效的 Bearer API Key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = sanitizePostPayload(body, 'create');
    const post = await createPostRecord(payload);

    // 如果没有封面且文章已发布，异步生成封面（不阻塞响应）
    if (!post.cover_image && post.status === 'published') {
      generateCoverImage({
        title:       post.title,
        description: post.description ?? undefined,
        tags:        Array.isArray(post.tags) ? post.tags as string[] : [],
        category:    post.category ?? undefined,
      }).then(url => {
        if (url) {
          supabaseAdmin.from('posts').update({ cover_image: url }).eq('id', post.id).then(() => {});
        }
      }).catch(() => {});
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建文章失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
