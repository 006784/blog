'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Image as ImageIcon, Plus, X, Heart, MapPin,
  Calendar, Folder, Trash2, ZoomIn, ChevronLeft, ChevronRight,
  Grid3X3, LayoutGrid, Sparkles, Upload, Shield, Edit2, Save
} from 'lucide-react';
import { MultiImageUploader } from '@/components/ImageUploader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';
import {
  Photo, Album,
  getAllPhotos, getAlbums, getPhotos,
  formatDate
} from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';

function GallerySkeleton({ viewMode }: { viewMode: 'grid' | 'masonry' }) {
  if (viewMode === 'masonry') {
    return (
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton
            key={i}
            className="mb-4 h-[220px] rounded-[var(--radius-2xl)]"
            style={{ height: `${180 + (i % 3) * 72}px` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <Skeleton key={i} className="aspect-square rounded-[var(--radius-2xl)]" />
      ))}
    </div>
  );
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  const { isAdmin, showLoginModal } = useAdmin();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [photosData, albumsData] = await Promise.all([
        selectedAlbum ? getPhotos(selectedAlbum) : getAllPhotos(),
        getAlbums()
      ]);
      setPhotos(photosData);
      setAlbums(albumsData);
    } catch (error) {
      console.error('加载数据失败:', error);
      setPhotos([]);
      setAlbums([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedAlbum]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleDeletePhoto(id: string) {
    if (!confirm('确定删除这张照片吗？')) return;
    try {
      const res = await fetch(`/api/gallery/photos/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      setPhotos((current) => current.filter((p) => p.id !== id));
    } catch (error) {
      console.error('删除失败:', error);
    }
  }

  async function handleUpdatePhoto(id: string, updates: Partial<Photo>) {
    try {
      const res = await fetch(`/api/gallery/photos/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('更新失败');
      const { photo } = await res.json();
      setPhotos((current) => current.map((p) => p.id === id ? photo : p));
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

  const activeAlbumName = useMemo(
    () => albums.find((album) => album.id === selectedAlbum)?.name ?? '全部照片',
    [albums, selectedAlbum]
  );

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <Badge tone="warning" variant="soft" className="w-fit gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Photo Archive
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-neutral-900)] sm:text-5xl">
                相册
              </h1>
              <p className="text-sm leading-7 text-[var(--color-neutral-600)] sm:text-base">
                用镜头保存生活切片。这里展示最近拍下来的画面、地点和当时的心情。
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Photos</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{photos.length}</p>
              </Card>
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Albums</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-900)]">{albums.length}</p>
              </Card>
              <Card variant="glass" padding="sm" className="rounded-[var(--radius-2xl)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">Current View</p>
                <p className="mt-2 text-lg font-semibold text-[var(--color-neutral-900)]">{activeAlbumName}</p>
              </Card>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card variant="glass" className="rounded-[var(--radius-2xl)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedAlbum(null)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                    !selectedAlbum
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                      : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  全部照片
                </button>

                {albums.map((album) => (
                  <button
                    key={album.id}
                    onClick={() => setSelectedAlbum(album.id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                      selectedAlbum === album.id
                        ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)] text-white shadow-[var(--shadow-sm)]'
                        : 'border-[color:var(--border-default)] bg-[var(--surface-base)] text-[var(--color-neutral-600)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]'
                    }`}
                  >
                    <Folder className="h-4 w-4" />
                    {album.name}
                    <span className="opacity-70">({album.photo_count})</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-[color:var(--border-default)] bg-[var(--surface-base)] p-1">
                  <Button
                    variant={viewMode === 'masonry' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('masonry')}
                    className="rounded-full"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-full"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    if (!isAdmin) {
                      showLoginModal();
                      return;
                    }
                    setShowAddModal(true);
                  }}
                >
                  {isAdmin ? <Plus className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  {isAdmin ? '添加照片' : '管理员登录'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {loading ? (
          <GallerySkeleton viewMode={viewMode} />
        ) : error ? (
          <StatePanel
            tone="error"
            icon={<Camera className="h-6 w-6" />}
            title="相册加载失败"
            description="这次没能拿到照片和相册数据，你可以重新试一次。"
            action={
              <Button onClick={() => void loadData()}>
                <Sparkles className="h-4 w-4" />
                重新加载
              </Button>
            }
          />
        ) : photos.length === 0 ? (
          <StatePanel
            tone="empty"
            icon={<ImageIcon className="h-6 w-6" />}
            title="还没有照片"
            description={selectedAlbum ? `“${activeAlbumName}” 这个相册里还没有内容。` : '相册还没有内容，上传第一张照片后这里就会开始有画面。'}
            action={
              <Button
                onClick={() => {
                  if (!isAdmin) {
                    showLoginModal();
                    return;
                  }
                  setShowAddModal(true);
                }}
              >
                {isAdmin ? <Upload className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                {isAdmin ? '上传第一张照片' : '管理员登录后上传'}
              </Button>
            }
          />
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
              onAdd={async (photoBatch) => {
                const res = await fetch('/api/gallery/photos/', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ photos: photoBatch }),
                });
                if (!res.ok) throw new Error('添加失败');
                const { photos: newPhotos } = await res.json();
                setPhotos((current) => [...(newPhotos || []), ...current]);
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
  const previewSrc = photo.thumbnail_url || photo.url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group relative mb-4 cursor-pointer overflow-hidden rounded-[var(--radius-2xl)] border border-[color:var(--border-default)] bg-[var(--surface-panel)] shadow-[var(--shadow-sm)] ${
        square ? 'aspect-square' : ''
      }`}
      onClick={onClick}
    >
      <Image
        src={previewSrc}
        alt={photo.title || '照片'}
        fill={square}
        width={square ? undefined : 800}
        height={square ? undefined : 600}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
          square ? '' : 'w-full h-auto'
        }`}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      
      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-4 transition-transform group-hover:translate-y-0">
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
      <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); }}
          className="rounded-full bg-black/30 p-2 backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          <Heart className="w-4 h-4 text-white" />
        </button>
        {isAdmin && (
          <>
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(photo); }}
                className="rounded-full bg-black/30 p-2 backdrop-blur-sm transition-colors hover:bg-[var(--color-primary-600)]"
              >
                <Edit2 className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
              className="rounded-full bg-black/30 p-2 backdrop-blur-sm transition-colors hover:bg-red-500/80"
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
        <div className="border-b border-[color:var(--border-default)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              编辑照片
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-[var(--surface-overlay)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Preview */}
          <div className="aspect-video rounded-xl overflow-hidden bg-muted relative">
            <Image src={photo.url} alt={photo.title || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 600px" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <Input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="给照片起个名字"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="resize-none"
              placeholder="这张照片的故事..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">地点</label>
              <Input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="拍摄地点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">拍摄日期</label>
              <Input
                type="date"
                value={formData.taken_at}
                onChange={e => setFormData({ ...formData, taken_at: e.target.value })}
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

        <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] p-6">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
          >
            {!loading ? <Save className="w-4 h-4" /> : null}
            保存修改
          </Button>
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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset loading state when photo changes
  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [photo.id]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const hasInfo = photo.title || photo.description || photo.location || photo.taken_at;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex-none flex items-center justify-between px-4 py-3 z-10" onClick={e => e.stopPropagation()}>
        <span className="text-white/50 text-sm select-none">
          {photo.title || '照片预览'}
        </span>
        <div className="flex items-center gap-2">
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="编辑"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg bg-white/10 hover:bg-red-500/60 transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-14" onClick={onClose}>
        {/* Loading spinner */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Error state */}
        {imgError && (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <ImageIcon className="w-12 h-12" />
            <p className="text-sm">图片加载失败</p>
          </div>
        )}

        {/* Image */}
        <motion.img
          key={photo.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: imgLoaded ? 1 : 0, scale: imgLoaded ? 1 : 0.96 }}
          transition={{ duration: 0.25 }}
          src={photo.url}
          alt={photo.title || '照片'}
          className="max-w-full max-h-full w-auto h-auto object-contain rounded select-none"
          style={{ maxHeight: hasInfo ? 'calc(100vh - 160px)' : 'calc(100vh - 100px)' }}
          onClick={e => e.stopPropagation()}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
          draggable={false}
        />

        {/* Prev/Next buttons — outside image, inside px-14 padding */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 transition-all"
          title="上一张 (←)"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 transition-all"
          title="下一张 (→)"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Bottom info */}
      {hasInfo && (
        <div className="flex-none px-6 py-4 text-center z-10" onClick={e => e.stopPropagation()}>
          {photo.title && <p className="text-white font-medium">{photo.title}</p>}
          {photo.description && <p className="text-white/55 text-sm mt-1">{photo.description}</p>}
          {(photo.location || photo.taken_at) && (
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-white/40">
              {photo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{photo.location}
                </span>
              )}
              {photo.taken_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{formatDate(photo.taken_at)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
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
  onAdd: (photos: Partial<Photo>[]) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    urls: [] as string[],
    title: '',
    description: '',
    location: '',
    album_id: '',
    taken_at: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.urls.length === 0) return;
    
    setLoading(true);
    try {
      const payload = formData.urls.map((url, index) => ({
        url,
        title:
          formData.title.trim().length > 0
            ? formData.urls.length > 1
              ? `${formData.title.trim()} ${index + 1}`
              : formData.title.trim()
            : undefined,
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        album_id: formData.album_id || undefined,
        taken_at: formData.taken_at || undefined,
      }));
      await onAdd(payload);
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
        <div className="border-b border-[color:var(--border-default)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              上传照片
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-[var(--surface-overlay)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择图片 *</label>
            <MultiImageUploader
              images={formData.urls}
              onImagesChange={(urls) => setFormData((current) => ({ ...current, urls }))}
              folder="photos"
              maxCount={60}
            />
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
              支持一次上传最多 60 张照片，标题、描述、地点、相册和日期会批量应用到本次所有图片。
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">标题</label>
            <Input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="给照片起个名字"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">描述</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="resize-none"
              placeholder="这张照片的故事..."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">地点</label>
              <Input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="拍摄地点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">拍摄日期</label>
              <Input
                type="date"
                value={formData.taken_at}
                onChange={e => setFormData({ ...formData, taken_at: e.target.value })}
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

        <div className="flex justify-end gap-3 border-t border-[color:var(--border-default)] p-6">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={formData.urls.length === 0}
          >
            {!loading ? <Upload className="w-4 h-4" /> : null}
            保存 {formData.urls.length > 0 ? `${formData.urls.length} 张照片` : '照片'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
