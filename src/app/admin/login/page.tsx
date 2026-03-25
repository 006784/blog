'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, EyeOff, Smartphone, AlertCircle, Loader2 } from 'lucide-react';

type Step = 'password' | 'totp';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // 倒计时
  useEffect(() => {
    if (retryAfter <= 0) return;
    const t = setInterval(() => setRetryAfter((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [retryAfter]);

  // ── 密码提交 ──────────────────────────────────────────────────────────────
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (retryAfter > 0) return;
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
        if (res.status === 429) {
          const retry = parseInt(res.headers.get('Retry-After') || '60', 10);
          setRetryAfter(retry);
          setError(data.error || '尝试次数过多');
        } else {
          setError(data.error || '密码错误');
        }
        return;
      }

      if (data.data?.requires_totp) {
        setStep('totp');
        setPassword('');
      } else {
        router.replace(redirect);
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  // ── TOTP 提交 ─────────────────────────────────────────────────────────────
  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '验证码错误');
        setTotpCode('');
        return;
      }

      router.replace(redirect);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* 图标 */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
            {step === 'password' ? (
              <Shield className="w-10 h-10 text-white" />
            ) : (
              <Smartphone className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-1">
          {step === 'password' ? '管理员登录' : '双因素验证'}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {step === 'password'
            ? '请输入管理员密码'
            : '请输入 Authenticator 中的 6 位验证码'}
        </p>

        {/* 密码表单 */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="输入密码"
                autoComplete="current-password"
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
                {retryAfter > 0 && <span className="ml-auto font-mono">{retryAfter}s</span>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || retryAfter > 0 || !password}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {retryAfter > 0 ? `请等待 ${retryAfter}s` : '登录'}
            </button>
          </form>
        )}

        {/* TOTP 表单 */}
        {step === 'totp' && (
          <form onSubmit={handleTotpSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTotpCode(v);
                setError('');
              }}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              autoFocus
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              验证
            </button>

            <button
              type="button"
              onClick={() => { setStep('password'); setTotpCode(''); setError(''); }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              返回密码登录
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
