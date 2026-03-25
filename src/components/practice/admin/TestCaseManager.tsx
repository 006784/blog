'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Eye, EyeOff, Loader2 } from 'lucide-react';

interface TestCase {
  id?: string;
  input: string;
  expected: string;
  is_hidden: boolean;
  sort_order: number;
}

export function TestCaseManager({ problemId }: { problemId: string }) {
  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/practice/problems/${problemId}/test-cases`);
      if (res.ok) {
        const { testCases } = await res.json();
        setCases(testCases);
      }
      setLoading(false);
    })();
  }, [problemId]);

  async function handleAdd() {
    const newCase: TestCase = { input: '', expected: '', is_hidden: false, sort_order: cases.length };
    const res = await fetch(`/api/practice/problems/${problemId}/test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCase),
    });
    if (res.ok) {
      const { testCase } = await res.json();
      setCases([...cases, testCase]);
    }
  }

  async function handleSave(tc: TestCase) {
    if (!tc.id) return;
    setSaving(tc.id);
    await fetch(`/api/practice/test-cases/${tc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: tc.input, expected: tc.expected, is_hidden: tc.is_hidden }),
    });
    setSaving(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('删除此测试用例？')) return;
    await fetch(`/api/practice/test-cases/${id}`, { method: 'DELETE' });
    setCases(cases.filter(c => c.id !== id));
  }

  function update(id: string | undefined, key: keyof TestCase, value: unknown) {
    setCases(cases.map(c => c.id === id ? { ...c, [key]: value } : c));
  }

  if (loading) return <div className="text-sm text-muted-foreground py-2">加载测试用例...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">测试用例</label>
        <button onClick={handleAdd} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-[var(--gold)] text-white hover:bg-amber-500 transition-colors">
          <Plus className="w-3.5 h-3.5" /> 添加
        </button>
      </div>

      {cases.length === 0 && (
        <p className="text-xs text-muted-foreground py-2">暂无测试用例，点击「添加」创建</p>
      )}

      {cases.map((tc, i) => (
        <div key={tc.id || i} className="rounded-lg border border-[var(--line)] p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>用例 {i + 1}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => update(tc.id, 'is_hidden', !tc.is_hidden)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${tc.is_hidden ? 'bg-amber-100 text-amber-700' : 'hover:bg-muted'}`}
                title={tc.is_hidden ? '隐藏用例' : '公开用例'}
              >
                {tc.is_hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {tc.is_hidden ? '隐藏' : '公开'}
              </button>
              <button
                onClick={() => tc.id && handleSave(tc)}
                disabled={saving === tc.id}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                {saving === tc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                保存
              </button>
              <button
                onClick={() => tc.id && handleDelete(tc.id)}
                className="p-1 rounded hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">输入 (stdin)</div>
              <textarea
                value={tc.input}
                onChange={e => update(tc.id, 'input', e.target.value)}
                rows={2}
                className="w-full text-xs font-mono px-2 py-1.5 rounded border border-[var(--line)] bg-muted focus:border-[var(--gold)] outline-none resize-none"
                placeholder="每行一个输入"
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">期望输出</div>
              <textarea
                value={tc.expected}
                onChange={e => update(tc.id, 'expected', e.target.value)}
                rows={2}
                className="w-full text-xs font-mono px-2 py-1.5 rounded border border-[var(--line)] bg-muted focus:border-[var(--gold)] outline-none resize-none"
                placeholder="程序应输出的内容"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
