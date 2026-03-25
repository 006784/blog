'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock,
  LayoutDashboard, PenLine, Settings, X,
} from 'lucide-react';
import { useAdmin } from './AdminProvider';

export default function AdminFloatButton() {
  const { isAdmin, showLoginModal } = useAdmin();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open || !isAdmin) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, isAdmin]);

  const adminLinks = [
    { href: '/admin',       icon: LayoutDashboard, label: '控制台' },
    { href: '/write',       icon: PenLine,          label: '写文章' },
    { href: '/admin/media', icon: Settings,          label: '书影音' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && isAdmin && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mb-1 w-56 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-black/10 overflow-hidden"
          >
            <div className="py-1.5">
              <div className="flex items-center justify-between px-4 py-2">
                <p className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  管理员
                </p>
                <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {adminLinks.map(({ href, icon: Icon, label }) => (
                <button
                  key={href}
                  onClick={() => { setOpen(false); router.push(href); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Icon className="w-4 h-4 text-zinc-400" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 触发按钮 */}
      <motion.button
        onClick={() => {
          if (!isAdmin) {
            showLoginModal();
            return;
          }
          setOpen(v => !v);
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-black/15 transition-colors"
        style={{
          background: isAdmin
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #71717a, #52525b)',
        }}
        aria-label="管理员入口"
      >
        {isAdmin
          ? <Unlock className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          : <Lock className="w-4 h-4 text-white" strokeWidth={2} />
        }
      </motion.button>
    </div>
  );
}
