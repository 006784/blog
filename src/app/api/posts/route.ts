import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { createPostRecord, sanitizePostPayload } from '@/lib/post-persistence';

export const dynamic = 'force-dynamic';

/** POST /api/posts — 管理员创建文章 */
export async function POST(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const post = await createPostRecord(sanitizePostPayload(body, 'create'));
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建文章失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
