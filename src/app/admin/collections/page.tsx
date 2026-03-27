'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookMarked,
  Edit2,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import {
  Collection,
  createCollection,
  deleteCollection,
  getCollections,
  updateCollection,
} from '@/lib/supabase';

const EMPTY: Partial<Collection> = {
  name: '',
  description: '',
  cover_image: '',
  color: '',
  is_public: true,
  sort_order: 0,
};

const fieldLabelCls = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const selectCls =
  'w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]';
const iconButtonCls =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-700)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--color-neutral-900)]';

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
    if (!isAdmin) {
      showLoginModal();
      return;
    }

    getCollections()
      .then(setCollections)
      .finally(() => setLoading(false));
  }, [isAdmin, showLoginModal]);

  function openCreate() {
    setEditing(null);
    const maxOrder = collections.reduce((max, collection) => Math.max(max, collection.sort_order), 0);
    setForm({ ...EMPTY, sort_order: maxOrder + 1 });
    setShowModal(true);
  }

  function openEdit(collection: Collection) {
    setEditing(collection);
    setForm({ ...collection });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name?.trim()) return;

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateCollection(editing.id, form);
        setCollections((prev) => prev.map((collection) => (collection.id === editing.id ? updated : collection)));
      } else {
        const created = await createCollection(form);
        setCollections((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order));
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？该合集下的文章将解绑但不会被删除。')) return;

    setDeleting(id);
    try {
      await deleteCollection(id);
      setCollections((prev) => prev.filter((collection) => collection.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function togglePublic(collection: Collection) {
    const updated = await updateCollection(collection.id, { is_public: !collection.is_public });
    setCollections((prev) => prev.map((item) => (item.id === collection.id ? updated : item)));
  }

  const field = (key: keyof Collection) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const publicCollections = collections.filter((collection) => collection.is_public).length;
  const privateCollections = collections.length - publicCollections;

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
                  <BookMarked className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">合集管理</h1>
                  <p className="text-sm text-muted-foreground">整理专题、封面和公开状态，让文章结构更清晰。</p>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={openCreate} className="rounded-full px-5">
            <Plus className="h-4 w-4" />
            新建合集
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">合集总数</p>
            <p className="mt-3 text-3xl font-semibold">{collections.length}</p>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">公开合集</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{publicCollections}</p>
              <Badge tone="success" variant="soft">对外可见</Badge>
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">私密合集</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{privateCollections}</p>
              <Badge tone="warning" variant="soft">仅后台可见</Badge>
            </div>
          </Card>
        </div>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载合集"
            description="正在同步合集列表和封面信息，请稍等。"
          />
        ) : collections.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有合集"
            description="可以先创建几个专题，把文章按主题整理起来。"
            action={
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                新建第一个合集
              </Button>
            }
          />
        ) : (
          <Card variant="elevated" padding="sm" className="space-y-3 rounded-[var(--radius-2xl)]">
            {collections.map((collection) => (
              <motion.div
                key={collection.id}
                layout
                className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60" />

                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-overlay)]">
                  {collection.cover_image ? (
                    <Image
                      src={collection.cover_image}
                      alt={collection.name}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-base font-semibold opacity-70" style={{ color: collection.color || '#888' }}>
                      {collection.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold">{collection.name}</h2>
                    <Badge
                      tone={collection.is_public ? 'success' : 'warning'}
                      variant="soft"
                    >
                      {collection.is_public ? '公开' : '私密'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{collection.post_count} 篇文章</span>
                    <span>排序 #{collection.sort_order}</span>
                    {collection.description ? (
                      <span className="max-w-[22rem] truncate">{collection.description}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublic(collection)}
                    className={iconButtonCls}
                    title={collection.is_public ? '设为私密' : '设为公开'}
                  >
                    {collection.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(collection)}
                    className={iconButtonCls}
                    title="编辑合集"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    disabled={deleting === collection.id}
                    className={`${iconButtonCls} hover:border-red-400 hover:text-red-500 disabled:opacity-60`}
                    title="删除合集"
                  >
                    {deleting === collection.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            ))}
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
                  <h2 className="text-lg font-semibold">{editing ? '编辑合集' : '新建合集'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">维护合集名称、封面和显示顺序。</p>
                </div>
                <button onClick={() => setShowModal(false)} className={iconButtonCls} title="关闭">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div>
                  <label className={fieldLabelCls}>合集名称 *</label>
                  <Input
                    value={form.name || ''}
                    onChange={field('name')}
                    placeholder="例：前端笔记"
                  />
                </div>

                <div>
                  <label className={fieldLabelCls}>简介</label>
                  <Textarea
                    value={form.description || ''}
                    onChange={field('description')}
                    rows={3}
                    placeholder="一句话概括这个合集的主题和目的。"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelCls}>封面图 URL</label>
                    <Input
                      value={form.cover_image || ''}
                      onChange={field('cover_image')}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className={fieldLabelCls}>主题色</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.color || '#888888'}
                        onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))}
                        className="h-11 w-11 cursor-pointer rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-xs)]"
                      />
                      <Input
                        value={form.color || ''}
                        onChange={field('color')}
                        placeholder="#c4a96d"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelCls}>排序</label>
                    <Input
                      type="number"
                      value={form.sort_order ?? 0}
                      onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
                    />
                  </div>

                  <div>
                    <label className={fieldLabelCls}>显示方式</label>
                    <select
                      value={String(form.is_public ?? true)}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, is_public: event.target.value === 'true' }))
                      }
                      className={selectCls}
                    >
                      <option value="true">公开显示</option>
                      <option value="false">仅后台可见</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] px-6 py-5">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.name?.trim()} loading={saving}>
                  {!saving && <Save className="h-4 w-4" />}
                  保存合集
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
