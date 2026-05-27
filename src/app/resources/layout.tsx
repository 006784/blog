import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ShopProvider } from './_shop/ShopProvider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '商店',
  description: 'AI 订阅代购、海外账号注册、数字资源，付款确认后 24 小时内交付。',
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: {
    title: '商店',
    description: 'AI 订阅代购、海外账号注册、数字资源，付款确认后 24 小时内交付。',
    url: `${SITE_URL}/resources`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return <ShopProvider>{children}</ShopProvider>;
}
