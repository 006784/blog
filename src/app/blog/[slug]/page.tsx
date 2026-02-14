import BlogPostPageClient from './page-client';

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

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  return <BlogPostPageClient slug={decodeURIComponent(slug)} />;
}
