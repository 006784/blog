'use client';

import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
}

const LANG_MAP: Record<string, string> = {
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  php: 'php',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
};

export function CodeEditor({ value, onChange, language, height = '100%', readOnly = false }: CodeEditorProps) {
  return (
    <MonacoEditor
      height={height}
      language={LANG_MAP[language] || language}
      value={value}
      onChange={(v) => onChange(v || '')}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderLineHighlight: 'all',
        suggestOnTriggerCharacters: true,
        tabSize: language === 'python' ? 4 : 4,
        readOnly,
        padding: { top: 12, bottom: 12 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        bracketPairColorization: { enabled: true },
      }}
      loading={
        <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400 text-sm">
          加载编辑器...
        </div>
      }
    />
  );
}
