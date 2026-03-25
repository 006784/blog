import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/practice/problems/[id] — 获取题目详情 */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const isAdmin = !!(await requireAdminSession(request));

  // 支持 id 或 slug 查询
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  let query = supabaseAdmin.from('practice_problems').select('*');
  query = isUuid ? query.eq('id', id) : query.eq('slug', id);
  if (!isAdmin) query = query.eq('is_public', true);

  const { data, error } = await query.single();
  if (error) return NextResponse.json({ error: '题目不存在' }, { status: 404 });

  // 非管理员隐藏答案信息
  if (!isAdmin) {
    delete (data as Record<string, unknown>).answer_hint;
    if (Array.isArray(data.choices)) {
      data.choices = data.choices.map((c: Record<string, unknown>) => ({
        id: c.id, text: c.text,
      }));
    }
  }

  // 获取公开测试用例
  const { data: testCases } = await supabaseAdmin
    .from('practice_test_cases')
    .select(isAdmin ? '*' : 'id,input,expected,sort_order')
    .eq('problem_id', data.id)
    .eq('is_hidden', false)
    .order('sort_order');

  return NextResponse.json({ problem: data, testCases: testCases ?? [] });
}

/** PUT /api/practice/problems/[id] — 更新题目 */
export async function PUT(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  body.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('practice_problems')
    .update(body)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ problem: data });
}

/** DELETE /api/practice/problems/[id] — 删除题目 */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { error } = await supabaseAdmin.from('practice_problems').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
