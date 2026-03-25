'use client';

import { useState } from 'react';

export const MOOD_LEVELS = [
  { score: 1, emoji: '😔', label: '难过' },
  { score: 2, emoji: '😐', label: '平静' },
  { score: 3, emoji: '🙂', label: '还好' },
  { score: 4, emoji: '😄', label: '开心' },
  { score: 5, emoji: '🤩', label: '很棒' },
];

export const MOOD_TAG_PRESETS = [
  '平静', '开心', '疲惫', '思念', '焦虑',
  '感恩', '孤独', '期待', '满足', '难过',
];

interface Props {
  score: number;
  tags: string[];
  onScoreChange: (s: number) => void;
  onTagsChange: (t: string[]) => void;
}

export function MoodPicker({ score, tags, onScoreChange, onTagsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const current = MOOD_LEVELS.find((m) => m.score === score);

  const toggleTag = (tag: string) => {
    onTagsChange(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  };

  const addCustom = () => {
    const t = customInput.trim();
    if (t && !tags.includes(t)) { onTagsChange([...tags, t]); }
    setCustomInput('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--d-ink-2)', fontFamily: 'var(--d-font-body)' }}
      >
        <span>{current?.emoji || '🙂'}</span>
        <span className="text-xs">{current?.label || '心情'}</span>
        {tags.length > 0 && (
          <span className="text-[10px]" style={{ color: 'var(--d-ink-3)' }}>· {tags.slice(0, 2).join(' ')}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-8 z-50 p-4 border min-w-[220px]"
            style={{ background: 'var(--d-bg)', borderColor: 'var(--d-border)' }}
          >
            {/* Score picker */}
            <div className="flex gap-3 mb-4">
              {MOOD_LEVELS.map((m) => (
                <button
                  key={m.score}
                  onClick={() => onScoreChange(m.score)}
                  className="flex flex-col items-center gap-0.5 transition-transform hover:scale-110"
                  style={{ opacity: score === m.score ? 1 : 0.4 }}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-[9px]" style={{ color: 'var(--d-ink-3)' }}>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Tag picker */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {MOOD_TAG_PRESETS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-2 py-0.5 text-[10px] border transition-colors"
                  style={{
                    borderColor: 'var(--d-border)',
                    background: tags.includes(tag) ? 'var(--d-accent)' : 'transparent',
                    color: tags.includes(tag) ? 'var(--d-bg)' : 'var(--d-ink-2)',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom tag */}
            <div className="flex gap-1" style={{ borderBottom: '1px solid var(--d-border)' }}>
              <input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
                placeholder="自定义标签…"
                className="flex-1 bg-transparent outline-none text-[10px] pb-1"
                style={{ color: 'var(--d-ink)', fontFamily: 'var(--d-font-body)' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
