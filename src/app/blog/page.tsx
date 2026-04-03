'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { APPLE_EASE, HOVER_BUTTON, TAP_BUTTON, APPLE_SPRING_GENTLE } from '@/components/Animations';
import { useAdmin } from '@/components/AdminProvider';
import { filterRenderablePosts, getSamplePosts, toPublicCatalogPosts, type PublicCatalogPost } from '@/lib/sample-posts';
import { Collection, deletePost, getCollections, getPublishedPosts, Post } from '@/lib/supabase';
import { showConfirm } from '@/lib/confirm';

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

function BlogPageContent() {
  const [posts, setPosts] = useState<PublicCatalogPost[]>([]);
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
        const livePosts = filterRenderablePosts(toPublicCatalogPosts(postsData));
        setPosts(livePosts.length > 0 ? livePosts : getSamplePosts());
        setCollections(collectionsData);
      } catch (error) {
        console.error('加载博客数据失败:', error);
        setPosts(getSamplePosts());
        setNotification({ type: 'error', message: '实时文章暂时不可用，当前显示示例文章。' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  async function handleDeletePost(slug: string) {
    const target = posts.find((item) => item.slug === slug);
    if (!target || target.is_demo) return;

    const confirmed = await showConfirm({ title: '删除文章', description: `确定删除《${target.title}》吗？此操作不可恢复。`, confirmText: '删除', danger: true });
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
    const confirmed = await showConfirm({ title: '推送文章', description: `确定向订阅者推送《${post.title}》吗？`, confirmText: '推送' });
    if (!confirmed) return;

    setNotifyingSlug(post.slug);

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postSlug: post.slug,
          title: post.title,
          description: post.description,
          author: post.author || 'Lumen',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('当前登录已失效，请重新登录后再推送');
        }
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

  const formattedPosts = filteredPosts.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || post.created_at,
    category: post.category,
    tags: post.tags || [],
    image: post.cover_image || post.image,
    author: post.author,
    readingTime: post.reading_time,
    isDemo: Boolean(post.is_demo),
  }));

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => setNotification(null), 3200);
    return () => clearTimeout(timer);
  }, [notification]);

  return (
    <div className="journal-page">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: APPLE_EASE }}
            className={clsx(
              'journal-toast fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-2 text-sm shadow-lg backdrop-blur-xl',
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

      <div className="journal-shell">
        <section className="journal-hero surface-hero relative overflow-hidden p-6 md:p-10">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.22)_0%,_rgba(56,189,248,0)_70%)]" />
          <div className="pointer-events-none absolute -bottom-10 left-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(244,114,182,0.18)_0%,_rgba(244,114,182,0)_72%)]" />

          <div className="journal-hero-grid">
            <div className="journal-hero-copy">
              <p className="section-kicker">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Curated Archive
              </p>
              <h1 className="journal-hero-title">写作档案馆</h1>
              <p className="text-soft mt-4 max-w-2xl text-base md:text-lg">
                把技术实践、设计观察和长期写作收进同一座内容展厅里。你可以像翻杂志一样浏览，也可以按专题、关键词和分类进入。
              </p>
            </div>

            <div className="journal-hero-actions">
              {isAdmin && (
                <Link href="/write" className="btn-primary ios-button-press inline-flex items-center gap-2 px-5 py-3 text-sm">
                  <Plus className="h-4 w-4" />
                  写新文章
                </Link>
              )}

              <div className="journal-hero-stats">
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
            </div>
          </div>
        </section>

        <div className="journal-layout">
          <aside className="journal-sidebar">
            <section className="journal-filter-panel surface-card">
              <div>
                <p className="journal-panel-kicker">Filters</p>
                <h2 className="journal-panel-title">精准定位你想读的那一篇</h2>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="搜索标题、摘要或标签..."
                  className="py-3 pl-11 pr-10 text-sm"
                />
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md p-0"
                    aria-label="清空搜索"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="journal-filter-group">
                <p className="journal-filter-label">分类</p>
                <div className="journal-chip-grid">
                  {categories.map((category) => (
                    <motion.button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      whileHover={HOVER_BUTTON}
                      whileTap={TAP_BUTTON}
                      transition={APPLE_SPRING_GENTLE}
                      className="chip-filter"
                      data-active={selectedCategory === category.id}
                    >
                      {category.name}
                      <span className="ml-1 text-xs opacity-70">{category.count}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {collections.length > 0 && (
                <div className="journal-filter-group">
                  <p className="journal-filter-label inline-flex items-center gap-1">
                    <FolderOpen className="h-3.5 w-3.5" />
                    专题
                  </p>
                  <div className="journal-chip-grid">
                    <motion.button
                      onClick={() => setSelectedCollection(null)}
                      whileHover={HOVER_BUTTON}
                      whileTap={TAP_BUTTON}
                      transition={APPLE_SPRING_GENTLE}
                      className="chip-filter"
                      data-active={!selectedCollection}
                    >
                      全部
                    </motion.button>

                    {collections.map((collection) => {
                      const count = posts.filter((post) => post.collection_id === collection.id).length;
                      return (
                        <motion.button
                          key={collection.id}
                          onClick={() => setSelectedCollection(collection.id)}
                          whileHover={HOVER_BUTTON}
                          whileTap={TAP_BUTTON}
                          transition={APPLE_SPRING_GENTLE}
                          className="chip-filter"
                          data-active={selectedCollection === collection.id}
                        >
                          {collection.name}
                          <span className="ml-1 opacity-70">{count}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="journal-side-note">
                <p className="journal-panel-kicker">Reading Tip</p>
                <p className="text-soft text-sm leading-7">
                  如果你是第一次来，建议先看本页第一篇精选文章，再根据标签和专题继续往下读，体验会更连贯。
                </p>
              </div>
            </section>
          </aside>

          <section className="journal-results">
            {loading ? (
              <div className="space-y-4">
                {/* 精选文章骨架 */}
                <div className="surface-card overflow-hidden rounded-2xl">
                  <div className="grid sm:grid-cols-2 gap-0">
                    <Skeleton className="min-h-[260px] rounded-none" />
                    <div className="p-8 space-y-4">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </div>
                {/* 文章列表骨架 */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="surface-card p-5 rounded-2xl flex gap-4">
                    <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl" />
                    <div className="flex-1 space-y-3 py-1">
                      <Skeleton className="h-3 w-16 rounded-full" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="journal-results-head">
                  <Badge variant="outline" className="rounded-full px-3 py-1.5 text-sm">
                    共找到 <span className="font-medium text-foreground">{filteredPosts.length}</span> 篇文章
                  </Badge>

                  {notifyingSlug && (
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <BellRing className="h-3.5 w-3.5 animate-pulse" />
                      正在推送《{posts.find((item) => item.slug === notifyingSlug)?.title || notifyingSlug}》...
                    </p>
                  )}
                </div>

                {formattedPosts.length > 0 ? (
                  <div className="journal-card-grid journal-card-grid-grounded">
                    {formattedPosts.map((post, index) => (
                      <BlogCard
                        key={post.slug}
                        post={post}
                        index={index}
                        featured={index === 0}
                        onDelete={isAdmin ? handleDeletePost : undefined}
                        onNotify={
                          isAdmin
                            ? (postData) => {
                              const target = posts.find((item) => item.slug === postData.slug);
                                if (target && !target.is_demo) {
                                  void handleNotifyPost(target);
                                }
                              }
                            : undefined
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <StatePanel
                    tone="empty"
                    title="没有匹配的文章"
                    description="试试清空筛选条件、切换专题，或者换一个更宽松的关键词。"
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setSelectedCollection(null);
                        }}
                      >
                        重置筛选
                      </Button>
                    }
                  />
                )}
              </>
            )}
          </section>
        </div>

        <section className="journal-newsletter">
          <div className="journal-newsletter-shell">
            <SubscribeForm />
          </div>
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
            <StatePanel
              tone="loading"
              title="正在加载博客页面"
              description="正在整理文章目录和专题信息，请稍等。"
              icon={<Loader2 className="h-6 w-6 animate-spin" />}
            />
          </div>
        </div>
      }
    >
      <BlogPageContent />
    </Suspense>
  );
}
