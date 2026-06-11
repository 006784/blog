'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock, Layers3 } from 'lucide-react';
import { getCollectionById, getPostsByCollection, type Collection, type Post, formatDate } from '@/lib/supabase';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface Props {
  params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: Props) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState('');

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [col, colPosts] = await Promise.all([
          getCollectionById(id),
          getPostsByCollection(id),
        ]);
        setCollection(col);
        setPosts(colPosts);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-16 animate-pulse">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 bg-(--surface-overlay) rounded w-1/3" />
          <div className="h-4 bg-(--surface-overlay) rounded w-2/3" />
          <div className="space-y-3 mt-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-(--surface-overlay) rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen px-6 py-16 text-center text-ink-muted">
        合集不存在
        <Link href="/collections" className="block mt-4 text-sm text-gold hover:underline">
          返回合集列表
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute right-[8%] top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-smoke-blue-100)_0%,transparent_70%)] opacity-50 blur-3xl" />
      <div className="relative mx-auto max-w-3xl">
        {/* 面包屑 */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: '首页', href: '/' },
              { label: '精选合集', href: '/collections' },
              { label: collection.name },
            ]}
          />
        </div>

        {/* 返回 */}
        <Link
          href="/collections"
          className="mb-8 inline-flex items-center gap-2 text-sm text-ink-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回合集
        </Link>

        {/* 合集信息 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {collection.cover_image ? (
            <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-(--surface-overlay)">
              <Image
                src={collection.cover_image}
                alt={collection.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-(--surface-base)/80 to-transparent" />
            </div>
          ) : (
            <div
              className="relative mb-6 flex h-32 items-center justify-center overflow-hidden rounded-2xl text-6xl font-semibold opacity-20"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${collection.color || 'var(--color-primary-500)'} 20%, var(--surface-overlay)), var(--surface-raised))`,
                color: collection.color || 'var(--color-primary-500)',
              }}
            >
              {collection.name.charAt(0)}
            </div>
          )}

          <h1 className="text-3xl font-semibold tracking-tight text-ink">{collection.name}</h1>
          {collection.description && (
            <p className="mt-2 text-ink-secondary">{collection.description}</p>
          )}
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
            style={{
              background: `color-mix(in srgb, ${collection.color || 'var(--color-primary-500)'} 15%, transparent)`,
              color: collection.color || 'var(--color-primary-500)',
            }}
          >
            <Layers3 className="h-3.5 w-3.5" />
            {collection.post_count} 篇文章
          </div>
        </motion.div>

        {/* 文章列表 */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--border-default) py-12 text-center text-ink-muted">
            <p>该合集暂无文章</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {posts.map((post, i) => {
              const date = post.published_at || post.created_at;
              const cover = post.cover_image || post.image;
              return (
                <motion.li
                  key={post.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group flex gap-4 rounded-2xl border border-(--border-default) bg-(--surface-raised) p-4 shadow-(--neu-shadow-sm) transition-all hover:border-orange-500/40"
                  >
                    {/* 序号 */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5 bg-(--surface-overlay) text-orange-500">
                      {i + 1}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-ink group-hover:text-gold transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-1 text-sm text-ink-secondary line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(date)}
                        </span>
                        {post.reading_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.reading_time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 封面缩略图 */}
                    {cover && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-(--surface-overlay)">
                        <Image
                          src={cover}
                          alt={post.title}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
