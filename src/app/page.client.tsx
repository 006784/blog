'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronRight, Code2, Coffee, MessageCircle, Palette, PenTool, Sparkles } from 'lucide-react';
import { BlogCard } from '@/components/BlogCard';
import { AnimatedSection } from '@/components/Animations';
import { getPageStructuredData } from '@/lib/seo';
import { getPublishedPosts, Post } from '@/lib/supabase';

const features = [
  {
    icon: Code2,
    title: '工程实践',
    description: '记录前端、后端与架构经验，聚焦可复用的解决方案。',
    accent: 'from-sky-500 to-cyan-500',
  },
  {
    icon: Palette,
    title: '设计系统',
    description: '沉淀 UI 规范与交互策略，让产品在细节上更统一。',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Coffee,
    title: '生活观察',
    description: '关于阅读、创作与日常思考，记录长期主义的节奏。',
    accent: 'from-amber-500 to-orange-500',
  },
];

export default function HomePageClient() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 360], [1, 0.25]);
  const heroY = useTransform(scrollY, [0, 360], [0, 72]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const data = await getPublishedPosts();
        setPosts(data.slice(0, 4));
      } catch (error) {
        console.error('加载文章失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const formattedPosts = posts.map((post) => ({
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

  const websiteSchema = getPageStructuredData('homepage');

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <section className="relative overflow-hidden px-6 pb-20 pt-24 md:pb-28 md:pt-32">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(56,189,248,0.3)_0%,_rgba(56,189,248,0)_70%)]" />
          <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(251,146,60,0.28)_0%,_rgba(251,146,60,0)_70%)]" />
          <div className="studio-grid absolute inset-0" />
        </div>

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative mx-auto max-w-6xl">
          <div className="surface-hero overflow-hidden p-7 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-kicker"
          >
            <Sparkles className="h-4 w-4 text-cyan-500" />
            <span>设计升级版首页</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="apple-display mt-6 max-w-5xl"
          >
            把想法写成作品，
            <span className="mt-2 block gradient-text">把作品沉淀成体系。</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-soft mt-6 max-w-2xl text-base md:text-lg"
          >
            这个站点聚焦技术、设计与创作流程，持续更新可落地的方法论和长期实践记录。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href="/blog" className="btn-primary px-7 py-3.5">
              <span className="inline-flex items-center gap-2">
                <PenTool className="h-4 w-4" />
                开始阅读
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/contact" className="btn-secondary px-7 py-3.5">
              <span className="inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                联系交流
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 grid grid-cols-3 gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur md:max-w-xl"
          >
            <div>
              <p className="text-2xl font-semibold tracking-tight">{posts.length || 0}+</p>
              <p className="text-soft text-xs">近期文章</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">3</p>
              <p className="text-soft text-xs">核心方向</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">持续更新</p>
              <p className="text-soft text-xs">长期维护</p>
            </div>
          </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-soft text-sm uppercase tracking-[0.2em]">Focus Areas</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">我在写什么</h2>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                className="surface-card interactive-card group p-6"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.accent} text-white`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-soft mt-3 text-sm leading-7">{feature.description}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm text-foreground/80">
                  了解更多
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-soft text-sm uppercase tracking-[0.2em]">Latest Notes</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">最新文章</h2>
              </div>
              <Link href="/blog" className="btn-ghost px-5 py-2.5 text-sm">
                查看全部
              </Link>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-[360px] animate-pulse rounded-3xl border border-border/60 bg-card/60" />
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {formattedPosts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <BlogCard post={post} index={index} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
