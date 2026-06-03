import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artchain.icu';

export const metadata: Metadata = {
  title: '每日简报 - Lumen',
  description: '每天精炼整理科技与 AI 领域值得关注的动态，简洁克制，几分钟读完当日要点。',
  alternates: { canonical: `${SITE_URL}/briefing` },
  openGraph: {
    title: '每日简报 - Lumen',
    description: '每天精炼整理科技与 AI 领域值得关注的动态，简洁克制，几分钟读完当日要点。',
    url: `${SITE_URL}/briefing`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function BriefingLayout({ children }: { children: ReactNode }) {
  return children;
}
