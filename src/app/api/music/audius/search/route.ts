import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';
import { searchAudiusTracks } from '@/lib/audius';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await searchAudiusTracks(query, 8);
    return NextResponse.json({ tracks });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Audius 搜索失败';

    return NextResponse.json(
      { error: message.includes('401') ? 'Audius API 鉴权失败，请检查服务端配置。' : '搜索失败，请稍后再试。' },
      { status: 500 }
    );
  }
}
