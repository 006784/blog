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
      <body style={{ margin: 0, fontFamily: "'Noto Serif SC', serif", background: '#fff7f2', color: '#2d1e17' }}>
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
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>网站遇到了严重错误</h1>
          <p style={{ margin: 0, color: '#6b4c3b', maxWidth: '400px', lineHeight: 1.7 }}>
            应用遇到了一个意外错误，我们已收到通知并会尽快修复。请刷新重试。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              background: '#fdf0e7',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              textAlign: 'left',
              maxWidth: '600px',
              overflow: 'auto',
              color: '#b86443',
            }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: '8px',
              padding: '10px 24px',
              borderRadius: '9999px',
              border: 'none',
              background: '#e99a69',
              color: '#fff',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            刷新重试
          </button>
        </div>
      </body>
    </html>
  );
}
