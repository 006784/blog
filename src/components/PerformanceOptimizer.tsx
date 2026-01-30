'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 性能优化组件
 * - 图片懒加载
 * - 预加载关键资源
 * - 资源预取
 */
export function PerformanceOptimizer() {
  const pathname = usePathname();

  useEffect(() => {
    // 预加载关键资源
    const preloadLinks = [
      { href: '/blog', as: 'document' },
      { href: '/about', as: 'document' },
    ];

    preloadLinks.forEach(({ href, as }) => {
      if (pathname !== href) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
      }
    });

    // 图片懒加载优化
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px',
      });

      // 观察所有带 data-src 的图片
      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });

      return () => {
        imageObserver.disconnect();
      };
    }
  }, [pathname]);

  return null;
}

/**
 * 骨架屏组件 - 用于加载状态
 */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border/30 bg-card animate-pulse">
      <div className="h-56 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      <div className="p-6 space-y-4">
        <div className="h-6 bg-secondary rounded-xl w-3/4" />
        <div className="h-4 bg-secondary rounded-xl w-full" />
        <div className="h-4 bg-secondary rounded-xl w-2/3" />
        <div className="flex gap-3 pt-2">
          <div className="h-8 w-24 bg-secondary rounded-full" />
          <div className="h-8 w-20 bg-secondary rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 图片优化组件 - 自动懒加载和占位符
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  className = '',
  priority = false 
}: OptimizedImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 占位符 */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/50 to-secondary animate-pulse"
        style={{ aspectRatio: width && height ? `${width}/${height}` : '16/9' }}
      />
      
      {/* 实际图片 */}
      <img
        src={priority ? src : undefined}
        data-src={!priority ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="relative w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: priority ? 1 : 0 }}
        onLoad={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      />
    </div>
  );
}
