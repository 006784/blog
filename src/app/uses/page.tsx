'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { getUsesItems, type UsesItem } from '@/lib/supabase';

// ── 分类配置 ──────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  hardware:   { label: '硬件设备',   icon: '💻' },
  software:   { label: '常用软件',   icon: '📱' },
  'dev-tools':{ label: '开发工具',   icon: '🛠' },
  services:   { label: '云服务',     icon: '☁️' },
  design:     { label: '设计工具',   icon: '🎨' },
  daily:      { label: '日常',       icon: '✨' },
};

function getCategoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? { label: cat, icon: '📦' };
}

function Skeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-24 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function UsesPage() {
  const [items, setItems] = useState<UsesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsesItems().then(setItems).finally(() => setLoading(false));
  }, []);

  // 按分类分组，保留 CATEGORY_META 中定义的顺序
  const grouped = items.reduce<Record<string, UsesItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const categoryOrder = [
    ...Object.keys(CATEGORY_META).filter((k) => grouped[k]),
    ...Object.keys(grouped).filter((k) => !CATEGORY_META[k]),
  ];

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-semibold tracking-tight">工具箱</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            我日常使用的硬件、软件和服务
          </p>
        </motion.div>

        {loading ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
            <p className="text-3xl mb-3">🛠</p>
            <p>工具箱内容尚未配置</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categoryOrder.map((category, ci) => {
              const meta = getCategoryMeta(category);
              return (
                <motion.section
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.07 }}
                >
                  {/* 分类标题 */}
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-lg">{meta.icon}</span>
                    <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                      {meta.label}
                    </h2>
                    <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                  </div>

                  {/* 工具网格 */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {grouped[category].map((item, ii) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: ci * 0.07 + ii * 0.03 }}
                        className="group relative rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 backdrop-blur hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {item.icon_url ? (
                            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                              <Image
                                src={item.icon_url}
                                alt={item.name}
                                width={36}
                                height={36}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-base">
                              {meta.icon}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                                {item.name}
                              </h3>
                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors shrink-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            {item.description && (
                              <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
