import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteConfig } from '@/lib/site-config';

const SITE_URL = siteConfig.url;

export const metadata: Metadata = {
  title: '书影音',
  description: '读过的书、看过的影、听过的音——记录每一段文化消费的印记。',
  alternates: { canonical: `${SITE_URL}/media` },
  openGraph: {
    title: '书影音',
    description: '读过的书、看过的影、听过的音。',
    url: `${SITE_URL}/media`,
    siteName: siteConfig.name,
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function MediaLayout({ children }: { children: ReactNode }) {
  return children;
}
