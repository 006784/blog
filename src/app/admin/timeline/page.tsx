'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import { TimelineEvent } from '@/lib/supabase';

const CATEGORY_OPTIONS = [
  { value: 'work', label: '工作', color: 'bg-blue-400' },
  { value: 'education', label: '学习', color: 'bg-emerald-400' },
  { value: 'life', label: '生活', color: 'bg-amber-400' },
  { value: 'achievement', label: '成就', color: 'bg-purple-400' },
  { value: 'travel', label: '旅行', color: 'bg-rose-400' },
];

const EMPTY: Partial<TimelineEvent> = {
  title: '',
  description: '',
  date: '',
  category: 'life',
  icon: '',
  link: '',
  is_milestone: false,
};

const fieldLabelCls = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const selectCls =
  'w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]';
const iconButtonCls =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-700)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--color-neutral-900)]';

export default function AdminTimelinePage() {
  const { isAdmin, loading: authLoading } = useAdmin();
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [form, setForm] = useState<Partial<TimelineEvent>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/admin/login?redirect=/admin/timeline');
      return;
    }

    fetch('/api/timeline')
      .then(async (response) => {
        if (!response.ok) throw new Error('load failed');
        return response.json();
      })
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('加载时间线失败:', error);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAdmin, router]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setShowModal(true);
  }

  function openEdit(event: TimelineEvent) {
    setEditing(event);
    setForm({ ...event });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title?.trim() || !form.date) return;

    setSaving(true);
    try {
      if (editing) {
        const response = await fetch(`/api/timeline/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const updated = await response.json();
        setEvents((prev) => prev.map((event) => (event.id === editing.id ? updated : event)));
      } else {
        const response = await fetch('/api/timeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const created = await response.json();
        setEvents((prev) => [created, ...prev]);
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
      await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const field = (key: keyof TimelineEvent) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSeedDefaults() {
    setSeeding(true);
    try {
      const response = await fetch('/api/timeline/seed', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'seed failed');
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('初始化时间线失败:', error);
    } finally {
      setSeeding(false);
    }
  }

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <StatePanel
            tone="loading"
            title={authLoading ? '正在验证管理员身份' : '正在跳转登录页'}
            description="时间线后台会在身份确认后自动恢复。"
            icon={<Clock className="h-6 w-6" />}
          />
        </div>
      </div>
    );
  }

  const milestoneCount = events.filter((event) => event.is_milestone).length;

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
                  <Clock className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">时间线管理</h1>
                  <p className="text-sm text-muted-foreground">维护人生节点、里程碑和公开展示的时间顺序。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleSeedDefaults} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              初始化示例时间线
            </Button>
            <Button onClick={openCreate} className="rounded-full px-5">
              <Plus className="h-4 w-4" />
              添加事件
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">事件总数</p>
            <p className="mt-3 text-3xl font-semibold">{events.length}</p>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">里程碑</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{milestoneCount}</p>
              <Badge tone="warning" variant="soft">重点节点</Badge>
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">普通事件</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{events.length - milestoneCount}</p>
              <Badge variant="soft">日常记录</Badge>
            </div>
          </Card>
        </div>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载时间线"
            description="正在同步人生节点和事件详情，请稍等。"
          />
        ) : events.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有时间线事件"
            description="你可以先导入示例数据，或者手动添加几条重要节点。"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" onClick={handleSeedDefaults} disabled={seeding}>
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  初始化示例时间线
                </Button>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  手动添加
                </Button>
              </div>
            }
          />
        ) : (
          <Card variant="elevated" padding="sm" className="space-y-3 rounded-[var(--radius-2xl)]">
            {events.map((event) => {
              const category = CATEGORY_OPTIONS.find((item) => item.value === event.category);
              return (
                <motion.div
                  key={event.id}
                  layout
                  className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-3 shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                >
                  <div className={`h-3 w-3 shrink-0 rounded-full ${category?.color ?? 'bg-zinc-400'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {event.icon ? <span className="text-sm">{event.icon}</span> : null}
                      <span className="truncate text-sm font-semibold">{event.title}</span>
                      {event.is_milestone ? (
                        <Badge tone="warning" variant="soft">里程碑</Badge>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{event.date}</span>
                      <span>{category?.label}</span>
                      {event.description ? <span className="max-w-[22rem] truncate">{event.description}</span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(event)} className={iconButtonCls} title="编辑事件">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                      className={`${iconButtonCls} hover:border-red-400 hover:text-red-500 disabled:opacity-60`}
                      title="删除事件"
                    >
                      {deleting === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
                  <h2 className="text-lg font-semibold">{editing ? '编辑事件' : '添加事件'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">补充标题、日期、分类和是否为里程碑。</p>
                </div>
                <button onClick={() => setShowModal(false)} className={iconButtonCls} title="关闭">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 px-6 py-6">
                <div>
                  <label className={fieldLabelCls}>标题 *</label>
                  <Input value={form.title || ''} onChange={field('title')} placeholder="例如：第一次独立发布博客系统" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelCls}>日期 *</label>
                    <Input type="date" value={form.date || ''} onChange={field('date')} />
                  </div>
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
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelCls}>图标 Emoji</label>
                    <Input value={form.icon || ''} onChange={field('icon')} placeholder="🚀" />
                  </div>
                  <div className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.is_milestone ?? false}
                      onChange={(event) => setForm((current) => ({ ...current, is_milestone: event.target.checked }))}
                      className="h-4 w-4 rounded border-[color:var(--border-default)]"
                    />
                    <div>
                      <p className="text-sm font-medium">标记为里程碑</p>
                      <p className="text-xs text-muted-foreground">会在前台时间线里以更醒目的方式展示。</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={fieldLabelCls}>描述</label>
                  <Textarea value={form.description || ''} onChange={field('description')} rows={3} placeholder="补充一两句这件事的重要性或背景。" />
                </div>

                <div>
                  <label className={fieldLabelCls}>链接</label>
                  <Input value={form.link || ''} onChange={field('link')} placeholder="https://..." />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] px-6 py-5">
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  取消
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.title?.trim() || !form.date} loading={saving}>
                  {!saving && <Save className="h-4 w-4" />}
                  保存事件
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
