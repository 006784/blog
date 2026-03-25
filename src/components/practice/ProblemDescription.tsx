'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DifficultyBadge } from './DifficultyBadge';

type Example = { input: string; output: string; explanation?: string };

interface PracticeProblem {
  title: string;
  description: string;
  difficulty: string;
  type: string;
  tags: string[];
  constraints?: string;
  examples: Example[];
}

export function ProblemDescription({ problem }: { problem: PracticeProblem }) {
  const typeLabel: Record<string, string> = {
    algorithm: '算法',
    multiple_choice: '选择题',
    interview: '面试题',
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
      {/* Title + badges */}
      <div>
        <h1 className="text-xl font-bold text-[var(--ink,#1a1917)] mb-2">{problem.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-[var(--line,#ddd9d0)] text-[var(--ink-muted,#6b6860)]">
            {typeLabel[problem.type] || problem.type}
          </span>
          {problem.tags.map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[var(--paper-deep,#ede9e0)] text-[var(--ink-muted,#6b6860)]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-sm max-w-none text-[var(--ink,#1a1917)]
        prose-code:bg-[var(--paper-deep,#ede9e0)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[var(--ink,#1a1917)] prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-[#1e1e1e] prose-pre:text-gray-100 prose-pre:rounded-lg
        prose-blockquote:border-l-[var(--gold,#c4a96d)] prose-blockquote:text-[var(--ink-muted)]
        prose-headings:text-[var(--ink)]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
      </div>

      {/* Examples */}
      {problem.examples?.length > 0 && problem.examples[0].input !== '' && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-[var(--ink-muted)]">示例</h3>
          {problem.examples.map((ex, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-[var(--line,#ddd9d0)]">
              <div className="px-4 py-2 bg-[var(--paper-deep,#ede9e0)] text-xs font-medium text-[var(--ink-muted)]">示例 {i + 1}</div>
              <div className="px-4 py-3 space-y-2 text-sm font-mono">
                <div><span className="text-[var(--ink-muted)] mr-2">输入:</span><span className="text-[var(--ink)]">{ex.input}</span></div>
                <div><span className="text-[var(--ink-muted)] mr-2">输出:</span><span className="text-[var(--ink)]">{ex.output}</span></div>
                {ex.explanation && (
                  <div className="text-[var(--ink-muted)] text-xs pt-1 border-t border-[var(--line)]">
                    <span className="font-sans">解释: </span>{ex.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && (
        <div>
          <h3 className="font-semibold text-sm text-[var(--ink-muted)] mb-2">提示</h3>
          <ul className="space-y-1 text-sm text-[var(--ink-muted)] font-mono">
            {problem.constraints.split('\n').map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--gold,#c4a96d)] mt-0.5">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
