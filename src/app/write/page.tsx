'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Send, Eye, Settings, X, Plus, 
  Image as ImageIcon, Tag, Folder, Clock, Check,
  AlertCircle, Loader2, Upload
} from 'lucide-react';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { ImageUploader } from '@/components/ImageUploader';
import { 
  BlogPost, savePost, getPostById, publishPost, categories 
} from '@/lib/blog-store';

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('tech');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // 加载编辑的文章
  useEffect(() => {
    if (editId) {
      const post = getPostById(editId);
      if (post) {
        setTitle(post.title);
        setDescription(post.description);
        setContent(post.content);
        setCategory(post.category);
        setTags(post.tags);
        setCoverImage(post.coverImage || post.image || '');
        setMetaTitle(post.metaTitle || '');
        setMetaDescription(post.metaDescription || '');
        setCurrentPostId(post.id);
      }
    }
  }, [editId]);

  // 显示通知
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 自动保存
  const autoSave = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;
    
    setIsSaving(true);
    try {
      const post = savePost({
        id: currentPostId || undefined,
        title: title || '未命名文章',
        description,
        content,
        category,
        tags,
        image: coverImage,
        coverImage,
        metaTitle,
        metaDescription,
        status: 'draft',
      });
      setCurrentPostId(post.id);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [title, description, content, category, tags, coverImage, metaTitle, metaDescription, currentPostId]);

  // 定时自动保存
  useEffect(() => {
    const timer = setInterval(() => {
      if (title.trim() || content.trim()) {
        autoSave();
      }
    }, 30000); // 每30秒自动保存

    return () => clearInterval(timer);
  }, [autoSave, title, content]);

  // 手动保存草稿
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const post = savePost({
        id: currentPostId || undefined,
        title: title || '未命名文章',
        description,
        content,
        category,
        tags,
        image: coverImage,
        coverImage,
        metaTitle,
        metaDescription,
        status: 'draft',
      });
      setCurrentPostId(post.id);
      setLastSaved(new Date());
      showNotification('success', '草稿已保存');
    } catch (error) {
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
      const post = savePost({
        id: currentPostId || undefined,
        title,
        description,
        content,
        category,
        tags,
        image: coverImage,
        coverImage,
        metaTitle,
        metaDescription,
        status: 'published',
      });
      showNotification('success', '文章已发布');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (error) {
      showNotification('error', '发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

  // 添加标签
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] rounded-full blur-3xl opacity-15" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-10" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05, x: -3 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <div className="hidden sm:block">
              <h1 className="font-semibold shimmer-text">{editId ? '编辑文章' : '写文章'}</h1>
              {lastSaved && (
                <p className="text-xs text-muted-foreground">
                  上次保存: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 保存状态指示 */}
            {isSaving && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </span>
            )}

            {/* 设置按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="文章设置"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* 保存草稿 */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">保存草稿</span>
            </motion.button>

            {/* 发布 */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePublish}
              disabled={isPublishing}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
          />
        </motion.div>

        {/* Description Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="文章简介（可选）..."
            rows={2}
            className="w-full text-lg text-muted-foreground bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50 resize-none"
          />
        </motion.div>

        {/* Quick Settings Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-border"
        >
          {/* Category */}
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-muted-foreground" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-full text-xs"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
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
                placeholder="添加标签..."
                className="bg-transparent text-sm focus:outline-none min-w-[80px]"
              />
            </div>
          </div>
        </motion.div>

        {/* Markdown Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border overflow-hidden bg-card"
        >
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="开始写作...&#10;&#10;支持 Markdown 语法"
          />
        </motion.div>
      </main>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold">文章设置</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-lg hover:bg-secondary"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Cover Image */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">封面图片</label>
                  <ImageUploader
                    onUpload={(url) => setCoverImage(url)}
                    folder="covers"
                    aspectRatio="video"
                    placeholder="点击或拖拽上传封面图片"
                    preview={coverImage}
                  />
                </div>

                {/* SEO Settings */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    SEO 设置
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Meta 标题
                      </label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder={title || '文章标题'}
                        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">
                        Meta 描述
                      </label>
                      <textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder={description || '文章描述...'}
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-4">搜索引擎预览</h3>
                  <div className="p-4 rounded-lg bg-secondary">
                    <p className="text-blue-600 dark:text-blue-400 text-sm truncate">
                      {metaTitle || title || '文章标题'}
                    </p>
                    <p className="text-green-700 dark:text-green-500 text-xs mt-1">
                      shiguang.blog/post/{title?.toLowerCase().replace(/\s+/g, '-') || 'article'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {metaDescription || description || '文章描述将显示在这里...'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
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
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors"
                  >
                    保存设置
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
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
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
