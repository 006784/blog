'use client';

import { useEffect, useRef } from 'react';
import { DiaryTheme, applyThemeVars } from '@/lib/diary/themes';

interface Props {
  theme: DiaryTheme;
  children: React.ReactNode;
  /** current date for display */
  date?: Date;
  /** current page number (kraft) */
  pageNumber?: number;
  /** left sidebar slot (washi calendar) */
  leftSlot?: React.ReactNode;
  /** for literary: epigraph text */
  epigraph?: string;
}

export function DiaryShell({ theme, children, date, pageNumber, leftSlot, epigraph }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shellRef.current) applyThemeVars(theme, shellRef.current);
  }, [theme]);

  const d = date || new Date();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ── kraft ───────────────────────────────────────────────────────
  if (theme === 'kraft') {
    return (
      <div
        ref={shellRef}
        className="diary-shell relative flex min-h-screen"
        style={{ background: 'var(--d-bg)', border: '3px solid #c8a96e', transition: 'background-color .4s,color .4s,border-color .4s' }}
      >
        {/* Book spine with spiral rings */}
        <div
          className="flex-none flex flex-col items-center py-8 gap-6"
          style={{ width: 28, background: 'var(--d-spine)', flexShrink: 0 }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#f5e6c8" strokeWidth="2" fill="none" opacity=".7" />
              <circle cx="8" cy="8" r="2" fill="#f5e6c8" opacity=".4" />
            </svg>
          ))}
        </div>

        {/* Lined paper content */}
        <div
          className="flex-1 flex flex-col"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent,transparent 33px,var(--d-line) 33px,var(--d-line) 34px)',
          }}
        >
          {children}
        </div>

        {/* Page number */}
        {pageNumber !== undefined && (
          <div
            className="absolute bottom-4 left-0 right-0 text-center text-sm"
            style={{ fontFamily: "'Caveat', cursive", color: 'var(--d-ink-3)', letterSpacing: '.1em' }}
          >
            — {pageNumber} —
          </div>
        )}
      </div>
    );
  }

  // ── washi ───────────────────────────────────────────────────────
  if (theme === 'washi') {
    return (
      <div
        ref={shellRef}
        className="diary-shell flex flex-col min-h-screen"
        style={{ background: 'var(--d-bg)', transition: 'background-color .4s,color .4s,border-color .4s' }}
      >
        {/* Washi tape strip */}
        <div
          className="h-2 w-full flex-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg,#f5c0b0 0,#f5c0b0 24px,#b8d4b8 24px,#b8d4b8 48px,#c0c8e8 48px,#c0c8e8 72px,#f0d4a0 72px,#f0d4a0 96px)',
            opacity: 0.7,
          }}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left calendar sidebar (hidden on mobile) */}
          {leftSlot && (
            <aside
              className="hidden md:flex flex-col flex-none border-r p-4"
              style={{ width: 180, borderColor: 'var(--d-border)', background: 'var(--d-bg-warm)' }}
            >
              {leftSlot}
            </aside>
          )}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    );
  }

  // ── literary ────────────────────────────────────────────────────
  if (theme === 'literary') {
    return (
      <div
        ref={shellRef}
        className="diary-shell relative flex min-h-screen"
        style={{ background: 'var(--d-bg)', transition: 'background-color .4s,color .4s,border-color .4s' }}
      >
        {/* Gold corner borders */}
        <div className="pointer-events-none absolute inset-[10px] border" style={{ borderColor: 'var(--d-border)', zIndex: 0 }} />

        {/* Book spine */}
        <div
          className="flex-none flex flex-col items-center justify-center py-8 relative z-10"
          style={{ width: 40, background: 'var(--d-spine)' }}
        >
          <span
            className="writing-vertical text-xs tracking-[.4em] select-none"
            style={{
              writingMode: 'vertical-rl',
              color: 'var(--d-ink-3)',
              fontFamily: 'var(--d-font-title)',
              letterSpacing: '.4em',
            }}
          >
            Lumen · 私記
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Epigraph */}
          {epigraph && (
            <div
              className="px-8 pt-6 pb-2 text-right italic text-xs leading-relaxed"
              style={{ color: 'var(--d-ink-3)', fontFamily: 'var(--d-font-body)', borderBottom: '1px solid var(--d-border)' }}
            >
              {epigraph}
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }

  // ── minimal ─────────────────────────────────────────────────────
  return (
    <div
      ref={shellRef}
      className="diary-shell flex min-h-screen"
      style={{ background: 'var(--d-bg)', transition: 'background-color .4s,color .4s,border-color .4s' }}
    >
      {/* Date track */}
      <aside
        className="flex-none hidden md:flex flex-col items-center pt-16 pb-8 gap-1 border-r"
        style={{ width: 60, borderColor: 'var(--d-border)' }}
      >
        <span
          className="text-[9px] tracking-widest uppercase"
          style={{ color: 'var(--d-ink-3)', fontFamily: 'var(--d-font-title)', writingMode: 'vertical-rl' }}
        >
          {d.toLocaleDateString('zh-CN', { month: 'long' })}
        </span>
        <span
          className="text-5xl leading-none mt-4"
          style={{ color: 'var(--d-ink)', fontWeight: 200, fontFamily: 'var(--d-font-title)' }}
        >
          {d.getDate().toString().padStart(2, '0')}
        </span>
        <span
          className="text-[10px] mt-1 tracking-widest uppercase"
          style={{ color: 'var(--d-ink-3)' }}
        >
          {weekdays[d.getDay()]}
        </span>
      </aside>

      <div className="flex-1 flex flex-col border-t" style={{ borderColor: 'var(--d-border)' }}>
        {children}
      </div>
    </div>
  );
}
