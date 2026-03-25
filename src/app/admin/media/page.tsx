'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Plus, Edit2, Trash2, X, Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import { useRouter } from 'next/navigation';
import {
  MediaItem,
  getMediaItems,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
} from '@/lib/supabase';

const TYPE_OPTIONS = [
  { value: 'book',    label: '书' },
  { value: 'movie',   label: '电影' },
  { value: 'tv',      label: '剧集' },
  { value: 'music',   label: '音乐' },
  { value: 'podcast', label: '播客' },
  { value: 'game',    label: '游戏' },
];

const STATUS_OPTIONS = [
  { value: 'want',  label: '想看/读' },
  { value: 'doing', label: '进行中' },
  { value: 'done',  label: '已完成' },
];

const EMPTY: Partial<MediaItem> = {
  type: 'book', title: '', author: '', status: 'want',
  rating: undefined, review: '', finish_date: '', external_link: '', cover_image: '',
};

export default function AdminMediaPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const router = useRouter();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [form, setForm] = useState<Partial<MediaItem>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { showLoginModal(); return; }
    getMediaItems().then(setItems).finally(() => setLoading(false));
  }, [isAdmin]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(item: MediaItem) {
    setEditing(item);
    setForm({ ...item });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateMediaItem(editing.id, form);
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
      } else {
        const created = await createMediaItem(form);
        setItems((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;
    setDeleting(id);
    try {
      await deleteMediaItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const field = (key: keyof MediaItem) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* 顶栏 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Film className="w-5 h-5 text-zinc-500" />
          <h1 className="text-xl font-semibold">书影音管理</h1>
          <span className="text-sm text-zinc-400">({items.length})</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" /> 添加
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
          暂无内容，点击右上角添加
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-4 py-3 backdrop-blur"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {TYPE_OPTIONS.find((t) => t.value === item.type)?.label}
                  </span>
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  {item.author && <span className="text-xs text-zinc-400 truncate">{item.author}</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-400">
                  <span>{STATUS_OPTIONS.find((s) => s.value === item.status)?.label}</span>
                  {item.rating && <span>★ {item.rating}</span>}
                  {item.finish_date && <span>{item.finish_date}</span>}
                </div>
              </div>
              <button onClick={() => openEdit(item)} className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deleting === item.id}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
              >
                {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* 弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{editing ? '编辑' : '添加'}条目</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">类型</label>
                  <select value={form.type} onChange={field('type')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                    {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">状态</label>
                  <select value={form.status} onChange={field('status')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">标题 *</label>
                <input value={form.title || ''} onChange={field('title')} placeholder="书名 / 片名 / 专辑名" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">作者 / 导演</label>
                  <input value={form.author || ''} onChange={field('author')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">评分 (1-10)</label>
                  <input type="number" min="1" max="10" step="0.5" value={form.rating ?? ''} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value ? Number(e.target.value) : undefined }))} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">完成日期</label>
                  <input type="date" value={form.finish_date || ''} onChange={field('finish_date')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">封面图 URL</label>
                  <input value={form.cover_image || ''} onChange={field('cover_image')} placeholder="https://..." className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">外部链接</label>
                <input value={form.external_link || ''} onChange={field('external_link')} placeholder="豆瓣 / Goodreads 链接" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">短评</label>
                <textarea value={form.review || ''} onChange={field('review')} rows={2} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 transition-colors">取消</button>
                <button onClick={handleSave} disabled={saving || !form.title?.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
