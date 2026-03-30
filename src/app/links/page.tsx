'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Edit2,
  ExternalLink,
  Globe,
  Heart,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import { showToast } from '@/lib/toast';
import { showConfirm } from '@/lib/confirm';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  description?: string;
  avatar?: string;
  category?: string;
  is_featured?: boolean;
  created_at: string;
}

const CATEGORIES = ['技术博客', '生活记录', '设计创意', '其他'];
const EMPTY_FORM = {
  name: '',
  url: '',
  description: '',
  avatar: '',
  category: '技术博客',
  is_featured: false,
};
const PALETTE = ['#c4a96d', '#8b6f3a', '#9a9188', '#5a5650', '#c8c4bb'];

function safeHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function LetterAvatar({ name, size }: { name: string; size: number }) {
  const bg = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {(name[0] ?? '?').toUpperCase()}
    </div>
  );
}

function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);

  if (imgErr || !src) {
    return <LetterAvatar name={name} size={size} />;
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setImgErr(true)}
    />
  );
}

function SectionHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">{title}</h2>
      </div>
      <div className="h-px flex-1 bg-[var(--border-default)]" />
      {action}
    </div>
  );
}

function AdminActionButton({
  title,
  onClick,
  children,
  danger = false,
}: {
  title: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
        danger
          ? 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/15'
          : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:text-[var(--color-primary-600)]'
      }`}
    >
      {children}
    </button>
  );
}

function FeaturedCard({
  link,
  isAdmin,
  onEdit,
  onDelete,
}: {
  link: FriendLink;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative h-full">
      <Card
        variant="glass"
        padding="sm"
        className="h-full rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-xl)]"
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          <div className="flex items-start gap-4">
            <Avatar src={link.avatar} name={link.name} size={48} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-[var(--color-neutral-900)] transition-colors group-hover:text-[var(--color-primary-600)]">
                  {link.name}
                </h3>
                <Star className="h-4 w-4 shrink-0 fill-[var(--color-warning)] text-[var(--color-warning)]" />
              </div>
              {link.description ? (
                <p className="line-clamp-3 text-sm leading-6 text-[var(--color-neutral-600)]">
                  {link.description}
                </p>
              ) : (
                <p className="text-sm leading-6 text-[var(--color-neutral-500)]">
                  一个值得常去逛逛的角落。
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                <Globe className="h-3.5 w-3.5" />
                <span className="truncate">{safeHostname(link.url)}</span>
              </div>
            </div>
            <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-[var(--color-neutral-500)] transition-colors group-hover:text-[var(--color-primary-600)]" />
          </div>
        </a>

        {isAdmin ? (
          <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <AdminActionButton
              title="编辑友链"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </AdminActionButton>
            <AdminActionButton
              title="删除友链"
              danger
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </AdminActionButton>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function LinkCard({
  link,
  isAdmin,
  onEdit,
  onDelete,
}: {
  link: FriendLink;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative h-full">
      <Card
        variant="glass"
        padding="sm"
        className="h-full rounded-[var(--radius-2xl)] transition duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
      >
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full"
        >
          <div className="flex items-start gap-3">
            <Avatar src={link.avatar} name={link.name} size={40} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-base font-semibold text-[var(--color-neutral-900)] transition-colors group-hover:text-[var(--color-primary-600)]">
                  {link.name}
                </h3>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--color-neutral-500)] transition-colors group-hover:text-[var(--color-primary-600)]" />
              </div>
              {link.description ? (
                <p className="line-clamp-2 text-sm leading-6 text-[var(--color-neutral-600)]">
                  {link.description}
                </p>
              ) : (
                <p className="text-sm leading-6 text-[var(--color-neutral-500)]">
                  {safeHostname(link.url)}
                </p>
              )}
            </div>
          </div>
        </a>

        {isAdmin ? (
          <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <AdminActionButton
              title="编辑友链"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onEdit();
              }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </AdminActionButton>
            <AdminActionButton
              title="删除友链"
              danger
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </AdminActionButton>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function LinkModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: FriendLink | null;
  onClose: () => void;
  onSaved: (link: FriendLink, isNew: boolean) => void;
}) {
  const [form, setForm] = useState(() =>
    editing
      ? {
          name: editing.name,
          url: editing.url,
          description: editing.description ?? '',
          avatar: editing.avatar ?? '',
          category: editing.category ?? '技术博客',
          is_featured: editing.is_featured ?? false,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField<K extends keyof typeof form>(key: K) {
    return (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch(editing ? `/api/links/${editing.id}` : '/api/links', {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? '保存失败');
        return;
      }

      onSaved(data, !editing);
      onClose();
    } catch {
      setError('网络错误，请稍后再试');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-2xl"
      >
        <Card
          variant="elevated"
          padding="lg"
          className="rounded-[var(--radius-2xl)]"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
                {editing ? 'Edit Link' : 'Create Link'}
              </p>
              <h3 className="text-2xl font-semibold text-[var(--color-neutral-900)]">
                {editing ? '编辑友链' : '添加友链'}
              </h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
              <div className="flex items-center gap-4">
                <Avatar src={form.avatar} name={form.name || '?'} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-[var(--color-neutral-900)]">
                    {form.name || '博客名称'}
                  </p>
                  <p className="truncate text-sm text-[var(--color-neutral-500)]">
                    {form.url || 'https://example.com'}
                  </p>
                </div>
                {form.is_featured ? <Badge tone="warning">精选推荐</Badge> : null}
              </div>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--color-neutral-700)]">名称</span>
                <Input
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="我的博客"
                  required
                  autoFocus
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--color-neutral-700)]">分类</span>
                <select
                  value={form.category}
                  onChange={setField('category')}
                  className="w-full rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text-sm)] text-[var(--color-neutral-900)] shadow-[var(--shadow-xs)] outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--color-neutral-700)]">网址</span>
              <Input
                type="url"
                value={form.url}
                onChange={setField('url')}
                placeholder="https://example.com"
                required
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--color-neutral-700)]">头像链接</span>
                <Input
                  type="url"
                  value={form.avatar}
                  onChange={setField('avatar')}
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--color-neutral-700)]">一句话介绍</span>
                <Textarea
                  value={form.description}
                  onChange={setField('description')}
                  placeholder="这个博客写什么..."
                  rows={3}
                  className="resize-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, is_featured: !current.is_featured }))}
              className={`flex w-full items-center justify-between rounded-[var(--radius-xl)] border px-4 py-3 text-left transition ${
                form.is_featured
                  ? 'border-amber-400/30 bg-amber-500/10'
                  : 'border-[color:var(--border-default)] bg-[var(--surface-base)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-overlay)]">
                  <Star
                    className={`h-4 w-4 ${
                      form.is_featured
                        ? 'fill-[var(--color-warning)] text-[var(--color-warning)]'
                        : 'text-[var(--color-neutral-500)]'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-neutral-900)]">精选推荐</p>
                  <p className="text-xs text-[var(--color-neutral-500)]">在顶部以大卡片展示</p>
                </div>
              </div>
              <div
                className={`relative h-5 w-10 rounded-full transition ${
                  form.is_featured ? 'bg-[var(--color-warning)]' : 'bg-[var(--surface-overlay)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-[var(--shadow-sm)] transition ${
                    form.is_featured ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </div>
            </button>

            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-[color:var(--border-default)] pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={!form.name.trim() || !form.url.trim()}
              >
                {!saving ? <Plus className="h-4 w-4" /> : null}
                {editing ? '保存修改' : '添加友链'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}

export default function LinksPage() {
  const { isAdmin } = useAdmin();
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<FriendLink | null>(null);
  const [activeCat, setActiveCat] = useState('全部');

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch('/api/links');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) throw new Error('failed');
      setLinks(data);
    } catch {
      setLinks([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLinks();
  }, [fetchLinks]);

  function openCreate() {
    setEditing(null);
    setModal(true);
  }

  function openEdit(link: FriendLink) {
    setEditing(link);
    setModal(true);
  }

  function closeModal() {
    setModal(false);
    setEditing(null);
  }

  function handleSaved(link: FriendLink, isNew: boolean) {
    setLinks((current) => (isNew ? [link, ...current] : current.map((item) => (item.id === link.id ? link : item))));
  }

  async function handleDelete(id: string) {
    if (!(await showConfirm({ description: '确认删除这个友链吗？', danger: true }))) return;

    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('failed');
      setLinks((current) => current.filter((link) => link.id !== id));
    } catch {
      showToast.error('删除失败，请稍后重试');
    }
  }

  const featured = useMemo(() => links.filter((link) => link.is_featured), [links]);
  const regular = useMemo(() => links.filter((link) => !link.is_featured), [links]);
  const catList = useMemo(
    () => ['全部', ...Array.from(new Set(regular.map((link) => link.category || '其他')))],
    [regular]
  );
  const filtered = useMemo(
    () =>
      activeCat === '全部'
        ? regular
        : regular.filter((link) => (link.category || '其他') === activeCat),
    [activeCat, regular]
  );
  const grouped = useMemo(
    () =>
      filtered.reduce<Record<string, FriendLink[]>>((acc, link) => {
        const category = link.category || '其他';
        (acc[category] ??= []).push(link);
        return acc;
      }, {}),
    [filtered]
  );

  return (
    <div className="min-h-screen px-6 py-16 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            Friend Links
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                友情链接
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                一些喜欢逛、值得收藏，也愿意经常回访的朋友和他们的角落。
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-md">
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">All Links</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{links.length}</p>
              </Card>
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Featured</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{featured.length}</p>
              </Card>
            </div>
          </div>
        </motion.div>

        {isAdmin ? (
          <div className="flex justify-end">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              添加友链
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-40 rounded-[var(--radius-2xl)]" />
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="h-28 rounded-[var(--radius-2xl)]" />
              ))}
            </div>
          </div>
        ) : error ? (
          <StatePanel
            tone="error"
            icon={<RefreshCw className="h-6 w-6" />}
            title="友链列表加载失败"
            description="这次没能获取到友链数据，你可以重新试一次。"
            action={
              <Button onClick={() => void fetchLinks()}>
                <RefreshCw className="h-4 w-4" />
                重新加载
              </Button>
            }
          />
        ) : links.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={<Heart className="h-6 w-6" />}
            title="还没有友链"
            description="等交换到第一位朋友后，这里会开始出现大家的博客和站点。"
            action={
              !isAdmin ? (
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
                >
                  去联系我
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="space-y-8">
            {featured.length > 0 ? (
              <section>
                <SectionHeader
                  title="精选推荐"
                  icon={<Star className="h-4 w-4 fill-[var(--color-warning)] text-[var(--color-warning)]" />}
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.map((link) => (
                    <FeaturedCard
                      key={link.id}
                      link={link}
                      isAdmin={isAdmin}
                      onEdit={() => openEdit(link)}
                      onDelete={() => void handleDelete(link.id)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {catList.length > 2 ? (
              <Card variant="glass" className="rounded-[var(--radius-2xl)]">
                <div className="flex flex-wrap gap-2">
                  {catList.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCat(category)}
                      className={`rounded-full border px-3.5 py-2 text-sm transition ${
                        activeCat === category
                          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                          : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                      }`}
                    >
                      {category}
                      <span className="ml-1 opacity-70">
                        {category === '全部'
                          ? regular.length
                          : regular.filter((link) => (link.category || '其他') === category).length}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            <div className="space-y-8">
              {Object.entries(grouped).map(([category, categoryLinks]) => (
                <section key={category}>
                  {activeCat === '全部' ? <SectionHeader title={category} /> : null}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {categoryLinks.map((link) => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        isAdmin={isAdmin}
                        onEdit={() => openEdit(link)}
                        onDelete={() => void handleDelete(link.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {!isAdmin ? (
              <Card
                variant="bordered"
                className="rounded-[var(--radius-2xl)] border-dashed text-center"
              >
                <div className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-overlay)] text-[var(--color-primary-600)]">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-[var(--color-neutral-900)]">想交换友链？</p>
                    <p className="text-sm text-[var(--color-neutral-600)]">
                      欢迎通过联系页面告诉我你的博客，我会认真去看。
                    </p>
                  </div>
                  <div className="pt-1">
                    <Link
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary-500)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-600)]"
                    >
                      去联系我
                    </Link>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal ? (
          <LinkModal
            key="link-modal"
            editing={editing}
            onClose={closeModal}
            onSaved={handleSaved}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
