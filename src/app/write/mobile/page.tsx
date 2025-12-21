'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Send, Save, Settings, X, Check, 
  AlertCircle, Loader2, ChevronDown, Image, Shield
} from 'lucide-react';
import { MobileEditor } from '@/components/MobileEditor';
import { Post, createPost, updatePost, getPostById } from '@/lib/supabase';
import { uploadFile, compressImage } from '@/lib/storage';
import { useAdmin } from '@/components/AdminProvider';

const categories = [
  { value: 'tech', label: '技术', icon: '💻' },
  { value: 'design', label: '设计', icon: '🎨' },
  { value: 'life', label: '生活', icon: '☕' },
  { value: 'thoughts', label: '思考', icon: '💭' },
];

function MobileWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { isAdmin, showLoginModal } = useAdmin();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('life');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (editId) loadPost(editId);
  }, [editId]);

  async function loadPost(id: string) {
    try {
      setLoading(true);
      const post = await getPostById(id);
      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category);
        setCurrentPostId(post.id);
      }
    } catch (error) {
      showNotification('error', '加载失败');
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
      + '-' + Date.now().toString(36);
  }

  function estimateReadingTime(text: string): string {
    const minutes = Math.max(1, Math.ceil(text.length / 300));
    return `${minutes} min read`;
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showNotification('error', '请输入标题');
      return;
    }

    setIsSaving(true);
    try {
      const postData = {
        title,
        slug: currentPostId ? undefined : generateSlug(title),
        description: content.substring(0, 100),
        content,
        category,
        tags: [],
        author: '拾光',
        reading_time: estimateReadingTime(content),
        status: 'draft' as const,
      };

      if (currentPostId) {
        await updatePost(currentPostId, postData);
      } else {
        const newPost = await createPost(postData);
        setCurrentPostId(newPost.id);
      }
      showNotification('success', '已保存');
    } catch (error) {
      showNotification('error', '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      showNotification('error', '请输入标题');
      return;
    }
    if (!content.trim()) {
      showNotification('error', '请输入内容');
      return;
    }

    setIsPublishing(true);
    try {
      const postData = {
        title,
        slug: currentPostId ? undefined : generateSlug(title),
        description: content.substring(0, 100),
        content,
        category,
        tags: [],
        author: '拾光',
        reading_time: estimateReadingTime(content),
        status: 'published' as const,
        published_at: new Date().toISOString(),
      };

      if (currentPostId) {
        await updatePost(currentPostId, postData);
      } else {
        await createPost(postData);
      }
      
      showNotification('success', '发布成功');
      setTimeout(() => router.push('/blog'), 1000);
    } catch (error) {
      showNotification('error', '发布失败');
    } finally {
      setIsPublishing(false);
    }
  };

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
          <p className="text-muted-foreground mb-6">只有管理员可以发布文章</p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => showLoginModal()}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25"
          >
            管理员登录
          </motion.button>
          <Link href="/blog" className="block mt-4 text-sm text-muted-foreground hover:text-primary transition-colors">
            返回博客
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur safe-area-inset-top">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存'}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full flex items-center gap-1.5"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  发布
                </>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* 标题输入 */}
      <div className="px-4 py-3 border-b border-border">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="w-full text-xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50"
        />
        
        {/* 分类选择 */}
        <button
          onClick={() => setShowCategoryPicker(true)}
          className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <span>{currentCategory?.icon}</span>
          <span>{currentCategory?.label}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* 编辑器 */}
      <div className="flex-1 flex flex-col min-h-0">
        <MobileEditor
          value={content}
          onChange={setContent}
          placeholder="开始写作..."
        />
      </div>

      {/* 分类选择器 */}
      <AnimatePresence>
        {showCategoryPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryPicker(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 safe-area-inset-bottom"
            >
              <div className="p-4">
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-4">选择分类</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCategory(cat.value);
                        setShowCategoryPicker(false);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        category === cat.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <p className="mt-1 font-medium">{cat.label}</p>
                    </motion.button>
                  ))}
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
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 left-4 right-4 p-4 rounded-2xl shadow-lg flex items-center gap-3 z-50 ${
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

export default function MobileWritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <MobileWriteContent />
    </Suspense>
  );
}
