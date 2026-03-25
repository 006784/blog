import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '音乐 - Lumen',
  description: '博主的歌单与音乐收藏，记录每个时期的听歌心情。',
  alternates: { canonical: `${SITE_URL}/music` },
  openGraph: {
    title: '音乐 - Lumen',
    description: '博主的歌单与音乐收藏。',
    url: `${SITE_URL}/music`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function MusicLayout({ children }: { children: ReactNode }) {
  return children;
}
