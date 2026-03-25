'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Diary } from '@/lib/supabase';
import { useAdmin } from '@/components/AdminProvider';
import { DiaryTheme, applyThemeVars } from '@/lib/diary/themes';
import { DiaryShell } from '@/components/diary/DiaryShell';
import { DiaryEditor } from '@/components/diary/DiaryEditor';
import { CalendarView } from '@/components/diary/CalendarView';
import { TimelineView } from '@/components/diary/TimelineView';
import { MoodReport } from '@/components/diary/MoodReport';
import { ExportModal } from '@/components/diary/ExportModal';

// ── Helpers ────────────────────────────────────────────────────
function getSavedTheme(): DiaryTheme {
  if (typeof window === 'undefined') return 'kraft';
  return (localStorage.getItem('diary-theme') as DiaryTheme) || 'kraft';
}

type View = 'calendar' | 'timeline' | 'editor' | 'report';
const VIEW_LABELS: Record<View, string> = {
  calendar: '日历',
  timeline: '时间轴',
  editor: '写作',
  report: '报告',
};

// ── Page ───────────────────────────────────────────────────────
export default function DiaryPage() {
  const { isAdmin, showLoginModal } = useAdmin();
  const shellRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<DiaryTheme>('kraft');
  const [view, setView] = useState<View>('calendar');

  // Data
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [calendarDots, setCalendarDots] = useState<Record<string, { mood?: string; hasContent: boolean; mood_score?: number }>>({});
  const [loading, setLoading] = useState(true);

  // Calendar nav
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);

  // Current diary being edited
  const [editingDiary, setEditingDiary] = useState<Diary | null>(null);

  // Export modal
  const [showExport, setShowExport] = useState(false);

  // ── Load theme from localStorage ────────────────────────────
  useEffect(() => {
    const saved = getSavedTheme();
    setTheme(saved);
  }, []);

  // ── Apply theme vars to shell ─────────────────────────────
  useEffect(() => {
    if (shellRef.current) applyThemeVars(theme, shellRef.current);
  }, [theme]);

  // ── Load diary data ───────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diary?year=${calYear}&month=${calMonth}&view=calendar`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setDiaries(Array.isArray(data.diaries) ? data.diaries : []);
      setCalendarDots(data.calendarDots || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [calYear, calMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Load all diaries for report / timeline ─────────────────
  const [allDiaries, setAllDiaries] = useState<Diary[]>([]);
  useEffect(() => {
    if (view !== 'report' && view !== 'timeline') return;
    fetch(`/api/diary?year=${calYear}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAllDiaries(Array.isArray(d.diaries) ? d.diaries : []))
      .catch(() => {});
  }, [view, calYear]);

  // ── Load diary for selected date ──────────────────────────
  const loadDiaryForDate = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/diary/${date}`, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.diary as Diary | null;
    } catch {
      return null;
    }
  }, []);

  const handleDateClick = async (date: string) => {
    setSelectedDate(date);
    const diary = await loadDiaryForDate(date);
    setEditingDiary(diary);
    setView('editor');
  };

  const handleOpenDiary = (diary: Diary) => {
    setSelectedDate(diary.diary_date);
    setEditingDiary(diary);
    setView('editor');
  };

  const handleThemeChange = (t: DiaryTheme) => {
    setTheme(t);
    if (shellRef.current) applyThemeVars(t, shellRef.current);
  };

  // ── Calendar prev/next ─────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  // ── Washi calendar sidebar ────────────────────────────────
  const washiSidebar = (
    <CalendarView
      year={calYear}
      month={calMonth}
      dots={calendarDots}
      selectedDate={selectedDate}
      onDateClick={handleDateClick}
      onPrev={prevMonth}
      onNext={nextMonth}
    />
  );

  // ── Non-admin gate ─────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div
        ref={shellRef}
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--d-bg)', fontFamily: 'var(--d-font-title)' }}
      >
        <div className="text-center p-8">
          <p className="text-2xl mb-2" style={{ color: 'var(--d-ink)' }}>日记本</p>
          <p className="text-sm mb-6" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>私密内容，请先登录</p>
          <button
            onClick={() => showLoginModal(() => window.location.reload())}
            className="px-6 py-2 border text-sm transition-colors hover:opacity-70"
            style={{ borderColor: 'var(--d-accent)', color: 'var(--d-accent)' }}
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  const selectedDateObj = selectedDate ? new Date(selectedDate) : today;
  const epigraph = editingDiary?.content?.replace(/\s+/g, ' ').slice(-40) || '此刻，时光静止。';

  return (
    <div ref={shellRef} className="min-h-screen" style={{ fontFamily: 'var(--d-font-body)' }}>
      <DiaryShell
        theme={theme}
        date={selectedDateObj}
        pageNumber={diaries.findIndex((d) => d.diary_date === selectedDate) + 1 || 1}
        leftSlot={theme === 'washi' ? washiSidebar : undefined}
        epigraph={theme === 'literary' ? epigraph : undefined}
      >
        {/* ── Top nav ───────────────────────────────────────── */}
        <nav
          className="flex items-center gap-0 border-b px-6 py-0 flex-none"
          style={{ borderColor: 'var(--d-border)', height: 40 }}
        >
          {/* Logo */}
          <span
            className="text-sm mr-6"
            style={{ fontFamily: 'var(--d-font-title)', color: 'var(--d-ink)', letterSpacing: '.2em' }}
          >
            日記
          </span>

          {/* View tabs */}
          {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 h-full text-xs relative transition-colors"
              style={{
                color: view === v ? 'var(--d-ink)' : 'var(--d-ink-3)',
                fontFamily: 'var(--d-font-title)',
                letterSpacing: '.15em',
                borderBottom: view === v ? '1px solid var(--d-accent)' : '1px solid transparent',
              }}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}

          <div className="flex-1" />

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="text-[10px] transition-opacity hover:opacity-60"
            style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}
          >
            导出
          </button>

          {/* Year nav */}
          <div className="flex items-center gap-1 ml-4">
            <button onClick={() => setCalYear((y) => y - 1)} className="text-sm" style={{ color: 'var(--d-ink-3)' }}>‹</button>
            <span className="text-xs" style={{ color: 'var(--d-ink-2)', fontFamily: 'var(--d-font-title)' }}>{calYear}</span>
            <button onClick={() => setCalYear((y) => y + 1)} className="text-sm" style={{ color: 'var(--d-ink-3)' }}>›</button>
          </div>
        </nav>

        {/* ── Main content ──────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: 'calc(100vh - 80px)' }}>

          {/* Left calendar column (non-washi themes) */}
          {theme !== 'washi' && (
            <aside
              className="hidden md:flex flex-col flex-none border-r"
              style={{ width: 220, borderColor: 'var(--d-border)', background: 'var(--d-bg-warm)' }}
            >
              <div className="p-4">
                <CalendarView
                  year={calYear}
                  month={calMonth}
                  dots={calendarDots}
                  selectedDate={selectedDate}
                  onDateClick={handleDateClick}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
              </div>
            </aside>
          )}

          {/* Main view */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-48"
                >
                  <span
                    className="text-xs tracking-widest"
                    style={{ color: 'var(--d-ink-3)', fontFamily: 'var(--d-font-title)', animation: 'pulse 1.5s infinite' }}
                  >
                    · · ·
                  </span>
                </motion.div>
              )}

              {!loading && view === 'calendar' && (
                <motion.div
                  key="calendar-main"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="md:hidden p-4"
                >
                  {/* Mobile-only calendar (desktop shows in sidebar) */}
                  <CalendarView
                    year={calYear}
                    month={calMonth}
                    dots={calendarDots}
                    selectedDate={selectedDate}
                    onDateClick={handleDateClick}
                    onPrev={prevMonth}
                    onNext={nextMonth}
                  />
                  <div className="mt-6 px-2">
                    <button
                      onClick={() => handleDateClick(today.toISOString().split('T')[0])}
                      className="w-full py-3 border text-sm transition-colors hover:border-[var(--d-accent)]"
                      style={{ borderColor: 'var(--d-border)', color: 'var(--d-ink-2)', fontFamily: 'var(--d-font-title)', letterSpacing: '.1em' }}
                    >
                      + 今日日记
                    </button>
                  </div>
                </motion.div>
              )}

              {!loading && view === 'calendar' && (
                <motion.div
                  key="calendar-desktop"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="hidden md:flex flex-col items-center justify-center h-64 gap-4"
                >
                  <span
                    className="text-sm tracking-widest"
                    style={{ color: 'var(--d-ink-3)', fontFamily: 'var(--d-font-title)' }}
                  >
                    点击左侧日历选择日期
                  </span>
                  <button
                    onClick={() => handleDateClick(today.toISOString().split('T')[0])}
                    className="px-6 py-2 border text-sm transition-colors hover:border-[var(--d-accent)]"
                    style={{ borderColor: 'var(--d-border)', color: 'var(--d-accent)', fontFamily: 'var(--d-font-title)', letterSpacing: '.1em' }}
                  >
                    + 今日日记
                  </button>
                </motion.div>
              )}

              {!loading && view === 'timeline' && (
                <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <TimelineView diaries={allDiaries.length ? allDiaries : diaries} onOpen={handleOpenDiary} />
                </motion.div>
              )}

              {!loading && view === 'editor' && (
                <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <DiaryEditor
                    theme={theme}
                    onThemeChange={handleThemeChange}
                    date={selectedDateObj}
                    initial={editingDiary ? {
                      id: editingDiary.id,
                      diary_date: editingDiary.diary_date,
                      title: editingDiary.title,
                      content: editingDiary.content,
                      mood_score: undefined,
                      mood_tags: editingDiary.tags || [],
                      weather: null,
                      location: editingDiary.location,
                    } : undefined}
                    onSaved={() => loadData()}
                  />
                </motion.div>
              )}

              {!loading && view === 'report' && (
                <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <MoodReport
                    diaries={allDiaries.length ? allDiaries : diaries}
                    year={calYear}
                    month={calMonth}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden diary-bottom-nav fixed bottom-0 left-0 right-0 border-t flex"
          style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg)', height: 52, zIndex: 40 }}
        >
          {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="diary-nav-tab flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              style={{ color: view === v ? 'var(--d-ink)' : 'var(--d-ink-3)' }}
            >
              {view === v && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6" style={{ height: 1, background: 'var(--d-accent)' }} />
              )}
              <span className="text-[9px] tracking-widest uppercase" style={{ fontFamily: 'var(--d-font-title)' }}>
                {VIEW_LABELS[v]}
              </span>
            </button>
          ))}
        </nav>
      </DiaryShell>

      {/* Export modal */}
      <AnimatePresence>
        {showExport && (
          <motion.div key="export" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExportModal diaries={allDiaries.length ? allDiaries : diaries} onClose={() => setShowExport(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
