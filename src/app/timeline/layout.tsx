import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '时间线',
  description: '成长历程中的重要节点与记忆，一条流动的人生轨迹。',
  alternates: { canonical: `${SITE_URL}/timeline` },
  openGraph: {
    title: '时间线',
    description: '成长历程中的重要节点与记忆。',
    url: `${SITE_URL}/timeline`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function TimelineLayout({ children }: { children: ReactNode }) {
  return children;
}
