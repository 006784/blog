'use client';

import { useEffect, useRef, useState } from 'react';
import { DiaryTheme } from '@/lib/diary/themes';
import { MoodPicker, MOOD_LEVELS } from './MoodPicker';
import { WeatherPicker, WeatherData } from './WeatherPicker';
import { ThemeSwitcher } from './ThemeSwitcher';
import { DrawingCanvas } from './DrawingCanvas';
import { useDiaryAutoSave } from '@/hooks/useDiaryAutoSave';

const PLACEHOLDER: Record<DiaryTheme, string> = {
  kraft: '今天……',
  washi: '今日の記録…',
  literary: '谨以此文，记录今日所思……',
  minimal: '写点什么…',
};

interface DiaryData {
  id?: string;
  diary_date: string;
  title?: string;
  content: string;
  mood_score: number;
  mood_tags: string[];
  weather: WeatherData | null;
  location?: string;
}

interface Props {
  theme: DiaryTheme;
  onThemeChange: (t: DiaryTheme) => void;
  date: Date;
  initial?: Partial<DiaryData>;
  onSaved?: (d: DiaryData) => void;
}

export function DiaryEditor({ theme, onThemeChange, date, initial, onSaved }: Props) {
  const dateStr = date.toISOString().split('T')[0];
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [moodScore, setMoodScore] = useState(initial?.mood_score || 3);
  const [moodTags, setMoodTags] = useState<string[]>(initial?.mood_tags || []);
  const [weather, setWeather] = useState<WeatherData | null>(initial?.weather || null);
  const [location, setLocation] = useState(initial?.location || '');
  const [showDrawing, setShowDrawing] = useState(false);
  const [drawingUrl, setDrawingUrl] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }, [content]);

  const payload = {
    diary_date: dateStr,
    title,
    content,
    mood_score: moodScore,
    mood_tags: moodTags,
    mood: MOOD_LEVELS.find((m) => m.score === moodScore)?.label,
    weather: weather ? `${weather.icon}${weather.label}${weather.temp !== undefined ? ` ${weather.temp}°C` : ''}` : '',
    location,
    drawing_url: drawingUrl || undefined,
  };

  const { status, statusLabel, save } = useDiaryAutoSave(payload);

  const handleSaveDrawing = (dataUrl: string) => {
    setDrawingUrl(dataUrl);
    setShowDrawing(false);
    // In a full impl, upload to R2 via /api/diary/[date]/drawing
  };

  // Font by theme
  const bodyFont = theme === 'kraft'
    ? "'Caveat', cursive"
    : 'var(--d-font-body)';

  const bodyFontSize = theme === 'kraft' ? '18px' : '16px';

  return (
    <div className="flex flex-col h-full">
      {/* ── Metadata bar ──────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-4 px-6 py-3 border-b flex-none"
        style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg)' }}
      >
        {/* Date */}
        <span
          className="text-sm"
          style={{ fontFamily: 'var(--d-font-title)', color: 'var(--d-ink)', letterSpacing: '.05em' }}
        >
          {date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
        </span>

        <div className="w-px h-4" style={{ background: 'var(--d-border)' }} />

        <WeatherPicker weather={weather} onChange={setWeather} />

        <div className="w-px h-4" style={{ background: 'var(--d-border)' }} />

        <MoodPicker
          score={moodScore}
          tags={moodTags}
          onScoreChange={setMoodScore}
          onTagsChange={setMoodTags}
        />

        {/* Location */}
        <div className="flex items-center gap-1">
          <span style={{ color: 'var(--d-ink-3)', fontSize: 12 }}>📍</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="地点"
            className="bg-transparent outline-none text-xs w-20"
            style={{ color: 'var(--d-ink-2)', fontFamily: 'var(--d-font-body)', borderBottom: location ? '1px solid var(--d-border)' : 'none' }}
          />
        </div>

        <div className="flex-1" />

        {/* Drawing toggle */}
        <button
          onClick={() => setShowDrawing(!showDrawing)}
          className="text-xs transition-opacity hover:opacity-60"
          style={{ color: showDrawing ? 'var(--d-accent)' : 'var(--d-ink-3)', letterSpacing: '.1em' }}
        >
          ✏ 涂鸦
        </button>

        <ThemeSwitcher current={theme} onChange={onThemeChange} />
      </div>

      {/* ── Drawing canvas (conditional) ─────────────────── */}
      {showDrawing && (
        <div className="flex-none px-6 pt-4">
          <DrawingCanvas
            theme={theme}
            onSave={handleSaveDrawing}
            onClose={() => setShowDrawing(false)}
          />
        </div>
      )}

      {/* ── Writing area ─────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Title (optional) */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题（可选）"
          className="w-full bg-transparent outline-none mb-4"
          style={{
            fontFamily: 'var(--d-font-title)',
            fontSize: '1.2rem',
            color: 'var(--d-ink)',
            borderBottom: title ? '1px solid var(--d-border)' : 'none',
            paddingBottom: title ? 8 : 0,
          }}
        />

        {/* Content */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={PLACEHOLDER[theme]}
          className="w-full bg-transparent outline-none resize-none block"
          style={{
            fontFamily: bodyFont,
            fontSize: bodyFontSize,
            lineHeight: 2.1,
            color: 'var(--d-ink)',
            minHeight: 300,
          }}
        />

        {/* Saved drawing preview */}
        {drawingUrl && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={drawingUrl}
              alt="涂鸦"
              className="max-w-full border"
              style={{ borderColor: 'var(--d-border)', transform: `rotate(${theme === 'kraft' ? '-0.5deg' : '0deg'})` }}
            />
          </div>
        )}
      </div>

      {/* ── Status bar ───────────────────────────────────── */}
      <div
        className="flex-none flex items-center px-6 py-1.5 border-t gap-4"
        style={{ borderColor: 'var(--d-border)' }}
      >
        <span
          className="text-[11px] tracking-wider"
          style={{
            color: status === 'saving' ? 'var(--d-accent)' : status === 'error' ? '#c94040' : 'var(--d-ink-3)',
            letterSpacing: '.15em',
            fontFamily: 'var(--d-font-title)',
          }}
        >
          {statusLabel}
        </span>
        <div className="flex-1" />
        <span className="text-[11px]" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>
          {content.length} 字
        </span>
        <button
          onClick={save}
          className="text-[11px] border-b transition-opacity hover:opacity-60"
          style={{ color: 'var(--d-accent)', borderColor: 'var(--d-accent)', letterSpacing: '.1em' }}
        >
          保存
        </button>
      </div>
    </div>
  );
}
