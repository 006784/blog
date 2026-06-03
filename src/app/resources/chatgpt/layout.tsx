import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artchain.icu';

export const metadata: Metadata = {
  title: 'ChatGPT 代充代购 - Lumen 商店',
  description: 'ChatGPT Plus / Pro 代充代购，支持成品号与代充，付款确认后快速交付，国内用户无需虚拟卡。',
  alternates: { canonical: `${SITE_URL}/resources/chatgpt` },
  openGraph: {
    title: 'ChatGPT 代充代购 - Lumen 商店',
    description: 'ChatGPT Plus / Pro 代充代购，支持成品号与代充，付款确认后快速交付，国内用户无需虚拟卡。',
    url: `${SITE_URL}/resources/chatgpt`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ChatgptLayout({ children }: { children: ReactNode }) {
  return children;
}
