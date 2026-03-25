import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '资源库',
  description: '精心整理的公开资源，包含文档、模板、工具等可下载内容。',
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: {
    title: '资源库',
    description: '精心整理的公开资源，包含文档、模板、工具等可下载内容。',
    url: `${SITE_URL}/resources`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return children;
}
