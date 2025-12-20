'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/storage';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  folder?: string;
  maxSize?: number; // MB
  compress?: boolean;
  className?: string;
  preview?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function ImageUploader({
  onUpload,
  folder = 'uploads',
  maxSize = 10,
  compress = true,
  className = '',
  preview,
  placeholder = '点击或拖拽上传图片',
  aspectRatio = 'auto'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      setError(`图片大小不能超过 ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      // 压缩图片
      let fileToUpload = file;
      if (compress && file.size > 500 * 1024) { // 大于500KB才压缩
        fileToUpload = await compressImage(file, 1920, 0.85);
      }

      // 创建本地预览
      const localPreview = URL.createObjectURL(fileToUpload);
      setPreviewUrl(localPreview);

      // 上传到 Supabase
      const result = await uploadFile(fileToUpload, 'images', folder);
      
      if (result) {
        onUpload(result.url);
      } else {
        setError('上传失败，请重试');
        setPreviewUrl(null);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('上传失败，请重试');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }, [folder, maxSize, compress, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'min-h-[200px]'
  }[aspectRatio];

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      
      <motion.div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed
          transition-all duration-300 cursor-pointer
          ${aspectClass}
          ${dragOver 
            ? 'border-primary bg-primary/10 scale-[1.02]' 
            : 'border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50'
          }
          ${uploading ? 'pointer-events-none' : ''}
        `}
      >
        <AnimatePresence mode="wait">
          {previewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); clearPreview(); }}
                  className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Upload Progress */}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                    <p className="text-sm">上传中...</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                  <p className="text-muted-foreground">上传中...</p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={dragOver ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                    className="p-4 rounded-full bg-primary/10 mb-4"
                  >
                    {dragOver ? (
                      <Upload className="w-8 h-8 text-primary" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-primary" />
                    )}
                  </motion.div>
                  <p className="text-muted-foreground text-center">
                    {dragOver ? '松开上传' : placeholder}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    支持 JPG、PNG、GIF，最大 {maxSize}MB
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-500 text-sm mt-2"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// 多图上传组件
interface MultiImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  folder?: string;
  maxCount?: number;
  maxSize?: number;
}

export function MultiImageUploader({
  images,
  onImagesChange,
  folder = 'uploads',
  maxCount = 9,
  maxSize = 10
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = maxCount - images.length;
    if (remaining <= 0) return;

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const newImages: string[] = [];
      
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > maxSize * 1024 * 1024) continue;

        let fileToUpload = file;
        if (file.size > 500 * 1024) {
          fileToUpload = await compressImage(file, 1920, 0.85);
        }

        const result = await uploadFile(fileToUpload, 'images', folder);
        if (result) {
          newImages.push(result.url);
        }
      }

      onImagesChange([...images, ...newImages]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {images.map((url, index) => (
        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => removeImage(index)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      
      {images.length < maxCount && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50 transition-all flex flex-col items-center justify-center"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">上传</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
