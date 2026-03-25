import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '精选合集',
  description: '将相关文章与资源整理成主题合集，方便系统阅读。',
  alternates: { canonical: `${SITE_URL}/collections` },
  openGraph: {
    title: '精选合集',
    description: '将相关文章与资源整理成主题合集，方便系统阅读。',
    url: `${SITE_URL}/collections`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function CollectionsLayout({ children }: { children: ReactNode }) {
  return children;
}
