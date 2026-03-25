import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const BUCKET = 'uses-icons';

/** 根据 URL 猜扩展名 */
function guessExt(url: string, contentType: string): string {
  if (contentType.includes('svg')) return 'svg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (url.match(/\.(svg|png|webp|gif|jpg|jpeg|ico)(\?|$)/i)) {
    return url.match(/\.(svg|png|webp|gif|jpg|jpeg|ico)/i)![1].toLowerCase();
  }
  return 'png';
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  // 确保 bucket 存在
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error: bucketErr } = await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 512000, // 500KB
    });
    if (bucketErr) return NextResponse.json({ error: `创建 bucket 失败: ${bucketErr.message}` }, { status: 500 });
  }

  // 取所有有图标 URL 的条目
  const { data: items, error: fetchErr } = await supabaseAdmin
    .from('uses_items')
    .select('id, name, icon_url')
    .not('icon_url', 'is', null)
    .not('icon_url', 'like', '%supabase%'); // 跳过已缓存的

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!items?.length) return NextResponse.json({ message: '没有需要处理的图标' });

  const results: { name: string; status: 'ok' | 'skip' | 'fail'; url?: string; reason?: string }[] = [];

  for (const item of items) {
    const originalUrl = item.icon_url as string;
    try {
      // 下载图标
      const res = await fetch(originalUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        results.push({ name: item.name, status: 'fail', reason: `HTTP ${res.status}` });
        continue;
      }

      const contentType = res.headers.get('content-type') ?? '';
      const ext = guessExt(originalUrl, contentType);
      const filePath = `${item.id}.${ext}`;
      const buffer = await res.arrayBuffer();

      // 上传到 Storage（存在则覆盖）
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: contentType || `image/${ext}`,
          upsert: true,
        });

      if (uploadErr) {
        results.push({ name: item.name, status: 'fail', reason: uploadErr.message });
        continue;
      }

      // 获取公开 URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      // 更新数据库
      await supabaseAdmin
        .from('uses_items')
        .update({ icon_url: publicUrl })
        .eq('id', item.id);

      results.push({ name: item.name, status: 'ok', url: publicUrl });
    } catch (e: unknown) {
      results.push({ name: item.name, status: 'fail', reason: String(e) });
    }
  }

  const ok   = results.filter(r => r.status === 'ok').length;
  const fail = results.filter(r => r.status === 'fail').length;

  return NextResponse.json({ message: `完成：成功 ${ok}，失败 ${fail}`, results });
}
