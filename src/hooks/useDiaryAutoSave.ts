import { useCallback, useEffect, useRef, useState } from 'react';
import { type Diary } from '@/lib/supabase';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DiaryPayload {
  id?: string;
  diary_date: string;
  title?: string;
  content: string;
  mood?: string;
  weather?: string;
  location?: string;
  mood_score?: number;
  mood_tags?: string[];
  [key: string]: unknown;
}

interface UseDiaryAutoSaveOptions {
  debounceMs?: number;
  onSaved?: (diary: Diary) => void;
}

export function useDiaryAutoSave(
  payload: DiaryPayload | null,
  { debounceMs = 3000, onSaved }: UseDiaryAutoSaveOptions = {}
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const payloadRef = useRef(payload);
  const onSavedRef = useRef(onSaved);
  const currentDiaryIdRef = useRef<string | null>(payload?.id ?? null);

  payloadRef.current = payload;
  onSavedRef.current = onSaved;

  useEffect(() => {
    const nextId = payload?.id ?? null;
    currentDiaryIdRef.current = nextId;
  }, [payload?.id, payload?.diary_date]);

  const save = useCallback(async () => {
    const p = payloadRef.current;
    if (!p || (!p.content?.trim() && !p.title?.trim())) return;

    setStatus('saving');
    try {
      const res = await fetch(`/api/diary/${p.diary_date}/`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...p,
          id: currentDiaryIdRef.current ?? p.id,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.diary) throw new Error(result?.error || 'save failed');

      const savedDiary = result.diary as Diary;
      currentDiaryIdRef.current = savedDiary.id;
      setStatus('saved');
      setLastSaved(new Date());
      onSavedRef.current?.(savedDiary);
      return savedDiary;
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!payload) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, debounceMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload), debounceMs]);

  // Ctrl/Cmd+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const statusLabel = (() => {
    if (status === 'saving') return '保存中 ·';
    if (status === 'saved' && lastSaved) {
      const diffSec = Math.round((Date.now() - lastSaved.getTime()) / 1000);
      return diffSec < 10 ? '已保存 · 刚刚' : `已保存 · ${lastSaved.toLocaleTimeString()}`;
    }
    if (status === 'error') return '保存失败 · 重试↺';
    return '';
  })();

  return { status, lastSaved, save, statusLabel };
}
