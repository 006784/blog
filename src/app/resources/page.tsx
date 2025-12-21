'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, Upload, File, Image, Video, FileText, Package, Music,
  Download, Trash2, Eye, EyeOff, Search, Filter, Grid, List, X,
  Copy, Check, Shield, AlertTriangle, HardDrive, Clock
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
  is_verified: boolean;
  created_at: string;
}

const categoryConfig = {
  image: { icon: Image, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  video: { icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  document: { icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
  software: { icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  audio: { icon: Music, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  other: { icon: File, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

export default function ResourcesPage() {
  const { isAdmin } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 上传表单状态
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadPublic, setUploadPublic] = useState(false);
  const [uploadTags, setUploadTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchResources();
  }, [selectedCategory]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      
      const res = await fetch(`/api/resources/upload?${params}`);
      const data = await res.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !isAdmin) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('name', uploadName || uploadFile.name);
      formData.append('description', uploadDesc);
      formData.append('is_public', uploadPublic.toString());
      formData.append('tags', uploadTags);

      const adminPassword = localStorage.getItem('admin_password') || '';
      
      const res = await fetch('/api/resources/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminPassword}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadName('');
        setUploadDesc('');
        setUploadPublic(false);
        setUploadTags('');
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

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm('确定删除此资源？')) return;
    
    // TODO: 实现删除API
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const copyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = resources.reduce((acc, r) => acc + r.file_size, 0);

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
          <p className="text-muted-foreground">安全存储和管理您的文件资源</p>
        </motion.div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <File className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resources.length}</p>
                <p className="text-xs text-muted-foreground">总文件数</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <HardDrive className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                <p className="text-xs text-muted-foreground">总存储</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Download className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {resources.reduce((acc, r) => acc + r.download_count, 0)}
                </p>
                <p className="text-xs text-muted-foreground">总下载</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Shield className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {resources.filter(r => r.is_verified).length}
                </p>
                <p className="text-xs text-muted-foreground">已验证</p>
              </div>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
            />
          </div>

          {/* 分类筛选 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
          >
            <option value="all">全部分类</option>
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="document">文档</option>
            <option value="software">软件</option>
            <option value="audio">音频</option>
          </select>

          {/* 视图切换 */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-background shadow' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow' : ''}`}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white"
            >
              <Upload className="w-4 h-4" />
              上传资源
            </motion.button>
          )}
        </div>

        {/* 资源列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">暂无资源</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredResources.map((resource, index) => {
              const config = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  {/* 图标 */}
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>

                  {/* 信息 */}
                  <h3 className="font-medium truncate mb-1">{resource.name}</h3>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {resource.original_name}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(resource.file_size)}</span>
                    <span>•</span>
                    <span className="uppercase">{resource.extension}</span>
                  </div>

                  {/* 状态标签 */}
                  <div className="flex items-center gap-2 mt-3">
                    {resource.is_public ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs">
                        <Eye className="w-3 h-3" /> 公开
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs">
                        <EyeOff className="w-3 h-3" /> 私有
                      </span>
                    )}
                    {resource.is_verified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs">
                        <Shield className="w-3 h-3" /> 安全
                      </span>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyLink(resource.file_url, resource.id)}
                      className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
                      title="复制链接"
                    >
                      {copiedId === resource.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={resource.file_url}
                      download
                      className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
                      title="下载"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(resource.id, resource.file_url)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500"
                        title="删除"
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
            {filteredResources.map((resource) => {
              const config = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{resource.name}</h3>
                    <p className="text-xs text-muted-foreground">{resource.original_name}</p>
                  </div>
                  <div className="text-sm text-muted-foreground hidden sm:block">
                    {formatFileSize(resource.file_size)}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(resource.file_url, resource.id)}
                      className="p-2 rounded-lg hover:bg-muted"
                    >
                      {copiedId === resource.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a href={resource.file_url} download className="p-2 rounded-lg hover:bg-muted">
                      <Download className="w-4 h-4" />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(resource.id, resource.file_url)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    上传资源
                  </h3>
                  <button onClick={() => setShowUploadModal(false)} className="p-2 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  {/* 文件选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">选择文件 *</label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-white"
                        required
                      />
                    </div>
                    {uploadFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">资源名称</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="留空使用原文件名"
                      className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">描述</label>
                    <textarea
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      placeholder="资源描述（可选）"
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">标签</label>
                    <input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="用逗号分隔，如：工具,设计,素材"
                      className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={uploadPublic}
                      onChange={(e) => setUploadPublic(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="is_public" className="text-sm">
                      公开资源（任何人可访问）
                    </label>
                  </div>

                  {/* 安全提示 */}
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">
                        上传的文件将经过安全检测。支持图片、视频、文档、压缩包等格式，最大100MB。
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={!uploadFile || uploading}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {uploading ? '上传中...' : '上传'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
