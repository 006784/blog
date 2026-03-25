'use client';

import { useState } from 'react';
import { DiaryTheme, DIARY_THEMES, THEME_PREVIEW_BG } from '@/lib/diary/themes';

interface Props {
  current: DiaryTheme;
  onChange: (t: DiaryTheme) => void;
}

export function ThemeSwitcher({ current, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const themes = Object.keys(DIARY_THEMES) as DiaryTheme[];

  const handleChange = (t: DiaryTheme) => {
    onChange(t);
    setOpen(false);
    // Persist
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin-token') : null;
    if (token) {
      fetch('/api/diary/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ theme: t }),
      }).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('diary-theme', t);
    }
  };

  return (
    <div className="relative">
      {/* Trigger — small theme dot */}
      <button
        onClick={() => setOpen(!open)}
        title={DIARY_THEMES[current].name}
        style={{ background: THEME_PREVIEW_BG[current] }}
        className="w-5 h-5 border border-[var(--d-border)] transition-transform hover:scale-110"
        aria-label="切换主题"
      />

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-7 z-50 flex gap-2 p-3 border border-[var(--d-border)]"
            style={{ background: 'var(--d-bg)' }}
          >
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => handleChange(t)}
                className="flex flex-col items-center gap-1 group"
                title={DIARY_THEMES[t].desc}
              >
                {/* Color swatch */}
                <div
                  className="w-10 h-13 border transition-all"
                  style={{
                    background: THEME_PREVIEW_BG[t],
                    borderColor: current === t ? 'var(--d-accent)' : 'var(--d-border)',
                    height: '52px',
                  }}
                >
                  {/* Theme texture hint */}
                  {t === 'kraft' && (
                    <div className="w-full h-full opacity-20" style={{
                      backgroundImage: 'repeating-linear-gradient(transparent,transparent 7px,rgba(139,100,40,.5) 7px,rgba(139,100,40,.5) 8px)',
                    }} />
                  )}
                  {t === 'literary' && (
                    <div className="w-full h-full flex items-end justify-end p-1">
                      <div className="w-4 h-px bg-[#c4a96d] opacity-60" />
                    </div>
                  )}
                </div>
                {/* Theme name */}
                <span
                  className="text-[9px] tracking-widest transition-colors"
                  style={{
                    color: current === t ? 'var(--d-accent)' : 'var(--d-ink-3)',
                    letterSpacing: '.15em',
                    fontFamily: 'var(--d-font-title)',
                    borderBottom: current === t ? '1px solid var(--d-accent)' : '1px solid transparent',
                  }}
                >
                  {DIARY_THEMES[t].name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
