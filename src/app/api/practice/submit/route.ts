import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export const dynamic = 'force-dynamic';

const PISTON_RUNTIME: Record<string, { language: string; version: string }> = {
  c:          { language: 'c',          version: '10.2.0'  },
  cpp:        { language: 'c++',        version: '10.2.0'  },
  java:       { language: 'java',       version: '15.0.2'  },
  php:        { language: 'php',        version: '8.2.3'   },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3'   },
  python:     { language: 'python',     version: '3.10.0'  },
};

const limiter = new RateLimiterMemory({ points: 10, duration: 60 });

async function runCode(code: string, language: string, stdin: string): Promise<{
  stdout: string; stderr: string; code: number;
}> {
  const runtime = PISTON_RUNTIME[language];
  if (!runtime) throw new Error(`不支持的语言: ${language}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: 'main', content: code }],
        stdin,
        run_timeout: 8000,
        compile_timeout: 10000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const result = await res.json();
    const run = result.run || {};
    const compile = result.compile || {};
    return {
      stdout: (run.stdout || '').trim(),
      stderr: run.stderr || compile.stderr || '',
      code: run.code ?? compile.code ?? 0,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      return { stdout: '', stderr: 'Time Limit Exceeded', code: -1 };
    }
    throw err;
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  try {
    await limiter.consume(ip);
  } catch {
    return NextResponse.json({ error: '提交太频繁，请稍后再试' }, { status: 429 });
  }

  const { problem_id, language, code, visitor_id, selected_choice } = await request.json();
  if (!problem_id || !code) {
    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  }

  // 获取题目
  const { data: problem, error: probErr } = await supabaseAdmin
    .from('practice_problems')
    .select('*')
    .eq('id', problem_id)
    .eq('is_public', true)
    .single();

  if (probErr || !problem) {
    return NextResponse.json({ error: '题目不存在' }, { status: 404 });
  }

  let status: string = 'accepted';
  let output = '';
  let errorMsg = '';
  let caseResults: Array<{ input: string; expected: string; actual: string; passed: boolean; hidden: boolean }> = [];
  const startTime = Date.now();

  // 选择题判断
  if (problem.type === 'multiple_choice') {
    const correct = (problem.choices as Array<{ id: string; is_correct: boolean }>)?.find(c => c.is_correct);
    status = selected_choice === correct?.id ? 'accepted' : 'wrong_answer';
    output = selected_choice || '';
  }
  // 面试题：直接通过
  else if (problem.type === 'interview') {
    status = 'accepted';
    output = code;
  }
  // 算法题：跑测试用例
  else {
    const { data: testCases } = await supabaseAdmin
      .from('practice_test_cases')
      .select('*')
      .eq('problem_id', problem_id)
      .order('sort_order');

    if (!testCases || testCases.length === 0) {
      // 无测试用例，仅运行不判断
      const result = await runCode(code, language, '').catch(e => ({ stdout: '', stderr: String(e), code: 1 }));
      status = result.code === 0 ? 'accepted' : 'runtime_error';
      output = result.stdout;
      errorMsg = result.stderr;
    } else {
      let allPassed = true;
      for (const tc of testCases) {
        const result = await runCode(code, language, tc.input).catch(e => ({ stdout: '', stderr: String(e), code: 1 }));

        if (result.stderr === 'Time Limit Exceeded' || result.code === -1) {
          status = 'time_limit';
          allPassed = false;
          caseResults.push({ input: tc.is_hidden ? '(隐藏)' : tc.input, expected: tc.is_hidden ? '(隐藏)' : tc.expected, actual: 'TLE', passed: false, hidden: tc.is_hidden });
          break;
        }

        if (result.code !== 0 || result.stderr) {
          status = 'runtime_error';
          allPassed = false;
          errorMsg = result.stderr;
          caseResults.push({ input: tc.is_hidden ? '(隐藏)' : tc.input, expected: tc.is_hidden ? '(隐藏)' : tc.expected, actual: result.stderr || 'Runtime Error', passed: false, hidden: tc.is_hidden });
          break;
        }

        const passed = result.stdout === tc.expected.trim();
        if (!passed) { allPassed = false; status = 'wrong_answer'; }
        caseResults.push({
          input:    tc.is_hidden ? '(隐藏)' : tc.input,
          expected: tc.is_hidden && !passed ? '(隐藏)' : tc.expected,
          actual:   tc.is_hidden && !passed ? result.stdout : result.stdout,
          passed,
          hidden:   tc.is_hidden,
        });
        if (!allPassed) break; // 快速失败
      }
      if (allPassed) status = 'accepted';
      output = caseResults.map(r => r.actual).join('\n');
    }
  }

  const runTimeMs = Date.now() - startTime;

  // 更新统计
  await supabaseAdmin
    .from('practice_problems')
    .update({
      submission_count: (problem.submission_count || 0) + 1,
      ...(status === 'accepted' ? { accept_count: (problem.accept_count || 0) + 1 } : {}),
    })
    .eq('id', problem_id);

  // 保存提交记录
  const { data: submission } = await supabaseAdmin
    .from('practice_submissions')
    .insert([{
      problem_id,
      language: language || 'text',
      code,
      status,
      run_time_ms: runTimeMs,
      output,
      error_msg: errorMsg || null,
      visitor_id: visitor_id || null,
    }])
    .select()
    .single();

  return NextResponse.json({
    status,
    runTimeMs,
    caseResults,
    output,
    errorMsg,
    submissionId: submission?.id,
    message: status === 'accepted' ? '🎉 全部通过！' : status === 'wrong_answer' ? '❌ 答案错误' : status === 'time_limit' ? '⏱ 超出时间限制' : status === 'compile_error' ? '⚠️ 编译错误' : '💥 运行时错误',
  });
}
