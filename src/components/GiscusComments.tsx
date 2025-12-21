'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

interface GiscusCommentsProps {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
  term?: string;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: 'top' | 'bottom';
  lang?: string;
}

export function GiscusComments({
  repo,
  repoId,
  category,
  categoryId,
  mapping = 'pathname',
  term,
  reactionsEnabled = true,
  emitMetadata = false,
  inputPosition = 'bottom',
  lang = 'zh-CN',
}: GiscusCommentsProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 清除之前的实例
    const container = containerRef.current;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', mapping);
    if (term) {
      script.setAttribute('data-term', term);
    }
    script.setAttribute('data-reactions-enabled', reactionsEnabled ? '1' : '0');
    script.setAttribute('data-emit-metadata', emitMetadata ? '1' : '0');
    script.setAttribute('data-input-position', inputPosition);
    script.setAttribute('data-theme', resolvedTheme === 'dark' ? 'dark' : 'light');
    script.setAttribute('data-lang', lang);
    script.setAttribute('data-loading', 'lazy');

    container.appendChild(script);

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [repo, repoId, category, categoryId, mapping, term, reactionsEnabled, emitMetadata, inputPosition, lang, resolvedTheme]);

  return (
    <div className="giscus-container mt-12 pt-8 border-t border-border">
      <h3 className="text-xl font-semibold mb-6">评论</h3>
      <div ref={containerRef} className="giscus" />
    </div>
  );
}

// 简化版评论组件，使用环境变量
export function Comments() {
  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO || '';
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID || '';
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'General';
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '';

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="mt-12 pt-8 border-t border-border">
        <h3 className="text-xl font-semibold mb-6">评论</h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>评论功能未配置</p>
          <p className="text-sm mt-2">请在环境变量中配置 Giscus</p>
        </div>
      </div>
    );
  }

  return (
    <GiscusComments
      repo={repo}
      repoId={repoId}
      category={category}
      categoryId={categoryId}
    />
  );
}

export default GiscusComments;
