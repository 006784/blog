import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '此刻',
  description: '我现在正在做什么、想什么、关注什么——记录当下的切片。',
  alternates: { canonical: `${SITE_URL}/now` },
  openGraph: {
    title: '此刻',
    description: '我现在正在做什么、想什么、关注什么。',
    url: `${SITE_URL}/now`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function NowLayout({ children }: { children: ReactNode }) {
  return children;
}
