import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Lumen';
  const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '在文字中拾起生活的微光';

  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('title, slug, description, content, category, tags, author, published_at, updated_at, cover_image')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    const rssItems = (posts || []).map((post) => {
      const pubDate = new Date(post.published_at || post.updated_at).toUTCString();
      const description = post.description || (post.content ? post.content.slice(0, 200) + '…' : '');
      const categories = Array.isArray(post.tags)
        ? post.tags.map((t: string) => `<category><![CDATA[${t}]]></category>`).join('\n      ')
        : '';

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${post.content || description}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      ${post.author ? `<author><![CDATA[${post.author}]]></author>` : ''}
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ''}
      ${categories}
      ${post.cover_image ? `<enclosure url="${post.cover_image}" type="image/jpeg" />` : ''}
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Next.js</generator>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    logger.error('RSS generation error:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
