'use client';

import { useState } from 'react';

export const WEATHER_OPTIONS = [
  { key: 'sunny', icon: '☀️', label: '晴' },
  { key: 'cloudy', icon: '⛅', label: '多云' },
  { key: 'overcast', icon: '☁️', label: '阴' },
  { key: 'rainy', icon: '🌧', label: '雨' },
  { key: 'stormy', icon: '🌩', label: '雷' },
  { key: 'snowy', icon: '❄️', label: '雪' },
  { key: 'foggy', icon: '🌫', label: '雾' },
];

export interface WeatherData {
  key: string;
  icon: string;
  label: string;
  temp?: number;
}

interface Props {
  weather: WeatherData | null;
  onChange: (w: WeatherData | null) => void;
}

export function WeatherPicker({ weather, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [fetchingAuto, setFetchingAuto] = useState(false);

  const autoFetch = async () => {
    setFetchingAuto(true);
    try {
      const res = await fetch('https://wttr.in/?format=j1');
      const data = await res.json();
      const current = data?.current_condition?.[0];
      if (current) {
        const desc = (current.weatherDesc?.[0]?.value || '').toLowerCase();
        const matched = WEATHER_OPTIONS.find((w) =>
          desc.includes(w.label) || desc.includes(w.key)
        ) || WEATHER_OPTIONS[0];
        onChange({ ...matched, temp: parseInt(current.temp_C || '20') });
      }
    } catch {
      // ignore
    } finally {
      setFetchingAuto(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--d-ink-2)', fontFamily: 'var(--d-font-body)' }}
      >
        <span>{weather?.icon || '⛅'}</span>
        <span className="text-xs">{weather?.label || '天气'}</span>
        {weather?.temp !== undefined && (
          <span className="text-[10px]" style={{ color: 'var(--d-ink-3)' }}>{weather.temp}°</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-8 z-50 p-4 border"
            style={{ background: 'var(--d-bg)', borderColor: 'var(--d-border)', minWidth: 200 }}
          >
            <div className="flex flex-wrap gap-2 mb-3">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => { onChange({ ...w, temp: weather?.temp }); setOpen(false); }}
                  className="flex flex-col items-center gap-0.5 transition-transform hover:scale-110"
                  style={{ opacity: weather?.key === w.key ? 1 : 0.5 }}
                >
                  <span className="text-xl">{w.icon}</span>
                  <span className="text-[9px]" style={{ color: 'var(--d-ink-3)' }}>{w.label}</span>
                </button>
              ))}
            </div>

            {/* Temp input */}
            <div className="flex items-center gap-2 mb-3" style={{ borderBottom: '1px solid var(--d-border)' }}>
              <input
                type="number"
                value={weather?.temp ?? ''}
                onChange={(e) => onChange(weather ? { ...weather, temp: parseInt(e.target.value) || undefined } : null)}
                placeholder="温度"
                className="w-16 bg-transparent outline-none text-xs pb-1"
                style={{ color: 'var(--d-ink)' }}
              />
              <span className="text-xs" style={{ color: 'var(--d-ink-3)' }}>°C</span>
            </div>

            {/* Auto fetch */}
            <button
              onClick={autoFetch}
              disabled={fetchingAuto}
              className="text-[10px] transition-opacity hover:opacity-60 disabled:opacity-30"
              style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}
            >
              {fetchingAuto ? '获取中…' : '↺ 自动获取'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
