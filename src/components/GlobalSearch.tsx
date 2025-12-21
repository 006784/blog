'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Music, Calendar, Image, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  type: 'blog' | 'music' | 'diary' | 'gallery';
  id: string;
  title: string;
  description?: string;
  url: string;
  date?: string;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 快捷键打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 搜索函数
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      window.location.href = results[selectedIndex].url;
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'blog': return FileText;
      case 'music': return Music;
      case 'diary': return Calendar;
      case 'gallery': return Image;
      default: return FileText;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'blog': return '文章';
      case 'music': return '音乐';
      case 'diary': return '日记';
      case 'gallery': return '相册';
      default: return '';
    }
  };

  return (
    <>
      {/* 搜索按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/50"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">搜索</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 ml-2 text-xs bg-background rounded border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* 搜索弹窗 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 搜索框 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
            >
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* 输入框 */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="搜索文章、音乐、日记..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedIndex(0);
                    }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground"
                  />
                  {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                  {query && !loading && (
                    <button
                      onClick={() => setQuery('')}
                      className="p-1 rounded-lg hover:bg-muted"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 搜索结果 */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {results.length > 0 ? (
                    <div className="p-2">
                      {results.map((result, index) => {
                        const Icon = getIcon(result.type);
                        return (
                          <Link
                            key={`${result.type}-${result.id}`}
                            href={result.url}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                              index === selectedIndex
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className={`p-2 rounded-lg ${
                              index === selectedIndex ? 'bg-primary/20' : 'bg-muted'
                            }`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{result.title}</div>
                              {result.description && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {result.description}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-muted">
                              {getTypeName(result.type)}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </Link>
                        );
                      })}
                    </div>
                  ) : query ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>未找到相关结果</p>
                      <p className="text-sm mt-1">试试其他关键词</p>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">输入关键词开始搜索</p>
                      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↑</kbd>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">↓</kbd>
                          导航
                        </span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Enter</kbd>
                          打开
                        </span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Esc</kbd>
                          关闭
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default GlobalSearch;
