'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, Check, AlertCircle, Sparkles, Shield } from 'lucide-react';
import { Turnstile } from './Turnstile';

interface SubscribeFormProps {
  variant?: 'inline' | 'card';
}

export function SubscribeForm({ variant = 'card' }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
    setError(null);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setError('验证加载失败，请刷新页面');
    setTurnstileToken(null);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null);
    setError('验证已过期，请重新验证');
  }, []);

  // 当获取到 token 且有待提交时，自动提交
  useEffect(() => {
    if (pendingSubmit && turnstileToken) {
      doSubmit();
    }
  }, [turnstileToken, pendingSubmit]);

  const doSubmit = async () => {
    setLoading(true);
    setError(null);
    setPendingSubmit(false);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(),
          turnstileToken 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '订阅失败');
      }

      setSuccess(true);
      setEmail('');
      setTurnstileToken(null);
      setShowTurnstile(false);
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('订阅失败:', err);
      setError(err.message || '订阅失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    
    // 如果配置了 Turnstile 且没有 token
    if (siteKey && !turnstileToken) {
      setShowTurnstile(true);
      setPendingSubmit(true);
      return;
    }

    // 已有 token 或未配置 Turnstile，直接提交
    await doSubmit();
  };

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="输入邮箱订阅..."
            required
            disabled={loading || success}
            className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-xl focus:outline-none focus:border-primary text-sm"
          />
        </div>
        <motion.button
          type="submit"
          disabled={loading || success}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <Check className="w-4 h-4" /> : '订阅'}
        </motion.button>
      </form>
    );
  }

  return (
    <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">订阅更新</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        订阅后，新文章发布时会第一时间通知你
      </p>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 p-4 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl"
          >
            <Check className="w-5 h-5" />
            <span className="text-sm font-medium">订阅成功！请查收确认邮件</span>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-500"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Turnstile 人机验证 - 点击订阅后才显示 */}
            <AnimatePresence>
              {showTurnstile && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-3 px-4 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Shield className="w-4 h-4" />
                      <span>请完成安全验证</span>
                    </div>
                    <Turnstile
                      onVerify={handleTurnstileVerify}
                      onError={handleTurnstileError}
                      onExpire={handleTurnstileExpire}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || (showTurnstile && !turnstileToken)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  订阅中...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  订阅博客
                </>
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
