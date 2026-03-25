"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0a0a0a', color: '#e5e5e5' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>⚠️</p>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>页面出错了</h1>
          <p style={{ margin: 0, color: '#a1a1aa', maxWidth: '400px', lineHeight: 1.6 }}>
            应用遇到了一个意外错误，我们已收到通知并会尽快修复。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              background: '#18181b',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              textAlign: 'left',
              maxWidth: '600px',
              overflow: 'auto',
              color: '#f87171',
            }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: '8px',
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#14b8a6',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
