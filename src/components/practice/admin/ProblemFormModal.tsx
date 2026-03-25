'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { TestCaseManager } from './TestCaseManager';

interface Problem {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  difficulty?: string;
  type?: string;
  tags?: string[];
  languages?: string[];
  starter_code?: Record<string, string>;
  choices?: Array<{ id: string; text: string; is_correct: boolean }>;
  answer_hint?: string;
  constraints?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  is_public?: boolean;
}

interface Props {
  problem: Problem | null;
  onClose: () => void;
  onSave: () => void;
}

const ALL_LANGS = ['python', 'javascript', 'typescript', 'java', 'cpp', 'c', 'php', 'html'];
const LANG_LABELS: Record<string, string> = {
  python: 'Python', javascript: 'JS', typescript: 'TS', java: 'Java',
  cpp: 'C++', c: 'C', php: 'PHP', html: 'HTML',
};

export function ProblemFormModal({ problem, onClose, onSave }: Props) {
  const [form, setForm] = useState<Problem>({
    title: '', slug: '', description: '', difficulty: 'easy', type: 'algorithm',
    tags: [], languages: ['python', 'javascript', 'java', 'cpp', 'c'],
    starter_code: {}, choices: [], answer_hint: '', constraints: '',
    examples: [{ input: '', output: '', explanation: '' }],
    is_public: true,
    ...problem,
  });
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [step, setStep] = useState<'basic' | 'content' | 'testcases'>('basic');

  useEffect(() => {
    if (form.title && !problem?.slug) {
      const slug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').substring(0, 60);
      setForm(f => ({ ...f, slug }));
    }
  }, [form.title, problem?.slug]);

  async function handleSave() {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      const url = problem?.id ? `/api/practice/problems/${problem.id}` : '/api/practice/problems';
      const method = problem?.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) onSave();
      else {
        const data = await res.json();
        alert('保存失败: ' + data.error);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleLang(lang: string) {
    const langs = form.languages || [];
    setForm(f => ({
      ...f,
      languages: langs.includes(lang) ? langs.filter(l => l !== lang) : [...langs, lang],
    }));
  }

  function addExample() {
    setForm(f => ({ ...f, examples: [...(f.examples || []), { input: '', output: '', explanation: '' }] }));
  }

  function removeExample(i: number) {
    setForm(f => ({ ...f, examples: (f.examples || []).filter((_, idx) => idx !== i) }));
  }

  function updateExample(i: number, key: string, value: string) {
    setForm(f => ({
      ...f,
      examples: (f.examples || []).map((ex, idx) => idx === i ? { ...ex, [key]: value } : ex),
    }));
  }

  function addChoice() {
    const letters = ['a', 'b', 'c', 'd', 'e'];
    const nextId = letters[(form.choices || []).length] || String.fromCharCode(97 + (form.choices || []).length);
    setForm(f => ({ ...f, choices: [...(f.choices || []), { id: nextId, text: '', is_correct: false }] }));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-lg">{problem?.id ? '编辑题目' : '新建题目'}</h2>
          <div className="flex items-center gap-3">
            {/* Steps */}
            {['basic', 'content', ...(form.type === 'algorithm' && problem?.id ? ['testcases'] : [])].map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s as typeof step)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${step === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
              >
                {i + 1}. {s === 'basic' ? '基本信息' : s === 'content' ? '题目内容' : '测试用例'}
              </button>
            ))}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'basic' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1.5 block">标题 *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm"
                    placeholder="题目标题"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Slug (URL)</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm font-mono"
                    placeholder="two-sum"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">难度</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">题目类型</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm"
                  >
                    <option value="algorithm">算法题</option>
                    <option value="multiple_choice">选择题</option>
                    <option value="interview">面试题</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">是否公开</label>
                  <select
                    value={form.is_public ? 'true' : 'false'}
                    onChange={e => setForm(f => ({ ...f, is_public: e.target.value === 'true' }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm"
                  >
                    <option value="true">公开</option>
                    <option value="false">草稿</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs">
                      {tag}
                      <button onClick={() => setForm(f => ({ ...f, tags: (f.tags || []).filter(t => t !== tag) }))} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && tagInput.trim()) { setForm(f => ({ ...f, tags: [...(f.tags || []), tagInput.trim()] })); setTagInput(''); }}}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm"
                    placeholder="输入标签后按 Enter"
                  />
                </div>
              </div>

              {/* Languages (for algorithm) */}
              {form.type === 'algorithm' && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">支持语言</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_LANGS.map(lang => (
                      <button
                        key={lang}
                        onClick={() => toggleLang(lang)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          (form.languages || []).includes(lang)
                            ? 'border-[var(--gold)] bg-amber-50 text-amber-700'
                            : 'border-border text-muted-foreground hover:border-[var(--gold)]'
                        }`}
                      >
                        {LANG_LABELS[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'content' && (
            <>
              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">题目描述 * (Markdown)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm font-mono resize-y"
                  placeholder="使用 Markdown 描述题目..."
                />
              </div>

              {/* Constraints */}
              {form.type === 'algorithm' && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">提示/约束（每行一条）</label>
                  <textarea
                    value={form.constraints}
                    onChange={e => setForm(f => ({ ...f, constraints: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm font-mono resize-y"
                    placeholder="1 <= n <= 10^4"
                  />
                </div>
              )}

              {/* Examples (algorithm) */}
              {form.type === 'algorithm' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium">示例</label>
                    <button onClick={addExample} className="text-xs flex items-center gap-1 text-[var(--gold)] hover:underline">
                      <Plus className="w-3.5 h-3.5" /> 添加示例
                    </button>
                  </div>
                  {(form.examples || []).map((ex, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 space-y-2 mb-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>示例 {i + 1}</span>
                        <button onClick={() => removeExample(i)} className="hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={ex.input} onChange={e => updateExample(i, 'input', e.target.value)} placeholder="输入" className="px-2 py-1 text-xs font-mono border border-border rounded bg-muted outline-none focus:border-primary" />
                        <input value={ex.output} onChange={e => updateExample(i, 'output', e.target.value)} placeholder="输出" className="px-2 py-1 text-xs font-mono border border-border rounded bg-muted outline-none focus:border-primary" />
                      </div>
                      <input value={ex.explanation || ''} onChange={e => updateExample(i, 'explanation', e.target.value)} placeholder="解释（可选）" className="w-full px-2 py-1 text-xs border border-border rounded bg-muted outline-none focus:border-primary" />
                    </div>
                  ))}
                </div>
              )}

              {/* Multiple choice */}
              {form.type === 'multiple_choice' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium">选项</label>
                    <button onClick={addChoice} className="text-xs flex items-center gap-1 text-[var(--gold)] hover:underline">
                      <Plus className="w-3.5 h-3.5" /> 添加选项
                    </button>
                  </div>
                  {(form.choices || []).map((choice, i) => (
                    <div key={choice.id} className="flex items-start gap-2 mb-2">
                      <span className="font-bold text-[var(--gold)] mt-2 min-w-[1.2rem] text-sm">{choice.id.toUpperCase()}.</span>
                      <textarea
                        value={choice.text}
                        onChange={e => setForm(f => ({ ...f, choices: (f.choices || []).map((c, ci) => ci === i ? { ...c, text: e.target.value } : c) }))}
                        rows={2}
                        className="flex-1 px-2 py-1.5 text-sm font-mono border border-border rounded-lg bg-muted outline-none focus:border-primary resize-none"
                        placeholder={`选项 ${choice.id.toUpperCase()} 内容`}
                      />
                      <label className="flex items-center gap-1 mt-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="correct_choice"
                          checked={choice.is_correct}
                          onChange={() => setForm(f => ({ ...f, choices: (f.choices || []).map((c, ci) => ({ ...c, is_correct: ci === i })) }))}
                          className="accent-[var(--gold)]"
                        />
                        正确
                      </label>
                      <button onClick={() => setForm(f => ({ ...f, choices: (f.choices || []).filter((_, ci) => ci !== i) }))} className="mt-2 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Interview answer hint */}
              {form.type === 'interview' && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">参考答案（提交后展示给用户）</label>
                  <textarea
                    value={form.answer_hint}
                    onChange={e => setForm(f => ({ ...f, answer_hint: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted focus:border-primary outline-none text-sm font-mono resize-y"
                    placeholder="Markdown 格式的参考答案..."
                  />
                </div>
              )}
            </>
          )}

          {step === 'testcases' && problem?.id && (
            <TestCaseManager problemId={problem.id} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          <div className="flex gap-2">
            {step !== 'basic' && (
              <button
                onClick={() => setStep(step === 'testcases' ? 'content' : 'basic')}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                上一步
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
              取消
            </button>
            {step === 'content' || (step === 'basic' && form.type !== 'algorithm') ? (
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.description}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                保存
              </button>
            ) : (
              <button
                onClick={() => setStep(step === 'basic' ? 'content' : 'testcases')}
                className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                下一步
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
