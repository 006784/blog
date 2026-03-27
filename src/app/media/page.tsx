'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BookOpen, ExternalLink, Library, RefreshCw, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { type MediaItem } from '@/lib/supabase';

// ── 常量 ──────────────────────────────────────────────────

const TYPE_META = [
  { key: 'all',     label: '全部',  icon: '✦' },
  { key: 'book',    label: '书单',  icon: '📚' },
  { key: 'movie',   label: '影单',  icon: '🎬' },
  { key: 'tv',      label: '剧集',  icon: '📺' },
  { key: 'music',   label: '在听',  icon: '🎵' },
  { key: 'game',    label: '游戏',  icon: '🎮' },
  { key: 'podcast', label: '播客',  icon: '🎙' },
];

const STATUS_META = [
  { key: 'all',   label: '全部' },
  { key: 'want',  label: '想看/想读' },
  { key: 'doing', label: '正在' },
  { key: 'done',  label: '已完成' },
];

const STATUS_TONE: Record<string, 'default' | 'info' | 'success'> = {
  want: 'default',
  doing: 'info',
  done: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  want:  '想看', doing: '进行中', done: '已完成',
};

// ── 评分星星 ──────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= Math.round(rating / 2)
              ? 'fill-amber-400 text-amber-400'
              : 'text-zinc-200 dark:text-zinc-700'
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── 媒体卡片 ──────────────────────────────────────────────

function MediaCard({ item }: { item: MediaItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card
        variant="glass"
        padding="sm"
        className="group flex h-full gap-4 rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
      >
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-overlay)]">
          {item.cover_image ? (
            <Image
              src={item.cover_image}
              alt={item.title}
              width={64}
              height={96}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl">
              {TYPE_META.find((t) => t.key === item.type)?.icon ?? '📦'}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="line-clamp-2 text-base font-semibold leading-tight text-[var(--color-neutral-900)] transition-colors group-hover:text-[var(--color-primary-600)]">
                  {item.title}
                </h3>
                {item.author && (
                  <p className="truncate text-sm text-[var(--color-neutral-500)]">{item.author}</p>
                )}
              </div>
              {item.external_link && (
                <a
                  href={item.external_link}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`打开 ${item.title} 外部链接`}
                  className="mt-0.5 shrink-0 text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-primary-600)]"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[item.status] ?? 'default'}>{STATUS_LABEL[item.status]}</Badge>
              {item.rating ? <RatingStars rating={item.rating} /> : null}
            </div>

            {item.review ? (
              <p className="line-clamp-2 text-sm leading-6 text-[var(--color-neutral-600)]">
                {item.review}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--color-neutral-500)]">
            <span>{TYPE_META.find((t) => t.key === item.type)?.label ?? '内容记录'}</span>
            <span>{item.status === 'done' ? '已完成' : '持续记录中'}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── 主页面 ────────────────────────────────────────────────

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/media');
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        throw new Error('failed');
      }

      setItems(data);
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filtered = items.filter((item) => {
    if (activeType !== 'all' && item.type !== activeType) return false;
    if (activeStatus !== 'all' && item.status !== activeStatus) return false;
    return true;
  });

  // 统计各类型数量
  const typeCounts = TYPE_META.reduce<Record<string, number>>((acc, t) => {
    acc[t.key] = t.key === 'all' ? items.length : items.filter((i) => i.type === t.key).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="warning" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Media Journal
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                书影音
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                把近期读过、看过、听过的内容整理成持续更新的观影与阅读清单。
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">总记录</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{items.length}</p>
              </Card>
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">已完成</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">
                  {items.filter((item) => item.status === 'done').length}
                </p>
              </Card>
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">正在进行</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">
                  {items.filter((item) => item.status === 'doing').length}
                </p>
              </Card>
            </div>
          </div>
        </motion.div>

        <Card variant="glass" className="rounded-[var(--radius-2xl)]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {TYPE_META.filter((t) => t.key === 'all' || typeCounts[t.key] > 0).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveType(t.key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                    activeType === t.key
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                      : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {typeCounts[t.key] > 0 ? <span className="opacity-70">({typeCounts[t.key]})</span> : null}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_META.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setActiveStatus(s.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activeStatus === s.key
                      ? 'border-[var(--color-primary-500)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]'
                      : 'border-[color:var(--border-default)] bg-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-52 rounded-[var(--radius-2xl)]" />
            ))}
          </div>
        ) : error ? (
          <StatePanel
            tone="error"
            icon={<RefreshCw className="h-6 w-6" />}
            title="书影音列表加载失败"
            description="这次没能拿到记录数据，你可以稍后再试一次。"
            action={
              <button
                onClick={() => void loadItems()}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
              >
                <RefreshCw className="h-4 w-4" />
                重新加载
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={items.length === 0 ? <Library className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
            title={items.length === 0 ? '书影音记录尚未配置' : '当前筛选下还没有内容'}
            description={items.length === 0 ? '等你开始整理读书、观影或音乐记录后，这里会展示完整清单。' : '试试切换类型或状态筛选，看看其他分类里的内容。'}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
