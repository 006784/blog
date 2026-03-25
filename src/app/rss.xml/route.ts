import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1h cache

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.artchain.icu';
const SITE_TITLE = process.env.NEXT_PUBLIC_SITE_NAME ?? '词元博客';
const SITE_DESC = process.env.NEXT_PUBLIC_SITE_DESC ?? '记录生活、技术与思考';

function escape(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('title, slug, description, published_at, updated_at, category, tags, author')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (posts ?? []).map(post => {
    const url = `${SITE_URL}/blog/${post.slug}`;
    const date = new Date(post.published_at ?? post.updated_at).toUTCString();
    const categories = (post.tags ?? [])
      .map((t: string) => `<category>${escape(t)}</category>`)
      .join('');
    return `
    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(post.description ?? '')}</description>
      <pubDate>${date}</pubDate>
      <author>${escape(post.author ?? SITE_TITLE)}</author>
      ${categories}
    </item>`;
  }).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escape(SITE_DESC)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
