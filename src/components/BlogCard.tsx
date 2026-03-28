'use client';

import { type CSSProperties, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bell, Calendar, Clock3, Edit2, Eye, Sparkles, Tag, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { APPLE_EASE, APPLE_SPRING_GENTLE, HOVER_BUTTON, TAP_BUTTON } from './Animations';
import { useAdmin } from './AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Post, formatDate } from '@/lib/types';

interface BlogCardPost extends Post {
  isDemo?: boolean;
}

interface BlogCardProps {
  post: BlogCardPost;
  index?: number;
  featured?: boolean;
  onDelete?: (slug: string) => void;
  onNotify?: (post: BlogCardPost) => void;
}

const categoryStyle: Record<
  string,
  {
    label: string;
    accent: string;
    accentSoft: string;
    accentDeep: string;
    chip: string;
  }
> = {
  tech: {
    label: '技术',
    accent: '#3c78d8',
    accentSoft: 'rgba(60, 120, 216, 0.14)',
    accentDeep: '#1f4ea7',
    chip: 'rgba(60, 120, 216, 0.16)',
  },
  design: {
    label: '设计',
    accent: '#df7b4c',
    accentSoft: 'rgba(223, 123, 76, 0.16)',
    accentDeep: '#a8512b',
    chip: 'rgba(223, 123, 76, 0.18)',
  },
  life: {
    label: '生活',
    accent: '#45a58d',
    accentSoft: 'rgba(69, 165, 141, 0.16)',
    accentDeep: '#2d7b67',
    chip: 'rgba(69, 165, 141, 0.18)',
  },
  thoughts: {
    label: '思考',
    accent: '#ae5e39',
    accentSoft: 'rgba(174, 94, 57, 0.15)',
    accentDeep: '#7f4125',
    chip: 'rgba(174, 94, 57, 0.18)',
  },
};

function getCategoryStyle(category: string) {
  return (
    categoryStyle[category] || {
      label: category,
      accent: '#8b6f47',
      accentSoft: 'rgba(139, 111, 71, 0.16)',
      accentDeep: '#6c5331',
      chip: 'rgba(139, 111, 71, 0.18)',
    }
  );
}

export function BlogCard({ post, index = 0, featured = false, onDelete, onNotify }: BlogCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const { isAdmin } = useAdmin();
  const palette = getCategoryStyle(post.category);

  const frameStyle = {
    '--blog-card-accent': palette.accent,
    '--blog-card-accent-soft': palette.accentSoft,
    '--blog-card-accent-deep': palette.accentDeep,
    '--blog-card-chip': palette.chip,
  } as CSSProperties;

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 26, filter: 'blur(7px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.62, delay: index * 0.06, ease: APPLE_EASE }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={frameStyle}
      className={clsx(
        'premium-blog-card ground-news-card group relative overflow-hidden rounded-[1.7rem] transition-[transform,box-shadow] duration-[var(--duration-normal)]',
        featured && 'is-featured'
      )}
    >
      {(isAdmin && !post.isDemo) && (
        <motion.div
          initial={false}
          animate={{ opacity: hovered ? 1 : 0.92, y: hovered ? 0 : -2 }}
          transition={{ duration: 0.22, ease: APPLE_EASE }}
          className="ground-news-card-actions"
        >
          {onNotify && (
            <motion.button
              whileHover={HOVER_BUTTON}
              whileTap={TAP_BUTTON}
              transition={APPLE_SPRING_GENTLE}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onNotify(post);
              }}
              className="ground-news-card-action hover:bg-emerald-500/85"
              title="推送通知"
            >
              <Bell className="h-4 w-4" />
            </motion.button>
          )}

          <Link href={`/write?edit=${post.slug}`} onClick={(event) => event.stopPropagation()}>
            <motion.span
              whileHover={HOVER_BUTTON}
              whileTap={TAP_BUTTON}
              transition={APPLE_SPRING_GENTLE}
              className="ground-news-card-action hover:bg-primary/85"
            >
              <Edit2 className="h-4 w-4" />
            </motion.span>
          </Link>

          {onDelete && (
            <motion.button
              whileHover={HOVER_BUTTON}
              whileTap={TAP_BUTTON}
              transition={APPLE_SPRING_GENTLE}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(post.slug);
              }}
              className="ground-news-card-action hover:bg-rose-500/85"
              title="删除文章"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
      )}

      <Link href={`/blog/${post.slug}`} className="ground-news-card-link relative z-10 block h-full">
        <div className="ground-news-card-shell">
          <div className="ground-news-card-topline">
            <span className="ground-news-card-kicker">
              {featured ? 'Feature story' : 'Archive story'}
            </span>
            <div className="ground-news-card-topline-right">
              {post.isDemo && (
                <span className="ground-news-card-demo">
                  <Sparkles className="h-3 w-3" />
                  示例
                </span>
              )}
              <span className="ground-news-card-label">{palette.label}</span>
            </div>
          </div>

          <div className={clsx('ground-news-card-media', featured && 'is-featured')}>
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover"
                sizes={
                  featured
                    ? '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw'
                    : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                }
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-secondary via-secondary/70 to-secondary/40" />
            )}
            <div className="ground-news-card-media-overlay" />
          </div>

          <div className="ground-news-card-body">
            <div className="ground-news-card-title-row">
              <h3 className={clsx('ground-news-card-title', featured && 'is-featured')}>
                {post.title}
              </h3>
              <span className="ground-news-card-view">
                <Eye className="h-3.5 w-3.5" />
              </span>
            </div>

            <p className="ground-news-card-description">{post.description}</p>

            {post.tags.length > 0 && (
              <div className="ground-news-card-tags">
                {post.tags.slice(0, featured ? 4 : 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="soft"
                    className="ground-news-card-tag"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="ground-news-card-footer">
            <div className="ground-news-card-footer-cell is-primary">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(post.date)}</span>
            </div>
            <div className="ground-news-card-footer-cell is-secondary">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          <div className="ground-news-card-cta">
            <span>阅读全文</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="ground-news-card rounded-[1.7rem]">
      <div className="ground-news-card-shell">
        <div className="ground-news-card-topline">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-56 w-full rounded-[1.25rem]" />
        <div className="space-y-3 py-4">
          <Skeleton className="h-8 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
