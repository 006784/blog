import type { Metadata } from 'next';
import BlogPostPageClient from './page-client';
import { getPostBySlug } from '@/lib/supabase';
import { JsonLd } from '@/components/seo/JsonLd';
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/seo';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const { getPublishedPosts } = await import('@/lib/supabase');
    const posts = await getPublishedPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('生成博客文章静态参数失败:', error);
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(decodeURIComponent(slug));

  if (!post) {
    return { title: '文章未找到 - Lumen' };
  }

  // 使用 /api/og 动态生成 OG 卡片图
  const ogParams = new URLSearchParams({
    title: post.meta_title || post.title,
    description: post.meta_description || post.description || '',
    author: post.author || 'Lumen',
    date: post.published_at ? new Date(post.published_at).toLocaleDateString('zh-CN') : '',
  });
  const ogImage = `${SITE_URL}/api/og?${ogParams.toString()}`;
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${post.meta_title || post.title} - Lumen`,
    description: post.meta_description || post.description,
    keywords: Array.isArray(post.tags) ? post.tags.join(',') : undefined,
    authors: [{ name: post.author || '博主' }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.description,
      url: canonicalUrl,
      siteName: 'Lumen',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      locale: 'zh_CN',
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      section: post.category,
      tags: Array.isArray(post.tags) ? post.tags : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getPostBySlug(decodedSlug);

  const articleSchema = post ? generateArticleSchema(post) : null;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: '首页', url: '/' },
    { name: '博客', url: '/blog' },
    ...(post?.category ? [{ name: post.category, url: `/blog?category=${encodeURIComponent(post.category)}` }] : []),
    { name: post?.title || '文章', url: `/blog/${slug}` },
  ]);

  return (
    <>
      {articleSchema && <JsonLd data={articleSchema} />}
      <JsonLd data={breadcrumbSchema} />
      <BlogPostPageClient slug={decodedSlug} />
    </>
  );
}
