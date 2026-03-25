import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Lumen';
  const siteDesc = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '一个安静的角落';

  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, title, description, content, published_at, updated_at, cover_image, category')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(20);

    const items = (posts || []).map((post) => {
      const pubDate = new Date(post.published_at || Date.now()).toUTCString();
      const link = `${baseUrl}/blog/${post.slug}`;
      const desc = post.description
        ? escapeXml(post.description)
        : escapeXml((post.content || '').replace(/<[^>]+>/g, '').slice(0, 200) + '…');

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      ${post.cover_image ? `<enclosure url="${post.cover_image}" type="image/jpeg" length="0"/>` : ''}
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(siteDesc)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.svg</url>
      <title>${escapeXml(siteName)}</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('RSS generation error:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
