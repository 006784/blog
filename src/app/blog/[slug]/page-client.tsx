import BlogPostPageClient from './page-client';

// 为静态导出生成静态参数
export async function generateStaticParams() {
  // 在静态导出模式下，我们返回空数组
  // 实际的文章将在运行时通过API获取
  return [];
}

// 服务器组件包装器
export default function BlogPostPage(props: any) {
  return <BlogPostPageClient {...props} />;
}