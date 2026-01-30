import { supabase } from '@/lib/supabase';

// 配置静态导出
export const dynamic = 'force-static';
export const revalidate = 3600; // 1小时重新验证

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  try {
    // 获取所有已发布的文章
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, updated_at')
      .eq('published', true);

    // 静态页面
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'daily' },
      { url: '/blog', priority: 0.9, changefreq: 'daily' },
      { url: '/about', priority: 0.8, changefreq: 'monthly' },
      { url: '/contact', priority: 0.7, changefreq: 'monthly' },
      { url: '/archive', priority: 0.7, changefreq: 'weekly' },
      { url: '/links', priority: 0.6, changefreq: 'weekly' },
      { url: '/music', priority: 0.6, changefreq: 'weekly' },
      { url: '/gallery', priority: 0.6, changefreq: 'weekly' },
      { url: '/diary', priority: 0.5, changefreq: 'weekly' },
    ];

    const staticUrls = staticPages.map(
      (page) => `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    ).join('');

    const postUrls = (posts || []).map(
      (post) => `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(post.updated_at || Date.now()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    ).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${postUrls}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
