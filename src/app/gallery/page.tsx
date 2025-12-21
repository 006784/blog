'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Image as ImageIcon, Plus, X, Heart, MapPin, 
  Calendar, Folder, Trash2, ZoomIn, ChevronLeft, ChevronRight,
  Grid3X3, LayoutGrid, Sparkles, Upload, Loader2, Shield, Edit2, Save
} from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { 
  Photo, Album,
  getAllPhotos, getAlbums, getPhotos,
  createPhoto, createAlbum, deletePhoto, updatePhoto,
  formatDate
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  const { isAdmin, showLoginModal } = useAdmin();

  useEffect(() => {
    loadData();
  }, [selectedAlbum]);

  async function loadData() {
    try {
      setLoading(true);
      const [photosData, albumsData] = await Promise.all([
        selectedAlbum ? getPhotos(selectedAlbum) : getAllPhotos(),
        getAlbums()
      ]);
      setPhotos(photosData);
      setAlbums(albumsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
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

  async function handleUpdatePhoto(id: string, updates: Partial<Photo>) {
    try {
      const updated = await updatePhoto(id, updates);
      setPhotos(photos.map(p => p.id === id ? updated : p));
      setEditingPhoto(null);
    } catch (error) {
      console.error('更新失败:', error);
    }
  }

  function handlePrevPhoto() {
    if (!lightboxPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    setLightboxPhoto(photos[prevIndex]);
  }

  function handleNextPhoto() {
    if (!lightboxPhoto) return;
    const currentIndex = photos.findIndex(p => p.id === lightboxPhoto.id);
    const nextIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    setLightboxPhoto(photos[nextIndex]);
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-blue-500/25">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              相册
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            用镜头记录生活，每一张照片都是时光的印记 📸
          </p>
        </motion.div>

        {/* Albums Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-8"
        >
          <button
            onClick={() => setSelectedAlbum(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !selectedAlbum
                ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white shadow-lg'
                : 'bg-card hover:bg-card/80 text-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4 inline mr-2" />
            全部照片
          </button>
          
          {albums.map(album => (
            <button
              key={album.id}
              onClick={() => setSelectedAlbum(album.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedAlbum === album.id
                  ? 'bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white shadow-lg'
                  : 'bg-card hover:bg-card/80 text-foreground'
              }`}
            >
              <Folder className="w-4 h-4 inline mr-2" />
              {album.name}
              <span className="ml-1 text-xs opacity-70">({album.photo_count})</span>
            </button>
          ))}
        </motion.div>

        {/* View Mode & Add Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-2 bg-card rounded-xl p-1">
            <button
              onClick={() => setViewMode('masonry')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'masonry' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              if (!isAdmin) {
                showLoginModal();
                return;
              }
              setShowAddModal(true);
            }}
            className="btn-primary"
          >
            {isAdmin ? <Plus className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            {isAdmin ? '添加照片' : '管理员登录'}
          </button>
        </motion.div>

        {/* Photos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Camera className="w-12 h-12 text-primary animate-pulse" />
          </div>
        ) : photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">还没有添加照片</p>
            <button
              onClick={() => {
                if (!isAdmin) {
                  showLoginModal();
                  return;
                }
                setShowAddModal(true);
              }}
              className="mt-4 text-primary hover:underline"
            >
              {isAdmin ? '上传第一张照片' : '管理员登录后可上传'}
            </button>
          </motion.div>
        ) : viewMode === 'masonry' ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onClick={() => setLightboxPhoto(photo)}
                onDelete={handleDeletePhoto}
                onEdit={setEditingPhoto}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                index={index}
                onClick={() => setLightboxPhoto(photo)}
                onDelete={handleDeletePhoto}
                onEdit={setEditingPhoto}
                isAdmin={isAdmin}
                square
              />
            ))}
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {showAddModal && (
            <AddPhotoModal
              albums={albums}
              onClose={() => setShowAddModal(false)}
              onAdd={async (photo) => {
                const newPhoto = await createPhoto(photo);
                setPhotos([newPhoto, ...photos]);
                setShowAddModal(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Edit Photo Modal */}
        <AnimatePresence>
          {editingPhoto && (
            <EditPhotoModal
              photo={editingPhoto}
              albums={albums}
              onClose={() => setEditingPhoto(null)}
              onSave={handleUpdatePhoto}
            />
          )}
        </AnimatePresence>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxPhoto && (
            <Lightbox
              photo={lightboxPhoto}
              onClose={() => setLightboxPhoto(null)}
              onPrev={handlePrevPhoto}
              onNext={handleNextPhoto}
              isAdmin={isAdmin}
              onEdit={() => { setEditingPhoto(lightboxPhoto); setLightboxPhoto(null); }}
              onDelete={() => { handleDeletePhoto(lightboxPhoto.id); setLightboxPhoto(null); }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Photo Card Component
function PhotoCard({ 
  photo, 
  index, 
  onClick,
  onDelete,
  onEdit,
  isAdmin = false,
  square = false
}: { 
  photo: Photo; 
  index: number;
  onClick: () => void;
  onDelete: (id: string) => void;
  onEdit?: (photo: Photo) => void;
  isAdmin?: boolean;
  square?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative overflow-hidden rounded-2xl bg-card mb-4 cursor-pointer ${
        square ? 'aspect-square' : ''
      }`}
      onClick={onClick}
    >
      <img
        src={photo.url}
        alt={photo.title || '照片'}
        className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${
          square ? 'h-full' : 'h-auto'
        }`}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
        {photo.title && (
          <h3 className="font-medium text-white truncate">{photo.title}</h3>
        )}
        <div className="flex items-center gap-3 text-white/70 text-sm mt-1">
          {photo.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {photo.location}
            </span>
          )}
          {photo.taken_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(photo.taken_at)}
            </span>
          )}
        </div>
      </div>

      {/* Actions - 只有管理员可见 */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors"
        >
          <Heart className="w-4 h-4 text-white" />
        </button>
        {isAdmin && (
          <>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(photo); }}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-primary/80 transition-colors"
              >
                <Edit2 className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-red-500/80 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Zoom Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm">
          <ZoomIn className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// Edit Photo Modal
function EditPhotoModal({
  photo,
  albums,
  onClose,
  onSave
}: {
  photo: Photo;
  albums: Album[];
  onClose: () => void;
  onSave: (id: string, updates: Partial<Photo>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: photo.title || '',
    description: photo.description || '',
    location: photo.location || '',
    album_id: photo.album_id || '',
    taken_at: photo.taken_at || '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(photo.id, {
        ...formData,
        album_id: formData.album_id || undefined,
        taken_at: formData.taken_at || undefined,
      });
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
        className="w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              编辑照片
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Preview */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="给照片起个名字"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              rows={2}
              placeholder="这张照片的故事..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">地点</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="拍摄地点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">拍摄日期</label>
              <input
                type="date"
                value={formData.taken_at}
                onChange={e => setFormData({ ...formData, taken_at: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">相册</label>
            <select
              value={formData.album_id}
              onChange={e => setFormData({ ...formData, album_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">不归类到相册</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>{album.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
            ) : (
              <><Save className="w-4 h-4" /> 保存修改</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Lightbox Component
function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  isAdmin = false,
  onEdit,
  onDelete
}: {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Top Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {isAdmin && onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-3 rounded-full bg-white/10 hover:bg-primary/60 transition-colors"
          >
            <Edit2 className="w-5 h-5 text-white" />
          </button>
        )}
        {isAdmin && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-3 rounded-full bg-white/10 hover:bg-red-500/60 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Navigation */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
      >
        <ChevronRight className="w-8 h-8 text-white" />
      </button>

      {/* Image */}
      <motion.img
        key={photo.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        src={photo.url}
        alt={photo.title || '照片'}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={e => e.stopPropagation()}
      />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="max-w-3xl mx-auto text-center text-white">
          {photo.title && <h3 className="text-xl font-medium mb-2">{photo.title}</h3>}
          {photo.description && <p className="text-white/70 mb-2">{photo.description}</p>}
          <div className="flex items-center justify-center gap-4 text-sm text-white/60">
            {photo.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {photo.location}
              </span>
            )}
            {photo.taken_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(photo.taken_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Add Photo Modal
function AddPhotoModal({ 
  albums,
  onClose, 
  onAdd 
}: { 
  albums: Album[];
  onClose: () => void;
  onAdd: (photo: Partial<Photo>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    location: '',
    album_id: '',
    taken_at: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.url) return;
    
    setLoading(true);
    try {
      await onAdd({
        ...formData,
        album_id: formData.album_id || undefined,
        taken_at: formData.taken_at || undefined,
      });
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
        className="w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              上传照片
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择图片 *</label>
            <ImageUploader
              onUpload={(url) => setFormData({ ...formData, url })}
              folder="photos"
              aspectRatio="video"
              placeholder="点击或拖拽上传照片"
              preview={formData.url}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="给照片起个名字"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              rows={2}
              placeholder="这张照片的故事..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">地点</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="拍摄地点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">拍摄日期</label>
              <input
                type="date"
                value={formData.taken_at}
                onChange={e => setFormData({ ...formData, taken_at: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">相册</label>
            <select
              value={formData.album_id}
              onChange={e => setFormData({ ...formData, album_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="">不归类到相册</option>
              {albums.map(album => (
                <option key={album.id} value={album.id}>{album.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.url}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
            ) : (
              <><Upload className="w-4 h-4" /> 保存照片</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
