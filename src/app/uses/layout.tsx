import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '工具箱',
  description: '我日常使用的硬件、软件和服务，打造高效工作流的必备清单。',
  alternates: { canonical: `${SITE_URL}/uses` },
  openGraph: {
    title: '工具箱',
    description: '我日常使用的硬件、软件和服务。',
    url: `${SITE_URL}/uses`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function UsesLayout({ children }: { children: ReactNode }) {
  return children;
}
