import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '联系我',
  description: '有什么想说的？通过这里给我发消息，我会认真阅读每一封来信。',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    title: '联系我',
    description: '有什么想说的？通过这里给我发消息。',
    url: `${SITE_URL}/contact`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
