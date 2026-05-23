import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const DEFAULT_PISTON_API_BASE_URL = 'https://emkc.org/api/v2/piston';

// Piston 运行时映射
const PISTON_RUNTIME: Record<string, { language: string; version: string }> = {
  c:          { language: 'c',          version: '10.2.0'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
  php:        { language: 'php',        version: '8.2.3'   },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3'   },
  python:     { language: 'python',     version: '3.10.0'  },
};

const PISTON_FILE_NAME: Record<string, string> = {
  c: 'main.c',
  cpp: 'main.cpp',
  java: 'Main.java',
  php: 'main.php',
  javascript: 'main.js',
  typescript: 'main.ts',
  python: 'main.py',
};

// 频率限制：每 IP 每分钟 20 次
const limiter = new RateLimiterMemory({ points: 20, duration: 60 });

function getPistonExecuteUrl() {
  const baseUrl = (process.env.PISTON_API_BASE_URL || DEFAULT_PISTON_API_BASE_URL).replace(/\/+$/, '');
  return `${baseUrl}/execute`;
}

function normalizePistonServiceError(text: string) {
  if (text.toLowerCase().includes('whitelist only')) {
    return '公共 Piston API 目前需要白名单，请配置 PISTON_API_BASE_URL 指向自托管 Piston 实例后再运行代码。';
  }

  try {
    const payload = JSON.parse(text) as { message?: string; error?: string };
    return payload.message || payload.error || text;
  } catch {
    return text;
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json({ error: '运行太频繁，请稍后再试' }, { status: 429 });
  }

  let body: { code?: unknown; language?: unknown; stdin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体不是有效 JSON' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code : '';
  const language = typeof body.language === 'string' ? body.language : '';
  const stdin = typeof body.stdin === 'string' ? body.stdin : '';

  if (!code.trim() || !language) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  if (code.length > 100_000 || stdin.length > 20_000) {
    return NextResponse.json({ error: '代码或输入过长，请精简后再运行' }, { status: 413 });
  }

  const runtime = PISTON_RUNTIME[language];
  if (!runtime) {
    return NextResponse.json({ error: `不支持的语言: ${language}` }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const pistonRes = await fetch(getPistonExecuteUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: PISTON_FILE_NAME[language] || 'main', content: code }],
        stdin,
        run_timeout: 8000,
        compile_timeout: 10000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!pistonRes.ok) {
      const errText = await pistonRes.text();
      return NextResponse.json({ error: normalizePistonServiceError(errText) }, { status: 502 });
    }

    const result = await pistonRes.json();
    const run = result.run || {};
    const compile = result.compile || {};

    return NextResponse.json({
      stdout: run.stdout || '',
      stderr: run.stderr || compile.stderr || '',
      code:   run.code ?? compile.code ?? 0,
      signal: run.signal || compile.signal || null,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: '执行超时（15秒）', stdout: '', stderr: '执行超时', code: -1 }, { status: 200 });
    }
    logger.error('Piston error:', err);
    return NextResponse.json({ error: '执行失败，请稍后重试' }, { status: 500 });
  }
}
