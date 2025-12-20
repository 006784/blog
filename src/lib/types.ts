// Post type definition
export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  author: string;
  readingTime: string;
  content?: string;
  contentHtml?: string;
}

// Format date helper - can be used on client side
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Default posts for demo - can be used on client side
export const defaultPosts: Post[] = [
  {
    slug: 'getting-started-with-nextjs',
    title: '开始使用 Next.js 14 构建现代 Web 应用',
    description: '探索 Next.js 14 的新特性，学习如何使用 App Router、Server Components 和 Server Actions 构建高性能的 Web 应用程序。',
    date: '2024-01-15',
    category: 'tech',
    tags: ['Next.js', 'React', 'Web开发'],
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: '8 min read',
  },
  {
    slug: 'design-principles-for-developers',
    title: '给开发者的设计原则：创建美观的用户界面',
    description: '作为开发者，掌握基础的设计原则可以帮助你创建更加美观、易用的产品。本文将介绍一些核心设计概念。',
    date: '2024-01-10',
    category: 'design',
    tags: ['设计', 'UI/UX', '产品'],
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: '6 min read',
  },
  {
    slug: 'the-art-of-minimalism',
    title: '极简主义的艺术：少即是多',
    description: '在这个信息爆炸的时代，极简主义不仅是一种设计风格，更是一种生活态度。学习如何在复杂中寻找简单。',
    date: '2024-01-05',
    category: 'life',
    tags: ['极简主义', '生活方式', '思考'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: '5 min read',
  },
  {
    slug: 'tailwind-css-best-practices',
    title: 'Tailwind CSS 最佳实践与技巧',
    description: '深入了解 Tailwind CSS 的高级用法，包括自定义配置、响应式设计、暗色模式以及性能优化技巧。',
    date: '2024-01-01',
    category: 'tech',
    tags: ['Tailwind CSS', 'CSS', '前端'],
    image: 'https://images.unsplash.com/photo-1517134191118-9d595e4c8c2b?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: '10 min read',
  },
  {
    slug: 'future-of-ai',
    title: '人工智能的未来：机遇与挑战',
    description: '随着 AI 技术的快速发展，我们正站在一个历史性的转折点。探讨 AI 对社会、工作和生活的深远影响。',
    date: '2023-12-28',
    category: 'thoughts',
    tags: ['AI', '科技', '未来'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: '7 min read',
  },
  {
    slug: 'framer-motion-animations',
    title: '使用 Framer Motion 创建流畅的动画效果',
    description: '学习如何使用 Framer Motion 在 React 应用中创建专业级的动画效果，提升用户体验。',
    date: '2023-12-20',
    category: 'tech',
    tags: ['Framer Motion', 'React', '动画'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=400&fit=crop',
    author: '拾光',
    readingTime: '9 min read',
  },
];
