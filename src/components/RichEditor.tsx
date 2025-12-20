'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Strikethrough, Code, Link2, Image, 
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Table, Minus, Eye, EyeOff, Maximize2, Minimize2,
  Undo, Redo, CheckSquare, FileCode, Upload, X, Loader2, Sparkles
} from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageUpload?: (url: string) => void;
}

export function RichEditor({ value, onChange, placeholder, onImageUpload }: RichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  
  // 历史记录
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastValueRef = useRef(value);

  // 初始化历史
  useEffect(() => {
    if (history.length === 0 && value) {
      setHistory([value]);
      setHistoryIndex(0);
    }
  }, []);

  // 保存到历史（防抖）
  const saveToHistory = useCallback((newValue: string) => {
    if (newValue !== lastValueRef.current) {
      lastValueRef.current = newValue;
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newValue);
        // 限制历史记录数量
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }
  }, [historyIndex]);

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      lastValueRef.current = history[newIndex];
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(history[newIndex]);
      lastValueRef.current = history[newIndex];
    }
  };

  // 插入文本到光标位置
  const insertAtCursor = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    saveToHistory(newText);

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // 在行首插入
  const insertAtLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);
    saveToHistory(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // 直接插入文本
  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = value.substring(0, start) + text + value.substring(end);
    onChange(newText);
    saveToHistory(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // 工具栏操作
  type ToolItem = 
    | { type: 'divider' }
    | { icon: React.ComponentType<{ className?: string }>; title: string; action: () => void; disabled?: boolean };
  
  const tools: ToolItem[] = [
    { icon: Undo, title: '撤销 (Ctrl+Z)', action: undo, disabled: historyIndex <= 0 },
    { icon: Redo, title: '重做 (Ctrl+Shift+Z)', action: redo, disabled: historyIndex >= history.length - 1 },
    { type: 'divider' },
    { icon: Heading1, title: '一级标题', action: () => insertAtLineStart('# ') },
    { icon: Heading2, title: '二级标题', action: () => insertAtLineStart('## ') },
    { icon: Heading3, title: '三级标题', action: () => insertAtLineStart('### ') },
    { type: 'divider' },
    { icon: Bold, title: '粗体 (Ctrl+B)', action: () => insertAtCursor('**', '**', '粗体文字') },
    { icon: Italic, title: '斜体 (Ctrl+I)', action: () => insertAtCursor('*', '*', '斜体文字') },
    { icon: Strikethrough, title: '删除线', action: () => insertAtCursor('~~', '~~', '删除线') },
    { icon: Code, title: '行内代码', action: () => insertAtCursor('`', '`', 'code') },
    { type: 'divider' },
    { icon: List, title: '无序列表', action: () => insertAtLineStart('- ') },
    { icon: ListOrdered, title: '有序列表', action: () => insertAtLineStart('1. ') },
    { icon: CheckSquare, title: '任务列表', action: () => insertAtLineStart('- [ ] ') },
    { type: 'divider' },
    { icon: Quote, title: '引用', action: () => insertAtLineStart('> ') },
    { icon: Minus, title: '分割线', action: () => insertText('\n\n---\n\n') },
    { icon: Link2, title: '链接', action: () => setShowLinkModal(true) },
    { icon: Image, title: '图片', action: () => setShowImageModal(true) },
    { icon: Table, title: '表格', action: () => setShowTableModal(true) },
    { icon: FileCode, title: '代码块', action: () => setShowCodeModal(true) },
  ];

  // 处理图片上传
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1920, 0.85);
      const result = await uploadFile(compressed, 'blog-uploads', 'posts');
      if (result) {
        insertText(`\n![${file.name.replace(/\.[^/.]+$/, '')}](${result.url})\n`);
        onImageUpload?.(result.url);
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
      setShowImageModal(false);
    }
  };

  // 处理粘贴 - 只拦截图片，文本正常处理
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) {
        await handleImageUpload(file);
      }
    }
    // 文本粘贴不做任何处理，让浏览器默认行为执行
  };

  // 处理拖拽
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      await handleImageUpload(imageFile);
    }
  };

  // 快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertAtCursor('**', '**', '粗体');
          break;
        case 'i':
          e.preventDefault();
          insertAtCursor('*', '*', '斜体');
          break;
        case 'k':
          e.preventDefault();
          setShowLinkModal(true);
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
      }
    }
  };

  // 处理内容变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // 延迟保存到历史，避免每个字符都保存
    clearTimeout((window as any).editorHistoryTimeout);
    (window as any).editorHistoryTimeout = setTimeout(() => {
      saveToHistory(newValue);
    }, 500);
  };

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'rounded-2xl border border-border overflow-hidden bg-card'}`}>
      {/* 工具栏 */}
      <div className="flex items-center gap-0.5 p-2 border-b border-border bg-secondary/30 flex-wrap">
        {tools.map((tool, index) => {
          if ('type' in tool) {
            return <div key={index} className="w-px h-6 bg-border mx-1" />;
          }
          const { icon: IconComponent, action, disabled, title } = tool;
          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                disabled 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
              }`}
              title={title}
            >
              <IconComponent className="w-4 h-4" />
            </motion.button>
          );
        })}

        <div className="flex-1" />

        {uploading && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 px-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            上传中...
          </span>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="上传图片"
        >
          <Upload className="w-4 h-4" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPreview(!showPreview)}
          className={`p-2 rounded-lg transition-colors ${
            showPreview ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={showPreview ? '关闭预览' : '预览'}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title={isFullscreen ? '退出全屏' : '全屏编辑'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* 编辑区域 */}
      <div className={`flex-1 flex ${isFullscreen ? 'h-0' : 'min-h-[500px]'}`}>
        <div className={`flex-1 relative ${showPreview ? 'border-r border-border' : ''}`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            placeholder={placeholder}
            className="w-full h-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed"
            style={{ minHeight: isFullscreen ? '100%' : '500px' }}
          />
          <div className="absolute bottom-3 right-4 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
            {value.length} 字
          </div>
        </div>

        {showPreview && (
          <div className="flex-1 p-6 overflow-auto bg-background">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value || '*开始写作后这里会显示预览...*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(file => handleImageUpload(file));
          e.target.value = '';
        }}
      />

      {/* 弹窗 */}
      <AnimatePresence>
        {showLinkModal && (
          <Modal title="插入链接" onClose={() => setShowLinkModal(false)}>
            <LinkForm onInsert={(text, url) => {
              insertText(`[${text}](${url})`);
              setShowLinkModal(false);
            }} />
          </Modal>
        )}

        {showImageModal && (
          <Modal title="插入图片" onClose={() => setShowImageModal(false)}>
            <ImageForm 
              onInsertUrl={(alt, url) => {
                insertText(`![${alt}](${url})\n`);
                setShowImageModal(false);
              }}
              onUpload={handleImageUpload}
              uploading={uploading}
            />
          </Modal>
        )}

        {showTableModal && (
          <Modal title="插入表格" onClose={() => setShowTableModal(false)}>
            <TableForm onInsert={(rows, cols) => {
              const header = '| ' + Array(cols).fill('标题').join(' | ') + ' |\n';
              const sep = '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
              const body = Array(rows - 1).fill('| ' + Array(cols).fill('内容').join(' | ') + ' |').join('\n');
              insertText(`\n${header}${sep}${body}\n`);
              setShowTableModal(false);
            }} />
          </Modal>
        )}

        {showCodeModal && (
          <Modal title="插入代码块" onClose={() => setShowCodeModal(false)}>
            <CodeBlockForm onInsert={(lang) => {
              insertText(`
\`\`\`${lang}

\`\`\`
`);
              setShowCodeModal(false);
              // 将光标移到代码块内
              setTimeout(() => {
                const textarea = textareaRef.current;
                if (textarea) {
                  const pos = textarea.selectionStart - 5;
                  textarea.setSelectionRange(pos, pos);
                }
              }, 0);
            }} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// 弹窗组件
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// 链接表单
function LinkForm({ onInsert }: { onInsert: (text: string, url: string) => void }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">链接文字</label>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="显示的文字"
          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">链接地址</label>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => onInsert(text || url, url)}
          disabled={!url}
          className="btn-primary px-4 py-2 disabled:opacity-50"
        >
          插入链接
        </button>
      </div>
    </div>
  );
}

// 图片表单
function ImageForm({ onInsertUrl, onUpload, uploading }: { 
  onInsertUrl: (alt: string, url: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [alt, setAlt] = useState('');
  const [url, setUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-secondary rounded-lg">
        <button
          onClick={() => setMode('upload')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === 'upload' ? 'bg-card shadow' : ''}`}
        >
          本地上传
        </button>
        <button
          onClick={() => setMode('url')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === 'url' ? 'bg-card shadow' : ''}`}
        >
          图片链接
        </button>
      </div>

      {mode === 'upload' ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">点击选择或拖拽图片</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">图片描述</label>
            <input
              type="text"
              value={alt}
              onChange={e => setAlt(e.target.value)}
              placeholder="图片描述（可选）"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">图片地址</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => onInsertUrl(alt || '图片', url)}
              disabled={!url}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              插入图片
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// 表格表单
function TableForm({ onInsert }: { onInsert: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">行数</label>
          <input
            type="number"
            value={rows}
            onChange={e => setRows(Math.max(2, parseInt(e.target.value) || 2))}
            min={2}
            max={20}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">列数</label>
          <input
            type="number"
            value={cols}
            onChange={e => setCols(Math.max(2, parseInt(e.target.value) || 2))}
            min={2}
            max={10}
            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
          />
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button onClick={() => onInsert(rows, cols)} className="btn-primary px-4 py-2">
          插入表格
        </button>
      </div>
    </div>
  );
}

// 代码块表单
function CodeBlockForm({ onInsert }: { onInsert: (lang: string) => void }) {
  const languages = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'html', 'css', 'json', 'bash', 'sql', 'markdown'
  ];
  const [selected, setSelected] = useState('javascript');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">选择语言</label>
        <div className="grid grid-cols-4 gap-2">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => setSelected(lang)}
              className={`px-3 py-2 rounded-lg text-sm transition ${
                selected === lang ? 'bg-primary text-white' : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <button onClick={() => onInsert(selected)} className="btn-primary px-4 py-2">
          插入代码块
        </button>
      </div>
    </div>
  );
}

export default RichEditor;
