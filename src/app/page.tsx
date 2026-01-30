import HomePageClient from './page.client';

export const metadata = {
  title: '拾光博客 - 分享技术与生活',
  description: '专注于前端技术、后端架构、个人成长的个人博客。分享编程经验、技术教程和生活感悟。',
  keywords: '前端开发,后端架构,技术博客,编程教程,个人成长',
  authors: [{ name: '博主' }],
  creator: '拾光博客',
  publisher: '拾光博客',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: '拾光博客 - 分享技术与生活',
    description: '专注于前端技术、后端架构、个人成长的个人博客',
    url: 'https://your-domain.com',
    siteName: '拾光博客',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '拾光博客',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '拾光博客 - 分享技术与生活',
    description: '专注于前端技术、后端架构、个人成长的个人博客',
    images: ['https://your-domain.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://your-domain.com',
  },
};

export default function HomePage() {
  return <HomePageClient />;
}