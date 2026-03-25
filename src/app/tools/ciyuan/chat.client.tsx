'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Send,
  Plus,
  Settings,
  Trash2,
  ChevronDown,
  Key,
  X,
  Check,
  Copy,
  RotateCcw,
  Loader2,
  MessageSquare,
  Sparkles,
  PlugZap,
  Pencil,
} from 'lucide-react';
import type {
  CiyuanAuthMode,
  CiyuanModelPlacement,
  CiyuanProtocol,
  CiyuanProviderConfig,
} from '@/lib/ciyuan-providers';
import {
  BUILTIN_CIYUAN_PROVIDERS,
  buildCiyuanProviderMap,
  createProviderId,
  getDefaultCiyuanProviderId,
  getDefaultModelId,
} from '@/lib/ciyuan-providers';

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
  providerLabel?: string;
  providerColor?: string;
  messages: Message[];
  createdAt: number;
}

const KEYS_STORAGE = 'ciyuan_api_keys';
const CONVS_STORAGE = 'ciyuan_conversations';
const CUSTOM_PROVIDERS_STORAGE = 'ciyuan_custom_providers_v2';

function loadKeys(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEYS_STORAGE) || '{}');
  } catch {
    return {};
  }
}

function saveKeys(keys: Record<string, string>) {
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

function loadConvs(): Conversation[] {
  try {
    return JSON.parse(localStorage.getItem(CONVS_STORAGE) || '[]');
  } catch {
    return [];
  }
}

function saveConvs(convs: Conversation[]) {
  localStorage.setItem(CONVS_STORAGE, JSON.stringify(convs));
}

function loadCustomProviders(): CiyuanProviderConfig[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_PROVIDERS_STORAGE) || '[]');
  } catch {
    return [];
  }
}

function saveCustomProviders(providers: CiyuanProviderConfig[]) {
  localStorage.setItem(CUSTOM_PROVIDERS_STORAGE, JSON.stringify(providers));
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function getFallbackColor(index: number) {
  const palette = ['#5b8def', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
  return palette[index % palette.length];
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, '');
}

function normalizeEndpointPath(path: string) {
  if (!path.trim()) return '';
  const trimmed = path.trim();
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function defaultEndpointPath(protocol: CiyuanProtocol) {
  if (protocol === 'anthropic') return '/messages';
  if (protocol === 'gemini') return '/models/{model}:streamGenerateContent';
  if (protocol === 'minimax') return '/text/chatcompletion_v2';
  return '/chat/completions';
}

function defaultAuthMode(protocol: CiyuanProtocol): CiyuanAuthMode {
  if (protocol === 'anthropic') return 'header';
  if (protocol === 'gemini') return 'query';
  return 'bearer';
}

function defaultAuthKeyName(protocol: CiyuanProtocol, authMode: CiyuanAuthMode) {
  if (authMode === 'header') {
    if (protocol === 'anthropic') return 'x-api-key';
    return 'x-api-key';
  }
  if (authMode === 'query') return 'key';
  return '';
}

function defaultModelPlacement(protocol: CiyuanProtocol): CiyuanModelPlacement {
  if (protocol === 'gemini') return 'url';
  return 'body';
}

function parseModelsInput(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, label] = line.split('|').map((part) => part.trim());
      return { id, label: label || id };
    });
}

function modelsToText(models: { id: string; label: string }[]) {
  return models.map((model) => (model.label === model.id ? model.id : `${model.id} | ${model.label}`)).join('\n');
}

function ProviderDot({ provider, size = 8 }: { provider?: CiyuanProviderConfig | null; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: provider?.color ?? '#888',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}

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
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          }
          return (
            <code className="bg-[var(--paper-deep)] px-1 py-0.5 rounded text-[0.85em]" {...props}>
              {children}
            </code>
          );
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

type CustomProviderForm = {
  id: string | null;
  label: string;
  protocol: CiyuanProtocol;
  baseUrl: string;
  endpointPath: string;
  authMode: CiyuanAuthMode;
  authKeyName: string;
  modelPlacement: CiyuanModelPlacement;
  modelsText: string;
  color: string;
  apiKey: string;
};

function createEmptyCustomProviderForm(index: number): CustomProviderForm {
  const protocol: CiyuanProtocol = 'openai';
  const authMode = defaultAuthMode(protocol);
  return {
    id: null,
    label: '',
    protocol,
    baseUrl: '',
    endpointPath: defaultEndpointPath(protocol),
    authMode,
    authKeyName: defaultAuthKeyName(protocol, authMode),
    modelPlacement: defaultModelPlacement(protocol),
    modelsText: '',
    color: getFallbackColor(index),
    apiKey: '',
  };
}

function createFormFromProvider(provider: CiyuanProviderConfig, apiKey: string) {
  return {
    id: provider.id,
    label: provider.label,
    protocol: provider.protocol,
    baseUrl: provider.baseUrl,
    endpointPath: provider.endpointPath || defaultEndpointPath(provider.protocol),
    authMode: provider.authMode,
    authKeyName: provider.authKeyName || defaultAuthKeyName(provider.protocol, provider.authMode),
    modelPlacement: provider.modelPlacement || defaultModelPlacement(provider.protocol),
    modelsText: modelsToText(provider.models),
    color: provider.color,
    apiKey,
  };
}

function SettingsModal({
  customProviders,
  onSave,
  onClose,
}: {
  customProviders: CiyuanProviderConfig[];
  onSave: (keys: Record<string, string>, providers: CiyuanProviderConfig[]) => void;
  onClose: () => void;
}) {
  const [keys, setKeys] = useState<Record<string, string>>(loadKeys);
  const [draftProviders, setDraftProviders] = useState<CiyuanProviderConfig[]>(customProviders);
  const [saved, setSaved] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomProviderForm>(() =>
    createEmptyCustomProviderForm(customProviders.length)
  );
  const [editingError, setEditingError] = useState('');

  useEffect(() => {
    setDraftProviders(customProviders);
  }, [customProviders]);

  const resetForm = useCallback(() => {
    setEditingForm(createEmptyCustomProviderForm(draftProviders.length));
    setEditingError('');
  }, [draftProviders.length]);

  const handleProtocolChange = (protocol: CiyuanProtocol) => {
    const authMode = defaultAuthMode(protocol);
    setEditingForm((current) => ({
      ...current,
      protocol,
      authMode,
      authKeyName: defaultAuthKeyName(protocol, authMode),
      endpointPath:
        current.endpointPath === defaultEndpointPath(current.protocol) || !current.endpointPath
          ? defaultEndpointPath(protocol)
          : current.endpointPath,
      modelPlacement: defaultModelPlacement(protocol),
    }));
  };

  const upsertCustomProvider = () => {
    if (!editingForm.label.trim()) {
      setEditingError('请填写提供商名称');
      return;
    }
    if (!editingForm.baseUrl.trim()) {
      setEditingError('请填写 Base URL');
      return;
    }

    const models = parseModelsInput(editingForm.modelsText);
    const providerId = editingForm.id || createProviderId(editingForm.label);
    const provider: CiyuanProviderConfig = {
      id: providerId,
      label: editingForm.label.trim(),
      color: editingForm.color.trim() || getFallbackColor(draftProviders.length),
      protocol: editingForm.protocol,
      baseUrl: normalizeBaseUrl(editingForm.baseUrl),
      endpointPath: normalizeEndpointPath(editingForm.endpointPath || defaultEndpointPath(editingForm.protocol)),
      authMode: editingForm.authMode,
      authKeyName:
        editingForm.authMode === 'header' || editingForm.authMode === 'query'
          ? (editingForm.authKeyName.trim() || defaultAuthKeyName(editingForm.protocol, editingForm.authMode))
          : undefined,
      modelPlacement: editingForm.modelPlacement,
      models: models.length > 0 ? models : [{ id: 'custom-model', label: 'custom-model' }],
      builtin: false,
      keyPlaceholder:
        editingForm.authMode === 'none'
          ? ''
          : editingForm.authMode === 'bearer'
            ? 'Bearer Key'
            : `${editingForm.authKeyName || defaultAuthKeyName(editingForm.protocol, editingForm.authMode)}...`,
    };

    setDraftProviders((prev) => {
      const next = prev.some((item) => item.id === providerId)
        ? prev.map((item) => (item.id === providerId ? provider : item))
        : [...prev, provider];
      return next;
    });

    setKeys((prev) => ({
      ...prev,
      [providerId]: editingForm.apiKey,
    }));

    resetForm();
  };

  const editCustomProvider = (provider: CiyuanProviderConfig) => {
    setEditingForm(createFormFromProvider(provider, keys[provider.id] || ''));
    setEditingError('');
  };

  const removeCustomProvider = (providerId: string) => {
    setDraftProviders((prev) => prev.filter((provider) => provider.id !== providerId));
    setKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    if (editingForm.id === providerId) {
      resetForm();
    }
  };

  const handleSaveAll = () => {
    onSave(keys, draftProviders);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const builtInProviders = BUILTIN_CIYUAN_PROVIDERS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="relative z-10 w-full max-w-5xl rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <PlugZap className="w-4 h-4" style={{ color: 'var(--gold)' }} />
            <div>
              <p className="font-semibold">词元 AI 接入设置</p>
              <p className="text-xs text-muted-foreground">内置主流厂商，也支持新增自定义 API 提供商</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--paper-deep)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.9fr] max-h-[75vh] overflow-hidden">
          <div className="p-6 overflow-y-auto space-y-6 border-b lg:border-b-0 lg:border-r border-[var(--line)]">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold">内置 AI 提供商</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  主流 AI 已内置，通常只需要填写对应 API Key；模型 ID 也可以在主界面自由修改。
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {builtInProviders.map((provider) => (
                  <div key={provider.id} className="rounded-xl border border-[var(--line)] bg-[var(--paper-deep)]/35 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ProviderDot provider={provider} />
                      <span className="font-medium text-sm">{provider.label}</span>
                      <span className="ml-auto text-[11px] text-muted-foreground">
                        {provider.protocol.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground break-all">
                      {provider.baseUrl}
                      {provider.endpointPath}
                    </div>

                    {provider.authMode === 'none' ? (
                      <div className="rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-xs text-muted-foreground">
                        此提供商默认无需 API Key
                      </div>
                    ) : (
                      <input
                        type="password"
                        placeholder={provider.keyPlaceholder || `输入 ${provider.label} API Key`}
                        value={keys[provider.id] ?? ''}
                        onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">自定义提供商</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    这里可以接入任意 OpenAI 兼容、Claude、Gemini、MiniMax 或本地代理接口。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 rounded-lg border border-[var(--line)] text-xs hover:border-[var(--gold)] transition-colors"
                >
                  新增自定义
                </button>
              </div>

              {draftProviders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line)] px-4 py-6 text-sm text-muted-foreground text-center">
                  还没有自定义提供商
                </div>
              ) : (
                <div className="space-y-3">
                  {draftProviders.map((provider) => (
                    <div key={provider.id} className="rounded-xl border border-[var(--line)] p-4 space-y-3">
                      <div className="flex items-start gap-2">
                        <ProviderDot provider={provider} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{provider.label}</span>
                            <span className="text-[11px] text-muted-foreground">{provider.protocol.toUpperCase()}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground break-all mt-1">
                            {provider.baseUrl}
                            {provider.endpointPath}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editCustomProvider(provider)}
                            className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomProvider(provider.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {provider.authMode === 'none' ? (
                        <div className="rounded-lg border border-dashed border-[var(--line)] px-3 py-2 text-xs text-muted-foreground">
                          此提供商配置为无需 API Key
                        </div>
                      ) : (
                        <input
                          type="password"
                          placeholder={provider.keyPlaceholder || '输入 API Key'}
                          value={keys[provider.id] ?? ''}
                          onChange={(e) => setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <h3 className="text-sm font-semibold">{editingForm.id ? '编辑提供商' : '新增提供商'}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                可用于接入 OpenAI 兼容接口、本地代理、Azure 风格路径或其他自建网关。
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5">名称</label>
                <input
                  value={editingForm.label}
                  onChange={(e) => setEditingForm((current) => ({ ...current, label: e.target.value }))}
                  placeholder="例如：Azure OpenAI / 公司内网网关"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1.5">协议</label>
                  <select
                    value={editingForm.protocol}
                    onChange={(e) => handleProtocolChange(e.target.value as CiyuanProtocol)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors"
                  >
                    <option value="openai">OpenAI 兼容</option>
                    <option value="anthropic">Anthropic Messages</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="minimax">MiniMax</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">颜色</label>
                  <input
                    type="color"
                    value={editingForm.color}
                    onChange={(e) => setEditingForm((current) => ({ ...current, color: e.target.value }))}
                    className="w-full h-[42px] rounded-lg border border-[var(--line)] bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Base URL</label>
                <input
                  value={editingForm.baseUrl}
                  onChange={(e) => setEditingForm((current) => ({ ...current, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5">Endpoint Path</label>
                <input
                  value={editingForm.endpointPath}
                  onChange={(e) => setEditingForm((current) => ({ ...current, endpointPath: e.target.value }))}
                  placeholder={defaultEndpointPath(editingForm.protocol)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  可用 <code>{'{model}'}</code> 占位符，例如 Gemini 或 Azure 风格路径。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium mb-1.5">鉴权方式</label>
                  <select
                    value={editingForm.authMode}
                    onChange={(e) => {
                      const authMode = e.target.value as CiyuanAuthMode;
                      setEditingForm((current) => ({
                        ...current,
                        authMode,
                        authKeyName:
                          authMode === 'header' || authMode === 'query'
                            ? (current.authKeyName || defaultAuthKeyName(current.protocol, authMode))
                            : '',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors"
                  >
                    <option value="bearer">Authorization: Bearer</option>
                    <option value="header">自定义 Header</option>
                    <option value="query">URL Query</option>
                    <option value="none">无需鉴权</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5">模型位置</label>
                  <select
                    value={editingForm.modelPlacement}
                    onChange={(e) => setEditingForm((current) => ({ ...current, modelPlacement: e.target.value as CiyuanModelPlacement }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors"
                  >
                    <option value="body">请求体</option>
                    <option value="url">仅 URL</option>
                    <option value="both">URL + 请求体</option>
                  </select>
                </div>
              </div>

              {(editingForm.authMode === 'header' || editingForm.authMode === 'query') && (
                <div>
                  <label className="block text-xs font-medium mb-1.5">
                    {editingForm.authMode === 'header' ? 'Header 名称' : 'Query 名称'}
                  </label>
                  <input
                    value={editingForm.authKeyName}
                    onChange={(e) => setEditingForm((current) => ({ ...current, authKeyName: e.target.value }))}
                    placeholder={defaultAuthKeyName(editingForm.protocol, editingForm.authMode)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5">建议模型列表</label>
                <textarea
                  value={editingForm.modelsText}
                  onChange={(e) => setEditingForm((current) => ({ ...current, modelsText: e.target.value }))}
                  rows={6}
                  placeholder={`gpt-4.1\nqwen-plus | 通义千问 Plus\nmy-company-model`}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono resize-none"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  一行一个模型，支持 <code>模型ID | 显示名称</code> 格式。
                </p>
              </div>

              {editingForm.authMode !== 'none' && (
                <div>
                  <label className="block text-xs font-medium mb-1.5">API Key</label>
                  <input
                    type="password"
                    value={editingForm.apiKey}
                    onChange={(e) => setEditingForm((current) => ({ ...current, apiKey: e.target.value }))}
                    placeholder="只保存在当前浏览器"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--line)] bg-transparent text-sm focus:border-[var(--gold)] outline-none transition-colors font-mono"
                  />
                </div>
              )}

              {editingError && <p className="text-xs text-red-500">{editingError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={upsertCustomProvider}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--gold)', color: '#fff' }}
                >
                  {editingForm.id ? '更新提供商' : '添加提供商'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg text-sm border border-[var(--line)] hover:border-[var(--gold)] transition-colors"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--line)] flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-[var(--paper-deep)] transition-colors">
            关闭
          </button>
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            style={{ background: 'var(--gold)', color: '#fff' }}
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
            {saved ? '已保存' : '保存全部设置'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProviderSelector({
  providers,
  providerId,
  onProviderChange,
}: {
  providers: CiyuanProviderConfig[];
  providerId: string;
  onProviderChange: (providerId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeProvider = providers.find((provider) => provider.id === providerId) || providers[0];
  const builtinProviders = providers.filter((provider) => provider.builtin !== false);
  const customProviders = providers.filter((provider) => provider.builtin === false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--line)] hover:border-[var(--gold)] transition-colors text-sm"
      >
        <ProviderDot provider={activeProvider} />
        <span className="font-medium">{activeProvider?.label ?? '选择提供商'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 left-0 z-50 w-80 rounded-xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl overflow-hidden"
          >
            <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  内置提供商
                </div>
                {builtinProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      onProviderChange(provider.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      provider.id === providerId ? 'bg-[var(--paper-deep)] font-medium' : 'hover:bg-[var(--paper-deep)] text-muted-foreground'
                    }`}
                  >
                    <ProviderDot provider={provider} />
                    <span className="flex-1 text-left">{provider.label}</span>
                    <span className="text-[11px] opacity-60">{provider.protocol.toUpperCase()}</span>
                    {provider.id === providerId && <Check className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />}
                  </button>
                ))}
              </div>

              {customProviders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground">
                    <PlugZap className="w-3.5 h-3.5" />
                    自定义提供商
                  </div>
                  {customProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        onProviderChange(provider.id);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        provider.id === providerId ? 'bg-[var(--paper-deep)] font-medium' : 'hover:bg-[var(--paper-deep)] text-muted-foreground'
                      }`}
                    >
                      <ProviderDot provider={provider} />
                      <span className="flex-1 text-left">{provider.label}</span>
                      <span className="text-[11px] opacity-60">{provider.protocol.toUpperCase()}</span>
                      {provider.id === providerId && <Check className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CiyuanChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customProviders, setCustomProviders] = useState<CiyuanProviderConfig[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [provider, setProvider] = useState(getDefaultCiyuanProviderId());
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const providersMap = useMemo(() => buildCiyuanProviderMap(customProviders), [customProviders]);
  const providers = useMemo(
    () => [...BUILTIN_CIYUAN_PROVIDERS, ...customProviders],
    [customProviders]
  );
  const activeProvider = providersMap[provider] ?? providers[0] ?? null;
  const activeConv = conversations.find((conversation) => conversation.id === activeId) ?? null;

  useEffect(() => {
    const loadedProviders = loadCustomProviders();
    setCustomProviders(loadedProviders);

    const loadedConversations = loadConvs();
    setConversations(loadedConversations);
    if (loadedConversations.length > 0) {
      const first = loadedConversations[0];
      setActiveId(first.id);
      setProvider(first.provider);
      setModel(first.model);
    }
  }, []);

  useEffect(() => {
    if (!activeProvider && providers.length > 0) {
      setProvider(providers[0].id);
      setModel((current) => current || getDefaultModelId(providers[0]));
      return;
    }
    if (activeProvider && !model) {
      setModel(getDefaultModelId(activeProvider));
    }
  }, [activeProvider, model, providers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [input]);

  const persistConversations = useCallback((nextConversations: Conversation[]) => {
    setConversations(nextConversations);
    saveConvs(nextConversations);
  }, []);

  const updateConversation = useCallback((conversationId: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((current) => {
      const next = current.map((conversation) => (
        conversation.id === conversationId ? updater(conversation) : conversation
      ));
      saveConvs(next);
      return next;
    });
  }, []);

  const handleProviderChange = (providerId: string) => {
    const nextProvider = providersMap[providerId];
    setProvider(providerId);
    if (!nextProvider) return;
    setModel(getDefaultModelId(nextProvider));
  };

  const createConversationSnapshot = useCallback((conversationId: string, title: string): Conversation => ({
    id: conversationId,
    title,
    provider,
    model,
    providerLabel: activeProvider?.label,
    providerColor: activeProvider?.color,
    messages: [],
    createdAt: Date.now(),
  }), [activeProvider?.color, activeProvider?.label, model, provider]);

  const newChat = useCallback(() => {
    const conversationId = newId();
    const conversation = createConversationSnapshot(conversationId, '新对话');
    persistConversations([conversation, ...conversations]);
    setActiveId(conversationId);
  }, [conversations, createConversationSnapshot, persistConversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    const next = conversations.filter((conversation) => conversation.id !== conversationId);
    persistConversations(next);
    if (activeId === conversationId) {
      const fallback = next[0];
      setActiveId(fallback?.id ?? null);
      if (fallback) {
        setProvider(fallback.provider);
        setModel(fallback.model);
      }
    }
  }, [activeId, conversations, persistConversations]);

  const send = useCallback(async () => {
    if (!input.trim() || streaming || !activeProvider) return;

    const keys = loadKeys();
    const apiKey = keys[activeProvider.id] || '';
    if (activeProvider.authMode !== 'none' && !apiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage: Message = { id: newId(), role: 'user', content: input.trim() };
    setInput('');

    let conversationId = activeId;
    const conversationTitle = userMessage.content.slice(0, 30);

    if (!conversationId) {
      conversationId = newId();
      const newConversation = createConversationSnapshot(conversationId, conversationTitle);
      setActiveId(conversationId);
      persistConversations([newConversation, ...conversations]);
    }

    const assistantId = newId();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.messages.length === 0 ? conversationTitle : conversation.title,
      provider,
      model,
      providerLabel: activeProvider.label,
      providerColor: activeProvider.color,
      messages: [...conversation.messages, userMessage, assistantMessage],
    }));

    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const existingConversation = conversations.find((conversation) => conversation.id === conversationId);
      const history = existingConversation?.messages ?? [];

      const response = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider,
          providerConfig: activeProvider,
          model,
          apiKey,
          messages: [
            ...history.filter((message) => !message.streaming).map((message) => ({
              role: message.role,
              content: message.content,
            })),
            { role: 'user', content: userMessage.content },
          ],
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`请求失败 (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

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
              full += payload.text;
              updateConversation(conversationId, (conversation) => ({
                ...conversation,
                messages: conversation.messages.map((message) => (
                  message.id === assistantId ? { ...message, content: full } : message
                )),
              }));
            }
            if (payload.done) break;
          } catch {
            // ignore invalid SSE chunks
          }
        }
      }

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) => (
          message.id === assistantId ? { ...message, streaming: false } : message
        )),
      }));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        updateConversation(conversationId, (conversation) => ({
          ...conversation,
          messages: conversation.messages.map((message) => (
            message.id === assistantId
              ? { ...message, content: `[错误] ${error instanceof Error ? error.message : String(error)}`, streaming: false }
              : message
          )),
        }));
      }
    } finally {
      setStreaming(false);
    }
  }, [
    activeId,
    activeProvider,
    conversations,
    createConversationSnapshot,
    input,
    model,
    persistConversations,
    provider,
    streaming,
    updateConversation,
  ]);

  const stopStream = () => {
    abortRef.current?.abort();
  };

  const copyMessage = (messageId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(messageId);
    setTimeout(() => setCopied(null), 1200);
  };

  const handleSettingsSave = (keys: Record<string, string>, providersToSave: CiyuanProviderConfig[]) => {
    saveKeys(keys);
    saveCustomProviders(providersToSave);
    setCustomProviders(providersToSave);
    setShowSettings(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--paper)]">
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-[var(--line)] flex flex-col overflow-hidden"
          >
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

            <div className="px-4 py-3 border-b border-[var(--line)] space-y-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-sm text-muted-foreground border border-[var(--line)]"
              >
                <Key className="w-4 h-4" />
                <span>模型 / API 设置</span>
              </button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                已内置主流 AI 服务，也可以新增任意兼容 API 提供商。
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>还没有对话</p>
                  <p>点击 + 开始</p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const conversationProvider = providersMap[conversation.provider];
                  const dotProvider = conversationProvider || {
                    id: conversation.provider,
                    label: conversation.providerLabel || conversation.provider,
                    color: conversation.providerColor || '#888',
                    protocol: 'openai' as const,
                    baseUrl: '',
                    authMode: 'bearer' as const,
                    models: [],
                  };

                  return (
                    <div
                      key={conversation.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        conversation.id === activeId ? 'bg-[var(--paper-deep)]' : 'hover:bg-[var(--paper-deep)]'
                      }`}
                      onClick={() => {
                        setActiveId(conversation.id);
                        setProvider(conversation.provider);
                        setModel(conversation.model);
                      }}
                    >
                      <ProviderDot provider={dotProvider} size={6} />
                      <span className="flex-1 text-xs truncate">{conversation.title}</span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteConversation(conversation.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[var(--line)] bg-[var(--paper)]">
          <button
            onClick={() => setSidebarOpen((current) => !current)}
            className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors"
            title={sidebarOpen ? '收起侧栏' : '展开侧栏'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <ProviderSelector
            providers={providers}
            providerId={provider}
            onProviderChange={handleProviderChange}
          />

          <div className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-1.5 min-w-[260px] max-w-full">
            <span className="text-xs text-muted-foreground whitespace-nowrap">模型</span>
            <input
              list="ciyuan-model-options"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="min-w-0 flex-1 bg-transparent outline-none text-sm font-mono"
              placeholder="输入或选择模型 ID"
            />
            <datalist id="ciyuan-model-options">
              {(activeProvider?.models || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </datalist>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {activeConv && (
              <button
                onClick={() => {
                  if (confirm('清空此对话？')) {
                    updateConversation(activeConv.id, (conversation) => ({
                      ...conversation,
                      messages: [],
                      title: '新对话',
                    }));
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

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div
                  className="w-16 h-16 rounded-2xl border border-[var(--line)] flex items-center justify-center mx-auto"
                  style={{ background: 'var(--paper-deep)' }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: 'var(--gold)' }} />
                </div>
                <h2 className="text-2xl font-bold">词元 AI</h2>
                <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
                  已内置 OpenAI、Claude、Gemini、DeepSeek、OpenRouter、Groq、Kimi、通义、SiliconFlow、
                  Mistral、Together、Fireworks、豆包、MiniMax、Ollama 等接口，也支持你在设置里新增任意兼容 API。
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {providers.map((providerOption) => (
                    <button
                      key={providerOption.id}
                      onClick={() => handleProviderChange(providerOption.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs ${
                        providerOption.id === provider
                          ? 'border-[var(--gold)] text-[var(--gold)]'
                          : 'border-[var(--line)] text-muted-foreground hover:border-[var(--gold)]'
                      }`}
                    >
                      <ProviderDot provider={providerOption} size={6} />
                      {providerOption.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            activeConv.messages.filter((message) => message.role !== 'system').map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border border-[var(--line)] ${
                    message.role === 'user' ? 'bg-[var(--paper-deep)]' : ''
                  }`}
                  style={message.role === 'assistant' ? { background: `${activeProvider?.color ?? '#888'}20` } : {}}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" style={{ color: activeProvider?.color }} />
                  )}
                </div>

                <div className={`group max-w-[75%] space-y-1 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-[var(--ink)] text-[var(--paper)] rounded-tr-sm'
                        : 'bg-[var(--paper-deep)] border border-[var(--line)] rounded-tl-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <>
                        {message.content ? <MsgContent content={message.content} /> : null}
                        {message.streaming && (
                          <span className="inline-block w-1.5 h-4 bg-current opacity-70 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {!message.streaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                      <button
                        onClick={() => copyMessage(message.id, message.content)}
                        className="p-1 rounded hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground"
                        title="复制"
                      >
                        {copied === message.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 pb-4 pt-2 border-t border-[var(--line)]">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--paper-deep)] px-4 py-3 focus-within:border-[var(--gold)] transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
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
                    disabled={!input.trim() || !model.trim()}
                    className="p-2 rounded-xl transition-colors disabled:opacity-30"
                    style={{
                      background: input.trim() && model.trim() ? 'var(--gold)' : undefined,
                      color: input.trim() && model.trim() ? '#fff' : undefined,
                    }}
                    title="发送"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2 opacity-70">
              API Key 与自定义提供商配置仅保存在当前浏览器。模型 ID 支持手填，方便接入最新模型或自建网关。
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            customProviders={customProviders}
            onSave={handleSettingsSave}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
