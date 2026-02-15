'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Bell, Calendar, Clock, Edit2, Eye, Tag, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { APPLE_EASE, APPLE_EASE_SOFT, APPLE_SPRING_GENTLE, HOVER_BUTTON, TAP_BUTTON } from './Animations';
import { useAdmin } from './AdminProvider';
import { Post, formatDate } from '@/lib/types';

interface BlogCardProps {
  post: Post;
  index?: number;
  featured?: boolean;
  onDelete?: (slug: string) => void;
  onNotify?: (post: Post) => void;
}

const categoryStyle: Record<string, { chip: string; glow: string }> = {
  tech: {
    chip: 'bg-sky-500/14 text-sky-700 border-sky-300/45 dark:text-sky-200',
    glow: 'radial-gradient(360px circle at 62% 26%, rgba(56,189,248,0.12), transparent 72%)',
  },
  design: {
    chip: 'bg-teal-500/14 text-teal-700 border-teal-300/45 dark:text-teal-200',
    glow: 'radial-gradient(360px circle at 62% 26%, rgba(20,184,166,0.1), transparent 72%)',
  },
  life: {
    chip: 'bg-emerald-500/14 text-emerald-700 border-emerald-300/45 dark:text-emerald-200',
    glow: 'radial-gradient(360px circle at 62% 26%, rgba(16,185,129,0.1), transparent 72%)',
  },
  thoughts: {
    chip: 'bg-amber-500/14 text-amber-700 border-amber-300/45 dark:text-amber-200',
    glow: 'radial-gradient(360px circle at 62% 26%, rgba(245,158,11,0.12), transparent 72%)',
  },
};

export function BlogCard({ post, index = 0, featured = false, onDelete, onNotify }: BlogCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const { isAdmin } = useAdmin();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 105, damping: 20, mass: 1.08 });
  const sy = useSpring(my, { stiffness: 105, damping: 20, mass: 1.08 });
  const rotateX = useTransform(sy, [-0.5, 0.5], ['1.2deg', '-1.2deg']);
  const rotateY = useTransform(sx, [-0.5, 0.5], ['-1.2deg', '1.2deg']);

  const style = categoryStyle[post.category] || {
    chip: 'bg-zinc-500/14 text-zinc-700 border-zinc-300/45 dark:text-zinc-200',
    glow: 'radial-gradient(360px circle at 62% 26%, rgba(148,163,184,0.12), transparent 72%)',
  };

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (featured || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    mx.set(px);
    my.set(py);
  };

  const onMouseLeave = () => {
    setHovered(false);
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 26, filter: 'blur(7px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: APPLE_EASE }}
      style={{
        rotateX: featured ? undefined : rotateX,
        rotateY: featured ? undefined : rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onMouseLeave}
      className={clsx(
        'surface-card premium-blog-card interactive-card group relative overflow-hidden rounded-[1.7rem]',
        featured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: style.glow }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/8 to-transparent opacity-70 dark:from-white/[0.03]" />

      <Link href={`/blog/${post.slug}`} className="relative z-10 block h-full">
        <div className={clsx('relative overflow-hidden', featured ? 'h-64 md:h-full' : 'h-56')}>
          {post.image ? (
            <motion.div whileHover={{ scale: 1.045 }} transition={{ duration: 0.8, ease: APPLE_EASE }}>
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </motion.div>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-secondary via-secondary/70 to-secondary/30" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/16 to-transparent opacity-62 transition-opacity duration-500 group-hover:opacity-54" />

          <span
            className={clsx(
              'absolute left-5 top-5 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.02em] backdrop-blur-xl',
              style.chip
            )}
          >
            {post.category}
          </span>

          <motion.div
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -8 }}
            transition={{ duration: 0.24, ease: APPLE_EASE }}
            className="absolute right-4 top-4 flex items-center gap-2"
          >
            {isAdmin && onNotify && (
              <motion.button
                whileHover={HOVER_BUTTON}
                whileTap={TAP_BUTTON}
                transition={APPLE_SPRING_GENTLE}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onNotify(post);
                }}
                className="ios-button-press inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-white backdrop-blur-xl hover:bg-emerald-500/85"
                title="推送通知"
              >
                <Bell className="h-4 w-4" />
              </motion.button>
            )}

            {isAdmin && (
              <Link href={`/write?edit=${post.slug}`} onClick={(event) => event.stopPropagation()}>
                <motion.span
                  whileHover={HOVER_BUTTON}
                  whileTap={TAP_BUTTON}
                  transition={APPLE_SPRING_GENTLE}
                  className="ios-button-press inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-white backdrop-blur-xl hover:bg-primary/85"
                >
                  <Edit2 className="h-4 w-4" />
                </motion.span>
              </Link>
            )}

            {isAdmin && onDelete && (
              <motion.button
                whileHover={HOVER_BUTTON}
                whileTap={TAP_BUTTON}
                transition={APPLE_SPRING_GENTLE}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete(post.slug);
                }}
                className="ios-button-press inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/20 text-white backdrop-blur-xl hover:bg-rose-500/85"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            )}

            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/35 bg-white/15 text-white backdrop-blur-xl">
              <Eye className="h-4 w-4" />
            </span>
          </motion.div>
        </div>

        <div className="relative flex flex-col p-7" style={{ transform: 'translateZ(34px)' }}>
          <h3 className={clsx('font-semibold leading-tight tracking-tight', featured ? 'text-xl md:text-2xl' : 'text-lg')}>
            {post.title}
          </h3>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground transition-colors duration-300 group-hover:text-foreground/85">
            {post.description}
          </p>

          <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="chip-filter !text-[0.72rem]">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {formatDate(post.date)}
            </span>
            <span className="chip-filter !text-[0.72rem]">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {post.readingTime}
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag, tagIndex) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 + tagIndex * 0.05, ease: APPLE_EASE }}
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-secondary/45 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </motion.span>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border/45 pt-5">
            <motion.span
              whileHover={{ x: 3 }}
              transition={APPLE_SPRING_GENTLE}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary"
            >
              阅读全文
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <ArrowRight className="h-4 w-4" />
              </span>
            </motion.span>

            <motion.span
              initial={{ scaleX: 0.15, opacity: 0.45 }}
              whileHover={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: APPLE_EASE_SOFT }}
              className="h-[2px] w-28 origin-left rounded-full bg-gradient-to-r from-sky-500/65 to-blue-600/65"
            />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden rounded-[1.7rem]">
      <div className="relative h-56 overflow-hidden bg-secondary/80">
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }}
          animate={{ x: ['-120%', '180%'] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="space-y-4 p-7">
        <div className="h-6 w-3/4 rounded-xl bg-secondary/70" />
        <div className="h-4 rounded-xl bg-secondary/65" />
        <div className="flex gap-3 pt-1">
          <div className="h-7 w-24 rounded-full bg-secondary/60" />
          <div className="h-7 w-20 rounded-full bg-secondary/60" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-7 w-14 rounded-full bg-secondary/55" />
          <div className="h-7 w-20 rounded-full bg-secondary/55" />
          <div className="h-7 w-16 rounded-full bg-secondary/55" />
        </div>
      </div>
    </div>
  );
}
