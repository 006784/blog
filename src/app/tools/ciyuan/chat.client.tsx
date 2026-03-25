'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, User, Send, Plus, Settings, Trash2, ChevronDown,
  Key, X, Check, Copy, RotateCcw, Loader2, MessageSquare,
  Sparkles, ChevronRight,
} from 'lucide-react';

// ── Provider / model config ───────────────────────────────────────────────────
interface ProviderConfig {
  label: string;
  color: string;
  models: { id: string; label: string }[];
}

const PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    label: 'ChatGPT',
    color: '#10a37f',
    models: [
      { id: 'gpt-4o',           label: 'GPT-4o' },
      { id: 'gpt-4o-mini',      label: 'GPT-4o mini' },
      { id: 'gpt-4-turbo',      label: 'GPT-4 Turbo' },
      { id: 'o1-mini',          label: 'o1-mini' },
    ],
  },
  anthropic: {
    label: 'Claude',
    color: '#d4a96a',
    models: [
      { id: 'claude-opus-4-6',          label: 'Claude Opus 4.6' },
      { id: 'claude-sonnet-4-6',        label: 'Claude Sonnet 4.6' },
      { id: 'claude-haiku-4-5-20251001',label: 'Claude Haiku 4.5' },
    ],
  },
  google: {
    label: 'Gemini',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.0-flash',         label: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite',    label: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-1.5-pro',           label: 'Gemini 1.5 Pro' },
    ],
  },
  deepseek: {
    label: 'DeepSeek',
    color: '#536dfe',
    models: [
      { id: 'deepseek-chat',     label: 'DeepSeek V3' },
      { id: 'deepseek-reasoner', label: 'DeepSeek R1' },
    ],
  },
  openrouter: {
    label: 'OpenRouter',
    color: '#6e40c9',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)' },
      { id: 'google/gemma-3-27b-it:free',             label: 'Gemma 3 27B (free)' },
      { id: 'qwen/qwen3-235b-a22b:free',              label: 'Qwen3 235B (free)' },
      { id: 'mistralai/mistral-small-3.2-24b-instruct:free', label: 'Mistral Small (free)' },
    ],
  },
  minimax: {
    label: 'MiniMax',
    color: '#ff6b6b',
    models: [
      { id: 'MiniMax-Text-01', label: 'MiniMax Text-01' },
      { id: 'abab6.5s-chat',   label: 'ABAB 6.5s' },
    ],
  },
  doubao: {
    label: '豆包',
    color: '#1677ff',
    models: [
      { id: 'doubao-pro-32k', label: '豆包 Pro 32k' },
      { id: 'doubao-lite-32k', label: '豆包 Lite 32k' },
    ],
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  streaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  messages: Message[];
  createdAt: number;
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const KEYS_STORAGE = 'ciyuan_api_keys';
const CONVS_STORAGE = 'ciyuan_conversations';

function loadKeys(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEYS_STORAGE) || '{}'); } catch { return {}; }
}
function saveKeys(keys: Record<string, string>) {
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}
function loadConvs(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(CONVS_STORAGE) || '[]'); } catch { return []; }
}
function saveConvs(convs: Conversation[]) {
  localStorage.setItem(CONVS_STORAGE, JSON.stringify(convs));
}
function newId() { return Math.random().toString(36).slice(2, 10); }

// ── Provider dot badge ────────────────────────────────────────────────────────
function ProviderDot({ provider, size = 8 }: { provider: string; size?: number }) {
  const color = PROVIDERS[provider]?.color ?? '#888';
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />;
}

// ── Markdown message ──────────────────────────────────────────────────────────
function MsgContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const isBlock = !!match;
          if (isBlock) {
            return (
              <pre className="rounded-lg bg-[var(--paper-deep)] border border-[var(--line)] p-3 overflow-x-auto text-xs my-2">
                <code className={className} {...props}>{children}</code>
              </pre>
            );
          }
          return <code className="bg-[var(--paper-deep)] px-1 py-0.5 rounded text-[0.85em]" {...props}>{children}</code>;
        },
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--gold)] pl-3 my-2 text-muted-foreground">{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────
function SettingsModal({ onClose }: { onClose: () => void }) {
  const [keys, setKeys] = useState<Record<string, string>>(loadKeys);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveKeys(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl z-10 overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <span className="font-semibold">API 密钥设置</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--paper-deep)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-xs text-muted-foreground">密钥仅存储在您的浏览器本地，不会上传至服务器。</p>
          {Object.entries(PROVIDERS).map(([pid, cfg]) => (
            <div key={pid}>
              <label className="flex items-center gap-2 text-xs font-medium mb-1.5">
                <ProviderDot provider={pid} />
                {cfg.label}
              </label>
              <input
                type="password"
                placeholder={`输入 ${cfg.label} API Key…`}
                value={keys[pid] ?? ''}
                onChange={e => setKeys(k => ({ ...k, [pid]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
              />
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-[var(--line)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--paper-deep)] transition-colors">
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
            {saved ? '已保存' : '保存'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Model selector dropdown ───────────────────────────────────────────────────
function ModelSelector({
  provider, model,
  onProviderChange, onModelChange,
}: {
  provider: string; model: string;
  onProviderChange: (p: string) => void; onModelChange: (m: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const cfg = PROVIDERS[provider];
  const modelLabel = cfg?.models.find(m => m.id === model)?.label ?? model;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--gold)] transition-colors text-sm"
      >
        <ProviderDot provider={provider} />
        <span className="font-medium">{cfg?.label}</span>
        <span className="text-muted-foreground hidden sm:inline">· {modelLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 z-50 w-72 rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl overflow-hidden"
          >
            <div className="p-2 space-y-0.5 max-h-80 overflow-y-auto">
              {Object.entries(PROVIDERS).map(([pid, pcfg]) => (
                <div key={pid}>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    <ProviderDot provider={pid} />
                    {pcfg.label}
                  </div>
                  {pcfg.models.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { onProviderChange(pid); onModelChange(m.id); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        pid === provider && m.id === model
                          ? 'bg-[var(--paper-deep)] font-medium'
                          : 'hover:bg-[var(--paper-deep)] text-muted-foreground'
                      }`}
                    >
                      <ChevronRight className="w-3 h-3 opacity-30" />
                      {m.label}
                      {pid === provider && m.id === model && (
                        <Check className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--gold)' }} />
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CiyuanChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [provider, setProvider] = useState('deepseek');
  const [model, setModel] = useState('deepseek-chat');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const convs = loadConvs();
    setConversations(convs);
    if (convs.length > 0) setActiveId(convs[0].id);
  }, []);

  const activeConv = conversations.find(c => c.id === activeId) ?? null;

  const persistConvs = useCallback((convs: Conversation[]) => {
    setConversations(convs);
    saveConvs(convs);
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  const newChat = useCallback(() => {
    const id = newId();
    const conv: Conversation = {
      id,
      title: '新对话',
      provider,
      model,
      messages: [],
      createdAt: Date.now(),
    };
    persistConvs([conv, ...conversations]);
    setActiveId(id);
  }, [conversations, persistConvs, provider, model]);

  const deleteConv = useCallback((id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    persistConvs(updated);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  }, [conversations, persistConvs, activeId]);

  const updateConv = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations(prev => {
      const updated = prev.map(c => c.id === id ? updater(c) : c);
      saveConvs(updated);
      return updated;
    });
  }, []);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const keys = loadKeys();
    const apiKey = keys[provider];
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMsg: Message = { id: newId(), role: 'user', content: input.trim() };
    setInput('');

    // Ensure conversation exists
    let convId = activeId;
    let convTitle = userMsg.content.slice(0, 30);
    if (!convId) {
      convId = newId();
      const conv: Conversation = {
        id: convId,
        title: convTitle,
        provider,
        model,
        messages: [],
        createdAt: Date.now(),
      };
      setActiveId(convId);
      persistConvs([conv, ...conversations]);
    }

    const assistantId = newId();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', streaming: true };

    // Add user + empty assistant message
    updateConv(convId, c => ({
      ...c,
      title: c.messages.length === 0 ? convTitle : c.title,
      messages: [...c.messages, userMsg, assistantMsg],
    }));

    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const conv = conversations.find(c => c.id === convId);
      const history = conv?.messages ?? [];

      const res = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
          messages: [
            ...history.filter(m => !m.streaming).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg.content },
          ],
        }),
        signal: abortRef.current.signal,
      });

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const j = JSON.parse(line.slice(6));
            if (j.text) {
              full += j.text;
              updateConv(convId!, c => ({
                ...c,
                messages: c.messages.map(m =>
                  m.id === assistantId ? { ...m, content: full } : m
                ),
              }));
            }
            if (j.done) break;
          } catch {}
        }
      }

      // Mark streaming done
      updateConv(convId!, c => ({
        ...c,
        messages: c.messages.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        ),
      }));
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        updateConv(convId!, c => ({
          ...c,
          messages: c.messages.map(m =>
            m.id === assistantId
              ? { ...m, content: `[错误] ${err}`, streaming: false }
              : m
          ),
        }));
      }
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, provider, model, activeId, conversations, persistConvs, updateConv]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const copyMsg = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const stopStream = () => { abortRef.current?.abort(); };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--paper)]">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-[var(--line)] flex flex-col overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--line)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                <span className="font-bold text-sm tracking-wide">词元</span>
              </div>
              <button
                onClick={newChat}
                className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors"
                title="新对话"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>还没有对话</p>
                  <p>点击 + 开始</p>
                </div>
              ) : (
                conversations.map(c => (
                  <div
                    key={c.id}
                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      c.id === activeId
                        ? 'bg-[var(--paper-deep)]'
                        : 'hover:bg-[var(--paper-deep)]'
                    }`}
                    onClick={() => { setActiveId(c.id); setProvider(c.provider); setModel(c.model); }}
                  >
                    <ProviderDot provider={c.provider} size={6} />
                    <span className="flex-1 text-xs truncate">{c.title}</span>
                    <button
                      onClick={e => { e.stopPropagation(); deleteConv(c.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Settings button */}
            <div className="px-4 py-3 border-t border-[var(--line)]">
              <button
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-sm text-muted-foreground"
              >
                <Key className="w-4 h-4" />
                <span>API 密钥设置</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--line)] bg-[var(--paper)]">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <ModelSelector
            provider={provider}
            model={model}
            onProviderChange={p => {
              setProvider(p);
              setModel(PROVIDERS[p].models[0].id);
            }}
            onModelChange={setModel}
          />

          <div className="ml-auto flex items-center gap-2">
            {activeConv && (
              <button
                onClick={() => {
                  if (confirm('清空此对话？')) {
                    updateConv(activeConv.id, c => ({ ...c, messages: [], title: '新对话' }));
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground"
                title="清空对话"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl border border-[var(--line)] flex items-center justify-center mx-auto"
                  style={{ background: 'var(--paper-deep)' }}>
                  <Sparkles className="w-8 h-8" style={{ color: 'var(--gold)' }} />
                </div>
                <h2 className="text-2xl font-bold">词元 AI</h2>
                <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
                  支持 ChatGPT、Claude、Gemini、DeepSeek、MiniMax、豆包、OpenRouter
                  等多种模型。使用前请在设置中添加对应的 API 密钥。
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {Object.entries(PROVIDERS).map(([pid, cfg]) => (
                    <button
                      key={pid}
                      onClick={() => { setProvider(pid); setModel(cfg.models[0].id); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs ${
                        pid === provider
                          ? 'border-[var(--gold)] text-[var(--gold)]'
                          : 'border-[var(--line)] text-muted-foreground hover:border-[var(--gold)]'
                      }`}
                    >
                      <ProviderDot provider={pid} size={6} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            activeConv.messages.filter(m => m.role !== 'system').map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-[var(--line)] ${
                  msg.role === 'user' ? 'bg-[var(--paper-deep)]' : ''
                }`}
                  style={msg.role === 'assistant' ? { background: PROVIDERS[activeConv.provider]?.color + '20' } : {}}
                >
                  {msg.role === 'user'
                    ? <User className="w-4 h-4" />
                    : <Bot className="w-4 h-4" style={{ color: PROVIDERS[activeConv.provider]?.color }} />
                  }
                </div>

                {/* Bubble */}
                <div className={`group max-w-[75%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[var(--ink)] text-[var(--paper)] rounded-tr-sm'
                      : 'bg-[var(--paper-deep)] border border-[var(--line)] rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <>
                        {msg.content ? <MsgContent content={msg.content} /> : null}
                        {msg.streaming && (
                          <span className="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!msg.streaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                      <button
                        onClick={() => copyMsg(msg.id, msg.content)}
                        className="p-1 rounded hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground"
                        title="复制"
                      >
                        {copied === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="px-4 pb-4 pt-2 border-t border-[var(--line)]">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--paper-deep)] px-4 py-3 focus-within:border-[var(--gold)] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息… (Enter 发送，Shift+Enter 换行)"
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed max-h-44 overflow-y-auto"
                style={{ minHeight: '1.5rem' }}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                {streaming ? (
                  <button
                    onClick={stopStream}
                    className="p-2 rounded-xl transition-colors hover:bg-red-100 text-red-500"
                    title="停止"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </button>
                ) : (
                  <button
                    onClick={send}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl transition-colors disabled:opacity-30"
                    style={{ background: input.trim() ? 'var(--gold)' : undefined, color: input.trim() ? '#fff' : undefined }}
                    title="发送"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">
              AI 生成内容仅供参考，请自行判断准确性
            </p>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      <AnimatePresence>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}
