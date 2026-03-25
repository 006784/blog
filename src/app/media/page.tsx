'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Star, ExternalLink } from 'lucide-react';
import { getMediaItems, type MediaItem } from '@/lib/supabase';

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

const STATUS_COLOR: Record<string, string> = {
  want:  'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
  doing: 'bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400',
  done:  'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400',
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
      className="group flex gap-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-3 backdrop-blur hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
    >
      {/* 封面 */}
      <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
        {item.cover_image ? (
          <Image
            src={item.cover_image}
            alt={item.title}
            width={56}
            height={80}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {TYPE_META.find((t) => t.key === item.type)?.icon ?? '📦'}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-tight">
            {item.title}
          </h3>
          {item.external_link && (
            <a
              href={item.external_link}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors shrink-0 mt-0.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {item.author && (
          <p className="text-xs text-zinc-400 mt-0.5 truncate">{item.author}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[item.status]}`}>
            {STATUS_LABEL[item.status]}
          </span>
          {item.rating && <RatingStars rating={item.rating} />}
        </div>

        {item.review && (
          <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {item.review}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── 主页面 ────────────────────────────────────────────────

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    getMediaItems().then(setItems).finally(() => setLoading(false));
  }, []);

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
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-semibold tracking-tight">书影音</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            读过的书、看过的影、听过的音
          </p>
        </motion.div>

        {/* 类型 Tab */}
        <div className="mb-4 flex flex-wrap gap-2">
          {TYPE_META.filter((t) => t.key === 'all' || typeCounts[t.key] > 0).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeType === t.key
                  ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {typeCounts[t.key] > 0 && (
                <span className="opacity-60">({typeCounts[t.key]})</span>
              )}
            </button>
          ))}
        </div>

        {/* 状态筛选 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {STATUS_META.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveStatus(s.key)}
              className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                activeStatus === s.key
                  ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
            <p className="text-3xl mb-3">📚</p>
            <p>{items.length === 0 ? '书影音记录尚未配置' : '暂无匹配的内容'}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item) => (
              <MediaCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
