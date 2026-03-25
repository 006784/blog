'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Plus, Edit2, Trash2, X, Loader2, Save, ArrowLeft, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import {
  UsesItem,
  getUsesItems,
  createUsesItem,
  updateUsesItem,
  deleteUsesItem,
} from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'hardware',  label: '硬件设备' },
  { value: 'software',  label: '常用软件' },
  { value: 'dev-tools', label: '开发工具' },
  { value: 'services',  label: '云服务' },
  { value: 'design',    label: '设计工具' },
  { value: 'daily',     label: '日常' },
];

const EMPTY: Partial<UsesItem> = {
  category: 'software', name: '', description: '', icon_url: '', link: '', sort_order: 0,
};

export default function AdminUsesPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const [items, setItems] = useState<UsesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UsesItem | null>(null);
  const [form, setForm] = useState<Partial<UsesItem>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) { showLoginModal(); return; }
    getUsesItems().then(setItems).finally(() => setLoading(false));
  }, [isAdmin]);

  function openCreate() {
    setEditing(null);
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
    setForm({ ...EMPTY, sort_order: maxOrder + 1 });
    setShowModal(true);
  }

  function openEdit(item: UsesItem) {
    setEditing(item);
    setForm({ ...item });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateUsesItem(editing.id, form);
        setItems((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
      } else {
        const created = await createUsesItem(form);
        setItems((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
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
      await deleteUsesItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const field = (key: keyof UsesItem) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // 按分类分组展示
  const grouped = items.reduce<Record<string, UsesItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const orderedCategories = [
    ...CATEGORY_OPTIONS.map((c) => c.value).filter((v) => grouped[v]),
    ...Object.keys(grouped).filter((k) => !CATEGORY_OPTIONS.find((c) => c.value === k)),
  ];

  return (
    <div className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Wrench className="w-5 h-5 text-zinc-500" />
          <h1 className="text-xl font-semibold">工具箱管理</h1>
          <span className="text-sm text-zinc-400">({items.length})</span>
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
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 py-16 text-center text-zinc-400">
          暂无工具，点击右上角添加
        </div>
      ) : (
        <div className="space-y-6">
          {orderedCategories.map((cat) => {
            const meta = CATEGORY_OPTIONS.find((c) => c.value === cat);
            return (
              <div key={cat}>
                <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
                  {meta?.label ?? cat}
                </h2>
                <div className="space-y-1.5">
                  {grouped[cat].map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="flex items-center gap-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-4 py-3 backdrop-blur"
                    >
                      <GripVertical className="w-4 h-4 text-zinc-300 shrink-0" />
                      {item.icon_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.icon_url} alt={item.name} className="w-6 h-6 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{item.name}</span>
                        {item.description && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-zinc-300 tabular-nums">#{item.sort_order}</span>
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
              </div>
            );
          })}
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
                <h2 className="font-semibold">{editing ? '编辑' : '添加'}工具</h2>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
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
                <label className="text-xs text-zinc-500 mb-1 block">名称 *</label>
                <input value={form.name || ''} onChange={field('name')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">简介</label>
                <input value={form.description || ''} onChange={field('description')} className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">图标 URL</label>
                  <input value={form.icon_url || ''} onChange={field('icon_url')} placeholder="https://..." className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">官网链接</label>
                  <input value={form.link || ''} onChange={field('link')} placeholder="https://..." className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 transition-colors">取消</button>
                <button onClick={handleSave} disabled={saving || !form.name?.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40">
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
