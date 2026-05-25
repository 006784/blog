'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, ExternalLink, List, Minus, Plus, SunMedium, Type, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { type Novel } from '@/lib/novels';

interface Chapter {
  title: string;
  body: string;
}

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'paper' | 'night';
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 20,
  lineHeight: 1.9,
  theme: 'paper',
};

function getDefaultSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  return window.innerWidth < 640 ? { ...DEFAULT_SETTINGS, fontSize: 18, lineHeight: 1.85 } : DEFAULT_SETTINGS;
}

function stripGutenbergMatter(text: string) {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const start = normalized.match(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i);
  const end = normalized.match(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[^\n]*\*\*\*/i);
  const afterStart = start ? normalized.slice((start.index ?? 0) + start[0].length) : normalized;
  const body = end && end.index ? afterStart.slice(0, end.index - (start ? (start.index ?? 0) + start[0].length : 0)) : afterStart;
  return body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function chunkLongText(text: string) {
  const paragraphs = text.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean);
  const chunks: Chapter[] = [];
  let current = '';
  paragraphs.forEach((paragraph) => {
    if ((current + paragraph).length > 7000 && current) {
      chunks.push({ title: `第 ${chunks.length + 1} 段`, body: current.trim() });
      current = '';
    }
    current += `${paragraph}\n\n`;
  });
  if (current.trim()) chunks.push({ title: `第 ${chunks.length + 1} 段`, body: current.trim() });
  return chunks;
}

function parseChapters(text: string) {
  const cleaned = stripGutenbergMatter(text);
  const titlePattern = /^(?:第[一二三四五六七八九十百千〇零兩两\d]+[回卷章](?![也罷罢，,。．？！；：]).*|卷[一二三四五六七八九十百千〇零兩两\d]+.*|楔子|序|自序|引子)$/;
  const chapterReady = cleaned.replace(
    /([。．！!？?；;」』])((?:第[一二三四五六七八九十百千〇零兩两\d]+[回卷章]|卷[一二三四五六七八九十百千〇零兩两\d]+)[\s\u00A0　]{2,}[^\n]{1,80})/g,
    '$1\n$2'
  );
  const lines = chapterReady.split('\n');
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;
  const preface: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isTitle = trimmed.length > 0 && trimmed.length <= 80 && titlePattern.test(trimmed);

    if (isTitle) {
      if (current) chapters.push({ title: current.title, body: current.body.trim() });
      current = { title: trimmed, body: '' };
      continue;
    }

    if (current) {
      current.body += `${line}\n`;
    } else {
      preface.push(line);
    }
  }

  if (current) chapters.push({ title: current.title, body: current.body.trim() });
  if (preface.join('').trim().length > 80) chapters.unshift({ title: '题记', body: preface.join('\n').trim() });
  return chapters.length > 2 ? chapters : chunkLongText(cleaned);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function NovelReader({ novel }: { novel: Novel }) {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const storageKey = `novel-reader:${novel.slug}`;
  const [chapterIndex, setChapterIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem(`${storageKey}:chapter`) ?? 0);
  });
  const [tocOpen, setTocOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const fallback = getDefaultSettings();
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = localStorage.getItem(`${storageKey}:settings`);
      return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
    } catch {
      return fallback;
    }
  });
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch(novel.filePath)
      .then((res) => {
        if (!res.ok) throw new Error('failed');
        return res.text();
      })
      .then((text) => {
        if (alive) setRawText(text);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [novel.filePath]);

  const chapters = useMemo(() => (rawText ? parseChapters(rawText) : []), [rawText]);
  const activeIndex = clamp(chapterIndex, 0, Math.max(chapters.length - 1, 0));
  const activeChapter = chapters[activeIndex];
  const progress = chapters.length ? Math.round(((activeIndex + 1) / chapters.length) * 100) : 0;

  useEffect(() => {
    localStorage.setItem(`${storageKey}:settings`, JSON.stringify(settings));
  }, [settings, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}:chapter`, String(activeIndex));
  }, [activeIndex, storageKey]);

  const goToChapter = (nextIndex: number) => {
    setChapterIndex(clamp(nextIndex, 0, Math.max(chapters.length - 1, 0)));
    setTocOpen(false);
    requestAnimationFrame(() => readerRef.current?.scrollIntoView({ block: 'start' }));
  };

  const paragraphs = activeChapter?.body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean) ?? [];
  const isNight = settings.theme === 'night';

  return (
    <div className={isNight ? 'min-h-screen bg-[#141414] pb-20 text-stone-100 sm:pb-0' : 'min-h-screen bg-[#f7f1e6] pb-20 text-stone-950 sm:pb-0'}>
      {tocOpen ? (
        <button
          type="button"
          aria-label="关闭目录"
          onClick={() => setTocOpen(false)}
          className="fixed inset-0 z-[9997] bg-black/25 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <div className="sticky top-0 z-[70] border-b border-black/10 bg-inherit/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-6 sm:py-3">
          <Link href="/media" className="inline-flex min-w-0 items-center gap-2 text-sm text-current/70 transition hover:text-current">
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate">返回书影音</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button type="button" variant="ghost" size="sm" className="h-10 w-10 px-0" onClick={() => setTocOpen((open) => !open)} aria-label="目录">
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 px-0"
              onClick={() => setSettings((current) => ({ ...current, fontSize: clamp(current.fontSize - 1, 16, 28) }))}
              aria-label="减小字号"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 px-0"
              onClick={() => setSettings((current) => ({ ...current, fontSize: clamp(current.fontSize + 1, 16, 28) }))}
              aria-label="增大字号"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 px-0"
              onClick={() => setSettings((current) => ({ ...current, theme: current.theme === 'paper' ? 'night' : 'paper' }))}
              aria-label="切换主题"
            >
              <SunMedium className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-1 bg-black/10">
          <div className="h-full bg-[var(--color-teal-500)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="mx-auto grid max-w-5xl gap-5 px-3 py-5 sm:px-6 sm:py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className={`${tocOpen ? 'fixed inset-x-3 bottom-[104px] top-16 z-[9998] block lg:static lg:inset-auto lg:z-auto' : 'hidden lg:block'}`}>
          <Card variant="glass" padding="sm" className="h-full max-h-full overflow-y-auto rounded-lg lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">目录</span>
              <div className="flex items-center gap-2">
                <Badge tone="info" variant="soft">{chapters.length} 章</Badge>
                <button
                  type="button"
                  aria-label="关闭目录"
                  onClick={() => setTocOpen(false)}
                  className="rounded-full p-1 text-current/60 hover:bg-black/10 hover:text-current lg:hidden"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <nav className="space-y-1">
              {chapters.map((chapter, index) => (
                <button
                  key={`${chapter.title}-${index}`}
                  type="button"
                  onClick={() => goToChapter(index)}
                  className={`block w-full rounded-md px-2 py-2 text-left text-sm leading-5 transition ${
                    index === activeIndex
                      ? 'bg-[var(--color-teal-500)] text-white'
                      : 'text-current/70 hover:bg-black/10 hover:text-current'
                  }`}
                >
                  <span className="line-clamp-2">{chapter.title}</span>
                </button>
              ))}
            </nav>
          </Card>
        </aside>

        <article ref={readerRef} className="min-w-0">
          <div className="mb-5 space-y-3 sm:mb-8 sm:space-y-4">
            <Badge tone="warning" variant="soft" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Novel Reader
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{novel.title}</h1>
              <p className="mt-3 text-sm text-current/60">
                {novel.originalTitle} · {novel.author} · 来源{' '}
                <a href={novel.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-4">
                  {novel.sourceName}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>

          {!loading && !error ? (
            <div className={`${isNight ? 'bg-[#1f1f1f]/90' : 'bg-[#fffaf0]/90'} sticky top-[57px] z-[60] mb-4 flex items-center justify-between gap-3 rounded-xl border border-black/10 px-3 py-3 shadow-[0_16px_42px_-30px_rgba(0,0,0,0.4)] backdrop-blur sm:hidden`}>
              <Button type="button" variant="secondary" size="sm" className="h-10 min-w-24" onClick={() => goToChapter(activeIndex - 1)} disabled={activeIndex <= 0}>
                <ChevronLeft className="h-4 w-4" />
                上一章
              </Button>
              <button
                type="button"
                onClick={() => setTocOpen(true)}
                className="min-w-0 text-center text-xs text-current/60"
              >
                <span className="block font-medium text-current">{progress}%</span>
                <span className="block truncate">{activeIndex + 1}/{chapters.length}</span>
              </button>
              <Button type="button" variant="secondary" size="sm" className="h-10 min-w-24" onClick={() => goToChapter(activeIndex + 1)} disabled={activeIndex >= chapters.length - 1}>
                下一章
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          {loading ? (
            <Card variant="glass" className="rounded-lg">
              <div className="flex min-h-80 items-center justify-center text-current/60">正在打开小说文本...</div>
            </Card>
          ) : error ? (
            <Card variant="glass" className="rounded-lg">
              <div className="flex min-h-80 items-center justify-center text-current/60">小说文本加载失败，请稍后再试。</div>
            </Card>
          ) : (
            <div className={`${isNight ? 'bg-[#1f1f1f]' : 'bg-[#fffaf0]'} rounded-lg border border-black/10 px-4 py-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.45)] sm:px-10 sm:py-8`}>
              <div className="mb-6 flex items-start justify-between gap-3 border-b border-current/10 pb-5 sm:mb-8">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-current/45">Chapter {activeIndex + 1}</p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight sm:text-3xl">{activeChapter?.title}</h2>
                </div>
                <div className="hidden shrink-0 items-center gap-2 text-sm text-current/55 sm:inline-flex">
                  <Type className="h-4 w-4" />
                  {settings.fontSize}px
                </div>
              </div>

              <div
                className="reader-body space-y-5 break-words font-serif sm:space-y-6"
                style={{ fontSize: settings.fontSize, lineHeight: settings.lineHeight }}
              >
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-10 hidden items-center justify-between gap-3 border-t border-current/10 pt-5 sm:flex">
                <Button type="button" variant="secondary" onClick={() => goToChapter(activeIndex - 1)} disabled={activeIndex <= 0}>
                  <ChevronLeft className="h-4 w-4" />
                  上一章
                </Button>
                <span className="text-sm text-current/55">{progress}%</span>
                <Button type="button" variant="secondary" onClick={() => goToChapter(activeIndex + 1)} disabled={activeIndex >= chapters.length - 1}>
                  下一章
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </article>
      </main>

      {!loading && !error ? (
        <div className={`${isNight ? 'bg-[#1f1f1f]/95' : 'bg-[#fffaf0]/95'} fixed inset-x-3 bottom-[92px] z-[9999] rounded-xl border border-black/10 px-3 py-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] backdrop-blur sm:hidden`}>
          <div className="mx-auto flex max-w-md items-center justify-between gap-3">
            <Button type="button" variant="secondary" size="sm" className="h-10 min-w-24" onClick={() => goToChapter(activeIndex - 1)} disabled={activeIndex <= 0}>
              <ChevronLeft className="h-4 w-4" />
              上一章
            </Button>
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              className="min-w-0 text-center text-xs text-current/60"
            >
              <span className="block font-medium text-current">{progress}%</span>
              <span className="block truncate">{activeIndex + 1}/{chapters.length}</span>
            </button>
            <Button type="button" variant="secondary" size="sm" className="h-10 min-w-24" onClick={() => goToChapter(activeIndex + 1)} disabled={activeIndex >= chapters.length - 1}>
              下一章
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
