'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Search, X, FileText, Music, Calendar, Image, ArrowRight, Loader2, Clock, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'blog' | 'music' | 'diary' | 'gallery';
  id: string;
  title: string;
  description?: string;
  url: string;
  date?: string;
  category?: string;
  tags?: string[];
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export function EnhancedSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse search history', e);
      }
    }
  }, []);

  // 快捷键打开搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // 高亮搜索关键词
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-100 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

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
        
        // 保存搜索历史
        const newHistory: SearchHistoryItem = {
          query: searchQuery,
          timestamp: Date.now(),
        };
        const updatedHistory = [
          newHistory,
          ...searchHistory.filter(h => h.query !== searchQuery)
        ].slice(0, 10);
        setSearchHistory(updatedHistory);
        localStorage.setItem('search-history', JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchHistory]);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 200);

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
      router.push(results[selectedIndex].url);
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

  const recentSearches = useMemo(() => {
    return searchHistory.slice(0, 5);
  }, [searchHistory]);

  return (
    <>
      {/* 搜索按钮 - 增强版 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/50 backdrop-blur-sm transition-all group"
      >
        <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          搜索
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-background/50 rounded border border-border/50">
          <span className="text-xs">⌘</span>K
        </kbd>
        {/* 搜索提示光晕 */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        />
      </motion.button>

      {/* 搜索弹窗 - 增强版 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 搜索框 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-3xl px-4"
            >
              <div className="bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden">
                {/* 输入框 - 增强版 */}
                <div className="relative flex items-center gap-3 px-6 py-5 border-b border-border/50">
                  <motion.div
                    animate={{ rotate: loading ? 360 : 0 }}
                    transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}
                  >
                    <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </motion.div>
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
                    className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground/60"
                  />
                  {loading && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  )}
                  {query && !loading && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setQuery('');
                        setResults([]);
                        inputRef.current?.focus();
                      }}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {/* 搜索结果区域 */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {query ? (
                    results.length > 0 ? (
                      <div className="p-3">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          搜索结果 ({results.length})
                        </div>
                        {results.map((result, index) => {
                          const Icon = getIcon(result.type);
                          const isSelected = index === selectedIndex;
                          return (
                            <motion.div
                              key={`${result.type}-${result.id}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                            >
                              <Link
                                href={result.url}
                                onClick={() => setIsOpen(false)}
                                className={`block relative overflow-hidden rounded-2xl transition-all ${
                                  isSelected
                                    ? 'bg-primary/10 border-2 border-primary'
                                    : 'hover:bg-secondary border-2 border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-4 px-4 py-4">
                                  {/* 图标 */}
                                  <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`p-3 rounded-xl ${
                                      isSelected
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}
                                  >
                                    <Icon className="w-5 h-5" />
                                  </motion.div>
                                  
                                  {/* 内容 */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-base mb-1">
                                      {highlightText(result.title, query)}
                                    </div>
                                    {result.description && (
                                      <div className="text-sm text-muted-foreground line-clamp-1">
                                        {highlightText(result.description, query)}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      {result.date && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {new Date(result.date).toLocaleDateString('zh-CN')}
                                        </span>
                                      )}
                                      {result.category && (
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                          {result.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* 类型标签 */}
                                  <div className="flex flex-col items-end gap-2">
                                    <span className={`text-xs px-3 py-1 rounded-full ${
                                      isSelected
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}>
                                      {getTypeName(result.type)}
                                    </span>
                                    <ArrowRight className={`w-4 h-4 transition-transform ${
                                      isSelected ? 'text-primary translate-x-1' : 'text-muted-foreground'
                                    }`} />
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-12 text-center"
                      >
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                          <Search className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-medium mb-2">未找到相关结果</p>
                        <p className="text-sm text-muted-foreground">试试其他关键词或检查拼写</p>
                      </motion.div>
                    )
                  ) : (
                    <div className="p-6">
                      {/* 搜索历史 */}
                      {recentSearches.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 px-3 py-2 mb-3">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">最近搜索</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {recentSearches.map((item, index) => (
                              <motion.button
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setQuery(item.query);
                                  inputRef.current?.focus();
                                }}
                                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm transition-colors flex items-center gap-2"
                              >
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {item.query}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 热门搜索 */}
                      {trending.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 px-3 py-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">热门搜索</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {trending.map((term, index) => (
                              <motion.button
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setQuery(term);
                                  inputRef.current?.focus();
                                }}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20 text-sm transition-all flex items-center gap-2 border border-primary/20"
                              >
                                <Sparkles className="w-3 h-3 text-primary" />
                                {term}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 快捷键提示 */}
                      <div className="mt-8 pt-6 border-t border-border/50">
                        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-secondary rounded border border-border">↑</kbd>
                            <kbd className="px-2 py-1 bg-secondary rounded border border-border">↓</kbd>
                            <span>导航</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-secondary rounded border border-border">Enter</kbd>
                            <span>打开</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-secondary rounded border border-border">Esc</kbd>
                            <span>关闭</span>
                          </div>
                        </div>
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
