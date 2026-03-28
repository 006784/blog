'use client';

import { useState } from 'react';
import { Diary } from '@/lib/supabase';

interface Props {
  diaries: Diary[];
  onClose: () => void;
}

type ExportRange = 'all' | 'month' | 'year';

function buildMarkdown(diary: Diary): string {
  const lines = [
    '---',
    `date: ${diary.diary_date}`,
    `mood: ${diary.mood || ''}`,
    `weather: ${diary.weather || ''}`,
    `tags: [${(diary.tags || []).join(', ')}]`,
    `words: ${diary.word_count || 0}`,
    '---',
    '',
    diary.title ? `# ${diary.title}\n` : '',
    diary.content,
  ];
  return lines.join('\n');
}

export function ExportModal({ diaries, onClose }: Props) {
  const [range, setRange] = useState<ExportRange>('all');
  const [exporting, setExporting] = useState(false);

  const filtered = (() => {
    const now = new Date();
    if (range === 'month') {
      const prefix = now.toISOString().slice(0, 7);
      return diaries.filter((d) => d.diary_date.startsWith(prefix));
    }
    if (range === 'year') {
      const prefix = now.getFullYear().toString();
      return diaries.filter((d) => d.diary_date.startsWith(prefix));
    }
    return diaries;
  })();

  const handleExport = async () => {
    setExporting(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      filtered.forEach((diary) => {
        zip.file(`${diary.diary_date}.md`, buildMarkdown(diary));
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diary-export-${new Date().toISOString().slice(0, 7)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const RANGES: { key: ExportRange; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'year', label: '本年' },
    { key: 'month', label: '本月' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,.5)' }} onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 z-50 p-8 border"
        style={{
          transform: 'translate(-50%,-50%)',
          background: 'var(--d-bg)',
          borderColor: 'var(--d-border)',
          minWidth: 320,
        }}
      >
        <h2
          className="text-base mb-6"
          style={{ fontFamily: 'var(--d-font-title)', color: 'var(--d-ink)', letterSpacing: '.1em' }}
        >
          导出日记
        </h2>

        {/* Range */}
        <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--d-ink-3)' }}>范围</p>
        <div className="flex flex-col divide-y mb-6" style={{ borderTop: '1px solid var(--d-border)', borderBottom: '1px solid var(--d-border)' }}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className="flex items-center justify-between px-0 py-3 text-sm"
              style={{ color: 'var(--d-ink-2)' }}
            >
              <span>{r.label}</span>
              {range === r.key && (
                <span style={{ color: 'var(--d-accent)' }}>✓</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-[10px] mb-6" style={{ color: 'var(--d-ink-3)' }}>
          共 {filtered.length} 篇日记将导出为 Markdown ZIP
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-sm transition-opacity hover:opacity-60"
            style={{ color: 'var(--d-ink-3)' }}
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !filtered.length}
            className="text-sm border-b transition-opacity hover:opacity-60 disabled:opacity-30"
            style={{ color: 'var(--d-accent)', borderColor: 'var(--d-accent)' }}
          >
            {exporting ? '导出中…' : '下载 ZIP'}
          </button>
        </div>
      </div>
    </>
  );
}
