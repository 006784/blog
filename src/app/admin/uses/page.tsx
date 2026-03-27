'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  ImageDown,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Edit2,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import { UsesIcon } from '@/components/UsesIcon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import { UsesItem } from '@/lib/supabase';

const CATEGORIES = [
  { value: 'hardware', label: '硬件设备', icon: '💻' },
  { value: 'chips', label: '芯片 / CPU', icon: '⚡' },
  { value: 'software', label: '常用软件', icon: '📱' },
  { value: 'notes', label: '笔记工具', icon: '📝' },
  { value: 'opensource', label: 'Mac 开源工具', icon: '🐙' },
  { value: 'dev-tools', label: '开发工具 / IDE', icon: '🛠' },
  { value: 'languages', label: '编程语言', icon: '🔤' },
  { value: 'services', label: '云服务', icon: '☁️' },
  { value: 'design', label: '设计工具', icon: '🎨' },
  { value: 'daily', label: '日常', icon: '✨' },
];

const EMPTY: Partial<UsesItem> = {
  category: 'software',
  name: '',
  description: '',
  icon_url: '',
  link: '',
  sort_order: 0,
};

const fieldLabelCls = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const selectCls =
  'w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-base)]';
const iconButtonCls =
  'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] text-[var(--color-neutral-700)] shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[color:var(--border-strong)] hover:text-[var(--color-neutral-900)]';

function getCategory(value: string) {
  return CATEGORIES.find((category) => category.value === value) ?? { label: value, icon: '📦', value };
}

function ItemModal({
  editing,
  initialForm,
  onClose,
  onSaved,
}: {
  editing: UsesItem | null;
  initialForm: Partial<UsesItem>;
  onClose: () => void;
  onSaved: (item: UsesItem, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<Partial<UsesItem>>(editing ?? initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField =
    (key: keyof UsesItem) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  async function handleSave() {
    if (!form.name?.trim()) {
      setError('名称不能为空');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/uses/${editing.id}` : '/api/uses';
      const method = editing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        setError('保存失败，请重试');
        return;
      }
      const saved = await response.json();
      onSaved(saved, !editing);
      onClose();
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  }

  const categoryMeta = getCategory(form.category ?? 'software');

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
        className="w-full max-w-xl overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] shadow-[var(--shadow-2xl)]"
      >
        <div className="flex items-center justify-between border-b border-[color:var(--border-default)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{editing ? '编辑工具' : '添加工具'}</h2>
            <p className="mt-1 text-sm text-muted-foreground">维护工具图标、说明和跳转链接。</p>
          </div>
          <button onClick={onClose} className={iconButtonCls} title="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-overlay)]">
              {form.icon_url ? (
                <UsesIcon
                  key={`preview:${form.icon_url ?? ''}:${form.link ?? ''}`}
                  iconUrl={form.icon_url}
                  link={form.link}
                  name={form.name || '工具图标'}
                  fallback={categoryMeta.icon}
                  wrapperClassName="flex h-11 w-11 items-center justify-center"
                  imgClassName="h-11 w-11 object-contain"
                  fallbackClassName="text-2xl"
                />
              ) : (
                <span className="text-2xl">{categoryMeta.icon}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{form.name || '未命名工具'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{categoryMeta.label}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={fieldLabelCls}>分类</label>
              <select value={form.category} onChange={setField('category')} className={selectCls}>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
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
            <label className={fieldLabelCls}>名称 *</label>
            <Input
              value={form.name ?? ''}
              onChange={setField('name')}
              placeholder="工具名称"
              autoFocus
            />
          </div>

          <div>
            <label className={fieldLabelCls}>简介</label>
            <Textarea
              value={form.description ?? ''}
              onChange={setField('description')}
              rows={3}
              placeholder="一句话描述这个工具的用途和亮点。"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={fieldLabelCls}>图标 URL</label>
              <Input
                value={form.icon_url ?? ''}
                onChange={setField('icon_url')}
                placeholder="https://example.com/favicon.ico"
              />
            </div>
            <div>
              <label className={fieldLabelCls}>官网 / 下载链接</label>
              <Input
                value={form.link ?? ''}
                onChange={setField('link')}
                placeholder="https://..."
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] px-6 py-5">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.name?.trim()} loading={saving}>
            {!saving && <Save className="h-4 w-4" />}
            保存工具
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminUsesPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const [items, setItems] = useState<UsesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsesItem | null>(null);
  const [draftForm, setDraftForm] = useState<Partial<UsesItem>>(EMPTY);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState('all');
  const [q, setQ] = useState('');
  const [caching, setCaching] = useState(false);
  const [cacheMsg, setCacheMsg] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      showLoginModal();
      return;
    }

    fetch('/api/uses')
      .then((response) => response.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [isAdmin, showLoginModal]);

  function openCreate(category = 'software') {
    const nextSort = items.filter((item) => item.category === category).length + 1;
    setEditing(null);
    setDraftForm({
      ...EMPTY,
      category,
      sort_order: nextSort,
    });
    setModalOpen(true);
  }

  function openEdit(item: UsesItem) {
    setDraftForm(EMPTY);
    setEditing(item);
    setModalOpen(true);
  }

  function handleSaved(item: UsesItem, isNew: boolean) {
    setEditing(null);
    setItems((prev) =>
      isNew
        ? [...prev, item].sort((a, b) => a.sort_order - b.sort_order)
        : prev.map((existing) => (existing.id === item.id ? item : existing))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除这条工具？')) return;

    setDeleting(id);
    try {
      await fetch(`/api/uses/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleSeed() {
    if (!confirm('将写入约 80 条示例工具箱数据，确认？')) return;

    setCaching(true);
    setCacheMsg('正在写入种子数据…');
    try {
      const endpoints = ['/api/admin/seed-uses', '/api/admin/seed-uses-more', '/api/admin/seed-uses-notes-ide'];
      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, { method: 'POST', credentials: 'include' });
        const data = await response.json();
        if (!response.ok) {
          setCacheMsg(data.error || '写入失败');
          return;
        }
      }
      setCacheMsg('写入完成，正在刷新…');
      const fresh = await fetch('/api/uses').then((response) => response.json());
      setItems(fresh);
      setCacheMsg('初始化成功！');
    } catch (error) {
      setCacheMsg(`失败：${String(error)}`);
    } finally {
      setCaching(false);
      setTimeout(() => setCacheMsg(''), 5000);
    }
  }

  async function handleCacheIcons() {
    setCaching(true);
    setCacheMsg('正在下载并缓存图标，请稍候…');
    try {
      const response = await fetch('/api/admin/cache-icons', { method: 'POST', credentials: 'include' });
      const data = await response.json();
      setCacheMsg(data.message ?? '完成');
      const fresh = await fetch('/api/uses').then((res) => res.json());
      setItems(fresh);
    } catch {
      setCacheMsg('缓存失败，请重试');
    } finally {
      setCaching(false);
      setTimeout(() => setCacheMsg(''), 4000);
    }
  }

  const filtered = items.filter((item) => {
    if (activeCat !== 'all' && item.category !== activeCat) return false;
    if (
      q &&
      !item.name.toLowerCase().includes(q.toLowerCase()) &&
      !(item.description ?? '').toLowerCase().includes(q.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const grouped = filtered.reduce<Record<string, UsesItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const orderedCats = [
    ...CATEGORIES.map((category) => category.value).filter((value) => grouped[value]),
    ...Object.keys(grouped).filter((key) => !CATEGORIES.find((category) => category.value === key)),
  ];

  const catCounts = CATEGORIES.reduce<Record<string, number>>((acc, category) => {
    acc[category.value] = items.filter((item) => item.category === category.value).length;
    return acc;
  }, {});

  const visibleCategoryCount = orderedCats.length;

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
                  <Wrench className="h-5 w-5 text-primary" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">工具箱管理</h1>
                  <p className="text-sm text-muted-foreground">维护工具清单、图标缓存和分类展示顺序。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {items.length === 0 ? (
              <Button variant="secondary" onClick={handleSeed} disabled={caching}>
                {caching ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>📦</span>}
                初始化数据
              </Button>
            ) : null}
            <Button variant="secondary" onClick={handleCacheIcons} disabled={caching}>
              {caching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
              缓存图标
            </Button>
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4" />
              添加工具
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">工具总数</p>
            <p className="mt-3 text-3xl font-semibold">{items.length}</p>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">当前分类</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{visibleCategoryCount}</p>
              <Badge variant="soft">可视分类</Badge>
            </div>
          </Card>
          <Card variant="default" className="rounded-[var(--radius-2xl)]">
            <p className="text-sm text-muted-foreground">已筛选结果</p>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-3xl font-semibold">{filtered.length}</p>
              <Badge tone="info" variant="soft">实时更新</Badge>
            </div>
          </Card>
        </div>

        <AnimatePresence>
          {cacheMsg ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card variant="default" padding="sm" className="flex items-center gap-3 rounded-[var(--radius-xl)]">
                {caching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                <p className="text-sm text-[var(--color-neutral-700)]">{cacheMsg}</p>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Card variant="elevated" className="space-y-4 rounded-[var(--radius-2xl)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="搜索工具名称或描述…"
                className="pl-11"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCat === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveCat('all')}
                className="rounded-full"
              >
                全部 ({items.length})
              </Button>
              {CATEGORIES.filter((category) => catCounts[category.value] > 0).map((category) => (
                <Button
                  key={category.value}
                  variant={activeCat === category.value ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCat(category.value)}
                  className="rounded-full"
                >
                  {category.icon} {category.label} ({catCounts[category.value]})
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载工具箱"
            description="正在同步工具、图标和分类信息，请稍等。"
          />
        ) : filtered.length === 0 ? (
          <StatePanel
            tone="empty"
            title={q ? '没有匹配的工具' : '工具箱还是空的'}
            description={q ? '试试更换关键词，或者切到别的分类看看。' : '先添加第一条工具记录，前台工具箱页就会显示出来。'}
            action={
              <Button onClick={() => openCreate(activeCat === 'all' ? 'software' : activeCat)}>
                <Plus className="h-4 w-4" />
                添加工具
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            {orderedCats.map((cat) => {
              const meta = getCategory(cat);
              return (
                <Card key={cat} variant="elevated" className="space-y-4 rounded-[var(--radius-2xl)]">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{meta.icon}</span>
                    <h2 className="text-base font-semibold">{meta.label}</h2>
                    <Badge variant="outline">{grouped[cat].length} 条</Badge>
                    <div className="h-px flex-1 bg-[var(--border-default)]" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {grouped[cat].map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-xs)] transition-all duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-base)]">
                              {item.icon_url ? (
                                <UsesIcon
                                  key={`${item.id}:${item.icon_url ?? ''}:${item.link ?? ''}`}
                                  iconUrl={item.icon_url}
                                  link={item.link}
                                  name={item.name}
                                  fallback={meta.icon}
                                  wrapperClassName="flex h-6 w-6 items-center justify-center"
                                  imgClassName="h-6 w-6 object-contain"
                                  fallbackClassName="text-sm"
                                />
                              ) : (
                                <span className="text-sm">{meta.icon}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">排序 #{item.sort_order}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button onClick={() => openEdit(item)} className={iconButtonCls} title="编辑工具">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              disabled={deleting === item.id}
                              className={`${iconButtonCls} hover:border-red-400 hover:text-red-500 disabled:opacity-60`}
                              title="删除工具"
                            >
                              {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        {item.description ? (
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">还没有填写这条工具的描述。</p>
                        )}

                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex max-w-full items-center gap-1.5 text-xs text-primary transition-colors hover:text-[var(--color-primary-700)]"
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.link.replace(/^https?:\/\//, '')}</span>
                          </a>
                        ) : null}
                      </motion.div>
                    ))}

                    <button
                      onClick={() => openCreate(cat)}
                      className="flex min-h-[146px] flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-dashed border-[color:var(--border-default)] bg-[var(--surface-raised)] text-sm text-muted-foreground transition-all duration-[var(--duration-fast)] hover:border-[var(--color-primary-500)] hover:text-primary"
                    >
                      <Plus className="h-5 w-5" />
                      添加到 {meta.label}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <ItemModal
            editing={editing}
            initialForm={draftForm}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
              setDraftForm(EMPTY);
            }}
            onSaved={handleSaved}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
