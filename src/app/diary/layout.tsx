import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

export const metadata: Metadata = {
  title: '日记',
  description: '私人的文字角落——记录生活、思考与情绪的流动。',
  alternates: { canonical: `${SITE_URL}/diary` },
  openGraph: {
    title: '日记',
    description: '私人的文字角落——记录生活、思考与情绪的流动。',
    url: `${SITE_URL}/diary`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function DiaryLayout({ children }: { children: ReactNode }) {
  return children;
}
