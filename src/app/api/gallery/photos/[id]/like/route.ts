import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// POST /api/gallery/photos/[id]/like —— 匿名点赞，原子自增（防重复由前端 localStorage 控制）
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: '缺少照片 ID' }, { status: 400 });

  const { data, error } = await supabaseAdmin.rpc('increment_photo_likes', { photo_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ likes: data });
}
