'use client';

import { isValidElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, ChevronLeft, Loader2, FileText, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPostBySlug, getPublishedPosts, incrementPostViews, Post } from '@/lib/supabase';
import { formatDate } from '@/lib/types';
import TableOfContents from '@/components/TableOfContents';
import { ShareButtons } from '@/components/ShareButtons';
import PostInteractions from '@/components/PostInteractions';
import { Comments } from '@/components/GiscusComments';
import { getPageStructuredData } from '@/lib/seo';

interface BlogPostPageClientProps {
  slug: string;
}

function headingToId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');
}

function getTextContent(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join('');
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children ?? '');
  }

  return '';
}

function categoryLabel(category: string): string {
  const map: Record<string, string> = {
    tech: '技术',
    design: '设计',
    life: '生活',
    thoughts: '思考',
  };
  return map[category] || category;
}

export default function BlogPostPageClient({ slug }: BlogPostPageClientProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const current = await getPostBySlug(slug);
        if (!current) {
          setPost(null);
          setRelatedPosts([]);
          return;
        }

        setPost(current);

        const allPosts = await getPublishedPosts();
        const related = allPosts
          .filter((item) => item.slug !== current.slug)
          .sort((a, b) => {
            const aScore = a.category === current.category ? 1 : 0;
            const bScore = b.category === current.category ? 1 : 0;
            return bScore - aScore;
          })
          .slice(0, 3);

        setRelatedPosts(related);

        try {
          await incrementPostViews(current.id);
        } catch (trackError) {
          console.warn('文章阅读量更新失败:', trackError);
        }
      } catch (error) {
        console.error('加载文章失败:', error);
        setLoadError('文章加载失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const schemaData = useMemo(() => {
    if (!post) return null;

    return getPageStructuredData('article', {
      title: post.title,
      excerpt: post.description,
      content: post.content,
      created_at: post.published_at || post.created_at,
      updated_at: post.updated_at,
      cover_image: post.cover_image || post.image,
      category: {
        label: categoryLabel(post.category),
      },
      author: {
        name: post.author,
      },
    });
  }, [post]);

  const markdownComponents: Components = {
    h1: ({ children, ...props }) => {
      const id = headingToId(getTextContent(children));
      return (
        <h1 id={id} className="article-h1" {...props}>
          {children}
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = headingToId(getTextContent(children));
      return (
        <h2 id={id} className="article-h2" {...props}>
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = headingToId(getTextContent(children));
      return (
        <h3 id={id} className="article-h3" {...props}>
          {children}
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = headingToId(getTextContent(children));
      return (
        <h4 id={id} className="article-h4" {...props}>
          {children}
        </h4>
      );
    },
    a: ({ children, ...props }) => (
      <a {...props} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
    code: ({ className, children, ...props }) => {
      const code = String(children).replace(/\n$/, '');

      if (!className) {
        return (
          <code className="article-inline-code" {...props}>
            {children}
          </code>
        );
      }

      return (
        <pre className="article-pre">
          <code className={className} {...props}>
            {code}
          </code>
        </pre>
      );
    },
    img: ({ src, alt }) => {
      if (!src || typeof src !== 'string') return null;
      return (
        <span className="block">
          <Image
            src={src}
            alt={alt || '文章图片'}
            width={1200}
            height={675}
            className="article-image h-auto w-full"
          />
        </span>
      );
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">正在加载文章...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/70 p-10 text-center">
          <h1 className="text-2xl font-semibold">加载失败</h1>
          <p className="mt-3 text-muted-foreground">{loadError}</p>
          <Link href="/blog" className="btn-secondary mt-8 inline-flex px-6 py-3">
            返回博客首页
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/70 p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-semibold">文章不存在或已下线</h1>
          <p className="mt-3 text-muted-foreground">你访问的链接可能已失效，试试从博客列表重新进入。</p>
          <Link href="/blog" className="btn-secondary mt-8 inline-flex px-6 py-3">
            返回博客列表
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = post.cover_image || post.image;
  const articleDate = post.published_at || post.created_at;

  return (
    <div className="px-6 py-10 md:py-14">
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}

      <div className="mx-auto max-w-6xl">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          返回文章列表
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur md:p-10"
        >
          <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {categoryLabel(post.category)}
          </div>

          <h1 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{post.title}</h1>

          {post.description && (
            <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">{post.description}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{post.author || '拾光'}</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(articleDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.reading_time || '约 5 分钟'}
            </span>
          </div>

          {coverImage && (
            <div className="relative mt-8 overflow-hidden rounded-2xl border border-border/60 bg-secondary/50">
              <Image
                src={coverImage}
                alt={post.title}
                width={1400}
                height={760}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}
        </motion.header>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/60 px-5 py-4">
          <PostInteractions postId={post.id} />
          <ShareButtons
            url={shareUrl || `/blog/${post.slug}`}
            title={post.title}
            description={post.description}
          />
        </div>

        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
          <article className="article-content rounded-3xl border border-border/70 bg-card/70 p-6 md:p-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {post.content || ''}
            </ReactMarkdown>
          </article>

          <aside>
            <TableOfContents content={post.content || ''} className="xl:pl-2" />
          </aside>
        </div>

        <section className="mt-14 rounded-3xl border border-border/70 bg-card/70 p-6 md:p-8">
          <h2 className="text-2xl font-semibold">评论区</h2>
          <p className="mt-2 text-sm text-muted-foreground">欢迎分享你的观点或补充你的实践经验。</p>
          <Comments />
        </section>

        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">继续阅读</h2>
              <Link href="/blog" className="text-sm text-primary hover:underline">
                查看全部
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {relatedPosts.map((item, index) => {
                const itemImage = item.cover_image || item.image;
                const itemDate = item.published_at || item.created_at;

                return (
                  <motion.article
                    key={item.slug}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ delay: index * 0.08 }}
                    className="overflow-hidden rounded-2xl border border-border/60 bg-card/80"
                  >
                    <Link href={`/blog/${item.slug}`}>
                      <div className="relative h-40 w-full bg-secondary/60">
                        {itemImage ? (
                          <Image src={itemImage} alt={item.title} fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-secondary to-secondary/60" />
                        )}
                      </div>

                      <div className="p-4">
                        <p className="text-xs text-muted-foreground">{categoryLabel(item.category)}</p>
                        <h3 className="mt-1 line-clamp-2 text-base font-semibold">{item.title}</h3>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(itemDate)}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                          阅读文章
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
