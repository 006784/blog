'use client';

import { useState, useEffect, useRef, useCallback, type DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Upload, File, Image, Video, FileText, Package, Music,
  Download, Trash2, Eye, EyeOff, Search, Grid, List, X,
  Copy, Check, Shield, HardDrive, Loader2, Settings, Plus, Edit2,
  AlertCircle, CheckCircle2,
  Folder, Archive, Code, Database, Book, Link, Star
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';
import { Turnstile } from '@/components/Turnstile';
import {
  APPLE_EASE_SOFT,
  APPLE_SPRING_GENTLE,
  HOVER_BUTTON,
  HOVER_LIFT,
  TAP_BUTTON,
  modalBackdropVariants,
  modalPanelVariants,
} from '@/components/Animations';

interface Resource {
  id: string;
  name: string;
  original_name: string;
  description?: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  extension: string;
  is_public: boolean;
  download_count: number;
  tags: string[];
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  is_system: boolean;
}

interface ResourceNotice {
  type: 'success' | 'error' | 'info';
  message: string;
}

// 图标映射
const iconMap: Record<string, typeof File> = {
  image: Image, video: Video, 'file-text': FileText, package: Package,
  music: Music, file: File, folder: Folder, archive: Archive,
  code: Code, database: Database, book: Book, link: Link, star: Star,
};

// 颜色映射
const colorMap: Record<string, { color: string; bg: string }> = {
  blue: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
  purple: { color: 'text-purple-500', bg: 'bg-purple-500/10' },
  green: { color: 'text-green-500', bg: 'bg-green-500/10' },
  orange: { color: 'text-orange-500', bg: 'bg-orange-500/10' },
  pink: { color: 'text-pink-500', bg: 'bg-pink-500/10' },
  red: { color: 'text-red-500', bg: 'bg-red-500/10' },
  yellow: { color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  cyan: { color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  gray: { color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

// 获取分类配置
function getCategoryConfig(category: Category | undefined) {
  if (!category) return { icon: File, color: 'text-gray-500', bg: 'bg-gray-500/10', name: '未分类' };
  const icon = iconMap[category.icon] || File;
  const colors = colorMap[category.color] || colorMap.gray;
  return { icon, ...colors, name: category.name };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// 获取管理员密码（从localStorage中的token解码）
function getAdminPassword(): string {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('admin-token');
  if (!token) return '';
  try {
    return atob(token);
  } catch {
    return '';
  }
}

export default function ResourcesPage() {
  const { isAdmin } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState<ResourceNotice | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 下载验证
  const [downloadModal, setDownloadModal] = useState<Resource | null>(null);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [downloadVerified, setDownloadVerified] = useState(false);
  
  // 上传表单
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadPublic, setUploadPublic] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  
  // 分类管理表单
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('folder');
  const [newCatColor, setNewCatColor] = useState('gray');
  const [savingCategory, setSavingCategory] = useState(false);

  // 下载进度
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const pushNotice = useCallback((type: ResourceNotice['type'], message: string) => {
    setNotice({ type, message });
  }, []);
  
  // Turnstile 回调
  const handleDownloadVerify = useCallback((token: string) => {
    setDownloadToken(token);
    setDownloadVerified(true);
  }, []);

  const handleDownloadError = useCallback(() => {
    setDownloadToken(null);
    setDownloadVerified(false);
  }, []);

  // 点击下载按钮
  const handleDownloadClick = (resource: Resource) => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    // 如果没配置 Turnstile，直接下载
    if (!siteKey) {
      window.open(resource.file_url, '_blank');
      pushNotice('success', `已开始下载：${resource.name}`);
      return;
    }
    // 显示验证模态框
    setDownloadModal(resource);
    setDownloadToken(null);
    setDownloadVerified(false);
  };

  // 确认下载
  const confirmDownload = async () => {
    if (downloadModal && downloadVerified) {
      // 显示下载进度
      setDownloadProgress(0);
      
      try {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = downloadModal.file_url;
        link.download = downloadModal.original_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 关闭模态框
        setDownloadModal(null);
        setDownloadToken(null);
        setDownloadVerified(false);
        setDownloadProgress(null);
        pushNotice('success', `已开始下载：${downloadModal.name}`);
      } catch (error) {
        console.error('Download failed:', error);
        setDownloadProgress(null);
        pushNotice('error', '下载失败，请稍后重试。');
      }
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      pushNotice('error', '分类加载失败，请稍后重试。');
    }
  }, [pushNotice]);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (searchQuery) params.set('search', searchQuery);
      
      const res = await fetch(`/api/resources?${params}`);
      const data = await res.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      pushNotice('error', '资源加载失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, pushNotice]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const hasModalOpen = Boolean(downloadModal || showUploadModal || showCategoryModal);
  useEffect(() => {
    if (!hasModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasModalOpen]);

  useEffect(() => {
    if (!hasModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();

      if (showCategoryModal) {
        setShowCategoryModal(false);
        resetCategoryForm();
        return;
      }

      if (showUploadModal) {
        setShowUploadModal(false);
        return;
      }

      if (downloadModal) {
        setDownloadModal(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasModalOpen, showCategoryModal, showUploadModal, downloadModal]);

  const handleUpload = async () => {
    if (!uploadFile || !isAdmin) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const adminPassword = getAdminPassword();
      
      // 步骤1: 获取预签名URL
      const presignRes = await fetch('/api/resources/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile.name,
          fileType: uploadFile.type || 'application/octet-stream',
          fileSize: uploadFile.size,
          adminPassword,
        }),
      });
      
      const presignData = await presignRes.json();
      
      if (!presignData.success) {
        pushNotice('error', presignData.error || '获取上传链接失败');
        return;
      }
      
      // 步骤2: 直接上传到R2
      setUploadProgress(10);
      
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: {
          'Content-Type': uploadFile.type || 'application/octet-stream',
        },
      });
      
      if (!uploadRes.ok) {
        throw new Error('文件上传失败');
      }
      
      setUploadProgress(80);
      
      // 步骤3: 保存资源信息到数据库
      const saveRes = await fetch('/api/resources/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword,
          name: uploadName || uploadFile.name.replace(/\.[^/.]+$/, ''),
          originalName: uploadFile.name,
          description: uploadDesc,
          fileUrl: presignData.publicUrl,
          fileSize: uploadFile.size,
          fileType: uploadFile.type || 'application/octet-stream',
          category: uploadCategory || presignData.category,
          isPublic: uploadPublic,
          tags: uploadTags,
        }),
      });
      
      const saveData = await saveRes.json();
      
      if (saveData.success) {
        setUploadProgress(100);
        setShowUploadModal(false);
        setIsDropActive(false);
        resetUploadForm();
        void fetchResources();
        pushNotice('success', '资源上传成功。');
      } else {
        pushNotice('error', saveData.error || '保存失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      pushNotice('error', '上传失败，请稍后重试。');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个资源吗？此操作不可恢复！')) return;
    
    try {
      const res = await fetch('/api/resources', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, adminPassword: getAdminPassword() }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResources(prev => prev.filter(r => r.id !== id));
        pushNotice('success', '资源已删除。');
      } else {
        pushNotice('error', data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      pushNotice('error', '删除失败，请稍后重试。');
    }
  };

  const copyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      pushNotice('info', '资源链接已复制。');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Copy link failed:', error);
      pushNotice('error', '复制链接失败。');
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadDesc('');
    setUploadTags('');
    setUploadPublic(false);
    setUploadCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pickUploadFile = useCallback((file: File | null) => {
    if (!file) return;
    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    pushNotice('info', `已选择文件：${file.name}`);
  }, [pushNotice]);

  const handleDropUploadFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropActive(false);

    const file = event.dataTransfer.files?.[0] || null;
    pickUploadFile(file);
  };

  // 分类管理函数
  const resetCategoryForm = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setNewCatIcon('folder');
    setNewCatColor('gray');
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatSlug(cat.slug);
    setNewCatDesc(cat.description || '');
    setNewCatIcon(cat.icon);
    setNewCatColor(cat.color);
  };

  const handleSaveCategory = async () => {
    if (!newCatName || !newCatSlug) {
      pushNotice('error', '请填写分类名称和标识符。');
      return;
    }
    
    setSavingCategory(true);
    try {
      const url = '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = {
        adminPassword: getAdminPassword(),
        ...(editingCategory && { id: editingCategory.id }),
        name: newCatName,
        slug: newCatSlug,
        description: newCatDesc,
        icon: newCatIcon,
        color: newCatColor,
      };
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (data.success) {
        void fetchCategories();
        resetCategoryForm();
        pushNotice('success', editingCategory ? '分类已更新。' : '分类已创建。');
      } else {
        pushNotice('error', data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save category error:', error);
      pushNotice('error', '保存失败，请稍后重试。');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return;
    
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, adminPassword: getAdminPassword() }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        void fetchCategories();
        pushNotice('success', '分类已删除。');
      } else {
        pushNotice('error', data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      pushNotice('error', '删除失败，请稍后重试。');
    }
  };

  // 获取资源的分类配置
  const getResourceCategoryConfig = (slug: string) => {
    const category = categories.find(c => c.slug === slug);
    return getCategoryConfig(category);
  };

  const stats = {
    total: resources.length,
    public: resources.filter(r => r.is_public).length,
    totalSize: resources.reduce((acc, r) => acc + r.file_size, 0),
    totalDownloads: resources.reduce((acc, r) => acc + r.download_count, 0),
  };

  return (
    <div className="min-h-screen py-20 pb-14">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: APPLE_EASE_SOFT }}
            className={`fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border px-4 py-2 text-sm shadow-lg backdrop-blur-xl ${
              notice.type === 'success'
                ? 'border-emerald-400/35 bg-emerald-600/92 text-white'
                : notice.type === 'error'
                  ? 'border-rose-400/35 bg-rose-600/92 text-white'
                  : 'border-sky-400/35 bg-sky-600/92 text-white'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : notice.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>{notice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62, ease: APPLE_EASE_SOFT }}
          className="mb-8"
        >
          <div className="surface-hero px-6 py-10 sm:px-10 sm:py-12 text-center">
            <div className="section-kicker mb-4">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm font-medium">资源中心</span>
            </div>
            <h1 className="apple-display mb-4">资源存储</h1>
            <p className="text-soft">安全可靠的文件存储服务</p>
          </div>
        </motion.div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="surface-card interactive-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <File className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-soft">总文件数</p>
              </div>
            </div>
          </div>
          <div className="surface-card interactive-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.public}</p>
                <p className="text-xs text-soft">公开资源</p>
              </div>
            </div>
          </div>
          <div className="surface-card interactive-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <HardDrive className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-soft">总存储</p>
              </div>
            </div>
          </div>
          <div className="surface-card interactive-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Download className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                <p className="text-xs text-soft">总下载</p>
              </div>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="surface-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 p-4">
          <div className="flex flex-1 items-center gap-3">
            {/* 搜索 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索资源..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern w-full pl-10 pr-4 py-2.5"
              />
            </div>
            
            {/* 分类筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-modern w-auto min-w-[140px] px-4 py-2.5"
            >
              <option value="all">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            
            {/* 分类管理按钮 */}
            {isAdmin && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="btn-secondary ios-button-press h-11 w-11 rounded-xl p-0"
                title="管理分类"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 视图切换 */}
            <div className="flex items-center rounded-xl border border-[var(--ui-line)] overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`ios-button-press p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-transparent text-soft hover:bg-black/5 dark:hover:bg-white/10'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`ios-button-press p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-transparent text-soft hover:bg-black/5 dark:hover:bg-white/10'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* 上传按钮 */}
            {isAdmin && (
              <motion.button
                whileHover={HOVER_BUTTON}
                whileTap={TAP_BUTTON}
                transition={APPLE_SPRING_GENTLE}
                onClick={() => {
                  setIsDropActive(false);
                  setShowUploadModal(true);
                }}
                className="btn-primary ios-button-press px-5 py-2.5"
              >
                <Upload className="w-4 h-4" />
                上传资源
              </motion.button>
            )}
          </div>
        </div>

        {/* 资源列表 */}
        {loading ? (
          <div className="surface-card flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : resources.length === 0 ? (
          <div className="surface-card text-center py-20">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">暂无资源</p>
            {isAdmin && (
              <button
                onClick={() => {
                  setIsDropActive(false);
                  setShowUploadModal(true);
                }}
                className="btn-primary mt-4 px-6 py-2"
              >
                上传第一个资源
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resources.map((resource, index) => {
              const config = getResourceCategoryConfig(resource.category);
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: index * 0.05, duration: 0.58, ease: APPLE_EASE_SOFT }}
                  whileHover={HOVER_LIFT}
                  whileTap={{ y: -2, scale: 0.994 }}
                  className="surface-card interactive-card ios-hover-surface group p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-3 rounded-xl ${config.bg}`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex items-center gap-1">
                      {resource.is_public ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-medium line-clamp-1 mb-1" title={resource.name}>
                    {resource.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                    {resource.original_name}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{formatFileSize(resource.file_size)}</span>
                    <span>·</span>
                    <span>{formatDate(resource.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownloadClick(resource)}
                      className="btn-secondary ios-button-press flex-1 rounded-lg py-2 text-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    {/* 高频资源预加载提示 */}
                    {resource.download_count > 10 && (
                      <div className="text-xs text-green-500 flex items-center gap-1" title="高频资源，已优化加载">
                        <Star className="w-3 h-3" />
                      </div>
                    )}
                    <button
                      onClick={() => copyLink(resource.file_url, resource.id)}
                      className="ios-button-press p-2 rounded-lg border border-[var(--ui-line)] hover:border-primary/40 transition-colors"
                    >
                      {copiedId === resource.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="ios-button-press p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((resource, index) => {
              const config = getResourceCategoryConfig(resource.category);
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  transition={{ delay: index * 0.03, duration: 0.54, ease: APPLE_EASE_SOFT }}
                  whileHover={{ x: 2, scale: 1.003 }}
                  whileTap={{ scale: 0.995 }}
                  className="surface-card interactive-card ios-hover-surface flex items-center gap-4 p-4"
                >
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{resource.name}</h3>
                      {resource.is_public ? (
                        <Eye className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{resource.original_name}</p>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="w-20 text-right">{formatFileSize(resource.file_size)}</span>
                    <span className="w-24">{formatDate(resource.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadClick(resource)}
                      className="ios-button-press p-2 rounded-lg border border-[var(--ui-line)] text-primary hover:border-primary/40 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {/* 高频资源预加载提示 */}
                    {resource.download_count > 10 && (
                      <div className="text-xs text-green-500 flex items-center gap-1" title="高频资源，已优化加载">
                        <Star className="w-3 h-3" />
                      </div>
                    )}
                    <button
                      onClick={() => copyLink(resource.file_url, resource.id)}
                      className="ios-button-press p-2 rounded-lg border border-[var(--ui-line)] hover:border-primary/40 transition-colors"
                    >
                      {copiedId === resource.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="ios-button-press p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 下载验证弹窗 */}
        <AnimatePresence>
          {downloadModal && (
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setDownloadModal(null)}
            >
              <motion.div
                variants={modalPanelVariants}
                className="surface-card ios-modal-card w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">下载资源</h3>
                      <p className="text-xs text-muted-foreground">请完成安全验证</p>
                    </div>
                  </div>
                  <button onClick={() => setDownloadModal(null)} className="ios-button-press p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-[var(--ui-line)] bg-secondary/30 mb-4">
                  <p className="font-medium truncate">{downloadModal.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(downloadModal.file_size)}</p>
                </div>

                {/* Turnstile 验证 */}
                <div className="py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Shield className="w-4 h-4" />
                    <span>请完成安全验证后下载</span>
                  </div>
                  <Turnstile
                    onVerify={handleDownloadVerify}
                    onError={handleDownloadError}
                    onExpire={handleDownloadError}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDownloadModal(null)}
                    className="btn-secondary ios-button-press flex-1 px-4 py-2.5 rounded-xl"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDownload}
                    disabled={!downloadVerified || downloadProgress !== null}
                    className="btn-primary ios-button-press flex-1 px-4 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {downloadProgress !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        下载中...
                      </>
                    ) : downloadVerified ? (
                      <>
                        <Check className="w-4 h-4" />
                        确认下载
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        等待验证
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 上传弹窗 */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowUploadModal(false);
                setIsDropActive(false);
              }}
            >
              <motion.div
                variants={modalPanelVariants}
                className="surface-card ios-modal-card w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">安全上传</h3>
                      <p className="text-xs text-muted-foreground">文件将经过安全检测</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setIsDropActive(false);
                    }}
                    className="ios-button-press p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 文件选择 */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDropActive(true);
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDropActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDropActive(false);
                    }}
                    onDrop={handleDropUploadFile}
                    className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                      isDropActive
                        ? 'border-primary bg-primary/10'
                        : 'border-[var(--ui-line)] bg-secondary/20 hover:border-primary/50'
                    }`}
                  >
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <File className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{uploadFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">{isDropActive ? '松开即可上传' : '点击或拖拽文件到这里'}</p>
                        <p className="text-xs text-muted-foreground mt-1">支持图片、视频、文档、安装包等 (最大500MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      pickUploadFile(e.target.files?.[0] || null);
                    }}
                    className="hidden"
                  />

                  {/* 资源名称 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">资源名称</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="为资源起个名字"
                      className="input-modern w-full px-4 py-2.5"
                    />
                  </div>

                  {/* 分类选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">资源分类</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="input-modern w-full px-4 py-2.5"
                    >
                      <option value="">自动检测</option>
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">描述</label>
                    <textarea
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      placeholder="简单描述一下这个资源"
                      rows={2}
                      className="input-modern w-full px-4 py-2.5 resize-none"
                    />
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">标签</label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="用逗号分隔多个标签"
                      className="input-modern w-full px-4 py-2.5"
                    />
                  </div>

                  {/* 公开选项 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadPublic}
                      onChange={(e) => setUploadPublic(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">设为公开资源（所有人可见）</span>
                  </label>

                  {/* 安全提示 */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 text-sm">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>文件将经过安全检测，禁止上传可执行文件、脚本等危险文件</p>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setIsDropActive(false);
                      resetUploadForm();
                    }}
                    className="btn-secondary ios-button-press flex-1 px-4 py-2.5 rounded-xl"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="btn-primary ios-button-press flex-1 px-4 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {uploadProgress > 0 ? `${uploadProgress}%` : '上传中...'}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        安全上传
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 分类管理弹窗 */}
        <AnimatePresence>
          {showCategoryModal && (
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
            >
              <motion.div
                variants={modalPanelVariants}
                onClick={(e) => e.stopPropagation()}
                className="surface-card ios-modal-card flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden"
              >
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--ui-line)]">
                  <h3 className="text-xl font-bold">分类管理</h3>
                  <button
                    onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
                    className="ios-button-press rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 内容 */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* 添加/编辑表单 */}
                  <div className="p-4 rounded-xl border border-[var(--ui-line)] bg-secondary/30 mb-6">
                    <h4 className="font-medium mb-4">
                      {editingCategory ? '编辑分类' : '添加新分类'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">分类名称</label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="例如：设计资源"
                          className="input-modern w-full px-3 py-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">标识符</label>
                        <input
                          type="text"
                          value={newCatSlug}
                          onChange={(e) => setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="例如：design"
                          disabled={editingCategory?.is_system}
                          className="input-modern w-full px-3 py-2 rounded-lg disabled:opacity-50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">描述</label>
                        <input
                          type="text"
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          placeholder="分类说明"
                          className="input-modern w-full px-3 py-2 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">图标</label>
                        <select
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="input-modern w-full px-3 py-2 rounded-lg"
                        >
                          {Object.keys(iconMap).map(icon => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">颜色</label>
                        <select
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="input-modern w-full px-3 py-2 rounded-lg"
                        >
                          {Object.keys(colorMap).map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {editingCategory && (
                        <button
                          onClick={resetCategoryForm}
                          className="btn-secondary ios-button-press rounded-lg px-4 py-2"
                        >
                          取消
                        </button>
                      )}
                      <button
                        onClick={handleSaveCategory}
                        disabled={savingCategory || !newCatName || !newCatSlug}
                        className="btn-primary ios-button-press flex items-center gap-2 rounded-lg px-4 py-2 disabled:opacity-50"
                      >
                        {savingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {editingCategory ? '保存' : '添加'}
                      </button>
                    </div>
                  </div>

                  {/* 分类列表 */}
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const config = getCategoryConfig(cat);
                      const Icon = config.icon;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-[var(--ui-line)] bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">{cat.slug} {cat.is_system && '(系统)'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCategory(cat)}
                              className="ios-button-press rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!cat.is_system && (
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="ios-button-press rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
