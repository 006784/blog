import HomePageClient from './page.client';
import { siteConfig, siteUrls } from '@/lib/site-config';
import { getPublishedPosts } from '@/lib/supabase';

// ISR：每 60 秒重新验证首页数据，避免每次请求都查库
export const revalidate = 60;

export const metadata = {
  title: `${siteConfig.name} - 分享技术与生活`,
  description: siteConfig.description,
  keywords: '前端开发,后端架构,技术博客,编程教程,个人成长',
  authors: [{ name: '博主' }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: `${siteConfig.name} - 分享技术与生活`,
    description: siteConfig.description,
    url: siteUrls.home,
    siteName: siteConfig.name,
    images: [
      {
        url: siteUrls.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - 分享技术与生活`,
    description: siteConfig.description,
    images: [siteUrls.ogImage],
  },
  alternates: {
    canonical: siteUrls.home,
  },
};

export default async function HomePage() {
  // 服务端预取，结果随 HTML 下发给客户端，避免首屏白屏
  let initialPosts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    initialPosts = await getPublishedPosts();
  } catch {
    // 服务端获取失败时客户端兜底
  }

  return <HomePageClient initialPosts={initialPosts} />;
}
