'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Square, Trash2, Copy, Check, ChevronDown, ChevronUp,
  Terminal, Code2, RotateCcw, Download, Share2, BookOpen,
} from 'lucide-react';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ── Language config ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: 'python',     label: 'Python',     monacoId: 'python',     ext: 'py',   comment: '# Python 3' },
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript', ext: 'js',   comment: '// JavaScript (Node.js)' },
  { id: 'typescript', label: 'TypeScript', monacoId: 'typescript', ext: 'ts',   comment: '// TypeScript' },
  { id: 'java',       label: 'Java',       monacoId: 'java',       ext: 'java', comment: '// Java' },
  { id: 'cpp',        label: 'C++',        monacoId: 'cpp',        ext: 'cpp',  comment: '// C++' },
  { id: 'c',          label: 'C',          monacoId: 'c',          ext: 'c',    comment: '// C' },
  { id: 'php',        label: 'PHP',        monacoId: 'php',        ext: 'php',  comment: '// PHP' },
  { id: 'html',       label: 'HTML',       monacoId: 'html',       ext: 'html', comment: '<!-- HTML -->' },
];

const STARTER: Record<string, string> = {
  python: `# Python 3 — 在线运行环境
# 支持标准库，可使用 input() 读取标准输入

def greet(name: str) -> str:
    return f"Hello, {name}! 👋"

name = input("请输入你的名字: ")
print(greet(name))

# 也可以直接运行：
for i in range(1, 6):
    print(f"  {i}. {'⭐' * i}")
`,

  javascript: `// JavaScript (Node.js 18)
// 使用 process.stdin 读取输入

const lines = [];
process.stdin.on('data', d => lines.push(...d.toString().split('\\n')));
process.stdin.on('end', () => {
  const name = lines[0]?.trim() || 'World';
  console.log(\`Hello, \${name}! 👋\`);

  // 演示：数组操作
  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  const sorted = [...nums].sort((a, b) => a - b);
  console.log('排序前:', nums.join(', '));
  console.log('排序后:', sorted.join(', '));
});
`,

  typescript: `// TypeScript 5
// 完整类型支持

interface User {
  id: number;
  name: string;
  email: string;
}

function formatUser(user: User): string {
  return \`[#\${user.id}] \${user.name} <\${user.email}>\`;
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob',   email: 'bob@example.com' },
];

users.forEach(u => console.log(formatUser(u)));

// 泛型示例
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
console.log('First user:', first(users)?.name);
`,

  java: `// Java 15
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String name = sc.hasNextLine() ? sc.nextLine().trim() : "World";
        System.out.println("Hello, " + name + "! 👋");

        // Stream 演示
        List<Integer> nums = List.of(3, 1, 4, 1, 5, 9, 2, 6);
        System.out.println("原始: " + nums);
        List<Integer> sorted = nums.stream()
            .sorted()
            .distinct()
            .collect(Collectors.toList());
        System.out.println("去重排序: " + sorted);

        int sum = sorted.stream().mapToInt(Integer::intValue).sum();
        System.out.println("总和: " + sum);
    }
}
`,

  cpp: `// C++ 17
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string name;
    getline(cin, name);
    if (name.empty()) name = "World";
    cout << "Hello, " << name << "! 👋\\n";

    // STL 演示
    vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};
    sort(v.begin(), v.end());
    v.erase(unique(v.begin(), v.end()), v.end());

    cout << "排序去重: ";
    for (int i = 0; i < (int)v.size(); i++) {
        cout << v[i] << (i + 1 < (int)v.size() ? " " : "\\n");
    }

    int sum = accumulate(v.begin(), v.end(), 0);
    cout << "总和: " << sum << "\\n";
    return 0;
}
`,

  c: `// C 11
#include <stdio.h>
#include <string.h>
#include <stdlib.h>

int cmp(const void* a, const void* b) {
    return (*(int*)a - *(int*)b);
}

int main() {
    char name[256] = "World";
    fgets(name, sizeof(name), stdin);
    // 去掉末尾换行
    name[strcspn(name, "\\n")] = 0;
    if (strlen(name) == 0) strcpy(name, "World");

    printf("Hello, %s! 👋\\n", name);

    int nums[] = {3, 1, 4, 1, 5, 9, 2, 6};
    int n = sizeof(nums) / sizeof(nums[0]);
    qsort(nums, n, sizeof(int), cmp);

    printf("排序后: ");
    for (int i = 0; i < n; i++) printf("%d%s", nums[i], i < n - 1 ? " " : "\\n");

    int sum = 0;
    for (int i = 0; i < n; i++) sum += nums[i];
    printf("总和: %d\\n", sum);
    return 0;
}
`,

  php: `<?php
// PHP 8.2

$name = trim(fgets(STDIN)) ?: 'World';
echo "Hello, {$name}! 👋\\n";

// 数组操作
$nums = [3, 1, 4, 1, 5, 9, 2, 6];
echo "原始: " . implode(', ', $nums) . "\\n";

sort($nums);
$nums = array_unique($nums);
echo "排序去重: " . implode(', ', $nums) . "\\n";

$sum = array_sum($nums);
echo "总和: {$sum}\\n";

// 字符串处理
$text = "Hello World PHP";
echo "大写: " . strtoupper($text) . "\\n";
echo "反转: " . strrev($text) . "\\n";
`,

  html: `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML 在线预览</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    h1 { color: #4f46e5; font-size: 1.8rem; margin-bottom: 1rem; }
    p  { color: #6b7280; line-height: 1.6; margin-bottom: 1.5rem; }
    button {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
    #count { font-size: 2rem; font-weight: bold; color: #4f46e5; margin: 1rem 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎉 HTML 预览</h1>
    <p>这是一个实时 HTML 预览环境，修改左侧代码立即生效！</p>
    <div id="count">0</div>
    <button onclick="document.getElementById('count').textContent = ++window._n || (window._n=1)">
      点击计数 +1
    </button>
  </div>
</body>
</html>
`,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RunOutput {
  stdout: string;
  stderr: string;
  code: number;
  error?: string;
  duration?: number;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function CodePlayground() {
  const [langId, setLangId] = useState('python');
  const [code, setCode] = useState(STARTER['python']);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState(STARTER['html']);
  const htmlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lang = LANGUAGES.find(l => l.id === langId)!;
  const isHtml = langId === 'html';

  // HTML 实时预览防抖
  useEffect(() => {
    if (!isHtml) return;
    if (htmlDebounce.current) clearTimeout(htmlDebounce.current);
    htmlDebounce.current = setTimeout(() => setHtmlPreview(code), 400);
  }, [code, isHtml]);

  function handleLangChange(id: string) {
    setLangId(id);
    setCode(STARTER[id] || '');
    setOutput(null);
  }

  const handleRun = useCallback(async () => {
    if (isHtml || running) return;
    setRunning(true);
    setOutput(null);
    const t0 = Date.now();
    try {
      const res = await fetch('/api/practice/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: langId, stdin }),
      });
      const data = await res.json();
      setOutput({ ...data, duration: Date.now() - t0 });
    } catch (e) {
      setOutput({ stdout: '', stderr: String(e), code: 1, duration: Date.now() - t0 });
    } finally {
      setRunning(false);
    }
  }, [code, langId, stdin, isHtml, running]);

  // Ctrl/Cmd + Enter 运行
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleRun]);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClear() {
    setOutput(null);
  }

  function handleReset() {
    setCode(STARTER[langId] || '');
    setOutput(null);
  }

  function handleDownload() {
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code.${lang.ext}`;
    a.click();
  }

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-100 overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3d3d3d] flex-shrink-0">
        {/* Logo / back */}
        <Link
          href="/practice"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors mr-1"
        >
          <Code2 className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">练习题库</span>
        </Link>

        <div className="w-px h-4 bg-[#3d3d3d]" />

        {/* Language tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {LANGUAGES.map(l => (
            <button
              key={l.id}
              onClick={() => handleLangChange(l.id)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                langId === l.id
                  ? 'bg-[var(--gold,#c4a96d)] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#3d3d3d]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={handleReset} title="重置代码" className="p-1.5 rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={handleCopy} title="复制代码" className="p-1.5 rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDownload} title="下载文件" className="p-1.5 rounded hover:bg-[#3d3d3d] text-gray-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          {!isHtml && (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold ml-1 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="运行 (Ctrl+Enter)"
            >
              {running
                ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />运行中</>
                : <><Play className="w-3.5 h-3.5 fill-white" />运行</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: editor */}
        <div className={`flex flex-col ${isHtml ? 'w-1/2' : 'flex-1'} overflow-hidden`}>
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={lang.monacoId}
              value={code}
              onChange={v => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 4,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                bracketPairColorization: { enabled: true },
                formatOnPaste: true,
                suggestOnTriggerCharacters: true,
              }}
              loading={<div className="flex items-center justify-center h-full text-gray-500 text-sm">加载编辑器...</div>}
            />
          </div>

          {/* Stdin (non-HTML only) */}
          {!isHtml && (
            <div className="flex-shrink-0 border-t border-[#3d3d3d]">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#2d2d2d] transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                标准输入 (stdin)
                {showStdin ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto" />}
              </button>
              <AnimatePresence>
                {showStdin && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 80 }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <textarea
                      value={stdin}
                      onChange={e => setStdin(e.target.value)}
                      placeholder="在此输入程序的标准输入（stdin），每行一条..."
                      className="w-full h-20 px-4 py-2 bg-[#1a1a1a] text-gray-300 text-xs font-mono resize-none outline-none border-none placeholder-gray-600"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: output or HTML preview */}
        {isHtml ? (
          <div className="w-1/2 border-l border-[#3d3d3d] flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#252526] border-b border-[#3d3d3d] flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-gray-400">实时预览</span>
            </div>
            <iframe
              srcDoc={htmlPreview}
              sandbox="allow-scripts allow-same-origin"
              className="flex-1 w-full bg-white"
              title="HTML Preview"
            />
          </div>
        ) : (
          <div className="w-[380px] flex-shrink-0 border-l border-[#3d3d3d] flex flex-col overflow-hidden">
            {/* Output header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3d3d3d] flex-shrink-0">
              <div className="flex items-center gap-2 text-xs">
                <Terminal className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-300 font-medium">输出</span>
                {output && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-mono ${output.code === 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
                    exit {output.code}
                  </span>
                )}
                {output?.duration && (
                  <span className="text-gray-500">{output.duration}ms</span>
                )}
              </div>
              {output && (
                <button onClick={handleClear} className="p-1 rounded hover:bg-[#3d3d3d] text-gray-500 hover:text-white transition-colors" title="清除输出">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Output body */}
            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                {running && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-3 text-gray-500"
                  >
                    <div className="w-8 h-8 border-2 border-gray-600 border-t-emerald-400 rounded-full animate-spin" />
                    <span className="text-sm">运行中...</span>
                  </motion.div>
                )}

                {!running && output && (
                  <motion.div
                    key="output"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 space-y-3"
                  >
                    {output.error && (
                      <div className="text-xs text-red-400 bg-red-900/20 rounded-lg p-3">
                        {output.error}
                      </div>
                    )}
                    {output.stdout && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          stdout
                        </div>
                        <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {output.stdout}
                        </pre>
                      </div>
                    )}
                    {output.stderr && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                          stderr
                        </div>
                        <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap break-all leading-relaxed">
                          {output.stderr}
                        </pre>
                      </div>
                    )}
                    {!output.stdout && !output.stderr && !output.error && (
                      <p className="text-sm text-gray-500 italic">（程序运行完毕，无输出）</p>
                    )}
                  </motion.div>
                )}

                {!running && !output && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full gap-4 text-gray-600 px-6 text-center"
                  >
                    <Play className="w-10 h-10 opacity-20" />
                    <div className="space-y-1">
                      <p className="text-sm">点击「运行」执行代码</p>
                      <p className="text-xs text-gray-700">或按 <kbd className="px-1.5 py-0.5 rounded bg-[#3d3d3d] text-gray-400 text-xs font-mono">Ctrl+Enter</kbd></p>
                    </div>
                    <Link href="/practice" className="flex items-center gap-1.5 text-xs text-[var(--gold,#c4a96d)] hover:underline mt-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      去练习题库
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom tip */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-[#3d3d3d] text-xs text-gray-600">
              由 <a href="https://github.com/engineer-man/piston" target="_blank" rel="noreferrer" className="hover:text-gray-400 transition-colors">Piston</a> 提供沙箱执行 · 每分钟最多 20 次
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
