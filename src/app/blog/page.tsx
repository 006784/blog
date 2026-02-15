'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { BlogCard } from '@/components/BlogCard';
import { SubscribeForm } from '@/components/SubscribeForm';
import { APPLE_EASE } from '@/components/Animations';
import { useAdmin } from '@/components/AdminProvider';
import { Collection, deletePost, getCollections, getPublishedPosts, Post } from '@/lib/supabase';
import { formatDate } from '@/lib/types';

const categoryList = [
  { id: 'all', name: '全部' },
  { id: 'tech', name: '技术' },
  { id: 'design', name: '设计' },
  { id: 'life', name: '生活' },
  { id: 'thoughts', name: '思考' },
];

type NotificationType = {
  type: 'success' | 'error';
  message: string;
};

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    tech: '技术',
    design: '设计',
    life: '生活',
    thoughts: '思考',
  };

  return labels[category] || category;
}

function BlogPageContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [notifyingSlug, setNotifyingSlug] = useState<string | null>(null);

  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && categoryList.some((item) => item.id === category)) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postsData, collectionsData] = await Promise.all([getPublishedPosts(), getCollections()]);
        setPosts(postsData);
        setCollections(collectionsData);
      } catch (error) {
        console.error('加载博客数据失败:', error);
        setNotification({ type: 'error', message: '文章加载失败，请稍后重试。' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  async function handleDeletePost(slug: string) {
    const target = posts.find((item) => item.slug === slug);
    if (!target) return;

    const confirmed = window.confirm(`确定删除《${target.title}》吗？`);
    if (!confirmed) return;

    try {
      await deletePost(target.id);
      setPosts((prev) => prev.filter((item) => item.slug !== slug));
      setNotification({ type: 'success', message: '文章已删除。' });
    } catch (error) {
      console.error('删除失败:', error);
      setNotification({ type: 'error', message: '删除失败，请稍后再试。' });
    }
  }

  async function handleNotifyPost(post: Post) {
    const confirmed = window.confirm(`确定向订阅者推送《${post.title}》吗？`);
    if (!confirmed) return;

    setNotifyingSlug(post.slug);

    try {
      const adminToken = localStorage.getItem('admin-token');
      const password = adminToken ? atob(adminToken) : '';

      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          postSlug: post.slug,
          title: post.title,
          description: post.description,
          author: post.author || '拾光',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '推送失败');
      }

      const successful = Number(result.successful || 0);
      setNotification({
        type: 'success',
        message: successful > 0 ? `已通知 ${successful} 位订阅者。` : '当前暂无订阅者。',
      });
    } catch (error) {
      console.error('推送失败:', error);
      setNotification({ type: 'error', message: '推送失败，请稍后重试。' });
    } finally {
      setNotifyingSlug(null);
    }
  }

  const categories = useMemo(() => {
    return categoryList.map((category) => ({
      ...category,
      count:
        category.id === 'all'
          ? posts.length
          : posts.filter((item) => item.category === category.id).length,
    }));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const matchKeyword =
        keyword.length === 0 ||
        post.title.toLowerCase().includes(keyword) ||
        post.description.toLowerCase().includes(keyword) ||
        post.tags.some((tag) => tag.toLowerCase().includes(keyword));

      const matchCategory = selectedCategory === 'all' || post.category === selectedCategory;
      const matchCollection = !selectedCollection || post.collection_id === selectedCollection;

      return matchKeyword && matchCategory && matchCollection;
    });
  }, [posts, searchQuery, selectedCategory, selectedCollection]);

  const featuredPost = filteredPosts[0] || null;
  const restPosts = filteredPosts.slice(1);

  const formattedPosts = restPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || post.created_at,
    category: post.category,
    tags: post.tags || [],
    image: post.cover_image || post.image,
    author: post.author,
    readingTime: post.reading_time,
  }));

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => setNotification(null), 3200);
    return () => clearTimeout(timer);
  }, [notification]);

  return (
    <div className="min-h-screen px-6 pb-20 pt-10 md:pt-14">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: APPLE_EASE }}
            className={clsx(
              'fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-2 text-sm shadow-lg backdrop-blur-xl',
              notification.type === 'success'
                ? 'border-emerald-400/35 bg-emerald-600/90 text-white'
                : 'border-rose-400/35 bg-rose-600/90 text-white'
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl">
        <section className="surface-hero relative overflow-hidden p-6 md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(8,145,178,0.25)_0%,_rgba(8,145,178,0)_70%)]" />
          <div className="pointer-events-none absolute -bottom-10 left-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.2)_0%,_rgba(249,115,22,0)_70%)]" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="section-kicker">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Blog Index
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">博客文章</h1>
              <p className="text-soft mt-4 max-w-2xl text-base md:text-lg">
                持续更新技术实践、设计思考和个人写作。欢迎从你关心的分类开始阅读。
              </p>
            </div>

            {isAdmin && (
              <Link href="/write" className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
                <Plus className="h-4 w-4" />
                写新文章
              </Link>
            )}
          </div>

          <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
            <div className="metric-tile">
              <p className="text-2xl font-semibold">{posts.length}</p>
              <p className="text-soft text-xs">已发布文章</p>
            </div>
            <div className="metric-tile">
              <p className="text-2xl font-semibold">{collections.length}</p>
              <p className="text-soft text-xs">专题集合</p>
            </div>
            <div className="metric-tile">
              <p className="text-2xl font-semibold">{categories.filter((item) => item.count > 0).length}</p>
              <p className="text-soft text-xs">活跃分类</p>
            </div>
          </div>
        </section>

        <section className="surface-card mt-8 p-5 md:p-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索标题、摘要或标签..."
                className="input-modern py-3 pl-11 pr-10 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary"
                  aria-label="清空搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="chip-filter"
                  data-active={selectedCategory === category.id}
                >
                  {category.name}
                  <span className="ml-1 text-xs opacity-70">{category.count}</span>
                </button>
              ))}
            </div>

            {collections.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <FolderOpen className="h-3.5 w-3.5" />
                  专题
                </span>

                <button
                  onClick={() => setSelectedCollection(null)}
                  className="chip-filter"
                  data-active={!selectedCollection}
                >
                  全部
                </button>

                {collections.map((collection) => {
                  const count = posts.filter((post) => post.collection_id === collection.id).length;
                  return (
                    <button
                      key={collection.id}
                      onClick={() => setSelectedCollection(collection.id)}
                      className="chip-filter"
                      data-active={selectedCollection === collection.id}
                    >
                      {collection.name}
                      <span className="ml-1 opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {loading ? (
          <section className="py-16">
            <div className="surface-card flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-3">正在加载文章...</span>
            </div>
          </section>
        ) : (
          <section className="mt-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--ui-line)] bg-background/70 px-3 py-1.5 text-sm text-muted-foreground">
              共找到 <span className="font-medium text-foreground">{filteredPosts.length}</span> 篇文章
            </div>

            {featuredPost && (
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.64, ease: APPLE_EASE }}
                className="surface-card interactive-card overflow-hidden"
              >
                <Link href={`/blog/${featuredPost.slug}`} className="grid gap-0 md:grid-cols-2">
                  <div className="relative min-h-[240px] bg-secondary/50">
                    {featuredPost.cover_image || featuredPost.image ? (
                      <Image
                        src={featuredPost.cover_image || featuredPost.image}
                        alt={featuredPost.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-secondary to-secondary/60" />
                    )}
                  </div>

                  <div className="p-6 md:p-8">
                    <p className="section-kicker">Featured</p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight">{featuredPost.title}</h2>
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                      {featuredPost.description}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{categoryLabel(featuredPost.category)}</span>
                      <span>{formatDate(featuredPost.published_at || featuredPost.created_at)}</span>
                      <span>{featuredPost.reading_time || '约 5 分钟'}</span>
                    </div>
                    <span className="btn-secondary mt-5 inline-flex px-4 py-2 text-sm">
                      阅读全文
                    </span>
                  </div>
                </Link>
              </motion.article>
            )}

            {formattedPosts.length > 0 ? (
              <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {formattedPosts.map((post, index) => (
                  <BlogCard
                    key={post.slug}
                    post={post}
                    index={index}
                    onDelete={isAdmin ? handleDeletePost : undefined}
                    onNotify={
                      isAdmin
                        ? (postData) => {
                            const target = posts.find((item) => item.slug === postData.slug);
                            if (target) {
                              void handleNotifyPost(target);
                            }
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : !featuredPost ? (
              <div className="surface-card py-20 text-center">
                <h3 className="text-xl font-semibold">没有匹配的文章</h3>
                <p className="mt-3 text-muted-foreground">试试清空筛选条件或更换关键词。</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedCollection(null);
                  }}
                  className="btn-secondary mt-6 px-5 py-2.5 text-sm"
                >
                  重置筛选
                </button>
              </div>
            ) : null}

            {notifyingSlug && (
              <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
                <BellRing className="h-3.5 w-3.5 animate-pulse" />
                正在推送《{posts.find((item) => item.slug === notifyingSlug)?.title || notifyingSlug}》...
              </p>
            )}
          </section>
        )}

        <section className="mt-14 max-w-2xl">
          <SubscribeForm />
        </section>
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen px-6 pb-20 pt-10 md:pt-14">
          <div className="mx-auto max-w-6xl">
            <div className="surface-card py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">正在加载博客页面...</p>
            </div>
          </div>
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}
