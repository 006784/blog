import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '文章 - Lumen',
  description: '技术、设计、生活与思考的文章归档，持续更新中。',
  alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/blog` },
  openGraph: {
    title: '文章 - Lumen',
    description: '技术、设计、生活与思考的文章归档',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/blog`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
