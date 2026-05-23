import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artchain.icu';

export const metadata: Metadata = {
  title: '电脑专区',
  description: '精选电脑壁纸、桌面灵感和适合不同屏幕比例的视觉素材。',
  alternates: { canonical: `${SITE_URL}/computer` },
  openGraph: {
    title: '电脑专区',
    description: '精选电脑壁纸、桌面灵感和适合不同屏幕比例的视觉素材。',
    url: `${SITE_URL}/computer`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ComputerLayout({ children }: { children: ReactNode }) {
  return children;
}
