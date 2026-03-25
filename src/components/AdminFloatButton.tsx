'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Unlock, Eye, EyeOff, Loader2,
  LayoutDashboard, PenLine, Settings, X,
} from 'lucide-react';
import { useAdmin } from './AdminProvider';

export default function AdminFloatButton() {
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // 打开时聚焦输入框
  useEffect(() => {
    if (open && !isAdmin) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, isAdmin]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '密码错误');
        setPassword('');
        return;
      }
      setOpen(false);
      setPassword('');
      router.push('/admin');
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  const adminLinks = [
    { href: '/admin',       icon: LayoutDashboard, label: '控制台' },
    { href: '/write',       icon: PenLine,          label: '写文章' },
    { href: '/admin/media', icon: Settings,          label: '书影音' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mb-1 w-56 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl shadow-black/10 overflow-hidden"
          >
            {isAdmin ? (
              /* ── 已登录：快捷菜单 ── */
              <div className="py-1.5">
                <p className="px-4 py-2 text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                  管理员
                </p>
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
            ) : (
              /* ── 未登录：密码表单 ── */
              <form onSubmit={handleLogin} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">管理员登录</p>
                  <button type="button" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="输入密码"
                    autoComplete="current-password"
                    className="w-full pr-9 pl-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  >
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-1.5 transition-opacity hover:opacity-85"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  登录
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 触发按钮 */}
      <motion.button
        onClick={() => setOpen(v => !v)}
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
