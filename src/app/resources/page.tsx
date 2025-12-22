'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Upload, File, Image, Video, FileText, Package, Music,
  Download, Trash2, Eye, EyeOff, Search, Grid, List, X,
  Copy, Check, Shield, HardDrive, Loader2
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';

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

const categoryConfig: Record<string, { icon: typeof File; color: string; bg: string; name: string }> = {
  image: { icon: Image, name: '图片', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  video: { icon: Video, name: '视频', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  document: { icon: FileText, name: '文档', color: 'text-green-500', bg: 'bg-green-500/10' },
  software: { icon: Package, name: '软件', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  audio: { icon: Music, name: '音频', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  other: { icon: File, name: '其他', color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 上传表单
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadPublic, setUploadPublic] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [selectedCategory, searchQuery]);

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
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      formData.append('description', uploadDesc);
      formData.append('tags', uploadTags);
      formData.append('isPublic', String(uploadPublic));
      formData.append('adminPassword', getAdminPassword());
      
      const res = await fetch('/api/resources', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowUploadModal(false);
        resetUploadForm();
        fetchResources();
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败');
    } finally {
      setUploading(false);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
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
              {Object.entries(categoryConfig).map(([key, { name }]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
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
              const config = categoryConfig[resource.category] || categoryConfig.other;
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
                    <a
                      href={resource.file_url}
                      download={resource.original_name}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      下载
                    </a>
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
              const config = categoryConfig[resource.category] || categoryConfig.other;
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
                    <a
                      href={resource.file_url}
                      download={resource.original_name}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
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
                        <p className="text-xs text-muted-foreground mt-1">支持图片、视频、文档、压缩包等 (最大100MB)</p>
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
                        上传中...
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
      </div>
    </div>
  );
}
