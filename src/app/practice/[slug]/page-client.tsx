'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { CodeEditor } from '@/components/practice/CodeEditor';
import { HtmlPreview } from '@/components/practice/HtmlPreview';
import { ProblemDescription } from '@/components/practice/ProblemDescription';
import { LanguageSelector } from '@/components/practice/LanguageSelector';
import { SubmitPanel } from '@/components/practice/SubmitPanel';
import { MultipleChoiceView } from '@/components/practice/MultipleChoiceView';
import { InterviewAnswerView } from '@/components/practice/InterviewAnswerView';
import { DifficultyBadge } from '@/components/practice/DifficultyBadge';

interface Props { slug: string }

export function ProblemPageClient({ slug }: Props) {
  const [problem, setProblem] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const htmlDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<{ stdout: string; stderr: string; code: number } | null>(null);
  const [submitResult, setSubmitResult] = useState<Record<string, unknown> | null>(null);
  const [showHint, setShowHint] = useState(false);

  // 获取访客 ID
  const getVisitorId = () => {
    if (typeof window === 'undefined') return '';
    let id = localStorage.getItem('practice-visitor-id');
    if (!id) {
      id = 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('practice-visitor-id', id);
    }
    return id;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/practice/problems/${slug}`);
      if (!res.ok) { setLoading(false); return; }
      const { problem: p } = await res.json();
      setProblem(p);

      // 初始化语言和代码
      const langs = (p.languages as string[]) || [];
      const defaultLang = langs.includes('python') ? 'python'
        : langs.includes('javascript') ? 'javascript'
        : langs[0] || 'python';
      setLanguage(defaultLang);

      const starterCode = (p.starter_code as Record<string, string>) || {};
      setCode(starterCode[defaultLang] || '');

      if (p.type === 'interview') {
        setCode('');
      }

      setLoading(false);
    })();
  }, [slug]);

  function handleLangChange(lang: string) {
    setLanguage(lang);
    const starterCode = ((problem?.starter_code as Record<string, string>) || {});
    setCode(starterCode[lang] || '');
    setRunResult(null);
    setSubmitResult(null);
  }

  function handleCodeChange(v: string) {
    setCode(v);
    if (language === 'html') {
      if (htmlDebounceRef.current) clearTimeout(htmlDebounceRef.current);
      htmlDebounceRef.current = setTimeout(() => setHtmlPreview(v), 300);
    }
  }

  const handleRun = useCallback(async () => {
    if (!code.trim()) return;
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch('/api/practice/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      setRunResult(data);
    } catch (e) {
      setRunResult({ stdout: '', stderr: String(e), code: 1 });
    } finally {
      setRunning(false);
    }
  }, [code, language]);

  const handleSubmit = useCallback(async () => {
    if (!problem) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problem.id,
          language: problem.type === 'interview' ? 'text' : language,
          code: problem.type === 'multiple_choice' ? (selectedChoice || '') : code,
          selected_choice: selectedChoice,
          visitor_id: getVisitorId(),
        }),
      });
      const data = await res.json();
      setSubmitResult(data);
      if (problem.type === 'interview' && data.status === 'accepted') setShowHint(true);
    } finally {
      setSubmitting(false);
    }
  }, [problem, language, code, selectedChoice]);

  function handleReset() {
    const starterCode = ((problem?.starter_code as Record<string, string>) || {});
    setCode(starterCode[language] || '');
    setRunResult(null);
    setSubmitResult(null);
    setSelectedChoice(null);
    setShowHint(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">题目不存在</p>
          <Link href="/practice" className="text-[var(--gold)] hover:underline">返回题库</Link>
        </div>
      </div>
    );
  }

  const isAlgorithm = problem.type === 'algorithm';
  const isMultipleChoice = problem.type === 'multiple_choice';
  const isInterview = problem.type === 'interview';
  const isHtml = language === 'html';
  const availableLangs = (problem.languages as string[]) || [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--paper,#faf8f5)]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--line)] bg-[var(--paper)] flex-shrink-0">
        <Link href="/practice" className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="font-semibold text-sm truncate flex-1">{problem.title as string}</h1>
        <DifficultyBadge difficulty={problem.difficulty as string} />
        <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-[var(--paper-deep)] transition-colors text-muted-foreground" title="重置代码">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main layout: left description + right editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: description (40%) */}
        <div className="w-[42%] flex-shrink-0 border-r border-[var(--line)] overflow-hidden bg-[var(--paper)]">
          <ProblemDescription problem={problem as unknown as Parameters<typeof ProblemDescription>[0]["problem"]} />
        </div>

        {/* Right: editor + panel (60%) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
          {/* Language selector bar */}
          {(isAlgorithm || isHtml) && (
            <div className="flex items-center gap-3 px-4 py-2 bg-[#252526] border-b border-[#3d3d3d] flex-shrink-0">
              <LanguageSelector value={language} onChange={handleLangChange} availableLanguages={availableLangs} />
            </div>
          )}

          {/* Editor area */}
          <div className={`flex-1 overflow-hidden flex flex-col min-h-0`}>
            {isMultipleChoice ? (
              <div className="flex-1 overflow-y-auto bg-[var(--paper)]">
                <MultipleChoiceView
                  choices={(problem.choices as Array<{ id: string; text: string }>) || []}
                  selected={selectedChoice}
                  onSelect={setSelectedChoice}
                  result={submitResult ? { status: submitResult.status as string } : null}
                />
              </div>
            ) : isInterview ? (
              <div className="flex-1 overflow-hidden">
                <InterviewAnswerView
                  value={code}
                  onChange={handleCodeChange}
                  answerHint={problem.answer_hint as string}
                  showHint={showHint}
                />
              </div>
            ) : isHtml ? (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 border-r border-[#3d3d3d]">
                  <CodeEditor value={code} onChange={handleCodeChange} language="html" />
                </div>
                <div className="w-1/2">
                  <HtmlPreview code={htmlPreview || code} />
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <CodeEditor value={code} onChange={handleCodeChange} language={language} />
              </div>
            )}
          </div>

          {/* Submit panel (algorithm / interview only) */}
          {!isMultipleChoice && (
            <div className="flex-shrink-0">
              <SubmitPanel
                onRun={handleRun}
                onSubmit={handleSubmit}
                running={running}
                submitting={submitting}
                runResult={runResult}
                submitResult={submitResult as Parameters<typeof SubmitPanel>[0]['submitResult']}
                problemType={problem.type as string}
              />
            </div>
          )}

          {/* Multiple choice submit button */}
          {isMultipleChoice && (
            <div className="flex-shrink-0 border-t border-[#3d3d3d] p-3 bg-[#1e1e1e]">
              <button
                onClick={handleSubmit}
                disabled={!selectedChoice || submitting || !!submitResult}
                className="w-full py-2 rounded-lg bg-[var(--gold,#c4a96d)] text-white text-sm font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : submitResult ? (submitResult.status === 'accepted' ? '✓ 回答正确' : '✗ 回答错误') : '提交答案'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
