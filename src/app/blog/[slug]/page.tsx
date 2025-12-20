'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag, Share2, Twitter, Facebook, Linkedin, Copy, Check, ChevronUp, Loader2, Eye, Type } from 'lucide-react';
import { AnimatedSection } from '@/components/Animations';
import { getPostBySlug, incrementPostViews, formatDate, Post } from '@/lib/supabase';
import { useFont } from '@/components/FontProvider';
import { FontSettings } from '@/components/FontSettings';
import { markdownComponents } from '@/components/CodeBlock';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const { currentFont, fontSize, lineHeight } = useFont();

  useEffect(() => {
    loadPost();
  }, [resolvedParams.slug]);

  async function loadPost() {
    try {
      setLoading(true);
      // 解码 URL 编码的 slug（处理中文等特殊字符）
      const decodedSlug = decodeURIComponent(resolvedParams.slug);
      const data = await getPostBySlug(decodedSlug);
      setPost(data);
      if (data) {
        incrementPostViews(data.id);
      }
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

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

  const categoryNames: Record<string, string> = {
    tech: '技术',
    design: '设计',
    life: '生活',
    thoughts: '思考',
  };

  return (
    <article className="min-h-screen">
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        {post.cover_image || post.image ? (
          <Image
            src={post.cover_image || post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
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
                {categoryNames[post.category] || post.category}
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
              {formatDate(post.published_at || post.created_at)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              {post.reading_time}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground text-sm">
              <Eye className="w-4 h-4" />
              {post.views} 阅读
            </span>
          </div>
        </AnimatedSection>

        {/* Content */}
        <AnimatedSection delay={0.1}>
          <div 
            className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:bg-secondary prose-pre:border prose-pre:border-border"
            style={{
              fontFamily: currentFont.family,
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
            }}
          >
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {post.content}
            </ReactMarkdown>
          </div>
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

      {/* Font settings button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowFontSettings(true)}
        className="fixed bottom-8 right-24 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center z-50 hover:border-primary transition-colors"
        title="阅读设置"
      >
        <Type className="w-5 h-5" />
      </motion.button>

      {/* Font settings panel */}
      <FontSettings isOpen={showFontSettings} onClose={() => setShowFontSettings(false)} />
    </article>
  );
}
