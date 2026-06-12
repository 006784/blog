'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 性能优化组件
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
  }, [pathname]);

  return null;
}
