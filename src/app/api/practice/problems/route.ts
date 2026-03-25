import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** GET /api/practice/problems — 公开列表，管理员可看全部 */
export async function GET(request: NextRequest) {
  const isAdmin = !!(await requireAdminSession(request));
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');
  const difficulty = searchParams.get('difficulty');
  const tag = searchParams.get('tag');
  const q = searchParams.get('q');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'));
  const from = (page - 1) * limit;

  let query = supabaseAdmin
    .from('practice_problems')
    .select('id,title,slug,difficulty,type,tags,is_public,submission_count,accept_count,created_at,sort_order', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (!isAdmin) query = query.eq('is_public', true);
  if (type) query = query.eq('type', type);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (tag) query = query.contains('tags', [tag]);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ problems: data ?? [], total: count ?? 0, page, limit });
}

/** POST /api/practice/problems — 管理员创建题目 */
export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const body = await request.json();
  // 自动生成 slug
  if (!body.slug && body.title) {
    body.slug = body.title
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '')
      .substring(0, 80) + '-' + Date.now().toString(36);
  }
  const { data, error } = await supabaseAdmin
    .from('practice_problems')
    .insert([{ ...body, submission_count: 0, accept_count: 0 }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ problem: data }, { status: 201 });
}
