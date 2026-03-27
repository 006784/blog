'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Edit3,
  Eye,
  FileEdit,
  FileText,
  Files,
  LayoutDashboard,
  MoreVertical,
  Plus,
  Search,
  Send,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  BlogPost,
  categories,
  deletePost,
  getAllPosts,
  getCategoryInfo,
  publishPost,
  unpublishPost,
} from '@/lib/blog-store';
import { formatDate } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';

type TabType = 'all' | 'published' | 'drafts';

export default function DashboardPage() {
  const [posts, setPosts] = useState<BlogPost[]>(() => getAllPosts());
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function loadPosts() {
    setPosts(getAllPosts());
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredPosts = useMemo(
    () =>
      posts.filter((post) => {
        if (activeTab === 'published' && post.status !== 'published') return false;
        if (activeTab === 'drafts' && post.status !== 'draft') return false;

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!post.title.toLowerCase().includes(query) && !post.description.toLowerCase().includes(query)) {
            return false;
          }
        }

        if (selectedCategory && post.category !== selectedCategory) return false;

        return true;
      }),
    [activeTab, posts, searchQuery, selectedCategory]
  );

  const stats = useMemo(
    () => ({
      total: posts.length,
      published: posts.filter((post) => post.status === 'published').length,
      drafts: posts.filter((post) => post.status === 'draft').length,
    }),
    [posts]
  );

  const handleDelete = (id: string) => {
    deletePost(id);
    loadPosts();
    setShowDeleteModal(null);
    showNotification('success', '文章已删除');
  };

  const handleTogglePublish = (post: BlogPost) => {
    if (post.status === 'published') {
      unpublishPost(post.id);
      showNotification('success', '文章已转为草稿');
    } else {
      publishPost(post.id);
      showNotification('success', '文章已发布');
    }

    loadPosts();
    setOpenMenuId(null);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all', label: '全部', icon: Files, count: stats.total },
    { id: 'published', label: '已发布', icon: Send, count: stats.published },
    { id: 'drafts', label: '草稿', icon: FileEdit, count: stats.drafts },
  ];

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Content Dashboard
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                文章管理
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                在这里查看文章状态、搜索内容、切换分类，并快速进行发布、编辑和删除。
              </p>
            </div>
            <Link href="/write" className="w-full lg:w-auto">
              <Button className="w-full lg:w-auto">
                <Plus className="h-4 w-4" />
                写文章
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: '全部文章', value: stats.total, tone: 'default' as const, icon: FileText },
            { label: '已发布', value: stats.published, tone: 'success' as const, icon: Send },
            { label: '草稿箱', value: stats.drafts, tone: 'warning' as const, icon: Clock },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{stat.value}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card variant="glass" className="rounded-[var(--radius-2xl)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                    activeTab === tab.id
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                      : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <span className="opacity-70">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-500)]" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索文章..."
                  className="pl-11"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 sm:w-[180px]"
              >
                <option value="">全部分类</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <AnimatePresence>
            {filteredPosts.length === 0 ? (
              <StatePanel
                tone="empty"
                title="暂无文章"
                description={searchQuery || selectedCategory ? '没有找到匹配的文章，试试更换搜索词或筛选条件。' : '开始写你的第一篇文章吧。'}
                action={
                  <Link
                    href="/write"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    写文章
                  </Link>
                }
              />
            ) : (
              filteredPosts.map((post, index) => {
                const categoryInfo = getCategoryInfo(post.category);

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.04 }}
                    className="group"
                  >
                    <Card
                      variant="glass"
                      padding="sm"
                      className="rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                    >
                      <div className="flex flex-col gap-4 md:flex-row">
                        {post.image ? (
                          <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[var(--radius-xl)] md:h-auto md:w-52">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              sizes="208px"
                              className="object-cover"
                            />
                          </div>
                        ) : null}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={post.status === 'published' ? 'success' : 'warning'}>
                                  {post.status === 'published' ? '已发布' : '草稿'}
                                </Badge>
                                <Badge variant="soft">{categoryInfo.label}</Badge>
                              </div>

                              <h3 className="truncate text-xl font-semibold text-[var(--color-neutral-900)] transition-colors group-hover:text-[var(--color-primary-600)]">
                                {post.title}
                              </h3>
                              <p className="line-clamp-2 text-sm leading-7 text-[var(--color-neutral-600)]">
                                {post.description || '暂无描述'}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-neutral-500)]">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDate(post.updatedAt || post.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {post.readingTime}
                                </span>
                                {post.tags.length > 0 ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Tag className="h-3.5 w-3.5" />
                                    {post.tags.slice(0, 2).join(', ')}
                                    {post.tags.length > 2 ? ` +${post.tags.length - 2}` : ''}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                className="rounded-full"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>

                              <AnimatePresence>
                                {openMenuId === post.id ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.96, y: -8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                                    className="absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] shadow-[var(--shadow-xl)]"
                                  >
                                    <Link
                                      href={`/write?edit=${post.id}`}
                                      className="flex items-center gap-2 px-4 py-3 text-sm transition hover:bg-[var(--surface-overlay)]"
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      编辑
                                    </Link>
                                    {post.status === 'published' ? (
                                      <Link
                                        href={`/blog/${post.slug}`}
                                        className="flex items-center gap-2 px-4 py-3 text-sm transition hover:bg-[var(--surface-overlay)]"
                                        onClick={() => setOpenMenuId(null)}
                                      >
                                        <Eye className="h-4 w-4" />
                                        查看
                                      </Link>
                                    ) : null}
                                    <button
                                      onClick={() => handleTogglePublish(post)}
                                      className="flex w-full items-center gap-2 px-4 py-3 text-sm transition hover:bg-[var(--surface-overlay)]"
                                    >
                                      {post.status === 'published' ? (
                                        <>
                                          <Clock className="h-4 w-4" />
                                          转为草稿
                                        </>
                                      ) : (
                                        <>
                                          <Send className="h-4 w-4" />
                                          发布
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setShowDeleteModal(post.id);
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-500 transition hover:bg-red-500/10"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      删除
                                    </button>
                                  </motion.div>
                                ) : null}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(null)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
            >
              <Card variant="elevated" padding="lg" className="rounded-[var(--radius-2xl)] text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-semibold text-[var(--color-neutral-900)]">确认删除</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-neutral-600)]">
                  此操作不可撤销，文章将被永久删除。
                </p>
                <div className="mt-6 flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(null)}>
                    取消
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={() => handleDelete(showDeleteModal)}>
                    确认删除
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {notification ? (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.94 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-[var(--radius-xl)] px-4 py-3 text-white shadow-[var(--shadow-lg)] ${
              notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {notification.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {openMenuId ? <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} /> : null}
    </div>
  );
}
