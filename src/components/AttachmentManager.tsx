// GIF支持和附件管理组件
'use client';

import { useState, useRef, useCallback } from 'react';
import { Image, Video, FileText, X, Download, Upload, Play, Pause } from 'lucide-react';
import { MultimediaService, type MediaAttachment } from '@/lib/diary/multimedia-service';

interface AttachmentManagerProps {
  onAttachmentsChange: (attachments: MediaAttachment[]) => void;
  className?: string;
}

export function AttachmentManager({ onAttachmentsChange, className = '' }: AttachmentManagerProps) {
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    
    try {
      // 验证每个文件
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = MultimediaService.validateFile(file);
        
        if (!validation.isValid) {
          alert(`文件 "${file.name}" ${validation.error}`);
          continue;
        }
      }
      
      const processedAttachments = await MultimediaService.processMediaAttachments(files);
      const newAttachments = [...attachments, ...processedAttachments];
      setAttachments(newAttachments);
      onAttachmentsChange(newAttachments);
    } catch (error) {
      console.error('处理文件失败:', error);
      alert('处理文件时出现错误');
    } finally {
      setUploading(false);
    }
  }, [attachments, onAttachmentsChange]);

  // 处理文件输入
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // 处理拖拽事件
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // 删除附件
  const removeAttachment = (id: string) => {
    const attachmentToRemove = attachments.find(a => a.id === id);
    if (attachmentToRemove) {
      URL.revokeObjectURL(attachmentToRemove.url);
      if (attachmentToRemove.thumbnail) {
        URL.revokeObjectURL(attachmentToRemove.thumbnail);
      }
    }
    
    const newAttachments = attachments.filter(a => a.id !== id);
    setAttachments(newAttachments);
    onAttachmentsChange(newAttachments);
  };

  // 上传附件到服务器
  const uploadAttachment = async (attachment: MediaAttachment) => {
    if (attachment.url.startsWith('blob:')) {
      setUploading(true);
      try {
        const result = await MultimediaService.uploadMedia(attachment.file);
        if (result.success && result.url) {
          // 更新附件URL
          const updatedAttachments = attachments.map(att => 
            att.id === attachment.id ? { ...att, url: result.url! } : att
          );
          setAttachments(updatedAttachments);
          onAttachmentsChange(updatedAttachments);
        } else {
          alert(`上传失败: ${result.error}`);
        }
      } catch (error) {
        console.error('上传失败:', error);
        alert('上传失败');
      } finally {
        setUploading(false);
      }
    }
  };

  // 获取文件图标
  const getFileIcon = (type: string) => {
    switch (true) {
      case type.startsWith('image/'):
        return <Image className="w-4 h-4" />;
      case type.startsWith('video/'):
        return <Video className="w-4 h-4" />;
      case type.startsWith('audio/'):
        return <Play className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">附件管理</h4>

      {/* 文件上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive 
            ? 'border-amber-500 bg-amber-50' 
            : 'border-gray-300 hover:border-amber-400 hover:bg-amber-25'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          点击或拖拽文件到此处上传
        </p>
        <p className="text-xs text-gray-500">
          支持图片、视频、音频、GIF等格式
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          multiple
          accept="image/*,video/*,audio/*,.gif"
          className="hidden"
        />
      </div>

      {/* 上传状态 */}
      {uploading && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
          正在处理文件...
        </div>
      )}

      {/* 附件列表 */}
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-sm font-medium text-gray-700">已添加的附件</h5>
          {attachments.map(attachment => (
            <div 
              key={attachment.id} 
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg group"
            >
              <div className="flex-shrink-0">
                {getFileIcon(attachment.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">
                  {attachment.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)} • {attachment.type}
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* 预览按钮 */}
                {attachment.type.startsWith('image/') && (
                  <button
                    onClick={() => window.open(attachment.url, '_blank')}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                    title="预览"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                
                {/* 下载按钮 */}
                <a
                  href={attachment.url}
                  download={attachment.name}
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title="下载"
                >
                  <Download className="w-4 h-4" />
                </a>
                
                {/* 删除按钮 */}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="删除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// GIF播放组件
interface GifPlayerProps {
  src: string;
  alt?: string;
  className?: string;
}

export function GifPlayer({ src, alt = '', className = '' }: GifPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${isPlaying ? '' : 'opacity-50'} transition-opacity`}
        style={{ display: isPlaying ? 'block' : 'none' }}
      />
      <video
        src={src}
        autoPlay={isPlaying}
        muted
        loop
        playsInline
        className={`${isPlaying ? 'block' : 'hidden'} absolute inset-0`}
      />
      <button
        onClick={togglePlayback}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-all"
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
    </div>
  );
}