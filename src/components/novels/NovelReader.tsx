'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  List,
  Minus,
  Moon,
  Plus,
  Sun,
  X,
} from 'lucide-react';
import { type Novel } from '@/lib/novels';

// ── Types ───────────────────────────────────────────────────────────────────

interface Chapter {
  title: string;
  body: string;
}

type Theme = 'paper' | 'sepia' | 'night';

interface ReaderSettings {
  fontSize: number;
  theme: Theme;
}

// ── Themes ──────────────────────────────────────────────────────────────────

const THEMES: Record<Theme, {
  bg: string; sidebar: string; card: string;
  text: string; muted: string; border: string;
  progress: string; btnHover: string; label: string;
}> = {
  paper: {
    bg:       '#f7f3ee',
    sidebar:  '#edeae4',
    card:     '#fffcf8',
    text:     '#2d1e17',
    muted:    '#7a6255',
    border:   'rgba(0,0,0,0.08)',
    progress: '#c4956a',
    btnHover: 'rgba(0,0,0,0.06)',
    label:    '纸白',
  },
  sepia: {
    bg:       '#f0e8d5',
    sidebar:  '#e6dcc8',
    card:     '#f7f0df',
    text:     '#3b2a18',
    muted:    '#80644a',
    border:   'rgba(0,0,0,0.1)',
    progress: '#b87c45',
    btnHover: 'rgba(0,0,0,0.07)',
    label:    '羊皮',
  },
  night: {
    bg:       '#141210',
    sidebar:  '#1c1915',
    card:     '#201d19',
    text:     '#e2d8cc',
    muted:    '#8a7e72',
    border:   'rgba(255,255,255,0.07)',
    progress: '#c4956a',
    btnHover: 'rgba(255,255,255,0.06)',
    label:    '夜间',
  },
};

// ── Text parsing ─────────────────────────────────────────────────────────────

function stripGutenbergMatter(text: string) {
  const normalized = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const start = normalized.match(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i);
  const end   = normalized.match(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i);
  const afterStart = start ? normalized.slice((start.index ?? 0) + start[0].length) : normalized;
  const body = end?.index ? afterStart.slice(0, end.index - (start ? (start.index ?? 0) + start[0].length : 0)) : afterStart;
  return body
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function chunkLongText(text: string): Chapter[] {
  const paragraphs = text.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean);
  const chunks: Chapter[] = [];
  let current = '';
  for (const p of paragraphs) {
    if ((current + p).length > 7000 && current) {
      chunks.push({ title: `第 ${chunks.length + 1} 段`, body: current.trim() });
      current = '';
    }
    current += `${p}\n\n`;
  }
  if (current.trim()) chunks.push({ title: `第 ${chunks.length + 1} 段`, body: current.trim() });
  return chunks;
}

function parseChapters(text: string): Chapter[] {
  const cleaned = stripGutenbergMatter(text);
  const titlePattern = /^(?:第[一二三四五六七八九十百千〇零兩两\d]+[回卷章](?![也罷罢，,。．？！；：]).*|卷[一二三四五六七八九十百千〇零兩两\d]+.*|楔子|序|自序|引子)$/;
  const lines = cleaned
    .replace(/([。．！!？?；;」』])((?:第[一二三四五六七八九十百千〇零兩两\d]+[回卷章]|卷[一二三四五六七八九十百千〇零兩两\d]+)[\s 　]{2,}[^\n]{1,80})/g, '$1\n$2')
    .split('\n');
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  const preface: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const isTitle = trimmed.length > 0 && trimmed.length <= 80 && titlePattern.test(trimmed);
    if (isTitle) {
      if (current) chapters.push({ title: current.title, body: current.body.trim() });
      current = { title: trimmed, body: '' };
    } else if (current) {
      current.body += `${line}\n`;
    } else {
      preface.push(line);
    }
  }
  if (current) chapters.push({ title: current.title, body: current.body.trim() });
  if (preface.join('').trim().length > 80) chapters.unshift({ title: '题记', body: preface.join('\n').trim() });
  return chapters.length > 2 ? chapters : chunkLongText(cleaned);
}

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

// ── Default settings ─────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: ReaderSettings = { fontSize: 19, theme: 'paper' };

function loadSettings(key: string): ReaderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

// ── Main component ───────────────────────────────────────────────────────────

export function NovelReader({ novel }: { novel: Novel }) {
  const settingsKey = `novel-reader:${novel.slug}:settings`;
  const chapterKey  = `novel-reader:${novel.slug}:chapter`;

  const [rawText,      setRawText]      = useState('');
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState(false);
  const [chapterIndex, setChapterIndex] = useState(() =>
    typeof window !== 'undefined' ? Number(localStorage.getItem(chapterKey) ?? 0) : 0
  );
  const [settings,  setSettings]  = useState<ReaderSettings>(() => loadSettings(settingsKey));
  const [tocOpen,   setTocOpen]   = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const contentRef = useRef<HTMLDivElement>(null);
  const tocRef     = useRef<HTMLDivElement>(null);

  // ── Fetch novel text ───────────────────────────────────────────────────────

  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setFetchError(false);
    fetch(novel.filePath)
      .then((r) => { if (!r.ok) throw new Error('fetch failed'); return r.text(); })
      .then((t) => { if (alive) setRawText(t); })
      .catch(() => { if (alive) setFetchError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [novel.filePath]);

  const chapters    = useMemo(() => (rawText ? parseChapters(rawText) : []), [rawText]);
  const activeIndex = clamp(chapterIndex, 0, Math.max(chapters.length - 1, 0));
  const chapter     = chapters[activeIndex];
  const progress    = chapters.length ? Math.round(((activeIndex + 1) / chapters.length) * 100) : 0;
  const theme       = THEMES[settings.theme];

  // ── Persist settings / chapter ────────────────────────────────────────────

  useEffect(() => { localStorage.setItem(settingsKey, JSON.stringify(settings)); }, [settings, settingsKey]);
  useEffect(() => { localStorage.setItem(chapterKey, String(activeIndex)); }, [activeIndex, chapterKey]);

  // ── Chapter navigation ────────────────────────────────────────────────────

  const goTo = useCallback((next: number, dir: 1 | -1 = 1) => {
    const clamped = clamp(next, 0, Math.max(chapters.length - 1, 0));
    setDirection(dir);
    setChapterIndex(clamped);
    setTocOpen(false);
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [chapters.length]);

  // ── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (['INPUT','TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(activeIndex + 1, 1); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goTo(activeIndex - 1, -1); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, goTo]);

  // ── Auto-scroll active chapter in TOC ────────────────────────────────────

  useEffect(() => {
    const el = tocRef.current?.querySelector('[data-active="true"]') as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeIndex, tocOpen]);

  // ── Paragraphs ────────────────────────────────────────────────────────────

  const paragraphs = useMemo(
    () => chapter?.body.split(/\n+/).map((p) => p.trim()).filter(Boolean) ?? [],
    [chapter]
  );

  const cycleTheme = () => {
    const order: Theme[] = ['paper', 'sepia', 'night'];
    const next = order[(order.indexOf(settings.theme) + 1) % order.length];
    setSettings((s) => ({ ...s, theme: next }));
  };

  const ThemeIcon = settings.theme === 'night' ? Moon : Sun;

  // ── TOC panel (shared markup) ─────────────────────────────────────────────

  const TocContent = (
    <div ref={tocRef} className="flex flex-col h-full">
      {/* Book info */}
      <div className="px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: theme.progress + '22' }}>
            <BookOpen className="h-5 w-5" style={{ color: theme.progress }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate" style={{ color: theme.text, fontSize: 15 }}>{novel.title}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: theme.muted }}>{novel.author}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: theme.border }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: theme.progress }} />
        </div>
        <div className="flex justify-between mt-1.5 text-xs" style={{ color: theme.muted }}>
          <span>{progress}%</span>
          <span>{chapters.length} 章</span>
        </div>
      </div>

      {/* Chapter list */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {chapters.map((ch, i) => (
          <button
            key={`${ch.title}-${i}`}
            type="button"
            data-active={i === activeIndex}
            onClick={() => goTo(i, i > activeIndex ? 1 : -1)}
            className="w-full text-left rounded-lg px-3 py-2 text-sm leading-5 transition-colors"
            style={{
              background: i === activeIndex ? theme.progress + '22' : 'transparent',
              color: i === activeIndex ? theme.progress : theme.muted,
              fontWeight: i === activeIndex ? 600 : 400,
            }}
          >
            <span className="line-clamp-2">{ch.title}</span>
          </button>
        ))}
      </nav>

      {/* Source link */}
      <div className="px-5 py-4 shrink-0 text-xs" style={{ borderTop: `1px solid ${theme.border}`, color: theme.muted }}>
        文本来源：{' '}
        <a href={novel.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
          {novel.sourceName}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: theme.bg, color: theme.text }}>

      {/* ── Top header ────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-[70] flex flex-col"
        style={{ background: theme.sidebar + 'e8', borderBottom: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 sm:px-6">
          {/* Back */}
          <Link href="/media" className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70 shrink-0 mr-2" style={{ color: theme.muted }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">书影音</span>
          </Link>

          {/* Title — mobile only */}
          <p className="flex-1 min-w-0 truncate text-sm font-medium lg:hidden" style={{ color: theme.text }}>
            {chapter?.title ?? novel.title}
          </p>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* TOC toggle — mobile */}
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ background: tocOpen ? theme.progress + '22' : 'transparent', color: tocOpen ? theme.progress : theme.muted }}
              aria-label="目录"
            >
              <List className="h-4 w-4" />
            </button>

            {/* Font size */}
            <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: clamp(s.fontSize - 1, 15, 26) }))}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:opacity-80"
              style={{ color: theme.muted }} aria-label="减小字号">
              <Minus className="h-4 w-4" />
            </button>
            <span className="hidden sm:block text-xs tabular-nums w-8 text-center" style={{ color: theme.muted }}>{settings.fontSize}</span>
            <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: clamp(s.fontSize + 1, 15, 26) }))}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:opacity-80"
              style={{ color: theme.muted }} aria-label="增大字号">
              <Plus className="h-4 w-4" />
            </button>

            {/* Theme cycle */}
            <button type="button" onClick={cycleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:opacity-80"
              style={{ color: theme.muted }} aria-label={`切换主题（当前：${theme.label}）`}
              title={`当前：${theme.label}`}>
              <ThemeIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px]" style={{ background: theme.border }}>
          <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: theme.progress }} />
        </div>
      </header>

      {/* ── Page layout ───────────────────────────────────────────────────── */}
      <div className="flex min-h-[calc(100dvh-53px)]">

        {/* ── Desktop sidebar TOC ──────────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-[53px] h-[calc(100dvh-53px)] overflow-hidden"
          style={{ background: theme.sidebar, borderRight: `1px solid ${theme.border}` }}
        >
          {TocContent}
        </aside>

        {/* ── Main content area ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col items-center px-4 py-10 sm:px-8 sm:py-14 pb-32 lg:pb-16">
          {/* Chapter header — desktop */}
          <div className="w-full max-w-[680px] mb-8 hidden lg:block">
            <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: theme.muted }}>
              {novel.title} · {novel.author}
            </p>
          </div>

          {loading ? (
            <div className="w-full max-w-[680px] flex flex-col items-center justify-center py-32 gap-4">
              <div className="h-8 w-8 rounded-full border-2 animate-spin" style={{ borderColor: theme.border, borderTopColor: theme.progress }} />
              <p className="text-sm" style={{ color: theme.muted }}>正在加载文本…</p>
            </div>
          ) : fetchError ? (
            <div className="w-full max-w-[680px] flex flex-col items-center justify-center py-32 gap-3">
              <p className="text-sm" style={{ color: theme.muted }}>文本加载失败，请稍后重试。</p>
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeIndex}
                ref={contentRef}
                initial={{ opacity: 0, x: direction * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -32 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="w-full max-w-[680px]"
              >
                {/* Chapter title */}
                <div className="mb-8 sm:mb-10 pb-6 sm:pb-8" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <p className="text-xs tracking-[0.25em] uppercase mb-3" style={{ color: theme.muted }}>
                    第 {activeIndex + 1} 章 · 共 {chapters.length} 章
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-semibold leading-snug" style={{ color: theme.text, fontFamily: 'var(--font-mincho, var(--font-jp-serif, serif))' }}>
                    {chapter?.title}
                  </h1>
                </div>

                {/* Body */}
                <div
                  className="leading-[2] break-words"
                  style={{
                    fontSize: settings.fontSize,
                    color: theme.text,
                    fontFamily: 'var(--font-jp-serif, var(--font-mincho, serif))',
                  }}
                >
                  {paragraphs.map((p, i) => (
                    <p key={i} style={{ textIndent: '2em', marginBottom: '0.6em', textAlign: 'justify' }}>{p}</p>
                  ))}
                </div>

                {/* Bottom navigation */}
                <div className="mt-12 pt-6 flex items-center justify-between gap-4" style={{ borderTop: `1px solid ${theme.border}` }}>
                  <button
                    type="button"
                    onClick={() => goTo(activeIndex - 1, -1)}
                    disabled={activeIndex <= 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
                    style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一章
                  </button>
                  <span className="text-sm" style={{ color: theme.muted }}>{progress}%</span>
                  <button
                    type="button"
                    onClick={() => goTo(activeIndex + 1, 1)}
                    disabled={activeIndex >= chapters.length - 1}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
                    style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
                  >
                    下一章
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* ── Mobile bottom navigation ────────────────────────────────────────── */}
      {!loading && !fetchError && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-[60] flex items-center px-4 py-3 gap-3"
          style={{ background: theme.sidebar + 'f0', borderTop: `1px solid ${theme.border}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1, -1)}
            disabled={activeIndex <= 0}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
            style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            <ChevronLeft className="h-4 w-4" />
            上一章
          </button>

          <button
            type="button"
            onClick={() => setTocOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 w-16 shrink-0"
            style={{ color: theme.muted }}
          >
            <span className="text-sm font-semibold tabular-nums" style={{ color: theme.text }}>{progress}%</span>
            <span className="text-[10px]">{activeIndex + 1}/{chapters.length}</span>
          </button>

          <button
            type="button"
            onClick={() => goTo(activeIndex + 1, 1)}
            disabled={activeIndex >= chapters.length - 1}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-30"
            style={{ background: theme.card, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            下一章
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Mobile TOC sheet ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tocOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              onClick={() => setTocOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="lg:hidden fixed inset-y-0 left-0 z-[90] w-[280px] flex flex-col shadow-2xl"
              style={{ background: theme.sidebar }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <span className="font-semibold text-sm" style={{ color: theme.text }}>目录</span>
                <button type="button" onClick={() => setTocOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: theme.muted }}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden" style={{ borderTop: `1px solid ${theme.border}` }}>
                {TocContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile font size controls — floating */}
      <div
        className="sm:hidden fixed right-3 z-[65] flex flex-col gap-2 rounded-2xl p-2 shadow-lg"
        style={{ background: theme.sidebar + 'f0', border: `1px solid ${theme.border}`, backdropFilter: 'blur(12px)', bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: clamp(s.fontSize + 1, 15, 26) }))}
          className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ color: theme.muted }} aria-label="增大字号">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <span className="text-center text-[10px] tabular-nums" style={{ color: theme.muted }}>{settings.fontSize}</span>
        <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: clamp(s.fontSize - 1, 15, 26) }))}
          className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ color: theme.muted }} aria-label="减小字号">
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
