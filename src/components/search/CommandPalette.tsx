'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, FileText, BookOpen, Music, Globe, Clock, ArrowRight } from 'lucide-react';
import type { SearchResult, SearchResultType } from '@/app/api/search/route';

// ── 工具 ──────────────────────────────────────────────────

const HISTORY_KEY = 'lumen_search_history';
const MAX_HISTORY = 8;

function getHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function addHistory(q: string) {
  if (!q.trim()) return;
  const prev = getHistory().filter((h) => h !== q);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)));
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// ── 类型图标 ──────────────────────────────────────────────

function TypeIcon({ type }: { type: SearchResultType }) {
  const cls = 'w-4 h-4 shrink-0';
  switch (type) {
    case 'post':    return <FileText className={cls} />;
    case 'diary':   return <BookOpen className={cls} />;
    case 'music':   return <Music className={cls} />;
    case 'page':    return <Globe className={cls} />;
    default:        return <FileText className={cls} />;
  }
}

const TYPE_LABEL: Record<SearchResultType, string> = {
  post:    '文章',
  diary:   '日记',
  music:   '歌单',
  gallery: '相册',
  page:    '页面',
};

const TYPE_COLOR: Record<SearchResultType, string> = {
  post:    'bg-blue-500/10 text-blue-400',
  diary:   'bg-amber-500/10 text-amber-400',
  music:   'bg-purple-500/10 text-purple-400',
  gallery: 'bg-green-500/10 text-green-400',
  page:    'bg-zinc-500/10 text-zinc-400',
};

// ── 主组件 ────────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 打开/关闭
  const openPalette = useCallback(() => {
    setOpen(true);
    setHistory(getHistory());
    setQuery('');
    setResults([]);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIdx(0);
  }, []);

  // 全局快捷键监听
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === 'k') {
        e.preventDefault();
        if (open) closePalette(); else openPalette();
      }
      if (e.key === 'Escape') closePalette();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, openPalette, closePalette]);

  // 自动聚焦
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // 搜索防抖
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setActiveIdx(0);
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // 保持 activeIdx 不超出边界
  const displayList = query.trim() ? results : [];
  useEffect(() => {
    setActiveIdx(0);
  }, [displayList.length]);

  // 键盘导航
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, displayList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const item = displayList[activeIdx];
      if (item) navigate(item);
    }
  }

  // 保持活动项可见
  useEffect(() => {
    const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  function navigate(item: SearchResult) {
    addHistory(item.title);
    closePalette();
    router.push(item.url);
  }

  function searchHistory(h: string) {
    setQuery(h);
    inputRef.current?.focus();
  }

  // ── 渲染 ──────────────────────────────────────────────

  return (
    <>
      {/* 触发按钮（供外部组件调用时使用，本身不渲染按钮，由快捷键触发） */}
      {/* 外部可通过 window.dispatchEvent(new CustomEvent('lumen:search')) 触发 */}

      <AnimatePresence>
        {open && (
          <>
            {/* 遮罩 */}
            <motion.div
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePalette}
            />

            {/* 面板 */}
            <motion.div
              className="fixed inset-x-4 top-[15vh] z-[9999] mx-auto max-w-2xl"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
                {/* 搜索输入框 */}
                <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
                  <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="搜索文章、日记、页面…"
                    className="flex-1 bg-transparent text-base text-white placeholder:text-zinc-500 outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <kbd className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">
                    ESC
                  </kbd>
                </div>

                {/* 结果列表 */}
                <div className="max-h-[420px] overflow-y-auto">
                  {/* loading */}
                  {loading && (
                    <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
                      <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin mr-2" />
                      搜索中…
                    </div>
                  )}

                  {/* 搜索结果 */}
                  {!loading && query.trim() && (
                    <>
                      {results.length === 0 ? (
                        <div className="py-12 text-center text-zinc-500 text-sm">
                          没有找到与「{query}」相关的内容
                        </div>
                      ) : (
                        <ul ref={listRef} className="py-2">
                          {results.map((item, i) => (
                            <li key={item.id + item.type}>
                              <button
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                                  i === activeIdx
                                    ? 'bg-white/8 text-white'
                                    : 'text-zinc-300 hover:bg-white/5'
                                }`}
                                onClick={() => navigate(item)}
                                onMouseEnter={() => setActiveIdx(i)}
                              >
                                <span className={`mt-0.5 text-zinc-400`}>
                                  <TypeIcon type={item.type} />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{item.title}</span>
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full shrink-0 ${TYPE_COLOR[item.type]}`}>
                                      {TYPE_LABEL[item.type]}
                                    </span>
                                  </div>
                                  {item.excerpt && (
                                    <p className="text-xs text-zinc-500 mt-0.5 truncate">{item.excerpt}</p>
                                  )}
                                </div>
                                {i === activeIdx && (
                                  <ArrowRight className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}

                  {/* 空状态：搜索历史 */}
                  {!loading && !query.trim() && (
                    <div className="py-3">
                      {history.length > 0 && (
                        <>
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">最近搜索</span>
                            <button
                              onClick={() => { clearHistory(); setHistory([]); }}
                              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                              清除
                            </button>
                          </div>
                          <ul>
                            {history.map((h) => (
                              <li key={h}>
                                <button
                                  onClick={() => searchHistory(h)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                                >
                                  <Clock className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-sm">{h}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}

                      {/* 快捷入口 */}
                      <div className="px-4 py-2 mt-1">
                        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">快速跳转</span>
                      </div>
                      <ul>
                        {[
                          { label: '博客文章', url: '/blog', icon: <FileText className="w-4 h-4" /> },
                          { label: '我的日记', url: '/diary', icon: <BookOpen className="w-4 h-4" /> },
                          { label: '音乐歌单', url: '/music', icon: <Music className="w-4 h-4" /> },
                        ].map((item) => (
                          <li key={item.url}>
                            <button
                              onClick={() => { closePalette(); router.push(item.url); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                            >
                              {item.icon}
                              <span className="text-sm">{item.label}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 底部快捷键提示 */}
                {results.length > 0 && (
                  <div className="border-t border-white/8 px-4 py-2.5 flex items-center gap-4 text-[11px] text-zinc-600">
                    <span><kbd className="text-zinc-500">↑↓</kbd> 导航</span>
                    <span><kbd className="text-zinc-500">↵</kbd> 打开</span>
                    <span><kbd className="text-zinc-500">ESC</kbd> 关闭</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// 供外部触发的事件钩子
export function useCommandPalette() {
  function open() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
  }
  return { open };
}
