'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookMarked, Layers3, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { getCollections, type Collection } from '@/lib/supabase';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCollections()
      .then((data) => setCollections(data.filter((c) => c.is_public)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Theme Collections
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                精选合集
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                把文章、灵感和资料整理成一组一组的主题入口，让内容比单篇阅读更有上下文。
              </p>
            </div>
            <Card
              variant="glass"
              padding="sm"
              className="w-full max-w-sm rounded-[var(--radius-2xl)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-neutral-500)]">
                    Public Collections
                  </p>
                  <p className="text-2xl font-semibold text-[var(--color-neutral-900)]">
                    {collections.length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[290px] rounded-[var(--radius-2xl)]" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={<BookMarked className="h-6 w-6" />}
            title="还没有公开合集"
            description="等你整理出第一组主题内容后，这里会自动展示合集封面和文章数量。"
            className="min-h-[320px]"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/collections/${col.id}`} className="group block h-full">
                  <Card
                    variant="glass"
                    padding="sm"
                    className="flex h-full flex-col overflow-hidden rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-xl)]"
                  >
                    <div className="relative h-40 overflow-hidden rounded-[calc(var(--radius-2xl)-8px)] bg-[linear-gradient(135deg,var(--surface-overlay),var(--surface-raised))]">
                      {col.cover_image ? (
                        <Image
                          src={col.cover_image}
                          alt={col.name}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center text-5xl font-semibold opacity-20"
                          style={{ color: col.color || 'var(--color-primary-500)' }}
                        >
                          {col.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                      <div className="absolute left-4 top-4">
                        <Badge variant="soft" className="border-white/20 bg-black/35 text-white">
                          {col.post_count} 篇文章
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between gap-4 px-1 pb-1 pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-[var(--color-neutral-900)] transition-colors group-hover:text-[var(--color-primary-600)]">
                              {col.name}
                            </h2>
                            {col.description ? (
                              <p className="line-clamp-3 text-sm leading-6 text-[var(--color-neutral-600)]">
                                {col.description}
                              </p>
                            ) : (
                              <p className="text-sm leading-6 text-[var(--color-neutral-500)]">
                                一个围绕 {col.name} 展开的主题内容集合。
                              </p>
                            )}
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--color-neutral-500)] transition-transform duration-[var(--duration-fast)] group-hover:translate-x-1 group-hover:text-[var(--color-primary-600)]" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--color-neutral-500)]">
                        <span>主题阅读入口</span>
                        <span>查看合集</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
