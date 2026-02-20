'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Send, Settings, X, Plus, 
  Tag, Folder, Check, AlertCircle, Loader2, 
  Clock, Eye, BookOpen, Sparkles, ImageIcon, Shield, FolderOpen, Bell, Pin
} from 'lucide-react';
import { RichEditor } from '@/components/RichEditor';
import { ImageUploader } from '@/components/ImageUploader';
import { Collection, createPost, updatePost, getPostById, getCollections, createCollection, setPostPinStatus } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import MobileWritePage from './mobile/page';

const categories = [
  { value: 'tech', label: '技术', icon: '💻', color: 'bg-blue-500' },
  { value: 'design', label: '设计', icon: '🎨', color: 'bg-purple-500' },
  { value: 'life', label: '生活', icon: '☕', color: 'bg-green-500' },
  { value: 'thoughts', label: '思考', icon: '💭', color: 'bg-amber-500' },
];

// 移动端检测 Hook
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

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isMobile = useIsMobile();
  const { isAdmin, showLoginModal } = useAdmin();

  // 文章数据
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
  
  // 集合数据
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [notifySubscribers, setNotifySubscribers] = useState(true); // 发布时通知订阅者
  
  // UI 状态
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(!!editId);

  // 加载编辑的文章
  useEffect(() => {
    if (editId) {
      loadPost(editId);
    }
  }, [editId]);

  // 加载集合列表
  useEffect(() => {
    loadCollections();
    // 加载本地草稿
    if (!editId) {
      loadLocalDraft();
    }
  }, [editId]);

  // 保存本地草稿
  useEffect(() => {
    if (editId) return; // 编辑模式不保存本地草稿
    const timer = setTimeout(() => {
      saveLocalDraft();
    }, 5000); // 5秒保存一次
    return () => clearTimeout(timer);
  }, [title, description, content, category, tags, coverImage, editId]);

  function saveLocalDraft() {
    if (!title.trim() && !content.trim()) return;
    const draft = { title, description, content, category, tags, coverImage, isPinned, savedAt: new Date().toISOString() };
    localStorage.setItem('blog-draft', JSON.stringify(draft));
  }

  function loadLocalDraft() {
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
  }

  function clearLocalDraft() {
    localStorage.removeItem('blog-draft');
  }

  async function loadCollections() {
    try {
      const data = await getCollections();
      setCollections(data);
    } catch (error) {
      console.error('加载集合失败:', error);
    }
  }

  async function loadPost(id: string) {
    try {
      setLoading(true);
      const post = await getPostById(id);
      if (post) {
        setTitle(post.title);
        setDescription(post.description);
        setContent(post.content);
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
  }

  // 显示通知
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 自动保存草稿
  useEffect(() => {
    if (!title && !content) return;
    
    const timer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        autoSaveDraft();
      }
    }, 30000); // 30秒自动保存
    
    return () => clearTimeout(timer);
  }, [title, content]);

  // 自动保存草稿函数
  async function autoSaveDraft() {
    if (!title.trim() && !content.trim()) return;
    
    try {
      const resolvedPinnedAt = isPinned ? (pinnedAt || new Date().toISOString()) : null;
      if (isPinned && !pinnedAt) {
        setPinnedAt(resolvedPinnedAt);
      }

      const postData = {
        title: title || '未命名草稿',
        slug: currentPostId ? undefined : generateSlug(title || '未命名草稿'),
        description,
        content,
        category,
        tags,
        image: coverImage,
        cover_image: coverImage,
        author: '拾光',
        reading_time: estimateReadingTime(content),
        status: 'draft' as const,
        meta_title: metaTitle,
        meta_description: metaDescription,
        is_pinned: isPinned,
        pinned_at: resolvedPinnedAt,
        collection_id: collectionId || undefined,
      };

      if (currentPostId) {
        await updatePost(currentPostId, postData);
      } else {
        const newPost = await createPost(postData);
        setCurrentPostId(newPost.id);
      }
      
      setLastSaved(new Date());
      console.log('草稿已自动保存');
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  // 创建新集合
  async function handleCreateCollection() {
    if (!newCollectionName.trim()) return;
    
    setCreatingCollection(true);
    try {
      const newCollection = await createCollection({
        name: newCollectionName.trim(),
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // 随机颜色
      });
      setCollections([...collections, newCollection]);
      setCollectionId(newCollection.id);
      setShowNewCollection(false);
      setNewCollectionName('');
      showNotification('success', `集合「${newCollection.name}」创建成功`);
    } catch (error) {
      console.error('创建集合失败:', error);
      showNotification('error', '创建集合失败');
    } finally {
      setCreatingCollection(false);
    }
  }

  // 生成 slug
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      + '-' + Date.now().toString(36);
  }

  // 估算阅读时间
  function estimateReadingTime(text: string): string {
    const wordsPerMinute = 300;
    const words = text.length;
    const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
    return `${minutes} min read`;
  }

  // 手动保存草稿
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      showNotification('error', '请输入文章标题');
      return;
    }

    setIsSaving(true);
    try {
      const resolvedPinnedAt = isPinned ? (pinnedAt || new Date().toISOString()) : null;
      if (isPinned && !pinnedAt) {
        setPinnedAt(resolvedPinnedAt);
      }

      const postData = {
        title,
        slug: currentPostId ? undefined : generateSlug(title),
        description,
        content,
        category,
        tags,
        image: coverImage,
        cover_image: coverImage,
        author: '拾光',
        reading_time: estimateReadingTime(content),
        status: 'draft' as const,
        meta_title: metaTitle,
        meta_description: metaDescription,
        is_pinned: isPinned,
        pinned_at: resolvedPinnedAt,
        collection_id: collectionId || undefined,
      };

      let savedPost;
      if (currentPostId) {
        savedPost = await updatePost(currentPostId, postData);
      } else {
        savedPost = await createPost(postData);
        setCurrentPostId(savedPost.id);
      }

      if (savedPost && (isPinned || pinnedAt)) {
        try {
          const pinnedPost = await setPostPinStatus(savedPost.id, isPinned);
          setPinnedAt(pinnedPost.pinned_at || null);
        } catch (pinError) {
          console.error('同步置顶状态失败:', pinError);
          showNotification('error', '置顶状态保存失败，请先执行数据库迁移');
        }
      }
      
      setLastSaved(new Date());
      showNotification('success', '草稿已保存');
    } catch (error) {
      console.error('保存失败:', error);
      showNotification('error', '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 发布文章
  const handlePublish = async () => {
    if (!title.trim()) {
      showNotification('error', '请输入文章标题');
      return;
    }
    if (!content.trim()) {
      showNotification('error', '请输入文章内容');
      return;
    }

    setIsPublishing(true);
    try {
      const slug = currentPostId ? undefined : generateSlug(title);
      const resolvedPinnedAt = isPinned ? (pinnedAt || new Date().toISOString()) : null;
      if (isPinned && !pinnedAt) {
        setPinnedAt(resolvedPinnedAt);
      }

      const postData = {
        title,
        slug,
        description,
        content,
        category,
        tags,
        image: coverImage,
        cover_image: coverImage,
        author: '拾光',
        reading_time: estimateReadingTime(content),
        status: 'published' as const,
        meta_title: metaTitle,
        meta_description: metaDescription,
        is_pinned: isPinned,
        pinned_at: resolvedPinnedAt,
        published_at: new Date().toISOString(),
        collection_id: collectionId || undefined,
      };

      let savedPost;
      if (currentPostId) {
        savedPost = await updatePost(currentPostId, postData);
      } else {
        savedPost = await createPost(postData);
      }

      if (savedPost && (isPinned || pinnedAt)) {
        try {
          const pinnedPost = await setPostPinStatus(savedPost.id, isPinned);
          setPinnedAt(pinnedPost.pinned_at || null);
        } catch (pinError) {
          console.error('同步置顶状态失败:', pinError);
          showNotification('error', '置顶状态保存失败，请先执行数据库迁移');
        }
      }
      
      showNotification('success', '文章已发布');
      clearLocalDraft();

      // 发送订阅者通知
      if (notifySubscribers && savedPost) {
        try {
          const adminToken = localStorage.getItem('admin-token');
          const password = adminToken ? atob(adminToken) : '';
          const res = await fetch('/api/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${password}`,
            },
            body: JSON.stringify({
              postId: savedPost.id,
              postSlug: savedPost.slug,
              title: savedPost.title,
              description: savedPost.description,
              author: savedPost.author,
            }),
          });
          const data = await res.json();
          if (res.ok && data.successful > 0) {
            showNotification('success', `已通知 ${data.successful} 位订阅者`);
          }
        } catch (notifyError) {
          console.error('发送通知失败:', notifyError);
        }
      }

      setTimeout(() => router.push('/blog'), 1500);
    } catch (error) {
      console.error('发布失败:', error);
      showNotification('error', '发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // 获取当前分类
  const currentCategory = categories.find(c => c.value === category);

  // 非管理员显示登录提示
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">需要管理员权限</h1>
          <p className="text-muted-foreground mb-6">只有管理员可以发布文章，请先登录</p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => showLoginModal(() => {
              // 登录成功后刷新页面以显示写作界面
              window.location.reload();
            })}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25 mb-4"
          >
            管理员登录
          </motion.button>
          <p className="text-sm text-muted-foreground mb-4">登录后将自动跳转到写作页面</p>
          <Link href="/blog" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
            返回博客
          </Link>
        </motion.div>
      </div>
    );
  }

  // 移动端使用专用编辑器
  if (isMobile) {
    return <MobileWritePage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/blog">
              <motion.button
                whileHover={{ scale: 1.05, x: -3 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h1 className="font-semibold">{editId ? '编辑文章' : '写文章'}</h1>
              </div>
              {lastSaved && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  上次保存: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 保存状态指示 */}
            <AnimatePresence>
              {isSaving && (
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-sm text-muted-foreground flex items-center gap-1"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </motion.span>
              )}
            </AnimatePresence>

            {/* 预览字数 */}
            <span className="hidden md:flex items-center gap-1 text-sm text-muted-foreground px-3 py-1 bg-secondary rounded-lg">
              <BookOpen className="w-4 h-4" />
              {content.length} 字
            </span>

            {/* 设置按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl hover:bg-secondary transition-colors relative"
              title="文章设置"
            >
              <Settings className="w-5 h-5" />
              {coverImage && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </motion.button>

            {/* 保存草稿 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-secondary transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">保存草稿</span>
            </motion.button>

            {/* 发布 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePublish}
              disabled={isPublishing}
              className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">发布</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* 封面图片预览 */}
          {coverImage && (
            <div className="relative mb-6 rounded-2xl overflow-hidden aspect-[21/9]">
              <img src={coverImage} alt="封面" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button
                onClick={() => setCoverImage('')}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入一个吸引人的标题..."
            className="w-full text-3xl sm:text-4xl md:text-5xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/40 leading-tight"
          />
        </motion.div>

        {/* 描述 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="写一段简短的描述，让读者了解这篇文章的主题..."
            rows={2}
            className="w-full text-lg text-muted-foreground bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/40 resize-none leading-relaxed"
          />
        </motion.div>

        {/* 元信息栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-border"
        >
          {/* 分类选择 */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
              <span>{currentCategory?.icon}</span>
              <span className="text-sm font-medium">{currentCategory?.label}</span>
            </button>
            <div className="absolute top-full left-0 mt-2 p-2 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === cat.value ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* 标签 */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {tags.map(tag => (
              <motion.span
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
            {tags.length < 5 && (
              <div className="relative">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  onBlur={addTag}
                  placeholder="添加标签..."
                  className="bg-transparent text-sm focus:outline-none w-24 placeholder:text-muted-foreground/50"
                />
              </div>
            )}
          </div>

          {/* 快速添加封面 */}
          {!coverImage && (
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">添加封面</span>
            </button>
          )}
        </motion.div>

        {/* 富文本编辑器 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RichEditor
            value={content}
            onChange={setContent}
            onSave={handleSaveDraft}
            placeholder="开始写作...

Markdown 语法支持：
- **粗体** 或 __粗体__
- *斜体* 或 _斜体_
- # 标题
- [链接](url)
- ![图片](url)
- \`代码\`
- > 引用
- - 列表

快捷键：
- Ctrl/Cmd + B：粗体
- Ctrl/Cmd + I：斜体
- Ctrl/Cmd + K：链接
- Ctrl/Cmd + S：保存
- 可以直接粘贴或拖拽图片"
          />
        </motion.div>
      </main>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    文章设置
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* 封面图片 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-3">封面图片</label>
                  <ImageUploader
                    onUpload={(url) => setCoverImage(url)}
                    folder="covers"
                    aspectRatio="video"
                    placeholder="点击上传或拖拽图片"
                    preview={coverImage}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    建议尺寸：1200 x 630 像素，比例 1.91:1
                  </p>
                </div>

                {/* 文章集合 */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    文章集合
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    将相关文章归类到同一个集合（系列/专题）
                  </p>
                  
                  <div className="space-y-2">
                    {/* 无集合选项 */}
                    <button
                      onClick={() => setCollectionId(null)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        !collectionId 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Folder className="w-4 h-4" />
                      <span className="text-sm">不归入集合</span>
                      {!collectionId && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                    
                    {/* 已有集合 */}
                    {collections.map(col => (
                      <button
                        key={col.id}
                        onClick={() => setCollectionId(col.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                          collectionId === col.id 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: col.color || '#6366f1' }}
                        />
                        <div className="flex-1 text-left">
                          <span className="text-sm font-medium">{col.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {col.post_count} 篇文章
                          </span>
                        </div>
                        {collectionId === col.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                    
                    {/* 新建集合 */}
                    {showNewCollection ? (
                      <div className="flex items-center gap-2 p-2 rounded-xl border border-border bg-secondary/30">
                        <input
                          type="text"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          placeholder="集合名称..."
                          className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCollectionName.trim()) {
                              handleCreateCollection();
                            }
                            if (e.key === 'Escape') {
                              setShowNewCollection(false);
                              setNewCollectionName('');
                            }
                          }}
                        />
                        <button
                          onClick={handleCreateCollection}
                          disabled={!newCollectionName.trim() || creatingCollection}
                          className="p-2 rounded-lg bg-primary text-white disabled:opacity-50"
                        >
                          {creatingCollection ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowNewCollection(false);
                            setNewCollectionName('');
                          }}
                          className="p-2 rounded-lg hover:bg-secondary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewCollection(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">新建集合</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* SEO 设置 */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    SEO 设置
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        Meta 标题
                      </label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder={title || '文章标题'}
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(metaTitle || title || '').length}/60 字符
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2">
                        Meta 描述
                      </label>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder={description || '文章描述...'}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {(metaDescription || description || '').length}/160 字符
                      </p>
                    </div>
                  </div>
                </div>

                {/* 搜索引擎预览 */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium mb-4">搜索引擎预览</h3>
                  <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-border">
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium truncate hover:underline cursor-pointer">
                      {metaTitle || title || '文章标题'}
                    </p>
                    <p className="text-green-700 dark:text-green-500 text-xs mt-1 truncate">
                      yourblog.com/blog/{(title || 'article').toLowerCase().replace(/\s+/g, '-').substring(0, 30)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {metaDescription || description || '文章描述将显示在搜索结果中，帮助读者了解文章内容...'}
                    </p>
                  </div>
                </div>

                {/* 发布设置 */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    发布设置
                  </h3>

                  <label className="mb-3 flex items-center justify-between p-4 rounded-xl bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Pin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">置顶到首页 Hero 封面</p>
                        <p className="text-xs text-muted-foreground">自动优先展示最新置顶文章的封面</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${
                      isPinned ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => {
                          const nextPinned = e.target.checked;
                          setIsPinned(nextPinned);
                          if (nextPinned && !pinnedAt) {
                            setPinnedAt(new Date().toISOString());
                          }
                          if (!nextPinned) {
                            setPinnedAt(null);
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        isPinned ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                  
                  <label className="flex items-center justify-between p-4 rounded-xl bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">通知订阅者</p>
                        <p className="text-xs text-muted-foreground">发布后自动发送邮件通知</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${
                      notifySubscribers ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <input
                        type="checkbox"
                        checked={notifySubscribers}
                        onChange={(e) => setNotifySubscribers(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        notifySubscribers ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </div>
                  </label>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 sticky bottom-0 py-4 bg-background">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowSettings(false);
                      handleSaveDraft();
                    }}
                    className="flex-1 btn-primary py-3"
                  >
                    保存设置
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 通知 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
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
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <WritePageContent />
    </Suspense>
  );
}
