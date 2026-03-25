import { NextRequest } from 'next/server';
import type { CiyuanProviderConfig } from '@/lib/ciyuan-providers';

export const dynamic = 'force-dynamic';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  providerId?: string;
  providerConfig?: CiyuanProviderConfig;
  model?: string;
  messages?: Message[];
  apiKey?: string;
}

const encoder = new TextEncoder();

function sseChunk(text: string, done = false) {
  return `data: ${JSON.stringify({ text, done })}\n\n`;
}

function defaultEndpointPath(protocol: CiyuanProviderConfig['protocol']) {
  if (protocol === 'anthropic') return '/messages';
  if (protocol === 'gemini') return '/models/{model}:streamGenerateContent';
  if (protocol === 'minimax') return '/text/chatcompletion_v2';
  return '/chat/completions';
}

function isSafeBaseUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    if (url.protocol === 'https:') return true;
    if (url.protocol !== 'http:') return false;
    return ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

function normalizeEndpoint(provider: CiyuanProviderConfig, model: string) {
  const endpointPath = (provider.endpointPath || defaultEndpointPath(provider.protocol)).trim();
  const baseUrl = provider.baseUrl.trim().replace(/\/+$/, '');
  const path = endpointPath.replace(/\{model\}/g, encodeURIComponent(model));
  return new URL(path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`);
}

function buildHeaders(provider: CiyuanProviderConfig, apiKey: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(provider.extraHeaders || {}),
  };

  if (provider.protocol === 'anthropic' && !headers['anthropic-version']) {
    headers['anthropic-version'] = '2023-06-01';
  }

  if (provider.authMode === 'bearer' && apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (provider.authMode === 'header' && apiKey) {
    headers[provider.authKeyName || 'x-api-key'] = apiKey;
  }

  return headers;
}

function buildRequestUrl(provider: CiyuanProviderConfig, model: string, apiKey: string) {
  const url = normalizeEndpoint(provider, model);
  if (provider.authMode === 'query' && apiKey) {
    url.searchParams.set(provider.authKeyName || 'key', apiKey);
  }
  return url.toString();
}

async function enqueueError(controller: ReadableStreamDefaultController, status: number, response: Response) {
  const text = await response.text();
  controller.enqueue(encoder.encode(sseChunk(`[错误] ${status}: ${text}`, true)));
  controller.close();
}

async function streamOpenAICompatible(
  provider: CiyuanProviderConfig,
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const body: Record<string, unknown> = {
    messages,
    stream: true,
  };

  if (provider.modelPlacement !== 'url') {
    body.model = model;
  }

  const response = await fetch(buildRequestUrl(provider, model, apiKey), {
    method: 'POST',
    headers: buildHeaders(provider, apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    await enqueueError(controller, response.status, response);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const json = JSON.parse(payload);
        const text = json?.choices?.[0]?.delta?.content || json?.choices?.[0]?.message?.content || '';
        if (text) {
          controller.enqueue(encoder.encode(sseChunk(text)));
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

async function streamAnthropic(
  provider: CiyuanProviderConfig,
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const system = messages.find((message) => message.role === 'system')?.content;
  const filtered = messages.filter((message) => message.role !== 'system');

  const response = await fetch(buildRequestUrl(provider, model, apiKey), {
    method: 'POST',
    headers: buildHeaders(provider, apiKey),
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: filtered,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    await enqueueError(controller, response.status, response);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === 'content_block_delta') {
          const text = json?.delta?.text || '';
          if (text) {
            controller.enqueue(encoder.encode(sseChunk(text)));
          }
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

async function streamGemini(
  provider: CiyuanProviderConfig,
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const system = messages.find((message) => message.role === 'system')?.content;
  const filtered = messages.filter((message) => message.role !== 'system');

  const response = await fetch(buildRequestUrl(provider, model, apiKey), {
    method: 'POST',
    headers: buildHeaders(provider, apiKey),
    body: JSON.stringify({
      contents: filtered.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    }),
  });

  if (!response.ok || !response.body) {
    await enqueueError(controller, response.status, response);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          controller.enqueue(encoder.encode(sseChunk(text)));
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

export async function POST(request: NextRequest) {
  const body = await request.json() as ChatRequestBody;
  const provider = body.providerConfig;
  const model = body.model?.trim();
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const apiKey = body.apiKey?.trim() || '';

  if (!provider) {
    return new Response(sseChunk('❌ 缺少提供商配置', true), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (!isSafeBaseUrl(provider.baseUrl)) {
    return new Response(sseChunk('❌ Base URL 不合法，仅允许 https 或本地 http 地址', true), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (!model) {
    return new Response(sseChunk('❌ 请先填写模型 ID', true), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  if (provider.authMode !== 'none' && !apiKey) {
    return new Response(sseChunk('❌ 请先在设置中填写 API Key', true), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (provider.protocol === 'anthropic') {
          await streamAnthropic(provider, apiKey, model, messages, controller);
        } else if (provider.protocol === 'gemini') {
          await streamGemini(provider, apiKey, model, messages, controller);
        } else {
          await streamOpenAICompatible(provider, apiKey, model, messages, controller);
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sseChunk(`[网络错误] ${error instanceof Error ? error.message : String(error)}`, true)
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
