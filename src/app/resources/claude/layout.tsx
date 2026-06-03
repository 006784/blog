import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.artchain.icu';

export const metadata: Metadata = {
  title: 'Claude 代充代购 - Lumen 商店',
  description: 'Claude Pro / Max 代充代购，支持 Session Token 代充与成品号，解锁 Claude Code、深度研究等全部功能。',
  alternates: { canonical: `${SITE_URL}/resources/claude` },
  openGraph: {
    title: 'Claude 代充代购 - Lumen 商店',
    description: 'Claude Pro / Max 代充代购，支持 Session Token 代充与成品号，解锁 Claude Code、深度研究等全部功能。',
    url: `${SITE_URL}/resources/claude`,
    siteName: 'Lumen',
    locale: 'zh_CN',
    type: 'website',
  },
};

export default function ClaudeLayout({ children }: { children: ReactNode }) {
  return children;
}
