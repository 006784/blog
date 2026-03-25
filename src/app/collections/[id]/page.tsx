'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';
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
          <div className="h-8 bg-zinc-100 dark:bg-zinc-800 rounded w-1/3" />
          <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-2/3" />
          <div className="space-y-3 mt-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen px-6 py-16 text-center text-zinc-500">
        合集不存在
        <Link href="/collections" className="block mt-4 text-sm underline">
          返回合集列表
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl">
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
          className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
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
          {collection.cover_image && (
            <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={collection.cover_image}
                alt={collection.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-zinc-950/80 to-transparent" />
            </div>
          )}

          <h1 className="text-3xl font-semibold tracking-tight">{collection.name}</h1>
          {collection.description && (
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{collection.description}</p>
          )}
          <p className="mt-2 text-sm text-zinc-400">{collection.post_count} 篇文章</p>
        </motion.div>

        {/* 文章列表 */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-12 text-center text-zinc-400">
            <p>该合集暂无文章</p>
          </div>
        ) : (
          <ol className="space-y-4">
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
                    className="group flex gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all backdrop-blur"
                  >
                    {/* 序号 */}
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-400 shrink-0 mt-0.5">
                      {i + 1}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {post.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
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
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800">
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
