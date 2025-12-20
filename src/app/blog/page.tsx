'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Grid, List as ListIcon } from 'lucide-react';
import { BlogCard } from '@/components/BlogCard';
import { AnimatedSection } from '@/components/Animations';
import { Post } from '@/lib/types';
import clsx from 'clsx';

// Demo posts data
const allPosts: Post[] = [
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

const categories = [
  { id: 'all', name: '全部', count: allPosts.length },
  { id: 'tech', name: '技术', count: allPosts.filter(p => p.category === 'tech').length },
  { id: 'design', name: '设计', count: allPosts.filter(p => p.category === 'design').length },
  { id: 'life', name: '生活', count: allPosts.filter(p => p.category === 'life').length },
  { id: 'thoughts', name: '思考', count: allPosts.filter(p => p.category === 'thoughts').length },
];

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-15" />
      </div>

      {/* Header */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-secondary/20 to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimatedSection>
            <motion.span 
              className="inline-block text-sm font-medium text-primary mb-4 px-4 py-1.5 bg-primary/10 rounded-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              全部文章
            </motion.span>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              <span className="aurora-text">博客文章</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              探索技术、设计和生活的无限可能。每一篇文章都是一次深度思考的结晶。
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-16 md:top-20 z-30 py-4 px-6 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* Category Filter - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={clsx(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {category.name}
                  <span className="ml-1.5 text-xs opacity-70">
                    {category.count}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Mobile Filter Toggle */}
            <div className="flex items-center gap-2 md:hidden">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">筛选</span>
              </motion.button>
            </div>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-secondary rounded-xl">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid' ? 'bg-card shadow' : 'hover:bg-card/50'
                )}
              >
                <Grid className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list' ? 'bg-card shadow' : 'hover:bg-card/50'
                )}
              >
                <ListIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Mobile Category Filter */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden md:hidden"
              >
                <div className="flex flex-wrap gap-2 pt-4">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setIsFilterOpen(false);
                      }}
                      className={clsx(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-card-foreground'
                      )}
                    >
                      {category.name} ({category.count})
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Results count */}
          <motion.p
            key={filteredPosts.length}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-8"
          >
            共找到 <span className="font-medium text-foreground">{filteredPosts.length}</span> 篇文章
          </motion.p>

          {/* Posts */}
          <AnimatePresence mode="wait">
            {filteredPosts.length > 0 ? (
              <motion.div
                key={`${selectedCategory}-${searchQuery}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={clsx(
                  'grid gap-8',
                  viewMode === 'grid' 
                    ? 'sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                )}
              >
                {filteredPosts.map((post, index) => (
                  <BlogCard key={post.slug} post={post} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">未找到相关文章</h3>
                <p className="text-muted-foreground mb-6">
                  尝试更换关键词或清除筛选条件
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="btn-primary"
                >
                  清除筛选
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
