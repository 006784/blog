import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/test-logs', '/security-demo/', '/sentry-example-page/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
