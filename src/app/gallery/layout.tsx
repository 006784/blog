import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '图库 - Lumen',
  description: '用镜头记录生活，每一张照片都是值得珍藏的时光。',
  alternates: { canonical: `${SITE_URL}/gallery` },
  openGraph: {
    title: '图库 - Lumen',
    description: '用镜头记录生活，每一张照片都是值得珍藏的时光。',
    url: `${SITE_URL}/gallery`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return children;
}
