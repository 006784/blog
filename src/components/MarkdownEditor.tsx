'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, Italic, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Code, Link2, Image,
  Eye, EyeOff, Maximize2, Minimize2, Undo, Redo,
  Table, Minus, CheckSquare
} from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  action: () => void;
  shortcut?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // 更新历史
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newText);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange, history, historyIndex]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    
    onChange(newText);
  }, [value, onChange]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]);
    }
  }, [history, historyIndex, onChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]);
    }
  }, [history, historyIndex, onChange]);

  const toolbarButtons: ToolbarButton[] = [
    { icon: Bold, label: '粗体', action: () => insertText('**', '**', '粗体文字'), shortcut: 'Ctrl+B' },
    { icon: Italic, label: '斜体', action: () => insertText('*', '*', '斜体文字'), shortcut: 'Ctrl+I' },
    { icon: Heading1, label: '标题1', action: () => insertAtLineStart('# ') },
    { icon: Heading2, label: '标题2', action: () => insertAtLineStart('## ') },
    { icon: Heading3, label: '标题3', action: () => insertAtLineStart('### ') },
    { icon: List, label: '无序列表', action: () => insertAtLineStart('- ') },
    { icon: ListOrdered, label: '有序列表', action: () => insertAtLineStart('1. ') },
    { icon: CheckSquare, label: '任务列表', action: () => insertAtLineStart('- [ ] ') },
    { icon: Quote, label: '引用', action: () => insertAtLineStart('> ') },
    { icon: Code, label: '代码', action: () => insertText('`', '`', 'code') },
    { icon: Link2, label: '链接', action: () => insertText('[', '](url)', '链接文字') },
    { icon: Image, label: '图片', action: () => insertText('![', '](图片链接)', '图片描述') },
    { icon: Table, label: '表格', action: () => insertText('\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n', '') },
    { icon: Minus, label: '分割线', action: () => insertText('\n---\n', '') },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertText('**', '**', '粗体文字');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*', '斜体文字');
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

    // Tab 键缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ', '');
    }
  };

  // 简单的 Markdown 渲染
  const renderMarkdown = (text: string) => {
    let html = text
      // 代码块
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-secondary rounded-lg p-4 overflow-x-auto my-4"><code class="text-sm">$2</code></pre>')
      // 行内代码
      .replace(/`([^`]+)`/g, '<code class="bg-secondary px-1.5 py-0.5 rounded text-sm">$1</code>')
      // 标题
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      // 粗体和斜体
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // 链接和图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // 引用
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">$1</blockquote>')
      // 分割线
      .replace(/^---$/gim, '<hr class="my-8 border-border" />')
      // 任务列表
      .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="w-4 h-4" /><span class="line-through text-muted-foreground">$1</span></div>')
      .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="w-4 h-4" /><span>$1</span></div>')
      // 无序列表
      .replace(/^- (.*$)/gim, '<li class="ml-4 my-1">• $1</li>')
      // 有序列表
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 my-1 list-decimal">$1</li>')
      // 换行
      .replace(/\n/g, '<br />');

    return html;
  };

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-background flex flex-col' 
    : 'relative';

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/30 flex-wrap">
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            title="撤销"
          >
            <Undo className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            title="重做"
          >
            <Redo className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {toolbarButtons.map((btn, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={btn.action}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title={btn.label + (btn.shortcut ? ` (${btn.shortcut})` : '')}
          >
            <btn.icon className="w-4 h-4" />
          </motion.button>
        ))}

        <div className="flex-1" />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPreview(!isPreview)}
          className={`p-2 rounded-lg transition-colors ${isPreview ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
          title={isPreview ? '编辑模式' : '预览模式'}
        >
          {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          title={isFullscreen ? '退出全屏' : '全屏模式'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* Editor / Preview */}
      <div className={`flex-1 ${isFullscreen ? 'overflow-hidden' : ''}`}>
        <AnimatePresence mode="wait">
          {isPreview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`p-6 prose prose-lg dark:prose-invert max-w-none overflow-y-auto ${isFullscreen ? 'h-full' : 'min-h-[400px]'}`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || '<p class="text-muted-foreground">预览区域</p>' }}
            />
          ) : (
            <motion.textarea
              key="editor"
              ref={textareaRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                // 添加到历史
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(e.target.value);
                if (newHistory.length > 50) newHistory.shift(); // 限制历史记录数量
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || '开始写作...\n\n支持 Markdown 语法:\n# 标题\n**粗体** *斜体*\n- 列表项\n> 引用\n`代码`'}
              className={`w-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed ${isFullscreen ? 'h-full' : 'min-h-[400px]'}`}
              spellCheck={false}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground">
        <span>
          {value.length} 字符 · {value.split(/\s+/).filter(Boolean).length} 词 · 
          约 {Math.max(1, Math.ceil(value.length / 400))} 分钟阅读
        </span>
        <span>Markdown 支持</span>
      </div>
    </div>
  );
}
