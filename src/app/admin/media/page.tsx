'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film, Plus, Edit2, Trash2, X, Loader2, Save,
  ArrowLeft, Search, Star, BookOpen, Tv, Music2, Mic, Gamepad2, Database,
} from 'lucide-react';
import Link from 'next/link';
import { useAdmin } from '@/components/AdminProvider';
import { MediaItem } from '@/lib/supabase';

// ── 配置 ────────────────────────────────────────────────────
const TYPES = [
  { value: 'book',    label: '📚 书',    icon: BookOpen },
  { value: 'movie',   label: '🎬 电影',  icon: Film },
  { value: 'tv',      label: '📺 剧集',  icon: Tv },
  { value: 'music',   label: '🎵 音乐',  icon: Music2 },
  { value: 'podcast', label: '🎙 播客',  icon: Mic },
  { value: 'game',    label: '🎮 游戏',  icon: Gamepad2 },
];

const STATUSES = [
  { value: 'want',  label: '想看/读', color: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800' },
  { value: 'doing', label: '进行中',  color: 'bg-blue-50 text-blue-500 dark:bg-blue-950/40' },
  { value: 'done',  label: '已完成',  color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' },
];

const EMPTY: Partial<MediaItem> = {
  type: 'book', title: '', author: '', status: 'want',
  rating: undefined, review: '', finish_date: '', external_link: '', cover_image: '',
};

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors';

// ── 星级组件 ──────────────────────────────────────────────
function Stars({ rating }: { rating?: number | null }) {
  if (!rating) return null;
  const stars = Math.round(rating / 2);
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-0.5">{rating}</span>
    </span>
  );
}

// ── 弹窗 ─────────────────────────────────────────────────
function ItemModal({ editing, onClose, onSaved }: {
  editing: MediaItem | null;
  onClose: () => void;
  onSaved: (item: MediaItem, isNew: boolean) => void;
}) {
  const [form, setForm] = useState<Partial<MediaItem>>(editing ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof MediaItem) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSave() {
    if (!form.title?.trim()) { setError('标题不能为空'); return; }
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/media/${editing.id}` : '/api/media';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError('保存失败'); return; }
      onSaved(await res.json(), !editing);
      onClose();
    } catch { setError('网络错误'); }
    finally { setSaving(false); }
  }

  const typeEmoji = TYPES.find(t => t.value === form.type)?.label.slice(0,2) ?? '📚';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{typeEmoji}</span>
            <h2 className="font-semibold">{editing ? '编辑' : '添加'}条目</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--paper-deep)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* 封面预览 + 类型 */}
          <div className="flex gap-4">
            <div className="w-16 h-24 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] flex items-center justify-center shrink-0 overflow-hidden text-3xl">
              {form.cover_image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={form.cover_image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                : typeEmoji}
            </div>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">类型</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map(t => (
                    <button key={t.value} type="button"
                      onClick={() => setForm(f => ({ ...f, type: t.value as MediaItem['type'] }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${form.type === t.value ? 'text-white border-transparent' : 'border-[var(--line)] text-muted-foreground hover:border-[var(--gold)]'}`}
                      style={form.type === t.value ? { background: 'var(--gold)' } : {}}
                    >{t.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">状态</label>
                <div className="flex gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s.value} type="button"
                      onClick={() => setForm(f => ({ ...f, status: s.value as MediaItem['status'] }))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${form.status === s.value ? s.color + ' ring-1 ring-current' : 'border border-[var(--line)] text-muted-foreground'}`}
                    >{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 标题 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">标题 *</label>
            <input value={form.title ?? ''} onChange={set('title')} placeholder="书名 / 片名…" className={inputCls} autoFocus />
          </div>

          {/* 作者 + 评分 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">作者 / 导演</label>
              <input value={form.author ?? ''} onChange={set('author')} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">评分 (1–10)</label>
              <input type="number" min="1" max="10" step="0.5"
                value={form.rating ?? ''}
                onChange={e => setForm(f => ({ ...f, rating: e.target.value ? Number(e.target.value) : undefined }))}
                className={inputCls} />
            </div>
          </div>

          {/* 完成日期 + 封面 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">完成日期</label>
              <input type="date" value={form.finish_date ?? ''} onChange={set('finish_date')} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">封面图 URL</label>
              <input value={form.cover_image ?? ''} onChange={set('cover_image')} placeholder="https://..." className={inputCls} />
            </div>
          </div>

          {/* 外链 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">豆瓣 / 阅读链接</label>
            <input value={form.external_link ?? ''} onChange={set('external_link')} placeholder="https://..." className={inputCls} />
          </div>

          {/* 短评 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">短评</label>
            <textarea value={form.review ?? ''} onChange={set('review')} rows={2} placeholder="一两句感受…" className={`${inputCls} resize-none`} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-[var(--line)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--paper-deep)] transition-colors">取消</button>
          <button onClick={handleSave} disabled={saving || !form.title?.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
            style={{ background: 'var(--gold)' }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 主页面 ───────────────────────────────────────────────
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
    if (!isAdmin) { showLoginModal(); return; }
    fetch('/api/media').then(r => r.json()).then(setItems).finally(() => setLoading(false));
  }, [isAdmin]);

  function handleSaved(item: MediaItem, isNew: boolean) {
    setItems(prev => isNew ? [item, ...prev] : prev.map(i => i.id === item.id ? item : i));
  }

  async function handleSeed() {
    if (!confirm('将写入约 70 条示例书影音数据，确认？')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seed-media', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { alert(data.error || '写入失败'); return; }
      alert(data.message);
      const r = await fetch('/api/media');
      const d = await r.json();
      setItems(d);
    } catch (e) {
      alert('请求失败：' + String(e));
    } finally {
      setSeeding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;
    setDeleting(id);
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } finally { setDeleting(null); }
  }

  const filtered = items.filter(item => {
    if (activeType !== 'all' && item.type !== activeType) return false;
    if (activeStatus !== 'all' && item.status !== activeStatus) return false;
    if (q && !item.title.toLowerCase().includes(q.toLowerCase()) && !(item.author ?? '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const typeCounts: Record<string, number> = { all: items.length };
  TYPES.forEach(t => { typeCounts[t.value] = items.filter(i => i.type === t.value).length; });

  const statusCounts: Record<string, number> = { all: items.length };
  STATUSES.forEach(s => { statusCounts[s.value] = items.filter(i => i.status === s.value).length; });

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* 顶部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Film className="w-5 h-5" style={{ color: 'var(--gold)' }} />
            <h1 className="text-xl font-bold">书影音管理</h1>
            <span className="text-sm text-muted-foreground">({items.length} 条)</span>
          </div>
          <div className="flex items-center gap-2">
            {items.length === 0 && (
              <button onClick={handleSeed} disabled={seeding}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--line)] hover:border-[var(--gold)] transition-colors disabled:opacity-50">
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                初始化数据
              </button>
            )}
            <button onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-85 transition-opacity"
              style={{ background: 'var(--gold)' }}>
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {[{ value: 'all', label: '全部', emoji: '✦' }, ...TYPES].map(t => (
            <button key={t.value}
              onClick={() => setActiveType(t.value)}
              className={`p-3 rounded-xl border text-center transition-colors ${activeType === t.value ? 'border-[var(--gold)] bg-[var(--paper-deep)]' : 'border-[var(--line)] hover:border-[var(--gold)]'}`}>
              <div className="text-lg mb-0.5">{'emoji' in t ? t.emoji : t.label.slice(0,2)}</div>
              <div className="text-xs font-bold">{typeCounts[t.value] ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">{'emoji' in t ? '全部' : t.label.slice(2)}</div>
            </button>
          ))}
        </div>

        {/* 搜索 + 状态筛选 */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="搜索标题或作者…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors" />
          </div>
          <div className="flex gap-1.5">
            {[{ value: 'all', label: `全部(${statusCounts.all})` }, ...STATUSES.map(s => ({ value: s.value, label: `${s.label}(${statusCounts[s.value]})` }))].map(s => (
              <button key={s.value} onClick={() => setActiveStatus(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeStatus === s.value ? 'text-white' : 'border border-[var(--line)] text-muted-foreground hover:border-[var(--gold)]'}`}
                style={activeStatus === s.value ? { background: 'var(--gold)' } : {}}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>{q ? '没有匹配的内容' : '点击右上角开始添加'}</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {filtered.map(item => {
              const typeInfo = TYPES.find(t => t.value === item.type);
              const statusInfo = STATUSES.find(s => s.value === item.status);
              return (
                <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="group flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper-deep)] p-3 hover:border-[var(--gold)] transition-colors">
                  {/* 封面 */}
                  <div className="w-12 h-16 rounded-lg border border-[var(--line)] bg-[var(--paper)] shrink-0 flex items-center justify-center overflow-hidden text-2xl">
                    {item.cover_image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display='none')} />
                      : typeInfo?.label.slice(0,2)}
                  </div>
                  {/* 信息 */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditing(item); setModalOpen(true); }}
                          className="p-1 rounded hover:bg-[var(--paper)] transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                          className="p-1 rounded hover:text-red-500 transition-colors">
                          {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    {item.author && <p className="text-xs text-muted-foreground mt-0.5">{item.author}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusInfo?.color}`}>{statusInfo?.label}</span>
                      <Stars rating={item.rating} />
                    </div>
                    {item.review && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.review}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && <ItemModal editing={editing} onClose={() => setModalOpen(false)} onSaved={handleSaved} />}
      </AnimatePresence>
    </div>
  );
}
