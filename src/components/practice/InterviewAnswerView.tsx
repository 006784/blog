'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Edit3 } from 'lucide-react';

interface InterviewAnswerViewProps {
  value: string;
  onChange: (v: string) => void;
  answerHint?: string | null;
  showHint?: boolean;
}

export function InterviewAnswerView({ value, onChange, answerHint, showHint }: InterviewAnswerViewProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#2d2d2d] border-b border-[#3d3d3d]">
        <span className="text-xs text-gray-400">Markdown 支持</span>
        <button
          onClick={() => setPreview(!preview)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-gray-300 hover:text-white hover:bg-[#3d3d3d] transition-colors"
        >
          {preview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {preview ? '编辑' : '预览'}
        </button>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-auto">
        {preview ? (
          <div className="p-4 prose prose-sm max-w-none text-[var(--ink)]
            prose-code:bg-[var(--paper-deep)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100 prose-pre:rounded-lg">
            {value ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p className="text-gray-400">暂无内容</p>}
          </div>
        ) : (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="请在这里输入你的回答，支持 Markdown 格式...

例如：
# 主要概念

1. 第一点
2. 第二点

```javascript
// 代码示例
```"
            className="w-full h-full p-4 bg-[#1e1e1e] text-gray-200 font-mono text-sm resize-none outline-none border-none placeholder-gray-600 leading-relaxed"
          />
        )}
      </div>

      {/* Reference answer (if shown after submit) */}
      {showHint && answerHint && (
        <div className="border-t border-[#3d3d3d] p-4 max-h-64 overflow-y-auto">
          <p className="text-xs font-semibold text-amber-400 mb-2">参考答案</p>
          <div className="prose prose-sm max-w-none text-gray-300
            prose-code:bg-[#2d2d2d] prose-code:text-amber-300 prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-[#2d2d2d] prose-pre:text-gray-100 prose-pre:rounded
            prose-headings:text-gray-100 prose-strong:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{answerHint}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
