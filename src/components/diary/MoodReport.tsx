'use client';

import { useMemo } from 'react';
import { Diary } from '@/lib/supabase';
import { MOOD_LEVELS } from './MoodPicker';

interface Props {
  diaries: Diary[];
  year: number;
  month?: number;
}

const MOOD_SCORE_MAP: Record<string, number> = {
  '难过': 1, '平静': 2, '还好': 3, '开心': 4, '很棒': 5,
};

function getMoodScore(diary: Diary): number {
  if (diary.mood && MOOD_SCORE_MAP[diary.mood]) return MOOD_SCORE_MAP[diary.mood];
  return 3;
}

export function MoodReport({ diaries, year, month }: Props) {
  const stats = useMemo(() => {
    if (!diaries.length) return null;

    const scores = diaries.map(getMoodScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const total = diaries.length;
    const totalWords = diaries.reduce((a, d) => a + (d.word_count || 0), 0);

    // Streak
    const sortedDates = [...diaries].sort((a, b) => a.diary_date.localeCompare(b.diary_date));
    let maxStreak = 1, curStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1].diary_date);
      const curr = new Date(sortedDates[i].diary_date);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
      else curStreak = 1;
    }

    // Distribution
    const dist = [1, 2, 3, 4, 5].map((s) => ({ score: s, count: scores.filter((x) => x === s).length }));

    // Best day
    const best = diaries.reduce((a, b) => getMoodScore(a) >= getMoodScore(b) ? a : b);

    // Tag freq
    const tagMap: Record<string, number> = {};
    diaries.forEach((d) => {
      const tags = Array.isArray(d.tags) ? d.tags : [];
      tags.forEach((t) => { tagMap[t] = (tagMap[t] || 0) + 1; });
    });
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // 30-day trend (last 30 or this month)
    const trendDiaries = [...diaries].sort((a, b) => a.diary_date.localeCompare(b.diary_date)).slice(-30);

    return { avg, total, totalWords, maxStreak, dist, best, topTags, trendDiaries };
  }, [diaries]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-sm" style={{ color: 'var(--d-ink-3)', fontFamily: 'var(--d-font-title)', letterSpacing: '.15em' }}>
          暂无数据
        </span>
      </div>
    );
  }

  const maxDist = Math.max(...stats.dist.map((d) => d.count), 1);
  const trendMax = Math.max(...stats.trendDiaries.map(getMoodScore), 5);

  return (
    <div className="px-6 py-6 space-y-8" style={{ fontFamily: 'var(--d-font-title)' }}>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ border: '1px solid var(--d-border)' }}>
        {[
          { label: '篇数', value: stats.total },
          { label: '总字数', value: stats.totalWords.toLocaleString() },
          { label: '连续天', value: stats.maxStreak },
          { label: '平均心情', value: stats.avg.toFixed(1) },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center justify-center py-5" style={{ background: 'var(--d-bg)' }}>
            <span className="text-2xl font-light" style={{ color: 'var(--d-ink)' }}>{s.value}</span>
            <span className="text-[10px] mt-1 tracking-widest uppercase" style={{ color: 'var(--d-ink-3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Trend line (SVG) */}
      <section>
        <p className="text-[9px] uppercase tracking-widest mb-4" style={{ color: 'var(--d-ink-3)' }}>情绪趋势</p>
        <div className="w-full overflow-x-auto">
          <svg width="100%" height="80" viewBox={`0 0 ${stats.trendDiaries.length * 20} 80`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((s) => (
              <line
                key={s}
                x1={0} y1={80 - ((s / trendMax) * 70)} x2={stats.trendDiaries.length * 20} y2={80 - ((s / trendMax) * 70)}
                stroke="var(--d-line)" strokeWidth="1"
              />
            ))}
            {/* Path */}
            <polyline
              points={stats.trendDiaries.map((d, i) => `${i * 20 + 10},${80 - ((getMoodScore(d) / trendMax) * 70)}`).join(' ')}
              fill="none"
              stroke="var(--d-accent)"
              strokeWidth="1.5"
            />
            {/* Data points */}
            {stats.trendDiaries.map((d, i) => (
              <rect
                key={i}
                x={i * 20 + 7} y={80 - ((getMoodScore(d) / trendMax) * 70) - 3}
                width={6} height={6}
                fill="var(--d-accent)"
              />
            ))}
          </svg>
        </div>
      </section>

      {/* Distribution */}
      <section>
        <p className="text-[9px] uppercase tracking-widest mb-4" style={{ color: 'var(--d-ink-3)' }}>心情分布</p>
        <div className="space-y-2">
          {stats.dist.map(({ score, count }) => {
            const level = MOOD_LEVELS.find((m) => m.score === score);
            return (
              <div key={score} className="flex items-center gap-3">
                <span className="text-base w-6">{level?.emoji}</span>
                <div className="flex-1 h-4 overflow-hidden" style={{ background: 'var(--d-line)' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(count / maxDist) * 100}%`,
                      background: 'var(--d-accent)',
                      opacity: 0.5 + (score / 10),
                    }}
                  />
                </div>
                <span className="text-xs w-6 text-right" style={{ color: 'var(--d-ink-3)' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top tags */}
      {stats.topTags.length > 0 && (
        <section>
          <p className="text-[9px] uppercase tracking-widest mb-4" style={{ color: 'var(--d-ink-3)' }}>高频标签</p>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 border text-[10px]"
                style={{ borderColor: 'var(--d-border)', color: 'var(--d-ink-2)' }}
              >
                {tag}
                <span style={{ color: 'var(--d-ink-3)' }}>×{count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Best day */}
      <section>
        <p className="text-[9px] uppercase tracking-widest mb-3" style={{ color: 'var(--d-ink-3)' }}>最佳一天</p>
        <div className="p-4 border" style={{ borderColor: 'var(--d-accent)', background: 'var(--d-bg-warm)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--d-accent)', fontFamily: 'var(--d-font-title)' }}>
            {stats.best.diary_date}
          </p>
          {stats.best.title && (
            <p className="text-sm mt-1" style={{ color: 'var(--d-ink)' }}>{stats.best.title}</p>
          )}
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--d-ink-2)' }}>
            {stats.best.content.replace(/\s+/g, ' ').slice(0, 60)}…
          </p>
        </div>
      </section>
    </div>
  );
}
