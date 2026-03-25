'use client';

import { useMemo } from 'react';
import { Diary } from '@/lib/supabase';

const MOOD_DOT_SIZE: Record<string, number> = {
  '难过': 6, '平静': 7, '还好': 8, '开心': 9, '很棒': 10,
};

interface Props {
  diaries: Diary[];
  onOpen: (d: Diary) => void;
}

function preview(content: string): string {
  const stripped = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/[#*`>_~\[\]]/g, '').trim();
  return stripped.length > 80 ? stripped.slice(0, 80) + '…' : stripped;
}

export function TimelineView({ diaries, onOpen }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, Diary[]>();
    diaries.forEach((d) => {
      const [y, m] = d.diary_date.split('-');
      const key = `${y}-${m}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return Array.from(map.entries());
  }, [diaries]);

  if (!diaries.length) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-sm" style={{ color: 'var(--d-ink-3)', fontFamily: 'var(--d-font-title)', letterSpacing: '.15em' }}>
          尚无日记
        </span>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 relative">
      {/* Vertical line */}
      <div
        className="timeline-line absolute top-0 bottom-0"
        style={{ left: 88, width: 1, background: 'var(--d-border)' }}
      />

      {grouped.map(([monthKey, entries]) => {
        const [y, m] = monthKey.split('-');
        return (
          <div key={monthKey} className="mb-8">
            {/* Month label */}
            <div className="flex items-center mb-4" style={{ paddingLeft: 100 }}>
              <span
                style={{
                  fontFamily: 'var(--d-font-title)',
                  color: 'var(--d-ink-2)',
                  fontSize: 18,
                  letterSpacing: '.08em',
                }}
              >
                {y} · {m}
              </span>
            </div>

            {entries.map((diary) => {
              const date = new Date(diary.diary_date);
              const dotSize = MOOD_DOT_SIZE[diary.mood || ''] || 8;
              const images = diary.images?.filter(Boolean) || [];

              return (
                <div key={diary.id} className="flex gap-4 mb-5 relative">
                  {/* Date */}
                  <div className="flex-none flex flex-col items-end" style={{ width: 80 }}>
                    <span
                      style={{
                        fontFamily: 'var(--d-font-title)',
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--d-ink)',
                        lineHeight: 1,
                      }}
                    >
                      {String(date.getDate()).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] mt-0.5" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>
                      {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                    </span>
                  </div>

                  {/* Dot */}
                  <div className="flex-none flex items-start pt-1.5" style={{ width: 16 }}>
                    <div
                      className="rounded-full"
                      style={{
                        width: dotSize,
                        height: dotSize,
                        background: 'var(--d-accent)',
                        marginLeft: -(dotSize / 2) - 0.5,
                      }}
                    />
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => onOpen(diary)}
                    className="flex-1 text-left border p-4 transition-colors hover:border-[var(--d-accent)]"
                    style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg)' }}
                  >
                    {diary.title && (
                      <p
                        className="mb-1"
                        style={{
                          fontFamily: 'var(--d-font-title)',
                          fontSize: 14,
                          color: 'var(--d-ink)',
                          letterSpacing: '.04em',
                        }}
                      >
                        {diary.title}
                      </p>
                    )}

                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--d-ink-2)', fontFamily: 'var(--d-font-body)' }}
                    >
                      {preview(diary.content)}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {diary.mood && (
                        <span className="text-[10px]" style={{ color: 'var(--d-ink-3)' }}>
                          {diary.mood}
                        </span>
                      )}
                      {diary.weather && (
                        <span className="text-[10px]" style={{ color: 'var(--d-ink-3)' }}>
                          {diary.weather}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--d-ink-3)' }}>
                        {diary.word_count} 字
                      </span>
                    </div>

                    {/* Image grid */}
                    {images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {images.slice(0, 3).map((url, idx) => (
                          <div
                            key={idx}
                            className="w-12 h-12 overflow-hidden"
                            style={{
                              border: '1px solid var(--d-border)',
                              transform: `rotate(${(idx - 1) * (Math.random() * 2)}deg)`,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
