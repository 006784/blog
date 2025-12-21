'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

interface EnhancedCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: number;
  highlightLines?: number[];
}

const languageNames: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  css: 'CSS',
  py: 'Python',
  python: 'Python',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  sql: 'SQL',
  bash: 'Bash',
  sh: 'Shell',
  json: 'JSON',
  md: 'Markdown',
  markdown: 'Markdown',
  html: 'HTML',
  xml: 'XML',
};

export function EnhancedCodeBlock({
  code,
  language = 'plaintext',
  filename,
  showLineNumbers = true,
  maxHeight = 400,
  highlightLines = [],
}: EnhancedCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 高亮代码
  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current.querySelector('code') as Element);
    }
  }, [code, language]);

  // 检查是否需要展开按钮
  useEffect(() => {
    if (containerRef.current) {
      const scrollHeight = containerRef.current.scrollHeight;
      setNeedsExpansion(scrollHeight > maxHeight);
    }
  }, [code, maxHeight]);

  // 复制代码
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const lines = code.split('\n');
  const displayLanguage = languageNames[language.toLowerCase()] || language.toUpperCase();

  return (
    <div className="relative group rounded-xl overflow-hidden border border-border bg-[#1a1b26] my-4">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#24283b] border-b border-border/50">
        <div className="flex items-center gap-3">
          {/* 窗口按钮装饰 */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          
          {/* 文件名或语言标识 */}
          <span className="text-xs text-gray-400 font-mono">
            {filename || displayLanguage}
          </span>
        </div>
        
        {/* 复制按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={copyCode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors ${
            copied 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              复制
            </>
          )}
        </motion.button>
      </div>

      {/* 代码区域 */}
      <div
        ref={containerRef}
        className={`overflow-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent transition-all duration-300`}
        style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
      >
        <pre
          ref={codeRef}
          className={`p-4 text-sm font-mono leading-relaxed language-${language}`}
        >
          <code className={`language-${language}`}>
            {showLineNumbers ? (
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, index) => (
                    <tr
                      key={index}
                      className={`${
                        highlightLines.includes(index + 1)
                          ? 'bg-yellow-500/10'
                          : ''
                      }`}
                    >
                      <td className="select-none text-right pr-4 text-gray-600 w-[1%] whitespace-nowrap align-top">
                        {index + 1}
                      </td>
                      <td className="whitespace-pre-wrap break-all">
                        {line || ' '}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>

      {/* 展开/收起按钮 */}
      {needsExpansion && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1b26] to-transparent pt-8 pb-2 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-xs transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                收起
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                展开全部 ({lines.length} 行)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default EnhancedCodeBlock;
