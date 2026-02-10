import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';


// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  const searchTerm = `%${query}%`;
  const results: Array<{
    type: 'blog' | 'music' | 'diary' | 'gallery';
    id: string;
    title: string;
    description?: string;
    url: string;
    date?: string;
  }> = [];

  try {
    // 搜索博客文章
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, excerpt, slug, created_at')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},excerpt.ilike.${searchTerm}`)
      .limit(5);

    if (posts) {
      posts.forEach((post) => {
        results.push({
          type: 'blog',
          id: post.id,
          title: post.title,
          description: post.excerpt || undefined,
          url: `/blog/${post.slug}`,
          date: post.created_at,
        });
      });
    }

    // 搜索音乐
    const { data: songs } = await supabase
      .from('songs')
      .select('id, title, artist, album')
      .or(`title.ilike.${searchTerm},artist.ilike.${searchTerm},album.ilike.${searchTerm}`)
      .limit(5);

    if (songs) {
      songs.forEach((song) => {
        results.push({
          type: 'music',
          id: song.id,
          title: song.title,
          description: `${song.artist}${song.album ? ` - ${song.album}` : ''}`,
          url: '/music',
        });
      });
    }

    // 搜索日记
    const { data: diaries } = await supabase
      .from('diaries')
      .select('id, title, content, created_at')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .limit(5);

    if (diaries) {
      diaries.forEach((diary) => {
        results.push({
          type: 'diary',
          id: diary.id,
          title: diary.title || '无标题日记',
          description: diary.content?.substring(0, 100) || undefined,
          url: '/diary',
          date: diary.created_at,
        });
      });
    }

    // 搜索相册
    const { data: albums } = await supabase
      .from('albums')
      .select('id, name, description')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .limit(5);

    if (albums) {
      albums.forEach((album) => {
        results.push({
          type: 'gallery',
          id: album.id,
          title: album.name,
          description: album.description || undefined,
          url: '/gallery',
        });
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
  }
}
