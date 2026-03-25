import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface Message { role: 'user' | 'assistant' | 'system'; content: string }

// ── Provider base URLs ────────────────────────────────────────────────────────
const BASE_URLS: Record<string, string> = {
  openai:      'https://api.openai.com/v1',
  deepseek:    'https://api.deepseek.com/v1',
  doubao:      'https://ark.volcengineapi.com/api/v3',
  openrouter:  'https://openrouter.ai/api/v1',
  minimax:     'https://api.minimax.chat/v1',
  anthropic:   'https://api.anthropic.com/v1',
  google:      'https://generativelanguage.googleapis.com/v1beta',
};

// ── Helpers: encode SSE ───────────────────────────────────────────────────────
function sseChunk(text: string, done = false) {
  return `data: ${JSON.stringify({ text, done })}\n\n`;
}

const encoder = new TextEncoder();

// ── OpenAI-compatible streaming (openai / deepseek / doubao / openrouter) ─────
async function streamOpenAI(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(baseUrl.includes('openrouter') ? {
        'HTTP-Referer': 'https://www.artchain.icu/blog',
        'X-Title': '词元 AI',
      } : {}),
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    controller.enqueue(encoder.encode(sseChunk(`[错误] ${res.status}: ${err}`, true)));
    controller.close();
    return;
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop()!;
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const text = j?.choices?.[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(sseChunk(text)));
      } catch {}
    }
  }
  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

// ── Anthropic streaming ────────────────────────────────────────────────────────
async function streamAnthropic(
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const system = messages.find(m => m.role === 'system')?.content;
  const filtered = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      ...(system ? { system } : {}),
      messages: filtered,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    controller.enqueue(encoder.encode(sseChunk(`[错误] ${res.status}: ${err}`, true)));
    controller.close();
    return;
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';

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
        if (j.type === 'content_block_delta') {
          const text = j?.delta?.text || '';
          if (text) controller.enqueue(encoder.encode(sseChunk(text)));
        }
      } catch {}
    }
  }
  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

// ── Google Gemini streaming ────────────────────────────────────────────────────
async function streamGoogle(
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const system = messages.find(m => m.role === 'system')?.content;
  const filtered = messages.filter(m => m.role !== 'system');

  const contents = filtered.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    controller.enqueue(encoder.encode(sseChunk(`[错误] ${res.status}: ${err}`, true)));
    controller.close();
    return;
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';

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
        const text = j?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) controller.enqueue(encoder.encode(sseChunk(text)));
      } catch {}
    }
  }
  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

// ── MiniMax streaming (OpenAI-compatible) ──────────────────────────────────────
async function streamMinimax(
  apiKey: string,
  model: string,
  messages: Message[],
  controller: ReadableStreamDefaultController,
) {
  const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    controller.enqueue(encoder.encode(sseChunk(`[错误] ${res.status}: ${err}`, true)));
    controller.close();
    return;
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop()!;
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const j = JSON.parse(payload);
        const text = j?.choices?.[0]?.delta?.content || '';
        if (text) controller.enqueue(encoder.encode(sseChunk(text)));
      } catch {}
    }
  }
  controller.enqueue(encoder.encode(sseChunk('', true)));
  controller.close();
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { provider, model, messages, apiKey } = await request.json();

  if (!apiKey) {
    return new Response(
      sseChunk('❌ 请先在设置中填写 API Key', true),
      { headers: { 'Content-Type': 'text/event-stream' } },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (provider === 'anthropic') {
          await streamAnthropic(apiKey, model, messages, controller);
        } else if (provider === 'google') {
          await streamGoogle(apiKey, model, messages, controller);
        } else if (provider === 'minimax') {
          await streamMinimax(apiKey, model, messages, controller);
        } else {
          const baseUrl = BASE_URLS[provider] || BASE_URLS.openai;
          await streamOpenAI(baseUrl, apiKey, model, messages, controller);
        }
      } catch (err) {
        controller.enqueue(encoder.encode(sseChunk(`[网络错误] ${err}`, true)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
