import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '归档',
  description: '按时间轴浏览所有文章，寻找过去写下的每一个时刻。',
  alternates: { canonical: `${SITE_URL}/archive` },
  openGraph: {
    title: '归档',
    description: '按时间轴浏览所有文章。',
    url: `${SITE_URL}/archive`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return children;
}
