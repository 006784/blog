import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export type SearchResultType = 'post' | 'diary' | 'music' | 'gallery' | 'page';

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  type: SearchResultType;
  url: string;
  category?: string;
  date?: string;
}

// 静态页面本地搜索
const STATIC_PAGES: SearchResult[] = [
  { id: 'about',     title: '关于我',   excerpt: '了解博主的故事与理念',   type: 'page', url: '/about' },
  { id: 'archive',   title: '归档',     excerpt: '按时间浏览所有文章',     type: 'page', url: '/archive' },
  { id: 'gallery',   title: '相册',     excerpt: '照片与记忆',             type: 'page', url: '/gallery' },
  { id: 'music',     title: '歌单',     excerpt: '音乐与心情',             type: 'page', url: '/music' },
  { id: 'links',     title: '友链',     excerpt: '友情链接',               type: 'page', url: '/links' },
  { id: 'guestbook', title: '留言板',   excerpt: '留下你的足迹',           type: 'page', url: '/guestbook' },
  { id: 'resources', title: '资源',     excerpt: '资源下载与分享',         type: 'page', url: '/resources' },
  { id: 'contact',   title: '联系',     excerpt: '与我联系',               type: 'page', url: '/contact' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type') || 'all';

  // 空查询返回静态页面供首屏展示
  if (!q) {
    return NextResponse.json({ results: STATIC_PAGES, query: '' });
  }

  const results: SearchResult[] = [];
  const kw = `%${q}%`;

  try {
    // 搜索已发布文章
    if (type === 'all' || type === 'post') {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, slug, description, category, published_at')
        .eq('status', 'published')
        .or(`title.ilike.${kw},description.ilike.${kw}`)
        .limit(8);

      (posts || []).forEach((post) => {
        results.push({
          id: post.id,
          title: post.title,
          excerpt: post.description || '',
          type: 'post',
          url: `/blog/${post.slug}`,
          category: post.category,
          date: post.published_at,
        });
      });
    }

    // 搜索公开日记
    if (type === 'all' || type === 'diary') {
      const { data: diaries } = await supabase
        .from('diaries')
        .select('id, title, content, diary_date')
        .eq('is_public', true)
        .or(`title.ilike.${kw},content.ilike.${kw}`)
        .limit(4);

      (diaries || []).forEach((diary) => {
        results.push({
          id: diary.id,
          title: diary.title || `日记 · ${diary.diary_date}`,
          excerpt: diary.content ? diary.content.slice(0, 80) + '…' : '',
          type: 'diary',
          url: `/diary`,
          date: diary.diary_date,
        });
      });
    }

    // 搜索歌曲
    if (type === 'all' || type === 'music') {
      const { data: songs } = await supabase
        .from('songs')
        .select('id, title, artist, album')
        .or(`title.ilike.${kw},artist.ilike.${kw}`)
        .limit(4);

      (songs || []).forEach((song) => {
        results.push({
          id: song.id,
          title: song.title,
          excerpt: `${song.artist}${song.album ? ` · ${song.album}` : ''}`,
          type: 'music',
          url: '/music',
        });
      });
    }

    // 静态页面本地匹配
    if (type === 'all' || type === 'page') {
      const matched = STATIC_PAGES.filter(
        (p) => p.title.includes(q) || p.excerpt.includes(q)
      );
      results.push(...matched);
    }

    return NextResponse.json({ results, query: q });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [], query: q }, { status: 500 });
  }
}
