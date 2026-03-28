'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startAuthentication,
} from '@simplewebauthn/browser';
import {
  AlertCircle,
  ArrowLeft,
  Fingerprint,
  KeyRound,
  Loader2,
  Mail,
  Shield,
} from 'lucide-react';

type Step = 'email' | 'code';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [supportsPasskey, setSupportsPasskey] = useState(false);
  const [platformPasskeyAvailable, setPlatformPasskeyAvailable] = useState(false);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => setRetryAfter((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  useEffect(() => {
    const supported = browserSupportsWebAuthn();
    setSupportsPasskey(supported);
    if (supported) {
      platformAuthenticatorIsAvailable()
        .then(setPlatformPasskeyAvailable)
        .catch(() => setPlatformPasskeyAvailable(false));
    }
  }, []);

  async function requestCode() {
    if (retryAfter > 0) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/email/request/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retry = parseInt(res.headers.get('Retry-After') || '60', 10);
          setRetryAfter(retry);
        }
        setError(data.error || '验证码发送失败');
        return;
      }

      setMaskedEmail(data.data?.email || email);
      setStep('code');
      setCode('');
      setRetryAfter(60);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return;
    await requestCode();
  }

  async function handleCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/email/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retry = parseInt(res.headers.get('Retry-After') || '60', 10);
          setRetryAfter(retry);
        }
        setError(data.error || '验证码错误');
        setCode('');
        return;
      }

      router.replace(redirect);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskeyLogin() {
    setPasskeyLoading(true);
    setError('');

    try {
      const optionsRes = await fetch('/api/auth/passkey/authenticate/options/', {
        method: 'POST',
        credentials: 'include',
      });
      const optionsData = await optionsRes.json().catch(() => null);
      if (!optionsRes.ok) {
        throw new Error(optionsData?.error || '暂时无法使用通行密钥登录');
      }

      const response = await startAuthentication({
        optionsJSON: optionsData.data.options,
      });

      const verifyRes = await fetch('/api/auth/passkey/authenticate/verify/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const verifyData = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok) {
        throw new Error(verifyData?.error || '通行密钥登录失败');
      }

      router.replace(redirect);
    } catch (error) {
      setError(error instanceof Error ? error.message : '通行密钥登录失败');
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
            {step === 'email' ? (
              <Mail className="w-10 h-10 text-white" />
            ) : (
              <KeyRound className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            免密邮箱登录
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {step === 'email' ? '管理员登录' : '输入邮箱验证码'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 'email'
              ? '输入管理员邮箱，我们会发送一封登录验证码邮件'
              : `验证码已发送到 ${maskedEmail || email}`}
          </p>
        </div>

        {supportsPasskey && step === 'email' ? (
          <div className="mb-5 space-y-3">
            <button
              type="button"
              onClick={() => void handlePasskeyLogin()}
              disabled={passkeyLoading}
              className="w-full py-4 rounded-2xl border border-border bg-background/80 text-foreground font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
              使用通行密钥
            </button>
            <p className="text-center text-xs text-muted-foreground">
              {platformPasskeyAvailable ? '当前设备支持指纹 / Face ID / 系统解锁' : '浏览器支持通行密钥，可尝试用系统解锁登录'}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>或者使用邮箱验证码</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
        ) : null}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                placeholder="输入管理员邮箱"
                autoComplete="email"
                autoFocus
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
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
              disabled={loading || passkeyLoading || retryAfter > 0 || !email}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {retryAfter > 0 ? `请等待 ${retryAfter}s` : '发送验证码'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              placeholder="000000"
              autoFocus
              className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 rounded-2xl bg-secondary/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
                {retryAfter > 0 && <span className="ml-auto font-mono">{retryAfter}s</span>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passkeyLoading || code.length !== 6}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              登录后台
            </button>

            <button
              type="button"
              onClick={() => void requestCode()}
              disabled={loading || retryAfter > 0}
              className="w-full py-3 rounded-2xl border border-border bg-background/70 text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {retryAfter > 0 ? `${retryAfter}s 后可重新发送` : '重新发送验证码'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回修改邮箱
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
