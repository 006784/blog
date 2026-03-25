'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Plus, Edit2, Trash2, X, Loader2, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import {
  NowEntry,
  getAllNowEntries,
  createNowEntry,
  updateNowEntry,
  deleteNowEntry,
} from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'location',  label: '所在地' },
  { value: 'doing',     label: '正在做' },
  { value: 'reading',   label: '在读' },
  { value: 'learning',  label: '在学' },
  { value: 'thinking',  label: '在想' },
  { value: 'watching',  label: '在看' },
  { value: 'listening', label: '在听' },
];

const EMPTY: Partial<NowEntry> = {
  category: 'doing', content: '', emoji: '', link: '', sort_order: 0, is_active: true,
};

export default function AdminNowPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const [entries, setEntries] = useState<NowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NowEntry | null>(null);
  const [form, setForm] = useState<Partial<NowEntry>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { showLoginModal(); return; }
    getAllNowEntries().then(setEntries).finally(() => setLoading(false));
  }, [isAdmin]);

  function openCreate() {
    setEditing(null);
    const maxOrder = entries.reduce((m, e) => Math.max(m, e.sort_order), 0);
    setForm({ ...EMPTY, sort_order: maxOrder + 1 });
    setShowModal(true);
  }

  function openEdit(entry: NowEntry) {
    setEditing(entry);
    setForm({ ...entry });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.content?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateNowEntry(editing.id, form);
        setEntries((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
      } else {
        const created = await createNowEntry(form);
        setEntries((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
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
      await deleteNowEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(entry: NowEntry) {
    const updated = await updateNowEntry(entry.id, { is_active: !entry.is_active });
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? updated : e)));
  }

  const field = (key: keyof NowEntry) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Sparkles className="w-5 h-5 text-zinc-500" />
          <h1 className="text-xl font-semibold">此刻管理</h1>
          <span className="text-sm text-zinc-400">({entries.length})</span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" /> 添加
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
          暂无内容
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const cat = CATEGORY_OPTIONS.find((c) => c.value === entry.category);
            return (
              <motion.div
                key={entry.id}
                layout
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur transition-colors ${
                  entry.is_active
                    ? 'border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70'
                    : 'border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.emoji && <span>{entry.emoji}</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {cat?.label ?? entry.category}
                    </span>
                    <span className="text-sm truncate">{entry.content}</span>
                  </div>
                  {entry.link && (
                    <p className="mt-0.5 text-xs text-zinc-400 truncate">{entry.link}</p>
                  )}
                </div>
                <span className="text-xs text-zinc-300 tabular-nums">#{entry.sort_order}</span>
                <button onClick={() => toggleActive(entry)} className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors" title={entry.is_active ? '隐藏' : '显示'}>
                  {entry.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(entry)} className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(entry.id)} disabled={deleting === entry.id} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                  {deleting === entry.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{editing ? '编辑' : '添加'}条目</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">分类</label>
                  <select value={form.category} onChange={field('category')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm">
                    {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">排序</label>
                  <input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">内容 *</label>
                <textarea value={form.content || ''} onChange={field('content')} rows={2} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">emoji</label>
                  <input value={form.emoji || ''} onChange={field('emoji')} placeholder="📖" className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                    <span className="text-sm">公开显示</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">链接</label>
                <input value={form.link || ''} onChange={field('link')} placeholder="https://..." className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 transition-colors">取消</button>
                <button onClick={handleSave} disabled={saving || !form.content?.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
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
