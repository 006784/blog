'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Clock3, Search } from 'lucide-react';
import clsx from 'clsx';
import { getPageStructuredData } from '@/lib/seo';
import { defaultPosts, formatDate, type Post as LocalPost } from '@/lib/types';
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
}

const navItems = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/blog' },
  { name: '关于', href: '/about' },
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

function normalizePost(post: SupabasePost | LocalPost, index: number): HomePost {
  if ('created_at' in post) {
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
    };
  }

  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    category: getCategoryLabel(post.category),
    tags: Array.isArray(post.tags) ? post.tags : [],
    image: post.image || fallbackImages[index % fallbackImages.length],
    readingTime: post.readingTime || '5 分钟',
    isPinned: false,
    pinnedAt: null,
  };
}

const fallbackHomePosts = defaultPosts.map((post, index) => normalizePost(post, index));

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
    <div className={clsx('frost-image-shell', className, loaded && 'is-loaded')}>
      <span className="frost-image-placeholder" />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="frost-image"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function FrostFeedCard({ post, index }: { post: HomePost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="frost-glass-card frost-feed-card"
    >
      <Link href={`/blog/${post.slug}`} className="frost-card-link">
        <ProgressiveImage
          src={post.image}
          alt={post.title}
          className="frost-feed-thumb"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        <div className="frost-feed-content">
          <h3 className="frost-feed-title">{post.title}</h3>
          <p className="frost-feed-desc">{post.description}</p>

          <div className="frost-tag-row">
            {post.tags.slice(0, 3).map((tag, tagIndex) => (
              <span key={`${post.slug}-${tag}`} className={clsx('frost-tag', tagIndex % 2 === 0 ? 'is-blue' : 'is-sage')}>
                {tag}
              </span>
            ))}
          </div>

          <div className="frost-meta-line frost-meta-line-card">
            <span>
              <CalendarDays strokeWidth={1.5} className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>
            <span>
              <Clock3 strokeWidth={1.5} className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function HomePageClient() {
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
    document.body.classList.add('frost-home-route');
    return () => {
      document.body.classList.remove('frost-home-route');
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      try {
        const data = await getPublishedPosts();

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
        if (mounted) {
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
  }, []);

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
  const heroPost = activePosts[0];
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
  const heroMediaPost = heroPinnedPost || heroPost;
  const feedPosts = useMemo(() => activePosts.slice(1), [activePosts]);
  const visiblePosts = useMemo(() => feedPosts.slice(0, visibleCount), [feedPosts, visibleCount]);
  const canLoadMore = visibleCount < feedPosts.length;

  const navStyle = useMemo(
    () =>
      ({
        '--frost-nav-blur': `${5 + scrollRatio * 10}px`,
        '--frost-nav-bg': `rgba(255, 255, 255, ${0.4 + scrollRatio * 0.25})`,
      }) as CSSProperties,
    [scrollRatio]
  );

  return (
    <div className="frost-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />

      <div className="frost-home-decor" aria-hidden>
        <span className="frost-geo frost-geo-one" />
        <span className="frost-geo frost-geo-two" />
        <span className="frost-bokeh frost-bokeh-one" />
        <span className="frost-bokeh frost-bokeh-two" />
      </div>

      <header className="frost-nav" style={navStyle}>
        <div className="frost-shell">
          <div className="frost-nav-grid">
            <Link href="/" className="frost-brand">
              拾光博客
            </Link>

            <nav className="frost-nav-links" aria-label="主导航">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="frost-link">
                  {item.name}
                </Link>
              ))}

              <Link href="/blog?search=1" className="frost-search-link" aria-label="搜索文章">
                <Search strokeWidth={1.5} className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="frost-main">
        <section className="frost-hero-section">
          <div className="frost-shell">
            <div className="frost-grid frost-hero-grid">
              <motion.article
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="frost-hero-copy"
              >
                <p className="frost-meta-line frost-meta-line-hero">
                  <span>
                    <CalendarDays strokeWidth={1.5} className="h-3.5 w-3.5" />
                    {formatDate(heroPost.date)}
                  </span>
                  <span>
                    <Clock3 strokeWidth={1.5} className="h-3.5 w-3.5" />
                    {heroPost.readingTime}
                  </span>
                  <span>{heroPost.category}</span>
                </p>

                <h1 className="frost-hero-title">{heroPost.title}</h1>
                <p className="frost-hero-desc">{heroPost.description}</p>

                <Link href={`/blog/${heroPost.slug}`} className="frost-outline-btn frost-link-inline">
                  阅读更多
                  <ArrowRight strokeWidth={1.5} className="h-4 w-4" />
                </Link>
              </motion.article>

              <motion.div
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="frost-hero-media-wrap"
              >
                <Link href={`/blog/${heroMediaPost.slug}`} className="frost-glass-card frost-hero-media">
                  {heroPinnedPost && <span className="frost-pinned-badge">置顶封面</span>}
                  <ProgressiveImage
                    src={heroMediaPost.image}
                    alt={heroMediaPost.title}
                    className="frost-hero-image"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="frost-feed-section">
          <div className="frost-shell">
            <div className="frost-feed-head">
              <h2>最新文章</h2>
              <p>低饱和度影像与毛玻璃卡片，适合长期阅读。</p>
            </div>

            {loading ? (
              <div className="frost-grid frost-feed-grid" aria-label="加载中">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="frost-glass-card frost-feed-card frost-skeleton" />
                ))}
              </div>
            ) : (
              <>
                <div className="frost-grid frost-feed-grid">
                  {visiblePosts.map((post, index) => (
                    <FrostFeedCard key={post.slug} post={post} index={index} />
                  ))}
                </div>

                {canLoadMore && (
                  <div className="frost-load-wrap">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((count) => count + 4)}
                      className="frost-load-more"
                    >
                      加载更多
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
