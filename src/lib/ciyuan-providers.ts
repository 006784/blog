export type CiyuanProtocol = 'openai' | 'anthropic' | 'gemini' | 'minimax';
export type CiyuanAuthMode = 'bearer' | 'header' | 'query' | 'none';
export type CiyuanModelPlacement = 'body' | 'url' | 'both';

export interface CiyuanModelOption {
  id: string;
  label: string;
}

export interface CiyuanProviderConfig {
  id: string;
  label: string;
  color: string;
  protocol: CiyuanProtocol;
  baseUrl: string;
  endpointPath?: string;
  authMode: CiyuanAuthMode;
  authKeyName?: string;
  modelPlacement?: CiyuanModelPlacement;
  models: CiyuanModelOption[];
  extraHeaders?: Record<string, string>;
  builtin?: boolean;
  keyPlaceholder?: string;
}

const OPENAI_PATH = '/chat/completions';
const ANTHROPIC_PATH = '/messages';
const GEMINI_PATH = '/models/{model}:streamGenerateContent';
const MINIMAX_PATH = '/text/chatcompletion_v2';

export const BUILTIN_CIYUAN_PROVIDERS: CiyuanProviderConfig[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    color: '#10a37f',
    protocol: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'gpt-4.1', label: 'gpt-4.1' },
      { id: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
      { id: 'gpt-4o', label: 'gpt-4o' },
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { id: 'o4-mini', label: 'o4-mini' },
    ],
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    color: '#d4a96a',
    protocol: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    endpointPath: ANTHROPIC_PATH,
    authMode: 'header',
    authKeyName: 'x-api-key',
    builtin: true,
    keyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-7-sonnet-latest', label: 'claude-3-7-sonnet-latest' },
      { id: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest' },
      { id: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest' },
    ],
  },
  {
    id: 'google',
    label: 'Google Gemini',
    color: '#4285f4',
    protocol: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    endpointPath: GEMINI_PATH,
    authMode: 'query',
    authKeyName: 'key',
    modelPlacement: 'url',
    builtin: true,
    keyPlaceholder: 'AIza...',
    models: [
      { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
      { id: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
      { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro' },
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    color: '#536dfe',
    protocol: 'openai',
    baseUrl: 'https://api.deepseek.com/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'deepseek-chat', label: 'deepseek-chat' },
      { id: 'deepseek-reasoner', label: 'deepseek-reasoner' },
    ],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    color: '#6e40c9',
    protocol: 'openai',
    baseUrl: 'https://openrouter.ai/api/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'sk-or-...',
    extraHeaders: {
      'HTTP-Referer': 'https://www.artchain.icu',
      'X-Title': '词元 AI',
    },
    models: [
      { id: 'openai/gpt-4o-mini', label: 'openai/gpt-4o-mini' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'anthropic/claude-3.5-sonnet' },
      { id: 'google/gemma-3-27b-it:free', label: 'google/gemma-3-27b-it:free' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'meta-llama/llama-3.3-70b-instruct:free' },
    ],
  },
  {
    id: 'groq',
    label: 'Groq',
    color: '#f55036',
    protocol: 'openai',
    baseUrl: 'https://api.groq.com/openai/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'gsk_...',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
      { id: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant' },
      { id: 'mixtral-8x7b-32768', label: 'mixtral-8x7b-32768' },
    ],
  },
  {
    id: 'xai',
    label: 'xAI Grok',
    color: '#111111',
    protocol: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'xai-...',
    models: [
      { id: 'grok-2-latest', label: 'grok-2-latest' },
      { id: 'grok-2-vision-latest', label: 'grok-2-vision-latest' },
    ],
  },
  {
    id: 'moonshot',
    label: 'Moonshot Kimi',
    color: '#3d7eff',
    protocol: 'openai',
    baseUrl: 'https://api.moonshot.cn/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'moonshot-v1-8k', label: 'moonshot-v1-8k' },
      { id: 'moonshot-v1-32k', label: 'moonshot-v1-32k' },
      { id: 'moonshot-v1-128k', label: 'moonshot-v1-128k' },
    ],
  },
  {
    id: 'qwen',
    label: 'Qwen / DashScope',
    color: '#7a4cff',
    protocol: 'openai',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'qwen-plus', label: 'qwen-plus' },
      { id: 'qwen-max', label: 'qwen-max' },
      { id: 'qwen-turbo', label: 'qwen-turbo' },
    ],
  },
  {
    id: 'siliconflow',
    label: 'SiliconFlow',
    color: '#00a6a6',
    protocol: 'openai',
    baseUrl: 'https://api.siliconflow.cn/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen/Qwen2.5-72B-Instruct' },
      { id: 'deepseek-ai/DeepSeek-V3', label: 'deepseek-ai/DeepSeek-V3' },
      { id: 'deepseek-ai/DeepSeek-R1', label: 'deepseek-ai/DeepSeek-R1' },
    ],
  },
  {
    id: 'mistral',
    label: 'Mistral',
    color: '#ff9a3c',
    protocol: 'openai',
    baseUrl: 'https://api.mistral.ai/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: '...',
    models: [
      { id: 'mistral-large-latest', label: 'mistral-large-latest' },
      { id: 'ministral-8b-latest', label: 'ministral-8b-latest' },
      { id: 'open-mixtral-8x22b', label: 'open-mixtral-8x22b' },
    ],
  },
  {
    id: 'together',
    label: 'Together AI',
    color: '#ff5e5b',
    protocol: 'openai',
    baseUrl: 'https://api.together.xyz/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: '...',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' },
      { id: 'deepseek-ai/DeepSeek-V3', label: 'deepseek-ai/DeepSeek-V3' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen/Qwen2.5-72B-Instruct-Turbo' },
    ],
  },
  {
    id: 'fireworks',
    label: 'Fireworks',
    color: '#f97316',
    protocol: 'openai',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: '...',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', label: 'accounts/fireworks/models/llama-v3p3-70b-instruct' },
      { id: 'accounts/fireworks/models/deepseek-v3', label: 'accounts/fireworks/models/deepseek-v3' },
    ],
  },
  {
    id: 'doubao',
    label: '豆包 / 火山方舟',
    color: '#1677ff',
    protocol: 'openai',
    baseUrl: 'https://ark.volces.com/api/v3',
    endpointPath: OPENAI_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: '...',
    models: [
      { id: 'doubao-pro-32k', label: 'doubao-pro-32k' },
      { id: 'doubao-lite-32k', label: 'doubao-lite-32k' },
    ],
  },
  {
    id: 'minimax',
    label: 'MiniMax',
    color: '#ff6b6b',
    protocol: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    endpointPath: MINIMAX_PATH,
    authMode: 'bearer',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: '...',
    models: [
      { id: 'MiniMax-Text-01', label: 'MiniMax-Text-01' },
      { id: 'abab6.5s-chat', label: 'abab6.5s-chat' },
    ],
  },
  {
    id: 'ollama',
    label: 'Ollama 本地',
    color: '#222222',
    protocol: 'openai',
    baseUrl: 'http://127.0.0.1:11434/v1',
    endpointPath: OPENAI_PATH,
    authMode: 'none',
    modelPlacement: 'body',
    builtin: true,
    keyPlaceholder: '',
    models: [
      { id: 'qwen2.5:7b', label: 'qwen2.5:7b' },
      { id: 'llama3.1:8b', label: 'llama3.1:8b' },
      { id: 'deepseek-r1:8b', label: 'deepseek-r1:8b' },
    ],
  },
];

export function buildCiyuanProviderMap(customProviders: CiyuanProviderConfig[] = []) {
  return [...BUILTIN_CIYUAN_PROVIDERS, ...customProviders].reduce<Record<string, CiyuanProviderConfig>>(
    (acc, provider) => {
      acc[provider.id] = provider;
      return acc;
    },
    {}
  );
}

export function getDefaultCiyuanProviderId() {
  return 'deepseek';
}

export function getDefaultModelId(provider?: CiyuanProviderConfig | null) {
  return provider?.models[0]?.id ?? '';
}

export function createProviderId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'custom-provider';
  return `custom-${base}-${Math.random().toString(36).slice(2, 8)}`;
}
