'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Upload, File, Image, Video, FileText, Package, Music,
  Download, Trash2, Eye, EyeOff, Search, Grid, List, X,
  Copy, Check, Shield, HardDrive, Loader2, Settings, Plus, Edit2,
  Folder, Archive, Code, Database, Book, Link, Star
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';
import { Turnstile } from '@/components/Turnstile';

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
      return;
    }
    // 显示验证模态框
    setDownloadModal(resource);
    setDownloadToken(null);
    setDownloadVerified(false);
  };

  // 确认下载
  const confirmDownload = () => {
    if (downloadModal && downloadVerified) {
      window.open(downloadModal.file_url, '_blank');
      setDownloadModal(null);
      setDownloadToken(null);
      setDownloadVerified(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  
  useEffect(() => {
    fetchResources();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchResources = async () => {
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
    } finally {
      setLoading(false);
    }
  };

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
        alert(presignData.error || '获取上传链接失败');
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
        resetUploadForm();
        fetchResources();
      } else {
        alert(saveData.error || '保存失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败');
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
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败');
    }
  };

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      alert('请填写分类名称和标识符');
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
        fetchCategories();
        resetCategoryForm();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save category error:', error);
      alert('保存失败');
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
        fetchCategories();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      alert('删除失败');
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
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">资源中心</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">资源存储</h1>
          <p className="text-muted-foreground">安全可靠的文件存储服务</p>
        </motion.div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <File className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">总文件数</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.public}</p>
                <p className="text-xs text-muted-foreground">公开资源</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <HardDrive className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                <p className="text-xs text-muted-foreground">总存储</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Download className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                <p className="text-xs text-muted-foreground">总下载</p>
              </div>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-1 items-center gap-3">
            {/* 搜索 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索资源..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
              />
            </div>
            
            {/* 分类筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
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
                className="p-2.5 rounded-xl bg-secondary/50 border border-border hover:border-primary transition-colors"
                title="管理分类"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 视图切换 */}
            <div className="flex items-center rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-secondary/50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-secondary/50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* 上传按钮 */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-medium shadow-lg shadow-primary/25"
              >
                <Upload className="w-4 h-4" />
                上传资源
              </motion.button>
            )}
          </div>
        </div>

        {/* 资源列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">暂无资源</p>
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 px-6 py-2 rounded-xl bg-primary text-white"
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
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
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </button>
                    <button
                      onClick={() => copyLink(resource.file_url, resource.id)}
                      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
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
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
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
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
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
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => copyLink(resource.file_url, resource.id)}
                      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
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
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setDownloadModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-6"
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
                  <button onClick={() => setDownloadModal(null)} className="p-2 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-secondary/30 mb-4">
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
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDownload}
                    disabled={!downloadVerified}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {downloadVerified ? (
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowUploadModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-card rounded-2xl shadow-2xl p-6"
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
                  <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 文件选择 */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
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
                        <p className="text-muted-foreground">点击选择文件</p>
                        <p className="text-xs text-muted-foreground mt-1">支持图片、视频、文档、安装包等 (最大500MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadFile(file);
                        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                      }
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
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                    />
                  </div>

                  {/* 分类选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">资源分类</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none resize-none"
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
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
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
                    onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[80vh] flex flex-col"
              >
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h3 className="text-xl font-bold">分类管理</h3>
                  <button
                    onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 内容 */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* 添加/编辑表单 */}
                  <div className="p-4 rounded-xl bg-secondary/30 mb-6">
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
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
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
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none disabled:opacity-50"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">描述</label>
                        <input
                          type="text"
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          placeholder="分类说明"
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">图标</label>
                        <select
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
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
                          className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
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
                          className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          取消
                        </button>
                      )}
                      <button
                        onClick={handleSaveCategory}
                        disabled={savingCategory || !newCatName || !newCatSlug}
                        className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
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
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
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
                              className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!cat.is_system && (
                              <button
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
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
