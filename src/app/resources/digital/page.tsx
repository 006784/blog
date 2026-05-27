'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Plus, Pencil, Trash2, X, Check, BookOpen, Film } from 'lucide-react';
import { APPLE_EASE_SOFT } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { useShop } from '../_shop/ShopProvider';
import { useAdmin } from '@/components/AdminProvider';
import type { DigitalProduct } from '../_shop/types';

type FormState = {
  title: string;
  description: string;
  type: 'ebook' | 'video';
  price: string;
  original_price: string;
  cover_url: string;
  netdisk_type: 'baidu' | 'quark';
  netdisk_url: string;
  netdisk_password: string;
  tags: string;
  sort_order: string;
};

const EMPTY_FORM: FormState = {
  title: '', description: '', type: 'ebook',
  price: '', original_price: '', cover_url: '',
  netdisk_type: 'baidu', netdisk_url: '', netdisk_password: '',
  tags: '', sort_order: '0',
};

function NetdiskBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      type === 'baidu' ? 'bg-blue-100 text-blue-700' : 'bg-cyan-100 text-cyan-700'
    }`}>
      {type === 'baidu' ? '百度网盘' : '夸克网盘'}
    </span>
  );
}

function ProductCard({
  product, onBuy, isAdmin, onEdit, onDelete,
}: {
  product: DigitalProduct;
  onBuy: () => void;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="overflow-hidden rounded-2xl border border-line bg-(--surface-raised) shadow-(--shadow-sm) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
    >
      <div className={`h-1.5 res-digital-bar--${product.type}`} />
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {product.type === 'ebook'
              ? <BookOpen className="h-4 w-4 text-amber-500 shrink-0" />
              : <Film className="h-4 w-4 text-purple-500 shrink-0" />}
            <span className={`res-digital-badge--${product.type} rounded-full px-2.5 py-0.5 text-[11px] font-semibold`}>
              {product.type === 'ebook' ? '电子书' : '影视资源'}
            </span>
          </div>
          <NetdiskBadge type={product.netdisk_type} />
        </div>

        <h2 className="text-base font-bold text-ink leading-snug">{product.title}</h2>
        <p className="mt-2 text-xs leading-5 text-ink-secondary line-clamp-3">{product.description}</p>

        {product.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-(--surface-overlay) px-2 py-0.5 text-[10px] text-ink-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-ink">¥{product.price.toFixed(0)}</span>
              {product.original_price && (
                <span className="text-xs text-ink-muted line-through">¥{product.original_price}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg p-1.5 text-ink-muted hover:bg-black/5 transition-colors"
                  aria-label="编辑"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition-colors"
                  aria-label="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onBuy}
              className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper transition-all hover:opacity-85 active:scale-95"
            >
              立即购买
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AdminForm({
  initial, onSave, onCancel, saving,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="rounded-2xl border border-gold/30 bg-(--surface-raised) p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-ink-muted">标题 *</label>
          <input value={form.title} onChange={set('title')} placeholder="资源标题"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-ink-muted">描述</label>
          <textarea value={form.description} onChange={set('description')} rows={3} placeholder="资源简介"
            className="w-full resize-none rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-muted">类型 *</label>
          <select value={form.type} onChange={set('type')} title="资源类型"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none">
            <option value="ebook">电子书</option>
            <option value="video">影视资源</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-muted">网盘类型 *</label>
          <select value={form.netdisk_type} onChange={set('netdisk_type')} title="网盘类型"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none">
            <option value="baidu">百度网盘</option>
            <option value="quark">夸克网盘</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-muted">价格 (¥) *</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="9.90"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-muted">原价 (¥, 可选)</label>
          <input type="number" min="0" step="0.01" value={form.original_price} onChange={set('original_price')} placeholder="19.90"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-ink-muted">网盘链接 *</label>
          <input value={form.netdisk_url} onChange={set('netdisk_url')} placeholder="https://pan.baidu.com/s/..."
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-muted">提取码</label>
          <input value={form.netdisk_password} onChange={set('netdisk_password')} placeholder="abcd"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-ink-muted">排序</label>
          <input type="number" value={form.sort_order} onChange={set('sort_order')} placeholder="0"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-ink-muted">封面图 URL（可选）</label>
          <input value={form.cover_url} onChange={set('cover_url')} placeholder="https://..."
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <label className="text-xs font-semibold text-ink-muted">标签（逗号分隔）</label>
          <input value={form.tags} onChange={set('tags')} placeholder="经典, 推荐"
            className="w-full rounded-xl border border-line bg-(--surface-base) px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-paper transition-all ${
            saving ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:opacity-85'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          {saving ? '保存中…' : '保存'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink-secondary hover:bg-black/5 transition-colors"
        >
          <X className="h-3.5 w-3.5 inline mr-1" />
          取消
        </button>
      </div>
    </div>
  );
}

export default function DigitalPage() {
  const { openDigitalCheckout, pushNotice } = useShop();
  const { isAdmin } = useAdmin();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shop/digital');
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      pushNotice('error', '加载商品失败');
    } finally {
      setLoading(false);
    }
  }, [pushNotice]);

  useEffect(() => {
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formToPayload = (form: FormState) => ({
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    price: parseFloat(form.price) || 0,
    original_price: form.original_price ? parseFloat(form.original_price) : null,
    cover_url: form.cover_url.trim() || null,
    netdisk_type: form.netdisk_type,
    netdisk_url: form.netdisk_url.trim(),
    netdisk_password: form.netdisk_password.trim(),
    tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    sort_order: parseInt(form.sort_order) || 0,
  });

  const handleAdd = async (form: FormState) => {
    if (!form.title || !form.price || !form.netdisk_url) {
      pushNotice('error', '请填写标题、价格和网盘链接');
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch('/api/shop/digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) throw new Error((await res.json()).error || '添加失败');
      pushNotice('success', '商品已添加');
      setAddOpen(false);
      await fetchProducts();
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : '添加失败');
    } finally {
      setAddSaving(false);
    }
  };

  const handleEdit = async (form: FormState) => {
    if (!editingId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/shop/digital/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) throw new Error((await res.json()).error || '更新失败');
      pushNotice('success', '商品已更新');
      setEditingId(null);
      await fetchProducts();
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : '更新失败');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确认下架「${title}」？`)) return;
    try {
      const res = await fetch(`/api/shop/digital/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || '操作失败');
      pushNotice('success', '商品已下架');
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : '操作失败');
    }
  };

  const editInitial = (p: DigitalProduct): FormState => ({
    title: p.title,
    description: p.description,
    type: p.type,
    price: String(p.price),
    original_price: p.original_price ? String(p.original_price) : '',
    cover_url: p.cover_url ?? '',
    netdisk_type: p.netdisk_type,
    netdisk_url: '',
    netdisk_password: '',
    tags: p.tags.join(', '),
    sort_order: String(p.sort_order),
  });

  return (
    <div className="min-h-screen px-4 py-20 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: APPLE_EASE_SOFT }}
          className="flex items-center gap-2 text-sm text-ink-muted"
        >
          <Link href="/resources" className="hover:text-ink transition-colors">商店</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">数字资源</span>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
          className="flex items-start justify-between gap-4"
        >
          <div className="space-y-3">
            <Badge tone="success" variant="soft" className="w-fit">
              Digital Resources · 网盘资源
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">数字资源</h1>
            <p className="max-w-xl text-sm leading-7 text-ink-secondary">
              精选电子书与高清影视资源，下单后立即获取网盘直链，长期有效，手机电脑均可使用。
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setAddOpen(true); setEditingId(null); }}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-paper hover:opacity-85 transition-all"
            >
              <Plus className="h-4 w-4" />
              添加商品
            </button>
          )}
        </motion.div>

        {/* Admin: add form */}
        {isAdmin && addOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminForm
              initial={EMPTY_FORM}
              onSave={handleAdd}
              onCancel={() => setAddOpen(false)}
              saving={addSaving}
            />
          </motion.div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-line bg-(--surface-raised)" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-line bg-(--surface-raised) py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-ink-muted" />
            <p className="mt-4 text-sm text-ink-muted">暂无上架资源</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {products.map((product) => (
              <div key={product.id}>
                {isAdmin && editingId === product.id ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AdminForm
                      initial={editInitial(product)}
                      onSave={handleEdit}
                      onCancel={() => setEditingId(null)}
                      saving={editSaving}
                    />
                  </motion.div>
                ) : (
                  <ProductCard
                    product={product}
                    onBuy={() => openDigitalCheckout(product)}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditingId(product.id); setAddOpen(false); }}
                    onDelete={() => handleDelete(product.id, product.title)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">购买须知</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: '交付方式', desc: '下单后立即显示网盘直链及提取码，请及时保存。付款后将订单号发给站长确认。' },
              { title: '内容说明', desc: '仅收录整理费用。本站不上架侵权内容，所有资源均为公开授权或可合法分享的资料。' },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-(--border-default) bg-(--surface-base) p-4">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-xs leading-5 text-ink-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
