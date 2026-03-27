import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteConfig, siteUrls } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `文章 - ${siteConfig.name}`,
  description: '技术、设计、生活与思考的文章归档，持续更新中。',
  alternates: { canonical: siteUrls.blog },
  openGraph: {
    title: `文章 - ${siteConfig.name}`,
    description: '技术、设计、生活与思考的文章归档',
    url: siteUrls.blog,
    siteName: siteConfig.name,
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
