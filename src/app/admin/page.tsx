'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, FileText, Camera, BookOpen, Folder, 
  Plus, Edit2, Trash2, X, Loader2, Save,
  Eye, EyeOff, Calendar, Users, TrendingUp,
  Settings, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/AdminProvider';
import { 
  Post, Photo, Diary, Album,
  getAllPosts, getAllPhotos, getDiaries, getAlbums,
  deletePost, deletePhoto, deleteDiary,
  createAlbum, updateAlbum, deleteAlbum,
  formatDate
} from '@/lib/supabase';

type TabType = 'overview' | 'posts' | 'photos' | 'diary' | 'albums';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [posts, setPosts] = useState<Post[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const { isAdmin, showLoginModal } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      showLoginModal();
    } else {
      loadAllData();
    }
  }, [isAdmin]);

  async function loadAllData() {
    try {
      setLoading(true);
      const [postsData, photosData, diariesData, albumsData] = await Promise.all([
        getAllPosts(),
        getAllPhotos(),
        getDiaries(false),
        getAlbums()
      ]);
      setPosts(postsData);
      setPhotos(photosData);
      setDiaries(diariesData);
      setAlbums(albumsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(id: string) {
    if (!confirm('确定删除这篇文章吗？')) return;
    try {
      await deletePost(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  async function handleDeletePhoto(id: string) {
    if (!confirm('确定删除这张照片吗？')) return;
    try {
      await deletePhoto(id);
      setPhotos(photos.filter(p => p.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  async function handleDeleteDiary(id: string) {
    if (!confirm('确定删除这篇日记吗？')) return;
    try {
      await deleteDiary(id);
      setDiaries(diaries.filter(d => d.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  async function handleDeleteAlbum(id: string) {
    if (!confirm('确定删除这个相册吗？相册内的照片不会被删除。')) return;
    try {
      await deleteAlbum(id);
      setAlbums(albums.filter(a => a.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">需要管理员权限</p>
          <button onClick={showLoginModal} className="btn-primary">
            <Shield className="w-5 h-5" />
            管理员登录
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: '总览', icon: TrendingUp },
    { id: 'posts' as TabType, label: '文章', icon: FileText, count: posts.length },
    { id: 'photos' as TabType, label: '照片', icon: Camera, count: photos.length },
    { id: 'diary' as TabType, label: '日记', icon: BookOpen, count: diaries.length },
    { id: 'albums' as TabType, label: '相册', icon: Folder, count: albums.length },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-xl hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                管理后台
              </h1>
              <p className="text-sm text-muted-foreground">管理你的所有内容</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-8 bg-card/50 p-2 rounded-2xl"
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-muted'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab 
                posts={posts} 
                photos={photos} 
                diaries={diaries} 
                albums={albums}
              />
            )}
            {activeTab === 'posts' && (
              <PostsTab 
                posts={posts} 
                onDelete={handleDeletePost}
              />
            )}
            {activeTab === 'photos' && (
              <PhotosTab 
                photos={photos} 
                onDelete={handleDeletePhoto}
              />
            )}
            {activeTab === 'diary' && (
              <DiaryTab 
                diaries={diaries} 
                onDelete={handleDeleteDiary}
              />
            )}
            {activeTab === 'albums' && (
              <AlbumsTab 
                albums={albums} 
                onDelete={handleDeleteAlbum}
                onEdit={(album) => { setEditingAlbum(album); setShowAlbumModal(true); }}
                onAdd={() => { setEditingAlbum(null); setShowAlbumModal(true); }}
              />
            )}
          </AnimatePresence>
        )}

        {/* Album Modal */}
        <AnimatePresence>
          {showAlbumModal && (
            <AlbumModal
              album={editingAlbum}
              onClose={() => { setShowAlbumModal(false); setEditingAlbum(null); }}
              onSave={async (data) => {
                if (editingAlbum) {
                  const updated = await updateAlbum(editingAlbum.id, data);
                  setAlbums(albums.map(a => a.id === editingAlbum.id ? updated : a));
                } else {
                  const newAlbum = await createAlbum(data);
                  setAlbums([newAlbum, ...albums]);
                }
                setShowAlbumModal(false);
                setEditingAlbum(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ posts, photos, diaries, albums }: {
  posts: Post[];
  photos: Photo[];
  diaries: Diary[];
  albums: Album[];
}) {
  const stats = [
    { label: '文章', value: posts.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: '照片', value: photos.length, icon: Camera, color: 'from-purple-500 to-pink-500' },
    { label: '日记', value: diaries.length, icon: BookOpen, color: 'from-amber-500 to-orange-500' },
    { label: '相册', value: albums.length, icon: Folder, color: 'from-green-500 to-emerald-500' },
  ];

  const recentPosts = posts.slice(0, 5);
  const publicDiaries = diaries.filter(d => d.is_public).length;
  const privateDiaries = diaries.filter(d => !d.is_public).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-card p-6"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} />
            <stat.icon className="w-8 h-8 text-primary mb-3" />
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/write" className="group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
          >
            <FileText className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">写文章</h3>
            <p className="text-sm text-muted-foreground">创建新的博客文章</p>
          </motion.div>
        </Link>
        <Link href="/gallery" className="group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
          >
            <Camera className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">上传照片</h3>
            <p className="text-sm text-muted-foreground">添加新照片到相册</p>
          </motion.div>
        </Link>
        <Link href="/diary" className="group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
          >
            <BookOpen className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">写日记</h3>
            <p className="text-sm text-muted-foreground">记录今天的心情</p>
          </motion.div>
        </Link>
      </div>

      {/* Recent Posts */}
      <div className="bg-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          最近文章
        </h3>
        <div className="space-y-3">
          {recentPosts.map(post => (
            <div key={post.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{post.title}</h4>
                <p className="text-sm text-muted-foreground">{formatDate(post.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  post.status === 'published' ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/20 text-amber-600'
                }`}>
                  {post.status === 'published' ? '已发布' : '草稿'}
                </span>
                <Link href={`/write?edit=${post.id}`}>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diary Stats */}
      <div className="bg-card rounded-2xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          日记统计
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-3">
            <Eye className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-xl font-bold">{publicDiaries}</div>
              <div className="text-sm text-muted-foreground">公开日记</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-3">
            <EyeOff className="w-6 h-6 text-amber-500" />
            <div>
              <div className="text-xl font-bold">{privateDiaries}</div>
              <div className="text-sm text-muted-foreground">私密日记</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Posts Tab
function PostsTab({ posts, onDelete }: { posts: Post[]; onDelete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">所有文章</h2>
        <Link href="/write" className="btn-primary">
          <Plus className="w-4 h-4" />
          写文章
        </Link>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            还没有文章
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map(post => (
              <div key={post.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                {post.cover_image && (
                  <img src={post.cover_image} alt="" className="w-16 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatDate(post.created_at)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      post.status === 'published' ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/20 text-amber-600'
                    }`}>
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </span>
                    <span>{post.views} 阅读</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/blog/${post.slug}`}>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href={`/write?edit=${post.id}`}>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </Link>
                  <button 
                    onClick={() => onDelete(post.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Photos Tab
function PhotosTab({ photos, onDelete }: { photos: Photo[]; onDelete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">所有照片</h2>
        <Link href="/gallery" className="btn-primary">
          <Plus className="w-4 h-4" />
          上传照片
        </Link>
      </div>

      {photos.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground">
          还没有照片
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.map(photo => (
            <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
              <img src={photo.url} alt={photo.title || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => onDelete(photo.id)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {photo.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white text-xs truncate">{photo.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Diary Tab
function DiaryTab({ diaries, onDelete }: { diaries: Diary[]; onDelete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">所有日记</h2>
        <Link href="/diary" className="btn-primary">
          <Plus className="w-4 h-4" />
          写日记
        </Link>
      </div>

      <div className="bg-card rounded-2xl overflow-hidden">
        {diaries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            还没有日记
          </div>
        ) : (
          <div className="divide-y divide-border">
            {diaries.map(diary => (
              <div key={diary.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{diary.title || formatDate(diary.diary_date)}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatDate(diary.diary_date)}</span>
                    <span className={`flex items-center gap-1 ${diary.is_public ? 'text-green-600' : 'text-amber-600'}`}>
                      {diary.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {diary.is_public ? '公开' : '私密'}
                    </span>
                    <span>{diary.word_count} 字</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/diary">
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>
                  <button 
                    onClick={() => onDelete(diary.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Albums Tab
function AlbumsTab({ albums, onDelete, onEdit, onAdd }: { 
  albums: Album[]; 
  onDelete: (id: string) => void;
  onEdit: (album: Album) => void;
  onAdd: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">所有相册</h2>
        <button onClick={onAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          新建相册
        </button>
      </div>

      {albums.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center text-muted-foreground">
          还没有相册
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {albums.map(album => (
            <div key={album.id} className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all">
              {album.cover_image ? (
                <img src={album.cover_image} alt="" className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  <Folder className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{album.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{album.description || '暂无描述'}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{album.photo_count} 张照片</span>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(album)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(album.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Album Modal
function AlbumModal({ album, onClose, onSave }: {
  album: Album | null;
  onClose: () => void;
  onSave: (data: Partial<Album>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: album?.name || '',
    description: album?.description || '',
    cover_image: album?.cover_image || '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              {album ? '编辑相册' : '新建相册'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">相册名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="给相册起个名字"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              rows={3}
              placeholder="简单描述一下这个相册"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">封面图片URL</label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={e => setFormData({ ...formData, cover_image: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
              ) : (
                <><Save className="w-4 h-4" /> 保存</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
