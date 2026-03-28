'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X } from 'lucide-react';

const STORAGE_KEY = 'lumen_reading_positions';
const SAVE_THROTTLE_MS = 5000;
const SHOW_TOAST_THRESHOLD = 10;  // 大于 10% 时才提示
const CLEAR_THRESHOLD = 95;        // 大于 95% 时清除记录

interface ReadingPosition {
  scrollY: number;
  percentage: number;
  savedAt: number;
}

function getSavedPosition(slug: string): ReadingPosition | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const positions = getPositions();
  return positions[slug] || null;
}

function getPositions(): Record<string, ReadingPosition> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePosition(slug: string, scrollY: number, percentage: number) {
  const positions = getPositions();
  positions[slug] = { scrollY, percentage, savedAt: Date.now() };
  // 只保留最近 30 篇
  const entries = Object.entries(positions).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, 30);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

function clearPosition(slug: string) {
  const positions = getPositions();
  delete positions[slug];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

interface PostReadingMemoryProps {
  slug: string;
}

export function PostReadingMemory({ slug }: PostReadingMemoryProps) {
  const [savedPosition, setSavedPosition] = useState<ReadingPosition | null>(() => getSavedPosition(slug));
  const [showToast, setShowToast] = useState(() => {
    const saved = getSavedPosition(slug);
    return Boolean(saved && saved.percentage > SHOW_TOAST_THRESHOLD);
  });
  const lastSaveRef = useRef<number>(0);
  const toastDismissed = useRef(false);

  // 初始化：读取保存的位置
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = getSavedPosition(slug);
      setSavedPosition(saved);
      setShowToast(Boolean(saved && saved.percentage > SHOW_TOAST_THRESHOLD && !toastDismissed.current));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [slug]);

  useEffect(() => {
    if (!showToast) return;

    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // 滚动监听：节流保存位置
  useEffect(() => {
    const onScroll = () => {
      const now = Date.now();
      if (now - lastSaveRef.current < SAVE_THROTTLE_MS) return;
      lastSaveRef.current = now;

      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = docHeight > 0 ? Math.round((scrollY / docHeight) * 100) : 0;

      if (percentage >= CLEAR_THRESHOLD) {
        clearPosition(slug);
        return;
      }
      if (percentage > 2) {
        savePosition(slug, scrollY, percentage);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  // 继续阅读：滚动到保存位置
  function continueReading() {
    if (!savedPosition) return;
    window.scrollTo({ top: savedPosition.scrollY, behavior: 'smooth' });
    toastDismissed.current = true;
    setShowToast(false);
  }

  function dismiss() {
    toastDismissed.current = true;
    setShowToast(false);
  }

  return (
    <AnimatePresence>
      {showToast && savedPosition && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm text-zinc-300">
              上次读到 <span className="font-semibold text-white">{savedPosition.percentage}%</span>
            </span>
            <button
              onClick={continueReading}
              className="rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15 transition-colors"
            >
              继续阅读
            </button>
            <button
              onClick={dismiss}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
