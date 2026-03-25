import HomePageClient from './page.client';
import { getPublishedPosts } from '@/lib/supabase';

// ISR：每 60 秒重新验证首页数据，避免每次请求都查库
export const revalidate = 60;

export const metadata = {
  title: 'Lumen - 分享技术与生活',
  description: '专注于前端技术、后端架构、个人成长的个人博客。分享编程经验、技术教程和生活感悟。',
  keywords: '前端开发,后端架构,技术博客,编程教程,个人成长',
  authors: [{ name: '博主' }],
  creator: 'Lumen',
  publisher: 'Lumen',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Lumen - 分享技术与生活',
    description: '专注于前端技术、后端架构、个人成长的个人博客',
    url: 'https://your-domain.com',
    siteName: 'Lumen',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Lumen',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumen - 分享技术与生活',
    description: '专注于前端技术、后端架构、个人成长的个人博客',
    images: ['https://your-domain.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://your-domain.com',
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