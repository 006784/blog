'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  children: string;
  language?: string;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {/* 语言标签 */}
      {language && (
        <div className="absolute top-0 left-4 px-3 py-1 text-xs font-medium text-muted-foreground bg-secondary/80 rounded-b-lg border-x border-b border-border">
          {language}
        </div>
      )}
      
      {/* 复制按钮 */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/50 text-muted-foreground hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
        title="复制代码"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="w-4 h-4 text-green-500" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Copy className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 代码内容 */}
      <pre className="!mt-0 !pt-10 overflow-x-auto">
        <code className={language ? `language-${language}` : ''}>
          {children}
        </code>
      </pre>

      {/* 复制成功提示 */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 right-14 px-2 py-1 text-xs bg-green-500 text-white rounded-lg"
          >
            已复制
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 用于 ReactMarkdown 的自定义组件
export const markdownComponents = {
  pre: ({ children, ...props }: any) => {
    return <div {...props}>{children}</div>;
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;
    const codeString = String(children).replace(/\n$/, '');
    
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-secondary text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }

    return (
      <CodeBlock language={language}>
        {codeString}
      </CodeBlock>
    );
  },
};
