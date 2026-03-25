import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '书影音',
  description: '读过的书、看过的影、听过的音——记录每一段文化消费的印记。',
  alternates: { canonical: `${SITE_URL}/media` },
  openGraph: {
    title: '书影音',
    description: '读过的书、看过的影、听过的音。',
    url: `${SITE_URL}/media`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function MediaLayout({ children }: { children: ReactNode }) {
  return children;
}
