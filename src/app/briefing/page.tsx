'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, CalendarDays, ChevronDown, Cloud, Edit3,
  ExternalLink, Heart, Loader2, Plus, Save, Smile, Sparkles, Trash2, X,
} from 'lucide-react';
import { LinkPreviewCard } from '@/components/LinkPreviewCard';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import { showToast } from '@/lib/toast';
import { showConfirm } from '@/lib/confirm';

// ── 类型 ──────────────────────────────────────────────────────────
interface BriefingLink { title: string; url: string; comment?: string }
interface Briefing {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string | null;
  weather?: string | null;
  links: BriefingLink[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// ── 工具 ──────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

// ── 编辑弹窗 ──────────────────────────────────────────────────────
function BriefingEditor({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Briefing>;
  onSave: (data: Partial<Briefing>) => Promise<void>;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initial?.date ?? today);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [mood, setMood] = useState(initial?.mood ?? '');
  const [weather, setWeather] = useState(initial?.weather ?? '');
  const [links, setLinks] = useState<BriefingLink[]>(initial?.links ?? []);
  const [saving, setSaving] = useState(false);

  function addLink() { setLinks((l) => [...l, { title: '', url: '', comment: '' }]); }
  function removeLink(i: number) { setLinks((l) => l.filter((_, idx) => idx !== i)); }
  function updateLink(i: number, field: keyof BriefingLink, val: string) {
    setLinks((l) => l.map((link, idx) => idx === i ? { ...link, [field]: val } : link));
  }

  async function handleSave() {
    if (!content.trim()) { showToast.error('请填写简报内容'); return; }
    setSaving(true);
    try {
      await onSave({
        date,
        title: title.trim(),
        content: content.trim(),
        mood: mood.trim() || null,
        weather: weather.trim() || null,
        links: links.filter((l) => l.url.trim()),
        is_public: true,
      });
      onClose();
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-2xl max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="elevated" className="overflow-hidden p-0 flex flex-col max-h-[90dvh]">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-(--border-default) px-5 py-4 shrink-0">
            <h2 className="font-semibold text-ink">{initial?.id ? '编辑简报' : '新建简报'}</h2>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-(--surface-overlay)" aria-label="关闭">
              <X className="h-4 w-4 text-ink-muted" />
            </button>
          </div>

          {/* 表单 */}
          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* 日期 + 标题 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-ink-muted">日期</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-ink-muted">标题（选填）</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="今天的主题" />
              </div>
            </div>

            {/* 心情 + 天气 */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm text-ink-muted flex items-center gap-1"><Smile className="h-3.5 w-3.5" />心情</label>
                <Input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="平静 / 充实 / 疲惫…" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-ink-muted flex items-center gap-1"><Cloud className="h-3.5 w-3.5" />天气</label>
                <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="晴 / 阴 / 小雨…" />
              </div>
            </div>

            {/* 正文 */}
            <div className="space-y-1.5">
              <label className="text-sm text-ink-muted">内容（Markdown）</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder={`## 今日小结\n\n写下今天发生了什么，读了什么，想了什么…`}
                className="font-mono text-sm"
              />
            </div>

            {/* 相关链接 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-ink-muted">相关链接</label>
                <button type="button" onClick={addLink} className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 transition-colors">
                  <Plus className="h-3.5 w-3.5" />添加链接
                </button>
              </div>
              {links.map((link, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      value={link.title}
                      onChange={(e) => updateLink(i, 'title', e.target.value)}
                      placeholder="链接标题"
                      className="text-sm"
                    />
                    <Input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(i, 'url', e.target.value)}
                      placeholder="https://..."
                      className="text-sm"
                    />
                    <Input
                      value={link.comment ?? ''}
                      onChange={(e) => updateLink(i, 'comment', e.target.value)}
                      placeholder="一句话介绍（选填）"
                      className="text-sm"
                    />
                  </div>
                  <button type="button" onClick={() => removeLink(i)} className="mt-1 p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" aria-label="删除链接">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 底部 */}
          <div className="flex justify-end gap-2 border-t border-(--border-default) px-5 py-4 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button onClick={handleSave} loading={saving}>
              {!saving && <Save className="h-4 w-4" />}
              保存
            </Button>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ── 单条简报卡片 ──────────────────────────────────────────────────
function BriefingCard({
  briefing,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  isAdmin,
}: {
  briefing: Briefing;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}) {
  const isToday = briefing.date === new Date().toISOString().slice(0, 10);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card variant={isToday ? 'bordered' : 'default'} padding="sm"
        className={`rounded-2xl transition-all ${isToday ? 'border-gold/30' : ''}`}
      >
        {/* 简报头 */}
        <button
          type="button"
          className="w-full flex items-start gap-3 text-left"
          onClick={onToggle}
        >
          {/* 日期圆圈 */}
          <div className={`flex-none w-12 h-12 rounded-full flex flex-col items-center justify-center border ${
            isToday ? 'border-gold bg-gold/10 text-gold' : 'border-(--border-default) text-ink-muted'
          }`}>
            <span className="text-xs font-medium leading-none">{briefing.date.slice(5, 7)}</span>
            <span className="text-base font-bold leading-none">{briefing.date.slice(8, 10)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isToday && <Badge tone="info" variant="soft" className="text-xs">今天</Badge>}
              {briefing.title && (
                <span className="font-semibold text-ink truncate">{briefing.title}</span>
              )}
              <span className="text-xs text-ink-ghost">{formatDate(briefing.date)}</span>
            </div>
            {!expanded && (
              <p className="mt-1 text-sm text-ink-muted line-clamp-2 leading-relaxed">
                {briefing.content.replace(/#+\s/g, '').slice(0, 120)}…
              </p>
            )}
            <div className="flex items-center gap-3 mt-1.5">
              {briefing.mood && (
                <span className="flex items-center gap-1 text-xs text-ink-ghost">
                  <Smile className="h-3 w-3" />{briefing.mood}
                </span>
              )}
              {briefing.weather && (
                <span className="flex items-center gap-1 text-xs text-ink-ghost">
                  <Cloud className="h-3 w-3" />{briefing.weather}
                </span>
              )}
              {briefing.links.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-ink-ghost">
                  <ExternalLink className="h-3 w-3" />{briefing.links.length} 个链接
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 rounded-lg text-ink-ghost hover:text-ink hover:bg-(--surface-overlay) transition-colors"
                  aria-label="编辑"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <ChevronDown className={`h-4 w-4 text-ink-ghost transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* 展开内容 */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-(--border-default) space-y-4">
                {/* Markdown 正文 — 复用文章日系排版 */}
                <div className="briefing-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{briefing.content}</ReactMarkdown>
                </div>

                {/* 相关链接（富预览卡片） */}
                {briefing.links.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-ink-ghost flex items-center gap-1.5">
                      <ExternalLink className="h-3 w-3" />相关链接
                    </p>
                    <div className="space-y-2 pt-1">
                      {briefing.links.map((link, i) => (
                        <LinkPreviewCard key={i} url={link.url} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ── 主页面 ─────────────────────────────────────────────────────────
export default function BriefingPage() {
  const { isAdmin } = useAdmin();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Briefing> | null>(null);
  const [generating, setGenerating] = useState(false);
  const LIMIT = 15;

  const loadBriefings = useCallback(async (p: number, append = false) => {
    try {
      if (p === 1) setLoading(true); else setLoadingMore(true);
      const res = await fetch(`/api/briefings?limit=${LIMIT}&page=${p}`);
      const data = await res.json() as { briefings: Briefing[]; total: number };
      setBriefings((prev) => append ? [...prev, ...data.briefings] : data.briefings);
      setTotal(data.total);
      // auto-expand today's entry
      if (!append && data.briefings[0]) {
        const today = new Date().toISOString().slice(0, 10);
        if (data.briefings[0].date === today) setExpandedId(data.briefings[0].id);
      }
    } catch {
      showToast.error('简报加载失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { void loadBriefings(1); }, [loadBriefings]);

  async function handleSave(data: Partial<Briefing>) {
    const isEdit = Boolean(editing?.id);
    const url = isEdit ? `/api/briefings/${editing!.id}` : '/api/briefings';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(err?.error ?? '保存失败');
    }
    showToast.success(isEdit ? '已更新' : '已发布');
    void loadBriefings(1);
  }

  async function handleDelete(id: string) {
    const ok = await showConfirm({ title: '删除简报', description: '确定删除这条简报吗？此操作不可撤销。' });
    if (!ok) return;
    const res = await fetch(`/api/briefings/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { showToast.error('删除失败'); return; }
    showToast.success('已删除');
    setBriefings((prev) => prev.filter((b) => b.id !== id));
    setTotal((t) => t - 1);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/briefings/generate', { method: 'POST', credentials: 'include' });
      const data = await res.json() as { briefing?: { title: string }; error?: string; newsCount?: number };
      if (!res.ok) throw new Error(data.error ?? 'AI 生成失败');
      showToast.success(`已生成「${data.briefing?.title ?? '今日简报'}」（抓取 ${data.newsCount ?? 0} 条新闻）`);
      void loadBriefings(1);
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : 'AI 生成失败');
    } finally {
      setGenerating(false);
    }
  }

  const hasMore = briefings.length < total;

  return (
    <div className="min-h-screen px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* 页头 */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-gold transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />返回首页
          </Link>
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-5 w-5 text-gold" />
                <span className="text-xs uppercase tracking-widest text-ink-muted">Daily Briefing</span>
              </div>
              <h1 className="text-3xl font-semibold text-ink">每日简报</h1>
              <p className="mt-1 text-sm text-ink-muted">每天的一点记录，慢慢堆叠成时光。</p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  loading={generating}
                  title="用 DeepSeek AI 自动抓取今日新闻并生成简报"
                >
                  {!generating && <Sparkles className="h-4 w-4" />}
                  AI 生成
                </Button>
                <Button onClick={() => setEditing({})}>
                  <Plus className="h-4 w-4" />新建简报
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* 简报列表 */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : briefings.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={<Heart className="h-6 w-6" />}
            title="还没有简报"
            description="每天的小记录，就从今天开始吧。"
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {briefings.map((b) => (
                <BriefingCard
                  key={b.id}
                  briefing={b}
                  expanded={expandedId === b.id}
                  onToggle={() => setExpandedId((prev) => prev === b.id ? null : b.id)}
                  onEdit={() => setEditing(b)}
                  onDelete={() => handleDelete(b.id)}
                  isAdmin={isAdmin}
                />
              ))}
            </AnimatePresence>

            {hasMore && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    void loadBriefings(next, true);
                  }}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-(--border-default) text-sm text-ink-muted hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                  加载更多（共 {total} 条）
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <AnimatePresence>
        {editing !== null && (
          <BriefingEditor
            initial={editing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
