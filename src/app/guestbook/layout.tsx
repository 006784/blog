import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '留言板 - Lumen',
  description: '欢迎在这里留下你的足迹，我会认真阅读每一条留言。',
  alternates: { canonical: `${SITE_URL}/guestbook` },
  openGraph: {
    title: '留言板 - Lumen',
    description: '欢迎在这里留下你的足迹。',
    url: `${SITE_URL}/guestbook`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function GuestbookLayout({ children }: { children: ReactNode }) {
  return children;
}
