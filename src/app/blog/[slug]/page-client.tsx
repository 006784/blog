'use client';

import { isValidElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, ChevronLeft, Loader2, FileText, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  filterRenderablePosts,
  getSamplePostBySlug,
  getSamplePosts,
  toPublicCatalogPost,
  toPublicCatalogPosts,
  type PublicCatalogPost,
} from '@/lib/sample-posts';
import { getPublicPostBySlug, getPublishedPosts, incrementPostViews } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { formatDate } from '@/lib/types';
import TableOfContents from '@/components/TableOfContents';
import { ShareButtons } from '@/components/ShareButtons';
import PostInteractions from '@/components/PostInteractions';
import { Comments } from '@/components/GiscusComments';
import { getPageStructuredData } from '@/lib/seo';
import { PostReadingMemory } from '@/components/post/PostReadingMemory';
import { siteConfig } from '@/lib/site-config';

interface BlogPostPageClientProps {
  slug: string;
}

function CodeBlock({ lang, highlighted, raw }: { lang: string; highlighted: string; raw: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(raw).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="article-pre-wrapper" data-lang={lang || 'code'}>
      <button type="button" className="article-copy-btn" onClick={handleCopy} aria-label="复制代码">
        {copied ? '已复制' : '复制'}
      </button>
      <pre className="article-pre">
        <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
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
  const [post, setPost] = useState<PublicCatalogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<PublicCatalogPost[]>([]);
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
        const livePost = await getPublicPostBySlug(slug);
        const current = livePost ? toPublicCatalogPost(livePost) : getSamplePostBySlug(slug);
        if (!current) {
          setPost(null);
          setRelatedPosts([]);
          return;
        }

        setPost(current);

        const allPosts = current.is_demo
          ? getSamplePosts()
          : filterRenderablePosts(toPublicCatalogPosts(await getPublishedPosts()));
        const related = allPosts
          .filter((item) => item.slug !== current.slug)
          .sort((a, b) => {
            const aScore = a.category === current.category ? 1 : 0;
            const bScore = b.category === current.category ? 1 : 0;
            return bScore - aScore;
          })
          .slice(0, 3);

        setRelatedPosts(related);

        if (!current.is_demo) {
          try {
          await incrementPostViews(current.id);
          } catch (trackError) {
            console.warn('文章阅读量更新失败:', trackError);
          }
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

      const lang = className.replace('language-', '');
      const grammar = Prism.languages[lang];
      const highlighted = grammar
        ? Prism.highlight(code, grammar, lang)
        : code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return (
        <CodeBlock lang={lang} highlighted={highlighted} raw={code} />
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
          <Card variant="elevated" padding="lg" className="space-y-6 rounded-[var(--radius-2xl)]">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">正在加载文章...</p>
            </div>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-[24rem] w-full rounded-[var(--radius-xl)]" />
          </Card>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <StatePanel
            tone="error"
            title="加载失败"
            description={loadError}
            icon={<FileText className="h-6 w-6" />}
            action={
              <Link href="/blog">
                <Button variant="secondary">返回博客首页</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <StatePanel
            tone="empty"
            title="文章不存在或已下线"
            description="你访问的链接可能已失效，试试从博客列表重新进入。"
            icon={<FileText className="h-6 w-6" />}
            action={
              <Link href="/blog">
                <Button variant="secondary">返回博客列表</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const coverImage = post.cover_image || post.image;
  const articleDate = post.published_at || post.created_at;

  return (
    <div className="px-6 py-10 md:py-14">
      {/* 阅读位置记忆 */}
      <PostReadingMemory slug={slug} />

      {schemaData && (
        <Script id={`article-structured-data-${slug}`} type="application/ld+json">
          {JSON.stringify(schemaData)}
        </Script>
      )}

      <div className="mx-auto max-w-6xl">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-2 text-sm text-muted-foreground shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          返回文章列表
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-6 shadow-[var(--shadow-lg)] backdrop-blur md:p-10"
        >
          <Badge className="mb-4 px-3 py-1">
            {categoryLabel(post.category)}
          </Badge>

          <h1 className="max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{post.title}</h1>

          {post.description && (
            <p className="mt-4 max-w-3xl text-base text-muted-foreground md:text-lg">{post.description}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="outline" className="px-3 py-1.5 font-normal">
              {post.author || siteConfig.name}
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-3 py-1.5 shadow-[var(--shadow-xs)]">
              <Calendar className="h-4 w-4" />
              {formatDate(articleDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-3 py-1.5 shadow-[var(--shadow-xs)]">
              <Clock className="h-4 w-4" />
              {post.reading_time || '约 5 分钟'}
            </span>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="soft">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {coverImage && (
            <div className="relative mt-8 overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-secondary/50 shadow-[var(--shadow-sm)]">
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

        <Card variant="default" className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-xl)] px-5 py-4">
          <PostInteractions postId={post.id} />
          <ShareButtons
            url={shareUrl || `/blog/${post.slug}`}
            title={post.title}
            description={post.description}
          />
        </Card>

        <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Card variant="elevated" className="article-content rounded-[var(--radius-2xl)] md:p-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {post.content || ''}
            </ReactMarkdown>
          </Card>

          <aside>
            <TableOfContents content={post.content || ''} className="xl:pl-2" />
          </aside>
        </div>

        <Card variant="elevated" className="mt-14 rounded-[var(--radius-2xl)] md:p-8">
          <h2 className="text-2xl font-semibold">评论区</h2>
          <p className="mt-2 text-sm text-muted-foreground">欢迎分享你的观点或补充你的实践经验。</p>
          <Comments />
        </Card>

        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">继续阅读</h2>
              <Link href="/blog">
                <Button variant="link">查看全部</Button>
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
                    className="overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
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
                        <Badge variant="soft" className="text-[0.7rem]">
                          {categoryLabel(item.category)}
                        </Badge>
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
