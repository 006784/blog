import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '友情链接',
  description: '与有趣灵魂的连接——收录志同道合的博主与站点。',
  alternates: { canonical: `${SITE_URL}/links` },
  openGraph: {
    title: '友情链接',
    description: '与有趣灵魂的连接——收录志同道合的博主与站点。',
    url: `${SITE_URL}/links`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function LinksLayout({ children }: { children: ReactNode }) {
  return children;
}
