import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/practice/problems/[id]/test-cases — 管理员获取全部测试用例 */
export async function GET(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const { data, error } = await supabaseAdmin
    .from('practice_test_cases')
    .select('*')
    .eq('problem_id', id)
    .order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testCases: data ?? [] });
}

/** POST /api/practice/problems/[id]/test-cases — 添加测试用例 */
export async function POST(request: NextRequest, ctx: Ctx) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from('practice_test_cases')
    .insert([{ ...body, problem_id: id }])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testCase: data }, { status: 201 });
}
