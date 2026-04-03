'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, FileText, Camera, BookOpen, Folder,
  Plus, Edit2, Trash2, X, Loader2, Save,
  Eye, EyeOff, TrendingUp, LogOut, Lock,
  ArrowLeft, BarChart2, Film, Clock, Wrench, BookMarked, Sparkles, Code2,
  Fingerprint, MonitorSmartphone, KeyRound, ShieldCheck
} from 'lucide-react';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { PracticeAdminTab } from '@/components/practice/admin/PracticeAdminTab';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/AdminProvider';
import { showConfirm } from '@/lib/confirm';
import { showToast } from '@/lib/toast';
import {
  Post, Photo, Diary, Album,
  getAllPosts, getAllPhotos, getDiaries, getAlbums,
  formatDate
} from '@/lib/supabase';

const PAGE_SIZE = 20;

type TabType = 'overview' | 'posts' | 'photos' | 'diary' | 'albums' | 'analytics' | 'practice' | 'security';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const { isAdmin, loading: authLoading, logout } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // 等 auth 检查完成再操作，避免 loading 阶段误跳转
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/admin/login?redirect=/admin');
    } else {
      loadAllData();
    }
  }, [isAdmin, authLoading, router]);

  async function loadAllData() {
    try {
      setLoading(true);
      const [postsData, photosData, diariesData, albumsData] = await Promise.all([
        getAllPosts(),
        getAllPhotos(),
        getDiaries(false),
        getAlbums()
      ]);
      setPosts(postsData);
      setPhotos(photosData);
      setDiaries(diariesData);
      setAlbums(albumsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(id: string) {
    const ok = await showConfirm({ title: '删除文章', description: '确定删除这篇文章吗？此操作不可恢复。', confirmText: '删除', danger: true });
    if (!ok) return;
    try {
      const res = await fetch(`/api/posts/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setPosts(posts.filter(p => p.id !== id));
      showToast.success('文章已删除');
    } catch {
      showToast.error('删除失败，请稍后再试');
    }
  }

  async function handleDeletePhoto(id: string) {
    const ok = await showConfirm({ title: '删除照片', description: '确定删除这张照片吗？', confirmText: '删除', danger: true });
    if (!ok) return;
    try {
      const res = await fetch(`/api/gallery/photos/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setPhotos(photos.filter(p => p.id !== id));
      showToast.success('照片已删除');
    } catch {
      showToast.error('删除失败，请稍后再试');
    }
  }

  async function handleDeleteDiary(id: string) {
    const ok = await showConfirm({ title: '删除日记', description: '确定删除这篇日记吗？', confirmText: '删除', danger: true });
    if (!ok) return;
    try {
      const res = await fetch(`/api/diaries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setDiaries(diaries.filter(d => d.id !== id));
      showToast.success('日记已删除');
    } catch {
      showToast.error('删除失败，请稍后再试');
    }
  }

  async function handleDeleteAlbum(id: string) {
    const ok = await showConfirm({ title: '删除相册', description: '确定删除这个相册吗？相册内的照片不会被删除。', confirmText: '删除', danger: true });
    if (!ok) return;
    try {
      const res = await fetch(`/api/gallery/albums/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setAlbums(albums.filter(a => a.id !== id));
      showToast.success('相册已删除');
    } catch {
      showToast.error('删除失败，请稍后再试');
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <StatePanel
            tone="loading"
            title={authLoading ? '正在验证管理员身份' : '正在跳转登录页'}
            description="请稍等，后台会在身份检查完成后自动恢复。"
            icon={<Shield className="h-6 w-6" />}
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType,   label: '总览', icon: TrendingUp },
    { id: 'posts' as TabType,      label: '文章', icon: FileText,  count: posts.length },
    { id: 'photos' as TabType,     label: '照片', icon: Camera,    count: photos.length },
    { id: 'diary' as TabType,      label: '日记', icon: BookOpen,  count: diaries.length },
    { id: 'albums' as TabType,     label: '相册', icon: Folder,    count: albums.length },
    { id: 'analytics' as TabType,  label: '统计', icon: BarChart2 },
    { id: 'practice' as TabType,   label: '题库', icon: Code2 },
    { id: 'security' as TabType,   label: '安全', icon: Lock },
  ];

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
                  <Shield className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">管理后台</h1>
                  <p className="text-sm text-muted-foreground">集中维护你的内容、统计和专题资产。</p>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-destructive"
            onClick={async () => {
              const ok = await showConfirm({ description: '确定要退出登录吗？' });
              if (ok) { await logout(); router.replace('/admin/login'); }
            }}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </motion.div>

        {/* Body: sidebar (lg+) or top-tab (mobile) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar / top tabs */}
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-8 lg:h-fit lg:w-52 lg:shrink-0"
          >
            {/* mobile: horizontal scroll strip */}
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                      : 'border border-[color:var(--border-default)] bg-[var(--surface-panel)] text-muted-foreground hover:bg-[var(--surface-overlay)]'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--surface-overlay)] text-muted-foreground'
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* desktop: vertical sidebar */}
            <Card variant="default" padding="sm" className="hidden flex-col gap-1 rounded-[var(--radius-2xl)] lg:flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-xs)]'
                      : 'text-muted-foreground hover:bg-[var(--surface-overlay)] hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-xs leading-none ${
                      activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--surface-overlay)] text-muted-foreground'
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </Card>
          </motion.aside>

          {/* Main content */}
          <div className="min-w-0 flex-1">
        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载后台数据"
            description="正在整理文章、照片、日记和相册统计。"
            icon={<Loader2 className="h-6 w-6 animate-spin" />}
          />
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab 
                posts={posts} 
                photos={photos} 
                diaries={diaries} 
                albums={albums}
              />
            )}
            {activeTab === 'posts' && (
              <PostsTab 
                posts={posts} 
                onDelete={handleDeletePost}
              />
            )}
            {activeTab === 'photos' && (
              <PhotosTab 
                photos={photos} 
                onDelete={handleDeletePhoto}
              />
            )}
            {activeTab === 'diary' && (
              <DiaryTab 
                diaries={diaries} 
                onDelete={handleDeleteDiary}
              />
            )}
            {activeTab === 'albums' && (
              <AlbumsTab
                albums={albums}
                onDelete={handleDeleteAlbum}
                onEdit={(album) => { setEditingAlbum(album); setShowAlbumModal(true); }}
                onAdd={() => { setEditingAlbum(null); setShowAlbumModal(true); }}
              />
            )}
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AnalyticsDashboard />
              </motion.div>
            )}
            {activeTab === 'practice' && (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <PracticeAdminTab />
              </motion.div>
            )}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <SecurityTab />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Album Modal */}
        <AnimatePresence>
          {showAlbumModal && (
            <AlbumModal
              album={editingAlbum}
              onClose={() => { setShowAlbumModal(false); setEditingAlbum(null); }}
              onSave={async (data) => {
                if (editingAlbum) {
                  const res = await fetch(`/api/gallery/albums/${editingAlbum.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  if (!res.ok) throw new Error('更新失败');
                  const { album: updated } = await res.json();
                  setAlbums(albums.map(a => a.id === editingAlbum.id ? updated : a));
                } else {
                  const res = await fetch('/api/gallery/albums', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  if (!res.ok) throw new Error('创建失败');
                  const { album: newAlbum } = await res.json();
                  setAlbums([newAlbum, ...albums]);
                }
                setShowAlbumModal(false);
                setEditingAlbum(null);
              }}
            />
          )}
        </AnimatePresence>
          </div>{/* end flex-1 */}
        </div>{/* end flex-row */}
      </div>
    </div>
  );
}

const adminLinkButtonCls =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-transparent bg-[var(--color-primary-500)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:bg-[var(--color-primary-600)]';

const adminIconButtonCls =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-700)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--color-neutral-900)]';

function postStatusTone(status: string): 'success' | 'warning' {
  return status === 'published' ? 'success' : 'warning';
}

// Overview Tab
function OverviewTab({ posts, photos, diaries, albums }: {
  posts: Post[];
  photos: Photo[];
  diaries: Diary[];
  albums: Album[];
}) {
  const stats = [
    { label: '文章', value: posts.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: '照片', value: photos.length, icon: Camera, color: 'from-purple-500 to-pink-500' },
    { label: '日记', value: diaries.length, icon: BookOpen, color: 'from-amber-500 to-orange-500' },
    { label: '相册', value: albums.length, icon: Folder, color: 'from-green-500 to-emerald-500' },
  ];

  const recentPosts = posts.slice(0, 5);
  const publicDiaries = diaries.filter(d => d.is_public).length;
  const privateDiaries = diaries.filter(d => !d.is_public).length;
  const quickLinks = [
    { href: '/write', icon: FileText, title: '写文章', description: '创建新的博客文章' },
    { href: '/gallery', icon: Camera, title: '上传照片', description: '添加新照片到相册' },
    { href: '/diary', icon: BookOpen, title: '写日记', description: '记录今天的心情' },
    { href: '/admin/now', icon: Sparkles, title: '此刻', description: '更新当下的状态与关注' },
    { href: '/admin/collections', icon: BookMarked, title: '精选合集', description: '创建文章主题合集' },
    { href: '/admin/media', icon: Film, title: '书影音', description: '管理观影读书记录' },
    { href: '/admin/timeline', icon: Clock, title: '时间线', description: '管理重要人生节点' },
    { href: '/admin/uses', icon: Wrench, title: '工具箱', description: '管理硬件与软件配置' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="default" className="relative overflow-hidden rounded-[var(--radius-2xl)]">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
              <stat.icon className="mb-3 h-8 w-8 text-primary" />
              <div className="text-3xl font-semibold">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="group">
            <motion.div whileHover={{ scale: 1.01 }}>
              <Card
                variant="default"
                className="rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <item.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-1 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card variant="elevated" className="rounded-[var(--radius-2xl)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <FileText className="h-5 w-5 text-primary" />
              最近文章
            </h3>
            <Link href="/write" className={adminLinkButtonCls}>
              <Plus className="h-4 w-4" />
              写文章
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <StatePanel
              tone="empty"
              title="还没有文章"
              description="发布第一篇文章后，这里会显示最近内容。"
            />
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-xs)]"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium">{post.title}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(post.created_at)}</span>
                      <Badge tone={postStatusTone(post.status)} variant="soft">
                        {post.status === 'published' ? '已发布' : '草稿'}
                      </Badge>
                    </div>
                  </div>
                  <Link href={`/write?edit=${post.id}`}>
                    <span className={adminIconButtonCls}>
                      <Edit2 className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="elevated" className="rounded-[var(--radius-2xl)]">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            日记统计
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4">
              <Eye className="mb-3 h-6 w-6 text-green-500" />
              <div className="text-2xl font-semibold">{publicDiaries}</div>
              <div className="text-sm text-muted-foreground">公开日记</div>
            </div>
            <div className="rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4">
              <EyeOff className="mb-3 h-6 w-6 text-amber-500" />
              <div className="text-2xl font-semibold">{privateDiaries}</div>
              <div className="text-sm text-muted-foreground">私密日记</div>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}


function Paginator({ total, page, setPage }: { total: number; page: number; setPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>共 {total} 条，第 {page + 1} / {totalPages} 页</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          className="rounded-[var(--radius-md)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-3 py-1.5 disabled:opacity-40 hover:bg-[var(--surface-overlay)]"
        >
          上一页
        </button>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages - 1}
          className="rounded-[var(--radius-md)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-3 py-1.5 disabled:opacity-40 hover:bg-[var(--surface-overlay)]"
        >
          下一页
        </button>
      </div>
    </div>
  );
}

// Posts Tab
function PostsTab({ posts, onDelete }: { posts: Post[]; onDelete: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const paged = posts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">所有文章</h2>
        <Link href="/write" className={adminLinkButtonCls}>
          <Plus className="w-4 h-4" />
          写文章
        </Link>
      </div>

      <Card variant="elevated" padding="sm" className="overflow-hidden rounded-[var(--radius-2xl)]">
        {posts.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有文章"
            description="从写作页开始创建第一篇文章。"
          />
        ) : (
          <div className="space-y-3">
            {paged.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-xs)]"
              >
                {post.cover_image ? (
                  <Image src={post.cover_image} alt="" width={72} height={54} className="rounded-[var(--radius-lg)] object-cover" />
                ) : (
                  <div className="flex h-[54px] w-[72px] shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--surface-overlay)] text-muted-foreground">
                    <FileText className="h-4 w-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-medium">{post.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(post.created_at)}</span>
                    <Badge tone={postStatusTone(post.status)} variant="soft">
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </Badge>
                    <span>{post.views} 阅读</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/blog/${post.slug}`}>
                    <span className={adminIconButtonCls}>
                      <Eye className="w-4 h-4" />
                    </span>
                  </Link>
                  <Link href={`/write?edit=${post.id}`}>
                    <span className={adminIconButtonCls}>
                      <Edit2 className="w-4 h-4" />
                    </span>
                  </Link>
                  <button
                    onClick={() => onDelete(post.id)}
                    className={`${adminIconButtonCls} hover:border-red-400 hover:text-red-500`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Paginator total={posts.length} page={page} setPage={setPage} />
    </motion.div>
  );
}

// Photos Tab
function PhotosTab({ photos, onDelete }: { photos: Photo[]; onDelete: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const paged = photos.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">所有照片</h2>
        <Link href="/gallery" className={adminLinkButtonCls}>
          <Plus className="w-4 h-4" />
          上传照片
        </Link>
      </div>

      {photos.length === 0 ? (
        <StatePanel
          tone="empty"
          title="还没有照片"
          description="上传第一张照片后，这里会显示相册缩略图。"
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paged.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]"
            >
              <Image
                src={photo.thumbnail_url || photo.url}
                alt={photo.title || ''}
                fill
                sizes="(max-width: 768px) 50vw, 16vw"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => onDelete(photo.id)}
                  className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {photo.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs truncate">{photo.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Paginator total={photos.length} page={page} setPage={setPage} />
    </motion.div>
  );
}

// Diary Tab
function DiaryTab({ diaries, onDelete }: { diaries: Diary[]; onDelete: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const paged = diaries.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">所有日记</h2>
        <Link href="/diary" className={adminLinkButtonCls}>
          <Plus className="w-4 h-4" />
          写日记
        </Link>
      </div>

      <Card variant="elevated" padding="sm" className="overflow-hidden rounded-[var(--radius-2xl)]">
        {diaries.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有日记"
            description="去日记页写下第一篇记录吧。"
          />
        ) : (
          <div className="space-y-3">
            {paged.map((diary) => (
              <div
                key={diary.id}
                className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-xs)]"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-medium">{diary.title || formatDate(diary.diary_date)}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(diary.diary_date)}</span>
                    <Badge tone={diary.is_public ? 'success' : 'warning'} variant="soft">
                      {diary.is_public ? '公开' : '私密'}
                    </Badge>
                    <span>{diary.word_count} 字</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/diary">
                    <span className={adminIconButtonCls}>
                      <Eye className="w-4 h-4" />
                    </span>
                  </Link>
                  <button
                    onClick={() => onDelete(diary.id)}
                    className={`${adminIconButtonCls} hover:border-red-400 hover:text-red-500`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Paginator total={diaries.length} page={page} setPage={setPage} />
      </Card>
    </motion.div>
  );
}

// Albums Tab
function AlbumsTab({ albums, onDelete, onEdit, onAdd }: { 
  albums: Album[]; 
  onDelete: (id: string) => void;
  onEdit: (album: Album) => void;
  onAdd: () => void;
}) {
  const [page, setPage] = useState(0);
  const paged = albums.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">所有相册</h2>
        <button onClick={onAdd} className={adminLinkButtonCls}>
          <Plus className="w-4 h-4" />
          新建相册
        </button>
      </div>

      {albums.length === 0 ? (
        <StatePanel
          tone="empty"
          title="还没有相册"
          description="创建第一个相册后，就可以开始整理照片专题。"
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((album) => (
            <Card
              key={album.id}
              variant="default"
              padding="sm"
              className="group overflow-hidden rounded-[var(--radius-2xl)] p-0 transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              {album.cover_image ? (
                <Image src={album.cover_image} alt="" width={400} height={225} className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-overlay)]">
                  <Folder className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{album.name}</h3>
                  <Badge variant="outline">{album.photo_count} 张</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{album.description || '暂无描述'}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(album)}
                      className={adminIconButtonCls}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(album.id)}
                      className={`${adminIconButtonCls} hover:border-red-400 hover:text-red-500`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Paginator total={albums.length} page={page} setPage={setPage} />
    </motion.div>
  );
}

// Album Modal
function AlbumModal({ album, onClose, onSave }: {
  album: Album | null;
  onClose: () => void;
  onSave: (data: Partial<Album>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: album?.name || '',
    description: album?.description || '',
    cover_image: album?.cover_image || '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] shadow-[var(--shadow-2xl)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-[color:var(--border-default)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              {album ? '编辑相册' : '新建相册'}
            </h2>
            <button
              onClick={onClose}
              className={adminIconButtonCls}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">相册名称 *</label>
            <Input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="给相册起个名字"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="简单描述一下这个相册"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">封面图片URL</label>
            <Input
              type="url"
              value={formData.cover_image}
              onChange={e => setFormData({ ...formData, cover_image: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={loading || !formData.name.trim()}
            >
              {!loading && <Save className="w-4 h-4" />}
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────────

interface SessionInfo {
  id: string;
  ip: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

interface PasskeyInfo {
  id: string;
  credentialId: string;
  name?: string;
  createdAt: string;
  lastUsed?: string;
}

function SecurityTab() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/sessions', { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.data) setSessions(d.data); })
      .finally(() => setLoadingSessions(false));
    fetch('/api/auth/passkey/credentials', { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.data?.passkeys) setPasskeys(d.data.passkeys); })
      .finally(() => setLoadingPasskeys(false));
  }, []);

  async function revokeSession(id: string) {
    setRevokingId(id);
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId: id }),
      });
      if (res.ok) { setSessions(s => s.filter(ss => ss.id !== id)); showToast.success('会话已撤销'); }
      else showToast.error('撤销失败');
    } finally { setRevokingId(null); }
  }

  async function revokeAll() {
    const ok2 = await showConfirm({ title: '踢出所有设备', description: '这会终止所有活跃会话（包括当前设备），需要重新登录。', danger: true });
    if (!ok2) return;
    const res = await fetch('/api/auth/logout', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (res.ok) { showToast.success('所有会话已清除，请重新登录'); setSessions([]); }
    else showToast.error('操作失败');
  }

  async function deletePasskey(id: string) {
    const ok2 = await showConfirm({ description: '确定要删除这个通行密钥吗？', danger: true });
    if (!ok2) return;
    setDeletingPasskeyId(id);
    try {
      const res = await fetch(`/api/auth/passkey/credentials/${encodeURIComponent(id)}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { setPasskeys(p => p.filter(pk => pk.id !== id)); showToast.success('通行密钥已删除'); }
      else showToast.error('删除失败');
    } finally { setDeletingPasskeyId(null); }
  }

  const cardCls = 'rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-5 shadow-[var(--shadow-xs)]';
  const rowCls = 'flex items-start justify-between gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] p-3.5';

  return (
    <div className="space-y-6">
      {/* Sessions */}
      <div className={cardCls}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <MonitorSmartphone className="h-5 w-5 text-primary" />
            活跃会话
            {!loadingSessions && <span className="text-sm font-normal text-muted-foreground">({sessions.length})</span>}
          </h3>
          {sessions.length > 1 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={revokeAll}>
              <LogOut className="h-3.5 w-3.5" />踢出所有设备
            </Button>
          )}
        </div>
        {loadingSessions ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />加载中…</div>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">暂无活跃会话</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className={rowCls}>
                <div className="min-w-0">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{s.userAgent || '未知设备'}</span>
                    {s.isCurrent && <Badge variant="soft" tone="success">当前</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    IP {s.ip || '—'} · 最近活跃 {new Date(s.lastActivity).toLocaleString('zh-CN')}
                  </p>
                </div>
                {!s.isCurrent && (
                  <button onClick={() => revokeSession(s.id)} disabled={revokingId === s.id}
                    className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-50">
                    {revokingId === s.id ? '撤销中…' : '撤销'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Passkeys */}
      <div className={cardCls}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <Fingerprint className="h-5 w-5 text-primary" />
            通行密钥
            {!loadingPasskeys && <span className="text-sm font-normal text-muted-foreground">({passkeys.length})</span>}
          </h3>
          <Link href="/admin/totp-setup" className="flex items-center gap-1 text-sm text-primary hover:underline">
            <KeyRound className="h-3.5 w-3.5" />注册新密钥
          </Link>
        </div>
        {loadingPasskeys ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />加载中…</div>
        ) : passkeys.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">尚未注册任何通行密钥。建议注册指纹 / Face ID 以提升登录安全。</p>
        ) : (
          <div className="space-y-2">
            {passkeys.map(pk => (
              <div key={pk.id} className={rowCls}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{pk.name || '通行密钥'}</p>
                  <p className="text-xs text-muted-foreground">
                    注册于 {new Date(pk.createdAt).toLocaleDateString('zh-CN')}
                    {pk.lastUsed && ` · 上次使用 ${new Date(pk.lastUsed).toLocaleDateString('zh-CN')}`}
                  </p>
                </div>
                <button onClick={() => deletePasskey(pk.id)} disabled={deletingPasskeyId === pk.id}
                  className="shrink-0 text-xs text-destructive hover:underline disabled:opacity-50">
                  {deletingPasskeyId === pk.id ? '删除中…' : '删除'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOTP */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              两步验证 (TOTP)
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              使用 Google Authenticator 等 App 生成动态验证码，增强账户安全。
            </p>
          </div>
          <Link href="/admin/totp-setup">
            <Button variant="primary" size="sm">管理 TOTP</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
