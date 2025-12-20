'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Facebook, Linkedin, Copy, Check, ChevronUp } from 'lucide-react';
import { AnimatedSection } from '@/components/Animations';
import { formatDate } from '@/lib/types';
import clsx from 'clsx';

// Demo posts data
const postsData: Record<string, {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  author: string;
  readingTime: string;
  content: string;
}> = {
  'getting-started-with-nextjs': {
    title: '开始使用 Next.js 14 构建现代 Web 应用',
    description: '探索 Next.js 14 的新特性，学习如何使用 App Router、Server Components 和 Server Actions 构建高性能的 Web 应用程序。',
    date: '2024-01-15',
    category: 'tech',
    tags: ['Next.js', 'React', 'Web开发'],
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop',
    author: '拾光',
    readingTime: '8 min read',
    content: `
## 介绍

Next.js 14 是一个里程碑式的版本，它带来了许多激动人心的新特性，让 React 开发变得更加简单和高效。

## App Router

App Router 是 Next.js 13 引入的全新路由系统，在 14 版本中得到了进一步的优化和完善。

### 文件系统路由

Next.js 使用文件系统作为路由的基础。在 \`app\` 目录下创建的每个文件夹都会自动成为一个路由段。

\`\`\`tsx
// app/blog/page.tsx
export default function BlogPage() {
  return <h1>博客列表</h1>
}
\`\`\`

### 布局系统

布局是 App Router 的核心概念之一。通过创建 \`layout.tsx\` 文件，你可以定义多个页面共享的 UI。

\`\`\`tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
\`\`\`

## Server Components

Server Components 是 React 的未来，它允许你在服务器上渲染组件，从而减少客户端 JavaScript 的大小。

### 优势

1. **更小的 bundle 体积** - 依赖项保留在服务器上
2. **直接访问后端资源** - 数据库、文件系统等
3. **安全性** - 敏感数据和 API 密钥保留在服务器上

### 示例

\`\`\`tsx
// 这是一个 Server Component
async function BlogPosts() {
  const posts = await db.posts.findMany()
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
\`\`\`

## Server Actions

Server Actions 是 Next.js 14 中最令人兴奋的特性之一。它们允许你直接在组件中定义服务器端函数。

\`\`\`tsx
async function submitForm(formData: FormData) {
  'use server'
  
  const email = formData.get('email')
  await db.subscribers.create({ email })
}
\`\`\`

## 性能优化

Next.js 14 在性能方面进行了大量优化：

- **Turbopack** - 更快的开发服务器
- **部分预渲染** - 结合静态和动态内容
- **图像优化** - 自动优化图像加载

## 总结

Next.js 14 是一个强大的框架，它结合了 React 的灵活性和优秀的开发体验。无论你是构建小型网站还是大型应用，Next.js 都是一个绝佳的选择。

> "The best way to predict the future is to create it." - Peter Drucker

继续探索，保持学习！
    `,
  },
  'design-principles-for-developers': {
    title: '给开发者的设计原则：创建美观的用户界面',
    description: '作为开发者，掌握基础的设计原则可以帮助你创建更加美观、易用的产品。',
    date: '2024-01-10',
    category: 'design',
    tags: ['设计', 'UI/UX', '产品'],
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop',
    author: '拾光',
    readingTime: '6 min read',
    content: `
## 为什么设计对开发者很重要

在当今的数字世界中，用户体验是产品成功的关键因素。作为开发者，了解基本的设计原则可以帮助你创建更好的产品。

## 核心设计原则

### 1. 层次结构

视觉层次结构帮助用户理解信息的重要性。通过大小、颜色和位置来区分元素的重要性。

### 2. 留白

留白（White Space）不是浪费空间，而是帮助用户专注于重要内容。

### 3. 一致性

保持设计的一致性可以减少用户的认知负担，提高可用性。

### 4. 对比

良好的对比可以提高可读性和可访问性。

## 颜色理论基础

颜色在设计中扮演着重要角色：

- **主色** - 品牌的主要颜色
- **辅助色** - 补充主色
- **强调色** - 用于突出重要元素

## 排版规则

好的排版可以显著提升阅读体验：

1. 限制字体数量（通常 2-3 种）
2. 建立清晰的层次结构
3. 保持足够的行高（1.5-1.8）
4. 注意段落宽度（45-75 个字符）

## 实践建议

- 多观察优秀的设计
- 从模仿开始学习
- 收集设计灵感
- 寻求反馈并迭代

设计是一项可以通过练习不断提升的技能。开始行动吧！
    `,
  },
  'the-art-of-minimalism': {
    title: '极简主义的艺术：少即是多',
    description: '在这个信息爆炸的时代，极简主义不仅是一种设计风格，更是一种生活态度。',
    date: '2024-01-05',
    category: 'life',
    tags: ['极简主义', '生活方式', '思考'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop',
    author: '拾光',
    readingTime: '5 min read',
    content: `
## 什么是极简主义

极简主义不是关于拥有更少，而是关于为真正重要的事物腾出空间。

## 数字极简

在数字时代，我们面临着信息过载的挑战：

- 清理不必要的应用
- 减少社交媒体使用
- 专注于真正重要的工具

## 生活极简

简化生活可以带来内心的平静：

1. 整理物品，保留真正需要的
2. 简化日程，留出思考时间
3. 减少干扰，专注当下

## 工作极简

在工作中应用极简主义：

- 一次只做一件事
- 减少不必要的会议
- 简化工作流程

> "Simplicity is the ultimate sophistication." - Leonardo da Vinci

拥抱极简，发现生活的本质。
    `,
  },
  'tailwind-css-best-practices': {
    title: 'Tailwind CSS 最佳实践与技巧',
    description: '深入了解 Tailwind CSS 的高级用法，包括自定义配置、响应式设计、暗色模式以及性能优化技巧。',
    date: '2024-01-01',
    category: 'tech',
    tags: ['Tailwind CSS', 'CSS', '前端'],
    image: 'https://images.unsplash.com/photo-1517134191118-9d595e4c8c2b?w=1200&h=600&fit=crop',
    author: '拾光',
    readingTime: '10 min read',
    content: `
## Tailwind CSS 简介

Tailwind CSS 是一个实用优先的 CSS 框架，它提供了大量的预设类来快速构建现代 UI。

## 核心概念

### 实用优先

Tailwind 的核心理念是使用小型、单一用途的类来构建设计。

\`\`\`html
<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  点击我
</button>
\`\`\`

### 响应式设计

Tailwind 使响应式设计变得简单：

\`\`\`html
<div class="text-sm md:text-base lg:text-lg">
  响应式文字
</div>
\`\`\`

## 暗色模式

实现暗色模式非常简单：

\`\`\`html
<div class="bg-white dark:bg-gray-800">
  自动切换背景色
</div>
\`\`\`

## 自定义配置

通过 tailwind.config.js 扩展默认配置：

\`\`\`javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#3B82F6',
      },
    },
  },
}
\`\`\`

## 性能优化

- 使用 PurgeCSS 移除未使用的样式
- 合理使用 @apply 指令
- 避免过度嵌套

掌握这些技巧，你将能够高效地使用 Tailwind CSS 构建美观的界面。
    `,
  },
  'future-of-ai': {
    title: '人工智能的未来：机遇与挑战',
    description: '随着 AI 技术的快速发展，我们正站在一个历史性的转折点。',
    date: '2023-12-28',
    category: 'thoughts',
    tags: ['AI', '科技', '未来'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop',
    author: '拾光',
    readingTime: '7 min read',
    content: `
## AI 的现状

人工智能已经从科幻走进现实，深刻影响着我们的生活。

## 主要发展方向

### 大语言模型

GPT、Claude 等大语言模型正在改变我们与计算机交互的方式。

### 生成式 AI

从文本到图像、视频，生成式 AI 正在创造新的可能性。

### 自动驾驶

自动驾驶技术正在逐步成熟，改变交通方式。

## 机遇

- 提高生产效率
- 解决复杂问题
- 创造新的职业

## 挑战

- 伦理问题
- 就业影响
- 隐私安全

## 思考

面对 AI 时代，我们需要保持开放的心态，同时也要审慎思考其影响。

> "AI 是一面镜子，反映的是人类的智慧和价值观。"

拥抱变化，把握未来。
    `,
  },
  'framer-motion-animations': {
    title: '使用 Framer Motion 创建流畅的动画效果',
    description: '学习如何使用 Framer Motion 在 React 应用中创建专业级的动画效果。',
    date: '2023-12-20',
    category: 'tech',
    tags: ['Framer Motion', 'React', '动画'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=600&fit=crop',
    author: '拾光',
    readingTime: '9 min read',
    content: `
## Framer Motion 介绍

Framer Motion 是一个强大的 React 动画库，让复杂的动画变得简单。

## 基础用法

### motion 组件

\`\`\`tsx
import { motion } from 'framer-motion'

function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      你好，动画世界！
    </motion.div>
  )
}
\`\`\`

### 手势动画

\`\`\`tsx
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
>
  点击我
</motion.button>
\`\`\`

## 高级技巧

### Variants

使用 variants 管理复杂的动画状态：

\`\`\`tsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

<motion.div variants={variants} initial="hidden" animate="visible">
  内容
</motion.div>
\`\`\`

### AnimatePresence

处理组件的进入和退出动画：

\`\`\`tsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      可见内容
    </motion.div>
  )}
</AnimatePresence>
\`\`\`

## 性能优化

- 使用 layout 属性进行布局动画
- 合理使用 useTransform
- 避免过多的重渲染

掌握 Framer Motion，让你的应用动起来！
    `,
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const post = postsData[resolvedParams.slug];
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-6">文章不存在</p>
          <Link href="/blog">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary"
            >
              返回博客列表
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryColors: Record<string, string> = {
    tech: 'bg-blue-500/10 text-blue-500',
    design: 'bg-purple-500/10 text-purple-500',
    life: 'bg-green-500/10 text-green-500',
    thoughts: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <article className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-8 left-6"
        >
          <Link href="/blog">
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-full text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </motion.button>
          </Link>
        </motion.div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className={clsx(
                'inline-block px-3 py-1 rounded-full text-xs font-medium mb-4',
                categoryColors[post.category] || 'bg-gray-500/10 text-gray-500'
              )}>
                {post.category}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                {post.title}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                {post.description}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meta & Content */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        {/* Meta */}
        <AnimatedSection>
          <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-border mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center text-white font-medium">
                {post.author[0]}
              </div>
              <span className="font-medium">{post.author}</span>
            </div>
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              {post.readingTime}
            </span>
          </div>
        </AnimatedSection>

        {/* Content */}
        <AnimatedSection delay={0.1}>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: post.content
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }}
          />
        </AnimatedSection>

        {/* Tags */}
        <AnimatedSection delay={0.2}>
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-full text-sm"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Share */}
        <AnimatedSection delay={0.3}>
          <div className="mt-8 p-6 bg-secondary/50 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5" />
              <span className="font-medium">分享这篇文章</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&title=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={copyLink}
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </motion.button>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Scroll to top */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: showScrollTop ? 1 : 0, scale: showScrollTop ? 1 : 0.8 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-50"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
    </article>
  );
}
