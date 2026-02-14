'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Tag, Eye, Sparkles, Edit2, Trash2, Bell } from 'lucide-react';
import { Post, formatDate } from '@/lib/types';
import { useAdmin } from './AdminProvider';
import clsx from 'clsx';
import { useRef, useState } from 'react';

interface BlogCardProps {
  post: Post;
  index?: number;
  featured?: boolean;
  onDelete?: (slug: string) => void;
  onNotify?: (post: Post) => void;
}

export function BlogCard({ post, index = 0, featured = false, onDelete, onNotify }: BlogCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { isAdmin } = useAdmin();
  
  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const categoryColors: Record<string, { 
    bg: string; 
    text: string; 
    glow: string;
    gradient: string;
    shadow: string;
  }> = {
    tech: { 
      bg: 'bg-blue-500/10 dark:bg-blue-400/15', 
      text: 'text-blue-600 dark:text-blue-400',
      glow: 'group-hover:shadow-blue-500/30',
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'rgba(59, 130, 246, 0.4)',
    },
    design: { 
      bg: 'bg-purple-500/10 dark:bg-purple-400/15', 
      text: 'text-purple-600 dark:text-purple-400',
      glow: 'group-hover:shadow-purple-500/30',
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'rgba(168, 85, 247, 0.4)',
    },
    life: { 
      bg: 'bg-emerald-500/10 dark:bg-emerald-400/15', 
      text: 'text-emerald-600 dark:text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/30',
      gradient: 'from-emerald-500 to-teal-500',
      shadow: 'rgba(16, 185, 129, 0.4)',
    },
    thoughts: { 
      bg: 'bg-amber-500/10 dark:bg-amber-400/15', 
      text: 'text-amber-600 dark:text-amber-400',
      glow: 'group-hover:shadow-amber-500/30',
      gradient: 'from-amber-500 to-orange-500',
      shadow: 'rgba(245, 158, 11, 0.4)',
    },
  };

  const colors = categoryColors[post.category] || { 
    bg: 'bg-gray-500/10', 
    text: 'text-gray-500',
    glow: 'group-hover:shadow-gray-500/20',
    gradient: 'from-gray-500 to-gray-600',
    shadow: 'rgba(107, 114, 128, 0.4)',
  };

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.1,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
      style={{
        rotateX: featured ? undefined : rotateX,
        rotateY: featured ? undefined : rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={featured ? undefined : handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'surface-card interactive-card group relative overflow-hidden',
        'rounded-[1.75rem] transition-all duration-500',
        featured ? 'md:col-span-2 md:grid md:grid-cols-2' : ''
      )}
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] p-[1px] opacity-70">
        <motion.div
          className="absolute inset-[-100%] opacity-0 transition-opacity duration-500 group-hover:opacity-60"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(56,189,248,0.7) 60deg, rgba(249,115,22,0.65) 130deg, transparent 210deg)',
          }}
          animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-[1px] rounded-[calc(1.75rem-1px)] bg-background/95 dark:bg-zinc-900/90" />
      </div>

      {/* Glass background with gradient */}
      <div className="absolute inset-[1px] rounded-[calc(1.75rem-1px)] bg-gradient-to-br from-white/[0.07] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:from-white/[0.03]" />

      {/* Mouse follow glow effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(420px circle at 52% 32%, ${colors.shadow}, transparent 58%)` }}
      />

      <Link href={`/blog/${post.slug}`} className="block h-full relative z-10">
        {/* Image Container */}
        <div className={clsx(
          'relative overflow-hidden',
          featured ? 'h-64 md:h-full' : 'h-56'
        )}>
          {/* Image with zoom effect */}
          <motion.div
            className="h-full w-full"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
          >
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </motion.div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />
          
          {/* Animated shine sweep */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            initial={{ x: '-100%' }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 60%)',
            }}
          />
          
          {/* Category badge - enhanced */}
          <motion.div 
            className="absolute top-5 left-5"
            initial={{ opacity: 0, x: -20, scale: 0.8 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
          >
            <span className={clsx(
              'px-4 py-2 rounded-full text-xs font-bold backdrop-blur-xl',
              'border border-white/20 shadow-lg',
              'bg-gradient-to-r', colors.gradient,
              'text-white'
            )}>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
              </span>
            </span>
          </motion.div>

          {/* Read indicator - enhanced */}
          <motion.div
            className="absolute top-5 right-5 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
          >
            {/* 管理员操作按钮 */}
            {isAdmin && (
              <>
                {/* 推送通知按钮 */}
                {onNotify && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onNotify(post);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg hover:bg-green-500/80 transition-colors"
                    title="推送通知"
                  >
                    <Bell className="w-4 h-4 text-white" />
                  </motion.button>
                )}
                <Link href={`/write?edit=${post.slug}`} onClick={(e) => e.stopPropagation()}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg hover:bg-primary/80 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-white" />
                  </motion.div>
                </Link>
                {onDelete && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(post.slug);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg hover:bg-red-500/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>
                )}
              </>
            )}
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
              <motion.div
                animate={{ rotate: isHovered ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Eye className="w-4 h-4 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Featured badge */}
          {featured && (
            <motion.div
              className="absolute bottom-5 left-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/30">
                ⭐ 精选文章
              </span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-7 flex flex-col relative" style={{ transform: 'translateZ(50px)' }}>
          {/* Title - enhanced */}
          <motion.h3 
            className={clsx(
              'font-bold text-foreground leading-tight',
              featured ? 'text-xl md:text-2xl' : 'text-lg'
            )}
          >
            <span className="relative">
              {post.title}
              <motion.span 
                className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              />
            </span>
          </motion.h3>
          
          {/* Description */}
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed line-clamp-2 group-hover:text-foreground/80 transition-colors duration-300">
            {post.description}
          </p>

          {/* Meta - enhanced */}
          <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
            <motion.span 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              {formatDate(post.date)}
            </motion.span>
            <motion.span 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              {post.readingTime}
            </motion.span>
          </div>

          {/* Tags - enhanced */}
          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag, tagIndex) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.1 + tagIndex * 0.05 + 0.4,
                    type: 'spring',
                    stiffness: 200
                  }}
                  whileHover={{ scale: 1.1, y: -3 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 
                    bg-gradient-to-r from-secondary/80 to-secondary/50 
                    hover:from-primary/20 hover:to-primary/10
                    backdrop-blur-sm rounded-full text-xs font-medium
                    text-muted-foreground hover:text-primary 
                    border border-border/50 hover:border-primary/30
                    transition-all duration-300 cursor-default
                    shadow-sm hover:shadow-md hover:shadow-primary/10"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </motion.span>
              ))}
            </div>
          )}

          {/* Read more - enhanced */}
          <motion.div 
            className="mt-6 pt-5 border-t border-border/30 flex items-center justify-between"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            <motion.span 
              className="text-sm font-semibold flex items-center gap-2 text-primary"
              whileHover={{ x: 5 }}
            >
              阅读全文
              <motion.div
                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                whileHover={{ scale: 1.2, rotate: -45 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.span>
            
            {/* Animated progress line */}
            <div className="flex-1 mx-5 h-[3px] bg-border/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
              />
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.article>
  );
}

// Skeleton loading card - enhanced with better animations
export function BlogCardSkeleton() {
  return (
    <div className="rounded-[2rem] overflow-hidden border border-border/30 bg-card">
      <div className="h-56 relative overflow-hidden bg-secondary">
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="p-7 space-y-4">
        <div className="h-6 bg-secondary rounded-xl w-3/4 relative overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.1 }}
          />
        </div>
        <div className="h-4 bg-secondary rounded-xl relative overflow-hidden">
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.2 }}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-8 w-28 bg-secondary rounded-full" />
          <div className="h-8 w-24 bg-secondary rounded-full" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-7 w-16 bg-secondary rounded-full" />
          <div className="h-7 w-20 bg-secondary rounded-full" />
          <div className="h-7 w-14 bg-secondary rounded-full" />
        </div>
      </div>
    </div>
  );
}
