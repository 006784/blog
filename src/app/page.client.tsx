'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Clock3, Search } from 'lucide-react';
import clsx from 'clsx';
import { SubscribeForm } from '@/components/SubscribeForm';
import AdminFloatButton from '@/components/AdminFloatButton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { getPageStructuredData } from '@/lib/seo';
import { filterRenderablePosts, getSamplePosts, toPublicCatalogPosts } from '@/lib/sample-posts';
import { siteConfig } from '@/lib/site-config';
import { formatDate } from '@/lib/types';
import { getPublishedPosts, type Post as SupabasePost } from '@/lib/supabase';

interface HomePost {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  readingTime: string;
  isPinned: boolean;
  pinnedAt: string | null;
  isDemo: boolean;
}

const navItems = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
  { name: '联系', href: '/contact' },
];

const categoryLabels: Record<string, string> = {
  tech: '技术',
  design: '设计',
  life: '生活',
  thoughts: '思考',
};

const fallbackImages = [
  'https://images.unsplash.com/photo-1436978913421-dad2ebd01d17?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=1400&q=80',
];

function getCategoryLabel(category: string): string {
  const normalized = category.toLowerCase();
  return categoryLabels[normalized] || category;
}

function normalizePost(post: SupabasePost & { is_demo?: boolean }, index: number): HomePost {
  const image = post.cover_image || post.image || fallbackImages[index % fallbackImages.length];

  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.published_at || post.created_at,
    category: getCategoryLabel(post.category),
    tags: Array.isArray(post.tags) ? post.tags : [],
    image,
    readingTime: post.reading_time || '5 分钟',
    isPinned: Boolean(post.is_pinned),
    pinnedAt: post.pinned_at || null,
    isDemo: Boolean(post.is_demo),
  };
}

const fallbackHomePosts = getSamplePosts().map((post, index) => normalizePost(post, index));

function ProgressiveImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={clsx('atelier-image-shell', className, loaded && 'is-loaded')}>
      <span className="atelier-image-placeholder" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="atelier-image"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function EditorialFeatureCard({
  post,
  pinned,
}: {
  post: HomePost;
  pinned: boolean;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="atelier-feature-card group overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xl)] transition-transform duration-[var(--duration-normal)] hover:-translate-y-1"
    >
      <div className="atelier-feature-media">
        <ProgressiveImage
          src={post.image}
          alt={post.title}
          className="atelier-feature-image"
          sizes="(max-width: 1024px) 100vw, 48vw"
          priority
        />
        <div className="atelier-feature-overlay" />
        {pinned && (
          <Badge className="atelier-pill is-spotlight border-white/20 bg-white/20 text-white backdrop-blur-xl">
            置顶文章
          </Badge>
        )}
        {post.isDemo && (
          <Badge className="atelier-pill is-demo border-white/25 bg-black/25 text-white backdrop-blur-xl">
            示例文章
          </Badge>
        )}
      </div>

      <div className="atelier-feature-body">
        <p className="atelier-meta-line">
          <span>
            <CalendarDays strokeWidth={1.5} className="h-3.5 w-3.5" />
            {formatDate(post.date)}
          </span>
          <span>
            <Clock3 strokeWidth={1.5} className="h-3.5 w-3.5" />
            {post.readingTime}
          </span>
          <span>{post.category}</span>
        </p>

        <h2>{post.title}</h2>
        <p>{post.description}</p>

        <div className="atelier-tag-row">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="soft" className="atelier-tag bg-[var(--surface-glass)] text-[var(--color-neutral-900)] dark:text-[var(--color-neutral-900)]">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}

function EditorialStoryCard({ post, index }: { post: HomePost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="atelier-story-card"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="atelier-story-link rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
      >
        <div className="atelier-story-copy">
          <p className="atelier-story-category">{post.category}</p>
          <h3>{post.title}</h3>
          <p>{post.description}</p>
          <div className="atelier-story-meta">
            <span>{formatDate(post.date)}</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
        <span className="atelier-story-arrow">
          <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
        </span>
      </Link>
    </motion.article>
  );
}

function EditorialFeedCard({
  post,
  index,
  emphasized = false,
}: {
  post: HomePost;
  index: number;
  emphasized?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className={clsx('atelier-feed-card', emphasized && 'is-emphasized')}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="atelier-feed-link rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
      >
        <ProgressiveImage
          src={post.image}
          alt={post.title}
          className="atelier-feed-thumb"
          sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />

        <div className="atelier-feed-body">
          <div className="atelier-feed-topline">
            <Badge className="atelier-pill">{post.category}</Badge>
            <span className="atelier-feed-reading">{post.readingTime}</span>
          </div>

          {post.isDemo && (
            <Badge variant="soft" className="mb-3 w-fit">
              示例
            </Badge>
          )}

          <h3>{post.title}</h3>
          <p>{post.description}</p>

          <div className="atelier-feed-footer">
            <span>{formatDate(post.date)}</span>
            <span className="atelier-feed-cta">
              阅读全文
              <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomePageClient({
  initialPosts = [],
}: {
  initialPosts?: import('@/lib/supabase').Post[];
}) {
  const [posts, setPosts] = useState<HomePost[]>(() =>
    initialPosts.length > 0
      ? toPublicCatalogPosts(initialPosts).map((post, index) => normalizePost(post, index))
      : []
  );
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [visibleCount, setVisibleCount] = useState(6);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    document.body.classList.add('atelier-home-route');
    return () => {
      document.body.classList.remove('atelier-home-route');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      try {
        const data = filterRenderablePosts(toPublicCatalogPosts(await getPublishedPosts()));

        if (!mounted) return;

        if (data.length > 0) {
          const normalizedPosts = data.map((post, index) => normalizePost(post, index));
          const latestPinnedPost = normalizedPosts
            .filter((post) => post.isPinned)
            .sort((a, b) => {
              const aTime = new Date(a.pinnedAt || a.date).getTime();
              const bTime = new Date(b.pinnedAt || b.date).getTime();
              return bTime - aTime;
            })[0];

          const visiblePosts = normalizedPosts.slice(0, 12);
          if (latestPinnedPost && !visiblePosts.some((post) => post.slug === latestPinnedPost.slug)) {
            visiblePosts.unshift(latestPinnedPost);
          }

          setPosts(visiblePosts);
        } else {
          setPosts(fallbackHomePosts);
        }
      } catch (error) {
        console.error('加载文章失败:', error);
        if (mounted && initialPosts.length === 0) {
          setPosts(fallbackHomePosts);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPosts();

    return () => {
      mounted = false;
    };
  }, [initialPosts.length]);

  useEffect(() => {
    let frameId = 0;

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        setScrollRatio(Math.min(window.scrollY / 240, 1));
        frameId = 0;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const websiteSchema = getPageStructuredData('homepage');
  const activePosts = posts.length > 0 ? posts : fallbackHomePosts;
  const heroPinnedPost = useMemo(
    () =>
      activePosts
        .filter((post) => post.isPinned)
        .sort((a, b) => {
          const aTime = new Date(a.pinnedAt || a.date).getTime();
          const bTime = new Date(b.pinnedAt || b.date).getTime();
          return bTime - aTime;
        })[0] || null,
    [activePosts]
  );
  const heroPost = heroPinnedPost || activePosts[0];
  const remainingStories = useMemo(
    () => activePosts.filter((post) => post.slug !== heroPost.slug),
    [activePosts, heroPost.slug]
  );

  const curatedCount =
    remainingStories.length >= 7 ? 3 : remainingStories.length >= 5 ? 2 : remainingStories.length >= 3 ? 1 : 0;
  const curatedPosts = remainingStories.slice(0, curatedCount);
  const feedSource = remainingStories.slice(curatedCount);
  const visiblePosts = feedSource.slice(0, visibleCount);
  const canLoadMore = visibleCount < feedSource.length;

  const topCategories = useMemo(() => {
    const counts = activePosts.reduce<Record<string, number>>((acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [activePosts]);

  const totalTags = useMemo(() => {
    return new Set(activePosts.flatMap((post) => post.tags)).size;
  }, [activePosts]);

  const navStyle = useMemo(
    () =>
      ({
        '--atelier-nav-blur': `${12 + scrollRatio * 10}px`,
        '--atelier-nav-alpha': `${0.68 + scrollRatio * 0.18}`,
      }) as CSSProperties,
    [scrollRatio]
  );

  return (
    <div className="atelier-home">
      <Script id="homepage-structured-data" type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </Script>

      <header className="atelier-nav" style={navStyle}>
        <div className="atelier-shell atelier-nav-row">
          <Link href="/" className="atelier-brand">
            <span className="atelier-brand-mark">拾</span>
            <span className="atelier-brand-copy">
              <strong>{siteConfig.name}</strong>
              <em>Slow digital magazine</em>
            </span>
          </Link>

          <nav className="atelier-nav-links" aria-label="主导航">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="atelier-nav-link">
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="atelier-nav-actions">
            <Link
              href="/blog?search=1"
              className="atelier-icon-button rounded-full border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
              aria-label="搜索文章"
            >
              <Search strokeWidth={1.5} className="h-4 w-4" />
            </Link>
            <Link
              href="/blog"
              className="atelier-ghost-button rounded-full border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              浏览文章
            </Link>
          </div>
        </div>
      </header>

      <main className="atelier-main">
        <section className="atelier-hero">
          <div className="atelier-shell">
            <div className="atelier-hero-grid">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="atelier-hero-copy"
              >
                <p className="atelier-kicker">独立写作空间&ensp;·&ensp;ESSAY</p>
                <h1>把技术、设计和日常写成一份值得反复翻阅的私人杂志。</h1>
                <p className="atelier-intro">
                  {siteConfig.description}。这里不是匆忙的信息流，而是经过挑选、归档与长期更新的内容花园。每一篇文章都希望既有结构感，也保留一点温度。
                </p>

                <div className="atelier-action-row">
                  <Link
                    href={`/blog/${heroPost.slug}`}
                    className="atelier-primary-button rounded-full shadow-[var(--shadow-lg)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5"
                  >
                    阅读最新文章
                    <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/about"
                    className="atelier-secondary-button rounded-full border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5"
                  >
                    认识作者
                  </Link>
                </div>

                <div className="atelier-metrics">
                  <div className="atelier-metric-card rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
                    <span>文章存档</span>
                    <strong>{activePosts.length}</strong>
                    <small>持续整理与更新</small>
                  </div>
                  <div className="atelier-metric-card rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
                    <span>主题章节</span>
                    <strong>{topCategories.length}</strong>
                    <small>技术、设计、生活与思考</small>
                  </div>
                  <div className="atelier-metric-card rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)]">
                    <span>标签索引</span>
                    <strong>{totalTags}</strong>
                    <small>便于持续回看与关联阅读</small>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="atelier-feature-wrap"
              >
                <EditorialFeatureCard post={heroPost} pinned={Boolean(heroPinnedPost)} />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="atelier-curation">
          <div className="atelier-shell">
            <div className="atelier-section-head">
              <div>
                <p className="atelier-section-kicker">CURATED&ensp;·&ensp;CHAPTERS</p>
                <h2>精选章节</h2>
              </div>
              <p>
                先从几篇最能代表站点气质的文章开始，再一路顺着分类和标签深入下去。
              </p>
            </div>

            <div className="atelier-curation-grid">
              <Card variant="glass" className="atelier-category-panel rounded-[var(--radius-2xl)]">
                <p className="atelier-panel-kicker">TOP&ensp;·&ensp;CATEGORIES</p>
                <h3>这个博客最近在写什么</h3>
                <div className="atelier-category-list">
                  {topCategories.map(([name, count]) => (
                    <div key={name} className="atelier-category-row">
                      <span>{name}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              </Card>

              {curatedPosts.map((post, index) => (
                <EditorialStoryCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="atelier-feed-section">
          <div className="atelier-shell">
            <div className="atelier-section-head is-feed">
              <div>
                <p className="atelier-section-kicker">LATEST&ensp;·&ensp;DISPATCHES</p>
                <h2>最近更新</h2>
              </div>
              <p>延续同一种审美和秩序感，把最新的文章排成一张更适合慢慢浏览的内容墙。</p>
            </div>

            {loading ? (
              <div className="atelier-feed-grid" aria-label="加载中">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className={clsx('atelier-feed-card atelier-feed-skeleton rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4', item === 1 && 'is-emphasized')}
                  >
                    <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {visiblePosts.length > 0 ? (
                  <div className="atelier-feed-grid">
                    {visiblePosts.map((post, index) => (
                      <EditorialFeedCard key={post.slug} post={post} index={index} emphasized={index === 0} />
                    ))}
                  </div>
                ) : (
                  <StatePanel
                    tone="empty"
                    title="还没有可展示的文章"
                    description="等第一篇文章发布之后，这里会自动生成首页内容墙。"
                    className="mx-auto max-w-2xl"
                  />
                )}

                {canLoadMore && (
                  <div className="atelier-load-wrap">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + 3)}
                      className="atelier-secondary-button rounded-full border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5"
                    >
                      加载更多文章
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="atelier-subscribe-section">
          <div className="atelier-shell">
            <div className="atelier-subscribe-card">
              <div className="atelier-subscribe-copy">
                <p className="atelier-section-kicker">NEWSLETTER&ensp;·&ensp;邮件订阅</p>
                <h2>想第一时间看到新文章，就把这份杂志订到邮箱里。</h2>
                <p>
                  不追求高频打扰，只在真正有新内容、新专题或值得收藏的更新时再发给你。
                </p>
              </div>

              <div className="atelier-subscribe-form">
                <SubscribeForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <AdminFloatButton />
    </div>
  );
}
