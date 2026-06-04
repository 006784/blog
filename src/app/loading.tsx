import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6">
      <Loader2 className="h-6 w-6 animate-spin text-gold" />
      <p className="text-sm text-ink-muted">正在加载…</p>
    </div>
  );
}
