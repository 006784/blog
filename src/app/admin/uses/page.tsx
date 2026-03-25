'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Plus, Edit2, Trash2, X, Loader2, Save,
  ArrowLeft, Search, ImageDown, ExternalLink, Check,
} from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import { UsesItem } from '@/lib/supabase';

// ── 分类配置 ────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'hardware',   label: '硬件设备',       icon: '💻' },
  { value: 'chips',      label: '芯片 / CPU',     icon: '⚡' },
  { value: 'software',   label: '常用软件',        icon: '📱' },
  { value: 'notes',      label: '笔记工具',        icon: '📝' },
  { value: 'opensource', label: 'Mac 开源工具',    icon: '🐙' },
  { value: 'dev-tools',  label: '开发工具 / IDE',  icon: '🛠' },
  { value: 'languages',  label: '编程语言',         icon: '🔤' },
  { value: 'services',   label: '云服务',           icon: '☁️' },
  { value: 'design',     label: '设计工具',         icon: '🎨' },
  { value: 'daily',      label: '日常',             icon: '✨' },
];

const getCat = (v: string) => CATEGORIES.find(c => c.value === v) ?? { label: v, icon: '📦', value: v };

const EMPTY: Partial<UsesItem> = {
  category: 'software', name: '', description: '', icon_url: '', link: '', sort_order: 0,
};

// ── 输入框组件 ──────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors';

// ── 表单弹窗 ────────────────────────────────────────────────
function ItemModal({
  editing, onClose, onSaved,
}: {
  editing: UsesItem | null;
  onClose: () => void;
  onSaved: (item: UsesItem, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<Partial<UsesItem>>(editing ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof UsesItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    if (!form.name?.trim()) { setError('名称不能为空'); return; }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/uses/${editing.id}` : '/api/uses';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError('保存失败，请重试'); return; }
      const saved = await res.json();
      onSaved(saved, !editing);
      onClose();
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl overflow-hidden"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <h2 className="font-semibold">{editing ? '编辑工具' : '添加工具'}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--paper-deep)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 图标预览 + URL */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] flex items-center justify-center shrink-0 overflow-hidden">
              {form.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.icon_url} alt="" className="w-10 h-10 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
              ) : (
                <span className="text-2xl">{getCat(form.category ?? '').icon}</span>
              )}
            </div>
            <Field label="图标 URL">
              <input value={form.icon_url ?? ''} onChange={set('icon_url')} placeholder="https://example.com/favicon.ico" className={inputCls} />
            </Field>
          </div>

          {/* 分类 + 排序 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="分类">
              <select value={form.category} onChange={set('category')} className={inputCls}>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="排序（数字越小越靠前）">
              <input type="number" value={form.sort_order ?? 0}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                className={inputCls} />
            </Field>
          </div>

          {/* 名称 */}
          <Field label="名称 *">
            <input value={form.name ?? ''} onChange={set('name')} placeholder="工具名称" className={inputCls} autoFocus />
          </Field>

          {/* 简介 */}
          <Field label="简介">
            <textarea value={form.description ?? ''} onChange={set('description')}
              placeholder="一句话描述这个工具的用途…"
              rows={2}
              className={`${inputCls} resize-none`} />
          </Field>

          {/* 链接 */}
          <Field label="官网 / 下载链接">
            <input value={form.link ?? ''} onChange={set('link')} placeholder="https://..." className={inputCls} />
          </Field>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[var(--line)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--paper-deep)] transition-colors">
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name?.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'var(--gold)' }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 主页面 ──────────────────────────────────────────────────
export default function AdminUsesPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const [items, setItems] = useState<UsesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsesItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState('all');
  const [q, setQ] = useState('');
  const [caching, setCaching] = useState(false);
  const [cacheMsg, setCacheMsg] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) { showLoginModal(); return; }
    fetch('/api/uses').then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, [isAdmin]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: UsesItem) {
    setEditing(item);
    setModalOpen(true);
  }

  function handleSaved(item: UsesItem, isNew: boolean) {
    setItems(prev =>
      isNew
        ? [...prev, item].sort((a, b) => a.sort_order - b.sort_order)
        : prev.map(i => i.id === item.id ? item : i)
    );
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除这条工具？')) return;
    setDeleting(id);
    try {
      await fetch(`/api/uses/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleSeed() {
    if (!confirm('将写入约 80 条示例工具箱数据（硬件/软件/语言/开源工具等），确认？')) return;
    setCaching(true);
    setCacheMsg('正在写入种子数据…');
    try {
      const endpoints = ['/api/admin/seed-uses', '/api/admin/seed-uses-more', '/api/admin/seed-uses-notes-ide'];
      for (const ep of endpoints) {
        const res = await fetch(ep, { method: 'POST', credentials: 'include' });
        const data = await res.json();
        if (!res.ok) { setCacheMsg(data.error || '写入失败'); return; }
      }
      setCacheMsg('写入完成，正在刷新…');
      const fresh = await fetch('/api/uses').then(r => r.json());
      setItems(fresh);
      setCacheMsg('初始化成功！');
    } catch (e) {
      setCacheMsg('失败：' + String(e));
    } finally {
      setCaching(false);
      setTimeout(() => setCacheMsg(''), 5000);
    }
  }

  async function handleCacheIcons() {
    setCaching(true);
    setCacheMsg('正在下载并缓存图标，请稍候…');
    try {
      const res = await fetch('/api/admin/cache-icons', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      setCacheMsg(data.message ?? '完成');
      // 刷新数据
      const fresh = await fetch('/api/uses').then(r => r.json());
      setItems(fresh);
    } catch {
      setCacheMsg('缓存失败，请重试');
    } finally {
      setCaching(false);
      setTimeout(() => setCacheMsg(''), 4000);
    }
  }

  // 过滤
  const filtered = items.filter(item => {
    if (activeCat !== 'all' && item.category !== activeCat) return false;
    if (q && !item.name.toLowerCase().includes(q.toLowerCase()) && !(item.description ?? '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  // 按分类分组
  const grouped = filtered.reduce<Record<string, UsesItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const orderedCats = [
    ...CATEGORIES.map(c => c.value).filter(v => grouped[v]),
    ...Object.keys(grouped).filter(k => !CATEGORIES.find(c => c.value === k)),
  ];

  // 统计
  const catCounts = CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c.value] = items.filter(i => i.category === c.value).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── 顶部 ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Wrench className="w-5 h-5" style={{ color: 'var(--gold)' }} />
            <h1 className="text-xl font-bold">工具箱管理</h1>
            <span className="text-sm text-muted-foreground">({items.length} 条)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* 初始化数据 */}
            {items.length === 0 && (
              <button
                onClick={handleSeed}
                disabled={caching}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-[var(--line)] text-sm hover:border-[var(--gold)] transition-colors disabled:opacity-50"
              >
                {caching ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>📦</span>}
                <span className="hidden sm:inline">初始化数据</span>
              </button>
            )}
            {/* 缓存图标 */}
            <button
              onClick={handleCacheIcons}
              disabled={caching}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--line)] text-sm hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors disabled:opacity-50"
              title="将所有图标下载到 Supabase Storage"
            >
              {caching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageDown className="w-4 h-4" />}
              <span className="hidden sm:inline">{caching ? '缓存中…' : '缓存图标'}</span>
            </button>

            {/* 添加 */}
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-85"
              style={{ background: 'var(--gold)' }}
            >
              <Plus className="w-4 h-4" />
              添加工具
            </button>
          </div>
        </div>

        {/* 缓存提示 */}
        <AnimatePresence>
          {cacheMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] text-sm"
            >
              {caching ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--gold)' }} /> : <Check className="w-4 h-4 text-emerald-500" />}
              {cacheMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 搜索 + 分类筛选 ── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索工具名称或描述…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCat('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCat === 'all' ? 'text-white' : 'border border-[var(--line)] hover:border-[var(--gold)] text-muted-foreground'}`}
              style={activeCat === 'all' ? { background: 'var(--gold)' } : {}}
            >
              全部 ({items.length})
            </button>
            {CATEGORIES.filter(c => catCounts[c.value] > 0).map(c => (
              <button
                key={c.value}
                onClick={() => setActiveCat(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCat === c.value ? 'text-white' : 'border border-[var(--line)] hover:border-[var(--gold)] text-muted-foreground'}`}
                style={activeCat === c.value ? { background: 'var(--gold)' } : {}}
              >
                {c.icon} {c.label} ({catCounts[c.value]})
              </button>
            ))}
          </div>
        </div>

        {/* ── 内容区 ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>{q ? '没有匹配的工具' : '点击右上角添加第一个工具'}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {orderedCats.map(cat => {
              const meta = getCat(cat);
              return (
                <div key={cat}>
                  {/* 分类标题 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{meta.icon}</span>
                    <h2 className="text-sm font-semibold">{meta.label}</h2>
                    <span className="text-xs text-muted-foreground">({grouped[cat].length})</span>
                    <div className="flex-1 h-px bg-[var(--line)]" />
                  </div>

                  {/* 卡片网格 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {grouped[cat].map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group relative rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] p-3 hover:border-[var(--gold)] transition-colors"
                      >
                        {/* 操作按钮 */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1 rounded-md bg-[var(--paper)] border border-[var(--line)] hover:border-[var(--gold)] transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="p-1 rounded-md bg-[var(--paper)] border border-[var(--line)] hover:border-red-400 hover:text-red-500 transition-colors"
                          >
                            {deleting === item.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* 图标 + 名称 */}
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-lg border border-[var(--line)] bg-[var(--paper)] flex items-center justify-center shrink-0 overflow-hidden">
                            {item.icon_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.icon_url} alt={item.name} className="w-5 h-5 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
                            ) : (
                              <span className="text-sm">{meta.icon}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {item.link && (
                              <a href={item.link} target="_blank" rel="noreferrer"
                                className="text-[10px] text-muted-foreground hover:text-[var(--gold)] transition-colors flex items-center gap-0.5 truncate"
                                onClick={e => e.stopPropagation()}>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{item.link.replace(/^https?:\/\//, '')}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* 描述 */}
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </motion.div>
                    ))}

                    {/* 快速添加到当前分类 */}
                    <button
                      onClick={() => {
                        setEditing(null);
                        setModalOpen(true);
                      }}
                      className="rounded-xl border border-dashed border-[var(--line)] p-3 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors min-h-[80px]"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs">添加</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 弹窗 */}
      <AnimatePresence>
        {modalOpen && (
          <ItemModal
            editing={editing}
            onClose={() => setModalOpen(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
