'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, ExternalLink, Star, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';

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

const defaultCategories = ['技术博客', '生活记录', '设计创意', '其他'];

export default function LinksPage() {
  const { isAdmin } = useAdmin();
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    avatar: '',
    category: '技术博客',
    is_featured: false,
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data } = await supabase
        .from('friend_links')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (data) {
        setLinks(data);
      }
    } catch (error) {
      console.error('Failed to fetch links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingLink) {
        const { error } = await supabase
          .from('friend_links')
          .update(formData)
          .eq('id', editingLink.id);

        if (!error) {
          setLinks((prev) =>
            prev.map((link) =>
              link.id === editingLink.id ? { ...link, ...formData } : link
            )
          );
        }
      } else {
        const { data, error } = await supabase
          .from('friend_links')
          .insert([formData])
          .select()
          .single();

        if (data) {
          setLinks((prev) => [data, ...prev]);
        }
      }

      setShowAddModal(false);
      setEditingLink(null);
      setFormData({
        name: '',
        url: '',
        description: '',
        avatar: '',
        category: '技术博客',
        is_featured: false,
      });
    } catch (error) {
      console.error('Failed to save link:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个链接吗？')) return;

    try {
      const { error } = await supabase.from('friend_links').delete().eq('id', id);

      if (!error) {
        setLinks((prev) => prev.filter((link) => link.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const openEditModal = (link: FriendLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      url: link.url,
      description: link.description || '',
      avatar: link.avatar || '',
      category: link.category || '技术博客',
      is_featured: link.is_featured || false,
    });
    setShowAddModal(true);
  };

  // 按分类分组
  const groupedLinks = links.reduce((acc, link) => {
    const category = link.category || '其他';
    if (!acc[category]) acc[category] = [];
    acc[category].push(link);
    return acc;
  }, {} as Record<string, FriendLink[]>);

  const featuredLinks = links.filter((link) => link.is_featured);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <LinkIcon className="w-4 h-4" />
            <span className="text-sm font-medium">友情链接</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">朋友们</h1>
          <p className="text-muted-foreground">
            一些有趣的朋友和他们的网站
          </p>
        </motion.div>

        {/* 管理员添加按钮 */}
        {isAdmin && (
          <div className="flex justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" />
              添加链接
            </motion.button>
          </div>
        )}

        {/* 精选链接 */}
        {featuredLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="flex items-center gap-2 text-xl font-semibold mb-6">
              <Star className="w-5 h-5 text-yellow-500" />
              精选推荐
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredLinks.map((link, index) => (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all"
                >
                  <div className="absolute top-3 right-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    {link.avatar ? (
                      <Image
                        src={link.avatar}
                        alt={link.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {link.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {link.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  {link.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {link.description}
                    </p>
                  )}
                  
                  {isAdmin && (
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(link);
                        }}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-blue-500"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(link.id);
                        }}
                        className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}

        {/* 分类链接 */}
        {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h2 className="text-xl font-semibold mb-6">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryLinks.filter((l) => !l.is_featured).map((link, index) => (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
                >
                  {link.avatar ? (
                    <Image
                      src={link.avatar}
                      alt={link.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium flex-shrink-0">
                      {link.name[0]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                      {link.name}
                    </h3>
                    {link.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {link.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  
                  {isAdmin && (
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openEditModal(link);
                        }}
                        className="p-1 rounded bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(link.id);
                        }}
                        className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        ))}

        {links.length === 0 && (
          <div className="text-center py-20">
            <LinkIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">暂无友情链接</p>
          </div>
        )}

        {/* 添加/编辑弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">
                  {editingLink ? '编辑链接' : '添加链接'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLink(null);
                  }}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">网址 *</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                    placeholder="https://"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">头像URL</label>
                  <input
                    type="url"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary outline-none"
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="is_featured" className="text-sm">精选推荐</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingLink(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    {editingLink ? '保存' : '添加'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
