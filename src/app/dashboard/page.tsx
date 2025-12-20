'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, FileText, Send, Clock, Trash2, Edit3, Eye, 
  MoreVertical, Search, Filter, Calendar, Tag,
  LayoutDashboard, Files, FileEdit, Settings, ChevronDown,
  AlertCircle, Check, X
} from 'lucide-react';
import { 
  BlogPost, getAllPosts, deletePost, publishPost, unpublishPost,
  categories, getCategoryInfo 
} from '@/lib/blog-store';
import { formatDate } from '@/lib/types';
import { Floating } from '@/components/Animations';

type TabType = 'all' | 'published' | 'drafts';

export default function DashboardPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // 加载文章
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    const allPosts = getAllPosts();
    setPosts(allPosts);
  };

  // 显示通知
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // 过滤文章
  const filteredPosts = posts.filter(post => {
    // 标签页筛选
    if (activeTab === 'published' && post.status !== 'published') return false;
    if (activeTab === 'drafts' && post.status !== 'draft') return false;
    
    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!post.title.toLowerCase().includes(query) && 
          !post.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // 分类筛选
    if (selectedCategory && post.category !== selectedCategory) return false;
    
    return true;
  });

  // 统计数据
  const stats = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    drafts: posts.filter(p => p.status === 'draft').length,
  };

  // 删除文章
  const handleDelete = (id: string) => {
    deletePost(id);
    loadPosts();
    setShowDeleteModal(null);
    showNotification('success', '文章已删除');
  };

  // 发布/取消发布
  const handleTogglePublish = (post: BlogPost) => {
    if (post.status === 'published') {
      unpublishPost(post.id);
      showNotification('success', '文章已转为草稿');
    } else {
      publishPost(post.id);
      showNotification('success', '文章已发布');
    }
    loadPosts();
    setOpenMenuId(null);
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'all', label: '全部', icon: Files, count: stats.total },
    { id: 'published', label: '已发布', icon: Send, count: stats.published },
    { id: 'drafts', label: '草稿', icon: FileEdit, count: stats.drafts },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <Floating duration={15}>
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-[var(--bg-gradient-1)] to-[var(--bg-gradient-2)] rounded-full blur-3xl opacity-30" />
        </Floating>
        <Floating duration={18}>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-[var(--bg-gradient-3)] to-[var(--bg-gradient-4)] rounded-full blur-3xl opacity-30" />
        </Floating>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
                    <LayoutDashboard className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold hidden sm:block shimmer-text">文章管理</span>
                </motion.div>
              </Link>
            </div>

            <Link href="/write">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>写文章</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: '全部文章', value: stats.total, icon: FileText, color: 'from-blue-500 to-cyan-500' },
            { label: '已发布', value: stats.published, icon: Send, color: 'from-green-500 to-emerald-500' },
            { label: '草稿箱', value: stats.drafts, icon: Clock, color: 'from-amber-500 to-orange-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative overflow-hidden rounded-xl bg-card border border-border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
            </motion.div>
          ))}
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl">
            {tabs.map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-secondary'
                }`}>
                  {tab.count}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文章..."
                className="pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full sm:w-64"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="">全部分类</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无文章</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory ? '没有找到匹配的文章' : '开始写你的第一篇文章吧'}
                </p>
                <Link href="/write">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    写文章
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              filteredPosts.map((post, index) => {
                const categoryInfo = getCategoryInfo(post.category);
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative bg-card rounded-xl border border-border hover:border-primary/50 transition-all overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Cover Image */}
                      {post.image && (
                        <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Status & Category */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                post.status === 'published' 
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              }`}>
                                {post.status === 'published' ? '已发布' : '草稿'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full bg-secondary`}>
                                {categoryInfo.label}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold mb-2 truncate group-hover:text-primary transition-colors">
                              {post.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {post.description || '暂无描述'}
                            </p>

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(post.updatedAt || post.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.readingTime}
                              </span>
                              {post.tags.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {post.tags.slice(0, 2).join(', ')}
                                  {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="relative">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                              className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </motion.button>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                              {openMenuId === post.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl border border-border shadow-xl z-10 overflow-hidden"
                                >
                                  <Link
                                    href={`/write?edit=${post.id}`}
                                    className="flex items-center gap-2 px-4 py-3 hover:bg-secondary transition-colors"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    编辑
                                  </Link>
                                  {post.status === 'published' && (
                                    <Link
                                      href={`/blog/${post.slug}`}
                                      className="flex items-center gap-2 px-4 py-3 hover:bg-secondary transition-colors"
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Eye className="w-4 h-4" />
                                      查看
                                    </Link>
                                  )}
                                  <button
                                    onClick={() => handleTogglePublish(post)}
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary transition-colors"
                                  >
                                    {post.status === 'published' ? (
                                      <>
                                        <Clock className="w-4 h-4" />
                                        转为草稿
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        发布
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setShowDeleteModal(post.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-red-500 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    删除
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(null)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl z-50 p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">确认删除</h3>
                <p className="text-muted-foreground mb-6">
                  此操作不可撤销，文章将被永久删除。
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                  >
                    取消
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(showDeleteModal)}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    确认删除
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

      {/* Click outside to close menu */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
}
