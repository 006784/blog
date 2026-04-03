'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Strikethrough, Code, Link2, Image, 
  List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Table, Minus, Eye, EyeOff, Maximize2, Minimize2,
  Undo, Redo, CheckSquare, FileCode, Upload, X, Loader2, Sparkles,
  Copy, Scissors, RotateCcw, Wand2, Brain, Zap, FileText, BookOpen, AlertCircle, Bot, Check
} from 'lucide-react';
import { uploadFile, compressImage } from '@/lib/storage';
import { autoFormatContent } from '@/lib/auto-format';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CiyuanProviderConfig } from '@/lib/ciyuan-providers';
import {
  BUILTIN_CIYUAN_PROVIDERS,
  buildCiyuanProviderMap,
  getDefaultCiyuanProviderId,
  getDefaultModelId,
} from '@/lib/ciyuan-providers';
import { showToast } from '@/lib/toast';

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onImageUpload?: (url: string) => void;
  onSave?: () => void;
  initialShowPreview?: boolean;
  aiTitle?: string;
  aiDescription?: string;
  onSummaryGenerated?: (summary: string) => void;
}

const CIYUAN_KEYS_STORAGE = 'ciyuan_api_keys';
const CIYUAN_CUSTOM_PROVIDERS_STORAGE = 'ciyuan_custom_providers_v2';

type ArticleAIMode = 'improve' | 'summary';

interface ArticleAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function loadStoredAIKeys() {
  try {
    return JSON.parse(localStorage.getItem(CIYUAN_KEYS_STORAGE) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function loadStoredAIProviders() {
  try {
    return JSON.parse(localStorage.getItem(CIYUAN_CUSTOM_PROVIDERS_STORAGE) || '[]') as CiyuanProviderConfig[];
  } catch {
    return [];
  }
}

function extractMarkdownRewrite(content: string) {
  const match = content.match(/```(?:markdown|md)?\n([\s\S]*?)```/i);
  return (match?.[1] || content).trim();
}

function extractSummaryText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .split('\n')
    .map((line) => line.replace(/^[-*>\s]+/, '').trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

function buildArticleAIMessages(options: {
  mode: ArticleAIMode;
  title?: string;
  description?: string;
  content: string;
  selectedText: string;
  prompt: string;
}): ArticleAIMessage[] {
  const { mode, title, description, content, selectedText, prompt } = options;
  const scopedContent = selectedText.trim() || content.trim();
  const scopeLabel = selectedText.trim() ? '选中的段落' : '全文';

  const sharedContext = [
    title?.trim() ? `文章标题：${title.trim()}` : '',
    description?.trim() ? `当前摘要：${description.trim()}` : '',
    scopedContent ? `${scopeLabel}内容：\n${scopedContent}` : '',
    prompt.trim() ? `额外要求：${prompt.trim()}` : '',
  ].filter(Boolean).join('\n\n');

  if (mode === 'summary') {
    return [
      {
        role: 'system',
        content: [
          '你是一名擅长博客编辑的中文写作助手。',
          '请根据文章内容生成 1 到 2 句中文摘要。',
          '摘要要适合放在文章简介或 SEO 描述中，简洁、准确、自然。',
          '只输出摘要正文，不要标题、不要列表、不要解释。',
        ].join('\n'),
      },
      {
        role: 'user',
        content: sharedContext || '请根据当前文章生成简短摘要。',
      },
    ];
  }

  return [
    {
      role: 'system',
      content: [
        '你是一名专业中文编辑和技术写作者。',
        '请先给出 3 条以内的简短优化建议。',
        '然后输出一个 markdown 代码块，里面只放优化后的 Markdown 正文。',
        '如果用户提供的是选中片段，就只重写该片段；否则重写全文。',
        '不要编造事实，不要改变技术结论，尽量保留原作者语气。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: sharedContext || '请帮我优化当前文章内容。',
    },
  ];
}

export function RichEditor({
  value,
  onChange,
  placeholder,
  onImageUpload,
  onSave,
  initialShowPreview,
  aiTitle,
  aiDescription,
  onSummaryGenerated,
}: RichEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(initialShowPreview ?? true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMode, setAiMode] = useState<ArticleAIMode>('improve');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);
  const [aiProviderId, setAiProviderId] = useState(getDefaultCiyuanProviderId());
  const [aiModel, setAiModel] = useState('');
  const [aiKeys, setAiKeys] = useState<Record<string, string>>({});
  const [aiCustomProviders, setAiCustomProviders] = useState<CiyuanProviderConfig[]>([]);
  const [aiSelection, setAiSelection] = useState<{ start: number; end: number; hasSelection: boolean } | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  
  // 历史记录
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lastValueRef = useRef(value);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiProviders = useMemo(
    () => [...BUILTIN_CIYUAN_PROVIDERS, ...aiCustomProviders],
    [aiCustomProviders]
  );
  const aiProviderMap = useMemo(
    () => buildCiyuanProviderMap(aiCustomProviders),
    [aiCustomProviders]
  );
  const activeAIProvider =
    aiProviderMap[aiProviderId] ||
    aiProviderMap[getDefaultCiyuanProviderId()] ||
    aiProviders[0] ||
    null;

  // 初始化历史
  useEffect(() => {
    if (history.length === 0 && value) {
      setHistory([value]);
      setHistoryIndex(0);
    }
  }, [history.length, value]);

  useEffect(() => {
    setAiKeys(loadStoredAIKeys());
    setAiCustomProviders(loadStoredAIProviders());
  }, []);

  useEffect(() => {
    if (!activeAIProvider) return;
    if (!aiProviderMap[aiProviderId]) {
      setAiProviderId(activeAIProvider.id);
    }
    if (!aiModel.trim()) {
      setAiModel(getDefaultModelId(activeAIProvider));
    }
  }, [activeAIProvider, aiModel, aiProviderId, aiProviderMap]);

  useEffect(() => {
    return () => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
      aiAbortRef.current?.abort();
    };
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

  // 复制选中文本
  const copySelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
    }
  };

  // 剪切选中文本
  const cutSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      const newText = value.substring(0, start) + value.substring(end);
      onChange(newText);
      saveToHistory(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start);
      }, 0);
    }
  };

  // 清空格式
  const clearFormatting = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let selectedText = value.substring(start, end);
    
    if (selectedText) {
      // 移除常见的Markdown格式符号
      selectedText = selectedText
        .replace(/\*\*(.*?)\*\*/g, '$1')  // 粗体
        .replace(/\*(.*?)\*/g, '$1')      // 斜体
        .replace(/~~(.*?)~~/g, '$1')       // 删除线
        .replace(/`(.*?)`/g, '$1')         // 行内代码
        .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // 链接
      
      const newText = value.substring(0, start) + selectedText + value.substring(end);
      onChange(newText);
      saveToHistory(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + selectedText.length);
      }, 0);
    }
  };

  function handleAIProviderChange(nextProviderId: string) {
    const nextProvider = aiProviderMap[nextProviderId];
    setAiProviderId(nextProviderId);
    setAiModel(getDefaultModelId(nextProvider));
  }

  function openAIModal(mode: ArticleAIMode) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;

    setAiMode(mode);
    setAiPrompt('');
    setAiResult('');
    setAiCopied(false);
    setAiSelection({
      start,
      end,
      hasSelection: end > start,
    });
    setShowAIModal(true);
  }

  const showAIAssistant = () => {
    openAIModal('improve');
  };

  const generateSummary = () => {
    openAIModal('summary');
  };

  // 一键排版功能
  const autoFormat = () => {
    const formatted = autoFormatContent(value);
    onChange(formatted);
    saveToHistory(formatted);
  };

  // 高级排版功能
  const advancedFormat = () => {
    // 调用现有的基础排版功能
    const formatted = autoFormatContent(value);
    onChange(formatted);
    saveToHistory(formatted);
  };

  // 插入文章模板
  const insertArticleTemplate = () => {
    const template = `
# 文章标题

## 简介

在这里简要介绍文章的主要内容...

## 正文

详细内容...

## 总结

总结要点...

## 相关链接

- [链接1](链接地址)
- [链接2](链接地址)
`;
    insertText(template);
  };

  // 插入教程模板
  const insertTutorialTemplate = () => {
    const template = `
# 教程标题

## 简介

本教程将教你如何...

## 准备工作

- 需要的工具/软件
- 环境要求

## 步骤一：第一步

详细说明第一步的操作...

### 示例代码

\`\`\`javascript
// 示例代码
console.log('Hello World');
\`\`\`

## 步骤二：第二步

详细说明第二步的操作...

## 常见问题

### 问题1

**问题描述**

解决方案...

## 总结

通过本教程你学会了...
`;
    insertText(template);
  };

  // 插入提示框
  const insertAlertBox = () => {
    const template = `
> 📝 **提示**
> 这里是一些有用的提示信息
`;
    insertText(template);
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

  const runAI = useCallback(async () => {
    if (!activeAIProvider) return;

    const currentText = value.trim();
    const selectionStart = aiSelection?.start ?? textareaRef.current?.selectionStart ?? 0;
    const selectionEnd = aiSelection?.end ?? textareaRef.current?.selectionEnd ?? 0;
    const selectedText = selectionEnd > selectionStart ? value.slice(selectionStart, selectionEnd) : '';

    if (!aiModel.trim()) {
      setAiResult('请先填写模型 ID。');
      return;
    }

    if (activeAIProvider.authMode !== 'none' && !aiKeys[activeAIProvider.id]?.trim()) {
      setAiResult('当前浏览器还没有这个提供商的 API Key，请先去词元配置后再回来使用。');
      return;
    }

    if (!currentText && aiMode !== 'summary') {
      setAiResult('文章内容还是空的，先写一点内容，再让 AI 给你优化会更准确。');
      return;
    }

    if (!currentText && aiMode === 'summary') {
      setAiResult('还没有可供总结的文章内容。');
      return;
    }

    setAiLoading(true);
    setAiResult('');
    aiAbortRef.current?.abort();
    aiAbortRef.current = new AbortController();

    try {
      const response = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: activeAIProvider.id,
          providerConfig: activeAIProvider,
          model: aiModel.trim(),
          apiKey: aiKeys[activeAIProvider.id] || '',
          messages: buildArticleAIMessages({
            mode: aiMode,
            title: aiTitle,
            description: aiDescription,
            content: value,
            selectedText,
            prompt: aiPrompt,
          }),
        }),
        signal: aiAbortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI 请求失败 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) {
              fullText += payload.text;
              setAiResult(fullText);
            }
            if (payload.done) break;
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setAiResult(`[错误] ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setAiLoading(false);
    }
  }, [
    activeAIProvider,
    aiDescription,
    aiKeys,
    aiMode,
    aiModel,
    aiPrompt,
    aiSelection,
    aiTitle,
    value,
  ]);

  async function copyAIResult() {
    if (!aiResult.trim()) return;
    await navigator.clipboard.writeText(aiResult);
    setAiCopied(true);
    setTimeout(() => setAiCopied(false), 1500);
  }

  function applyAIRewrite() {
    const rewritten = extractMarkdownRewrite(aiResult);
    if (!rewritten) return;

    const selectionStart = aiSelection?.start ?? 0;
    const selectionEnd = aiSelection?.end ?? 0;
    const shouldReplaceSelection = !!aiSelection?.hasSelection && selectionEnd > selectionStart;
    const nextValue = shouldReplaceSelection
      ? `${value.slice(0, selectionStart)}${rewritten}${value.slice(selectionEnd)}`
      : rewritten;

    onChange(nextValue);
    saveToHistory(nextValue);
    setShowAIModal(false);
  }

  function applyAISummary() {
    const summary = extractSummaryText(aiResult);
    if (!summary) return;
    onSummaryGenerated?.(summary);
    setShowAIModal(false);
  }

  // 工具栏操作
  type ToolItem = 
    | { type: 'divider' }
    | { icon: React.ComponentType<{ className?: string }>; title: string; action: () => void; disabled?: boolean };
  
  const formatTools: ToolItem[] = [
    { icon: Heading1, title: '一级标题', action: () => insertAtLineStart('# ') },
    { icon: Heading2, title: '二级标题', action: () => insertAtLineStart('## ') },
    { icon: Heading3, title: '三级标题', action: () => insertAtLineStart('### ') },
    { type: 'divider' },
    { icon: Bold, title: '粗体 (Ctrl+B)', action: () => insertAtCursor('**', '**', '粗体文字') },
    { icon: Italic, title: '斜体 (Ctrl+I)', action: () => insertAtCursor('*', '*', '斜体文字') },
    { icon: Strikethrough, title: '删除线', action: () => insertAtCursor('~~', '~~', '删除线') },
    { icon: Code, title: '行内代码', action: () => insertAtCursor('`', '`', 'code') },
  ];
  
  const listTools: ToolItem[] = [
    { icon: List, title: '无序列表', action: () => insertAtLineStart('- ') },
    { icon: ListOrdered, title: '有序列表', action: () => insertAtLineStart('1. ') },
    { icon: CheckSquare, title: '任务列表', action: () => insertAtLineStart('- [ ] ') },
  ];
  
  const mediaTools: ToolItem[] = [
    { icon: Quote, title: '引用', action: () => insertAtLineStart('> ') },
    { icon: Minus, title: '分割线', action: () => insertText('\n\n---\n\n') },
    { icon: Link2, title: '链接', action: () => setShowLinkModal(true) },
    { icon: Image, title: '图片', action: () => setShowImageModal(true) },
    { icon: Table, title: '表格', action: () => setShowTableModal(true) },
    { icon: FileCode, title: '代码块', action: () => setShowCodeModal(true) },
  ];
  
  const editTools: ToolItem[] = [
    { icon: Undo, title: '撤销 (Ctrl+Z)', action: undo, disabled: historyIndex <= 0 },
    { icon: Redo, title: '重做 (Ctrl+Shift+Z)', action: redo, disabled: historyIndex >= history.length - 1 },
    { type: 'divider' },
    { icon: Copy, title: '复制选中', action: copySelection },
    { icon: Scissors, title: '剪切选中', action: cutSelection },
    { icon: RotateCcw, title: '清空格式', action: clearFormatting },
  ];
  
  const templateTools: ToolItem[] = [
    { icon: Sparkles, title: '文章模板', action: insertArticleTemplate },
    { icon: BookOpen, title: '教程模板', action: insertTutorialTemplate },
    { icon: AlertCircle, title: '提示框', action: insertAlertBox },
    { type: 'divider' },
    { icon: Wand2, title: 'AI优化建议', action: showAIAssistant },
    { icon: Brain, title: 'AI生成摘要', action: generateSummary },
    { type: 'divider' },
    { icon: Zap, title: '一键排版', action: autoFormat },
    { icon: FileText, title: '高级排版', action: advancedFormat },
  ];  
  const tools: ToolItem[] = [
    ...formatTools,
    { type: 'divider' },
    ...listTools,
    { type: 'divider' },
    ...mediaTools,
    { type: 'divider' },
    ...editTools,
    { type: 'divider' },
    ...templateTools,
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
      showToast.error('图片上传失败，请重试');
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
        case 's':
          e.preventDefault();
          // 触发保存事件
          onSave?.();
          break;
      }
    }
  };

  // 统计字数
  const getWordCount = () => {
    const text = value.replace(/[#*~`\[\]()]/g, '').trim();
    return text.length > 0 ? text.length : 0;
  };

  // 统计行数
  const getLineCount = () => {
    return value.split('\n').length;
  };

  // 估计阅读时间（分钟）
  const estimateReadingTime = () => {
    const wordsPerMinute = 300;
    const wordCount = getWordCount();
    return Math.ceil(wordCount / wordsPerMinute) || 1;
  };

  // 处理内容变化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // 延迟保存到历史，避免每个字符都保存
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }
    historyTimeoutRef.current = setTimeout(() => {
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
          className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
            showPreview ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={showPreview ? '关闭预览' : '开启预览（可查看图片）'}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-xs hidden sm:inline">{showPreview ? '编辑' : '预览'}</span>
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
            {getWordCount()} 字 • {getLineCount()} 行 • {estimateReadingTime()}分钟
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

        {showAIModal && (
          <Modal
            title={aiMode === 'summary' ? 'AI 生成摘要' : 'AI 优化建议'}
            maxWidthClass="max-w-4xl"
            onClose={() => {
              aiAbortRef.current?.abort();
              setShowAIModal(false);
            }}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAiMode('improve')}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    aiMode === 'improve'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  AI优化建议
                </button>
                <button
                  onClick={() => setAiMode('summary')}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    aiMode === 'summary'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  AI生成摘要
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">AI 提供商</label>
                  <select
                    value={activeAIProvider?.id || aiProviderId}
                    onChange={(e) => handleAIProviderChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none"
                  >
                    {aiProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">模型 ID</label>
                  <input
                    list="article-ai-models"
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none font-mono text-sm"
                    placeholder="输入或选择模型 ID"
                  />
                  <datalist id="article-ai-models">
                    {(activeAIProvider?.models || []).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.label}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                {activeAIProvider?.authMode === 'none'
                  ? '当前提供商不需要 API Key，可直接请求。'
                  : aiKeys[activeAIProvider?.id || '']?.trim()
                    ? '已检测到这个提供商的 API Key，将直接复用词元中的配置。'
                    : '当前浏览器还没找到这个提供商的 API Key，请先去词元完成配置。'}
                <div className="mt-2 text-primary">
                  未配置时可前往 /tools/ciyuan 填写密钥。
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {aiMode === 'summary' ? '摘要要求' : '润色要求'}
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  placeholder={
                    aiMode === 'summary'
                      ? '例如：控制在 80 字以内，适合首页卡片展示。'
                      : aiSelection?.hasSelection
                        ? '例如：把这段改得更简洁、更像教程风格。'
                        : '例如：让全文更像一篇教程，段落更清晰，保留原有观点。'
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  {aiMode === 'improve'
                    ? aiSelection?.hasSelection
                      ? '将优先优化当前选中的内容。'
                      : '将基于当前全文给出优化建议。'
                    : '将根据标题、摘要和正文生成简介。'}
                </div>
                <button
                  onClick={runAI}
                  disabled={aiLoading || !aiModel.trim()}
                  className="btn-primary px-4 py-2 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4" />
                      开始生成
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-border bg-background min-h-[240px] max-h-[420px] overflow-auto">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium">结果</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyAIResult}
                      disabled={!aiResult.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs border border-border hover:bg-secondary disabled:opacity-40"
                    >
                      {aiCopied ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          已复制
                        </span>
                      ) : (
                        '复制结果'
                      )}
                    </button>
                    {aiMode === 'summary' ? (
                      <button
                        onClick={applyAISummary}
                        disabled={!extractSummaryText(aiResult)}
                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40"
                      >
                        写入摘要
                      </button>
                    ) : (
                      <button
                        onClick={applyAIRewrite}
                        disabled={!extractMarkdownRewrite(aiResult)}
                        className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40"
                      >
                        {aiSelection?.hasSelection ? '替换选中内容' : '替换全文'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
                  {aiResult ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiResult}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {aiMode === 'summary'
                        ? '生成后会在这里显示可直接写入文章摘要的结果。'
                        : '生成后会先显示优化建议，再给出可直接替换的 Markdown 内容。'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// 弹窗组件
function Modal({
  title,
  onClose,
  children,
  maxWidthClass = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
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
        className={`w-full ${maxWidthClass} bg-card rounded-2xl shadow-2xl`}
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
    'html', 'css', 'json', 'bash', 'sql', '``'
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
