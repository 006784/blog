'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, Filter, X, Grid, List as ListIcon, Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { BlogCard } from '@/components/BlogCard';
import { AnimatedSection } from '@/components/Animations';
import { getPublishedPosts, Post, deletePost } from '@/lib/supabase';
import { SubscribeForm } from '@/components/SubscribeForm';
import { useAdmin } from '@/components/AdminProvider';
import clsx from 'clsx';

const categoryList = [
  { id: 'all', name: '全部' },
  { id: 'tech', name: '技术' },
  { id: 'design', name: '设计' },
  { id: 'life', name: '生活' },
  { id: 'thoughts', name: '思考' },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await getPublishedPosts();
      setPosts(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm('确定要删除这篇文章吗？')) return;
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  // 计算分类统计
  const categories = useMemo(() => {
    return categoryList.map(cat => ({
      ...cat,
      count: cat.id === 'all' ? posts.length : posts.filter(p => p.category === cat.id).length
    }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, selectedCategory]);

  // 转换为 BlogCard 需要的格式
  const formattedPosts = filteredPosts.map(post => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || post.created_at,
    category: post.category,
    tags: post.tags,
    image: post.cover_image || post.image,
    author: post.author,
    readingTime: post.reading_time,
  }));

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
            <div className="flex items-start justify-between">
              <div>
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
              </div>
              {isAdmin && (
                <Link href="/write">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary hidden sm:flex"
                  >
                    <Plus className="w-5 h-5" />
                    写文章
                  </motion.button>
                </Link>
              )}
            </div>
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
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : (
            <>
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
                {formattedPosts.length > 0 ? (
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
                    {formattedPosts.map((post, index) => (
                      <BlogCard 
                        key={post.slug} 
                        post={post} 
                        index={index}
                        onDelete={handleDeletePost}
                      />
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
                      {posts.length === 0 ? '还没有发布文章' : '尝试更换关键词或清除筛选条件'}
                    </p>
                    {posts.length > 0 && (
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
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </section>

      {/* Subscribe Section */}
      <section className="py-16 px-6">
        <div className="max-w-xl mx-auto">
          <AnimatedSection>
            <SubscribeForm />
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
