'use client';

import { useMemo } from 'react';

const MOOD_DOT_COLOR: Record<number, string> = {
  1: '#6ea8d4',
  2: '#aaa',
  3: '#7dc47d',
  4: '#e0a060',
  5: '#c4a96d',
};

export interface CalendarDot {
  mood?: string;
  hasContent: boolean;
  mood_score?: number;
}

interface Props {
  year: number;
  month: number; // 1-12
  dots: Record<string, CalendarDot>; // key: 'YYYY-MM-DD'
  selectedDate?: string;
  onDateClick: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const MOOD_EMOJI: Record<string, string> = {
  '难过': '😔', '平静': '😐', '还好': '🙂', '开心': '😄', '很棒': '🤩',
};

export function CalendarView({ year, month, dots, selectedDate, onDateClick, onPrev, onNext }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: Array<{ date: string; day: number } | null> = [];

    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ date, day: d });
    }
    return result;
  }, [year, month]);

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-3">
        <button onClick={onPrev} className="text-lg transition-opacity hover:opacity-60" style={{ color: 'var(--d-ink-3)' }}>‹</button>
        <span style={{ fontFamily: 'var(--d-font-title)', color: 'var(--d-ink)', fontSize: 15, letterSpacing: '.05em' }}>
          {year} · {String(month).padStart(2, '0')}
        </span>
        <button onClick={onNext} className="text-lg transition-opacity hover:opacity-60" style={{ color: 'var(--d-ink-3)' }}>›</button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[9px] py-1" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>{w}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="cal-cell aspect-square border" style={{ borderColor: 'var(--d-border)' }} />;

          const dot = dots[cell.date];
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const moodScore = dot?.mood_score;
          const moodEmoji = dot?.mood ? MOOD_EMOJI[dot.mood] : null;

          return (
            <button
              key={cell.date}
              onClick={() => onDateClick(cell.date)}
              className="cal-cell aspect-square border flex flex-col items-center justify-center gap-0.5 transition-all"
              style={{
                borderColor: isSelected ? 'var(--d-accent)' : 'var(--d-border)',
                background: isSelected ? 'var(--d-bg-warm)' : isToday ? 'transparent' : 'transparent',
                outline: isToday ? '1px solid var(--d-accent)' : 'none',
                outlineOffset: -1,
              }}
            >
              <span
                className="text-[11px] leading-none"
                style={{
                  color: isSelected ? 'var(--d-accent)' : 'var(--d-ink)',
                  fontFamily: 'var(--d-font-title)',
                }}
              >
                {cell.day}
              </span>
              {moodEmoji && (
                <span className="text-[9px] leading-none">{moodEmoji}</span>
              )}
              {dot?.hasContent && !moodEmoji && (
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: moodScore ? MOOD_DOT_COLOR[moodScore] || 'var(--d-accent)' : 'var(--d-accent)' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
