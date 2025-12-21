'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Send, Image, Bold, Italic, List, 
  Hash, Link2, Code, Quote, Heading1, Heading2,
  Eye, EyeOff, Check, X, Loader2, ChevronDown
} from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MobileEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MobileEditor({ value, onChange, placeholder }: MobileEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // 监听键盘高度变化 (iOS)
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // 插入文本
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // 行首插入
  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // 上传图片
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1920, 0.85);
      const result = await uploadFile(compressed, 'blog-uploads', 'posts');
      if (result) {
        insertText(`\n![图片](${result.url})\n`);
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 工具按钮
  const tools = [
    { icon: Heading1, label: 'H1', action: () => insertAtLineStart('# ') },
    { icon: Heading2, label: 'H2', action: () => insertAtLineStart('## ') },
    { icon: Bold, label: '粗', action: () => insertText('**', '**') },
    { icon: Italic, label: '斜', action: () => insertText('*', '*') },
    { icon: List, label: '列', action: () => insertAtLineStart('- ') },
    { icon: Quote, label: '引', action: () => insertAtLineStart('> ') },
    { icon: Code, label: '码', action: () => insertText('`', '`') },
    { icon: Link2, label: '链', action: () => insertText('[', '](url)') },
    { icon: Image, label: '图', action: () => fileInputRef.current?.click() },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 编辑区域 */}
      <div className="flex-1 relative">
        {showPreview ? (
          <div className="h-full p-4 overflow-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value || '*开始写作后这里会显示预览...*'}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "开始写作..."}
            className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-base leading-relaxed"
            style={{ paddingBottom: keyboardHeight > 0 ? '60px' : '80px' }}
          />
        )}

        {/* 字数统计 */}
        <div className="absolute bottom-2 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded-full">
          {value.length} 字
        </div>
      </div>

      {/* 底部工具栏 */}
      <motion.div 
        className="border-t border-border bg-card safe-area-inset-bottom"
        style={{ 
          paddingBottom: keyboardHeight > 0 ? 0 : 'env(safe-area-inset-bottom)',
          marginBottom: keyboardHeight > 0 ? keyboardHeight - 20 : 0
        }}
      >
        {/* 工具按钮行 */}
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
          {tools.map((tool, index) => (
            <motion.button
              key={index}
              whileTap={{ scale: 0.9 }}
              onClick={tool.action}
              disabled={uploading}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {uploading && tool.label === '图' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <tool.icon className="w-5 h-5" />
              )}
            </motion.button>
          ))}

          <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

          {/* 预览切换 */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPreview(!showPreview)}
            className={`flex-shrink-0 px-3 h-10 rounded-xl flex items-center justify-center gap-1 transition-colors ${
              showPreview ? 'bg-primary text-white' : 'bg-secondary/50 text-muted-foreground'
            }`}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-xs font-medium">{showPreview ? '编辑' : '预览图片'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* 隐藏的图片输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
