'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play, Trash2, Copy, Check, ChevronDown, ChevronUp,
  Terminal, Code2, RotateCcw, Download, BookOpen,
  Bot, Wand2, Sparkles, Bug, X, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import type { CiyuanProviderConfig } from '@/lib/ciyuan-providers';
import {
  BUILTIN_CIYUAN_PROVIDERS,
  buildCiyuanProviderMap,
  getDefaultCiyuanProviderId,
  getDefaultModelId,
} from '@/lib/ciyuan-providers';

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

const CIYUAN_KEYS_STORAGE = 'ciyuan_api_keys';
const CIYUAN_CUSTOM_PROVIDERS_STORAGE = 'ciyuan_custom_providers_v2';

type AssistantMode = 'generate' | 'explain' | 'fix' | 'optimize';

interface AssistantMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const ASSISTANT_ACTIONS: Array<{
  id: AssistantMode;
  label: string;
  icon: typeof Wand2;
  placeholder: string;
}> = [
  {
    id: 'generate',
    label: '生成代码',
    icon: Wand2,
    placeholder: '描述你要实现的功能、输入输出、框架或约束，例如：写一个 Python 爬虫，抓取标题并导出 CSV。',
  },
  {
    id: 'explain',
    label: '解释代码',
    icon: Sparkles,
    placeholder: '可补充你最想知道的点，例如：重点解释这段递归、复杂度和边界条件。',
  },
  {
    id: 'fix',
    label: '修复报错',
    icon: Bug,
    placeholder: '可粘贴报错、预期结果或异常现象，例如：TypeError 在第 23 行，点击按钮没反应。',
  },
  {
    id: 'optimize',
    label: '优化代码',
    icon: Bot,
    placeholder: '说明你希望优化什么，例如：提升性能、重构结构、改成更清晰的 TypeScript 写法。',
  },
];

function loadStoredKeys() {
  try {
    return JSON.parse(localStorage.getItem(CIYUAN_KEYS_STORAGE) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function loadStoredCustomProviders() {
  try {
    return JSON.parse(localStorage.getItem(CIYUAN_CUSTOM_PROVIDERS_STORAGE) || '[]') as CiyuanProviderConfig[];
  } catch {
    return [];
  }
}

function extractAssistantCode(content: string) {
  const match = content.match(/```(?:[\w#+.-]+)?\n([\s\S]*?)```/);
  return (match?.[1] || content).trim();
}

function buildAssistantMessages(options: {
  mode: AssistantMode;
  prompt: string;
  code: string;
  languageLabel: string;
  output: RunOutput | null;
}): AssistantMessage[] {
  const { mode, prompt, code, languageLabel, output } = options;

  const system = [
    '你是一名资深软件工程师和代码助手。',
    `当前主要处理的语言是 ${languageLabel}。`,
    '回答默认使用简体中文。',
    '如果需要返回代码，请优先返回完整、可运行的版本，并放在 Markdown 代码块中。',
    '如果在解释代码，也请指出关键逻辑、边界情况和潜在风险。',
  ].join('\n');

  const codeSection = code.trim() ? `当前代码：\n\`\`\`${languageLabel.toLowerCase()}\n${code}\n\`\`\`` : '当前代码为空。';
  const stderrSection = output?.stderr?.trim() ? `当前报错或 stderr：\n${output.stderr.trim()}` : '';
  const stdoutSection = output?.stdout?.trim() ? `当前 stdout：\n${output.stdout.trim()}` : '';
  const extraPrompt = prompt.trim() ? `补充说明：\n${prompt.trim()}` : '';

  if (mode === 'generate') {
    return [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          `请根据下面需求生成一份 ${languageLabel} 代码。`,
          extraPrompt || '请生成一份完整、可运行、结构清晰的示例代码。',
          code.trim() ? `如有必要，也可以参考或重写我当前编辑器中的代码。\n\n${codeSection}` : '',
          '请先简短说明思路，再给出完整代码。',
        ].filter(Boolean).join('\n\n'),
      },
    ];
  }

  if (mode === 'explain') {
    return [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          `请解释这段 ${languageLabel} 代码。`,
          extraPrompt || '请从作用、执行流程、关键语法、复杂度和注意事项几个方面解释。',
          codeSection,
        ].join('\n\n'),
      },
    ];
  }

  if (mode === 'fix') {
    return [
      { role: 'system', content: system },
      {
        role: 'user',
        content: [
          `请帮我修复这段 ${languageLabel} 代码。`,
          extraPrompt || '请定位问题原因，并给出修复后的完整代码。',
          stderrSection,
          stdoutSection,
          codeSection,
        ].filter(Boolean).join('\n\n'),
      },
    ];
  }

  return [
    { role: 'system', content: system },
    {
      role: 'user',
      content: [
        `请优化这段 ${languageLabel} 代码。`,
        extraPrompt || '请优先提升可读性、健壮性和性能，并说明你改了什么。',
        codeSection,
      ].join('\n\n'),
    },
  ];
}

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
  const [showAssistant, setShowAssistant] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('generate');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantResult, setAssistantResult] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantCopied, setAssistantCopied] = useState(false);
  const [assistantProviderId, setAssistantProviderId] = useState(getDefaultCiyuanProviderId());
  const [assistantModel, setAssistantModel] = useState('');
  const [assistantKeys, setAssistantKeys] = useState<Record<string, string>>({});
  const [assistantCustomProviders, setAssistantCustomProviders] = useState<CiyuanProviderConfig[]>([]);
  const htmlDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assistantAbortRef = useRef<AbortController | null>(null);

  const lang = LANGUAGES.find(l => l.id === langId)!;
  const isHtml = langId === 'html';
  const assistantProviders = useMemo(
    () => [...BUILTIN_CIYUAN_PROVIDERS, ...assistantCustomProviders],
    [assistantCustomProviders]
  );
  const assistantProviderMap = useMemo(
    () => buildCiyuanProviderMap(assistantCustomProviders),
    [assistantCustomProviders]
  );
  const activeAssistantProvider =
    assistantProviderMap[assistantProviderId] ||
    assistantProviderMap[getDefaultCiyuanProviderId()] ||
    assistantProviders[0] ||
    null;
  const assistantAction = ASSISTANT_ACTIONS.find((item) => item.id === assistantMode) || ASSISTANT_ACTIONS[0];

  useEffect(() => {
    setAssistantKeys(loadStoredKeys());
    setAssistantCustomProviders(loadStoredCustomProviders());
  }, []);

  useEffect(() => {
    if (!activeAssistantProvider) return;
    if (!assistantProviderMap[assistantProviderId]) {
      setAssistantProviderId(activeAssistantProvider.id);
    }
    if (!assistantModel.trim()) {
      setAssistantModel(getDefaultModelId(activeAssistantProvider));
    }
  }, [activeAssistantProvider, assistantModel, assistantProviderId, assistantProviderMap]);

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

  function handleAssistantProviderChange(nextProviderId: string) {
    const nextProvider = assistantProviderMap[nextProviderId];
    setAssistantProviderId(nextProviderId);
    setAssistantModel(getDefaultModelId(nextProvider));
  }

  async function handleAssistantCopy() {
    if (!assistantResult.trim()) return;
    await navigator.clipboard.writeText(assistantResult);
    setAssistantCopied(true);
    setTimeout(() => setAssistantCopied(false), 1500);
  }

  function applyAssistantCode(mode: 'replace' | 'append') {
    if (!assistantResult.trim()) return;
    const nextSnippet = extractAssistantCode(assistantResult);
    if (!nextSnippet) return;
    setCode((current) => (
      mode === 'replace'
        ? nextSnippet
        : `${current.trimEnd()}\n\n${nextSnippet}`.trim()
    ));
    setShowAssistant(false);
  }

  const runAssistant = useCallback(async () => {
    if (!activeAssistantProvider) return;

    if (!assistantModel.trim()) {
      setAssistantResult('请先填写模型 ID。');
      setShowAssistant(true);
      return;
    }

    if (activeAssistantProvider.authMode !== 'none' && !assistantKeys[activeAssistantProvider.id]?.trim()) {
      setAssistantResult('请先去词元或当前页面配置可用的 API Key，再使用 AI 编程助手。');
      setShowAssistant(true);
      return;
    }

    if (assistantMode !== 'generate' && !code.trim()) {
      setAssistantResult('当前编辑器还是空的，先写一点代码，再让 AI 帮你解释、修复或优化会更准确。');
      setShowAssistant(true);
      return;
    }

    setShowAssistant(true);
    setAssistantLoading(true);
    setAssistantResult('');
    assistantAbortRef.current?.abort();
    assistantAbortRef.current = new AbortController();

    try {
      const response = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: activeAssistantProvider.id,
          providerConfig: activeAssistantProvider,
          model: assistantModel.trim(),
          apiKey: assistantKeys[activeAssistantProvider.id] || '',
          messages: buildAssistantMessages({
            mode: assistantMode,
            prompt: assistantPrompt,
            code,
            languageLabel: lang.label,
            output,
          }),
        }),
        signal: assistantAbortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI 请求失败 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.text) {
              fullText += payload.text;
              setAssistantResult(fullText);
            }
            if (payload.done) break;
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setAssistantResult(`[错误] ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      setAssistantLoading(false);
    }
  }, [
    activeAssistantProvider,
    assistantKeys,
    assistantMode,
    assistantModel,
    assistantPrompt,
    code,
    lang.label,
    output,
  ]);

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
          <button
            onClick={() => setShowAssistant(true)}
            title="AI 编程助手"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#3d3d3d] hover:border-[var(--gold,#c4a96d)] text-gray-300 hover:text-white transition-colors mr-1"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="text-xs font-medium hidden sm:inline">AI 写代码</span>
          </button>
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

      <AnimatePresence>
        {showAssistant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAssistant(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-5xl h-[82vh] rounded-3xl border border-[#3d3d3d] bg-[#161616] text-gray-100 shadow-2xl overflow-hidden flex flex-col"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2f2f2f] bg-[#1b1b1b]">
                <div className="w-10 h-10 rounded-2xl bg-[var(--gold,#c4a96d)]/15 border border-[var(--gold,#c4a96d)]/25 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[var(--gold,#c4a96d)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">AI 编程助手</h2>
                  <p className="text-xs text-gray-400">
                    复用词元的 API 配置，支持生成、解释、修复和优化当前代码。
                  </p>
                </div>
                <button
                  onClick={() => {
                    assistantAbortRef.current?.abort();
                    setShowAssistant(false);
                  }}
                  className="ml-auto p-2 rounded-xl hover:bg-[#252526] text-gray-400 hover:text-white transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid lg:grid-cols-[360px_minmax(0,1fr)] flex-1 min-h-0">
                <div className="border-r border-[#2f2f2f] p-5 space-y-5 overflow-y-auto">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">动作</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ASSISTANT_ACTIONS.map((item) => {
                        const Icon = item.icon;
                        const active = assistantMode === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setAssistantMode(item.id)}
                            className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${
                              active
                                ? 'border-[var(--gold,#c4a96d)] bg-[var(--gold,#c4a96d)]/10 text-white'
                                : 'border-[#333] hover:border-[#555] text-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">AI 提供商</label>
                      <select
                        value={activeAssistantProvider?.id || assistantProviderId}
                        onChange={(event) => handleAssistantProviderChange(event.target.value)}
                        className="w-full rounded-2xl border border-[#333] bg-[#101010] px-3 py-2.5 text-sm outline-none focus:border-[var(--gold,#c4a96d)]"
                      >
                        {assistantProviders.map((providerOption) => (
                          <option key={providerOption.id} value={providerOption.id}>
                            {providerOption.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs text-gray-400">模型 ID</label>
                      <input
                        list="code-ai-models"
                        value={assistantModel}
                        onChange={(event) => setAssistantModel(event.target.value)}
                        className="w-full rounded-2xl border border-[#333] bg-[#101010] px-3 py-2.5 text-sm font-mono outline-none focus:border-[var(--gold,#c4a96d)]"
                        placeholder="输入或选择模型 ID"
                      />
                      <datalist id="code-ai-models">
                        {(activeAssistantProvider?.models || []).map((modelOption) => (
                          <option key={modelOption.id} value={modelOption.id}>
                            {modelOption.label}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="rounded-2xl border border-[#2d2d2d] bg-[#111] px-3 py-3 text-xs text-gray-400 leading-relaxed">
                      {activeAssistantProvider?.authMode === 'none'
                        ? '当前提供商不需要 API Key，可以直接请求。'
                        : assistantKeys[activeAssistantProvider?.id || '']?.trim()
                          ? '已检测到该提供商的 API Key，会直接复用词元里的配置。'
                          : '当前浏览器还没找到这个提供商的 API Key，请先去词元配置后再用。'}
                      <div className="mt-2">
                        <Link href="/tools/ciyuan" className="text-[var(--gold,#c4a96d)] hover:underline">
                          去词元配置模型与密钥
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">{assistantAction.label}说明</label>
                    <textarea
                      value={assistantPrompt}
                      onChange={(event) => setAssistantPrompt(event.target.value)}
                      placeholder={assistantAction.placeholder}
                      className="w-full min-h-[180px] rounded-2xl border border-[#333] bg-[#101010] px-3 py-3 text-sm resize-none outline-none focus:border-[var(--gold,#c4a96d)] placeholder:text-gray-600"
                    />
                  </div>

                  <button
                    onClick={runAssistant}
                    disabled={assistantLoading || !assistantModel.trim()}
                    className="w-full rounded-2xl bg-[var(--gold,#c4a96d)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {assistantLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        正在思考...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        开始处理
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col min-h-0">
                  <div className="flex items-center gap-2 px-5 py-3 border-b border-[#2f2f2f] bg-[#181818]">
                    <span className="text-sm font-medium">结果</span>
                    <span className="text-xs text-gray-500">
                      AI 会优先返回说明和完整代码，生成结果可直接回填到编辑器。
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={handleAssistantCopy}
                        disabled={!assistantResult.trim()}
                        className="px-3 py-1.5 rounded-xl border border-[#333] text-xs text-gray-300 hover:text-white hover:border-[#555] disabled:opacity-40"
                      >
                        {assistantCopied ? '已复制' : '复制结果'}
                      </button>
                      <button
                        onClick={() => applyAssistantCode('append')}
                        disabled={!assistantResult.trim()}
                        className="px-3 py-1.5 rounded-xl border border-[#333] text-xs text-gray-300 hover:text-white hover:border-[#555] disabled:opacity-40"
                      >
                        追加到编辑器
                      </button>
                      <button
                        onClick={() => applyAssistantCode('replace')}
                        disabled={!assistantResult.trim()}
                        className="px-3 py-1.5 rounded-xl bg-[var(--gold,#c4a96d)] text-xs font-medium text-white disabled:opacity-40"
                      >
                        替换当前代码
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-5">
                    {!assistantResult.trim() && !assistantLoading ? (
                      <div className="h-full flex items-center justify-center text-center text-gray-500 px-8">
                        <div className="space-y-3 max-w-lg">
                          <Bot className="w-10 h-10 mx-auto opacity-40" />
                          <p className="text-sm">
                            选择动作后点击“开始处理”，AI 会结合当前编辑器里的 {lang.label} 代码一起分析。
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-pre:bg-[#0f0f0f] prose-pre:border prose-pre:border-[#2f2f2f] prose-code:text-amber-200 max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {assistantResult || (assistantLoading ? '正在生成结果...' : '')}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
