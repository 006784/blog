'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatePanel } from '@/components/ui/StatePanel';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 上报到控制台（Sentry 会自动捕获未处理异常）
    console.error('页面渲染出错:', error);
  }, [error]);

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-xl">
        <StatePanel
          tone="error"
          icon={<FileWarning className="h-6 w-6" />}
          title="页面出了点问题"
          description="抱歉，这个页面遇到了意外错误。你可以重试，或返回首页继续浏览。"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                重试
              </Button>
              <Link href="/">
                <Button variant="secondary">返回首页</Button>
              </Link>
            </div>
          }
        />
        {error.digest && (
          <p className="mt-4 text-center text-xs text-ink-ghost">错误编号：{error.digest}</p>
        )}
      </div>
    </div>
  );
}
