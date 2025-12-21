import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || '我的博客';
  const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '分享技术与生活';

  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('title, slug, excerpt, content, created_at, updated_at, author')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50);

    const rssItems = (posts || []).map((post) => {
      const pubDate = new Date(post.created_at).toUTCString();
      const content = post.content || post.excerpt || '';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || content.substring(0, 200)}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      ${post.author ? `<author>${post.author}</author>` : ''}
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml"/>
    <generator>Next.js Blog</generator>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('RSS generation error:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
