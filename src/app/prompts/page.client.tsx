'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, Search, X, Sparkles, ExternalLink,
  ChevronDown, ChevronUp, Star, Zap
} from 'lucide-react';
import { showToast } from '@/lib/toast';
import promptsData from '@/data/prompts.json';

// ── Types ─────────────────────────────────────────────────

interface Prompt {
  title: string;
  category: string;
  description: string;
  prompt: string;
  images: string[];
  author: string;
  published: string;
  languages: string[];
  featured: boolean;
  raycast: boolean;
}


// ── Constants ─────────────────────────────────────────────

const CATEGORY_ZH: Record<string, string> = {
  '全部':                   '全部',
  'Featured':               '精选',
  'Profile / Avatar':       '头像',
  'Social Media Post':      '社媒',
  'Infographic / Edu Visual': '信息图',
  'YouTube Thumbnail':      'YouTube',
  'Comic / Storyboard':     '漫画',
  'E-commerce Main Image':  '电商',
  'Game Asset':             '游戏',
  'Product Marketing':      '产品',
};

const LANG_BADGE: Record<string, string> = {
  en: 'EN', ja: 'JA', ko: 'KO', zh: 'ZH', fr: 'FR', de: 'DE',
};

// ── Copy button ───────────────────────────────────────────

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setDone(true);
      showToast.success('提示词已复制');
      setTimeout(() => setDone(false), 2000);
    });
  };

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${className}`}
      style={{
        background: done ? 'var(--gold)' : 'var(--surface-raised)',
        color: done ? '#fff' : 'var(--color-neutral-600)',
        border: '1px solid var(--line)',
      }}
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
      {done ? '已复制' : '复制'}
    </button>
  );
}

// ── Prompt Card ───────────────────────────────────────────

function PromptCard({ prompt, onClick }: { prompt: Prompt; onClick: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden"
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--line)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      whileHover={{ y: -2 }}
    >
      {/* Image */}
      {prompt.images.length > 0 && (
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <Image
            src={prompt.images[0]}
            alt={prompt.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            {prompt.featured && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: 'var(--gold)', color: '#fff' }}
              >
                <Star size={8} fill="currentColor" />精选
              </span>
            )}
            {prompt.raycast && (
              <span
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: '#7c3aed', color: '#fff' }}
              >
                <Zap size={8} />Raycast
              </span>
            )}
          </div>
          {/* Lang badge */}
          {prompt.languages.length > 0 && (
            <div className="absolute top-2 right-2">
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold"
                style={{
                  background: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {LANG_BADGE[prompt.languages[0]] ?? prompt.languages[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        {/* Category */}
        <span
          className="text-[10px] font-semibold tracking-wider uppercase"
          style={{ color: 'var(--gold)', fontFamily: 'var(--font-garamond)' }}
        >
          {CATEGORY_ZH[prompt.category] ?? prompt.category}
        </span>

        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2"
          style={{ color: 'var(--ink)', fontFamily: 'var(--font-jp-serif)' }}
        >
          {prompt.title}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed line-clamp-3"
          style={{ color: 'var(--color-neutral-600)' }}
        >
          {prompt.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px]" style={{ color: 'var(--color-neutral-600)' }}>
            {prompt.author}
          </span>
          <CopyButton text={prompt.prompt} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Prompt Modal ──────────────────────────────────────────

function PromptModal({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const promptLines = prompt.prompt.split('\n').length;
  const isLong = promptLines > 15;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          className="relative w-full md:max-w-2xl max-h-[90dvh] overflow-y-auto rounded-t-2xl md:rounded-2xl"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: 'var(--surface-base)' }}
        >
          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--line)' }} />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5 pb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className="text-[10px] font-semibold tracking-wider uppercase"
                  style={{ color: 'var(--gold)', fontFamily: 'var(--font-garamond)' }}
                >
                  {CATEGORY_ZH[prompt.category] ?? prompt.category}
                </span>
                {prompt.featured && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'var(--gold)', color: '#fff' }}
                  >
                    <Star size={8} fill="currentColor" />精选
                  </span>
                )}
                {prompt.raycast && (
                  <span
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: '#7c3aed', color: '#fff' }}
                  >
                    <Zap size={8} />Raycast
                  </span>
                )}
              </div>
              <h2
                className="text-base font-semibold leading-snug"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-jp-serif)' }}
              >
                {prompt.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-full transition-colors"
              style={{ color: 'var(--color-neutral-600)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Image */}
          {prompt.images.length > 0 && (
            <div className="px-5">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <Image
                  src={prompt.images[0]}
                  alt={prompt.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              {prompt.images.length > 1 && (
                <div className="flex gap-2 mt-2">
                  {prompt.images.slice(1).map((img, i) => (
                    <div key={i} className="relative w-20 h-16 rounded-md overflow-hidden flex-shrink-0">
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="px-5 pt-4">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
              {prompt.description}
            </p>
          </div>

          {/* Prompt text */}
          <div className="p-5 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>提示词原文</span>
              <CopyButton text={prompt.prompt} />
            </div>
            <div
              className="relative rounded-lg overflow-hidden"
              style={{ background: 'var(--surface-panel)', border: '1px solid var(--line)' }}
            >
              <pre
                className="text-xs leading-relaxed p-4 overflow-x-auto whitespace-pre-wrap break-words"
                style={{
                  color: 'var(--color-neutral-600)',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: isLong && !expanded ? '200px' : 'none',
                  transition: 'max-height 0.3s',
                }}
              >
                {prompt.prompt}
              </pre>
              {isLong && !expanded && (
                <div
                  className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-8"
                  style={{
                    background: 'linear-gradient(transparent, var(--surface-panel))',
                  }}
                >
                  <button
                    onClick={() => setExpanded(true)}
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                    style={{ background: 'var(--surface-raised)', color: 'var(--gold)', border: '1px solid var(--line)' }}
                  >
                    <ChevronDown size={12} />展开全文
                  </button>
                </div>
              )}
              {isLong && expanded && (
                <div className="flex justify-center pb-3">
                  <button
                    onClick={() => setExpanded(false)}
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
                    style={{ color: 'var(--color-neutral-600)' }}
                  >
                    <ChevronUp size={12} />收起
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div
            className="mx-5 mb-5 rounded-lg p-3 flex items-center justify-between flex-wrap gap-2"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--line)' }}
          >
            <div className="text-xs" style={{ color: 'var(--color-neutral-600)' }}>
              <span className="font-medium" style={{ color: 'var(--ink)' }}>作者：</span>
              {prompt.author}
              {prompt.published && (
                <span className="ml-3 opacity-60">{prompt.published}</span>
              )}
            </div>
            {prompt.languages.length > 0 && (
              <div className="flex gap-1">
                {prompt.languages.map((l) => (
                  <span
                    key={l}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                    style={{ background: 'var(--surface-panel)', color: 'var(--color-neutral-600)', border: '1px solid var(--line)' }}
                  >
                    {LANG_BADGE[l] ?? l.toUpperCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ────────────────────────────────────────

export function PromptsClient() {
  const prompts = promptsData as Prompt[];
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [selected, setSelected] = useState<Prompt | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Derive category list
  const categories = useMemo(() => {
    const cats = ['全部', ...Array.from(new Set(prompts.map((p) => p.category)))];
    return cats;
  }, [prompts]);

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return prompts.filter((p) => {
      const matchCat = activeCategory === '全部' || p.category === activeCategory;
      if (!q) return matchCat;
      return matchCat && (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [prompts, search, activeCategory]);

  const featured = useMemo(() => filtered.filter((p) => p.featured), [filtered]);
  const regular = useMemo(() => filtered.filter((p) => !p.featured), [filtered]);

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--surface-base)', color: 'var(--ink)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs tracking-[0.3em] uppercase opacity-60"
              style={{ fontFamily: 'var(--font-garamond)' }}
            >
              Prompt Library
            </span>
            <div className="h-px flex-1 opacity-20" style={{ background: 'var(--ink)' }} />
          </div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-mincho)', color: 'var(--ink)' }}
          >
            提示词库
          </h1>
          <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--color-neutral-600)' }}>
            来自 GPT Image 2 社区的精选创意提示词，涵盖头像、社媒、信息图、电商等多个类别。
            点击卡片查看完整提示词并一键复制。
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div
              className="flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--color-neutral-600)' }}
            >
              <Sparkles size={13} style={{ color: 'var(--gold)' }} />
              <span><strong style={{ color: 'var(--ink)' }}>{prompts.length}</strong> 条提示词</span>
            </div>
            <div className="w-px h-4 opacity-30" style={{ background: 'var(--ink)' }} />
            <div className="text-sm" style={{ color: 'var(--color-neutral-600)' }}>
              <strong style={{ color: 'var(--ink)' }}>{categories.length - 1}</strong> 个类别
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-neutral-600)' }}
          />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索提示词标题、描述或内容…"
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl outline-none transition-all"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-neutral-600)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 no-scrollbar">
          {categories.map((cat) => {
            const label = cat === '全部' ? '全部' : (CATEGORY_ZH[cat] ?? cat);
            const count = cat === '全部' ? prompts.length : prompts.filter((p) => p.category === cat).length;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--gold)' : 'var(--surface-raised)',
                  color: active ? '#fff' : 'var(--color-neutral-600)',
                  border: active ? '1px solid var(--gold)' : '1px solid var(--line)',
                }}
              >
                {label}
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(255,255,255,0.25)' : 'var(--surface-panel)',
                    color: active ? '#fff' : 'var(--color-neutral-600)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* No results */}
        {filtered.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--color-neutral-600)' }}>
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">没有找到匹配的提示词</p>
            <button
              className="mt-2 text-xs underline"
              onClick={() => { setSearch(''); setActiveCategory('全部'); }}
              style={{ color: 'var(--gold)' }}
            >
              清除筛选
            </button>
          </div>
        )}

        {/* Featured section */}
        {featured.length > 0 && activeCategory === '全部' && !search && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <Star size={14} style={{ color: 'var(--gold)' }} />
              <h2 className="text-sm font-semibold tracking-wider" style={{ color: 'var(--ink)' }}>
                精选推荐
              </h2>
              <div className="h-px flex-1 opacity-15" style={{ background: 'var(--ink)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((p, i) => (
                <PromptCard key={`f-${i}`} prompt={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          </section>
        )}

        {/* All prompts */}
        {regular.length > 0 && (
          <section>
            {activeCategory === '全部' && !search && (
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-sm font-semibold tracking-wider" style={{ color: 'var(--ink)' }}>
                  全部提示词
                </h2>
                <div className="h-px flex-1 opacity-15" style={{ background: 'var(--ink)' }} />
                <span className="text-xs" style={{ color: 'var(--color-neutral-600)' }}>
                  {regular.length} 条
                </span>
              </div>
            )}
            {(activeCategory !== '全部' || search) && (
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-sm font-semibold tracking-wider" style={{ color: 'var(--ink)' }}>
                  {search ? `「${search}」的搜索结果` : (CATEGORY_ZH[activeCategory] ?? activeCategory)}
                </h2>
                <div className="h-px flex-1 opacity-15" style={{ background: 'var(--ink)' }} />
                <span className="text-xs" style={{ color: 'var(--color-neutral-600)' }}>
                  {filtered.length} 条
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {(search || activeCategory !== '全部' ? filtered : regular).map((p, i) => (
                  <PromptCard key={`${p.category}-${p.title}-${i}`} prompt={p} onClick={() => setSelected(p)} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}

        {/* Source credit */}
        <div
          className="mt-16 pt-8 flex items-center justify-between flex-wrap gap-2"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-neutral-600)' }}>
            数据来源：
            <a
              href="https://github.com/YouMind-OpenLab/awesome-gpt-image-2"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
              style={{ color: 'var(--gold)' }}
            >
              awesome-gpt-image-2
            </a>
            ，遵循 CC BY 4.0 协议
          </p>
          <a
            href="https://youmind.com/gpt-image-2-prompts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs hover:opacity-80"
            style={{ color: 'var(--color-neutral-600)' }}
          >
            <ExternalLink size={11} />查看完整图库（7000+ 条）
          </a>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <PromptModal prompt={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
