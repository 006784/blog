'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import {
  createNowEntry,
  deleteNowEntry,
  getAllNowEntries,
  NowEntry,
  updateNowEntry,
} from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'location', label: '所在地' },
  { value: 'doing', label: '正在做' },
  { value: 'reading', label: '在读' },
  { value: 'learning', label: '在学' },
  { value: 'thinking', label: '在想' },
  { value: 'watching', label: '在看' },
  { value: 'listening', label: '在听' },
];

const EMPTY: Partial<NowEntry> = {
  category: 'doing',
  content: '',
  emoji: '',
  link: '',
  sort_order: 0,
  is_active: true,
};

const fieldLabelCls = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const selectCls =
  'w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]';
const iconButtonCls =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-700)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--color-neutral-900)]';

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
    if (!isAdmin) {
      showLoginModal();
      return;
    }

    getAllNowEntries()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [isAdmin, showLoginModal]);

  function openCreate() {
    setEditing(null);
    const maxOrder = entries.reduce((max, entry) => Math.max(max, entry.sort_order), 0);
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
        setEntries((prev) => prev.map((entry) => (entry.id === editing.id ? updated : entry)));
      } else {
        const created = await createNowEntry(form);
        setEntries((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;

    setDeleting(id);
    try {
      await deleteNowEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(entry: NowEntry) {
    const updated = await updateNowEntry(entry.id, { is_active: !entry.is_active });
    setEntries((prev) => prev.map((item) => (item.id === entry.id ? updated : item)));
  }

  const field = (key: keyof NowEntry) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const activeCount = entries.filter((entry) => entry.is_active).length;
  const hiddenCount = entries.length - activeCount;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
                  <Sparkles className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">此刻管理</h1>
                  <p className="text-sm text-muted-foreground">维护首页“此刻”模块，让站点实时表达你当下的状态。</p>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={openCreate} className="rounded-full px-5">
            <Plus className="h-4 w-4" />
            添加条目
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">条目总数</p>
            <p className="mt-3 text-3xl font-semibold">{entries.length}</p>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">正在显示</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{activeCount}</p>
              <Badge tone="success" variant="soft">前台可见</Badge>
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">已隐藏</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{hiddenCount}</p>
              <Badge tone="warning" variant="soft">等待启用</Badge>
            </div>
          </Card>
        </div>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载此刻条目"
            description="正在同步当前状态列表和显示顺序，请稍等。"
          />
        ) : entries.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有“此刻”内容"
            description="先添加几条正在做、在读或在听的状态，首页会更有现场感。"
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                添加第一条
              </Button>
            }
          />
        ) : (
          <Card variant="elevated" padding="sm" className="space-y-3 rounded-[var(--radius-2xl)]">
            {entries.map((entry) => {
              const category = CATEGORY_OPTIONS.find((item) => item.value === entry.category);
              return (
                <motion.div
                  key={entry.id}
                  layout
                  className={`flex items-center gap-4 rounded-[var(--radius-xl)] border px-4 py-3 shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] ${
                    entry.is_active
                      ? 'border-[color:var(--border-default)] bg-[var(--surface-panel)]'
                      : 'border-dashed border-[color:var(--border-default)] bg-[var(--surface-raised)] opacity-70'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {entry.emoji ? (
                      <span className="mt-0.5 text-lg">{entry.emoji}</span>
                    ) : (
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-overlay)] text-sm">
                        ✦
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{category?.label ?? entry.category}</Badge>
                        <span className="truncate text-sm font-medium">{entry.content}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>排序 #{entry.sort_order}</span>
                        {entry.link ? <span className="max-w-[24rem] truncate">{entry.link}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(entry)}
                      className={iconButtonCls}
                      title={entry.is_active ? '隐藏' : '显示'}
                    >
                      {entry.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => openEdit(entry)} className={iconButtonCls} title="编辑条目">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deleting === entry.id}
                      className={`${iconButtonCls} hover:border-red-400 hover:text-red-500 disabled:opacity-60`}
                      title="删除条目"
                    >
                      {deleting === entry.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </Card>
        )}
      </div>

      <AnimatePresence>
        {showModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            onClick={(event) => event.target === event.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="w-full max-w-xl overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] shadow-[var(--shadow-2xl)]"
            >
              <div className="flex items-center justify-between border-b border-[color:var(--border-default)] px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold">{editing ? '编辑条目' : '添加条目'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">更新当下状态、链接和展示顺序。</p>
                </div>
                <button onClick={() => setShowModal(false)} className={iconButtonCls} title="关闭">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelCls}>分类</label>
                    <select value={form.category} onChange={field('category')} className={selectCls}>
                      {CATEGORY_OPTIONS.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabelCls}>排序</label>
                    <Input
                      type="number"
                      value={form.sort_order ?? 0}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className={fieldLabelCls}>内容 *</label>
                  <Textarea
                    value={form.content || ''}
                    onChange={field('content')}
                    rows={3}
                    placeholder="例如：在读《设计的觉醒》，重新整理博客后台。"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelCls}>Emoji</label>
                    <Input value={form.emoji || ''} onChange={field('emoji')} placeholder="📖" />
                  </div>
                  <div>
                    <label className={fieldLabelCls}>链接</label>
                    <Input value={form.link || ''} onChange={field('link')} placeholder="https://..." />
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active ?? true}
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                    className="h-4 w-4 rounded border-[color:var(--border-default)]"
                  />
                  <div>
                    <p className="text-sm font-medium">立即公开显示</p>
                    <p className="text-xs text-muted-foreground">关闭后，这条内容会在前台暂时隐藏。</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] px-6 py-5">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.content?.trim()} loading={saving}>
                  {!saving && <Save className="h-4 w-4" />}
                  保存条目
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
