'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// 交互组件可接收预填参数（来自代码块内的 JSON）
type InteractiveComponent = ComponentType<Record<string, unknown>>;

// 交互组件注册表：在文章 markdown 中用 ```interactive:<key> 嵌入。
// 全部用 dynamic import + ssr:false，避免拖慢文章首屏。
const loading = () => (
  <div className="interactive-loading">交互组件加载中…</div>
);

export const INTERACTIVE_REGISTRY: Record<string, InteractiveComponent> = {
  'jwt-decoder': dynamic(() => import('./JwtDecoder'), { ssr: false, loading }),
  'regex-tester': dynamic(() => import('./RegexTester'), { ssr: false, loading }),
  'regex-greedy': dynamic(() => import('./RegexGreedy'), { ssr: false, loading }),
  'hash-generator': dynamic(() => import('./HashGenerator'), { ssr: false, loading }),
  'http-status': dynamic(() => import('./HttpStatus'), { ssr: false, loading }),
};

export function getInteractive(key: string): InteractiveComponent | null {
  return INTERACTIVE_REGISTRY[key] ?? null;
}
