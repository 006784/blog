'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Database,
  Edit2,
  Film,
  Gamepad2,
  Loader2,
  Mic,
  Music2,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  Tv,
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
import { MediaItem } from '@/lib/supabase';

const TYPES = [
  { value: 'book', label: '📚 书', icon: BookOpen },
  { value: 'movie', label: '🎬 电影', icon: Film },
  { value: 'tv', label: '📺 剧集', icon: Tv },
  { value: 'music', label: '🎵 音乐', icon: Music2 },
  { value: 'podcast', label: '🎙 播客', icon: Mic },
  { value: 'game', label: '🎮 游戏', icon: Gamepad2 },
];

const STATUSES = [
  { value: 'want', label: '想看/读', tone: 'default' as const },
  { value: 'doing', label: '进行中', tone: 'info' as const },
  { value: 'done', label: '已完成', tone: 'success' as const },
];

const EMPTY: Partial<MediaItem> = {
  type: 'book',
  title: '',
  author: '',
  status: 'want',
  rating: undefined,
  review: '',
  finish_date: '',
  external_link: '',
  cover_image: '',
};

const fieldLabelCls = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const iconButtonCls =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-700)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--color-neutral-900)]';

function Stars({ rating }: { rating?: number | null }) {
  if (!rating) return null;
  const stars = Math.round(rating / 2);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={`h-3 w-3 ${index <= stars ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </span>
  );
}

function ItemModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: MediaItem | null;
  onClose: () => void;
  onSaved: (item: MediaItem, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<Partial<MediaItem>>(editing ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField =
    (key: keyof MediaItem) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSave() {
    if (!form.title?.trim()) {
      setError('标题不能为空');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/media/${editing.id}` : '/api/media';
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        setError('保存失败，请重试');
        return;
      }
      onSaved(await response.json(), !editing);
      onClose();
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  }

  const typeEmoji = TYPES.find((type) => type.value === form.type)?.label.slice(0, 2) ?? '📚';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="w-full max-w-2xl overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] shadow-[var(--shadow-2xl)]"
      >
        <div className="flex items-center justify-between border-b border-[color:var(--border-default)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{editing ? '编辑条目' : '添加条目'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">维护书影音记录、评分和封面信息。</p>
          </div>
          <button onClick={onClose} className={iconButtonCls} title="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4">
            <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-overlay)] text-3xl">
              {form.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.cover_image}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                typeEmoji
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{form.title || '未命名条目'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{form.author || '作者 / 导演 / 艺术家'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TYPES.map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={form.type === type.value ? 'primary' : 'secondary'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setForm((current) => ({ ...current, type: type.value as MediaItem['type'] }))}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <Button
                key={status.value}
                type="button"
                variant={form.status === status.value ? 'primary' : 'secondary'}
                size="sm"
                className="rounded-full"
                onClick={() => setForm((current) => ({ ...current, status: status.value as MediaItem['status'] }))}
              >
                {status.label}
              </Button>
            ))}
          </div>

          <div>
            <label className={fieldLabelCls}>标题 *</label>
            <Input value={form.title ?? ''} onChange={setField('title')} placeholder="书名 / 片名 / 专辑名…" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={fieldLabelCls}>作者 / 导演</label>
              <Input value={form.author ?? ''} onChange={setField('author')} />
            </div>
            <div>
              <label className={fieldLabelCls}>评分 (1–10)</label>
              <Input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={form.rating ?? ''}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rating: event.target.value ? Number(event.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={fieldLabelCls}>完成日期</label>
              <Input type="date" value={form.finish_date ?? ''} onChange={setField('finish_date')} />
            </div>
            <div>
              <label className={fieldLabelCls}>封面图 URL</label>
              <Input value={form.cover_image ?? ''} onChange={setField('cover_image')} placeholder="https://..." />
            </div>
          </div>

          <div>
            <label className={fieldLabelCls}>外部链接</label>
            <Input value={form.external_link ?? ''} onChange={setField('external_link')} placeholder="https://..." />
          </div>

          <div>
            <label className={fieldLabelCls}>短评</label>
            <Textarea
              value={form.review ?? ''}
              onChange={setField('review')}
              rows={3}
              placeholder="一两句记录你的感受。"
            />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] px-6 py-5">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.title?.trim()} loading={saving}>
            {!saving && <Save className="h-4 w-4" />}
            保存条目
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminMediaPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [q, setQ] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      showLoginModal();
      return;
    }

    fetch('/api/media')
      .then((response) => response.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isAdmin, showLoginModal]);

  function handleSaved(item: MediaItem, isNew: boolean) {
    setItems((prev) => (isNew ? [item, ...prev] : prev.map((existing) => (existing.id === item.id ? item : existing))));
  }

  async function handleSeed() {
    if (!confirm('将写入约 70 条示例书影音数据，确认？')) return;

    setSeeding(true);
    try {
      const response = await fetch('/api/admin/seed-media', { method: 'POST', credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || '写入失败');
        return;
      }
      alert(data.message);
      const refreshed = await fetch('/api/media').then((res) => res.json());
      setItems(refreshed);
    } catch (error) {
      alert(`请求失败：${String(error)}`);
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;

    setDeleting(id);
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const filtered = items.filter((item) => {
    if (activeType !== 'all' && item.type !== activeType) return false;
    if (activeStatus !== 'all' && item.status !== activeStatus) return false;
    if (
      q &&
      !item.title.toLowerCase().includes(q.toLowerCase()) &&
      !(item.author ?? '').toLowerCase().includes(q.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const typeCounts: Record<string, number> = { all: items.length };
  TYPES.forEach((type) => {
    typeCounts[type.value] = items.filter((item) => item.type === type.value).length;
  });

  const statusCounts: Record<string, number> = { all: items.length };
  STATUSES.forEach((status) => {
    statusCounts[status.value] = items.filter((item) => item.status === status.value).length;
  });

  const doneCount = items.filter((item) => item.status === 'done').length;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)]">
                  <Film className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">书影音管理</h1>
                  <p className="text-sm text-muted-foreground">记录阅读、观影、游戏和播客进度，统一维护封面与评分。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {items.length === 0 ? (
              <Button variant="secondary" onClick={handleSeed} disabled={seeding}>
                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                初始化数据
              </Button>
            ) : null}
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              添加条目
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">总条目数</p>
            <p className="mt-3 text-3xl font-semibold">{items.length}</p>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">已完成</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{doneCount}</p>
              <Badge tone="success" variant="soft">已归档</Badge>
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">当前筛选结果</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{filtered.length}</p>
              <Badge tone="info" variant="soft">实时过滤</Badge>
            </div>
          </Card>
        </div>

        <Card variant="elevated" className="space-y-4 rounded-[var(--radius-2xl)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="搜索标题或作者…"
                className="pl-11"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[{ value: 'all', label: `全部 (${typeCounts.all})` }, ...TYPES.map((type) => ({
                value: type.value,
                label: `${type.label} (${typeCounts[type.value]})`,
              }))].map((type) => (
                <Button
                  key={type.value}
                  variant={activeType === type.value ? 'primary' : 'secondary'}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[{ value: 'all', label: `全部状态 (${statusCounts.all})` }, ...STATUSES.map((status) => ({
              value: status.value,
              label: `${status.label} (${statusCounts[status.value]})`,
            }))].map((status) => (
              <Button
                key={status.value}
                variant={activeStatus === status.value ? 'primary' : 'secondary'}
                size="sm"
                className="rounded-full"
                onClick={() => setActiveStatus(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </Card>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载书影音记录"
            description="正在同步条目、封面和状态信息，请稍等。"
          />
        ) : filtered.length === 0 ? (
          <StatePanel
            tone="empty"
            title={q ? '没有匹配的内容' : '还没有书影音记录'}
            description={q ? '试试换一个关键词，或者调整上面的类型和状态筛选。' : '先添加第一条记录，这里会自动形成你的内容库。'}
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                添加条目
              </Button>
            }
          />
        ) : (
          <Card variant="elevated" padding="sm" className="rounded-[var(--radius-2xl)]">
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((item) => {
                const typeInfo = TYPES.find((type) => type.value === item.type);
                const statusInfo = STATUSES.find((status) => status.value === item.status);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group flex gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                  >
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-base)] text-2xl">
                      {item.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        typeInfo?.label.slice(0, 2)
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{item.title}</p>
                          {item.author ? <p className="mt-1 text-xs text-muted-foreground">{item.author}</p> : null}
                        </div>

                        <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => {
                              setEditing(item);
                              setModalOpen(true);
                            }}
                            className={iconButtonCls}
                            title="编辑条目"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className={`${iconButtonCls} hover:border-red-400 hover:text-red-500 disabled:opacity-60`}
                            title="删除条目"
                          >
                            {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={statusInfo?.tone ?? 'default'} variant="soft">
                          {statusInfo?.label}
                        </Badge>
                        <Badge variant="outline">{typeInfo?.label}</Badge>
                        <Stars rating={item.rating} />
                      </div>

                      {item.review ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.review}</p>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">还没有记录这条内容的短评。</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <ItemModal
            editing={editing}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            onSaved={handleSaved}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
