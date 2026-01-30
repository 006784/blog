import { getPublishedPosts } from '@/lib/supabase';

// 为静态导出生成静态参数
export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts();
    return posts.map(post => ({
      slug: post.slug
    }));
  } catch (error) {
    console.error('生成静态参数失败:', error);
    return [];
  }
}