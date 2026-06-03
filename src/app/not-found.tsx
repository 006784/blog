import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatePanel } from '@/components/ui/StatePanel';

export const metadata = {
  title: '页面不存在 - Lumen',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-xl">
        <StatePanel
          tone="empty"
          icon={<Compass className="h-6 w-6" />}
          title="404 · 这里什么都没有"
          description="你访问的页面可能已经移走或从未存在。沿着下面的路标，回到有光的地方。"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button>返回首页</Button>
              </Link>
              <Link href="/blog">
                <Button variant="secondary">去看文章</Button>
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
