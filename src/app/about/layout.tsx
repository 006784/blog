import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '关于我 - Lumen',
  description: '认识博主，了解Lumen的故事与理念。',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: '关于我 - Lumen',
    description: '认识博主，了解Lumen的故事与理念。',
    url: `${SITE_URL}/about`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'profile',
  },
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
