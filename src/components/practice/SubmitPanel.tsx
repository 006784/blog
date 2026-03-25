'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Clock, Play, Send, Loader2 } from 'lucide-react';

interface CaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  hidden: boolean;
}

interface RunResult {
  stdout: string;
  stderr: string;
  code: number;
}

interface SubmitResult {
  status: string;
  runTimeMs: number;
  caseResults: CaseResult[];
  output: string;
  errorMsg: string;
  message: string;
}

interface SubmitPanelProps {
  onRun: () => void;
  onSubmit: () => void;
  running: boolean;
  submitting: boolean;
  runResult: RunResult | null;
  submitResult: SubmitResult | null;
  problemType: string;
}

export function SubmitPanel({ onRun, onSubmit, running, submitting, runResult, submitResult, problemType }: SubmitPanelProps) {
  const statusIcon = {
    accepted:      <CheckCircle className="w-5 h-5 text-emerald-500" />,
    wrong_answer:  <XCircle className="w-5 h-5 text-red-500" />,
    runtime_error: <AlertCircle className="w-5 h-5 text-orange-500" />,
    time_limit:    <Clock className="w-5 h-5 text-yellow-500" />,
    compile_error: <AlertCircle className="w-5 h-5 text-red-500" />,
  };

  const statusColor = {
    accepted:      'text-emerald-600',
    wrong_answer:  'text-red-600',
    runtime_error: 'text-orange-600',
    time_limit:    'text-yellow-600',
    compile_error: 'text-red-600',
  };

  return (
    <div className="flex flex-col border-t border-[#3d3d3d] bg-[#1e1e1e]">
      {/* Action buttons */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#3d3d3d]">
        {problemType === 'algorithm' && (
          <button
            onClick={onRun}
            disabled={running || submitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#3d3d3d] text-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            运行
          </button>
        )}
        <button
          onClick={onSubmit}
          disabled={running || submitting}
          className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg bg-[var(--gold,#c4a96d)] hover:bg-amber-500 text-white text-sm font-medium transition-colors disabled:opacity-50 ml-auto"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          提交
        </button>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto max-h-64 min-h-0">
        <AnimatePresence mode="wait">
          {/* Submit result */}
          {submitResult && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                {statusIcon[submitResult.status as keyof typeof statusIcon]}
                <span className={`font-semibold text-base ${statusColor[submitResult.status as keyof typeof statusColor]}`}>
                  {submitResult.message}
                </span>
                {submitResult.runTimeMs > 0 && (
                  <span className="ml-auto text-xs text-gray-500">{submitResult.runTimeMs}ms</span>
                )}
              </div>

              {/* Test case results */}
              {submitResult.caseResults?.length > 0 && (
                <div className="space-y-2">
                  {submitResult.caseResults.map((c, i) => (
                    <div key={i} className={`rounded-lg p-3 text-xs font-mono border ${c.passed ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-red-950/30 border-red-800/40'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {c.passed ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        <span className={c.passed ? 'text-emerald-400' : 'text-red-400'}>用例 {i + 1}</span>
                        {c.hidden && <span className="text-gray-500">(隐藏)</span>}
                      </div>
                      {!c.hidden && (
                        <div className="space-y-1 text-gray-300">
                          <div><span className="text-gray-500">输入: </span>{c.input}</div>
                          <div><span className="text-gray-500">期望: </span>{c.expected}</div>
                          {!c.passed && <div><span className="text-gray-500">实际: </span>{c.actual}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {submitResult.errorMsg && (
                <pre className="text-xs text-red-300 bg-red-950/30 p-3 rounded-lg overflow-auto whitespace-pre-wrap">
                  {submitResult.errorMsg}
                </pre>
              )}
            </motion.div>
          )}

          {/* Run result */}
          {runResult && !submitResult && (
            <motion.div
              key="run"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <p className="text-xs text-gray-400 mb-2">运行输出</p>
              {runResult.stdout && (
                <pre className="text-sm text-gray-200 font-mono bg-[#2d2d2d] p-3 rounded-lg overflow-auto whitespace-pre-wrap max-h-40">
                  {runResult.stdout}
                </pre>
              )}
              {runResult.stderr && (
                <pre className="text-xs text-red-300 bg-red-950/30 p-3 rounded-lg overflow-auto whitespace-pre-wrap mt-2 max-h-32">
                  {runResult.stderr}
                </pre>
              )}
              {!runResult.stdout && !runResult.stderr && (
                <p className="text-sm text-gray-500">（无输出）</p>
              )}
            </motion.div>
          )}

          {/* Empty state */}
          {!runResult && !submitResult && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-6 text-gray-600 text-sm"
            >
              点击「运行」测试代码，点击「提交」评测答案
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
