'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, Star, Plus, Trash2, Edit2,
  X, Loader2, Heart, Globe,
} from 'lucide-react';
import Image from 'next/image';
import { useAdmin } from '@/components/AdminProvider';

// ─────────────────────────────────────────────────────────────
// Types & constants
// ─────────────────────────────────────────────────────────────

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
const EMPTY_FORM  = { name: '', url: '', description: '', avatar: '', category: '技术博客', is_featured: false };
const PALETTE     = ['#c4a96d', '#8b6f3a', '#9a9188', '#5a5650', '#c8c4bb'];

function safeHostname(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}

// ─────────────────────────────────────────────────────────────
// Small reusable components  (NO hooks inside these)
// ─────────────────────────────────────────────────────────────

function LetterAvatar({ name, size }: { name: string; size: number }) {
  const bg = PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {(name[0] ?? '?').toUpperCase()}
    </div>
  );
}

// Avatar with error fallback — keeps useState at top, always called
function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false);
  return imgErr || !src ? (
    <LetterAvatar name={name} size={size} />
  ) : (
    <Image
      src={src} alt={name} width={size} height={size} unoptimized
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgErr(true)}
    />
  );
}

function Divider() {
  return <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />;
}

function SectionLabel({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
        {text}
      </span>
      <Divider />
    </div>
  );
}

const cardBase: React.CSSProperties = {
  display: 'block',
  borderRadius: 14,
  border: '1px solid var(--line)',
  background: 'var(--paper-warm)',
  textDecoration: 'none',
  transition: 'border-color .18s, box-shadow .18s, transform .18s',
};

// ─────────────────────────────────────────────────────────────
// Card components (NO hooks)
// ─────────────────────────────────────────────────────────────

function FeaturedCard({
  link, isAdmin, onEdit, onDelete,
}: {
  link: FriendLink; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <a
        href={link.url} target="_blank" rel="noopener noreferrer"
        style={{ ...cardBase, padding: '16px 18px' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--gold)';
          e.currentTarget.style.boxShadow  = '0 6px 20px rgba(0,0,0,.13)';
          e.currentTarget.style.transform  = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow  = 'none';
          e.currentTarget.style.transform  = 'none';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Avatar src={link.avatar} name={link.name} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{link.name}</span>
              <Star size={11} style={{ fill: 'var(--gold)', color: 'var(--gold)', flexShrink: 0 }} />
            </div>
            {link.description && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-secondary)', lineHeight: 1.5,
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {link.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7 }}>
              <Globe size={10} style={{ color: 'var(--ink-ghost)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {safeHostname(link.url)}
              </span>
            </div>
          </div>
          <ExternalLink size={13} style={{ color: 'var(--ink-ghost)', flexShrink: 0, marginTop: 2 }} />
        </div>
      </a>

      {isAdmin && (
        <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AdminBtn onClick={e => { e.preventDefault(); onEdit(); }}><Edit2 size={11} /></AdminBtn>
          <AdminBtn onClick={e => { e.preventDefault(); onDelete(); }}><Trash2 size={11} /></AdminBtn>
        </div>
      )}
    </div>
  );
}

function LinkCard({
  link, isAdmin, onEdit, onDelete,
}: {
  link: FriendLink; isAdmin: boolean;
  onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <a
        href={link.url} target="_blank" rel="noopener noreferrer"
        style={{ ...cardBase, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px' }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--gold)';
          e.currentTarget.style.boxShadow  = '0 4px 14px rgba(0,0,0,.1)';
          e.currentTarget.style.transform  = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow  = 'none';
          e.currentTarget.style.transform  = 'none';
        }}
      >
        <Avatar src={link.avatar} name={link.name} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {link.name}
          </p>
          {link.description && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {link.description}
            </p>
          )}
        </div>
        <ExternalLink size={12} style={{ color: 'var(--ink-ghost)', flexShrink: 0, opacity: 0, transition: 'opacity .15s' }}
          className="group-hover:opacity-100" />
      </a>

      {isAdmin && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <AdminBtn onClick={e => { e.preventDefault(); onEdit(); }}><Edit2 size={10} /></AdminBtn>
          <AdminBtn onClick={e => { e.preventDefault(); onDelete(); }}><Trash2 size={10} /></AdminBtn>
        </div>
      )}
    </div>
  );
}

function AdminBtn({ onClick, children }: { onClick: React.MouseEventHandler; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ padding: 5, borderRadius: 6, border: '1px solid var(--line)',
        background: 'var(--paper-warm)', cursor: 'pointer', color: 'var(--ink-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Modal (has hooks — kept separate from page)
// ─────────────────────────────────────────────────────────────

function LinkModal({ editing, onClose, onSaved }: {
  editing: FriendLink | null;
  onClose: () => void;
  onSaved: (link: FriendLink, isNew: boolean) => void;
}) {
  const [form, setForm]     = useState(() => editing
    ? { name: editing.name, url: editing.url, description: editing.description ?? '',
        avatar: editing.avatar ?? '', category: editing.category ?? '技术博客',
        is_featured: editing.is_featured ?? false }
    : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function setField<K extends keyof typeof form>(k: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true); setError('');
    try {
      const res = await fetch(editing ? `/api/links/${editing.id}` : '/api/links', {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '保存失败'); return; }
      onSaved(data, !editing);
      onClose();
    } catch {
      setError('网络错误');
    } finally {
      setSaving(false);
    }
  }

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 8,
    border: '1px solid var(--line)', background: 'var(--paper-deep)',
    color: 'var(--ink)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: .96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .96, y: 12 }}
        style={{ width: '100%', maxWidth: 480, borderRadius: 18,
          border: '1px solid var(--line)', background: 'var(--paper-warm)',
          boxShadow: '0 24px 60px rgba(0,0,0,.3)', overflow: 'hidden' }}
      >
        {/* 标题栏 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '15px 22px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
            {editing ? '编辑友链' : '添加友链'}
          </span>
          <button onClick={onClose}
            style={{ padding: 5, borderRadius: 7, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--ink-muted)' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={submit} style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}>

          {/* 预览 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px',
            borderRadius: 10, background: 'var(--paper-deep)', border: '1px solid var(--line)' }}>
            <Avatar src={form.avatar} name={form.name || '?'} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.name || <span style={{ color: 'var(--ink-ghost)' }}>博客名称</span>}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.url || 'https://...'}
              </p>
            </div>
          </div>

          {/* 名称 + 分类 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 4 }}>名称 *</label>
              <input value={form.name} onChange={setField('name')} placeholder="我的博客" required autoFocus style={iStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.currentTarget.style.borderColor  = 'var(--line)')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 4 }}>分类</label>
              <select value={form.category} onChange={setField('category')}
                style={{ ...iStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* 网址 */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 4 }}>网址 *</label>
            <input type="url" value={form.url} onChange={setField('url')} placeholder="https://example.com" required style={iStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.currentTarget.style.borderColor  = 'var(--line)')} />
          </div>

          {/* 头像 */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 4 }}>头像链接</label>
            <input type="url" value={form.avatar} onChange={setField('avatar')} placeholder="https://..." style={iStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.currentTarget.style.borderColor  = 'var(--line)')} />
          </div>

          {/* 简介 */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 4 }}>一句话介绍</label>
            <input value={form.description} onChange={setField('description')} placeholder="这个博客写什么…" style={iStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.currentTarget.style.borderColor  = 'var(--line)')} />
          </div>

          {/* 精选开关 */}
          <button type="button"
            onClick={() => setForm(f => ({ ...f, is_featured: !f.is_featured }))}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 13px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${form.is_featured ? 'var(--gold)' : 'var(--line)'}`,
              background: form.is_featured ? 'rgba(196,169,109,.1)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Star size={14} style={{ fill: form.is_featured ? 'var(--gold)' : 'none', color: form.is_featured ? 'var(--gold)' : 'var(--ink-ghost)' }} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>精选推荐</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-muted)' }}>在顶部以大卡片展示</p>
              </div>
            </div>
            <div style={{ width: 34, height: 19, borderRadius: 10, position: 'relative', flexShrink: 0,
              background: form.is_featured ? 'var(--gold)' : 'var(--line)', transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 1.5, width: 16, height: 16, borderRadius: 8,
                background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'transform .2s',
                transform: form.is_featured ? 'translateX(17px)' : 'translateX(1.5px)' }} />
            </div>
          </button>

          {error && <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: 9, paddingTop: 5, borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--line)',
                background: 'transparent', fontSize: 13, color: 'var(--ink-secondary)', cursor: 'pointer' }}>
              取消
            </button>
            <button type="submit" disabled={saving || !form.name.trim() || !form.url.trim()}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none',
                background: 'var(--gold)', fontSize: 13, fontWeight: 600, color: 'var(--paper)',
                cursor: 'pointer', opacity: (saving || !form.name.trim() || !form.url.trim()) ? .4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {saving && <Loader2 size={13} className="animate-spin" />}
              {editing ? '保存修改' : '添加友链'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function LinksPage() {
  // All hooks at top — never conditional
  const { isAdmin }  = useAdmin();
  const [links,    setLinks]    = useState<FriendLink[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState<FriendLink | null>(null);
  const [activeCat, setActiveCat] = useState('全部');

  useEffect(() => {
    fetch('/api/links')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setLinks(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate()           { setEditing(null);  setModal(true); }
  function openEdit(l: FriendLink){ setEditing(l);     setModal(true); }
  function closeModal()           { setModal(false);   setEditing(null); }

  function handleSaved(link: FriendLink, isNew: boolean) {
    setLinks(prev => isNew ? [link, ...prev] : prev.map(l => l.id === link.id ? link : l));
  }

  async function handleDelete(id: string) {
    if (!confirm('确认删除？')) return;
    await fetch(`/api/links/${id}`, { method: 'DELETE', credentials: 'include' });
    setLinks(prev => prev.filter(l => l.id !== id));
  }

  const featured = links.filter(l => l.is_featured);
  const regular  = links.filter(l => !l.is_featured);
  const catList  = ['全部', ...Array.from(new Set(regular.map(l => l.category || '其他')))];
  const filtered = activeCat === '全部'
    ? regular
    : regular.filter(l => (l.category || '其他') === activeCat);
  const grouped = filtered.reduce<Record<string, FriendLink[]>>((acc, l) => {
    const c = l.category || '其他'; (acc[c] ??= []).push(l); return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', padding: '64px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* 标题 */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-.02em', color: 'var(--ink)' }}>
                友情链接
              </h1>
              <p style={{ margin: '7px 0 0', fontSize: 14, color: 'var(--ink-secondary)' }}>
                一些有趣的朋友和他们的角落
              </p>
            </div>
            {isAdmin && (
              <button onClick={openCreate}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px',
                  borderRadius: 10, border: 'none', background: 'var(--gold)', color: 'var(--paper)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, marginTop: 4 }}>
                <Plus size={14} /> 添加
              </button>
            )}
          </div>
        </motion.div>

        {/* loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={22} className="animate-spin" style={{ color: 'var(--ink-ghost)' }} />
          </div>
        )}

        {/* empty */}
        {!loading && links.length === 0 && (
          <div style={{ borderRadius: 16, border: '1px dashed var(--line)',
            padding: '60px 24px', textAlign: 'center' }}>
            <Heart size={30} style={{ margin: '0 auto 10px', color: 'var(--ink-ghost)' }} />
            <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: 14 }}>还没有友链，快来交换吧</p>
          </div>
        )}

        {/* content */}
        {!loading && links.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* 精选 */}
            {featured.length > 0 && (
              <section>
                <SectionLabel text="精选推荐"
                  icon={<Star size={13} style={{ fill: 'var(--gold)', color: 'var(--gold)', flexShrink: 0 }} />} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                  {featured.map(link => (
                    <FeaturedCard key={link.id} link={link} isAdmin={isAdmin}
                      onEdit={() => openEdit(link)} onDelete={() => handleDelete(link.id)} />
                  ))}
                </div>
              </section>
            )}

            {/* 分类 tabs */}
            {catList.length > 2 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {catList.map(cat => (
                  <button key={cat} onClick={() => setActiveCat(cat)}
                    style={{ padding: '4px 13px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1px solid ${activeCat === cat ? 'var(--ink)' : 'var(--line)'}`,
                      background: activeCat === cat ? 'var(--ink)' : 'transparent',
                      color: activeCat === cat ? 'var(--paper)' : 'var(--ink-secondary)' }}>
                    {cat}
                    <span style={{ marginLeft: 4, opacity: .5, fontSize: 11 }}>
                      {cat === '全部' ? regular.length : regular.filter(l => (l.category || '其他') === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* 卡片 */}
            {Object.entries(grouped).map(([cat, catLinks]) => (
              <section key={cat}>
                {activeCat === '全部' && <SectionLabel text={cat} />}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 9 }}>
                  {catLinks.map(link => (
                    <LinkCard key={link.id} link={link} isAdmin={isAdmin}
                      onEdit={() => openEdit(link)} onDelete={() => handleDelete(link.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* 申请友链 */}
        {!isAdmin && !loading && (
          <div style={{ marginTop: 56, padding: '24px 20px', borderRadius: 14,
            border: '1px dashed var(--line)', textAlign: 'center' }}>
            <Heart size={26} style={{ margin: '0 auto 8px', color: 'var(--ink-ghost)' }} />
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>想交换友链？</p>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-muted)' }}>欢迎通过联系页面告诉我你的博客</p>
            <a href="/contact"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 16px',
                borderRadius: 9, border: '1px solid var(--line)', fontSize: 13,
                color: 'var(--ink-secondary)', textDecoration: 'none' }}>
              去联系我 →
            </a>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <LinkModal key="link-modal" editing={editing} onClose={closeModal} onSaved={handleSaved} />
        )}
      </AnimatePresence>
    </div>
  );
}
