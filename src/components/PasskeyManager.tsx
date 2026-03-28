'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Fingerprint,
  Laptop,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
  startRegistration,
} from '@simplewebauthn/browser';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatePanel } from '@/components/ui/StatePanel';

type PasskeyRecord = {
  id: string;
  name: string;
  deviceType?: 'singleDevice' | 'multiDevice';
  backedUp?: boolean;
  createdAt: string;
  lastUsedAt?: string;
};

function formatDateTime(value?: string): string {
  if (!value) return '暂未使用';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '暂未使用';
  return date.toLocaleString('zh-CN');
}

function getDefaultPasskeyName(): string {
  if (typeof navigator === 'undefined') return '当前设备通行密钥';
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) return 'Mac 通行密钥';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'Apple 设备通行密钥';
  if (ua.includes('Windows')) return 'Windows 通行密钥';
  return '当前设备通行密钥';
}

export function PasskeyManager() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const statusText = useMemo(() => {
    if (!supported) return '当前浏览器还不支持通行密钥';
    if (platformAvailable) return '当前设备支持平台通行密钥，可直接用指纹或系统解锁';
    return '浏览器支持通行密钥，但当前设备未确认支持本机指纹解锁';
  }, [platformAvailable, supported]);

  async function loadPasskeys() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/passkey/credentials/', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || '读取通行密钥失败');
      }
      setPasskeys(Array.isArray(data?.data?.passkeys) ? data.data.passkeys : []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '读取通行密钥失败',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const webauthnSupported = browserSupportsWebAuthn();
    setSupported(webauthnSupported);

    if (webauthnSupported) {
      platformAuthenticatorIsAvailable()
        .then(setPlatformAvailable)
        .catch(() => setPlatformAvailable(false));
    }

    void loadPasskeys();
  }, []);

  async function handleCreatePasskey() {
    setBusy(true);
    setMessage(null);

    try {
      const optionsRes = await fetch('/api/auth/passkey/register/options/', {
        method: 'POST',
        credentials: 'include',
      });
      const optionsData = await optionsRes.json().catch(() => null);
      if (!optionsRes.ok) {
        throw new Error(optionsData?.error || '无法开始通行密钥注册');
      }

      const response = await startRegistration({
        optionsJSON: optionsData.data.options,
      });

      const verifyRes = await fetch('/api/auth/passkey/register/verify/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response,
          name: getDefaultPasskeyName(),
        }),
      });
      const verifyData = await verifyRes.json().catch(() => null);
      if (!verifyRes.ok) {
        throw new Error(verifyData?.error || '通行密钥注册失败');
      }

      setMessage({ type: 'success', text: '通行密钥已添加，下次可以直接用指纹登录' });
      await loadPasskeys();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '通行密钥添加失败',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePasskey(id: string) {
    setBusy(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/auth/passkey/credentials/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || '删除通行密钥失败');
      }
      setPasskeys((current) => current.filter((passkey) => passkey.id !== id));
      setMessage({ type: 'success', text: '通行密钥已删除' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '删除通行密钥失败',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="elevated" padding="lg" className="border border-[color:var(--border-default)]">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge tone="info" variant="soft" className="gap-1.5">
              <Fingerprint className="h-3.5 w-3.5" />
              通行密钥
            </Badge>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-neutral-900)]">用指纹直接登录后台</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-neutral-600)]">
                先绑定一次通行密钥，后面在 Mac 上就可以直接用 Touch ID 登录，不用每次收验证码。
              </p>
            </div>
          </div>

          <Button
            onClick={() => void handleCreatePasskey()}
            disabled={!supported || busy}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            添加通行密钥
          </Button>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3">
          <p className="text-sm text-[var(--color-neutral-700)]">{statusText}</p>
        </div>

        {message ? (
          <div className="rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3">
            <div className="mb-2">
              <Badge tone={message.type === 'success' ? 'success' : 'error'}>
                {message.type === 'success' ? '成功' : '出错了'}
              </Badge>
            </div>
            <p className="text-sm text-[var(--color-neutral-700)]">{message.text}</p>
          </div>
        ) : null}

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在读取通行密钥"
            description="稍等一下，我们正在检查当前已绑定的设备。"
            icon={<Loader2 className="h-6 w-6 animate-spin" />}
          />
        ) : passkeys.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有绑定通行密钥"
            description="绑定后就能在管理员登录页直接点“使用通行密钥”，用 Mac 指纹或系统解锁登录。"
            icon={<Laptop className="h-6 w-6" />}
          />
        ) : (
          <div className="space-y-3">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[color:var(--border-default)] bg-[var(--surface-base)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[var(--color-neutral-900)]">{passkey.name}</p>
                    {passkey.deviceType ? (
                      <Badge tone="default" variant="outline">
                        {passkey.deviceType === 'multiDevice' ? '可同步' : '本机设备'}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--color-neutral-600)]">
                    添加时间：{formatDateTime(passkey.createdAt)}
                  </p>
                  <p className="text-sm text-[var(--color-neutral-600)]">
                    最近使用：{formatDateTime(passkey.lastUsedAt)}
                  </p>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => void handleDeletePasskey(passkey.id)}
                  disabled={busy}
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}

        {!supported ? (
          <div className="flex items-start gap-2 rounded-[var(--radius-xl)] border border-[color:var(--color-error)]/20 bg-[var(--color-error)]/5 px-4 py-3 text-sm text-[var(--color-error)]">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>如果你想在 Mac 上用指纹登录，请使用 Safari 或最新版 Chrome 打开后台。</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
