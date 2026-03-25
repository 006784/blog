'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { BookMarked, ArrowRight } from 'lucide-react';
import { getCollections, type Collection } from '@/lib/supabase';

function Skeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-44 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
      ))}
    </div>
  );
}

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
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-semibold tracking-tight">精选合集</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            将相关文章与资源整理成主题合集
          </p>
        </motion.div>

        {loading ? (
          <Skeleton />
        ) : collections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
            <BookMarked className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p>暂无公开合集</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {collections.map((col, i) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={`/collections/${col.id}`}
                  className="group block rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-600 transition-all backdrop-blur"
                >
                  {/* 封面 */}
                  <div className="relative h-32 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
                    {col.cover_image ? (
                      <Image
                        src={col.cover_image}
                        alt={col.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-4xl font-bold opacity-10"
                        style={{ color: col.color || '#888' }}
                      >
                        {col.name.charAt(0)}
                      </div>
                    )}
                    {/* 渐变遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-zinc-900/80 to-transparent" />
                  </div>

                  {/* 内容 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                          {col.name}
                        </h2>
                        {col.description && (
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {col.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0 mt-1" />
                    </div>
                    <div className="mt-3 text-xs text-zinc-400">
                      {col.post_count} 篇文章
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
