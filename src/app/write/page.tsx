'use client';

import { useState, useEffect, useEffectEvent, Suspense } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Send, X, Plus,
  Tag, Folder, Check, AlertCircle, Loader2,
  Eye, BookOpen, Shield, FolderOpen, Bell, Pin
} from 'lucide-react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageUploader } from '@/components/ImageUploader';
import { Collection, getPostById, getPostBySlug } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import MobileWritePage from './mobile/page';
import { apiCreatePost, apiUpdatePost } from '@/lib/post-api-client';

async function apiCreateCollection(body: Partial<Collection>): Promise<Collection> {
  const res = await fetch('/api/collections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json()).error || '创建失败');
  return (await res.json()).collection;
}

const RichEditor = dynamic(
  () => import('@/components/RichEditor').then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 bg-[var(--paper)] animate-pulse" aria-label="编辑器加载中" />
    ),
  }
);

const categories = [
  { value: 'tech', label: '技术', kana: '技' },
  { value: 'design', label: '設計', kana: '美' },
  { value: 'life', label: '生活', kana: '活' },
  { value: 'thoughts', label: '思考', kana: '思' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// Toggle switch component
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[var(--gold)]' : 'bg-[var(--line)]'}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isMobile = useIsMobile();
  const { isAdmin, loading: adminLoading, showLoginModal } = useAdmin();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('tech');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedAt, setPinnedAt] = useState<string | null>(null);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [showPreviewPane, setShowPreviewPane] = useState(false);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const saveLocalDraft = useEffectEvent(() => {
    if (!title.trim() && !content.trim()) return;
    localStorage.setItem('blog-draft', JSON.stringify({ title, description, content, category, tags, coverImage, isPinned, savedAt: new Date().toISOString() }));
  });

  const loadLocalDraft = useEffectEvent(() => {
    try {
      const saved = localStorage.getItem('blog-draft');
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.title || draft.content) {
          setTitle(draft.title || '');
          setDescription(draft.description || '');
          setContent(draft.content || '');
          setCategory(draft.category || 'tech');
          setTags(draft.tags || []);
          setCoverImage(draft.coverImage || '');
          setIsPinned(Boolean(draft.isPinned));
          showNotification('success', '已恢复本地草稿');
        }
      }
    } catch (e) {
      console.error('加载本地草稿失败:', e);
    }
  });

  const loadCollections = useEffectEvent(async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const { collections } = await res.json();
        setCollections(collections);
      }
    } catch (error) {
      console.error('加载集合失败:', error);
    }
  });

  const loadPost = useEffectEvent(async (id: string) => {
    try {
      setLoading(true);
      const post = await getPostById(id) || await getPostBySlug(id);
      if (post) {
        setTitle(post.title);
        setDescription(post.description);
        setContent(post.content ?? '');
        setCategory(post.category);
        setTags(post.tags || []);
        setCoverImage(post.cover_image || post.image || '');
        setMetaTitle(post.meta_title || '');
        setMetaDescription(post.meta_description || '');
        setCollectionId(post.collection_id || null);
        setIsPinned(Boolean(post.is_pinned));
        setPinnedAt(post.pinned_at || null);
        setCurrentPostId(post.id);
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      showNotification('error', '加载文章失败');
    } finally {
      setLoading(false);
    }
  });

  const autoSaveDraft = useEffectEvent(async () => {
    if (!title.trim() && !content.trim()) return;
    try {
      const resolvedPinnedAt = isPinned ? (pinnedAt || new Date().toISOString()) : null;
      if (isPinned && !pinnedAt) setPinnedAt(resolvedPinnedAt);
      const postData = {
        title: title || '未命名草稿',
        slug: currentPostId ? undefined : generateSlug(title || '未命名草稿'),
        description, content, category, tags,
        image: coverImage, cover_image: coverImage,
        author: 'Lumen', reading_time: estimateReadingTime(content),
        status: 'draft' as const, meta_title: metaTitle, meta_description: metaDescription,
        is_pinned: isPinned, pinned_at: resolvedPinnedAt, collection_id: collectionId || undefined,
      };
      if (currentPostId) {
        await apiUpdatePost(currentPostId, postData);
      } else {
        const newPost = await apiCreatePost(postData);
        setCurrentPostId(newPost.id);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  });

  useEffect(() => {
    if (editId) {
      void loadPost(editId);
    }
  }, [editId]);

  useEffect(() => {
    void loadCollections();
    if (!editId) {
      void loadLocalDraft();
    }
  }, [editId]);

  useEffect(() => {
    if (editId) return;
    const timer = setTimeout(() => {
      saveLocalDraft();
    }, 5000);
    return () => clearTimeout(timer);
  }, [title, description, content, category, tags, coverImage, editId]);

  useEffect(() => {
    if (!title && !content) return;
    const timer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        void autoSaveDraft();
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [title, content]);

  function clearLocalDraft() {
    localStorage.removeItem('blog-draft');
  }


  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    setCreatingCollection(true);
    try {
      const newCol = await apiCreateCollection({ name: newCollectionName.trim(), color: `#${Math.floor(Math.random() * 16777215).toString(16)}` });
      setCollections([...collections, newCol]);
      setCollectionId(newCol.id);
      setShowNewCollection(false);
      setNewCollectionName('');
      showNotification('success', `集合「${newCol.name}」创建成功`);
    } catch (error) {
      console.error('创建集合失败:', error);
      showNotification('error', '创建集合失败');
    } finally {
      setCreatingCollection(false);
    }
  }

  function generateSlug(t: string): string {
    return t.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5-]/g, '').replace(/\s+/g, '-').trim() + '-' + Date.now().toString(36);
  }

  function estimateReadingTime(text: string): string {
    const minutes = Math.max(1, Math.ceil(text.length / 300));
    return `${minutes} min read`;
  }

  const handleSaveDraft = async () => {
    if (!title.trim()) { showNotification('error', '请输入文章标题'); return; }
    setIsSaving(true);
    try {
      const resolvedPinnedAt = isPinned ? (pinnedAt || new Date().toISOString()) : null;
      if (isPinned && !pinnedAt) setPinnedAt(resolvedPinnedAt);
      const postData = {
        title, slug: currentPostId ? undefined : generateSlug(title),
        description, content, category, tags,
        image: coverImage, cover_image: coverImage,
        author: 'Lumen', reading_time: estimateReadingTime(content),
        status: 'draft' as const, meta_title: metaTitle, meta_description: metaDescription,
        is_pinned: isPinned, pinned_at: resolvedPinnedAt, collection_id: collectionId || undefined,
      };
      let savedPost;
      if (currentPostId) {
        savedPost = await apiUpdatePost(currentPostId, postData);
      } else {
        savedPost = await apiCreatePost(postData);
        setCurrentPostId(savedPost.id);
      }
      setLastSaved(new Date());
      showNotification('success', '草稿已保存');
    } catch (error) {
      console.error('保存失败:', error);
      showNotification('error', error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) { showNotification('error', '请输入文章标题'); return; }
    if (!content.trim()) { showNotification('error', '请输入文章内容'); return; }
    setIsPublishing(true);
    try {
      const slug = currentPostId ? undefined : generateSlug(title);
      const resolvedPinnedAt = isPinned ? (pinnedAt || new Date().toISOString()) : null;
      if (isPinned && !pinnedAt) setPinnedAt(resolvedPinnedAt);
      const postData = {
        title, slug, description, content, category, tags,
        image: coverImage, cover_image: coverImage,
        author: 'Lumen', reading_time: estimateReadingTime(content),
        status: 'published' as const, meta_title: metaTitle, meta_description: metaDescription,
        is_pinned: isPinned, pinned_at: resolvedPinnedAt,
        published_at: new Date().toISOString(), collection_id: collectionId || undefined,
      };
      let savedPost;
      if (currentPostId) {
        savedPost = await apiUpdatePost(currentPostId, postData);
      } else {
        savedPost = await apiCreatePost(postData);
      }
      showNotification('success', '文章已发布');
      clearLocalDraft();
      if (notifySubscribers && savedPost) {
        try {
          const res = await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId: savedPost.id, postSlug: savedPost.slug, title: savedPost.title, description: savedPost.description, author: savedPost.author }),
          });
          const data = await res.json();
          if (res.ok && data.successful > 0) showNotification('success', `已通知 ${data.successful} 位订阅者`);
        } catch (notifyError) {
          console.error('发送通知失败:', notifyError);
        }
      }
      setTimeout(() => router.push('/blog'), 1500);
    } catch (error) {
      console.error('发布失败:', error);
      showNotification('error', error instanceof Error ? error.message : '发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) { setTags([...tags, tag]); setTagInput(''); }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const wordCount = content.length;
  const readingMin = Math.max(1, Math.ceil(wordCount / 300));

  // ── Non-admin gate ──────────────────────────────────────────
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 border border-[var(--line)] flex items-center justify-center">
            <Shield className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="font-[var(--font-mincho)] text-2xl mb-2 text-[var(--ink)]">需要管理员权限</h1>
          <p className="text-sm text-[var(--ink)]/50 mb-6">只有管理员可以发布文章</p>
          <button
            onClick={() => showLoginModal(() => window.location.reload())}
            className="px-8 py-2.5 border border-[var(--gold)] text-[var(--gold)] text-sm hover:bg-[var(--gold)] hover:text-[var(--paper)] transition-colors mb-4"
          >
            管理员登录
          </button>
          <div>
            <Link href="/blog" className="text-xs text-[var(--ink)]/40 hover:text-[var(--gold)] transition-colors">返回博客</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) return <MobileWritePage />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    );
  }

  // ── 3-column editor layout ───────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--paper)]" style={{ fontFamily: 'var(--font-jp-serif)' }}>

      {/* ── Top toolbar (48px) ─────────────────────────────── */}
      <header className="h-12 flex-none flex items-center border-b border-[var(--line)] px-4 gap-4">
        <Link href="/blog" className="flex items-center gap-1.5 text-[var(--ink)]/50 hover:text-[var(--gold)] transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">返回</span>
        </Link>

        <div className="w-px h-5 bg-[var(--line)]" />

        <span className="font-[var(--font-mincho)] text-sm text-[var(--ink)]">
          {editId ? '編集' : '新稿'}
        </span>

        <div className="flex-1" />

        {/* save status */}
        <AnimatePresence>
          {isSaving && (
            <motion.span
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1 text-xs text-[var(--ink)]/40"
            >
              <Loader2 className="w-3 h-3 animate-spin" />保存中
            </motion.span>
          )}
        </AnimatePresence>
        {lastSaved && !isSaving && (
          <span className="text-xs text-[var(--ink)]/30 hidden md:block">
            {lastSaved.toLocaleTimeString()} 已保存
          </span>
        )}

        {/* preview toggle (md only — xl has dedicated pane) */}
        <button
          onClick={() => setShowPreviewPane(!showPreviewPane)}
          className={`xl:hidden p-1.5 border border-[var(--line)] text-xs flex items-center gap-1 transition-colors ${showPreviewPane ? 'border-[var(--gold)] text-[var(--gold)]' : 'text-[var(--ink)]/50 hover:text-[var(--gold)]'}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">预览</span>
        </button>

        {/* save draft */}
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-[var(--line)] text-sm text-[var(--ink)]/70 hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">草稿</span>
        </button>

        {/* publish */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--gold)] text-[var(--paper)] text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">発布</span>
        </button>
      </header>

      {/* ── Body (flex row) ──────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left metadata sidebar (260px) ────────────────── */}
        <aside className="w-[260px] flex-none border-r border-[var(--line)] overflow-y-auto flex flex-col hidden md:flex">
          <div className="flex-1 p-4 space-y-6">

            {/* Cover image */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-2" style={{ fontFamily: 'var(--font-garamond)' }}>Cover</p>
              {coverImage ? (
                <div className="relative aspect-video overflow-hidden border border-[var(--line)]">
                  <Image src={coverImage} alt="封面" fill sizes="260px" className="object-cover" />
                  <button
                    onClick={() => setCoverImage('')}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <ImageUploader onUpload={setCoverImage} folder="covers" aspectRatio="video" placeholder="点击上传封面" preview="" />
              )}
              <p className="text-[10px] text-[var(--ink)]/30 mt-1">建议 1200×630</p>
            </section>

            {/* Title */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-2" style={{ fontFamily: 'var(--font-garamond)' }}>Title</p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文章标题"
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--gold)] outline-none text-sm text-[var(--ink)] placeholder:text-[var(--ink)]/30 pb-1.5 transition-colors"
                style={{ fontFamily: 'var(--font-mincho)' }}
              />
            </section>

            {/* Description */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-2" style={{ fontFamily: 'var(--font-garamond)' }}>Description</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="一句话摘要"
                rows={2}
                className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--gold)] outline-none text-xs text-[var(--ink)] placeholder:text-[var(--ink)]/30 pb-1.5 resize-none transition-colors leading-relaxed"
              />
            </section>

            {/* Category */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-2" style={{ fontFamily: 'var(--font-garamond)' }}>Category</p>
              <div className="grid grid-cols-2 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 px-2 py-1.5 border text-xs transition-colors ${
                      category === cat.value
                        ? 'border-[var(--gold)] text-[var(--gold)]'
                        : 'border-[var(--line)] text-[var(--ink)]/50 hover:border-[var(--gold)]/50 hover:text-[var(--ink)]'
                    }`}
                  >
                    <span className="text-[10px] font-[var(--font-mincho)] opacity-60">{cat.kana}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Tags */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-2" style={{ fontFamily: 'var(--font-garamond)' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 border border-[var(--gold)]/50 text-[10px] text-[var(--gold)]">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:opacity-60"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
              {tags.length < 5 && (
                <div className="flex items-center gap-1 border-b border-[var(--line)] focus-within:border-[var(--gold)] transition-colors">
                  <Tag className="w-3 h-3 text-[var(--ink)]/30 flex-none" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    onBlur={addTag}
                    placeholder="Enter 添加标签"
                    className="flex-1 bg-transparent outline-none text-xs text-[var(--ink)] placeholder:text-[var(--ink)]/30 py-1"
                  />
                </div>
              )}
            </section>

            {/* Collection */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-2" style={{ fontFamily: 'var(--font-garamond)' }}>Collection</p>
              <div className="space-y-1">
                <button
                  onClick={() => setCollectionId(null)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 border text-xs transition-colors ${!collectionId ? 'border-[var(--gold)] text-[var(--gold)]' : 'border-[var(--line)] text-[var(--ink)]/50 hover:border-[var(--gold)]/50'}`}
                >
                  <Folder className="w-3 h-3" />
                  <span>不归入集合</span>
                  {!collectionId && <Check className="w-3 h-3 ml-auto" />}
                </button>
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => setCollectionId(col.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 border text-xs transition-colors ${collectionId === col.id ? 'border-[var(--gold)] text-[var(--gold)]' : 'border-[var(--line)] text-[var(--ink)]/50 hover:border-[var(--gold)]/50'}`}
                  >
                    <div className="w-2 h-2 rounded-full flex-none" style={{ background: col.color || '#c4a96d' }} />
                    <span className="flex-1 text-left truncate">{col.name}</span>
                    <span className="text-[10px] opacity-50">{col.post_count}</span>
                    {collectionId === col.id && <Check className="w-3 h-3" />}
                  </button>
                ))}
                {showNewCollection ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="集合名称"
                      autoFocus
                      className="flex-1 px-2 py-1 border border-[var(--line)] focus:border-[var(--gold)] bg-transparent outline-none text-xs text-[var(--ink)]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCollectionName.trim()) handleCreateCollection();
                        if (e.key === 'Escape') { setShowNewCollection(false); setNewCollectionName(''); }
                      }}
                    />
                    <button onClick={handleCreateCollection} disabled={!newCollectionName.trim() || creatingCollection} className="px-2 border border-[var(--gold)] text-[var(--gold)] disabled:opacity-40">
                      {creatingCollection ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </button>
                    <button onClick={() => { setShowNewCollection(false); setNewCollectionName(''); }} className="px-2 border border-[var(--line)] text-[var(--ink)]/50">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewCollection(true)}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 border border-dashed border-[var(--line)] text-xs text-[var(--ink)]/40 hover:border-[var(--gold)]/50 hover:text-[var(--gold)] transition-colors"
                  >
                    <Plus className="w-3 h-3" />新建集合
                  </button>
                )}
              </div>
            </section>

            {/* Publish settings */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-3" style={{ fontFamily: 'var(--font-garamond)' }}>Publish</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[var(--ink)]/60">
                    <Pin className="w-3.5 h-3.5" />首页置顶
                  </div>
                  <Toggle checked={isPinned} onChange={(v) => {
                    setIsPinned(v);
                    if (v && !pinnedAt) setPinnedAt(new Date().toISOString());
                    if (!v) setPinnedAt(null);
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[var(--ink)]/60">
                    <Bell className="w-3.5 h-3.5" />通知订阅者
                  </div>
                  <Toggle checked={notifySubscribers} onChange={setNotifySubscribers} />
                </div>
              </div>
            </section>

            {/* SEO */}
            <section>
              <p className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40 mb-3" style={{ fontFamily: 'var(--font-garamond)' }}>SEO</p>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[var(--ink)]/40 block mb-1">Meta 标题</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder={title || '文章标题'}
                    className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--gold)] outline-none text-xs text-[var(--ink)] placeholder:text-[var(--ink)]/30 pb-1 transition-colors"
                  />
                  <p className="text-[10px] text-[var(--ink)]/25 mt-0.5">{(metaTitle || title || '').length}/60</p>
                </div>
                <div>
                  <label className="text-[10px] text-[var(--ink)]/40 block mb-1">Meta 描述</label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder={description || '文章描述'}
                    rows={2}
                    className="w-full bg-transparent border-b border-[var(--line)] focus:border-[var(--gold)] outline-none text-xs text-[var(--ink)] placeholder:text-[var(--ink)]/30 pb-1 resize-none transition-colors"
                  />
                  <p className="text-[10px] text-[var(--ink)]/25 mt-0.5">{(metaDescription || description || '').length}/160</p>
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* ── Center editor ─────────────────────────────────── */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showPreviewPane ? 'hidden xl:flex' : 'flex'}`}>
          <RichEditor
            value={content}
            onChange={setContent}
            onSave={handleSaveDraft}
            initialShowPreview={false}
            aiTitle={title}
            aiDescription={description}
            onSummaryGenerated={(summary) => {
              setDescription(summary);
              if (!metaDescription.trim()) {
                setMetaDescription(summary);
              }
            }}
            placeholder={`開始書く…\n\nMarkdown 支持粗体、斜体、标题、链接、图片、代码块等。\n快捷键：Ctrl/Cmd+B 粗体  Ctrl/Cmd+I 斜体  Ctrl/Cmd+S 保存`}
          />
        </div>

        {/* ── Right preview (xl+) or toggled preview ───────── */}
        <div className={`w-[320px] flex-none border-l border-[var(--line)] overflow-y-auto ${showPreviewPane ? 'flex xl:flex flex-col' : 'hidden xl:flex xl:flex-col'}`}>
          <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-[var(--line)]">
            <span className="text-[9px] uppercase tracking-widest text-[var(--ink)]/40" style={{ fontFamily: 'var(--font-garamond)' }}>Preview</span>
            <button onClick={() => setShowPreviewPane(false)} className="xl:hidden text-[var(--ink)]/40 hover:text-[var(--gold)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 px-6 py-6 prose prose-sm max-w-none overflow-y-auto"
            style={{
              fontFamily: 'var(--font-jp-serif)',
              color: 'var(--ink)',
              lineHeight: 1.9,
            }}
          >
            {title && (
              <h1 style={{ fontFamily: 'var(--font-mincho)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--ink)' }}>
                {title}
              </h1>
            )}
            {description && (
              <p style={{ fontSize: '0.8rem', color: 'var(--ink)', opacity: 0.5, marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {description}
              </p>
            )}
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p style={{ color: 'var(--ink)', opacity: 0.25, fontSize: '0.8rem' }}>内容将在此处预览…</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom status bar (32px) ─────────────────────────── */}
      <footer className="h-8 flex-none border-t border-[var(--line)] flex items-center px-4 gap-4">
        <div className="flex items-center gap-1 text-[10px] text-[var(--ink)]/35">
          <BookOpen className="w-3 h-3" />
          {wordCount.toLocaleString()} 字
        </div>
        <div className="w-px h-3 bg-[var(--line)]" />
        <span className="text-[10px] text-[var(--ink)]/35">约 {readingMin} 分钟</span>
        <div className="flex-1" />
        {lastSaved && (
          <span className="text-[10px] text-[var(--ink)]/25">{lastSaved.toLocaleTimeString()} 保存</span>
        )}
        <div className="flex items-center gap-1 text-[10px] text-[var(--ink)]/35">
          <FolderOpen className="w-3 h-3" />
          {collections.find(c => c.id === collectionId)?.name || '无集合'}
        </div>
      </footer>

      {/* ── Toast notification ────────────────────────────────── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-10 right-6 px-4 py-2.5 flex items-center gap-2 text-sm z-[60] ${
              notification.type === 'success'
                ? 'bg-[var(--gold)] text-[var(--paper)]'
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}
