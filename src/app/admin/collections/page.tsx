'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMarked, Plus, Edit2, Trash2, X, Loader2, Save, ArrowLeft, Eye, EyeOff, GripVertical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAdmin } from '@/components/AdminProvider';
import {
  Collection,
  getCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from '@/lib/supabase';

const EMPTY: Partial<Collection> = {
  name: '', description: '', cover_image: '', color: '', is_public: true, sort_order: 0,
};

export default function AdminCollectionsPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState<Partial<Collection>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { showLoginModal(); return; }
    getCollections().then(setCollections).finally(() => setLoading(false));
  }, [isAdmin]);

  function openCreate() {
    setEditing(null);
    const maxOrder = collections.reduce((m, c) => Math.max(m, c.sort_order), 0);
    setForm({ ...EMPTY, sort_order: maxOrder + 1 });
    setShowModal(true);
  }

  function openEdit(col: Collection) {
    setEditing(col);
    setForm({ ...col });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCollection(editing.id, form);
        setCollections((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
      } else {
        const created = await createCollection(form);
        setCollections((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？该合集下的文章将解绑但不会被删除。')) return;
    setDeleting(id);
    try {
      await deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublic(col: Collection) {
    const updated = await updateCollection(col.id, { is_public: !col.is_public });
    setCollections((prev) => prev.map((c) => (c.id === col.id ? updated : c)));
  }

  const field = (key: keyof Collection) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BookMarked className="w-5 h-5 text-zinc-500" />
          <h1 className="text-xl font-semibold">合集管理</h1>
          <span className="text-sm text-zinc-400">({collections.length})</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" /> 新建合集
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : collections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
          暂无合集，点击右上角创建
        </div>
      ) : (
        <div className="space-y-2">
          {collections.map((col) => (
            <motion.div
              key={col.id}
              layout
              className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-4 py-3 backdrop-blur"
            >
              <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />

              {/* 封面缩略图 */}
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                {col.cover_image ? (
                  <Image src={col.cover_image} alt={col.name} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-bold opacity-30" style={{ color: col.color || '#888' }}>
                    {col.name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{col.name}</span>
                  {!col.is_public && (
                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">私密</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-400">
                  <span>{col.post_count} 篇文章</span>
                  {col.description && <span className="truncate">{col.description}</span>}
                </div>
              </div>

              <span className="text-xs text-zinc-300 tabular-nums">#{col.sort_order}</span>

              <button
                onClick={() => togglePublic(col)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                title={col.is_public ? '设为私密' : '设为公开'}
              >
                {col.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => openEdit(col)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(col.id)}
                disabled={deleting === col.id}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
              >
                {deleting === col.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>
      )}

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
                <h2 className="font-semibold">{editing ? '编辑' : '新建'}合集</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">合集名称 *</label>
                <input
                  value={form.name || ''}
                  onChange={field('name')}
                  placeholder="例：前端笔记"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">简介</label>
                <textarea
                  value={form.description || ''}
                  onChange={field('description')}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">封面图 URL</label>
                  <input
                    value={form.cover_image || ''}
                    onChange={field('cover_image')}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">主题色</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color || '#888888'}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-10 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    />
                    <input
                      value={form.color || ''}
                      onChange={field('color')}
                      placeholder="#c4a96d"
                      className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">排序</label>
                  <input
                    type="number"
                    value={form.sort_order ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_public ?? true}
                      onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">公开显示</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name?.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
                >
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
